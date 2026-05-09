import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, User } from "firebase/auth";
import { collection, doc, setDoc, writeBatch } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "./firebase-config";

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
		language: "nl",
		createdAt: new Date().toISOString(),
		role: "mantelzorger",
	});

	return { user };
}

export interface CreateCircleParams {
	circleName: string;
	receiverName: string;
	profileImage: string;
	relation: string;
	customRelation: string;
	inviteCode: string;
	invitees: Array<{ contact: string }>;
}

export async function uploadImageAsync(uri: string, path: string): Promise<string> {
	try {
		//  Haal de lokale afbeelding op en zet hem om naar een "Blob" (Data-pakketje)
		const response = await fetch(uri);
		const blob = await response.blob();

		//  Vertel Firebase waar we de foto willen opslaan
		const storageRef = ref(storage, path);

		// Upload het bestand naar Firebase Storage
		await uploadBytes(storageRef, blob);

		// Vraag de publieke "https://" download-link op en geef deze terug
		return await getDownloadURL(storageRef);
	} catch (error) {
		console.error("Fout bij uploaden afbeelding:", error);
		throw error;
	}
}

export async function createCareCircleInDB(params: CreateCircleParams): Promise<void> {
	const currentUser = auth.currentUser;
	if (!currentUser) throw new Error("Je bent niet ingelogd.");
	const currentUserId = currentUser.uid;

	const batch = writeBatch(db);

	// Zorgkring aanmaken
	const circleRef = doc(collection(db, "careCircles"));
	const circleId = circleRef.id;

	let uploadedPhotoUrl = "";
	if (params.profileImage) {
		// hier uniek pad maken in Storage: careCircles/ID/profile_tijdstip.jpg
		const imagePath = `careCircles/${circleId}/profile_${Date.now()}.jpg`;
		uploadedPhotoUrl = await uploadImageAsync(params.profileImage, imagePath);
	}

	batch.set(circleRef, {
		id: circleId,
		name: params.circleName,
		careReceiver: {
			name: params.receiverName,
			photoUrl: uploadedPhotoUrl,
		},
		createdBy: currentUserId,
		inviteCode: params.inviteCode,
		createdAt: new Date().toISOString(),
	});

	// Maker als Admin toevoegen
	const memberRef = doc(db, "careCircleMembers", `${circleId}_${currentUserId}`);
	batch.set(memberRef, {
		careCircleId: circleId,
		userId: currentUserId,
		role: "admin",
		relationshipToCareReceiver: params.relation === "andere" ? params.customRelation : params.relation,
		status: "active",
		joinedAt: new Date().toISOString(),
	});

	// User updaten
	const userRef = doc(db, "users", currentUserId);
	batch.update(userRef, {
		onboardingCompleted: true,
		careCircleId: circleId,
	});

	// Uitnodigingen opslaan
	const expiresAtDate = new Date();
	expiresAtDate.setDate(expiresAtDate.getDate() + 7);

	params.invitees.forEach((invitee) => {
		const inviteRef = doc(collection(db, "careCircleInvites"));
		batch.set(inviteRef, {
			id: inviteRef.id,
			careCircleId: circleId,
			emailOrPhone: invitee.contact,
			invitedBy: currentUserId,
			inviteCode: params.inviteCode,
			roleOnJoin: "member",
			status: "pending",
			createdAt: new Date().toISOString(),
			expiresAt: expiresAtDate.toISOString(),
		});
	});

	await batch.commit();
}
