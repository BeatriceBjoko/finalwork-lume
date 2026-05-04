import { Link } from "expo-router";
import { ImageBackground, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import Button from "../components/ui/Button";
import GlassCard from "../components/ui/GlassCard";
import Input from "../components/ui/Input";
import { COLORS, FONTS } from "../constants/theme";

import { useSignIn } from "../hooks/useSignIn";

export default function SignIn() {
	// Haal alle logica op uit de hook
	const { email, setEmail, password, setPassword, isSubmitting, handleSignInPress } = useSignIn();

	return (
		<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
			<ImageBackground source={require("../assets/images/login-bg.jpg")} style={styles.background} resizeMode="cover">
				<View style={styles.spacer} />

				<GlassCard>
					<View style={styles.header}>
						<Text style={styles.title}>LOG IN</Text>
						<Text style={styles.subtitle}>Voor mantelzorgers in België</Text>
					</View>

					<Input label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

					<Input label="Wachtwoord" value={password} onChangeText={setPassword} secureTextEntry />

					<Button title={isSubmitting ? "Laden..." : "Log In"} onPress={handleSignInPress} disabled={isSubmitting} style={{ marginTop: 16 }} />

					<Link href="/sign-up" asChild>
						<Pressable style={styles.forgotPassword}>
							<Text style={styles.forgotPasswordText}>Wachtwoord vergeten?</Text>
						</Pressable>
					</Link>

					<View style={styles.footer}>
						<Text style={styles.footerText}>Nog geen account? </Text>
						<Link href="/sign-up" asChild>
							<Pressable>
								<Text style={styles.footerLink}>Account aanmaken</Text>
							</Pressable>
						</Link>
					</View>
				</GlassCard>
			</ImageBackground>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	background: { flex: 1, width: "100%", height: "100%" },
	spacer: { flex: 1 },
	header: { alignItems: "center", marginBottom: 40, zIndex: 1 },
	title: {
		fontFamily: FONTS.heading,
		fontSize: 32,
		color: COLORS.primary,
		marginBottom: 8,
		letterSpacing: 1,
	},
	subtitle: {
		fontFamily: FONTS.body,
		fontSize: 14,
		color: COLORS.primary,
	},
	forgotPassword: {
		marginTop: 24,
		alignItems: "center",
		zIndex: 1,
	},
	forgotPasswordText: {
		fontFamily: FONTS.body,
		fontSize: 12,
		color: COLORS.primary,
		textDecorationLine: "underline",
	},
	footer: {
		flexDirection: "row",
		justifyContent: "center",
		marginTop: 24,
		zIndex: 1,
	},
	footerText: {
		fontFamily: FONTS.body,
		fontSize: 13,
		color: COLORS.primary,
	},
	footerLink: {
		fontFamily: FONTS.button,
		fontSize: 13,
		color: COLORS.primary,
		textDecorationLine: "underline",
	},
});
