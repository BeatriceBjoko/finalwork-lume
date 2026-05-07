import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import StepIndicator from "../components/ui/StepIndicator";
import { COLORS, FONTS, TYPOGRAPHY } from "../constants/theme";
import { useCreateCircle } from "../hooks/useCreateCircle";

export default function CreateCircleStep1() {
	const { circleName, setCircleName, receiverName, setReceiverName, relation, handleRelationSelect, customRelation, setCustomRelation, isDropdownOpen, setIsDropdownOpen, relationOptions, selectedRelationLabel, handleNext } = useCreateCircle();

	return (
		<SafeAreaView style={styles.safeArea}>
			<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
				<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
					<View style={styles.header}>
						<Text style={styles.titleText}>Maak jouw</Text>
						<View style={styles.highlightWrapper}>
							<Text style={styles.highlightText}>zorgkring</Text>
						</View>
					</View>

					<StepIndicator currentStep={1} totalSteps={2} />

					<Text style={styles.subtitle}>Nodig mensen uit en hou samen overzicht{"\n"}over zorg en taken.</Text>

					<View style={styles.formContainer}>
						<Input label="Naam van je zorgkring" placeholder="Zorg voor mama" value={circleName} onChangeText={setCircleName} />

						<View style={styles.shadowLayer1}>
							<View style={styles.shadowLayer2}>
								<View style={styles.receiverCard}>
									<View style={styles.fakeInnerShadow} />

									<View style={styles.cardHeader}>
										<View style={styles.iconWrapper}>
											<MaterialCommunityIcons name="account-heart-outline" size={22} color={COLORS.primary} />
										</View>
										<Text style={styles.cardTitle}>Zorgontvanger</Text>
									</View>

									<Input label="Naam zorgontvanger" placeholder="Oma Marie" value={receiverName} onChangeText={setReceiverName} />

									<Text style={styles.label}>Relatie tot zorgontvanger</Text>
									<Pressable style={styles.dropdownButton} onPress={() => setIsDropdownOpen(true)}>
										<Text style={[styles.dropdownButtonText, !relation && { color: "#888" }]}>{selectedRelationLabel}</Text>
										<MaterialCommunityIcons name="chevron-down" size={24} color={COLORS.primary} />
									</Pressable>

									{relation === "andere" && (
										<View style={{ marginTop: 10 }}>
											<Input label="Specificeer je relatie" placeholder="Bijv. Mantelzorger" value={customRelation} onChangeText={setCustomRelation} />
										</View>
									)}

									<Text style={styles.label}>
										Profielfoto <Text style={{ fontWeight: "normal", fontSize: 12 }}>(optioneel)</Text>
									</Text>
									<Pressable style={styles.imagePickerBox}>
										<View style={styles.cameraIconWrapper}>
											<MaterialCommunityIcons name="camera-plus-outline" size={24} color={COLORS.primary} />
										</View>
										<Text style={styles.imagePickerText}>Tik om een afbeelding te uploaden</Text>
									</Pressable>
								</View>
							</View>
						</View>
					</View>

					<View style={styles.footer}>
						<Button title="Volgende" onPress={handleNext} variant="primary" />
						<View style={styles.infoRow}>
							<MaterialCommunityIcons name="information-outline" size={16} color={COLORS.primary} />
							<Text style={styles.infoText}>Je kan dit later nog aanpassen</Text>
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
	scrollContent: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40, alignItems: "center" },

	header: { alignItems: "center", marginBottom: 20 },
	titleText: { ...TYPOGRAPHY.h1, color: COLORS.primary },
	highlightWrapper: { backgroundColor: COLORS.accent, paddingHorizontal: 16, paddingVertical: 2, borderRadius: 20, marginTop: -5 },
	highlightText: { ...TYPOGRAPHY.h1, color: COLORS.primary },

	subtitle: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.primary, textAlign: "center", marginBottom: 30, lineHeight: 20 },
	formContainer: { width: "100%", marginBottom: 20 },
	label: { fontFamily: FONTS.button, fontSize: 14, color: COLORS.primary, marginBottom: 8, marginTop: 10 },

	shadowLayer1: {
		marginTop: 10,
		shadowColor: "#233600",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.45,
		shadowRadius: 12,
		elevation: 8,
	},
	shadowLayer2: {
		shadowColor: "#6F9F00",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.25,
		shadowRadius: 5,
		elevation: 4,
	},
	receiverCard: {
		backgroundColor: "#FCFDF8",
		borderWidth: 1,
		borderColor: "#233600",
		borderRadius: 20,
		padding: 20,
		overflow: "hidden",
	},
	fakeInnerShadow: {
		position: "absolute",
		top: -4,
		left: 0,
		right: 0,
		height: 8,
		backgroundColor: "rgba(111, 159, 0, 0.25)",
		shadowColor: "#6F9F00",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.25,
		shadowRadius: 15,
		elevation: 2,
	},

	cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20, zIndex: 2 },
	iconWrapper: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: "rgba(176, 248, 0, 0.2)",
		justifyContent: "center",
		alignItems: "center",
		marginRight: 10,
	},
	cardTitle: {
		fontFamily: "BricolageGrotesque-Medium",
		fontSize: 18,
		color: COLORS.primary,
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
		height: 120,
		justifyContent: "center",
		alignItems: "center",
		marginTop: 10,
		backgroundColor: "rgba(76, 175, 80, 0.05)",
	},
	cameraIconWrapper: {
		width: 40,
		height: 40,
		borderRadius: 20,
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
});
