import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { COLORS } from "../../constants/theme";

interface CheckboxProps {
	checked: boolean;
	onChange: (checked: boolean) => void;
	label: React.ReactNode;
}

export default function Checkbox({ checked, onChange, label }: CheckboxProps) {
	return (
		// De buitenste container is nu een View (niet meer klikbaar)
		<View style={styles.container}>
			{/* De Pressable zit NU ALLEEN om het vierkantje */}
			<Pressable style={[styles.box, checked && styles.boxChecked]} onPress={() => onChange(!checked)}>
				{checked && <Feather name="check" size={14} color={COLORS.white} />}
			</Pressable>

			<View style={styles.labelContainer}>{label}</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "flex-start",
		marginBottom: 16,
		marginTop: 8,
	},
	box: {
		width: 20,
		height: 20,
		borderWidth: 1.5,
		borderColor: COLORS.primary,
		borderRadius: 4,
		marginRight: 12,
		alignItems: "center",
		justifyContent: "center",
		marginTop: 2,
	},
	boxChecked: {
		backgroundColor: COLORS.primary,
		borderColor: COLORS.primary,
	},
	labelContainer: {
		flex: 1,
	},
});
