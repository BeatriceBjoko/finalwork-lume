import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import ShadowCard from "../components/ui/ShadowCard";
import StepIndicator from "../components/ui/StepIndicator";
import { COLORS, FONTS, TYPOGRAPHY } from "../constants/theme";
import { useCreateCircle } from "../hooks/useCreateCircle";

const RequiredLabel = ({ text }: { text: string }) => (
	<Text style={styles.label}>
		{text} <Text style={{ color: "red" }}>*</Text>
	</Text>
);

export default function CreateCircleStep1() {
	const { t } = useTranslation();

	const {
		circleName,
		setCircleName,
		receiverName,
		setReceiverName,
		relation,
		handleRelationSelect,
		customRelation,
		setCustomRelation,
		isDropdownOpen,
		setIsDropdownOpen,
		relationOptions,
		selectedRelationLabel,
		handleNext,
		errorMessage,
		profileImage,
		pickImage,
	} = useCreateCircle();

	return (
		<SafeAreaView style={styles.safeArea}>
			<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
				<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
					<View style={styles.header}>
						<Text style={styles.titleText}>{t("createCircle.step1.titlePart1")}</Text>
						<View style={styles.highlightWrapper}>
							<Text style={styles.highlightText}>{t("createCircle.step1.titlePart2")}</Text>
						</View>
					</View>

					<StepIndicator currentStep={1} totalSteps={2} />

					<Text style={styles.subtitle}>{t("createCircle.step1.subtitle")}</Text>

					<View style={styles.formContainer}>
						<Input label={t("createCircle.step1.circleNameLabel")} variant="outline" isRequired={true} placeholder={t("createCircle.step1.circleNamePlaceholder")} value={circleName} onChangeText={setCircleName} />

						<ShadowCard>
							<View style={styles.cardHeader}>
								<View style={styles.iconWrapper}>
									<MaterialCommunityIcons name="account-heart-outline" size={28} color={COLORS.primary} />
								</View>
								<Text style={styles.cardTitle}>{t("createCircle.step1.receiverCardTitle")}</Text>
							</View>

							<Input label={t("createCircle.step1.receiverNameLabel")} variant="outline" isRequired={true} placeholder={t("createCircle.step1.receiverNamePlaceholder")} value={receiverName} onChangeText={setReceiverName} />
							<Text style={styles.label}>
								{t("createCircle.step1.relationLabel")} <Text style={{ color: "red" }}>*</Text>
							</Text>
							<Pressable style={styles.dropdownButton} onPress={() => setIsDropdownOpen(true)}>
								<Text style={[styles.dropdownButtonText, !relation && { color: "#888" }]}>{selectedRelationLabel}</Text>
								<MaterialCommunityIcons name="chevron-down" size={24} color={COLORS.primary} />
							</Pressable>

							{relation === "andere" && (
								<View style={{ marginTop: 10 }}>
									<Input label={t("createCircle.step1.specifyRelationLabel")} variant="outline" isRequired={true} placeholder={t("createCircle.step1.specifyRelationPlaceholder")} value={customRelation} onChangeText={setCustomRelation} />
								</View>
							)}

							<Text style={styles.label}>
								{t("createCircle.step1.profilePhotoLabel")} <Text style={styles.optionalText}>{t("createCircle.step1.optional")}</Text>{" "}
							</Text>
							<Pressable style={styles.imagePickerBox} onPress={pickImage}>
								{profileImage ? (
									<Image source={{ uri: profileImage }} style={styles.previewImage} />
								) : (
									<>
										<View style={styles.cameraIconWrapper}>
											<MaterialCommunityIcons name="camera-plus-outline" size={24} color={COLORS.primary} />
										</View>
										<Text style={styles.imagePickerText}>{t("createCircle.step1.uploadText")}</Text>
									</>
								)}
							</Pressable>
						</ShadowCard>
					</View>

					{errorMessage !== "" && (
						<View style={styles.errorContainer}>
							<Text style={styles.errorText}>{errorMessage}</Text>
						</View>
					)}

					<View style={styles.footer}>
						<Button title={t("createCircle.step1.nextButton")} onPress={handleNext} variant="primary" />
						<View style={styles.infoRow}>
							<MaterialCommunityIcons name="information-outline" size={20} color={COLORS.primary} />
							<Text style={styles.infoText}>{t("createCircle.step1.infoText")}</Text>
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
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
	scrollContent: { paddingHorizontal: 16, paddingTop: 40, paddingBottom: 40, alignItems: "center" },

	header: { alignItems: "center", marginBottom: 20 },
	titleText: { ...TYPOGRAPHY.h1, color: COLORS.primary, zIndex: 10 },
	highlightWrapper: { backgroundColor: COLORS.accent, paddingHorizontal: 16, paddingVertical: 2, borderRadius: 20, marginTop: -5 },
	highlightText: { ...TYPOGRAPHY.h1, color: COLORS.primary },

	subtitle: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.primary, textAlign: "center", marginBottom: 30, lineHeight: 20 },
	formContainer: { width: "100%", marginBottom: 20 },
	label: { ...TYPOGRAPHY.h4, marginBottom: 8, marginTop: 10 },
	optionalText: { fontFamily: FONTS.body, fontSize: 14, fontWeight: "normal" },

	inputContainer: {
		borderWidth: 1,
		borderColor: COLORS.primary,
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 12,
		backgroundColor: "#FFFFFF",
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
	cardTitle: {
		fontFamily: "BricolageGrotesque-Medium",
		fontSize: 18,
		color: "#000000",
	},

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

	footer: { width: "100%", marginTop: 10 },
	infoRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 12 },
	infoText: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.primary, marginLeft: 6 },

	errorContainer: {
		backgroundColor: "rgba(255, 0, 0, 0.1)",
		padding: 12,
		borderRadius: 8,
		borderLeftWidth: 4,
		borderLeftColor: "#ff4d4d",
		width: "100%",
	},
	errorText: {
		fontFamily: FONTS.body,
		fontSize: 13,
		color: "#cc0000",
	},
	previewImage: {
		width: "100%",
		height: "100%",
		borderRadius: 14,
	},
});
