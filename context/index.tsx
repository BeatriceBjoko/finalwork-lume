import { User, onAuthStateChanged } from "firebase/auth";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../lib/firebase-config";
import { login, logout, register } from "../lib/firebase-service";

interface AuthContextType {
	signIn: (email: string, password: string) => Promise<User | undefined>;
	signUp: (email: string, password: string, name?: string) => Promise<User | undefined>;
	signOut: () => void;
	user: User | null;
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
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			setUser(user);
			setIsLoading(false);
		});
		return () => unsubscribe();
	}, []);

	const handleSignIn = async (email: string, password: string) => {
		try {
			const response = await login(email, password);
			return response?.user;
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const handleSignUp = async (email: string, password: string, name?: string) => {
		try {
			const response = await register(email, password, name);
			return response?.user;
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const handleSignOut = async () => {
		try {
			await logout();
			setUser(null);
		} catch (error) {
			console.error(error);
		}
	};

	return <AuthContext.Provider value={{ signIn: handleSignIn, signUp: handleSignUp, signOut: handleSignOut, user, isLoading }}>{props.children}</AuthContext.Provider>;
}
