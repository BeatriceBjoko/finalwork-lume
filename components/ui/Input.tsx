import { Feather } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import { Pressable, StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from "react-native";
import { COLORS, FONTS } from "../../constants/theme";

interface InputProps extends Omit<TextInputProps, "style"> {
	label?: string;
	variant?: "underline" | "outline";
	isRequired?: boolean;
	style?: StyleProp<ViewStyle>;
}

export default function Input({ label, secureTextEntry, variant = "underline", isRequired = false, style, ...props }: InputProps) {
	const [isPasswordHidden, setIsPasswordHidden] = useState(secureTextEntry);
	const inputRef = useRef<TextInput>(null);

	return (
		<View style={styles.container}>
			{label && (
				<Text style={[styles.label, variant === "outline" && styles.labelOutline]}>
					{label} {isRequired && <Text style={{ color: "red" }}>*</Text>}
				</Text>
			)}
			<Pressable onPress={() => inputRef.current?.focus()} style={[styles.inputContainer, variant === "outline" && styles.inputContainerOutline, style]}>
				<TextInput ref={inputRef} style={styles.input} secureTextEntry={isPasswordHidden} placeholderTextColor={COLORS.inputPlaceholder} {...props} />
				{secureTextEntry && (
					<Pressable onPress={() => setIsPasswordHidden(!isPasswordHidden)} style={styles.icon}>
						<Feather name={isPasswordHidden ? "eye-off" : "eye"} size={20} color={COLORS.iconColor} />
					</Pressable>
				)}
			</Pressable>
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
		paddingVertical: 14,
		minHeight: 52,
		backgroundColor: "#FFFFFF",
	},
	input: {
		flex: 1,
		fontFamily: FONTS.body,
		fontSize: 16,
		color: COLORS.primary,
		paddingVertical: 0,
		height: "100%",
	},
	icon: { paddingLeft: 8 },
});
