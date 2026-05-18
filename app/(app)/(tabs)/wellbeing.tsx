import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { COLORS, FONTS } from "../../../constants/theme";

export default function WellbeingScreen() {
	const { t } = useTranslation();

	return (
		<ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
			<View style={styles.header}>
				<View style={styles.titleRow}>
					<Text style={styles.titleText}>Mijn </Text>
					<View style={styles.highlightWrapper}>
						<Text style={styles.highlightText}>{t("nav.wellbeing")}</Text>
					</View>
				</View>
				<Text style={styles.subtitle}>Binnenkort beschikbaar</Text>
			</View>

			<View style={styles.placeholder}>
				<MaterialCommunityIcons name="heart-pulse" size={64} color="rgba(35, 54, 0, 0.25)" />
				<Text style={styles.placeholderText}>Tips, oefeningen en rustmomenten om als mantelzorger goed voor jezelf te zorgen.</Text>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	scroll: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 160 },

	header: { alignItems: "center", marginBottom: 32 },
	titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
	titleText: { fontFamily: FONTS.heading, fontSize: 28, color: COLORS.primary },
	highlightWrapper: {
		backgroundColor: COLORS.accent,
		paddingHorizontal: 10,
		paddingVertical: 2,
		borderRadius: 18,
	},
	highlightText: { fontFamily: FONTS.heading, fontSize: 28, color: COLORS.primary },
	subtitle: {
		fontFamily: FONTS.body,
		fontSize: 14,
		color: COLORS.primary,
		opacity: 0.6,
		marginTop: 8,
	},

	placeholder: {
		marginTop: 60,
		alignItems: "center",
		paddingHorizontal: 32,
		gap: 18,
	},
	placeholderText: {
		fontFamily: FONTS.body,
		fontSize: 14,
		color: "rgba(35, 54, 0, 0.5)",
		textAlign: "center",
		lineHeight: 22,
	},
});
