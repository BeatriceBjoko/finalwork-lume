import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSession } from "../../context";

export default function HomeScreen() {
	const { signOut, user } = useSession();

	const displayName = user?.displayName || user?.email?.split("@")[0] || "Guest";

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.greeting}>Welcome back,</Text>
				<Text style={styles.name}>{displayName}</Text>
				<Text style={styles.email}>{user?.email}</Text>
			</View>

			<Pressable style={styles.button} onPress={signOut}>
				<Text style={styles.buttonText}>Logout</Text>
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "#FDFBF7" },
	header: { alignItems: "center", marginBottom: 40 },
	greeting: { fontSize: 20, color: "#4A5D4E", marginBottom: 4 },
	name: { fontSize: 32, fontWeight: "bold", color: "#7FA99B", marginBottom: 8 },
	email: { fontSize: 14, color: "#666" },
	button: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#E27D5F", paddingVertical: 12, paddingHorizontal: 32, borderRadius: 12 },
	buttonText: { color: "#E27D5F", fontSize: 16, fontWeight: "bold" },
});
