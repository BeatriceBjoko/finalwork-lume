import React, { ReactNode } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

interface ShadowCardProps {
	children: ReactNode;
	style?: ViewStyle;
}

export default function ShadowCard({ children, style }: ShadowCardProps) {
	return (
		<View style={[styles.shadowLayer1, style]}>
			<View style={styles.shadowLayer2}>
				<View style={styles.card}>
					<View style={styles.fakeInnerShadow} />

					{children}
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	shadowLayer1: {
		marginTop: 10,
		shadowColor: "#233600",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.45,
		shadowRadius: 12,
		elevation: 8,
	},
	shadowLayer2: {
		shadowColor: "#6F9F00",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.25,
		shadowRadius: 5,
		elevation: 4,
	},
	card: {
		backgroundColor: "#FCFDF8",
		borderWidth: 1,
		borderColor: "#233600",
		borderRadius: 20,
		padding: 20,
		overflow: "hidden",
	},
	fakeInnerShadow: {
		position: "absolute",
		top: -4,
		left: 0,
		right: 0,
		height: 8,
		backgroundColor: "rgba(111, 159, 0, 0.25)",
		shadowColor: "#6F9F00",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.25,
		shadowRadius: 15,
		elevation: 2,
	},
});
