import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/theme";

interface InviteModalProps {
	visible: boolean;
	onClose: () => void;
	inviteCode: string;
	validUntil: string;
	isLoading: boolean;
	onShareSMS: () => void;
	onShareEmail: () => void;
}

export default function InviteModal({ visible, onClose, inviteCode, validUntil, isLoading, onShareSMS, onShareEmail }: InviteModalProps) {
	const { t } = useTranslation();

	const spacedCode = inviteCode.split("").join(" ");

	const [copied, setCopied] = useState(false);
	const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(
		() => () => {
			if (copiedTimer.current) clearTimeout(copiedTimer.current);
		},
		[],
	);

	// Copies the full code ("LUME-ABC234") so the other person can paste it in the join screen
	const handleCopy = async () => {
		await Clipboard.setStringAsync(`LUME-${inviteCode}`);
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		setCopied(true);
		if (copiedTimer.current) clearTimeout(copiedTimer.current);
		copiedTimer.current = setTimeout(() => setCopied(false), 2000);
	};

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<View style={styles.overlay}>
				<Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

				<View style={styles.shadowWrapper1}>
					<View style={styles.shadowWrapper2}>
						<BlurView intensity={25} tint="light" style={styles.modalContent}>
							<View style={styles.glassBackground} />

							<Pressable style={styles.closeButton} onPress={onClose}>
								<Ionicons name="close" size={24} color={COLORS.iconColor} />
							</Pressable>

							<View style={styles.topSection}>
								<Text style={styles.title}>{t("inviteModal.title")}</Text>

								<Pressable onPress={handleCopy} disabled={isLoading || !inviteCode} style={({ pressed }) => [styles.dashedBox, pressed && styles.dashedBoxPressed]}>
									{isLoading ? (
										<ActivityIndicator color="#635979" />
									) : (
										<>
											<Text style={styles.codeText}>{spacedCode}</Text>
											<View style={styles.copyHint}>
												<Ionicons name={copied ? "checkmark-circle" : "copy-outline"} size={14} color={copied ? "#3F6B00" : "#635979"} />
												<Text style={[styles.copyHintText, copied && styles.copyHintTextDone]}>{copied ? t("inviteModal.copied") : t("inviteModal.tapToCopy")}</Text>
											</View>
										</>
									)}
								</Pressable>

								<View style={styles.timerRow}>
									<MaterialCommunityIcons name="calendar-clock-outline" size={22} color="#354E00" />
									<Text style={styles.timerText}>{validUntil ? t("inviteModal.validUntil", { date: validUntil }) : " "}</Text>
								</View>
								<Text style={styles.timerSubtitle}>{t("inviteModal.validSubtitle")}</Text>
							</View>

							<BlurView intensity={10} tint="default" style={styles.bottomSectionWrapper}>
								<View style={styles.bottomSectionBackground} />

								<Text style={styles.orText}>{t("inviteModal.or")}</Text>
								<Text style={styles.shareSubtitle}>{t("inviteModal.shareText")}</Text>

								<View style={styles.iconRow}>
									<Pressable onPress={onShareSMS} style={styles.shareIcon}>
										<Ionicons name="chatbubble-outline" size={28} color="#354E00" />
									</Pressable>
									<Pressable onPress={onShareEmail} style={styles.shareIcon}>
										<Ionicons name="mail-outline" size={32} color="#354E00" />
									</Pressable>
								</View>
							</BlurView>
						</BlurView>
					</View>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.15)", justifyContent: "center", alignItems: "center", padding: 24 },
	shadowWrapper1: { width: "100%", shadowColor: "#233600", shadowOffset: { width: 0, height: 35 }, shadowOpacity: 0.25, shadowRadius: 15 },
	shadowWrapper2: { width: "100%", shadowColor: "#233600", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 25 },
	modalContent: { width: "100%", borderRadius: 12, borderWidth: 1, borderColor: "rgba(53, 78, 0, 0.20)", overflow: "hidden" },
	glassBackground: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(255, 255, 255, 0.10)" },
	closeButton: { position: "absolute", top: 16, right: 16, zIndex: 10, padding: 4 },
	topSection: { paddingTop: 30, paddingBottom: 24, paddingHorizontal: 20, alignItems: "center" },
	title: { fontFamily: "BricolageMedium", fontSize: 20, color: "#131F00", letterSpacing: 1, marginBottom: 24 },
	dashedBox: {
		width: "95%",
		borderWidth: 2,
		borderStyle: "dashed",
		borderColor: "rgba(75, 66, 96, 0.3)",
		backgroundColor: "rgba(75, 66, 96, 0.07)",
		borderRadius: 12,
		paddingVertical: 26,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 28,
	},
	dashedBoxPressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
	codeText: { fontFamily: "InterBold", fontSize: 25, color: "#635979", letterSpacing: 4 },
	copyHint: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 10 },
	copyHintText: { fontFamily: "InterMedium", fontSize: 12, color: "#635979" },
	copyHintTextDone: { color: "#3F6B00" },
	timerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 4 },
	timerText: { fontFamily: "InterBold", fontSize: 16, color: "#354E00" },
	timerSubtitle: { fontFamily: "InterRegular", fontSize: 12, color: "#94A3B8" },
	bottomSectionWrapper: {
		width: "100%",
		paddingVertical: 14,
		paddingHorizontal: 20,
		alignItems: "center",
		borderTopWidth: 1,
		borderColor: "rgba(0,0,0,0.05)",
		overflow: "hidden",
	},
	bottomSectionBackground: {
		...StyleSheet.absoluteFill,
		backgroundColor: "rgba(248, 250, 252, 0.20)",
	},
	orText: { fontFamily: "InterSemiBold", fontSize: 14, color: "#131F00", marginBottom: 4 },
	shareSubtitle: { fontFamily: "InterRegular", fontSize: 14, color: "#131F00", marginBottom: 10 },
	iconRow: { flexDirection: "row", gap: 30, marginBottom: 4 },
	shareIcon: { padding: 4 },
});
