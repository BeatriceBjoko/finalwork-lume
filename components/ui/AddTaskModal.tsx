import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { COLORS, FONTS } from "../../constants/theme";
import { TASK_ICONS, useTaskForm } from "../../hooks/useTaskForm";
import Button from "./Button";

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

export function AddTaskModal({ visible, onClose, currentDateStr, taskToEdit }: AddTaskModalProps) {
	const { t } = useTranslation();
	const { title, setTitle, startTime, setStartTime, endTime, setEndTime, selectedIcon, setSelectedIcon, descriptionText, setDescriptionText, members, selectedMember, setSelectedMember, isSaving, handleSaveTask } = useTaskForm(
		visible,
		currentDateStr,
		onClose,
		taskToEdit,
	);

	const isEditing = !!taskToEdit;
	const [showStartPicker, setShowStartPicker] = useState(false);
	const [showEndPicker, setShowEndPicker] = useState(false);

	const handleStartChange = (event: any, date?: Date) => {
		if (Platform.OS === "android") setShowStartPicker(false);
		if (event.type === "set" && date) {
			setStartTime(formatTimeFromDate(date));
		}
	};

	const handleEndChange = (event: any, date?: Date) => {
		if (Platform.OS === "android") setShowEndPicker(false);
		if (event.type === "set" && date) {
			setEndTime(formatTimeFromDate(date));
		}
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

			{Platform.OS === "android" && showStartPicker && <DateTimePicker value={parseTimeToDate(startTime)} mode="time" is24Hour onChange={handleStartChange} />}
			{Platform.OS === "android" && showEndPicker && <DateTimePicker value={parseTimeToDate(endTime)} mode="time" is24Hour onChange={handleEndChange} />}
		</Modal>
	);
}

const styles = StyleSheet.create({
	overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
	modalContent: {
		backgroundColor: "#FFFFFF",
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		maxHeight: "85%",
		padding: 20,
	},
	header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
	title: { fontFamily: FONTS.heading, fontSize: 20, color: COLORS.primary },
	closeBtn: { padding: 4, backgroundColor: "rgba(0,0,0,0.05)", borderRadius: 20 },
	scrollBody: { paddingBottom: 40 },
	label: { fontFamily: "InterSemiBold", fontSize: 14, color: COLORS.primary, marginBottom: 8, marginTop: 16 },
	input: { borderWidth: 1, borderColor: "rgba(35, 54, 0, 0.15)", borderRadius: 12, padding: 14, fontFamily: "InterRegular", fontSize: 15, color: COLORS.primary },
	timeRow: { flexDirection: "row", alignItems: "center", gap: 12 },
	timeButton: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		borderWidth: 1,
		borderColor: "rgba(35, 54, 0, 0.15)",
		borderRadius: 12,
		paddingVertical: 14,
		backgroundColor: "#FFF",
	},
	timeButtonText: { fontFamily: "InterSemiBold", fontSize: 16, color: COLORS.primary },
	timeTot: { fontFamily: "InterMedium", color: "#6b7280" },
	memberList: { gap: 12, paddingVertical: 4 },
	memberCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "rgba(35,54,0,0.1)", justifyContent: "center", alignItems: "center", overflow: "hidden" },
	memberCircleSelected: { borderColor: COLORS.accent, borderWidth: 2, backgroundColor: "rgba(239, 252, 0, 0.2)" },
	memberPhoto: { width: "100%", height: "100%" },
	memberInitials: { fontFamily: "InterSemiBold", fontSize: 16, color: COLORS.primary },
	iconGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
	iconBox: { width: 60, height: 60, borderRadius: 16, borderWidth: 1, borderColor: "rgba(35, 54, 0, 0.1)", justifyContent: "center", alignItems: "center", backgroundColor: "#f9fafb" },
	iconBoxSelected: { borderColor: COLORS.accent, backgroundColor: "rgba(239, 252, 0, 0.2)", borderWidth: 2 },
	textArea: { minHeight: 100 },
	footer: { marginTop: 30 },

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
});
