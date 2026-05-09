import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "../../context";

export default function DailySummaryHome() {
	const { signOut, user, userData } = useSession();

	const displayName = user?.displayName || user?.email?.split("@")[0] || "Mantelzorger";

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.greeting}>Dag {displayName},</Text>
				<Text style={styles.title}>Dagelijkse Samenvatting</Text>

				{userData?.careCircleId && (
					<View style={styles.badge}>
						<Text style={styles.badgeText}>Actieve Zorgkring</Text>
					</View>
				)}
			</View>

			<View style={styles.content}>
				<Text style={styles.placeholder}>Hier komt straks de tijdlijn met updates, taken en berichten uit de zorgkring...</Text>
			</View>

			<Pressable style={styles.button} onPress={signOut}>
				<Text style={styles.buttonText}>Uitloggen</Text>
			</Pressable>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#FDFBF7", paddingHorizontal: 24 },
	header: { marginTop: 40, marginBottom: 20 },
	greeting: { fontSize: 18, color: "#666", marginBottom: 4 },
	title: { fontSize: 32, fontWeight: "bold", color: "#354E00", marginBottom: 12 },
	badge: {
		backgroundColor: "#E27D5F",
		alignSelf: "flex-start",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
	},
	badgeText: { color: "#FFF", fontSize: 12, fontWeight: "bold" },

	content: { flex: 1, justifyContent: "center", alignItems: "center" },
	placeholder: { color: "#7FA99B", textAlign: "center", fontStyle: "italic", fontSize: 16, lineHeight: 24 },

	button: {
		backgroundColor: "transparent",
		borderWidth: 1,
		borderColor: "#E27D5F",
		paddingVertical: 12,
		paddingHorizontal: 32,
		borderRadius: 12,
		alignSelf: "center",
		marginBottom: 20,
	},
	buttonText: { color: "#E27D5F", fontSize: 16, fontWeight: "bold" },
});
