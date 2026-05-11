import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Button from "../../components/ui/Button";
import { COLORS, FONTS, TYPOGRAPHY } from "../../constants/theme";
import { useProfile } from "../../hooks/useProfile";

export default function ProfileScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const { displayName, roleDisplay, relation, profileImage, getInitials, handleLogout } = useProfile();

	const renderSettingItem = (icon: any, title: string, onPress: () => void, isLast = false) => (
		<Pressable style={[styles.settingItem, isLast && styles.settingItemNoBorder]} onPress={onPress}>
			<View style={styles.settingIconWrapper}>
				<MaterialCommunityIcons name={icon} size={20} color={COLORS.primary} />
			</View>
			<Text style={styles.settingText}>{title}</Text>
			<MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.primary} />
		</Pressable>
	);

	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
				{/* HEADER */}
				<View style={styles.header}>
					<Text style={styles.titleText}>{t("profile.titlePart1", "Profiel")}</Text>
					<View style={styles.highlightWrapper}>
						<Text style={styles.highlightText}>{t("profile.titlePart2", "& kring")}</Text>
					</View>
				</View>

				<View style={styles.profileSection}>
					<View style={styles.avatarContainer}>
						{profileImage ? (
							<Image source={{ uri: profileImage }} style={styles.avatarImage} />
						) : (
							<View style={styles.avatarInitials}>
								<Text style={styles.initialsText}>{getInitials()}</Text>
							</View>
						)}
						<View style={styles.avatarOverlay} />
					</View>

					<Text style={styles.nameText}>
						{displayName} <Text style={styles.roleText}>({roleDisplay})</Text>
					</Text>
					<Text style={styles.relationText}>{relation ? relation.charAt(0).toUpperCase() + relation.slice(1) : t("profile.unknownRelation", "Onbekend")}</Text>

					<Button title={t("profile.editProfile", "Profiel bewerken")} variant="primary" onPress={() => console.log("Edit profile")} style={{ marginTop: 24, width: "100%" }} />
				</View>

				<View style={styles.cardOuterShadow}>
					<View style={styles.cardInnerShadow}>
						<View style={styles.cardContainer}>
							<Text style={styles.cardTitle}>{t("profile.settings", "Instellingen")}</Text>

							<View style={styles.settingsList}>
								{renderSettingItem("web", t("profile.changeLanguage", "Taal veranderen"), () => console.log("taal"))}
								{renderSettingItem("account-group-outline", t("profile.circleOverview", "Overzicht van de kring"), () => console.log("overzicht"))}
								{renderSettingItem("heart-outline", t("profile.receiverInfo", "Zorgontvanger informatie"), () => console.log("zorgontvanger"))}
								{renderSettingItem("phone-outline", t("profile.emergencyContacts", "Belangrijke contactpersonen"), () => console.log("contacten"), true)}
							</View>

							<Pressable style={styles.logoutContainer} onPress={handleLogout}>
								<View style={styles.logoutIconWrapper}>
									<MaterialCommunityIcons name="logout-variant" size={20} color="#C94B47" />
								</View>
								<Text style={styles.settingText}>{t("profile.logout", "Uitloggen")}</Text>
								<MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.primary} />
							</Pressable>
						</View>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
	scrollContent: { paddingHorizontal: 16, paddingTop: 40, paddingBottom: 60, alignItems: "center" },

	header: { flexDirection: "row", alignItems: "center", marginBottom: 30 },
	titleText: { ...TYPOGRAPHY.h1, color: COLORS.primary, zIndex: 10 },
	highlightWrapper: { backgroundColor: COLORS.accent, paddingHorizontal: 16, paddingVertical: 2, borderRadius: 20, marginLeft: 8 },
	highlightText: { ...TYPOGRAPHY.h1, color: COLORS.primary },

	profileSection: { width: "100%", alignItems: "center", marginBottom: 40 },

	avatarContainer: {
		width: 120,
		height: 120,
		borderRadius: 60,
		marginBottom: 16,
		justifyContent: "center",
		alignItems: "center",
		position: "relative",
	},
	avatarImage: { width: "100%", height: "100%", borderRadius: 60 },
	avatarInitials: {
		width: "100%",
		height: "100%",
		borderRadius: 60,
		backgroundColor: "rgba(176, 248, 0, 0.2)",
		justifyContent: "center",
		alignItems: "center",
	},
	initialsText: { fontFamily: FONTS.heading, fontSize: 36, color: COLORS.primary },
	avatarOverlay: {
		...StyleSheet.absoluteFillObject,
		borderRadius: 60,
		borderWidth: 4,
		borderColor: "rgba(239, 252, 0, 0.6)",
	},

	nameText: { fontFamily: "InterRegular", fontSize: 16, color: COLORS.primary, marginBottom: 4 },
	roleText: { fontFamily: "InterRegular", fontSize: 16, color: COLORS.primary },
	relationText: { fontFamily: "InterRegular", fontSize: 14, color: "#131F00", opacity: 0.6 },

	cardOuterShadow: {
		width: "100%",
		shadowColor: "#354E00",
		shadowOffset: { width: 0, height: 20 },
		shadowOpacity: 0.35,
		shadowRadius: 25,
		elevation: 10,
	},
	cardInnerShadow: {
		shadowColor: "#354E00",
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.24,
		shadowRadius: 10,
		elevation: 5,
		borderRadius: 24,
	},
	cardContainer: {
		backgroundColor: "#FFFFFF",
		borderRadius: 24,
		borderWidth: 1,
		borderColor: "rgba(154, 217, 0, 0.4)",
		overflow: "hidden",
	},

	cardTitle: { fontFamily: "BricolageMedium", fontSize: 18, color: COLORS.primary, padding: 24, paddingBottom: 16 },

	settingsList: { paddingHorizontal: 24, paddingBottom: 16 },
	settingItem: { flexDirection: "row", alignItems: "center", paddingVertical: 16 },
	settingItemNoBorder: { borderBottomWidth: 0 },

	settingIconWrapper: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: "rgba(176, 248, 0, 0.2)",
		justifyContent: "center",
		alignItems: "center",
		marginRight: 16,
	},
	settingText: { flex: 1, fontFamily: "InterRegular", fontSize: 16, color: COLORS.primary },

	logoutContainer: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 24,
		paddingVertical: 20,
		backgroundColor: "#F8FAFC",
		borderTopWidth: 1,
		borderTopColor: "rgba(45, 106, 79, 0.1)",
	},
	logoutIconWrapper: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: "rgba(201, 75, 71, 0.2)",
		justifyContent: "center",
		alignItems: "center",
		marginRight: 16,
	},
});
