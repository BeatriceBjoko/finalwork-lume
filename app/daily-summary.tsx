import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Button from "../components/ui/Button";
import { COLORS, TYPOGRAPHY } from "../constants/theme";

export default function DailySummary() {
	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.content}>
				<Text style={styles.title}>Dagelijkse Samenvatting</Text>
				<Text style={styles.subtitle}>Je zorgkring is succesvol aangemaakt</Text>

				<Button title="Terug naar Home" onPress={() => router.push("/")} style={{ marginTop: 20 }} />
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#F9FAF6" },
	content: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
	title: { ...TYPOGRAPHY.h1, color: COLORS.primary, textAlign: "center", marginBottom: 10 },
	subtitle: { ...TYPOGRAPHY.body, color: COLORS.primary, textAlign: "center" },
});
