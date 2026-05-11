import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Button from "../../components/ui/Button";
import { COLORS, FONTS } from "../../constants/theme";
import { useProfile } from "../../hooks/useProfile";

const PHOTO_SIZE = 130;
const ICON_CIRCLE_SIZE = 44;

type MenuItemProps = {
	iconName: string;
	label: string;
	onPress: () => void;
	iconColor?: string;
	iconBg?: string;
};

function MenuItem({ iconName, label, onPress, iconColor = COLORS.iconColor, iconBg = "rgba(176, 248, 0, 0.2)" }: MenuItemProps) {
	return (
		<Pressable style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]} onPress={onPress}>
			<View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
				<MaterialCommunityIcons name={iconName as any} size={20} color={iconColor} />
			</View>
			<Text style={styles.menuLabel}>{label}</Text>
			<Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
		</Pressable>
	);
}

export default function ProfileScreen() {
	const { t } = useTranslation();
	const { displayName, roleDisplay, relationDisplay, profileImage, getInitials, handleLogout, isLangModalVisible, setLangModalVisible, changeLanguage, currentLanguage } = useProfile();

	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
				<View style={styles.topSection}>
					<View style={styles.titleRow}>
						<Text style={styles.titleText}>{t("profile.titlePart1", "Profiel")}</Text>
						<View style={styles.highlightWrapper}>
							<Text style={styles.titleText}>{t("profile.titlePart2", "& kring")}</Text>
						</View>
					</View>

					<View style={styles.photoGlow}>
						<View style={styles.photoBorder}>
							<View style={styles.photoClip}>
								{profileImage ? (
									<Image source={{ uri: profileImage }} style={styles.photo} />
								) : (
									<View style={styles.initialsBox}>
										<Text style={styles.initialsText}>{getInitials()}</Text>
									</View>
								)}
								<View style={styles.photoInnerGlow} pointerEvents="none" />
							</View>
						</View>
					</View>

					<Text style={styles.nameText}>
						{displayName}
						{roleDisplay ? ` (${roleDisplay})` : ""}
					</Text>

					<Text style={styles.relationText}>{relationDisplay}</Text>

					<View style={styles.editBtn}>
						<Button title={t("profile.editProfile", "Profiel bewerken")} onPress={() => {}} variant="primary" />
					</View>
				</View>

				<View style={styles.cardOuter}>
					<View style={styles.cardInner}>
						<View style={styles.card}>
							<Text style={styles.cardTitle}>{t("profile.settings", "Instellingen")}</Text>

							<MenuItem iconName="web" label={t("profile.changeLanguage", "Taal veranderen")} onPress={() => setLangModalVisible(true)} />
							<MenuItem iconName="account-group-outline" label={t("profile.circleOverview", "Overzicht van de kring")} onPress={() => {}} />
							<MenuItem iconName="account-heart-outline" label={t("profile.receiverInfo", "Zorgontvanger informatie")} onPress={() => {}} />
							<MenuItem iconName="phone-outline" label={t("profile.emergencyContacts", "Belangrijke contactpersonen")} onPress={() => {}} />

							<View style={styles.logoutSeparator} />

							<Pressable style={({ pressed }) => [styles.logoutRow, pressed && { opacity: 0.7 }]} onPress={handleLogout}>
								<View style={[styles.iconCircle, styles.logoutCircle]}>
									<MaterialCommunityIcons name="logout-variant" size={20} color="#C94B47" />
								</View>
								<Text style={styles.menuLabel}>{t("profile.logout", "Uitloggen")}</Text>
								<Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
							</Pressable>
						</View>
					</View>
				</View>
			</ScrollView>

			<Modal visible={isLangModalVisible} transparent animationType="fade">
				<Pressable style={styles.modalOverlay} onPress={() => setLangModalVisible(false)}>
					<View style={styles.modalContent}>
						<Text style={styles.modalTitle}>{t("profile.changeLanguage", "Taal veranderen")}</Text>

						<Pressable style={styles.modalOption} onPress={() => changeLanguage("nl")}>
							<Text style={[styles.modalOptionText, currentLanguage === "nl" && styles.modalOptionTextActive]}>🇳🇱 Nederlands</Text>
							{currentLanguage === "nl" && <MaterialCommunityIcons name="check-circle" size={20} color="#6F9F00" />}
						</Pressable>

						<Pressable style={[styles.modalOption, { borderBottomWidth: 0 }]} onPress={() => changeLanguage("fr")}>
							<Text style={[styles.modalOptionText, currentLanguage === "fr" && styles.modalOptionTextActive]}>🇫🇷 Français</Text>
							{currentLanguage === "fr" && <MaterialCommunityIcons name="check-circle" size={20} color="#6F9F00" />}
						</Pressable>
					</View>
				</Pressable>
			</Modal>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: COLORS.background },
	scrollContent: { paddingTop: 40, paddingBottom: 0 },
	topSection: { paddingHorizontal: 24, alignItems: "center", width: "100%" },
	titleRow: { flexDirection: "row", alignItems: "center", marginBottom: 32 },
	titleText: { fontFamily: FONTS.heading, fontSize: 28, color: COLORS.primary, zIndex: 2 },
	highlightWrapper: { backgroundColor: COLORS.accent, paddingHorizontal: 12, paddingVertical: 2, borderRadius: 20, marginLeft: -6, zIndex: 1 },
	photoGlow: { marginBottom: 16, shadowColor: "#EFFC00", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 8 },
	photoBorder: { width: PHOTO_SIZE + 6, height: PHOTO_SIZE + 6, borderRadius: (PHOTO_SIZE + 6) / 2, borderWidth: 3, borderColor: "#EFFC00", justifyContent: "center", alignItems: "center" },
	photoClip: { width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: PHOTO_SIZE / 2, overflow: "hidden", position: "relative" },
	photo: { width: PHOTO_SIZE, height: PHOTO_SIZE },
	initialsBox: { width: PHOTO_SIZE, height: PHOTO_SIZE, backgroundColor: "rgba(176, 248, 0, 0.2)", justifyContent: "center", alignItems: "center" },
	initialsText: { fontFamily: FONTS.heading, fontSize: 34, color: COLORS.primary },
	photoInnerGlow: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(239, 252, 0, 0.12)" },
	nameText: { fontFamily: "InterRegular", fontSize: 16, color: COLORS.primary, textAlign: "center", marginBottom: 4 },
	relationText: { fontFamily: "InterRegular", fontSize: 14, color: "#131F00", opacity: 0.6, textAlign: "center", marginBottom: 24 },
	editBtn: { width: "100%", paddingHorizontal: 8, marginBottom: 32 },
	cardOuter: { width: "100%", shadowColor: "#354E00", shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 12 },
	cardInner: { shadowColor: "#354E00", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 6 },
	card: {
		backgroundColor: COLORS.white,
		borderTopLeftRadius: 32,
		borderTopRightRadius: 32,
		borderBottomLeftRadius: 0,
		borderBottomRightRadius: 0,
		borderTopWidth: 1,
		borderLeftWidth: 0,
		borderRightWidth: 0,
		borderBottomWidth: 0,
		borderColor: "rgba(154, 217, 0, 0.4)",
		paddingTop: 24,
		paddingBottom: 60,
	},
	cardTitle: { fontFamily: "BricolageMedium", fontSize: 18, color: COLORS.primary, paddingHorizontal: 24, marginBottom: 8 },
	menuItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingVertical: 14, gap: 14 },
	iconCircle: {
		width: ICON_CIRCLE_SIZE,
		height: ICON_CIRCLE_SIZE,
		borderRadius: ICON_CIRCLE_SIZE / 2,
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#354E00",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.15,
		shadowRadius: 4,
		elevation: 2,
	},
	menuLabel: { flex: 1, fontFamily: "InterRegular", fontSize: 16, color: COLORS.primary },
	logoutSeparator: { height: 1, backgroundColor: "rgba(45, 106, 79, 0.1)", marginTop: 4 },
	logoutRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingVertical: 18, gap: 14, backgroundColor: "#f8fafc8d" },
	logoutCircle: { backgroundColor: "rgba(201, 75, 71, 0.2)", shadowOpacity: 0, elevation: 0 },

	modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", paddingHorizontal: 24 },
	modalContent: { backgroundColor: "#FFF", borderRadius: 16, padding: 20, elevation: 10 },
	modalTitle: { fontFamily: "BricolageMedium", fontSize: 18, color: COLORS.primary, marginBottom: 16, textAlign: "center" },
	modalOption: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
	modalOptionText: { fontFamily: "InterRegular", fontSize: 16, color: COLORS.primary },
	modalOptionTextActive: { fontFamily: "InterBold", color: "#6F9F00" },
});
