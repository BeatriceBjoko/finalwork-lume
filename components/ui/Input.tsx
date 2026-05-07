import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { COLORS, FONTS } from "../../constants/theme";

interface InputProps extends TextInputProps {
	label?: string;
	variant?: "underline" | "outline";
}

export default function Input({ label, secureTextEntry, variant = "underline", ...props }: InputProps) {
	const [isPasswordHidden, setIsPasswordHidden] = useState(secureTextEntry);

	return (
		<View style={styles.container}>
			{label && <Text style={[styles.label, variant === "outline" && styles.labelOutline]}>{label}</Text>}
			<View
				style={[
					styles.inputContainer,
					variant === "outline" && styles.inputContainerOutline, // Wissel van stijl
				]}
			>
				<TextInput style={styles.input} secureTextEntry={isPasswordHidden} placeholderTextColor={COLORS.inputPlaceholder} {...props} />
				{secureTextEntry && (
					<Pressable onPress={() => setIsPasswordHidden(!isPasswordHidden)} style={styles.icon}>
						<Feather name={isPasswordHidden ? "eye-off" : "eye"} size={20} color={COLORS.iconColor} />
					</Pressable>
				)}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { width: "100%", marginBottom: 16 },
	label: {
		fontFamily: FONTS.body,
		fontSize: 14,
		color: COLORS.primary,
		marginBottom: 4,
	},
	labelOutline: {
		fontSize: 16,
		marginBottom: 8,
	},
	inputContainer: {
		flexDirection: "row",
		alignItems: "center",
		borderBottomWidth: 1,
		borderBottomColor: COLORS.primary,
		paddingBottom: 8,
	},
	inputContainerOutline: {
		borderBottomWidth: 1,
		borderWidth: 1,
		borderColor: COLORS.primary,
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 16,
		minHeight: 48,
		backgroundColor: "#FFFFFF",
	},
	input: {
		flex: 1,
		fontFamily: FONTS.body,
		fontSize: 16,
		color: COLORS.primary,
		paddingVertical: 0,
	},
	icon: { paddingLeft: 8 },
});
