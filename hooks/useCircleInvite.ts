import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Linking, Platform, Share } from "react-native";
import { getCircleInviteCode } from "../lib/firebase-service";

export function useCircleInvite(careCircleId: string | undefined) {
	const { t } = useTranslation();
	const [isVisible, setIsVisible] = useState(false);
	const [inviteCode, setInviteCode] = useState<string>("");
	const [timeLeft, setTimeLeft] = useState(1200);

	useEffect(() => {
		if (isVisible && careCircleId) {
			getCircleInviteCode(careCircleId).then((code) => {
				if (code) setInviteCode(code);
			});
			setTimeLeft(1200);
		}
	}, [isVisible, careCircleId]);

	useEffect(() => {
		if (!isVisible) return;
		const timer = setInterval(() => {
			setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
		}, 1000);
		return () => clearInterval(timer);
	}, [isVisible]);

	const formattedTime = `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, "0")}`;

	const shareMessage = t("inviteModal.shareMessage").replace("{{code}}", `LUME-${inviteCode}`);

	const shareSMS = async () => {
		const separator = Platform.OS === "ios" ? "&" : "?";
		const url = `sms:${separator}body=${encodeURIComponent(shareMessage)}`;

		try {
			await Linking.openURL(url);
		} catch (error) {
			try {
				await Share.share({ message: shareMessage });
			} catch (fallbackError) {
				Alert.alert("Fout", "Kon het bericht niet delen.");
			}
		}
	};

	const shareEmail = async () => {
		const subject = encodeURIComponent("Uitnodiging Zorgkring");
		const body = encodeURIComponent(shareMessage);
		const url = `mailto:?subject=${subject}&body=${body}`;

		try {
			await Linking.openURL(url);
		} catch (error) {
			Alert.alert("Oeps!", "Kon de e-mail app niet openen.");
			console.error("Email openen mislukt:", error);
		}
	};

	return {
		isVisible,
		setIsVisible,
		inviteCode,
		formattedTime,
		shareSMS,
		shareEmail,
	};
}
