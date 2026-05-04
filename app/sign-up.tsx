import { Link } from "expo-router";
import { ImageBackground, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Button from "../components/ui/Button";
import Checkbox from "../components/ui/Checkbox";
import GlassCard from "../components/ui/GlassCard";
import Input from "../components/ui/Input";
import { COLORS, FONTS } from "../constants/theme";
import { useSignUp } from "../hooks/useSignUp";

export default function SignUp() {
	const { name, setName, email, setEmail, password, setPassword, termsAccepted, setTermsAccepted, isSubmitting, handleSignUpPress } = useSignUp();

	const TermsLabel = (
		<Text style={styles.termsText}>
			Ik ga akkoord met de <Text style={styles.linkText}>Privacyvoorwaarden</Text> en <Text style={styles.linkText}>Gebruiksvoorwaarden</Text>
		</Text>
	);

	return (
		<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
			<ImageBackground source={require("../assets/images/signup-bg.jpg")} style={styles.background} resizeMode="cover">
				<View style={styles.spacer} />

				<GlassCard>
					<View style={styles.header}>
						<Text style={styles.title}>Account aanmaken</Text>
						<Text style={styles.subtitle}>Maak een account om je zorgkring te starten</Text>
					</View>

					<Input label="Voornaam + naam" placeholder="Beatrice Bjoko" value={name} onChangeText={setName} autoCapitalize="words" />

					<Input label="E-mail" placeholder="beatricebjoko@gmail.be" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

					<Input label="Wachtwoord" placeholder="**********" value={password} onChangeText={setPassword} secureTextEntry />

					<Checkbox checked={termsAccepted} onChange={setTermsAccepted} label={TermsLabel} />

					<Text style={styles.securityNote}>Je gegevens blijven veilig binnen je zorgkring</Text>

					<Button
						title={isSubmitting ? "Laden..." : "Account aanmaken"}
						onPress={handleSignUpPress}
						disabled={isSubmitting || !termsAccepted} // Knop is uitgeschakeld als voorwaarden niet zijn geaccepteerd
						style={{ marginTop: 8 }}
					/>

					<View style={styles.footer}>
						<Text style={styles.footerText}>Al een account? </Text>
						<Link href="/sign-in" asChild>
							<Pressable>
								<Text style={styles.footerLink}>Log in</Text>
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
	header: { alignItems: "center", marginBottom: 32, zIndex: 1 },
	title: {
		fontFamily: FONTS.heading,
		fontSize: 28,
		color: COLORS.primary,
		marginBottom: 8,
		letterSpacing: 0.5,
	},
	subtitle: {
		fontFamily: FONTS.body,
		fontSize: 14,
		color: COLORS.primary,
	},
	termsText: {
		fontSize: 12,
		color: "black",
		lineHeight: 18,
		fontStyle: "italic",
	},
	linkText: {
		color: COLORS.primary,
		textDecorationLine: "underline",
	},
	securityNote: {
		fontFamily: FONTS.body,
		fontSize: 11,
		color: COLORS.primary,
		textAlign: "center",
		opacity: 0.8,
		marginBottom: 16,
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
