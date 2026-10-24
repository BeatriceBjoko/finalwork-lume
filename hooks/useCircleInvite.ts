import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Linking, Platform, Share } from "react-native";
import { getCircleInviteCode } from "../lib/firebase-service";

export function useCircleInvite(careCircleId: string | undefined) {
	const { t, i18n } = useTranslation();
	const [isVisible, setIsVisible] = useState(false);
	const [inviteCode, setInviteCode] = useState<string>("");
	const [expiresAt, setExpiresAt] = useState<number | null>(null);
	const [isLoadingCode, setIsLoadingCode] = useState(false);

	// Opens the modal and fetches the code from the server (it may have expired since last time)
	const openInvite = useCallback(async () => {
		if (!careCircleId) return;
		setIsVisible(true);
		setIsLoadingCode(true);
		try {
			const { code, expiresAt: expiry } = await getCircleInviteCode(careCircleId);
			setInviteCode(code);
			setExpiresAt(expiry);
		} catch (error: any) {
			console.error("Kon uitnodigingscode niet ophalen:", error);
			setIsVisible(false);
			Alert.alert(t("errors.errorTitle"), error?.message === "NOT_ADMIN" ? t("circleOverview.inviteAdminOnly") : t("errors.default"));
		} finally {
			setIsLoadingCode(false);
		}
	}, [careCircleId, t]);

	const locale = i18n.language.startsWith("fr") ? "fr-BE" : "nl-BE";
	const validUntil = expiresAt ? new Date(expiresAt).toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" }) : "";

	const shareMessage = t("inviteModal.shareMessage", { code: `LUME-${inviteCode}` });

	const shareSMS = async () => {
		const separator = Platform.OS === "ios" ? "&" : "?";
		const url = `sms:${separator}body=${encodeURIComponent(shareMessage)}`;

		try {
			await Linking.openURL(url);
		} catch {
			try {
				await Share.share({ message: shareMessage });
			} catch {
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
		openInvite,
		closeInvite: () => setIsVisible(false),
		inviteCode,
		validUntil,
		isLoadingCode,
		shareSMS,
		shareEmail,
	};
}
