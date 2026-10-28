import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Button from "../components/ui/Button";
import Checkbox from "../components/ui/Checkbox";
import { LEGAL_VERSION } from "../constants/legal";
import { COLORS, FONTS } from "../constants/theme";
import { useSession } from "../context";
import { acceptLegalTerms } from "../lib/firebase-service";

// Shown to accounts that have not agreed to the current privacy policy and terms yet
// (accounts made before version 1.0, or after an important change of the texts)
export default function ConsentScreen() {
	const { t } = useTranslation();
	const { user, userData, signOut } = useSession();
	const [termsAccepted, setTermsAccepted] = useState(false);
	const [healthConsent, setHealthConsent] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");

	if (!user) return <Redirect href="/sign-in" />;
	if (userData?.consent?.version === LEGAL_VERSION) return <Redirect href="/" />;

	const handleAccept = async () => {
		setErrorMessage("");
		setIsSaving(true);
		try {
			await acceptLegalTerms();
			router.replace("/");
		} catch (error) {
			console.error("Fout bij bewaren akkoord:", error);
			setErrorMessage(t("consent.error"));
		} finally {
			setIsSaving(false);
		}
	};

	const TermsLabel = (
		<Text style={styles.checkText}>
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
		<SafeAreaView style={styles.safeArea}>
			<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
				<View style={styles.iconCircle}>
					<MaterialCommunityIcons name="shield-check-outline" size={30} color={COLORS.primary} />
				</View>
				<Text style={styles.title}>{t("consent.title")}</Text>
				<Text style={styles.body}>{t("consent.body")}</Text>

				<View style={styles.card}>
					<Checkbox checked={termsAccepted} onChange={setTermsAccepted} label={TermsLabel} />
					<Checkbox checked={healthConsent} onChange={setHealthConsent} label={<Text style={styles.checkText}>{t("signup.healthConsent")}</Text>} />
				</View>

				{errorMessage !== "" && <Text style={styles.errorText}>{errorMessage}</Text>}

				<Button title={isSaving ? t("consent.saving") : t("consent.button")} onPress={handleAccept} disabled={isSaving || !termsAccepted || !healthConsent} />

				<Text style={styles.secondaryLink} onPress={signOut}>
					{t("consent.logout")}
				</Text>

				<Text style={styles.hint}>
					{t("consent.deleteHint")}{" "}
					<Text style={styles.deleteLink} onPress={() => router.push("/delete-account")}>
						{t("consent.deleteLink")}
					</Text>
				</Text>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: COLORS.white },
	scrollContent: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40 },
	iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(176, 248, 0, 0.2)", justifyContent: "center", alignItems: "center", alignSelf: "center", marginBottom: 16 },
	title: { fontFamily: FONTS.heading, fontSize: 28, color: COLORS.primary, textAlign: "center", marginBottom: 12 },
	body: { fontFamily: FONTS.body, fontSize: 15, color: COLORS.primary, lineHeight: 22, textAlign: "center", marginBottom: 24 },
	card: { borderWidth: 1, borderColor: "rgba(35, 54, 0, 0.12)", borderRadius: 16, padding: 16, paddingBottom: 4, marginBottom: 20, backgroundColor: COLORS.background },
	checkText: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.primary, lineHeight: 19 },
	linkText: { textDecorationLine: "underline", fontFamily: FONTS.button },
	errorText: { fontFamily: FONTS.body, fontSize: 13, color: "#C94B47", textAlign: "center", marginBottom: 12 },
	secondaryLink: { fontFamily: FONTS.button, fontSize: 14, color: COLORS.primary, textAlign: "center", marginTop: 20, textDecorationLine: "underline" },
	hint: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.primary, textAlign: "center", marginTop: 16, opacity: 0.8, lineHeight: 19 },
	deleteLink: { color: "#C94B47", textDecorationLine: "underline" },
});
