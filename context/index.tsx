import { User, onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../lib/firebase-config"; // DB toegevoegd!
import { login, logout, register } from "../lib/firebase-service";

//  wat we uit de database verwachten
interface UserData {
	onboardingCompleted?: boolean;
	careCircleId?: string;
	role?: string;
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
		let unsubscribeDoc: () => void;

		const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
			setUser(authUser);

			if (authUser) {
				// Als we zijn ingelogd, haal dan live de extra Firestore data op
				const docRef = doc(db, "users", authUser.uid);
				unsubscribeDoc = onSnapshot(docRef, (docSnap) => {
					if (docSnap.exists()) {
						setUserData(docSnap.data() as UserData);
					}
					setIsLoading(false);
				});
			} else {
				setUserData(null);
				setIsLoading(false);
				if (unsubscribeDoc) unsubscribeDoc();
			}
		});

		return () => {
			unsubscribeAuth();
			if (unsubscribeDoc) unsubscribeDoc();
		};
	}, []);

	const handleSignIn = async (email: string, password: string) => {
		const response = await login(email, password);
		return response?.user;
	};

	const handleSignUp = async (email: string, password: string, name?: string) => {
		const response = await register(email, password, name);
		return response?.user;
	};

	const handleSignOut = async () => {
		await logout();
		setUser(null);
		setUserData(null);
	};

	return <AuthContext.Provider value={{ signIn: handleSignIn, signUp: handleSignUp, signOut: handleSignOut, user, userData, isLoading }}>{props.children}</AuthContext.Provider>;
}
