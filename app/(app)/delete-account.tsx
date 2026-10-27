import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { COLORS, FONTS } from "../../constants/theme";
import { useDeleteAccount } from "../../hooks/useDeleteAccount";

const DANGER = "#C94B47";
const ICON_CIRCLE_SIZE = 44;

function Section({ icon, title, danger, children }: { icon: string; title: string; danger?: boolean; children: React.ReactNode }) {
	return (
		<View style={[styles.card, danger && styles.cardDanger]}>
			<View style={styles.cardHeader}>
				<View style={[styles.iconCircle, danger && styles.iconCircleDanger]}>
					<MaterialCommunityIcons name={icon as any} size={22} color={danger ? DANGER : COLORS.primary} />
				</View>
				<Text style={[styles.cardTitle, danger && styles.textDanger]}>{title}</Text>
			</View>
			{children}
		</View>
	);
}

export default function DeleteAccountScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const { outcome, newAdminName, isLoadingPlan, password, setPassword, isDeleting, confirmDelete } = useDeleteAccount();

	const whatItems = t("deleteAccount.whatItems", { returnObjects: true }) as string[];
	const circleText = outcome === "transfer" ? t("deleteAccount.transfer", { name: newAdminName || "?" }) : outcome ? t(`deleteAccount.${outcome}`) : "";
	const circleDeleted = outcome === "deleteCircle";

	// The password field is at the bottom: when the keyboard opens, scroll so that its label
	// is at the top of the visible area, with the field and the button underneath
	const scrollRef = useRef<ScrollViewInstance>(null);
	const passwordBlockY = useRef(0);
	useEffect(() => {
		const subscription = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", () => {
			setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(0, passwordBlockY.current - 16), animated: true }), Platform.OS === "ios" ? 50 : 100);
		});
		return () => subscription.remove();
	}, []);

	return (
		<SafeAreaView style={styles.safeArea}>
			<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
				<View style={styles.backButtonContainer}>
					<Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
						<Ionicons name="chevron-back" size={28} color={COLORS.primary} />
					</Pressable>
				</View>

				<ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
					<View style={styles.titleRow}>
						<Text style={styles.titleText}>{t("deleteAccount.titlePart1")}</Text>
						<View style={styles.highlightWrapper}>
							<Text style={styles.titleText}>{t("deleteAccount.titlePart2")}</Text>
						</View>
					</View>

					<Section icon="delete-outline" title={t("deleteAccount.whatTitle")}>
						{Array.isArray(whatItems) &&
							whatItems.map((item) => (
								<View key={item} style={styles.bulletRow}>
									<Text style={styles.bullet}>•</Text>
									<Text style={styles.bodyText}>{item}</Text>
								</View>
							))}
					</Section>

					<Section icon={circleDeleted ? "alert-outline" : "account-group-outline"} title={t("deleteAccount.circleTitle")} danger={circleDeleted}>
						{isLoadingPlan ? <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 8 }} /> : <Text style={[styles.bodyText, circleDeleted && styles.textDanger]}>{circleText}</Text>}
					</Section>

					<Section icon="clock-outline" title={t("deleteAccount.whenTitle")}>
						<Text style={styles.bodyText}>{t("deleteAccount.when")}</Text>
					</Section>

					<View style={styles.passwordBlock} onLayout={(e) => (passwordBlockY.current = e.nativeEvent.layout.y)}>
						<Input label={t("deleteAccount.passwordLabel")} value={password} onChangeText={setPassword} secureTextEntry variant="outline" placeholder="••••••••" autoCapitalize="none" />
					</View>

					<Button
						title={isDeleting ? t("deleteAccount.deleting") : t("deleteAccount.button")}
						onPress={confirmDelete}
						disabled={!password || isDeleting || isLoadingPlan}
						style={styles.deleteButton}
						textStyle={styles.deleteButtonText}
					/>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: COLORS.white },
	backButtonContainer: { width: "100%", paddingHorizontal: 16, paddingTop: 10, zIndex: 10 },
	backButton: { padding: 8, marginLeft: -8, alignSelf: "flex-start" },
	scrollContent: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 60 },
	titleRow: { flexDirection: "row", alignItems: "center", alignSelf: "center", marginBottom: 28 },
	titleText: { fontFamily: FONTS.heading, fontSize: 28, color: COLORS.primary, zIndex: 2 },
	highlightWrapper: { backgroundColor: COLORS.accent, paddingHorizontal: 12, paddingVertical: 2, borderRadius: 20, marginLeft: 6, zIndex: 1 },

	card: { borderWidth: 1, borderColor: "rgba(35, 54, 0, 0.12)", borderRadius: 16, padding: 16, marginBottom: 14, backgroundColor: COLORS.background },
	cardDanger: { borderColor: "rgba(201, 75, 71, 0.45)", backgroundColor: "rgba(201, 75, 71, 0.06)" },
	cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
	iconCircle: { width: ICON_CIRCLE_SIZE, height: ICON_CIRCLE_SIZE, borderRadius: ICON_CIRCLE_SIZE / 2, backgroundColor: "rgba(176, 248, 0, 0.2)", justifyContent: "center", alignItems: "center", marginRight: 12 },
	iconCircleDanger: { backgroundColor: "rgba(201, 75, 71, 0.15)" },
	cardTitle: { flex: 1, fontFamily: "BricolageMedium", fontSize: 17, color: COLORS.primary },
	bulletRow: { flexDirection: "row", marginBottom: 4 },
	bullet: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.primary, marginRight: 8, lineHeight: 21 },
	bodyText: { flex: 1, fontFamily: FONTS.body, fontSize: 14, color: COLORS.primary, lineHeight: 21 },
	textDanger: { color: DANGER },

	passwordBlock: { marginTop: 10 },
	deleteButton: { backgroundColor: DANGER, shadowColor: DANGER },
	deleteButtonText: { color: COLORS.white },
});
