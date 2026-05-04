import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, User } from "firebase/auth";
import { auth } from "./firebase-config";

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
		const userCredential = await createUserWithEmailAndPassword(auth, email, password);
		if (name) {
			await updateProfile(userCredential.user, { displayName: name });
		}
		return { user: userCredential.user };
	} catch (e) {
		console.error("[error registering] ==>", e);
		throw e;
	}
}
