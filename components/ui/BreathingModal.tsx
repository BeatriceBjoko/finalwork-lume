import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FONTS } from "../../constants/theme";
import { BREATHING, type Session, type SessionId, useBreathing } from "../../hooks/useBreathing";
import { AnimatedScene, Ripple } from "./BreathingShapes";

const MODAL_BACKGROUNDS: Record<SessionId, [string, string, string]> = {
	box: ["#0F1F0A", "#1F2D00", "#0A1500"],
	relax: ["#1A0F2E", "#2A1B4A", "#0F0820"],
	simple: ["#0A2A1F", "#0F3A2A", "#051A12"],
};

export function BreathingModal({ session, onClose }: { session: Session | null; onClose: () => void }) {
	const { t } = useTranslation();
	const insets = useSafeAreaInsets();
	const { phase, round, secondsLeft, breathValue, haloOpacity, continuousRotation, isRunning, start, reset } = useBreathing(session);

	const haloStyle = useAnimatedStyle(() => ({ transform: [{ scale: breathValue.value * 1.4 + 0.6 }], opacity: haloOpacity.value }));
	const auraStyle = useAnimatedStyle(() => ({ transform: [{ scale: breathValue.value * 1.9 + 0.4 }], opacity: haloOpacity.value * 0.35 }));
	const coreStyle = useAnimatedStyle(() => ({ transform: [{ scale: breathValue.value * 0.5 + 0.5 }], opacity: 0.4 + breathValue.value * 0.45 }));

	const phaseLabel = useMemo(() => {
		if (phase === "inhale") return t("wellbeing.breathe.inhale");
		if (phase === "exhale") return t("wellbeing.breathe.exhale");
		if (phase === "hold1" || phase === "hold2") return t("wellbeing.breathe.hold");
		return "";
	}, [phase, t]);

	const handleClose = useCallback(() => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		reset();
		onClose();
	}, [reset, onClose]);

	if (!session) return null;

	const techniqueLabel = `${session.technique.inhale}-${session.technique.hold1}-${session.technique.exhale}${session.technique.hold2 > 0 ? `-${session.technique.hold2}` : ""}`;
	const roundLabel = session.rounds === 1 ? "ronde" : "rondes";

	return (
		<Modal visible animationType="slide" presentationStyle="fullScreen">
			<View style={styles.container}>
				<LinearGradient colors={MODAL_BACKGROUNDS[session.id]} style={StyleSheet.absoluteFill} />

				<View style={[styles.header, { paddingTop: insets.top + 12 }]}>
					<Pressable onPress={handleClose} style={styles.closeBtn} hitSlop={8}>
						<Ionicons name="chevron-down" size={26} color="#FFFFFF" />
					</Pressable>
					<View style={styles.titleWrap}>
						<Text style={styles.title}>{t(`wellbeing.sessions.${session.id}.title`)}</Text>
						<Text style={styles.subtitle}>{techniqueLabel}</Text>
					</View>
					<View style={styles.headerSpacer} />
				</View>

				<ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
					<View style={styles.scene}>
						<Ripple delay={0} durationMs={4500} color={`${session.polygonGlow}99`} />
						<Ripple delay={1500} durationMs={4500} color={`${session.polygonColor}66`} />
						<Ripple delay={3000} durationMs={4500} color={`${session.polygonGlow}77`} />

						<Animated.View style={[styles.aura, auraStyle, { backgroundColor: `${session.polygonGlow}55`, shadowColor: session.polygonGlow }]} />
						<Animated.View style={[styles.coreBlob, coreStyle, { backgroundColor: `${session.polygonGlow}88`, shadowColor: session.polygonGlow }]} />
						<Animated.View style={[styles.halo, haloStyle, { backgroundColor: `${session.polygonColor}66`, shadowColor: session.polygonColor }]} />

						<AnimatedScene session={session} breathValue={breathValue} continuousRotation={continuousRotation} />

						{isRunning && (
							<View style={styles.phaseOverlay} pointerEvents="none">
								<Text style={styles.phaseLabelText}>{phaseLabel}</Text>
								<Text style={styles.countdownText}>{secondsLeft}</Text>
							</View>
						)}
					</View>

					{isRunning && <Text style={styles.roundText}>{t("wellbeing.breathe.round", { round, total: session.rounds })}</Text>}

					{phase === "idle" && (
						<BlurView intensity={20} tint="dark" style={styles.infoCard}>
							<View style={[styles.infoCardInner, { borderColor: `${session.polygonGlow}30` }]}>
								<Text style={styles.infoDesc}>{t(`wellbeing.sessions.${session.id}.longDesc`)}</Text>
								<View style={styles.infoMeta}>
									<InfoRow icon="target" label={t("wellbeing.bestForLabel")} value={t(`wellbeing.sessions.${session.id}.bestFor`)} glow={session.polygonGlow} />
									<InfoRow icon="signal" label={t("wellbeing.levelLabel")} value={t(`wellbeing.sessions.${session.id}.level`)} glow={session.polygonGlow} />
									<InfoRow icon="clock-outline" label={t("wellbeing.duration", { minutes: session.durationMin })} value={`${session.rounds} ${roundLabel}`} glow={session.polygonGlow} />
								</View>
							</View>
						</BlurView>
					)}

					{phase === "complete" && (
						<View style={styles.completeWrap}>
							<View style={[styles.completeIcon, { backgroundColor: session.polygonColor }]}>
								<MaterialCommunityIcons name="check" size={28} color="#FFF" />
							</View>
							<Text style={styles.completeTitle}>{t("wellbeing.breathe.complete.title")}</Text>
							<Text style={styles.completeText}>{t("wellbeing.breathe.complete.message")}</Text>
						</View>
					)}

					<View style={styles.controls}>
						{phase === "idle" && (
							<Pressable onPress={start} style={[styles.primaryBtn, { backgroundColor: session.polygonGlow, shadowColor: session.polygonGlow }]}>
								<MaterialCommunityIcons name="play" size={20} color="#1F2D00" />
								<Text style={styles.primaryBtnText}>{t("wellbeing.breathe.start")}</Text>
							</Pressable>
						)}
						{isRunning && (
							<Pressable onPress={handleClose} style={styles.stopBtn}>
								<MaterialCommunityIcons name="stop" size={18} color="#FFFFFF" />
								<Text style={styles.stopBtnText}>{t("wellbeing.breathe.stop")}</Text>
							</Pressable>
						)}
						{phase === "complete" && (
							<Pressable onPress={start} style={[styles.primaryBtn, { backgroundColor: session.polygonGlow, shadowColor: session.polygonGlow }]}>
								<MaterialCommunityIcons name="restart" size={20} color="#1F2D00" />
								<Text style={styles.primaryBtnText}>{t("wellbeing.breathe.restart")}</Text>
							</Pressable>
						)}
					</View>
				</ScrollView>
			</View>
		</Modal>
	);
}

function InfoRow({ icon, label, value, glow }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; value: string; glow: string }) {
	return (
		<View style={styles.infoRow}>
			<View style={styles.infoLabelWrap}>
				<MaterialCommunityIcons name={icon} size={12} color={glow} />
				<Text style={styles.infoLabel}>{label}</Text>
			</View>
			<Text style={styles.infoValue}>{value}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 },
	closeBtn: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "rgba(255, 255, 255, 0.15)",
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.2)",
	},
	titleWrap: { alignItems: "center" },
	title: { fontFamily: FONTS.heading, fontSize: 18, color: "#FFFFFF" },
	subtitle: { fontFamily: "InterSemiBold", fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: 1, marginTop: 2 },
	headerSpacer: { width: 40 },
	scroll: { alignItems: "center", paddingHorizontal: 24, paddingBottom: 40 },

	scene: { width: BREATHING.sceneSize, height: BREATHING.sceneSize, alignItems: "center", justifyContent: "center", marginTop: 8 },
	aura: { position: "absolute", width: 220, height: 220, borderRadius: 110, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 70, elevation: 15 },
	coreBlob: { position: "absolute", width: 110, height: 110, borderRadius: 55, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 30, elevation: 12 },
	halo: { position: "absolute", width: 140, height: 140, borderRadius: 70, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 35, elevation: 14 },
	phaseOverlay: { position: "absolute", alignItems: "center", justifyContent: "center" },
	phaseLabelText: {
		fontFamily: "InterSemiBold",
		fontSize: 13,
		color: "#FFFFFF",
		opacity: 0.9,
		letterSpacing: 1.5,
		textTransform: "uppercase",
		marginBottom: 2,
		textShadowColor: "rgba(0,0,0,0.6)",
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 6,
	},
	countdownText: {
		fontFamily: FONTS.heading,
		fontSize: 52,
		color: "#FFFFFF",
		lineHeight: 56,
		textShadowColor: "rgba(0,0,0,0.55)",
		textShadowOffset: { width: 0, height: 2 },
		textShadowRadius: 10,
	},
	roundText: { fontFamily: "InterSemiBold", fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 8, letterSpacing: 0.5 },

	infoCard: { width: "100%", borderRadius: 20, overflow: "hidden", marginTop: 24, borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.15)" },
	infoCardInner: { padding: 18, backgroundColor: "rgba(255, 255, 255, 0.06)", borderTopWidth: 1 },
	infoDesc: { fontFamily: FONTS.body, fontSize: 14, color: "rgba(255, 255, 255, 0.88)", lineHeight: 22, marginBottom: 14 },
	infoMeta: { gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(255, 255, 255, 0.1)" },
	infoRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
	infoLabelWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
	infoLabel: { fontFamily: "InterMedium", fontSize: 12, color: "rgba(255, 255, 255, 0.6)", letterSpacing: 0.3 },
	infoValue: { fontFamily: "InterSemiBold", fontSize: 12, color: "#FFFFFF", textAlign: "right", flex: 1, marginLeft: 8 },

	completeWrap: { alignItems: "center", gap: 10, marginTop: 24, paddingHorizontal: 24 },
	completeIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: "center", alignItems: "center", marginBottom: 6 },
	completeTitle: { fontFamily: FONTS.heading, fontSize: 22, color: "#FFFFFF" },
	completeText: { fontFamily: FONTS.body, fontSize: 14, color: "rgba(255, 255, 255, 0.75)", textAlign: "center", lineHeight: 21 },

	controls: { width: "100%", marginTop: 28, alignItems: "center" },
	primaryBtn: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingHorizontal: 40,
		paddingVertical: 16,
		borderRadius: 14,
		shadowOffset: { width: 0, height: 5 },
		shadowOpacity: 0.55,
		shadowRadius: 18,
		elevation: 6,
	},
	primaryBtnText: { fontFamily: FONTS.button, fontSize: 15, color: "#1F2D00" },
	stopBtn: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 14,
		borderWidth: 1.5,
		borderColor: "rgba(255, 255, 255, 0.3)",
		backgroundColor: "rgba(255, 255, 255, 0.08)",
	},
	stopBtnText: { fontFamily: FONTS.button, fontSize: 14, color: "#FFFFFF" },
});
