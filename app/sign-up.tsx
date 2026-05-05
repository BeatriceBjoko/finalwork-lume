import { Link, router } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ImageBackground, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import Button from "../components/ui/Button";
import Checkbox from "../components/ui/Checkbox";
import GlassCard from "../components/ui/GlassCard";
import Input from "../components/ui/Input";
import { COLORS, FONTS } from "../constants/theme";
import { useSignUp } from "../hooks/useSignUp";

export default function SignUp() {
	const { t } = useTranslation();
	const { name, setName, email, setEmail, password, setPassword, termsAccepted, setTermsAccepted, isSubmitting, handleSignUpPress } = useSignUp();

	const TermsLabel = (
		<Text style={styles.termsText}>
			{t("signup.termsStart")}
			<Text style={styles.linkText} onPress={() => router.push("/legal?tab=privacy")}>
				{t("signup.termsPrivacy")}
			</Text>
			{t("signup.termsAnd")}
			<Text style={styles.linkText} onPress={() => router.push("/legal?tab=terms")}>
				{t("signup.termsTerms")}
			</Text>
		</Text>
	);

	return (
		<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
			<ImageBackground source={require("../assets/images/signup-bg.jpg")} style={styles.background} resizeMode="cover">
				<View style={styles.spacer} />

				<GlassCard>
					<View style={styles.header}>
						<Text style={styles.title}>{t("signup.title")}</Text>
						<Text style={styles.subtitle}>{t("signup.subtitle")}</Text>
					</View>

					<Input label={t("signup.namePlaceholder")} placeholder="Beatrice Bjoko" value={name} onChangeText={setName} autoCapitalize="words" />

					<Input label={t("signup.email")} placeholder="beatricebjoko@gmail.be" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

					<Input label={t("signup.password")} placeholder="**********" value={password} onChangeText={setPassword} secureTextEntry />

					<Checkbox checked={termsAccepted} onChange={setTermsAccepted} label={TermsLabel} />

					<Text style={styles.securityNote}>{t("signup.securityNote")}</Text>

					<Button title={isSubmitting ? t("signup.buttonLoading") : t("signup.button")} onPress={handleSignUpPress} disabled={isSubmitting || !termsAccepted} style={{ marginTop: 8 }} />

					<View style={styles.footer}>
						<Text style={styles.footerText}>{t("signup.alreadyAccount")}</Text>
						<Link href="/sign-in" asChild>
							<Pressable>
								<Text style={styles.footerLink}>{t("signup.loginLink")}</Text>
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
	header: { alignItems: "center", marginBottom: 32, zIndex: 1 },
	title: {
		fontFamily: FONTS.heading,
		fontSize: 28,
		color: COLORS.primary,
		marginBottom: 8,
		letterSpacing: 0.5,
	},
	subtitle: {
		fontFamily: FONTS.body,
		fontSize: 14,
		color: COLORS.primary,
	},
	termsText: {
		fontSize: 12,
		color: "black",
		lineHeight: 18,
		fontStyle: "italic",
	},
	linkText: {
		color: COLORS.primary,
		textDecorationLine: "underline",
		fontStyle: "italic",
	},
	securityNote: {
		fontFamily: FONTS.body,
		fontSize: 11,
		color: COLORS.primary,
		textAlign: "center",
		opacity: 0.8,
		marginBottom: 16,
	},
	footer: {
		flexDirection: "row",
		justifyContent: "center",
		marginTop: 24,
		zIndex: 1,
	},
	footerText: {
		fontFamily: FONTS.body,
		fontSize: 13,
		color: COLORS.primary,
	},
	footerLink: {
		fontFamily: FONTS.button,
		fontSize: 13,
		color: COLORS.primary,
		textDecorationLine: "underline",
	},
});
