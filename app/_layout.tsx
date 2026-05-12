import { BricolageGrotesque_500Medium, BricolageGrotesque_700Bold } from "@expo-google-fonts/bricolage-grotesque";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { useFonts } from "expo-font";
import { Slot } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { SessionProvider } from "../context";
import "../locales/i18n";

export default function RootLayout() {
	const [fontsLoaded] = useFonts({
		BricolageBold: BricolageGrotesque_700Bold,
		BricolageMedium: BricolageGrotesque_500Medium,
		InterMedium: Inter_500Medium,
		InterRegular: Inter_400Regular,
		InterSemiBold: Inter_600SemiBold,
		InterBold: Inter_700Bold,
	});

	// Show a loading spinner until fonts are ready to prevent UI jumping
	if (!fontsLoaded) {
		return (
			<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
				<ActivityIndicator size="large" color="#233600" />
			</View>
		);
	}

	return (
		<SessionProvider>
			<Slot />
		</SessionProvider>
	);
}
