import { Link, router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSession } from "../context";

export default function SignIn() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const { signIn } = useSession();

	const handleSignInPress = async () => {
		const user = await signIn(email, password);
		if (user) {
			router.replace("/");
		}
	};

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.title}>Welcome Back</Text>
				<Text style={styles.subtitle}>Please sign in to continue</Text>
			</View>

			<View style={styles.form}>
				<Text style={styles.label}>Email</Text>
				<TextInput style={styles.input} placeholder="name@mail.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

				<Text style={styles.label}>Password</Text>
				<TextInput style={styles.input} placeholder="Your password" value={password} onChangeText={setPassword} secureTextEntry />
			</View>

			<Pressable style={styles.button} onPress={handleSignInPress}>
				<Text style={styles.buttonText}>Sign In</Text>
			</Pressable>

			<View style={styles.footer}>
				<Text style={styles.footerText}>Don't have an account? </Text>
				<Link href="/sign-up" asChild>
					<Pressable>
						<Text style={styles.link}>Sign Up</Text>
					</Pressable>
				</Link>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "#FDFBF7" },
	header: { alignItems: "center", marginBottom: 32 },
	title: { fontSize: 28, fontWeight: "bold", color: "#4A5D4E", marginBottom: 8 },
	subtitle: { fontSize: 16, color: "#7FA99B" },
	form: { width: "100%", maxWidth: 300, marginBottom: 32 },
	label: { fontSize: 14, fontWeight: "600", color: "#4A5D4E", marginBottom: 8, marginLeft: 4 },
	input: { backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E5E5E5", borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 16 },
	button: { backgroundColor: "#7FA99B", width: "100%", maxWidth: 300, padding: 16, borderRadius: 12, alignItems: "center" },
	buttonText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
	footer: { flexDirection: "row", marginTop: 24 },
	footerText: { color: "#666" },
	link: { color: "#7FA99B", fontWeight: "bold" },
});
