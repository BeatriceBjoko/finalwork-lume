import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "../../context";

export default function DailySummaryHome() {
	const { user } = useSession();
	const router = useRouter();

	const displayName = user?.displayName || user?.email?.split("@")[0] || "Mantelzorger";

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.greeting}>Dag {displayName},</Text>
				<Text style={styles.title}>Dagelijkse Samenvatting</Text>
			</View>

			<View style={styles.content}>
				<Text style={styles.placeholder}>Hier komt straks de tijdlijn...</Text>

				<Pressable style={styles.testButton} onPress={() => router.push("/profile")}>
					<Text style={styles.testButtonText}>Ga naar Mijn Profiel ➔</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#FDFBF7", paddingHorizontal: 24 },
	header: { marginTop: 40, marginBottom: 20 },
	greeting: { fontSize: 18, color: "#666", marginBottom: 4 },
	title: { fontSize: 32, fontWeight: "bold", color: "#354E00", marginBottom: 12 },
	content: { flex: 1, justifyContent: "center", alignItems: "center" },
	placeholder: { color: "#7FA99B", textAlign: "center", fontStyle: "italic", fontSize: 16, marginBottom: 40 },

	testButton: {
		backgroundColor: "#354E00",
		paddingVertical: 14,
		paddingHorizontal: 32,
		borderRadius: 12,
	},
	testButtonText: { color: "#D5FF8C", fontSize: 16, fontWeight: "bold" },
});
