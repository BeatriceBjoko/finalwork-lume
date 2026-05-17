import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { COLORS, FONTS } from "../../constants/theme";
import { NOTE_CATEGORIES, useNoteForm } from "../../hooks/useNoteForm";
import Button from "./Button";

interface AddNoteModalProps {
	visible: boolean;
	onClose: () => void;
	noteToEdit?: any | null;
}

export function AddNoteModal({ visible, onClose, noteToEdit }: AddNoteModalProps) {
	const { title, setTitle, content, setContent, selectedCategory, setSelectedCategory, isImportant, setIsImportant, images, handlePickImage, handleRemoveImage, isSaving, handleSaveNote } = useNoteForm(visible, onClose, noteToEdit);

	const isEditing = !!noteToEdit;

	return (
		<Modal visible={visible} transparent animationType="slide">
			<View style={styles.overlay}>
				<Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

				<View style={styles.modalContent}>
					<View style={styles.header}>
						<Text style={styles.title}>{isEditing ? "Notitie bewerken" : "Nieuwe Notitie"}</Text>
						<Pressable onPress={onClose} style={styles.closeBtn}>
							<Ionicons name="close" size={24} color={COLORS.primary} />
						</Pressable>
					</View>

					<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
						<Text style={styles.label}>Categorie</Text>
						<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
							{NOTE_CATEGORIES.map((cat) => {
								const isSelected = selectedCategory.id === cat.id;
								return (
									<Pressable key={cat.id} onPress={() => setSelectedCategory(cat)} style={[styles.catChip, isSelected && styles.catChipSelected]}>
										<MaterialCommunityIcons name={cat.icon as any} size={18} color={isSelected ? COLORS.primary : "#9ca3af"} />
										<Text style={[styles.catText, isSelected && styles.catTextSelected]}>{cat.id}</Text>
									</Pressable>
								);
							})}
						</ScrollView>

						<View style={styles.titleRow}>
							<View style={{ flex: 1 }}>
								<Text style={styles.label}>Titel</Text>
								<TextInput style={styles.input} placeholder="bv. Doktersbezoek, Gevallen..." value={title} onChangeText={setTitle} placeholderTextColor="#9ca3af" />
							</View>
							<View style={{ marginLeft: 16, alignItems: "center" }}>
								<Text style={styles.label}>Belangrijk?</Text>
								<Pressable onPress={() => setIsImportant(!isImportant)} style={styles.heartBtn}>
									<MaterialCommunityIcons name={isImportant ? "heart" : "heart-outline"} size={32} color={isImportant ? "#C94B47" : "rgba(35, 54, 0, 0.2)"} />
								</Pressable>
							</View>
						</View>

						<Text style={styles.label}>Bericht</Text>
						<TextInput style={[styles.input, styles.textArea]} placeholder="Schrijf hier je update voor de zorgkring..." value={content} onChangeText={setContent} multiline numberOfLines={6} textAlignVertical="top" placeholderTextColor="#9ca3af" />

						<Text style={styles.label}>Foto's toevoegen ({images.length}/3)</Text>
						<View style={styles.imageSection}>
							{images.map((imgUri, idx) => (
								<View key={idx} style={styles.imagePreviewWrap}>
									<Image source={{ uri: imgUri }} style={styles.previewImage} />
									<Pressable style={styles.removeImgBtn} onPress={() => handleRemoveImage(idx)}>
										<Ionicons name="close" size={16} color="#FFF" />
									</Pressable>
								</View>
							))}

							{images.length < 3 && (
								<Pressable style={styles.addImgBtn} onPress={handlePickImage}>
									<MaterialCommunityIcons name="camera-plus-outline" size={28} color="rgba(35, 54, 0, 0.4)" />
								</Pressable>
							)}
						</View>

						<View style={styles.footer}>
							<Button title={isSaving ? "Bezig met opslaan..." : isEditing ? "Wijzigingen opslaan" : "Notitie delen"} onPress={handleSaveNote} variant="primary" disabled={isSaving} />
						</View>
					</ScrollView>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
	modalContent: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, height: "90%", padding: 20 },
	header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
	title: { fontFamily: FONTS.heading, fontSize: 20, color: COLORS.primary },
	closeBtn: { padding: 4, backgroundColor: "rgba(0,0,0,0.05)", borderRadius: 20 },
	scrollBody: { paddingBottom: 40 },
	label: { fontFamily: "InterSemiBold", fontSize: 14, color: COLORS.primary, marginBottom: 8, marginTop: 16 },
	input: { borderWidth: 1, borderColor: "rgba(35, 54, 0, 0.15)", borderRadius: 12, padding: 14, fontFamily: "InterRegular", fontSize: 15, color: COLORS.primary },
	textArea: { minHeight: 120 },
	categoryList: { gap: 10, paddingVertical: 4 },
	catChip: { flexDirection: "row", alignItems: "center", backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "rgba(35,54,0,0.1)", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, gap: 6 },
	catChipSelected: { borderColor: COLORS.accent, backgroundColor: "rgba(239, 252, 0, 0.2)" },
	catText: { fontFamily: "InterMedium", fontSize: 14, color: "#9ca3af" },
	catTextSelected: { color: COLORS.primary, fontFamily: "InterSemiBold" },
	titleRow: { flexDirection: "row", alignItems: "flex-end" },
	heartBtn: { padding: 8, backgroundColor: "#f9fafb", borderRadius: 16, borderWidth: 1, borderColor: "rgba(35, 54, 0, 0.1)", height: 52, justifyContent: "center" },
	imageSection: { flexDirection: "row", gap: 12, flexWrap: "wrap", marginTop: 4 },
	imagePreviewWrap: { width: 80, height: 80, borderRadius: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
	previewImage: { width: "100%", height: "100%", borderRadius: 12 },
	removeImgBtn: { position: "absolute", top: -6, right: -6, backgroundColor: "#C94B47", width: 22, height: 22, borderRadius: 11, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#FFF" },
	addImgBtn: { width: 80, height: 80, borderRadius: 12, borderWidth: 1.5, borderColor: "rgba(35, 54, 0, 0.2)", borderStyle: "dashed", justifyContent: "center", alignItems: "center", backgroundColor: "#f9fafb" },
	footer: { marginTop: 32 },
});
