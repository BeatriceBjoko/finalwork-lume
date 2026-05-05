import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSession } from "../context";

export function useSignIn() {
	const { t } = useTranslation();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");

	const { signIn } = useSession();

	const handleSignInPress = async () => {
		// Reset eerdere errors
		setErrorMessage("");

		// Prevent empty submissions
		if (!email || !password) {
			setErrorMessage(t("errors.missingFields"));
			return;
		}
		setIsSubmitting(true);

		try {
			const user = await signIn(email, password);
			if (user) {
				router.replace("/");
			}
		} catch (error: any) {
			console.log("Firebase error:", error.code);

			// Map de specifieke Firebase error naar mijn vertalingen
			switch (error.code) {
				case "auth/invalid-credential":
				case "auth/user-not-found":
				case "auth/wrong-password":
					setErrorMessage(t("errors.invalidCredential"));
					break;
				case "auth/too-many-requests":
					setErrorMessage(t("errors.tooManyRequests"));
					break;
				case "auth/invalid-email":
					setErrorMessage(t("errors.invalidEmail"));
					break;
				default:
					setErrorMessage(t("errors.default"));
					break;
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	return {
		email,
		setEmail,
		password,
		setPassword,
		isSubmitting,
		errorMessage,
		handleSignInPress,
	};
}
