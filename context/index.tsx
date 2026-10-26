import { User, onAuthStateChanged } from "firebase/auth";
import { deleteField, doc, onSnapshot, updateDoc } from "firebase/firestore";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { auth, db } from "../lib/firebase-config";
import { login, logout, register } from "../lib/firebase-service";
import { isSupportedLanguage, setAppLanguage } from "../locales/i18n";

interface UserData {
	onboardingCompleted?: boolean;
	careCircleId?: string;
	role?: string;
	name?: string;
	email?: string;
	photoUrl?: string;
	language?: string;
}

interface AuthContextType {
	signIn: (email: string, password: string) => Promise<User | undefined>;
	signUp: (email: string, password: string, name?: string) => Promise<User | undefined>;
	signOut: () => Promise<void>;
	user: User | null;
	userData: UserData | null;
	isLoading: boolean;
	// Role inside the care circle (careCircleMembers doc), NOT userData.role
	isCircleAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useSession() {
	const value = useContext(AuthContext);
	if (!value) throw new Error("useSession must be wrapped in a <SessionProvider />");
	return value;
}

export function SessionProvider(props: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [userData, setUserData] = useState<UserData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isCircleAdmin, setIsCircleAdmin] = useState(false);

	const uid = user?.uid;
	const careCircleId = userData?.careCircleId;
	const accountLanguage = userData?.language;

	// The language saved on the account wins after login (also on a new phone)
	useEffect(() => {
		if (isSupportedLanguage(accountLanguage)) setAppLanguage(accountLanguage);
	}, [accountLanguage]);

	// Live membership listener: the admin/member role lives on careCircleMembers/{circleId}_{uid}
	useEffect(() => {
		if (!uid || !careCircleId) {
			setIsCircleAdmin(false);
			return;
		}
		const memberRef = doc(db, "careCircleMembers", `${careCircleId}_${uid}`);
		return onSnapshot(
			memberRef,
			(snap) => setIsCircleAdmin(snap.exists() && snap.data().role === "admin"),
			() => setIsCircleAdmin(false),
		);
	}, [uid, careCircleId]);

	useEffect(() => {
		let unsubscribeDoc: (() => void) | undefined;
		let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

		const cleanupDocListener = () => {
			if (unsubscribeDoc) {
				unsubscribeDoc();
				unsubscribeDoc = undefined;
			}
			if (fallbackTimer) {
				clearTimeout(fallbackTimer);
				fallbackTimer = undefined;
			}
		};

		const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
			setUser(authUser);
			cleanupDocListener();

			if (!authUser) {
				setUserData(null);
				setIsLoading(false);
				return;
			}

			// On EVERY sign-in (not only at app start): forget the previous user's data and
			// wait for this user's profile from the server before the app decides where to go.
			// Otherwise a second login in the same session could briefly route to onboarding.
			setUserData(null);
			setIsLoading(true);

			const docRef = doc(db, "users", authUser.uid);
			let serverSeen = false;

			fallbackTimer = setTimeout(() => {
				if (!serverSeen) setIsLoading(false);
			}, 3000);

			unsubscribeDoc = onSnapshot(
				docRef,
				(docSnap) => {
					if (docSnap.exists()) {
						setUserData(docSnap.data() as UserData);
					} else {
						setUserData(null);
					}
					if (!docSnap.metadata.fromCache) {
						serverSeen = true;
						setIsLoading(false);
					}
				},
				(error) => {
					// e.g. no connection: stop the spinner instead of waiting forever
					console.error("Kon profiel niet laden:", error);
					setIsLoading(false);
				},
			);
		});

		return () => {
			unsubscribeAuth();
			cleanupDocListener();
		};
	}, []);

	const handleSignIn = useCallback(async (email: string, password: string) => {
		const response = await login(email, password);
		return response?.user;
	}, []);

	const handleSignUp = useCallback(async (email: string, password: string, name?: string) => {
		const response = await register(email, password, name);
		return response?.user;
	}, []);

	const handleSignOut = useCallback(async () => {
		// Remove this phone's push token first, so a logged-out phone stops receiving
		// the circle's notifications (must happen while we are still signed in)
		const uid = auth.currentUser?.uid;
		if (uid) {
			try {
				await updateDoc(doc(db, "users", uid), { pushToken: deleteField(), pushPlatform: deleteField(), pushUpdatedAt: deleteField() });
			} catch (error) {
				// Offline or no profile: still sign out; the server removes duplicate tokens later
				console.warn("Kon push token niet verwijderen:", error);
			}
		}
		await logout();
		setUser(null);
		setUserData(null);
	}, []);

	const value = useMemo(
		() => ({ signIn: handleSignIn, signUp: handleSignUp, signOut: handleSignOut, user, userData, isLoading, isCircleAdmin }),
		[handleSignIn, handleSignUp, handleSignOut, user, userData, isLoading, isCircleAdmin],
	);

	return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
}
