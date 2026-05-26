import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Image, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { COLORS, FONTS } from "../../constants/theme";
import { TASK_ICONS, useTaskForm } from "../../hooks/useTaskForm";
import { lookupFaggByCode } from "../../services/firebase/medication.service";
import type { MedicationVisibility } from "../../services/firebase/medication.types";
import Button from "./Button";
import { ScanIcon } from "./TabIcons";

interface AddTaskModalProps {
	visible: boolean;
	onClose: () => void;
	currentDateStr: string;
	taskToEdit?: any | null;
}

function parseTimeToDate(timeStr: string): Date {
	const [h, m] = (timeStr ?? "09:00").split(":").map(Number);
	const d = new Date();
	d.setHours(Number.isFinite(h) ? h : 9, Number.isFinite(m) ? m : 0, 0, 0);
	return d;
}
function formatTimeFromDate(d: Date): string {
	const h = String(d.getHours()).padStart(2, "0");
	const m = String(d.getMinutes()).padStart(2, "0");
	return `${h}:${m}`;
}

const VIS_KEYS: MedicationVisibility[] = ["admin", "selected", "everyone"];
const SCAN_BARCODE_TYPES = ["datamatrix", "qr", "ean13", "ean8", "upc_a", "upc_e", "code128", "code39", "code93", "codabar", "itf14", "pdf417", "aztec"] as const;

export function AddTaskModal({ visible, onClose, currentDateStr, taskToEdit }: AddTaskModalProps) {
	const { t } = useTranslation();
	const form = useTaskForm(visible, currentDateStr, onClose, taskToEdit);
	const {
		title,
		setTitle,
		startTime,
		setStartTime,
		endTime,
		setEndTime,
		selectedIcon,
		setSelectedIcon,
		descriptionText,
		setDescriptionText,
		members,
		selectedMember,
		setSelectedMember,
		isSaving,
		handleSaveTask,
		isAdmin,
		isMedication,
		setIsMedication,
		medName,
		setMedName,
		dose,
		setDose,
		instructions,
		setInstructions,
		times,
		addTime,
		removeTime,
		visibility,
		setVisibility,
		allowedMemberIds,
		toggleAllowedMember,
		gtin,
		scannedMedName,
		applyScannedMedicine,
		attachRawCode,
		clearScannedMedicine,
	} = form;

	const isEditing = !!taskToEdit;
	const [showStartPicker, setShowStartPicker] = useState(false);
	const [showEndPicker, setShowEndPicker] = useState(false);
	const [showAddTimePicker, setShowAddTimePicker] = useState(false);
	const [pendingTime, setPendingTime] = useState("09:00");

	// scan-to-attach
	const [scanOpen, setScanOpen] = useState(false);
	const [scanLock, setScanLock] = useState(false);
	const [camPermission, requestCamPermission] = useCameraPermissions();

	const openAttachScan = async () => {
		Keyboard.dismiss();
		if (!camPermission?.granted) {
			const res = await requestCamPermission();
			if (!res.granted) {
				Alert.alert(t("scan.attach.permTitle"), t("scan.attach.permText"));
				return;
			}
		}
		setScanLock(false);
		setScanOpen(true);
	};

	const handleAttachScan = async (data: string) => {
		if (scanLock) return;
		setScanLock(true);
		const code = data.match(/01(\d{14})/)?.[1] ?? data.replace(/\D/g, "");
		setScanOpen(false);
		if (!code) return;
		try {
			const fagg = await lookupFaggByCode(code);
			if (fagg) {
				applyScannedMedicine(fagg);
			} else {
				attachRawCode(code);
				Alert.alert(t("scan.attach.notFoundTitle"), t("scan.attach.notFoundText"));
			}
		} catch (e) {
			console.error("[attach-scan]", e);
		}
	};

	const handleStartChange = (event: any, date?: Date) => {
		if (Platform.OS === "android") setShowStartPicker(false);
		if (event.type === "set" && date) setStartTime(formatTimeFromDate(date));
	};
	const handleEndChange = (event: any, date?: Date) => {
		if (Platform.OS === "android") setShowEndPicker(false);
		if (event.type === "set" && date) setEndTime(formatTimeFromDate(date));
	};
	const handleAddTimeChange = (event: any, date?: Date) => {
		if (Platform.OS === "android") {
			setShowAddTimePicker(false);
			if (event.type === "set" && date) addTime(formatTimeFromDate(date));
			return;
		}
		if (date) setPendingTime(formatTimeFromDate(date));
	};

	return (
		<Modal visible={visible} transparent animationType="slide">
			<KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
				<Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

				<View style={styles.modalContent}>
					<View style={styles.header}>
						<Text style={styles.title}>{isEditing ? t("tasks.editTask") : t("tasks.newTask")}</Text>
						<Pressable onPress={onClose} style={styles.closeBtn}>
							<Ionicons name="close" size={24} color={COLORS.primary} />
						</Pressable>
					</View>

					<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" automaticallyAdjustKeyboardInsets>
						{isAdmin && !isEditing && (
							<View style={styles.medToggleRow}>
								<View style={styles.medToggleText}>
									<MaterialCommunityIcons name="shield-lock-outline" size={18} color={COLORS.iconColor} />
									<Text style={styles.medToggleLabel}>{t("tasks.medication.toggle")}</Text>
								</View>
								<Switch value={isMedication} onValueChange={setIsMedication} trackColor={{ true: COLORS.accent, false: "#d1d5db" }} thumbColor="#fff" />
							</View>
						)}

						{isMedication ? (
							<>
								<Text style={styles.label}>{t("tasks.medication.neutralLabel")}</Text>
								<TextInput style={styles.input} placeholder={t("tasks.medication.neutralPlaceholder")} value={title} onChangeText={setTitle} placeholderTextColor="#9ca3af" />

								<View style={styles.privateBox}>
									<View style={styles.privateHeader}>
										<MaterialCommunityIcons name="lock-outline" size={14} color={COLORS.primary} />
										<Text style={styles.privateHeaderText}>{t("tasks.medication.privateSection")}</Text>
									</View>

									{gtin ? (
										<View style={styles.linkedChip}>
											<MaterialCommunityIcons name="check-decagram" size={16} color="#3F6B00" />
											<Text style={styles.linkedText} numberOfLines={1}>
												{t("scan.attach.linked")}: {scannedMedName ?? gtin}
											</Text>

											<Pressable onPress={clearScannedMedicine} hitSlop={6}>
												<Ionicons name="close" size={14} color={COLORS.primary} />
											</Pressable>
										</View>
									) : (
										<Pressable style={styles.scanAttachBtn} onPress={openAttachScan}>
											<ScanIcon color={COLORS.buttonSecondaryText} size={18} strokeWidth={2} />
											<Text style={styles.scanAttachText}>{t("scan.attach.btn")}</Text>
										</Pressable>
									)}

									<Text style={styles.label}>{t("tasks.medication.medName")}</Text>
									<TextInput style={styles.input} placeholder={t("tasks.medication.medNamePlaceholder")} value={medName} onChangeText={setMedName} placeholderTextColor="#9ca3af" />

									<Text style={styles.label}>{t("tasks.medication.dose")}</Text>
									<TextInput style={styles.input} placeholder={t("tasks.medication.dosePlaceholder")} value={dose} onChangeText={setDose} placeholderTextColor="#9ca3af" />

									<Text style={styles.label}>{t("tasks.medication.instructions")}</Text>
									<TextInput style={styles.input} placeholder={t("tasks.medication.instructionsPlaceholder")} value={instructions} onChangeText={setInstructions} placeholderTextColor="#9ca3af" />
								</View>

								<Text style={styles.label}>{t("tasks.medication.times")}</Text>
								<View style={styles.chipWrap}>
									{times.map((tm) => (
										<View key={tm} style={styles.timeChip}>
											<Text style={styles.timeChipText}>{tm}</Text>
											<Pressable onPress={() => removeTime(tm)} hitSlop={6}>
												<Ionicons name="close" size={14} color={COLORS.primary} />
											</Pressable>
										</View>
									))}
									<Pressable
										style={styles.addChip}
										onPress={() => {
											setPendingTime("09:00");
											setShowAddTimePicker(true);
										}}
									>
										<Ionicons name="add" size={16} color={COLORS.primary} />
										<Text style={styles.addChipText}>{t("tasks.medication.addTime")}</Text>
									</Pressable>
								</View>

								<Text style={styles.label}>{t("tasks.medication.visibility")}</Text>
								<View style={styles.visStack}>
									{VIS_KEYS.map((key) => {
										const on = visibility === key;
										return (
											<Pressable key={key} onPress={() => setVisibility(key)} style={[styles.visOption, on && styles.visOptionActive]}>
												<View style={[styles.radio, on && styles.radioOn]}>{on && <View style={styles.radioDot} />}</View>
												<Text style={[styles.visOptionText, on && styles.visOptionTextActive]}>{t(`tasks.medication.vis_${key}`)}</Text>
											</Pressable>
										);
									})}
								</View>

								{visibility === "selected" && (
									<>
										<Text style={styles.label}>{t("tasks.medication.selectMembers")}</Text>
										<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.memberList}>
											{members.map((m) => {
												const on = allowedMemberIds.includes(m.id);
												return (
													<Pressable key={m.id} onPress={() => toggleAllowedMember(m.id)} style={[styles.memberCircle, on && styles.memberCircleSelected]}>
														{m.photoUrl ? <Image source={{ uri: m.photoUrl }} style={styles.memberPhoto} /> : <Text style={styles.memberInitials}>{m.name.substring(0, 2).toUpperCase()}</Text>}
														{on && (
															<View style={styles.memberCheck}>
																<Ionicons name="checkmark" size={12} color={COLORS.primary} />
															</View>
														)}
													</Pressable>
												);
											})}
										</ScrollView>
									</>
								)}
							</>
						) : (
							<>
								<Text style={styles.label}>{t("tasks.taskTitle")}</Text>
								<TextInput style={styles.input} placeholder={t("tasks.taskTitlePlaceholder")} value={title} onChangeText={setTitle} placeholderTextColor="#9ca3af" />

								<Text style={styles.label}>{t("tasks.timeFrame")}</Text>
								<View style={styles.timeRow}>
									<Pressable style={styles.timeButton} onPress={() => setShowStartPicker(true)}>
										<MaterialCommunityIcons name="clock-outline" size={16} color="rgba(35, 54, 0, 0.5)" />
										<Text style={styles.timeButtonText}>{startTime}</Text>
									</Pressable>
									<Text style={styles.timeTot}>{t("tasks.to")}</Text>
									<Pressable style={styles.timeButton} onPress={() => setShowEndPicker(true)}>
										<MaterialCommunityIcons name="clock-outline" size={16} color="rgba(35, 54, 0, 0.5)" />
										<Text style={styles.timeButtonText}>{endTime}</Text>
									</Pressable>
								</View>

								<Text style={styles.label}>{t("tasks.assignTo")}</Text>
								<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.memberList}>
									<Pressable onPress={() => setSelectedMember(null)} style={[styles.memberCircle, !selectedMember && styles.memberCircleSelected]}>
										<MaterialCommunityIcons name="account-off-outline" size={24} color={!selectedMember ? COLORS.primary : "#9ca3af"} />
									</Pressable>
									{members.map((member) => (
										<Pressable key={member.id} onPress={() => setSelectedMember(member)} style={[styles.memberCircle, selectedMember?.id === member.id && styles.memberCircleSelected]}>
											{member.photoUrl ? <Image source={{ uri: member.photoUrl }} style={styles.memberPhoto} /> : <Text style={styles.memberInitials}>{member.name.substring(0, 2).toUpperCase()}</Text>}
										</Pressable>
									))}
								</ScrollView>

								<Text style={styles.label}>{t("tasks.chooseIcon")}</Text>
								<View style={styles.iconGrid}>
									{TASK_ICONS.map((iconData) => {
										const isSelected = selectedIcon === iconData.id;
										return (
											<Pressable key={iconData.id} onPress={() => setSelectedIcon(iconData.id)} style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
												<MaterialCommunityIcons name={iconData.id as any} size={28} color={isSelected ? COLORS.primary : "#9ca3af"} />
											</Pressable>
										);
									})}
								</View>

								<Text style={styles.label}>{t("tasks.descriptionLabel")}</Text>
								<TextInput
									style={[styles.input, styles.textArea]}
									placeholder={t("tasks.descriptionPlaceholder")}
									value={descriptionText}
									onChangeText={setDescriptionText}
									multiline
									numberOfLines={4}
									textAlignVertical="top"
									placeholderTextColor="#9ca3af"
								/>
							</>
						)}

						<View style={styles.footer}>
							<Button title={isSaving ? t("tasks.saving") : isEditing ? t("tasks.saveChanges") : t("tasks.addTaskBtn")} onPress={handleSaveTask} variant="primary" disabled={isSaving} />
						</View>
					</ScrollView>
				</View>
			</KeyboardAvoidingView>

			{Platform.OS === "ios" && showStartPicker && (
				<Modal transparent animationType="fade">
					<Pressable style={styles.pickerOverlay} onPress={() => setShowStartPicker(false)}>
						<Pressable style={styles.pickerCard}>
							<Text style={styles.pickerTitle}>{t("tasks.startTime")}</Text>
							<DateTimePicker value={parseTimeToDate(startTime)} mode="time" is24Hour display="spinner" onChange={handleStartChange} themeVariant="light" textColor={COLORS.primary} />
							<Pressable onPress={() => setShowStartPicker(false)} style={styles.pickerDone}>
								<Text style={styles.pickerDoneText}>{t("common.ok")}</Text>
							</Pressable>
						</Pressable>
					</Pressable>
				</Modal>
			)}
			{Platform.OS === "ios" && showEndPicker && (
				<Modal transparent animationType="fade">
					<Pressable style={styles.pickerOverlay} onPress={() => setShowEndPicker(false)}>
						<Pressable style={styles.pickerCard}>
							<Text style={styles.pickerTitle}>{t("tasks.endTime")}</Text>
							<DateTimePicker value={parseTimeToDate(endTime)} mode="time" is24Hour display="spinner" onChange={handleEndChange} themeVariant="light" textColor={COLORS.primary} />
							<Pressable onPress={() => setShowEndPicker(false)} style={styles.pickerDone}>
								<Text style={styles.pickerDoneText}>{t("common.ok")}</Text>
							</Pressable>
						</Pressable>
					</Pressable>
				</Modal>
			)}
			{Platform.OS === "ios" && showAddTimePicker && (
				<Modal transparent animationType="fade">
					<Pressable style={styles.pickerOverlay} onPress={() => setShowAddTimePicker(false)}>
						<Pressable style={styles.pickerCard}>
							<Text style={styles.pickerTitle}>{t("tasks.medication.times")}</Text>
							<DateTimePicker value={parseTimeToDate(pendingTime)} mode="time" is24Hour display="spinner" onChange={handleAddTimeChange} themeVariant="light" textColor={COLORS.primary} />
							<Pressable
								onPress={() => {
									addTime(pendingTime);
									setShowAddTimePicker(false);
								}}
								style={styles.pickerDone}
							>
								<Text style={styles.pickerDoneText}>{t("common.ok")}</Text>
							</Pressable>
						</Pressable>
					</Pressable>
				</Modal>
			)}

			{Platform.OS === "android" && showStartPicker && <DateTimePicker value={parseTimeToDate(startTime)} mode="time" is24Hour onChange={handleStartChange} />}
			{Platform.OS === "android" && showEndPicker && <DateTimePicker value={parseTimeToDate(endTime)} mode="time" is24Hour onChange={handleEndChange} />}
			{Platform.OS === "android" && showAddTimePicker && <DateTimePicker value={parseTimeToDate("09:00")} mode="time" is24Hour onChange={handleAddTimeChange} />}

			{scanOpen && (
				<View style={styles.scanOverlay}>
					<CameraView style={StyleSheet.absoluteFill} facing="back" autofocus="on" onBarcodeScanned={({ data }) => handleAttachScan(data)} barcodeScannerSettings={{ barcodeTypes: [...SCAN_BARCODE_TYPES] }} />
					<View style={styles.scanHintWrap} pointerEvents="none">
						<Text style={styles.scanHint}>{t("scan.attach.hint")}</Text>
					</View>
					<Pressable onPress={() => setScanOpen(false)} style={styles.scanClose} hitSlop={8}>
						<Ionicons name="close" size={26} color="#FFFFFF" />
					</Pressable>
				</View>
			)}
		</Modal>
	);
}

const styles = StyleSheet.create({
	overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
	modalContent: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "85%", padding: 20 },
	header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
	title: { fontFamily: FONTS.heading, fontSize: 20, color: COLORS.primary },
	closeBtn: { padding: 4, backgroundColor: "rgba(0,0,0,0.05)", borderRadius: 20 },
	scrollBody: { paddingBottom: 40 },
	label: { fontFamily: "InterSemiBold", fontSize: 14, color: COLORS.primary, marginBottom: 8, marginTop: 16 },
	input: { borderWidth: 1, borderColor: "rgba(35, 54, 0, 0.15)", borderRadius: 12, padding: 14, fontFamily: "InterRegular", fontSize: 15, color: COLORS.primary },
	textArea: { minHeight: 100 },

	timeRow: { flexDirection: "row", alignItems: "center", gap: 12 },
	timeButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderColor: "rgba(35, 54, 0, 0.15)", borderRadius: 12, paddingVertical: 14, backgroundColor: "#FFF" },
	timeButtonText: { fontFamily: "InterSemiBold", fontSize: 16, color: COLORS.primary },
	timeTot: { fontFamily: "InterMedium", color: "#6b7280" },

	memberList: { gap: 12, paddingVertical: 4 },
	memberCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "rgba(35,54,0,0.1)", justifyContent: "center", alignItems: "center", overflow: "hidden" },
	memberCircleSelected: { borderColor: COLORS.accent, borderWidth: 2, backgroundColor: "rgba(239, 252, 0, 0.2)" },
	memberPhoto: { width: "100%", height: "100%" },
	memberInitials: { fontFamily: "InterSemiBold", fontSize: 16, color: COLORS.primary },
	memberCheck: { position: "absolute", bottom: -2, right: -2, backgroundColor: COLORS.accent, borderRadius: 9, width: 18, height: 18, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "#fff" },

	iconGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
	iconBox: { width: 60, height: 60, borderRadius: 16, borderWidth: 1, borderColor: "rgba(35, 54, 0, 0.1)", justifyContent: "center", alignItems: "center", backgroundColor: "#f9fafb" },
	iconBoxSelected: { borderColor: COLORS.accent, backgroundColor: "rgba(239, 252, 0, 0.2)", borderWidth: 2 },
	footer: { marginTop: 30 },

	medToggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(53,78,0,0.06)", borderRadius: 14, padding: 14, marginBottom: 4 },
	medToggleText: { flexDirection: "row", alignItems: "center", gap: 8 },
	medToggleLabel: { fontFamily: "InterSemiBold", fontSize: 14, color: COLORS.primary },
	privateBox: { borderWidth: 1, borderColor: "rgba(53,78,0,0.18)", borderRadius: 14, padding: 14, marginTop: 8, backgroundColor: "rgba(53,78,0,0.03)" },
	privateHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
	privateHeaderText: { fontFamily: "InterSemiBold", fontSize: 12, color: COLORS.primary, letterSpacing: 0.3 },

	scanAttachBtn: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		marginTop: 12,
		borderRadius: 12,
		paddingVertical: 13,
		backgroundColor: COLORS.transparent,
		borderWidth: 1.5,
		borderColor: COLORS.buttonSecondaryBorder,
	},
	scanAttachText: { fontFamily: FONTS.button, fontSize: 14, color: COLORS.buttonSecondaryText },
	linkedChip: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, borderWidth: 1, borderColor: "rgba(63,107,0,0.35)", borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: "rgba(194,206,58,0.18)" },
	linkedText: { flex: 1, fontFamily: "InterSemiBold", fontSize: 13, color: "#3F6B00" },

	chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	timeChip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(239, 252, 0, 0.25)", borderWidth: 1, borderColor: COLORS.accent, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
	timeChipText: { fontFamily: "InterSemiBold", fontSize: 14, color: COLORS.primary },
	addChip: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderColor: "rgba(35,54,0,0.2)", borderStyle: "dashed", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
	addChipText: { fontFamily: "InterMedium", fontSize: 13, color: COLORS.primary },

	visStack: { gap: 8 },
	visOption: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: "rgba(35,54,0,0.15)", backgroundColor: "#FFF" },
	visOptionActive: { borderColor: COLORS.iconColor, backgroundColor: "rgba(53,78,0,0.08)" },
	radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "rgba(35,54,0,0.3)", alignItems: "center", justifyContent: "center" },
	radioOn: { borderColor: COLORS.iconColor },
	radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.iconColor },
	visOptionText: { fontFamily: "InterMedium", fontSize: 14, color: COLORS.primary },
	visOptionTextActive: { fontFamily: "InterSemiBold" },

	pickerOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.4)", justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
	pickerCard: {
		width: "100%",
		backgroundColor: "#FFFFFF",
		borderRadius: 20,
		paddingTop: 16,
		paddingBottom: 12,
		paddingHorizontal: 16,
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.2,
		shadowRadius: 16,
		elevation: 12,
	},
	pickerTitle: { fontFamily: FONTS.heading, fontSize: 16, color: COLORS.primary, marginBottom: 8 },
	pickerDone: { marginTop: 8, backgroundColor: COLORS.buttonFill, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 10 },
	pickerDoneText: { fontFamily: FONTS.button, fontSize: 14, color: COLORS.buttonText },

	scanOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "#000", zIndex: 50, elevation: 50 },
	scanHintWrap: { position: "absolute", top: 130, left: 24, right: 24, alignItems: "center" },
	scanHint: { fontFamily: "InterMedium", fontSize: 14, color: "#FFFFFF", textAlign: "center", backgroundColor: "rgba(0,0,0,0.45)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, overflow: "hidden" },
	scanClose: { position: "absolute", top: 50, right: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" },
});
