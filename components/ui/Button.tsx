import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, ViewStyle } from "react-native";
import { COLORS, FONTS, SIZES } from "../../constants/theme";

interface ButtonProps {
	title: string;
	onPress: () => void;
	style?: StyleProp<ViewStyle>;
	textStyle?: StyleProp<TextStyle>;
	disabled?: boolean;
	variant?: "primary" | "secondary";
}

export default function Button({ title, onPress, style, textStyle, disabled, variant = "primary" }: ButtonProps) {
	const isPrimary = variant === "primary";

	const handlePress = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		onPress();
	};

	return (
		<Pressable style={({ pressed }) => [styles.buttonBase, isPrimary ? styles.buttonPrimary : styles.buttonSecondary, style, pressed && styles.buttonPressed, disabled && styles.buttonDisabled]} onPress={handlePress} disabled={disabled}>
			<Text style={[styles.textBase, isPrimary ? styles.textPrimary : styles.textSecondary, textStyle]}>{title}</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	buttonBase: {
		width: "100%",
		paddingVertical: 18,
		paddingHorizontal: 11,
		borderRadius: SIZES.radius,
		alignItems: "center",
		justifyContent: "center",
	},
	buttonPressed: { opacity: 0.8 },
	buttonDisabled: { opacity: 0.5 },
	textBase: {
		fontFamily: FONTS.button,
		fontSize: 16,
	},

	buttonPrimary: {
		backgroundColor: COLORS.buttonFill,
		shadowColor: COLORS.buttonShadow,
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.5,
		shadowRadius: 10,
		elevation: 4,
	},
	textPrimary: {
		color: COLORS.buttonText,
	},

	buttonSecondary: {
		backgroundColor: COLORS.transparent,
		borderWidth: 1.5,
		borderColor: COLORS.buttonSecondaryBorder,
	},
	textSecondary: {
		color: COLORS.buttonSecondaryText,
	},
});
