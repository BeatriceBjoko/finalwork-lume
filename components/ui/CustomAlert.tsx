import { BlurView } from "expo-blur";
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS, FONTS } from "../../constants/theme";
import Button from "./Button";

interface CustomAlertProps {
	visible: boolean;
	title: string;
	message: string;
	confirmText: string;
	cancelText?: string;
	onConfirm: () => void;
	onCancel?: () => void;
}

export default function CustomAlert({ visible, title, message, confirmText, cancelText, onConfirm, onCancel }: CustomAlertProps) {
	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel || onConfirm}>
			<Pressable style={styles.modalOverlay} onPress={onCancel || onConfirm}>
				<Pressable style={styles.alertWrapper} onPress={(e) => e.stopPropagation()}>
					<BlurView intensity={8} tint="light" style={StyleSheet.absoluteFill} />

					<View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(255, 255, 255, 0.45)" }]} />

					<View style={styles.textContainer}>
						<Text style={styles.title}>{title}</Text>
						<Text style={styles.message}>{message}</Text>
					</View>

					<View style={styles.buttonContainer}>
						{cancelText && onCancel && <Button title={cancelText} onPress={onCancel} variant="secondary" style={styles.alertButton} />}
						<Button title={confirmText} onPress={onConfirm} variant="primary" style={styles.alertButton} />
					</View>
				</Pressable>
			</Pressable>
		</Modal>
	);
}

const styles = StyleSheet.create({
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.18)",
		justifyContent: "center",
		alignItems: "center",
		padding: 24,
	},
	alertWrapper: {
		width: "100%",
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "rgba(53, 78, 0, 0.20)",
		overflow: "hidden",

		shadowColor: "#354E00",
		shadowOffset: { width: 0, height: 25 },
		shadowOpacity: 1,
		shadowRadius: 50,
		elevation: 15,
	},
	textContainer: {
		padding: 24,
		alignItems: "center",
	},
	title: {
		fontFamily: "InterSemiBold",
		fontSize: 16,
		color: COLORS.primary,
		marginBottom: 12,
		textAlign: "center",
	},
	message: {
		fontFamily: FONTS.body,
		fontSize: 13,
		color: COLORS.primary,
		lineHeight: 20,
		textAlign: "center",
	},
	buttonContainer: {
		backgroundColor: "#FFFFFF",
		paddingHorizontal: 24,
		paddingVertical: 16,
		flexDirection: "row",
		justifyContent: "center",
		gap: 12,
	},
	alertButton: {
		flex: 1,
	},
});
