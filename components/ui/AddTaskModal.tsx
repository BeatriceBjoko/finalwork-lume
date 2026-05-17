import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { COLORS, FONTS } from "../../constants/theme";
import { TASK_ICONS, useTaskForm } from "../../hooks/useTaskForm";
import Button from "./Button";

interface AddTaskModalProps {
	visible: boolean;
	onClose: () => void;
	currentDateStr: string;
	taskToEdit?: any | null;
}

export function AddTaskModal({ visible, onClose, currentDateStr, taskToEdit }: AddTaskModalProps) {
	const { title, setTitle, startTime, setStartTime, endTime, setEndTime, selectedIcon, setSelectedIcon, descriptionText, setDescriptionText, members, selectedMember, setSelectedMember, isSaving, handleSaveTask } = useTaskForm(
		currentDateStr,
		onClose,
		taskToEdit,
	);

	const isEditing = !!taskToEdit;

	return (
		<Modal visible={visible} transparent animationType="slide">
			<View style={styles.overlay}>
				<Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

				<View style={styles.modalContent}>
					<View style={styles.header}>
						<Text style={styles.title}>{isEditing ? "Taak bewerken" : "Nieuwe Taak"}</Text>
						<Pressable onPress={onClose} style={styles.closeBtn}>
							<Ionicons name="close" size={24} color={COLORS.primary} />
						</Pressable>
					</View>

					<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
						<Text style={styles.label}>Titel van de taak</Text>
						<TextInput style={styles.input} placeholder="bv. Ochtend vitals..." value={title} onChangeText={setTitle} placeholderTextColor="#9ca3af" />

						<Text style={styles.label}>Tijdsbestek</Text>
						<View style={styles.timeRow}>
							<TextInput style={[styles.input, styles.timeInput]} placeholder="09:00" value={startTime} onChangeText={setStartTime} keyboardType="numbers-and-punctuation" />
							<Text style={styles.timeTot}>tot</Text>
							<TextInput style={[styles.input, styles.timeInput]} placeholder="10:00" value={endTime} onChangeText={setEndTime} keyboardType="numbers-and-punctuation" />
						</View>

						<Text style={styles.label}>Toewijzen aan</Text>
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

						<Text style={styles.label}>Kies een icoon</Text>
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

						<Text style={styles.label}>Beschrijving (Nieuwe regel = nieuw puntje)</Text>
						<TextInput
							style={[styles.input, styles.textArea]}
							placeholder="• Medicatie geven&#10;• Bloeddruk meten"
							value={descriptionText}
							onChangeText={setDescriptionText}
							multiline
							numberOfLines={4}
							textAlignVertical="top"
							placeholderTextColor="#9ca3af"
						/>

						<View style={styles.footer}>
							<Button title={isSaving ? "Bezig met opslaan..." : isEditing ? "Wijzigingen opslaan" : "Taak Toevoegen"} onPress={handleSaveTask} variant="primary" disabled={isSaving} />
						</View>
					</ScrollView>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
	modalContent: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, height: "85%", padding: 20 },
	header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
	title: { fontFamily: FONTS.heading, fontSize: 20, color: COLORS.primary },
	closeBtn: { padding: 4, backgroundColor: "rgba(0,0,0,0.05)", borderRadius: 20 },
	scrollBody: { paddingBottom: 40 },
	label: { fontFamily: "InterSemiBold", fontSize: 14, color: COLORS.primary, marginBottom: 8, marginTop: 16 },
	input: { borderWidth: 1, borderColor: "rgba(35, 54, 0, 0.15)", borderRadius: 12, padding: 14, fontFamily: "InterRegular", fontSize: 15, color: COLORS.primary },
	timeRow: { flexDirection: "row", alignItems: "center", gap: 12 },
	timeInput: { flex: 1, textAlign: "center" },
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
});
