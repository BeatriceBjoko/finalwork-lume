import { BlurView } from "expo-blur";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/theme";

interface QuoteCardProps {
	quote: string;
}

export function QuoteCard({ quote }: QuoteCardProps) {
	return (
		<View style={styles.wrapper}>
			<View style={styles.blob} />

			<View style={styles.cardBorder}>
				<BlurView intensity={45} tint="light" style={styles.blurFill}>
					<View style={styles.cardContent}>
						<Text style={styles.quoteMarkLeft}>{'"'}</Text>
						<Text style={styles.quoteText}>{quote}</Text>
						<Text style={styles.quoteMarkRight}>{'"'}</Text>
					</View>
				</BlurView>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	wrapper: {
		paddingBottom: 22,
	},

	blob: {
		position: "absolute",
		bottom: 0,
		alignSelf: "center",
		width: "65%",
		height: 56,
		backgroundColor: "rgba(255, 228, 0, 0.80)",
		borderRadius: 999,
	},

	cardBorder: {
		borderRadius: 20,
		borderWidth: 1.5,
		borderColor: "rgba(255, 228, 0, 0.55)",
		overflow: "hidden",
	},

	blurFill: {},

	cardContent: {
		backgroundColor: "rgba(255, 255, 255, 0.2)",
		paddingHorizontal: 22,
		paddingVertical: 20,
		paddingTop: 44,
		paddingBottom: 44,
	},

	quoteMarkLeft: {
		position: "absolute",
		top: 12,
		left: 16,
		fontSize: 28,
		color: COLORS.primary,
		fontWeight: "800",
		lineHeight: 28,
	},

	quoteText: {
		fontFamily: "InterRegular",
		fontSize: 16,
		color: COLORS.primary,
		lineHeight: 26,
	},

	quoteMarkRight: {
		position: "absolute",
		bottom: 1,
		right: 16,
		fontSize: 28,
		color: COLORS.primary,
		fontWeight: "800",
		lineHeight: 28,
	},
});
