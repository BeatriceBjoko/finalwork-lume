import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useSession } from "../../context";

export default function AppLayout() {
	const { user, userData, isLoading } = useSession();

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

	if (userData && !userData.onboardingCompleted) {
		return <Redirect href="/onboarding" />;
	}

	return <Stack screenOptions={{ headerShown: false }} />;
}
