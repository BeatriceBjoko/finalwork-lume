import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, FONTS } from "../../constants/theme";

interface StepIndicatorProps {
	currentStep: number;
	totalSteps: number;
}

export default function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
	const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

	return (
		<View style={styles.container}>
			{steps.map((step, index) => (
				<React.Fragment key={step}>
					<View style={[styles.stepCircle, step === currentStep ? styles.stepActive : styles.stepInactive]}>
						<Text style={[styles.stepText, step === currentStep ? styles.stepTextActive : styles.stepTextInactive]}>{step}</Text>
					</View>
					{index < steps.length - 1 && <View style={styles.stepLine} />}
				</React.Fragment>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 20,
	},
	stepCircle: {
		width: 32,
		height: 32,
		borderRadius: 16,
		justifyContent: "center",
		alignItems: "center",
	},
	stepActive: {
		backgroundColor: COLORS.primary,
	},
	stepInactive: {
		backgroundColor: "rgba(176, 248, 0, 0.2)",
	},
	stepText: {
		fontFamily: FONTS.button,
		fontSize: 14,
	},
	stepTextActive: {
		color: COLORS.white,
	},
	stepTextInactive: {
		color: "#354E00",
	},
	stepLine: {
		width: 40,
		height: 1,
		backgroundColor: "#D0D0D0",
		marginHorizontal: 10,
	},
});
