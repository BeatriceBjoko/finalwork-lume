import { BlurView } from "expo-blur";
import React, { useEffect, useState } from "react";
import { Keyboard, Modal, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from "react-native";

import Button from "./Button";
import { Contact } from "./ContactCard";

interface ContactFormModalProps {
	visible: boolean;
	initialData: Contact | null;
	onClose: () => void;
	onSave: (name: string, role: string, phone: string, address: string) => void;
	t: any;
}

export default function ContactFormModal({ visible, initialData, onClose, onSave, t }: ContactFormModalProps) {
	const [name, setName] = useState("");
	const [role, setRole] = useState("");
	const [phone, setPhone] = useState("");
	const [address, setAddress] = useState("");

	useEffect(() => {
		if (visible) {
			setName(initialData?.name || "");
			setRole(initialData?.role || "");
			setPhone(initialData?.phone || "");
			setAddress(initialData?.address || "");
		}
	}, [visible, initialData]);

	if (!visible) return null;

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
				<View style={styles.modalOverlay}>
					<BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />

					<TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
						<View style={styles.formContainer}>
							<Text style={styles.formTitle}>{initialData ? t("editTitle") : t("addTitle")}</Text>

							<TextInput style={styles.input} placeholder={t("nameLabel")} value={name} onChangeText={setName} placeholderTextColor="#888" />
							<TextInput style={styles.input} placeholder={t("roleLabel")} value={role} onChangeText={setRole} placeholderTextColor="#888" />
							<TextInput style={styles.input} placeholder={t("phoneLabel")} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor="#888" />
							<TextInput style={[styles.input, { height: 80, textAlignVertical: "top" }]} placeholder={t("addressLabel")} value={address} onChangeText={setAddress} multiline placeholderTextColor="#888" />

							<View style={styles.formButtons}>
								<Button title={t("cancelBtn")} onPress={onClose} variant="secondary" style={{ flex: 1, borderColor: "#233600" }} />
								<View style={{ width: 12 }} />
								<Button title={t("saveBtn")} onPress={() => onSave(name, role, phone, address)} variant="primary" style={{ flex: 1 }} />
							</View>
						</View>
					</TouchableWithoutFeedback>
				</View>
			</TouchableWithoutFeedback>
		</Modal>
	);
}

const styles = StyleSheet.create({
	modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
	formContainer: {
		width: "100%",
		backgroundColor: "#FDFBF7",
		borderRadius: 24,
		padding: 24,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.15,
		shadowRadius: 20,
		elevation: 10,
	},
	formTitle: { fontFamily: "BricolageBold", fontSize: 20, color: "#233600", marginBottom: 20, textAlign: "center" },
	input: {
		width: "100%",
		backgroundColor: "white",
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "rgba(35, 54, 0, 0.1)",
		paddingHorizontal: 16,
		paddingVertical: 14,
		fontSize: 15,
		fontFamily: "InterRegular",
		color: "#233600",
		marginBottom: 12,
	},
	formButtons: { flexDirection: "row", marginTop: 10 },
});
