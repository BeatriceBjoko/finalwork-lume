import { Image } from "expo-image";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text } from "react-native";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { COLORS, FONTS } from "../../constants/theme";

// Same image, size and background as the native splash (app.json → expo-splash-screen),
// so the hand-over from the native splash to this animation is invisible
const LOGO_SIZE = 200;
const INTRO_MS = 1100;

interface AnimatedSplashProps {
	// The app is ready to be shown (session loaded)
	ready: boolean;
	onFinished: () => void;
}

export function AnimatedSplash({ ready, onFinished }: AnimatedSplashProps) {
	const { t } = useTranslation();
	const reduceMotion = useReducedMotion();
	const [introDone, setIntroDone] = useState(reduceMotion);

	const logo = useSharedValue(0); // 0 = like the native splash, 1 = moved up and smaller
	const text = useSharedValue(0);
	const screen = useSharedValue(1);

	useEffect(() => {
		// The animation now covers the screen exactly like the native splash: hide the native one
		SplashScreen.hideAsync().catch(() => {});
		if (reduceMotion) return;
		const ease = Easing.out(Easing.cubic);
		logo.value = withTiming(1, { duration: 600, easing: ease });
		text.value = withDelay(250, withTiming(1, { duration: 550, easing: ease }));
		const timer = setTimeout(() => setIntroDone(true), INTRO_MS);
		return () => clearTimeout(timer);
	}, [reduceMotion, logo, text]);

	// Fade into the app once the intro has played and the app is ready
	useEffect(() => {
		if (!ready || !introDone) return;
		screen.value = withTiming(0, { duration: reduceMotion ? 200 : 400 }, (finished) => {
			if (finished) scheduleOnRN(onFinished);
		});
	}, [ready, introDone, reduceMotion, screen, onFinished]);

	const screenStyle = useAnimatedStyle(() => ({ opacity: screen.value }));
	const logoStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: -60 * logo.value }, { scale: 1 - 0.3 * logo.value }],
	}));
	const textStyle = useAnimatedStyle(() => ({
		opacity: text.value,
		transform: [{ translateY: 12 * (1 - text.value) }],
	}));

	return (
		<Animated.View style={[StyleSheet.absoluteFill, styles.container, screenStyle]} pointerEvents="none">
			<Animated.View style={logoStyle}>
				<Image source={require("../../assets/images/logo-lume.png")} style={styles.logo} contentFit="contain" />
			</Animated.View>
			{!reduceMotion && (
				<Animated.View style={[styles.textBlock, textStyle]}>
					<Text style={styles.wordmark}>Lume</Text>
					<Text style={styles.tagline}>{t("splash.tagline")}</Text>
				</Animated.View>
			)}
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	container: { backgroundColor: COLORS.background, justifyContent: "center", alignItems: "center", zIndex: 1000 },
	logo: { width: LOGO_SIZE, height: LOGO_SIZE },
	// Sits just under the logo after it moved up
	textBlock: { position: "absolute", top: "50%", marginTop: 20, alignItems: "center", paddingHorizontal: 32 },
	wordmark: { fontFamily: FONTS.heading, fontSize: 44, color: COLORS.primary, letterSpacing: 0.5 },
	tagline: { fontFamily: FONTS.body, fontSize: 15, color: COLORS.primary, opacity: 0.75, marginTop: 6, textAlign: "center" },
});
