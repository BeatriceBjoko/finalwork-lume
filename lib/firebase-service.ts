import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword, EmailAuthProvider, reauthenticateWithCredential, signInWithEmailAndPassword, signOut, updateProfile, User } from "firebase/auth";
import { collection, doc, onSnapshot, query, setDoc, updateDoc, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import i18n, { currentAppLanguage } from "../locales/i18n";
import { auth, db, functions, storage } from "./firebase-config";

export interface FirebaseUserResponse {
	user: User;
}

export async function login(email: string, password: string): Promise<FirebaseUserResponse | undefined> {
	const userCredential = await signInWithEmailAndPassword(auth, email, password);
	return { user: userCredential.user };
}

export async function logout(): Promise<void> {
	await signOut(auth);
}

export async function register(email: string, password: string, name?: string): Promise<FirebaseUserResponse | undefined> {
	// 1. Maak account aan via Auth
	const userCredential = await createUserWithEmailAndPassword(auth, email, password);
	const user = userCredential.user;

	// 2. Update de auth profile naam
	if (name) {
		await updateProfile(user, { displayName: name });
	}

	// 3. Maak het database document aan in Firestore
	await setDoc(doc(db, "users", user.uid), {
		uid: user.uid,
		email: user.email,
		name: name || "",
		// The language the user is using right now (NL or FR), not always "nl"
		language: currentAppLanguage(),
		createdAt: new Date().toISOString(),
		role: "mantelzorger",
		onboardingCompleted: false,
	});

	return { user };
}

export interface CreateCircleParams {
	circleName: string;
	receiverName: string;
	profileImage: string;
	relation: string;
	customRelation: string;
	invitees: { contact: string }[];
}

export interface InviteCodeInfo {
	// Without the "LUME-" prefix, e.g. "ABC234"
	code: string;
	expiresAt: number;
}

export interface CreatedCircle extends InviteCodeInfo {
	circleId: string;
}

// Server errors that the screens show as a specific message
export type CircleErrorCode = "NOT_FOUND" | "TOO_MANY_ATTEMPTS" | "ALREADY_IN_CIRCLE" | "NOT_ADMIN";

function toCircleError(error: unknown): Error {
	const code = (error as FirebaseError)?.code;
	const map: Record<string, CircleErrorCode> = {
		"functions/not-found": "NOT_FOUND",
		"functions/resource-exhausted": "TOO_MANY_ATTEMPTS",
		"functions/failed-precondition": "ALREADY_IN_CIRCLE",
		"functions/permission-denied": "NOT_ADMIN",
	};
	return map[code] ? new Error(map[code]) : (error as Error);
}

export async function uploadImageAsync(uri: string, path: string): Promise<string> {
	try {
		// Haal de lokale afbeelding op en zet hem om naar een "Blob" (Data-pakketje)
		const response = await fetch(uri);
		const blob = await response.blob();

		// Vertel Firebase waar we de foto willen opslaan
		const storageRef = ref(storage, path);

		// Upload het bestand naar Firebase Storage. The Storage rules only accept images,
		// so always send an image content type (the picker returns JPEG files).
		const contentType = blob.type?.startsWith("image/") ? blob.type : "image/jpeg";
		await uploadBytes(storageRef, blob, { contentType });

		// Vraag de publieke "https://" download-link op en geef deze terug
		return await getDownloadURL(storageRef);
	} catch (error) {
		console.error("Fout bij uploaden afbeelding:", error);
		throw error;
	}
}

// The server (Cloud Function createCircle) creates the circle, makes the caller admin
// and issues the first invite code. Firestore rules do not allow the app to do this itself.
export async function createCareCircleInDB(params: CreateCircleParams): Promise<CreatedCircle> {
	const currentUser = auth.currentUser;
	if (!currentUser) throw new Error("Je bent niet ingelogd.");

	const createCircle = httpsCallable<object, { circleId: string; inviteCode: string; expiresAt: number }>(functions, "createCircle");
	let result;
	try {
		result = await createCircle({
			circleName: params.circleName,
			receiverName: params.receiverName,
			relation: params.relation,
			customRelation: params.customRelation,
			invitees: params.invitees.map((i) => i.contact),
		});
	} catch (error) {
		throw toCircleError(error);
	}
	const { circleId, inviteCode, expiresAt } = result.data;

	// Now that we are admin of the circle, upload the care receiver photo
	if (params.profileImage) {
		const photoUrl = await uploadImageAsync(params.profileImage, `careCircles/${circleId}/receiver/photo_${Date.now()}.jpg`);
		await updateDoc(doc(db, "careCircles", circleId), { "careReceiver.photoUrl": photoUrl });
	}

	return { circleId, code: inviteCode, expiresAt };
}

export interface JoinCircleParams {
	inviteCode: string;
	relation: string;
	customRelation: string;
	profileImage: string;
}

// The server (Cloud Function joinCircle) checks the code and adds the caller as "member"
export async function joinCareCircleInDB(params: JoinCircleParams): Promise<void> {
	const currentUser = auth.currentUser;
	if (!currentUser) throw new Error("Je bent niet ingelogd.");
	const currentUserId = currentUser.uid;

	const joinCircle = httpsCallable<object, { circleId: string }>(functions, "joinCircle");
	let circleId: string;
	try {
		const result = await joinCircle({ inviteCode: params.inviteCode, relation: params.relation, customRelation: params.customRelation });
		circleId = result.data.circleId;
	} catch (error) {
		throw toCircleError(error);
	}

	// Now that we are a member, upload our own profile photo
	if (params.profileImage) {
		const photoUrl = await uploadImageAsync(params.profileImage, `users/${currentUserId}/profile_${Date.now()}.jpg`);
		await updateDoc(doc(db, "careCircleMembers", `${circleId}_${currentUserId}`), { photoUrl });
		await updateDoc(doc(db, "users", currentUserId), { photoUrl });
	}
}

export async function updateCareReceiverInDB(circleId: string, data: any): Promise<void> {
	const circleRef = doc(db, "careCircles", circleId);
	await updateDoc(circleRef, {
		careReceiver: data,
	});
}


// 2. Leden van een kring, LIVE: a changed name or photo shows everywhere immediately
export interface CircleMemberInfo {
	id: string;
	name: string;
	role: string; // relationship to the care receiver, e.g. "dochter"
	photoUrl: string | null;
	isAdmin: boolean;
	joinedAt: string;
}

export function subscribeToCircleMembers(circleId: string, onChange: (members: CircleMemberInfo[]) => void, onError: (error: unknown) => void): () => void {
	const q = query(collection(db, "careCircleMembers"), where("careCircleId", "==", circleId));
	// Name and photo are stored on the membership itself; users documents are private
	return onSnapshot(
		q,
		(snapshot) =>
			onChange(
				snapshot.docs.map((docSnap) => {
					const data = docSnap.data();
					return {
						id: data.userId,
						name: data.name || i18n.t("common.unknownName"),
						role: data.relationshipToCareReceiver || i18n.t("common.memberFallback"),
						photoUrl: data.photoUrl || null,
						isAdmin: data.role === "admin",
						joinedAt: data.joinedAt || "",
					};
				}),
			),
		onError,
	);
}

// 3. Verwijder een lid uit de kring. The server (Cloud Function removeMember) checks that the
// caller is admin, unlinks the member's account and revokes their medication access.
export async function removeCircleMember(circleId: string, userIdToRemove: string): Promise<void> {
	const removeMember = httpsCallable(functions, "removeMember");
	try {
		await removeMember({ circleId, userId: userIdToRemove });
	} catch (error) {
		throw toCircleError(error);
	}
}

// Current invite code of the circle (admins only); the server issues a new one when it expired
export async function getCircleInviteCode(circleId: string): Promise<InviteCodeInfo> {
	const getInviteCode = httpsCallable<object, { inviteCode: string; expiresAt: number }>(functions, "getInviteCode");
	try {
		const result = await getInviteCode({ circleId });
		return { code: result.data.inviteCode, expiresAt: result.data.expiresAt };
	} catch (error) {
		throw toCircleError(error);
	}
}

// ─── Account deletion ─────────────────────────────────────────────────────────

export type AccountDeletionOutcome = "leave" | "transfer" | "deleteCircle" | "noCircle";

// What deleting the account will do to the user's circle (shown before confirming)
export async function getAccountDeletionPlan(): Promise<{ outcome: AccountDeletionOutcome; newAdminName: string | null }> {
	const getPlan = httpsCallable<object, { outcome: AccountDeletionOutcome; newAdminName: string | null }>(functions, "getAccountDeletionPlan");
	return (await getPlan({})).data;
}

// Confirms the password (the server only deletes after a recent login), lets the
// server delete everything, then signs out on this phone.
// Throws "WRONG_PASSWORD" when the password does not match.
export async function deleteMyAccount(password: string): Promise<void> {
	const currentUser = auth.currentUser;
	if (!currentUser?.email) throw new Error("Je bent niet ingelogd.");

	try {
		await reauthenticateWithCredential(currentUser, EmailAuthProvider.credential(currentUser.email, password));
	} catch (error) {
		const code = (error as FirebaseError)?.code;
		if (code === "auth/wrong-password" || code === "auth/invalid-credential" || code === "auth/invalid-login-credentials") throw new Error("WRONG_PASSWORD");
		throw error;
	}

	// The fresh login gives a new token with a recent auth_time
	await currentUser.getIdToken(true);
	await httpsCallable(functions, "deleteAccount")({});

	// The login account no longer exists; clear the local session
	await signOut(auth).catch(() => {});
}
