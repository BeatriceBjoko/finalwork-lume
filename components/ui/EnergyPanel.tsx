import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";

import { COLORS } from "../../constants/theme";
import { useSession } from "../../context";
import { useMentalEnergy } from "../../hooks/useMentalEnergy";
import { useSupportRequest } from "../../hooks/useSupportRequest";
import CustomAlert from "./CustomAlert";
import { EnergyBattery } from "./EnergyBattery";

export function EnergyPanel() {
	const { t } = useTranslation();
	const { userData } = useSession();
	const { percentage, setEnergy, level, color, isLow } = useMentalEnergy();
	const { send } = useSupportRequest();

	const [confirmVisible, setConfirmVisible] = useState(false);
	const [helpSent, setHelpSent] = useState(false);
	const [sending, setSending] = useState(false);

	const pulse = useSharedValue(1);
	useEffect(() => {
		pulse.value = isLow && !helpSent ? withRepeat(withSequence(withTiming(1.04, { duration: 1000 }), withTiming(1, { duration: 1000 })), -1, true) : withTiming(1);
	}, [isLow, helpSent, pulse]);
	const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

	const openConfirm = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		setConfirmVisible(true);
	};

	const confirmHelp = async () => {
		setConfirmVisible(false);
		setSending(true);
		try {
			const name = userData?.name ?? t("wellbeing.energy.sos.fallbackName");
			await send({
				title: t("wellbeing.energy.sos.noteTitle", { name }),
				content: t("wellbeing.energy.sos.noteBody"),
			});
			setHelpSent(true);
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		} catch {
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
		} finally {
			setSending(false);
		}
	};

	const mode: "low" | "default" | "sent" = helpSent ? "sent" : isLow ? "low" : "default";

	return (
		<View>
			<View style={styles.glassContainer}>
				<BlurView intensity={70} tint="light" style={styles.glassCard}>
					<View style={styles.cardHeader}>
						<Text style={styles.statusLabel}>{t(`wellbeing.energy.status.${level}`)}</Text>
						<Text style={[styles.percentageText, { color }]}>{percentage}%</Text>
					</View>
					<EnergyBattery percentage={percentage} color={color} onChange={setEnergy} />
					<Text style={styles.controlInfo}>{t("wellbeing.energy.sliderHint")}</Text>
				</BlurView>
			</View>

			<Animated.View style={[styles.glassContainer, mode === "default" && styles.sosContainerDefault, mode === "sent" && styles.sosContainerSent, pulseStyle]}>
				<BlurView intensity={80} tint="light" style={[styles.glassCard, styles.sosCardRow, mode === "low" && styles.sosCardActive, mode === "sent" && styles.sosCardSent]}>
					{mode === "low" && (
						<View style={[styles.sosIconCircle, styles.sosIconCircleActive]}>
							<Ionicons name="hand-right-sharp" size={26} color="#C94B47" />
						</View>
					)}

					<View style={[styles.sosTextWrap, mode !== "low" && styles.sosTextWrapFlush]}>
						<Text style={[styles.sosTitle, mode === "low" && styles.sosTitleActive, mode === "sent" && styles.sosTitleSent]}>
							{mode === "sent" ? t("wellbeing.energy.sos.sentTitle") : mode === "low" ? t("wellbeing.energy.sos.titleLow") : t("wellbeing.energy.sos.titleDefault")}
						</Text>
						<Text style={[styles.sosSub, mode === "low" && styles.sosSubActive, mode === "sent" && styles.sosSubSent]} numberOfLines={2}>
							{mode === "sent" ? t("wellbeing.energy.sos.sent") : mode === "low" ? t("wellbeing.energy.sos.subLow") : t("wellbeing.energy.sos.subDefault")}
						</Text>
					</View>

					{mode === "sent" ? (
						<View style={[styles.sosBtn, styles.sosBtnSent]}>
							<MaterialCommunityIcons name="check" size={20} color="#FFF" />
						</View>
					) : (
						<Pressable onPress={openConfirm} disabled={sending} style={[styles.sosBtn, mode === "low" ? styles.sosBtnLow : styles.sosBtnDefault, sending && { opacity: 0.5 }]}>
							<MaterialCommunityIcons name="play" size={20} color="#FFF" />
						</Pressable>
					)}
				</BlurView>
			</Animated.View>

			<CustomAlert
				visible={confirmVisible}
				title={t("wellbeing.energy.sos.confirmTitle")}
				message={t("wellbeing.energy.sos.confirmMessage")}
				confirmText={t("wellbeing.energy.sos.confirm")}
				cancelText={t("common.cancel")}
				onConfirm={confirmHelp}
				onCancel={() => setConfirmVisible(false)}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	glassContainer: {
		borderRadius: 32,
		marginBottom: 20,
		overflow: "hidden",
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.8)",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.05,
		shadowRadius: 20,
		elevation: 4,
	},
	sosContainerDefault: { borderColor: COLORS.iconColor, borderWidth: 1.5 },
	sosContainerSent: { borderColor: "rgba(53, 78, 0, 0.4)", borderWidth: 1.5 },
	glassCard: { padding: 24, backgroundColor: "rgba(255, 255, 255, 0.3)" },

	cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
	statusLabel: { fontFamily: "BricolageBold", fontSize: 18, color: COLORS.primary },
	percentageText: { fontFamily: "BricolageBold", fontSize: 28 },
	controlInfo: { fontFamily: "InterMedium", fontSize: 12, color: "rgba(35, 54, 0, 0.5)", textAlign: "center", marginTop: 20 },

	sosCardRow: { flexDirection: "row", alignItems: "center", padding: 20 },
	sosCardActive: { backgroundColor: "rgba(201, 75, 71, 0.15)" },
	sosCardSent: { backgroundColor: "rgba(53, 78, 0, 0.10)" },

	sosIconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: "rgba(255, 255, 255, 0.5)", justifyContent: "center", alignItems: "center" },
	sosIconCircleActive: { backgroundColor: "#FFF", shadowColor: "#C94B47", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },

	sosTextWrap: { flex: 1, paddingHorizontal: 16 },
	sosTextWrapFlush: { paddingLeft: 0 },
	sosTitle: { fontFamily: "BricolageMedium", fontSize: 16, color: COLORS.primary, marginBottom: 2 },
	sosTitleActive: { color: "#C94B47", fontFamily: "BricolageBold" },
	sosTitleSent: { color: COLORS.buttonFill, fontFamily: "BricolageBold" },
	sosSub: { fontFamily: "InterRegular", fontSize: 13, color: "rgba(35, 54, 0, 0.6)", lineHeight: 18 },
	sosSubActive: { color: "rgba(201, 75, 71, 0.9)" },
	sosSubSent: { color: "rgba(53, 78, 0, 0.7)" },

	sosBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
	sosBtnDefault: { backgroundColor: COLORS.buttonFill },
	sosBtnLow: { backgroundColor: "#C94B47" },
	sosBtnSent: { backgroundColor: COLORS.buttonFill },
});
