import { BricolageGrotesque_500Medium, BricolageGrotesque_700Bold } from "@expo-google-fonts/bricolage-grotesque";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { useFonts } from "expo-font";
import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AnimatedSplash } from "../components/ui/AnimatedSplash";
import { AppAlertHost } from "../components/ui/AppAlertHost";
import { SessionProvider, useSession } from "../context";
import "../locales/i18n";

// Keep the native splash until the fonts are loaded; AnimatedSplash then takes over seamlessly
SplashScreen.preventAutoHideAsync().catch(() => {});

// Plays the intro and fades into the app once the session (login check) is loaded
function SplashGate() {
	const { isLoading } = useSession();
	const [visible, setVisible] = useState(true);
	// Never longer than 8 s (e.g. very slow internet): the screens then show their own loading state
	const [timedOut, setTimedOut] = useState(false);
	useEffect(() => {
		const timer = setTimeout(() => setTimedOut(true), 8000);
		return () => clearTimeout(timer);
	}, []);
	const hide = useCallback(() => setVisible(false), []);
	if (!visible) return null;
	return <AnimatedSplash ready={!isLoading || timedOut} onFinished={hide} />;
}

export default function RootLayout() {
	const [fontsLoaded, fontError] = useFonts({
		BricolageBold: BricolageGrotesque_700Bold,
		BricolageMedium: BricolageGrotesque_500Medium,
		InterMedium: Inter_500Medium,
		InterRegular: Inter_400Regular,
		InterSemiBold: Inter_600SemiBold,
		InterBold: Inter_700Bold,
	});

	// The native splash stays visible meanwhile
	if (!fontsLoaded && !fontError) return null;

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SessionProvider>
				<StatusBar style="dark" />
				<Slot />
				<AppAlertHost />
				<SplashGate />
			</SessionProvider>
		</GestureHandlerRootView>
	);
}
