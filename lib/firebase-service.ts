import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, User } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase-config";

export interface FirebaseUserResponse {
	user: User;
}

export async function login(email: string, password: string): Promise<FirebaseUserResponse | undefined> {
	try {
		const userCredential = await signInWithEmailAndPassword(auth, email, password);
		return { user: userCredential.user };
	} catch (e) {
		console.error("[error logging in] ==>", e);
		throw e;
	}
}

export async function logout(): Promise<void> {
	try {
		await signOut(auth);
	} catch (e) {
		console.error("[error logging out] ==>", e);
		throw e;
	}
}

export async function register(email: string, password: string, name?: string): Promise<FirebaseUserResponse | undefined> {
	try {
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
	} catch (e) {
		console.error("[error registering] ==>", e);
		throw e;
	}
}
