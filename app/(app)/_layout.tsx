import { Redirect, Stack, useSegments } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { LEGAL_VERSION } from "../../constants/legal";
import { useSession } from "../../context";
import { usePushNotifications } from "../../hooks/usePushNotifications";

export default function AppLayout() {
	const { user, userData, isLoading } = useSession();
	const segments = useSegments();

	usePushNotifications(); // registers the device once the user is signed in

	if (isLoading) {
		return (
			<View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FDFBF7" }}>
				<ActivityIndicator size="large" color="#7FA99B" />
			</View>
		);
	}

	if (!user) {
		return <Redirect href="/sign-in" />;
	}

	// Deleting the account must always be possible: without agreeing, and without a circle
	const isDeleteScreen = (segments as string[]).includes("delete-account");

	// No consent yet for the current privacy policy and terms (older account, or a new version): ask first
	if (userData && userData.consent?.version !== LEGAL_VERSION && !isDeleteScreen) {
		return <Redirect href="/consent" />;
	}

	if (userData && !userData.careCircleId && !isDeleteScreen) {
		return <Redirect href="/onboarding" />;
	}

	return <Stack screenOptions={{ headerShown: false }} />;
}
