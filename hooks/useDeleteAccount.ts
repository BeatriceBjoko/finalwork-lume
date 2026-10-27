import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { appAlert } from "../lib/appAlert";
import { deleteMyAccount, getAccountDeletionPlan, type AccountDeletionOutcome } from "../lib/firebase-service";

export function useDeleteAccount() {
	const { t } = useTranslation();

	const [outcome, setOutcome] = useState<AccountDeletionOutcome | null>(null);
	const [newAdminName, setNewAdminName] = useState<string | null>(null);
	const [isLoadingPlan, setIsLoadingPlan] = useState(true);
	const [password, setPassword] = useState("");
	const [isDeleting, setIsDeleting] = useState(false);

	// Ask the server what will happen to the circle, so we can explain it up front
	useEffect(() => {
		let active = true;
		getAccountDeletionPlan()
			.then((plan) => {
				if (!active) return;
				setOutcome(plan.outcome);
				setNewAdminName(plan.newAdminName);
			})
			.catch((error) => {
				console.error("Kon verwijderplan niet laden:", error);
				if (active) appAlert(t("errors.errorTitle"), t("deleteAccount.failed"));
			})
			.finally(() => {
				if (active) setIsLoadingPlan(false);
			});
		return () => {
			active = false;
		};
	}, [t]);

	const performDelete = async () => {
		setIsDeleting(true);
		try {
			await deleteMyAccount(password);
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			// The session is now signed out; the app goes back to the sign-in screen
			appAlert(t("deleteAccount.doneTitle"), t("deleteAccount.doneMessage"));
		} catch (error) {
			const wrongPassword = (error as Error)?.message === "WRONG_PASSWORD";
			if (!wrongPassword) console.error("Account verwijderen mislukt:", error);
			appAlert(t("errors.errorTitle"), wrongPassword ? t("deleteAccount.wrongPassword") : t("deleteAccount.failed"));
		} finally {
			setIsDeleting(false);
		}
	};

	// Last check before deleting: a clear confirmation with a destructive button
	const confirmDelete = () => {
		if (!password || isDeleting) return;
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
		appAlert(t("deleteAccount.confirmTitle"), t("deleteAccount.confirmMessage"), [
			{ text: t("common.cancel"), style: "cancel" },
			{ text: t("deleteAccount.confirmButton"), style: "destructive", onPress: performDelete },
		]);
	};

	return { outcome, newAdminName, isLoadingPlan, password, setPassword, isDeleting, confirmDelete };
}
