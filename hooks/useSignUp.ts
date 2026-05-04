import { router } from "expo-router";
import { useState } from "react";
import { useSession } from "../context";

export function useSignUp() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [termsAccepted, setTermsAccepted] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const { signUp } = useSession();

	const handleSignUpPress = async () => {
		if (!name || !email || !password || !termsAccepted) return;

		setIsSubmitting(true);

		try {
			const user = await signUp(email, password, name);
			if (user) {
				router.replace("/");
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	return {
		name,
		setName,
		email,
		setEmail,
		password,
		setPassword,
		termsAccepted,
		setTermsAccepted,
		isSubmitting,
		handleSignUpPress,
	};
}
