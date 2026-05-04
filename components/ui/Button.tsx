import React from "react";
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, ViewStyle } from "react-native";
import { COLORS, FONTS, SIZES } from "../../constants/theme";

interface ButtonProps {
	title: string;
	onPress: () => void;
	style?: StyleProp<ViewStyle>;
	textStyle?: StyleProp<TextStyle>;
	disabled?: boolean;
}

export default function Button({ title, onPress, style, textStyle, disabled }: ButtonProps) {
	return (
		<Pressable style={({ pressed }) => [styles.button, style, pressed && styles.buttonPressed, disabled && styles.buttonDisabled]} onPress={onPress} disabled={disabled}>
			<Text style={[styles.text, textStyle]}>{title}</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	button: {
		backgroundColor: COLORS.buttonFill,
		width: "100%",
		paddingVertical: 18,
		paddingHorizontal: 11,
		borderRadius: SIZES.radius,
		alignItems: "center",
		justifyContent: "center",

		shadowColor: COLORS.buttonShadow,
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.5,
		shadowRadius: 10,
		elevation: 4, // Android shadow
	},
	buttonPressed: { opacity: 0.8 },
	buttonDisabled: { opacity: 0.5 },
	text: {
		fontFamily: FONTS.button,
		color: COLORS.buttonText,
		fontSize: 16,
	},
});
