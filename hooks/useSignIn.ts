import { router } from "expo-router";
import { useState } from "react";
import { useSession } from "../context";

export function useSignIn() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const { signIn } = useSession();

	const handleSignInPress = async () => {
		// Prevent empty submissions
		if (!email || !password) return;

		setIsSubmitting(true);

		try {
			const user = await signIn(email, password);
			if (user) {
				router.replace("/");
			}
		} finally {
			setIsSubmitting(false); // Turns off loading state whether it succeeds or fails
		}
	};

	return {
		email,
		setEmail,
		password,
		setPassword,
		isSubmitting,
		handleSignInPress,
	};
}
