import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, ViewProps } from "react-native";
import { COLORS, SIZES } from "../../constants/theme";

interface GlassCardProps extends ViewProps {
	children: React.ReactNode;
}

export default function GlassCard({ children, style, ...props }: GlassCardProps) {
	return (
		<BlurView intensity={60} tint="light" style={[styles.cardWrapper, style]} {...props}>
			<LinearGradient colors={[COLORS.glassGradientStart, COLORS.glassGradientEnd]} style={styles.gradientCard}>
				<LinearGradient colors={[COLORS.innerGlowStart, COLORS.innerGlowEnd]} style={styles.innerGlow} pointerEvents="none" />

				{children}
			</LinearGradient>
		</BlurView>
	);
}

const styles = StyleSheet.create({
	cardWrapper: {
		borderTopLeftRadius: SIZES.cardRadius,
		borderTopRightRadius: SIZES.cardRadius,
		overflow: "hidden",
		width: "100%",
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
		height: 24,
		borderTopLeftRadius: SIZES.cardRadius,
		borderTopRightRadius: SIZES.cardRadius,
	},
});
