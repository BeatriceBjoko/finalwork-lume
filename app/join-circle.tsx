import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Image, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Button from "../components/ui/Button";
import CustomAlert from "../components/ui/CustomAlert";
import Input from "../components/ui/Input";
import ShadowCard from "../components/ui/ShadowCard";
import { COLORS, FONTS, TYPOGRAPHY } from "../constants/theme";
import { useJoinCircle } from "../hooks/useJoinCircle";

export default function JoinCircle() {
	const { t } = useTranslation();
	const router = useRouter();
	const inputRef = useRef<TextInput>(null);

	const {
		inviteCode,
		setInviteCode,
		relation,
		handleRelationSelect,
		customRelation,
		setCustomRelation,
		isDropdownOpen,
		setIsDropdownOpen,
		relationOptions,
		selectedRelationLabel,
		profileImage,
		pickImage,
		handleJoinSubmit,
		isLoading,
		alertConfig,
		closeAlert,
		isPermissionAlertVisible,
		setIsPermissionAlertVisible,
	} = useJoinCircle();

	const handleCodeChange = (text: string) => {
		setInviteCode(
			text
				.toUpperCase()
				.replaceAll(/[^A-Z0-9]/g, "")
				.slice(0, 6),
		);
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
					<View style={styles.header}>
						<Text style={styles.titleText}>{t("joinCircle.titlePart1", "Word lid van een")}</Text>
						<View style={styles.highlightWrapper}>
							<Text style={styles.highlightText}>{t("joinCircle.titlePart2", "zorgkring")}</Text>
						</View>
					</View>

					<Text style={styles.subtitle}>{t("joinCircle.subtitle", "Voer je uitnodigingscode in en stel je profiel in")}</Text>

					<View style={styles.formContainer}>
						<Text style={styles.label}>{t("joinCircle.codeLabel", "Uitnodigingscode")}</Text>

						<View style={styles.codeWrapperRow}>
							<Text style={styles.lumePrefix}>LUME -</Text>

							<Pressable style={styles.codeBoxesContainer} onPress={() => inputRef.current?.focus()}>
								{[0, 1, 2, 3, 4, 5].map((index) => (
									<View key={index} style={[styles.codeBox, inviteCode.length === index && styles.codeBoxActive]}>
										<Text style={styles.codeText}>{inviteCode[index] || ""}</Text>
									</View>
								))}
								<TextInput ref={inputRef} style={styles.hiddenInput} value={inviteCode} onChangeText={handleCodeChange} maxLength={6} keyboardType="default" autoCapitalize="characters" autoCorrect={false} caretHidden={true} />
							</Pressable>
						</View>

						<ShadowCard style={{ marginTop: 20 }}>
							<View style={styles.cardHeader}>
								<View style={styles.iconWrapper}>
									<MaterialCommunityIcons name="account-heart-outline" size={28} color={COLORS.primary} />
								</View>
								<Text style={styles.cardTitle}>{t("joinCircle.cardTitle", "Jouw rol in de zorgkring")}</Text>
							</View>

							<Text style={styles.label}>
								{t("createCircle.step1.relationLabel", "Relatie tot zorgontvanger")} <Text style={{ color: "red" }}>*</Text>
							</Text>
							<Pressable style={styles.dropdownButton} onPress={() => setIsDropdownOpen(true)}>
								<Text style={[styles.dropdownButtonText, !relation && { color: "#888" }]}>{selectedRelationLabel}</Text>
								<MaterialCommunityIcons name="chevron-down" size={24} color={COLORS.primary} />
							</Pressable>

							{relation === "andere" && (
								<View style={{ marginTop: 10 }}>
									<Input
										label={t("createCircle.step1.specifyRelationLabel", "Specificeer je relatie")}
										variant="outline"
										isRequired={true}
										placeholder={t("createCircle.step1.specifyRelationPlaceholder", "Bijv. Buurman")}
										value={customRelation}
										onChangeText={setCustomRelation}
									/>
								</View>
							)}

							<Text style={styles.label}>
								{t("createCircle.step1.profilePhotoLabel", "Profielfoto")} <Text style={styles.optionalText}>{t("createCircle.step1.optional", "(optioneel)")}</Text>
							</Text>
							<Pressable style={styles.imagePickerBox} onPress={pickImage}>
								{profileImage ? (
									<Image source={{ uri: profileImage }} style={styles.previewImage} />
								) : (
									<>
										<View style={styles.cameraIconWrapper}>
											<MaterialCommunityIcons name="camera-plus-outline" size={24} color={COLORS.primary} />
										</View>
										<Text style={styles.imagePickerText}>{t("createCircle.step1.uploadText", "Tik om een afbeelding te uploaden")}</Text>
									</>
								)}
							</Pressable>
						</ShadowCard>
					</View>

					<View style={styles.footer}>
						<Button title={isLoading ? "..." : t("joinCircle.button", "Toetreden")} onPress={handleJoinSubmit} variant="primary" disabled={isLoading} />
						<View style={styles.infoRow}>
							<MaterialCommunityIcons name="information-outline" size={20} color={COLORS.primary} />
							<Text style={styles.infoText}>{t("joinCircle.noCode", "Geen code? Vraag de beheerder om een uitnodiging")}</Text>
						</View>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>

			<Modal visible={isDropdownOpen} transparent animationType="fade">
				<Pressable style={styles.modalOverlay} onPress={() => setIsDropdownOpen(false)}>
					<View style={styles.modalContent}>
						<ScrollView showsVerticalScrollIndicator={false}>
							{relationOptions.map((opt) => (
								<Pressable key={opt.value} style={styles.modalOption} onPress={() => handleRelationSelect(opt.value)}>
									<Text style={[styles.modalOptionText, relation === opt.value && styles.modalOptionTextActive]}>{opt.label}</Text>
								</Pressable>
							))}
						</ScrollView>
					</View>
				</Pressable>
			</Modal>

			<CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} confirmText="OK" onConfirm={closeAlert} />

			<CustomAlert
				visible={isPermissionAlertVisible}
				title={t("createCircle.step1.photoPermissionTitle", "Toegang nodig")}
				message={t("createCircle.step1.photoPermissionMessage", "We hebben toegang tot je foto's nodig.")}
				confirmText={t("createCircle.step1.photoPermissionButton", "OK")}
				onConfirm={() => {
					setIsPermissionAlertVisible(false);
					Linking.openSettings();
				}}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: "#FFFFFF" },

	backButtonContainer: {
		width: "100%",
		paddingHorizontal: 16,
		paddingTop: 10,
		zIndex: 10,
	},
	backButton: {
		padding: 8,
		marginLeft: -8,
		alignSelf: "flex-start",
	},

	scrollContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 40, alignItems: "center" },

	header: { alignItems: "center", marginBottom: 20 },
	titleText: { ...TYPOGRAPHY.h1, color: COLORS.primary, zIndex: 10 },
	highlightWrapper: { backgroundColor: COLORS.accent, paddingHorizontal: 16, paddingVertical: 2, borderRadius: 20, marginTop: -5 },
	highlightText: { ...TYPOGRAPHY.h1, color: COLORS.primary },

	subtitle: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.primary, textAlign: "center", marginBottom: 30, lineHeight: 20, marginTop: 10 },

	formContainer: { width: "100%", marginBottom: 20 },
	label: { ...TYPOGRAPHY.h4, marginBottom: 8, marginTop: 10 },
	optionalText: { fontFamily: FONTS.body, fontSize: 14, fontWeight: "normal" },

	codeWrapperRow: {
		flexDirection: "row",
		alignItems: "center",
		width: "100%",
		marginBottom: 10,
	},
	lumePrefix: {
		fontFamily: FONTS.heading,
		fontSize: 18,
		color: "rgba(35, 54, 0, 0.92)",
		marginRight: 8,
	},
	codeBoxesContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		flex: 1,
		position: "relative",
	},
	codeBox: {
		width: "14%",
		aspectRatio: 1,
		borderWidth: 1.5,
		borderColor: COLORS.primary,
		borderRadius: 12,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: COLORS.white,
	},
	codeBoxActive: {
		borderColor: "#6F9F00",
		borderWidth: 2,
		backgroundColor: "rgba(111, 159, 0, 0.05)",
	},
	codeText: {
		fontFamily: FONTS.heading,
		fontSize: 24,
		color: COLORS.primary,
	},
	hiddenInput: {
		position: "absolute",
		width: "100%",
		height: "100%",
		opacity: 0,
	},

	cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20, zIndex: 2 },
	iconWrapper: {
		width: 54,
		height: 54,
		borderRadius: 27,
		backgroundColor: "rgba(176, 248, 0, 0.2)",
		justifyContent: "center",
		alignItems: "center",
		marginRight: 10,
	},
	cardTitle: { fontFamily: "BricolageGrotesque-Medium", fontSize: 18, color: "#000000" },

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
	dropdownButtonText: { fontFamily: FONTS.body, fontSize: 15, color: COLORS.primary },

	modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", paddingHorizontal: 24 },
	modalContent: { backgroundColor: "#FFF", borderRadius: 16, maxHeight: 400, paddingVertical: 10, elevation: 10 },
	modalOption: { paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
	modalOptionText: { fontFamily: FONTS.body, fontSize: 16, color: COLORS.primary },
	modalOptionTextActive: { fontFamily: FONTS.button, color: "#6F9F00" },

	imagePickerBox: {
		borderWidth: 1.5,
		borderColor: "rgba(35, 54, 0, 0.8)",
		borderStyle: "dashed",
		borderRadius: 16,
		height: 280,
		justifyContent: "center",
		alignItems: "center",
		marginTop: 10,
		backgroundColor: "rgba(76, 175, 80, 0.05)",
	},
	cameraIconWrapper: {
		width: 54,
		height: 54,
		borderRadius: 27,
		backgroundColor: "#FFFFFF",
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
		marginBottom: 10,
	},
	imagePickerText: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.primary },
	previewImage: { width: "100%", height: "100%", borderRadius: 14 },

	footer: { width: "100%", marginTop: 10 },
	infoRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 12 },
	infoText: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.primary, marginLeft: 6 },
});
