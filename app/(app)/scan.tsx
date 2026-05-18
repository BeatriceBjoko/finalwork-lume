import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { COLORS, FONTS } from "../../constants/theme";

export default function ScanScreen() {
	const router = useRouter();

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.header}>
				<Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
					<Ionicons name="chevron-back" size={28} color={COLORS.primary} />
				</Pressable>
				<View style={styles.titleRow}>
					<Text style={styles.titleText}>Scan </Text>
					<View style={styles.highlightWrapper}>
						<Text style={styles.highlightText}>medicatie</Text>
					</View>
				</View>
				<View style={{ width: 40 }} />
			</View>

			<View style={styles.body}>
				<View style={styles.scanFrame}>
					<View style={[styles.corner, styles.cornerTL]} />
					<View style={[styles.corner, styles.cornerTR]} />
					<View style={[styles.corner, styles.cornerBL]} />
					<View style={[styles.corner, styles.cornerBR]} />
					<MaterialCommunityIcons name="barcode-scan" size={72} color="rgba(35, 54, 0, 0.25)" />
				</View>

				<Text style={styles.helper}>Binnenkort beschikbaar</Text>
				<Text style={styles.description}>Scan de barcode op een medicatie­doosje om informatie en inname­herinneringen toe te voegen.</Text>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: COLORS.background },
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingTop: 10,
		paddingBottom: 16,
	},
	backBtn: { padding: 8, marginLeft: -8 },
	titleRow: { flexDirection: "row", alignItems: "center" },
	titleText: { fontFamily: FONTS.heading, fontSize: 24, color: COLORS.primary },
	highlightWrapper: {
		backgroundColor: COLORS.accent,
		paddingHorizontal: 10,
		paddingVertical: 2,
		borderRadius: 16,
	},
	highlightText: { fontFamily: FONTS.heading, fontSize: 24, color: COLORS.primary },

	body: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 32,
		paddingBottom: 80,
	},
	scanFrame: {
		width: 260,
		height: 260,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 32,
		position: "relative",
	},
	corner: {
		position: "absolute",
		width: 40,
		height: 40,
		borderColor: COLORS.accent,
	},
	cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 12 },
	cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 12 },
	cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 12 },
	cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 12 },

	helper: {
		fontFamily: "InterSemiBold",
		fontSize: 15,
		color: COLORS.primary,
		marginBottom: 8,
	},
	description: {
		fontFamily: FONTS.body,
		fontSize: 13,
		color: "rgba(35, 54, 0, 0.55)",
		textAlign: "center",
		lineHeight: 20,
	},
});
