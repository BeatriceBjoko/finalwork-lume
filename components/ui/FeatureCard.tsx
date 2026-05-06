import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, FONTS } from "../../constants/theme";

interface FeatureCardProps {
	title: string;
	subtitle: string;
}

export default function FeatureCard({ title, subtitle }: FeatureCardProps) {
	return (
		<View style={styles.cardDropShadow}>
			<View style={styles.cardGlassContainer}>
				<View style={styles.iconCircle}>
					<Feather name="check" size={20} color={COLORS.iconColor} />
				</View>

				<View style={styles.cardTextContainer}>
					<Text style={styles.cardTitle}>{title}</Text>
					<Text style={styles.cardSubtitle}>{subtitle}</Text>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	cardDropShadow: {
		shadowColor: COLORS.accent,
		shadowOffset: { width: 0, height: 4 },
		shadowRadius: 4,
		shadowOpacity: 0.3,
		elevation: 5, // Voor Android
	},
	cardGlassContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "rgba(255, 255, 255, 0.45)",
		borderRadius: 16,
		paddingHorizontal: 16,
		paddingVertical: 14,
		borderWidth: 2,
		borderColor: "rgba(239, 252, 0, 0.5)",
	},
	iconCircle: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "rgba(176, 203, 103, 0.4)",
		justifyContent: "center",
		alignItems: "center",
		marginRight: 16,
	},
	cardTextContainer: {
		flex: 1,
	},
	cardTitle: {
		fontFamily: FONTS.heading,
		fontSize: 16,
		color: COLORS.primary, // #233600
		marginBottom: 2,
	},
	cardSubtitle: {
		fontFamily: FONTS.body,
		fontSize: 14,
		color: COLORS.primary,
		opacity: 0.9,
	},
});
