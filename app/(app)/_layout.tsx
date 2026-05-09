import { Redirect, Slot } from "expo-router";
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

	//  Niet ingelogd? -> Naar login scherm
	if (!user) {
		return <Redirect href="/sign-in" />;
	}

	//  Wel ingelogd, maar onboarding in de database is nog NIET afgerond? -> Naar onboarding
	if (userData && userData.onboardingCompleted === false) {
		return <Redirect href="/onboarding" />;
	}

	// Alles veilig en afgerond? -> Laat de (app) schermen zien
	return <Slot />;
}
