import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSession } from "../context";

export function useSignUp() {
	const { t } = useTranslation();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [termsAccepted, setTermsAccepted] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");

	const { signUp } = useSession();

	const handleSignUpPress = async () => {
		setErrorMessage("");

		// Extra veiligheidscheck: Ga niet verder als de voorwaarden niet zijn geaccepteerd
		if (!termsAccepted) return;

		if (!name || !email || !password) {
			setErrorMessage(t("errors.missingFields"));
			return;
		}

		setIsSubmitting(true);

		try {
			const user = await signUp(email, password, name);
			if (user) {
				router.replace("/");
			}
		} catch (error: any) {
			console.log("Firebase register error:", error.code);

			// Map Firebase errors naar vertalingen
			switch (error.code) {
				case "auth/email-already-in-use":
					setErrorMessage(t("errors.emailInUse"));
					break;
				case "auth/weak-password":
					setErrorMessage(t("errors.weakPassword"));
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
		name,
		setName,
		email,
		setEmail,
		password,
		setPassword,
		termsAccepted,
		setTermsAccepted,
		isSubmitting,
		errorMessage,
		handleSignUpPress,
	};
}
