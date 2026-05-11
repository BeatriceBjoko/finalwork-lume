import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Image, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Button from "../../components/ui/Button";
import CustomAlert from "../../components/ui/CustomAlert";
import Input from "../../components/ui/Input";
import { COLORS, FONTS, TYPOGRAPHY } from "../../constants/theme";
import { RELATION_KEYS } from "../../hooks/useCreateCircle";
import { useEditProfile } from "../../hooks/useEditProfile";

const PHOTO_SIZE = 130;
const ICON_CIRCLE_SIZE = 48;

const SectionHeader = ({ iconName, title }: { iconName: string; title: string }) => (
	<View style={styles.sectionHeader}>
		<View style={styles.sectionIconWrapper}>
			<MaterialCommunityIcons name={iconName as any} size={24} color={COLORS.primary} />
		</View>
		<Text style={styles.sectionTitle}>{title}</Text>
	</View>
);

export default function EditProfileScreen() {
	const { t } = useTranslation();
	const router = useRouter();

	const { name, setName, email, setEmail, relation, setRelation, password, setPassword, repeatPassword, setRepeatPassword, profileImage, pickImage, isDropdownOpen, setIsDropdownOpen, isLoading, handleSave, alertConfig, setAlertConfig } =
		useEditProfile();

	const onSavePress = async () => {
		await handleSave();
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
				<View style={styles.backButtonContainer}>
					<Pressable onPress={() => router.back()} style={styles.backButton}>
						<Ionicons name="chevron-back" size={28} color={COLORS.primary} />
					</Pressable>
				</View>

				<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
					<View style={styles.titleRow}>
						<Text style={styles.titleText}>{t("editProfile.titlePart1", "Pas mijn")}</Text>
						<View style={styles.highlightWrapper}>
							<Text style={styles.titleText}>{t("editProfile.titlePart2", "profiel aan")}</Text>
						</View>
					</View>

					<View style={styles.photoContainer}>
						<Pressable onPress={pickImage} style={styles.photoGlow}>
							<View style={styles.photoBorder}>
								<View style={styles.photoClip}>
									{profileImage ? (
										<Image source={{ uri: profileImage }} style={styles.photo} />
									) : (
										<View style={styles.initialsBox}>
											<MaterialCommunityIcons name="account" size={60} color={COLORS.primary} />
										</View>
									)}
									<View style={styles.photoInnerGlow} pointerEvents="none" />
								</View>
							</View>
							<View style={styles.cameraBadge}>
								<MaterialCommunityIcons name="camera-plus-outline" size={20} color={COLORS.primary} />
							</View>
						</Pressable>
					</View>

					<View style={styles.section}>
						<SectionHeader iconName="account-outline" title={t("editProfile.sectionProfile", "Profiel")} />
						<Input label={t("editProfile.nameLabel", "Voornaam + naam")} placeholder="Jouw naam" value={name} onChangeText={setName} variant="outline" />
					</View>

					<View style={styles.section}>
						<SectionHeader iconName="phone-outline" title={t("editProfile.sectionContact", "Contact")} />
						<Input label={t("editProfile.emailLabel", "E-mail")} placeholder="jouw@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" variant="outline" />
					</View>

					<View style={styles.section}>
						<SectionHeader iconName="heart-outline" title={t("editProfile.sectionRole", "Zorgrol")} />
						<Text style={styles.inputLabel}>{t("editProfile.relationLabel", "Relatie tot zorgontvanger")}</Text>
						<Pressable style={styles.dropdownButton} onPress={() => setIsDropdownOpen(true)}>
							<Text style={[styles.dropdownButtonText, !relation && { color: "#888" }]}>{relation ? t(`createCircle.relations.${relation}`, relation) : "Kies een relatie"}</Text>
							<MaterialCommunityIcons name="chevron-down" size={24} color={COLORS.primary} />
						</Pressable>
					</View>

					<View style={styles.section}>
						<SectionHeader iconName="cog-outline" title={t("editProfile.sectionSettings", "Instellingen")} />
						<View style={{ gap: 4 }}>
							<Input label={t("editProfile.passwordLabel", "Wachtwoord veranderen")} placeholder="********" value={password} onChangeText={setPassword} secureTextEntry variant="outline" />
							<Input label={t("editProfile.repeatPasswordLabel", "Herhaal wachtwoord")} placeholder="********" value={repeatPassword} onChangeText={setRepeatPassword} secureTextEntry variant="outline" />
						</View>
					</View>

					<View style={styles.footer}>
						<Button title={isLoading ? "Laden..." : t("editProfile.saveBtn", "Profiel opslaan")} onPress={onSavePress} variant="primary" />
					</View>
				</ScrollView>
			</KeyboardAvoidingView>

			<Modal visible={isDropdownOpen} transparent animationType="fade">
				<Pressable style={styles.modalOverlay} onPress={() => setIsDropdownOpen(false)}>
					<View style={styles.modalContent}>
						<ScrollView showsVerticalScrollIndicator={false}>
							{RELATION_KEYS.map((opt) => (
								<Pressable
									key={opt}
									style={styles.modalOption}
									onPress={() => {
										setRelation(opt);
										setIsDropdownOpen(false);
									}}
								>
									<Text style={[styles.modalOptionText, relation === opt && styles.modalOptionTextActive]}>{t(`createCircle.relations.${opt}`, opt)}</Text>
								</Pressable>
							))}
						</ScrollView>
					</View>
				</Pressable>
			</Modal>
			<CustomAlert
				visible={alertConfig.visible}
				title={alertConfig.title}
				message={alertConfig.message}
				onConfirm={() => {
					setAlertConfig({ ...alertConfig, visible: false });

					if (alertConfig.type === "success") {
						router.back();
					}

					if (alertConfig.title === t("createCircle.step1.photoPermissionTitle")) {
						Linking.openSettings();
					}
				}}
				confirmText="OK"
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: COLORS.white },

	backButtonContainer: { width: "100%", paddingHorizontal: 16, paddingTop: 10, zIndex: 10 },
	backButton: { padding: 8, marginLeft: -8, alignSelf: "flex-start" },

	scrollContent: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 60, alignItems: "center" },

	titleRow: { flexDirection: "row", alignItems: "center", marginBottom: 32 },
	titleText: { fontFamily: FONTS.heading, fontSize: 28, color: COLORS.primary, zIndex: 2 },
	highlightWrapper: { backgroundColor: COLORS.accent, paddingHorizontal: 12, paddingVertical: 2, borderRadius: 20, marginLeft: -6, zIndex: 1 },

	photoContainer: { marginBottom: 24, alignItems: "center" },
	photoGlow: { position: "relative", shadowColor: "#EFFC00", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 8 },
	photoBorder: { width: PHOTO_SIZE + 6, height: PHOTO_SIZE + 6, borderRadius: (PHOTO_SIZE + 6) / 2, borderWidth: 3, borderColor: "#EFFC00", justifyContent: "center", alignItems: "center" },
	photoClip: { width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: PHOTO_SIZE / 2, overflow: "hidden", position: "relative" },
	photo: { width: PHOTO_SIZE, height: PHOTO_SIZE },
	initialsBox: { width: PHOTO_SIZE, height: PHOTO_SIZE, backgroundColor: "rgba(176, 248, 0, 0.2)", justifyContent: "center", alignItems: "center" },
	photoInnerGlow: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(239, 252, 0, 0.12)" },

	cameraBadge: {
		position: "absolute",
		bottom: 4,
		right: 4,
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: COLORS.white,
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.15,
		shadowRadius: 4,
		elevation: 4,
		borderWidth: 1,
		borderColor: "rgba(35, 54, 0, 0.1)",
	},

	section: { width: "100%", marginBottom: 16 },
	sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
	sectionIconWrapper: {
		width: ICON_CIRCLE_SIZE,
		height: ICON_CIRCLE_SIZE,
		borderRadius: ICON_CIRCLE_SIZE / 2,
		backgroundColor: "rgba(176, 248, 0, 0.2)",
		justifyContent: "center",
		alignItems: "center",
		marginRight: 12,
	},
	sectionTitle: { fontFamily: "BricolageMedium", fontSize: 18, color: COLORS.primary },

	inputLabel: { ...TYPOGRAPHY.h4, marginBottom: 8 },
	dropdownButton: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#233600",
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 14,
		backgroundColor: "#FFFFFF",
	},
	dropdownButtonText: { fontFamily: "InterRegular", fontSize: 16, color: COLORS.primary },

	modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", paddingHorizontal: 24 },
	modalContent: { backgroundColor: "#FFF", borderRadius: 16, maxHeight: 400, paddingVertical: 10, elevation: 10 },
	modalOption: { paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
	modalOptionText: { fontFamily: "InterRegular", fontSize: 16, color: COLORS.primary },
	modalOptionTextActive: { fontFamily: "InterBold", color: "#6F9F00" },

	footer: { width: "100%", marginTop: 10 },
});
