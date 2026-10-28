import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { doc, setDoc } from "firebase/firestore";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { useSession } from "../context";
import { db } from "../lib/firebase-config";

// Show notifications while the app is in the foreground too
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowBanner: true,
		shouldShowList: true,
		shouldPlaySound: true,
		shouldSetBadge: false,
	}),
});

/**
 * Registers this device for push and stores the Expo push token on the
 * user's profile (users/{uid}.pushToken). Call once inside the authenticated layout
 */
export function usePushNotifications() {
	const { user } = useSession();
	const registeredFor = useRef<string | null>(null);
	const handledResponse = useRef<string | null>(null);

	// Tapping a notification opens the screen with the details (the push itself stays neutral)
	useEffect(() => {
		if (!user?.uid) return;
		const open = (response: Notifications.NotificationResponse | null) => {
			if (!response || handledResponse.current === response.notification.request.identifier) return;
			handledResponse.current = response.notification.request.identifier;
			const type = response.notification.request.content.data?.type;
			if (type === "sosNote") router.push("/notes");
			else if (type === "medicationOverride") router.push("/calendar");
		};
		// The app was closed and opened by tapping a notification
		Notifications.getLastNotificationResponseAsync().then(open).catch(() => {});
		const subscription = Notifications.addNotificationResponseReceivedListener(open);
		return () => subscription.remove();
	}, [user?.uid]);

	useEffect(() => {
		const uid = user?.uid;
		if (!uid || registeredFor.current === uid) return;

		(async () => {
			try {
				if (!Device.isDevice) return;

				if (Platform.OS === "android") {
					await Notifications.setNotificationChannelAsync("default", {
						name: "Lume",
						importance: Notifications.AndroidImportance.HIGH,
						vibrationPattern: [0, 250, 250, 250],
						lightColor: "#C2CE3A",
					});
				}

				const { status: existing } = await Notifications.getPermissionsAsync();
				let status = existing;
				if (existing !== "granted") {
					const req = await Notifications.requestPermissionsAsync();
					status = req.status;
				}
				if (status !== "granted") return;

				const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? (Constants as any).easConfig?.projectId;
				const tokenData = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);

				await setDoc(doc(db, "users", uid), { pushToken: tokenData.data, pushPlatform: Platform.OS, pushUpdatedAt: new Date().toISOString() }, { merge: true });
				registeredFor.current = uid;
			} catch (e) {
				console.error("[push] registration failed", e);
			}
		})();
	}, [user?.uid]);
}
