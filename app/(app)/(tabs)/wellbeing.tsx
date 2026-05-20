import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BreathingModal } from "../../../components/ui/BreathingModal";
import { MiniShape } from "../../../components/ui/BreathingShapes";
import { COLORS, FONTS } from "../../../constants/theme";
import type { Session, SessionCategory } from "../../../hooks/useBreathing";

const SESSIONS: Session[] = [
	{
		id: "box",
		technique: { inhale: 4, hold1: 4, exhale: 4, hold2: 4 },
		rounds: 12,
		durationMin: 3,
		gradient: ["#1F2D00", "#354E00"],
		accentColor: COLORS.accent,
		textOnGradient: "#FFFFFF",
		polygonColor: "#FFE500",
		polygonGlow: "#FFFCA0",
		shape: "polygon",
		vertexCount: 4,
		rotateOffset: 45,
		categories: ["breath", "energy"],
	},
	{
		id: "relax",
		technique: { inhale: 4, hold1: 7, exhale: 8, hold2: 0 },
		rounds: 8,
		durationMin: 3,
		gradient: ["#F5EDFB", "#DCC7F0"],
		accentColor: "#8A66C4",
		textOnGradient: "#3D2D5C",
		polygonColor: "#7B5BB0",
		polygonGlow: "#C4B0E6",
		shape: "blob",
		vertexCount: 6,
		rotateOffset: 0,
		categories: ["breath", "relax", "sleep"],
	},
	{
		id: "simple",
		technique: { inhale: 4, hold1: 0, exhale: 6, hold2: 0 },
		rounds: 15,
		durationMin: 3,
		gradient: ["#EAFBF1", "#BFE9D2"],
		accentColor: "#3F9070",
		textOnGradient: "#1B4D3A",
		polygonColor: "#2A7A5A",
		polygonGlow: "#9AD9B5",
		shape: "bloom",
		vertexCount: 8,
		rotateOffset: 22.5,
		categories: ["breath", "relax"],
	},
];

const CATEGORIES: readonly (SessionCategory | "all")[] = ["all", "breath", "relax", "sleep", "energy"];

export default function WellbeingScreen() {
	const { t, i18n } = useTranslation();
	const insets = useSafeAreaInsets();
	const [activeSession, setActiveSession] = useState<Session | null>(null);
	const [activeCategory, setActiveCategory] = useState<SessionCategory | "all">("all");

	const filteredSessions = useMemo(() => {
		if (activeCategory === "all") return SESSIONS;
		return SESSIONS.filter((s) => s.categories.includes(activeCategory));
	}, [activeCategory]);

	const featured = filteredSessions[0] ?? null;
	const others = filteredSessions.slice(1);

	const openSession = useCallback((session: Session) => {
		Haptics.selectionAsync();
		setActiveSession(session);
	}, []);
	const closeSession = useCallback(() => setActiveSession(null), []);
	const selectCategory = useCallback((cat: SessionCategory | "all") => {
		Haptics.selectionAsync();
		setActiveCategory(cat);
	}, []);

	return (
		<View style={styles.container}>
			<ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 160 }]} showsVerticalScrollIndicator={false}>
				<View style={styles.header}>
					<View style={styles.titleRow}>
						<Text style={styles.titleText}>{t("wellbeing.title")} </Text>
						<View style={styles.highlightWrapper}>
							<Text style={styles.highlightText}>{t("wellbeing.titleAccent")}</Text>
						</View>
					</View>
					<Text style={styles.subtitle}>{t("wellbeing.subtitle")}</Text>
				</View>

				<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow} style={styles.categoriesScroll}>
					{CATEGORIES.map((cat) => {
						const isActive = activeCategory === cat;
						return (
							<Pressable key={cat} onPress={() => selectCategory(cat)} style={[styles.categoryChip, isActive && styles.categoryChipActive]}>
								<Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>{t(`wellbeing.categories.${cat}`)}</Text>
							</Pressable>
						);
					})}
				</ScrollView>

				{featured ? (
					<>
						<HeroCard session={featured} onPress={openSession} />

						{others.length > 0 && (
							<>
								<View style={styles.sectionHeader}>
									<Text style={styles.sectionTitle}>{t("wellbeing.recommended")}</Text>
									<View style={styles.viewAll}>
										<Text style={styles.viewAllText}>{t("wellbeing.viewAll")}</Text>
										<Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
									</View>
								</View>

								<View style={styles.sessionGrid}>
									{others.map((session) => (
										<GridCard key={session.id} session={session} onPress={openSession} />
									))}
								</View>
							</>
						)}
					</>
				) : (
					<EmptyCategoryState isFrench={i18n.language.startsWith("fr")} />
				)}

				<View style={styles.tipCardWrap}>
					<BlurView intensity={20} tint="light" style={styles.tipCard}>
						<View style={styles.tipBadge}>
							<MaterialCommunityIcons name="lightbulb-on" size={14} color={COLORS.primary} />
							<Text style={styles.tipBadgeText}>{t("wellbeing.tip.title")}</Text>
						</View>
						<Text style={styles.tipBody}>{t("wellbeing.tip.body")}</Text>
					</BlurView>
				</View>
			</ScrollView>

			<BreathingModal session={activeSession} onClose={closeSession} />
		</View>
	);
}

function EmptyCategoryState({ isFrench }: { isFrench: boolean }) {
	const title = isFrench ? "Aucune session dans cette catégorie" : "Geen sessies in deze categorie";
	const subtitle = isFrench ? "Essayez une autre catégorie ci-dessus." : "Probeer een andere categorie hierboven.";
	return (
		<View style={styles.emptyState}>
			<View style={styles.emptyIcon}>
				<MaterialCommunityIcons name="meditation" size={42} color="rgba(35, 54, 0, 0.35)" />
			</View>
			<Text style={styles.emptyTitle}>{title}</Text>
			<Text style={styles.emptyText}>{subtitle}</Text>
		</View>
	);
}

function HeroCard({ session, onPress }: { session: Session; onPress: (s: Session) => void }) {
	const { t } = useTranslation();
	return (
		<Pressable onPress={() => onPress(session)} style={[styles.heroCard, { borderColor: `${session.polygonGlow}55`, shadowColor: session.polygonGlow }]}>
			<LinearGradient colors={session.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
			<LinearGradient colors={["rgba(255,255,255,0.18)", "rgba(255,255,255,0)"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.6 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
			<BlurView intensity={12} tint="dark" style={styles.glassOverlay} />

			<View style={styles.heroPolygonWrap}>
				<MiniShape session={session} size={110} />
			</View>

			<View style={styles.heroContent}>
				<View style={[styles.heroBadge, { borderColor: `${session.polygonGlow}66` }]}>
					<MaterialCommunityIcons name="meditation" size={13} color={session.textOnGradient} />
					<Text style={[styles.heroBadgeText, { color: session.textOnGradient }]}>{t("wellbeing.breathe.title")}</Text>
				</View>

				<View>
					<Text style={[styles.heroTitle, { color: session.textOnGradient }]}>{t(`wellbeing.sessions.${session.id}.title`)}</Text>
					<Text style={[styles.heroDesc, { color: session.textOnGradient, opacity: 0.78 }]}>{t(`wellbeing.sessions.${session.id}.shortDesc`)}</Text>

					<View style={styles.heroFooter}>
						<View style={styles.iconLabel}>
							<MaterialCommunityIcons name="clock-outline" size={14} color={session.textOnGradient} />
							<Text style={[styles.heroDurationText, { color: session.textOnGradient }]}>{t("wellbeing.duration", { minutes: session.durationMin })}</Text>
						</View>
						<View style={[styles.heroPlay, { backgroundColor: session.accentColor, shadowColor: session.polygonGlow }]}>
							<MaterialCommunityIcons name="play" size={18} color={COLORS.primary} />
						</View>
					</View>
				</View>
			</View>
		</Pressable>
	);
}

function GridCard({ session, onPress }: { session: Session; onPress: (s: Session) => void }) {
	const { t } = useTranslation();
	return (
		<Pressable onPress={() => onPress(session)} style={[styles.gridCard, { borderColor: `${session.accentColor}55`, shadowColor: session.accentColor }]}>
			<LinearGradient colors={session.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
			<LinearGradient colors={["rgba(255,255,255,0.55)", "rgba(255,255,255,0)"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.5 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
			<LinearGradient colors={["rgba(255,255,255,0)", `${session.polygonGlow}30`, "rgba(255,255,255,0)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
			<BlurView intensity={14} tint="light" style={styles.glassOverlay} />
			<View pointerEvents="none" style={styles.glassInset} />

			<View style={styles.gridPolygonWrap}>
				<MiniShape session={session} size={58} />
			</View>

			<View style={styles.gridContent}>
				<View>
					<Text style={[styles.gridTitle, { color: session.textOnGradient }]} numberOfLines={2}>
						{t(`wellbeing.sessions.${session.id}.title`)}
					</Text>
					<Text style={[styles.gridDesc, { color: session.textOnGradient, opacity: 0.72 }]} numberOfLines={2}>
						{t(`wellbeing.sessions.${session.id}.shortDesc`)}
					</Text>
				</View>
				<View style={styles.gridFooter}>
					<View style={styles.iconLabel}>
						<MaterialCommunityIcons name="clock-outline" size={11} color={session.textOnGradient} />
						<Text style={[styles.gridDurationText, { color: session.textOnGradient }]}>{t("wellbeing.duration", { minutes: session.durationMin })}</Text>
					</View>
					<View style={[styles.gridPlay, { backgroundColor: session.accentColor, shadowColor: session.accentColor }]}>
						<MaterialCommunityIcons name="play" size={13} color="#FFF" />
					</View>
				</View>
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: COLORS.background },
	scroll: { paddingHorizontal: 20, paddingTop: 20 },

	header: { alignItems: "center", marginBottom: 22 },
	titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
	titleText: { fontFamily: FONTS.heading, fontSize: 28, color: COLORS.primary },
	highlightWrapper: { backgroundColor: COLORS.accent, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 20 },
	highlightText: { fontFamily: FONTS.heading, fontSize: 28, color: COLORS.primary },
	subtitle: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.primary, opacity: 0.6, marginTop: 8, textAlign: "center" },

	glassOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.5 },
	glassInset: { ...StyleSheet.absoluteFillObject, borderRadius: 19, borderWidth: 1, borderColor: "rgba(255,255,255,0.55)", margin: 1 },
	iconLabel: { flexDirection: "row", alignItems: "center", gap: 5 },

	emptyState: { alignItems: "center", paddingVertical: 48, paddingHorizontal: 24, gap: 12, marginBottom: 24 },
	emptyIcon: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: "rgba(239, 252, 0, 0.18)",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 4,
	},
	emptyTitle: { fontFamily: FONTS.heading, fontSize: 17, color: COLORS.primary, textAlign: "center" },
	emptyText: { fontFamily: FONTS.body, fontSize: 13, color: "rgba(35, 54, 0, 0.55)", textAlign: "center", lineHeight: 20 },

	heroCard: {
		width: "100%",
		minHeight: 200,
		borderRadius: 24,
		overflow: "hidden",
		marginBottom: 22,
		borderWidth: 1.5,
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.28,
		shadowRadius: 18,
		elevation: 7,
		position: "relative",
	},
	heroPolygonWrap: { position: "absolute", top: 14, right: 14 },
	heroContent: { padding: 20, flex: 1, justifyContent: "space-between" },
	heroBadge: {
		flexDirection: "row",
		alignItems: "center",
		alignSelf: "flex-start",
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 12,
		gap: 5,
		borderWidth: 1,
		backgroundColor: "rgba(255,255,255,0.12)",
	},
	heroBadgeText: { fontFamily: "InterSemiBold", fontSize: 11, letterSpacing: 0.5 },
	heroTitle: { fontFamily: FONTS.heading, fontSize: 26, marginTop: 24, marginBottom: 4, letterSpacing: -0.5 },
	heroDesc: { fontFamily: FONTS.body, fontSize: 13, lineHeight: 19, marginBottom: 18 },
	heroFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
	heroDurationText: { fontFamily: "InterMedium", fontSize: 13 },
	heroPlay: {
		width: 42,
		height: 42,
		borderRadius: 21,
		alignItems: "center",
		justifyContent: "center",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.45,
		shadowRadius: 10,
		elevation: 5,
	},

	categoriesScroll: { marginBottom: 18 },
	categoriesRow: { gap: 8, paddingRight: 24 },
	categoryChip: {
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 20,
		backgroundColor: COLORS.white,
		borderWidth: 1,
		borderColor: "rgba(35, 54, 0, 0.1)",
	},
	categoryChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
	categoryChipText: { fontFamily: "InterMedium", fontSize: 12, color: COLORS.primary },
	categoryChipTextActive: { color: COLORS.accent, fontFamily: "InterSemiBold" },

	sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
	sectionTitle: { fontFamily: FONTS.heading, fontSize: 18, color: COLORS.primary },
	viewAll: { flexDirection: "row", alignItems: "center", gap: 2 },
	viewAllText: { fontFamily: "InterMedium", fontSize: 12, color: COLORS.primary, opacity: 0.7 },

	sessionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
	gridCard: {
		width: "48%",
		minHeight: 180,
		borderRadius: 20,
		overflow: "hidden",
		borderWidth: 1.5,
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.22,
		shadowRadius: 14,
		elevation: 5,
		position: "relative",
	},
	gridPolygonWrap: { position: "absolute", top: 10, right: 10 },
	gridContent: { padding: 14, flex: 1, justifyContent: "space-between", minHeight: 180 },
	gridTitle: { fontFamily: "InterBold", fontSize: 14, marginBottom: 2, marginTop: 60, lineHeight: 18 },
	gridDesc: { fontFamily: FONTS.body, fontSize: 11, lineHeight: 15 },
	gridFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
	gridDurationText: { fontFamily: "InterMedium", fontSize: 11 },
	gridPlay: {
		width: 32,
		height: 32,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.45,
		shadowRadius: 8,
		elevation: 4,
	},

	tipCardWrap: {
		borderRadius: 20,
		overflow: "hidden",
		borderWidth: 1.5,
		borderColor: "rgba(239, 252, 0, 0.55)",
		shadowColor: "#EFFC00",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 10,
		elevation: 3,
	},
	tipCard: { padding: 18, backgroundColor: "rgba(255, 255, 255, 0.5)" },
	tipBadge: {
		flexDirection: "row",
		alignItems: "center",
		alignSelf: "flex-start",
		backgroundColor: COLORS.accent,
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 12,
		gap: 5,
		marginBottom: 10,
	},
	tipBadgeText: { fontFamily: "InterBold", fontSize: 11, color: COLORS.primary, letterSpacing: 0.5 },
	tipBody: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.primary, lineHeight: 20 },
});
