import { Link } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ImageBackground, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Button from "../components/ui/Button";
import GlassCard from "../components/ui/GlassCard";
import Input from "../components/ui/Input";
import { COLORS, FONTS } from "../constants/theme";
import { useSignIn } from "../hooks/useSignIn";

export default function SignIn() {
	// Haal de vertaalfunctie en de i18n instantie op
	const { t, i18n } = useTranslation();

	const { email, setEmail, password, setPassword, isSubmitting, errorMessage, handleSignInPress } = useSignIn();

	// functie om de taal te wisselen
	const toggleLanguage = () => {
		const nextLang = i18n.language === "nl" ? "fr" : "nl";
		i18n.changeLanguage(nextLang);
	};

	return (
		<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
			<ImageBackground source={require("../assets/images/login-bg.jpg")} style={styles.background} resizeMode="cover">
				<SafeAreaView style={styles.languageContainer}>
					<Pressable onPress={toggleLanguage} style={styles.languageButton}>
						<Text style={styles.languageText}>{i18n.language === "nl" ? "FR" : "NL"}</Text>
					</Pressable>
				</SafeAreaView>

				<View style={styles.spacer} />

				<GlassCard>
					<View style={styles.header}>
						<Text style={styles.title}>{t("login.title")}</Text>
						<Text style={styles.subtitle}>{t("login.subtitle")}</Text>
					</View>

					{errorMessage !== "" && (
						<View style={styles.errorContainer}>
							<Text style={styles.errorText}>{errorMessage}</Text>
						</View>
					)}

					<Input label={t("login.email")} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="naam@mail.com" />

					<Input label={t("login.password")} value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />

					<Button title={isSubmitting ? "..." : t("login.button")} onPress={handleSignInPress} disabled={isSubmitting} style={{ marginTop: 16 }} />

					<Link href="/sign-up" asChild>
						<Pressable style={styles.forgotPassword}>
							<Text style={styles.forgotPasswordText}>{t("login.forgot")}</Text>
						</Pressable>
					</Link>

					<View style={styles.footer}>
						<Text style={styles.footerText}>{t("login.noAccount")} </Text>
						<Link href="/sign-up" asChild>
							<Pressable>
								<Text style={styles.footerLink}>{t("login.createAccount")}</Text>
							</Pressable>
						</Link>
					</View>
				</GlassCard>
			</ImageBackground>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	background: { flex: 1, width: "100%", height: "100%" },
	spacer: { flex: 1 },
	languageContainer: {
		position: "absolute",
		top: 20,
		right: 20,
		zIndex: 10,
	},
	languageButton: {
		backgroundColor: "rgba(35, 54, 0, 0.3)",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: COLORS.accent,
	},
	languageText: {
		fontFamily: FONTS.button,
		color: COLORS.white,
		fontSize: 12,
	},
	header: { alignItems: "center", marginBottom: 40, zIndex: 1 },
	title: { fontFamily: FONTS.heading, fontSize: 32, color: COLORS.primary, marginBottom: 8, letterSpacing: 1 },
	subtitle: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.primary },

	errorContainer: {
		backgroundColor: "rgba(255, 0, 0, 0.1)",
		padding: 12,
		borderRadius: 8,
		marginBottom: 16,
		borderLeftWidth: 4,
		borderLeftColor: "#ff4d4d",
		width: "100%",
	},
	errorText: {
		fontFamily: FONTS.body,
		fontSize: 13,
		color: "#cc0000",
	},

	forgotPassword: { marginTop: 24, alignItems: "center", zIndex: 1 },
	forgotPasswordText: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.primary, textDecorationLine: "underline" },
	footer: { flexDirection: "row", justifyContent: "center", marginTop: 24, zIndex: 1 },
	footerText: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.primary },
	footerLink: { fontFamily: FONTS.button, fontSize: 13, color: COLORS.primary, textDecorationLine: "underline" },
});
