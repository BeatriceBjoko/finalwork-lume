import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Button from "../components/ui/Button";
import StepIndicator from "../components/ui/StepIndicator";
import { COLORS, TYPOGRAPHY } from "../constants/theme";

export default function CreateCircleStep2() {
	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.container}>
				<View style={styles.header}>
					<Text style={styles.titleText}>Maak jouw</Text>
					<View style={styles.highlightWrapper}>
						<Text style={styles.highlightText}>zorgkring</Text>
					</View>
				</View>

				<StepIndicator currentStep={2} totalSteps={2} />

				<View style={styles.content}>
					<Text style={styles.placeholderText}>Dit is de tweede stap van het aanmaken van je zorgkring.</Text>
				</View>

				<View style={styles.footer}>
					<Button title="Terug naar stap 1" onPress={() => router.back()} variant="secondary" />
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: "#FFFFFF",
	},
	container: {
		flex: 1,
		paddingHorizontal: 24,
		paddingTop: 40,
		alignItems: "center",
	},
	header: {
		alignItems: "center",
		marginBottom: 20,
	},
	titleText: {
		...TYPOGRAPHY.h1,
		color: COLORS.primary,
	},
	highlightWrapper: {
		backgroundColor: COLORS.accent,
		paddingHorizontal: 16,
		paddingVertical: 2,
		borderRadius: 20,
		marginTop: -5,
	},
	highlightText: {
		...TYPOGRAPHY.h1,
		color: COLORS.primary,
	},
	content: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	placeholderText: {
		...TYPOGRAPHY.body,
		fontSize: 18,
		textAlign: "center",
	},
	footer: {
		width: "100%",
		paddingBottom: 40,
	},
});
