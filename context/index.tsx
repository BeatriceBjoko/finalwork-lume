import { User, onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { auth, db } from "../lib/firebase-config";
import { login, logout, register } from "../lib/firebase-service";

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

			const docRef = doc(db, "users", authUser.uid);
			let serverSeen = false;

			fallbackTimer = setTimeout(() => {
				if (!serverSeen) setIsLoading(false);
			}, 3000);

			unsubscribeDoc = onSnapshot(docRef, (docSnap) => {
				if (docSnap.exists()) {
					setUserData(docSnap.data() as UserData);
				} else {
					setUserData(null);
				}
				if (!docSnap.metadata.fromCache) {
					serverSeen = true;
					setIsLoading(false);
				}
			});
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
		await logout();
		setUser(null);
		setUserData(null);
	}, []);

	const value = useMemo(() => ({ signIn: handleSignIn, signUp: handleSignUp, signOut: handleSignOut, user, userData, isLoading }), [handleSignIn, handleSignUp, handleSignOut, user, userData, isLoading]);

	return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
}
