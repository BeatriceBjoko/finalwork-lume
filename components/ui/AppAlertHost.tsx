import * as Haptics from "expo-haptics";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { closeAppAlert, useAppAlertHost, type AppAlertButton } from "../../lib/appAlert";
import CustomAlert from "./CustomAlert";

// Draws alerts raised with appAlert() in the Lume CustomAlert style.
// Mount it once at the app root and once inside every full-screen <Modal>.
export function AppAlertHost() {
	const { t } = useTranslation();
	const alert = useAppAlertHost();

	// A plain message with only "OK" is a warning or error: give it a buzz
	const alertId = alert?.id;
	const isPlainMessage = !!alert && alert.buttons.length <= 1;
	useEffect(() => {
		if (alertId && isPlainMessage) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
	}, [alertId, isPlainMessage]);

	if (!alert) return null;

	const buttons: AppAlertButton[] = alert.buttons.length ? alert.buttons : [{ text: t("common.ok") }];
	const cancelButton = buttons.find((b) => b.style === "cancel");
	const close = (button?: AppAlertButton) => closeAppAlert(button);

	if (buttons.length >= 3) {
		return (
			<CustomAlert
				visible
				title={alert.title}
				message={alert.message ?? ""}
				confirmText=""
				onConfirm={() => close()}
				onCancel={() => close(cancelButton)}
				actions={buttons.map((b) => ({
					text: b.text,
					variant: b.style === "destructive" ? "destructive" : b.style === "cancel" ? "secondary" : "primary",
					onPress: () => close(b),
				}))}
			/>
		);
	}

	if (buttons.length === 2) {
		const cancel = cancelButton ?? buttons[0];
		const confirm = buttons.find((b) => b !== cancel) ?? buttons[1];
		return <CustomAlert visible title={alert.title} message={alert.message ?? ""} confirmText={confirm.text} cancelText={cancel.text} onConfirm={() => close(confirm)} onCancel={() => close(cancel)} />;
	}

	return <CustomAlert visible title={alert.title} message={alert.message ?? ""} confirmText={buttons[0].text} onConfirm={() => close(buttons[0])} />;
}
