import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { ImageBackground, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { COLORS, FONTS, SIZES } from "../constants/theme";
import { useSignIn } from "../hooks/useSignIn";

export default function SignIn() {
	const { email, setEmail, password, setPassword, isSubmitting, handleSignInPress } = useSignIn();

	return (
		<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
			<ImageBackground source={require("../assets/images/login-bg.jpg")} style={styles.background} resizeMode="cover">
				<View style={styles.spacer} />

				<BlurView intensity={15} tint="light" style={styles.cardWrapper}>
					<LinearGradient colors={[COLORS.glassGradientStart, COLORS.glassGradientEnd]} style={styles.gradientCard}>
						<LinearGradient colors={[COLORS.innerGlowStart, COLORS.innerGlowEnd]} style={styles.innerGlow} pointerEvents="none" />

						<View style={styles.header}>
							<Text style={styles.title}>LOG IN</Text>
							<Text style={styles.subtitle}>Voor mantelzorgers in België</Text>
						</View>

						<Input label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
						<Input label="Wachtwoord" value={password} onChangeText={setPassword} secureTextEntry />

						<Button title={isSubmitting ? "Laden..." : "Account aanmaken"} onPress={handleSignInPress} disabled={isSubmitting} style={{ marginTop: 16 }} />

						<Link href="/sign-up" asChild>
							<Pressable style={styles.forgotPassword}>
								<Text style={styles.forgotPasswordText}>Wachtwoord vergeten?</Text>
							</Pressable>
						</Link>
					</LinearGradient>
				</BlurView>
			</ImageBackground>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	background: { flex: 1, width: "100%", height: "100%" },
	spacer: { flex: 1 },
	cardWrapper: {
		borderTopLeftRadius: SIZES.cardRadius,
		borderTopRightRadius: SIZES.cardRadius,
		overflow: "hidden",
	},
	gradientCard: {
		position: "relative",
		paddingHorizontal: 32,
		paddingTop: 40,
		paddingBottom: 60,
		borderTopLeftRadius: SIZES.cardRadius,
		borderTopRightRadius: SIZES.cardRadius,

		borderWidth: 2,
		borderBottomWidth: 0,
		borderColor: COLORS.glassBorder,
	},
	innerGlow: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		height: 44,
		borderTopLeftRadius: SIZES.cardRadius,
		borderTopRightRadius: SIZES.cardRadius,
	},
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
	forgotPassword: { marginTop: 24, alignItems: "center", zIndex: 1 },
	forgotPasswordText: {
		fontFamily: FONTS.body,
		fontSize: 12,
		color: COLORS.primary,
		textDecorationLine: "underline",
	},
});
