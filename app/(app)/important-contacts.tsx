import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Button from "../../components/ui/Button";
import ContactCard from "../../components/ui/ContactCard";
import ContactFormModal from "../../components/ui/ContactFormModal";
import CustomAlert from "../../components/ui/CustomAlert";
import { useImportantContacts } from "../../hooks/useImportantContacts";

export default function ImportantContactsScreen() {
	const router = useRouter();
	const { width } = useWindowDimensions();
	const CARD_WIDTH = width - 48;
	const CARD_HEIGHT = 140;

	const {
		tContacts,
		contacts,
		focusedCardId,
		setFocusedCardId,
		isLoading,
		isTemplateMode,
		isSaving,
		alertConfig,
		setAlertConfig,
		formVisible,
		setFormVisible,
		editingContact,
		handleSaveToDB,
		confirmDelete,
		handleAlertConfirm,
		openAddForm,
		openEditForm,
		saveForm,
	} = useImportantContacts();

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.headerRow}>
				<Pressable onPress={() => router.back()} style={styles.backButton}>
					<Ionicons name="arrow-back" size={28} color="#233600" />
				</Pressable>
			</View>

			<View style={styles.titleContainer}>
				<Text style={styles.titleText}>{tContacts("title")}</Text>
				<Text style={styles.subtitle}>{tContacts("subtitle")}</Text>
			</View>

			{isLoading ? (
				<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
					<ActivityIndicator size="large" color="#233600" />
				</View>
			) : (
				<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} onScrollBeginDrag={() => setFocusedCardId(null)}>
					{isTemplateMode && (
						<View style={styles.templateBanner}>
							<Ionicons name="information-circle" size={24} color="#354E00" style={{ marginRight: 12 }} />
							<Text style={styles.templateText}>{tContacts("templateMessage")}</Text>
						</View>
					)}

					<Pressable style={{ flex: 1 }} onPress={() => setFocusedCardId(null)}>
						{contacts.map((contact, index) => (
							<ContactCard
								key={contact.id}
								contact={contact}
								index={index}
								cardWidth={CARD_WIDTH}
								cardHeight={CARD_HEIGHT}
								isFocused={focusedCardId === contact.id}
								onFocus={() => setFocusedCardId(contact.id)}
								onEdit={openEditForm}
								onDelete={confirmDelete}
							/>
						))}
						<View style={{ height: 160 }} />
					</Pressable>
				</ScrollView>
			)}

			<View style={styles.bottomContainer}>
				<Button title={tContacts("addTitle")} onPress={openAddForm} variant="secondary" style={{ marginBottom: 12, borderColor: "#233600" }} />
				<Button title={isSaving ? tContacts("loadingBtn") : tContacts("saveBtn")} onPress={handleSaveToDB} variant="primary" disabled={isSaving} />
			</View>

			<CustomAlert
				visible={alertConfig.visible}
				title={alertConfig.title}
				message={alertConfig.message}
				confirmText="OK"
				cancelText={alertConfig.type === "delete" ? tContacts("cancelBtn") : undefined}
				onConfirm={handleAlertConfirm}
				onCancel={() => setAlertConfig({ ...alertConfig, visible: false })}
			/>

			<ContactFormModal visible={formVisible} initialData={editingContact} onClose={() => setFormVisible(false)} onSave={saveForm} t={tContacts} />
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: "#FDFBF7" },
	headerRow: { width: "100%", paddingHorizontal: 24, paddingTop: 10, zIndex: 10 },
	backButton: { padding: 8, marginLeft: -8, alignSelf: "flex-start" },
	titleContainer: { paddingHorizontal: 24, marginTop: 16, marginBottom: 24, alignItems: "center" },
	titleText: { fontFamily: "BricolageBold", fontSize: 24, color: "#233600", textAlign: "center" },
	subtitle: { fontFamily: "InterRegular", fontSize: 16, color: "#475569", marginTop: 8 },
	scrollContent: { paddingHorizontal: 24, paddingTop: 10 },
	bottomContainer: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40, backgroundColor: "rgba(253, 251, 247, 0.95)" },

	templateBanner: {
		flexDirection: "row",
		backgroundColor: "rgba(239, 252, 0, 0.3)",
		padding: 16,
		borderRadius: 16,
		marginBottom: 24,
		alignItems: "center",
		borderWidth: 1,
		borderColor: "rgba(35, 54, 0, 0.1)",
	},
	templateText: { flex: 1, fontFamily: "InterMedium", fontSize: 14, color: "#354E00", lineHeight: 20 },
});
