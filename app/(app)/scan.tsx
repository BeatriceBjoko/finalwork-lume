import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CustomAlert from "../../components/ui/CustomAlert";
import { COLORS, FONTS } from "../../constants/theme";
import { type MedScanResult, useMedicationScan } from "../../hooks/useMedicationScan";
import type { ScanOutcome } from "../../services/firebase/medication.types";

const SCAN_YELLOW = "#C2CE3A";
const FRAME_WIDTH = 300;
const FRAME_HEIGHT = 460;
const BOX_FILL = "rgba(217, 217, 217, 0.2)";
const half = (hex: string) => `${hex}80`;

const BRACKET = 62;
const THICK = 5;
const RADIUS = 18;
const WINDOW_INSET = 16;

const SCAN_BARCODE_TYPES = ["datamatrix", "qr", "ean13", "ean8", "upc_a", "upc_e", "code128", "code39", "code93", "codabar", "itf14", "pdf417", "aztec"] as const;

const STYLE: Record<ScanOutcome, { accent: string; title: string; row1Icon: keyof typeof MaterialCommunityIcons.glyphMap; row2Icon: keyof typeof MaterialCommunityIcons.glyphMap }> = {
	correct: { accent: SCAN_YELLOW, title: "#3F6B00", row1Icon: "pill", row2Icon: "calendar-check-outline" },
	wrongMed: { accent: "#D9534F", title: "#D9534F", row1Icon: "pill", row2Icon: "alert-circle-outline" },
	wrongTime: { accent: "#E0922B", title: "#B5701A", row1Icon: "pill", row2Icon: "clock-alert-outline" },
	wrongDay: { accent: "#E0922B", title: "#B5701A", row1Icon: "pill", row2Icon: "calendar-alert" },
};

export default function ScanScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { taskId } = useLocalSearchParams<{ taskId?: string }>();
	const [permission, requestPermission] = useCameraPermissions();
	const { result, handleScan, reset, confirm } = useMedicationScan({ targetTaskId: taskId ?? null });
	const [confirmVisible, setConfirmVisible] = useState(false);

	if (!permission) return <View style={styles.permWrap} />;
	if (!permission.granted) {
		return (
			<View style={[styles.permWrap, { paddingTop: insets.top + 40 }]}>
				<MaterialCommunityIcons name="camera-outline" size={48} color={COLORS.primary} />
				<Text style={styles.permTitle}>{t("scan.permTitle")}</Text>
				<Text style={styles.permText}>{t("scan.permText")}</Text>
				<Pressable style={styles.permBtn} onPress={requestPermission}>
					<Text style={styles.permBtnText}>{t("scan.permAllow")}</Text>
				</Pressable>
				<Pressable onPress={() => router.back()} hitSlop={8}>
					<Text style={styles.permBack}>{t("scan.permBack")}</Text>
				</Pressable>
			</View>
		);
	}

	const handleConfirm = async () => {
		await confirm(false);
		router.back();
	};
	const handleOverride = async () => {
		setConfirmVisible(false);
		await confirm(true);
		router.back();
	};

	return (
		<View style={styles.root}>
			<StatusBar style="light" />
			<CameraView style={StyleSheet.absoluteFill} facing="back" autofocus="on" onBarcodeScanned={result ? undefined : ({ data }) => handleScan(data)} barcodeScannerSettings={{ barcodeTypes: [...SCAN_BARCODE_TYPES] }} />
			<View style={styles.scrim} pointerEvents="none" />
			<Pressable onPress={() => router.back()} style={[styles.backBtn, { top: insets.top + 8 }]} hitSlop={8}>
				<Ionicons name="chevron-back" size={24} color="#FFFFFF" />
			</Pressable>
			{!result && (
				<>
					<View style={[styles.topOverlay, { top: insets.top + 56 }]} pointerEvents="none">
						<View style={styles.titleRow}>
							<Text style={styles.titleText}>{t("scan.title")}</Text>
							<View style={styles.highlightWrapper}>
								<Text style={styles.highlightText}>{t("scan.titleHighlight")}</Text>
							</View>
						</View>
						<Text style={styles.subtitle}>{t("scan.subtitle")}</Text>
					</View>

					<View style={styles.frameArea} pointerEvents="none">
						<ScanFrame />
					</View>
				</>
			)}
			{result && (
				<View style={styles.resultArea}>
					<MedScanResultCard result={result} onConfirm={handleConfirm} onRescan={reset} onOverride={() => setConfirmVisible(true)} />
				</View>
			)}
			<CustomAlert
				visible={confirmVisible}
				title={t("scan.modalTitle")}
				message={`${t("scan.modalText")}\n\n${t("scan.modalWarn")}`}
				confirmText={t("scan.overrideBtn")}
				cancelText={t("scan.cancel")}
				onConfirm={handleOverride}
				onCancel={() => setConfirmVisible(false)}
				primaryLeft
				messageStyle={{ color: "#B25A1A" }}
			/>
		</View>
	);
}

function ScanFrame() {
	return (
		<View style={{ width: FRAME_WIDTH, height: FRAME_HEIGHT }}>
			<View style={styles.scanWindow} />
			<View style={[styles.corner, styles.cornerTL, styles.cornerGlow]} />
			<View style={[styles.corner, styles.cornerTR, styles.cornerGlow]} />
			<View style={[styles.corner, styles.cornerBR, styles.cornerGlow]} />
			<View style={[styles.corner, styles.cornerBL, styles.cornerGlow]} />
			<View style={[styles.corner, styles.cornerTL]} />
			<View style={[styles.corner, styles.cornerTR]} />
			<View style={[styles.corner, styles.cornerBR]} />
			<View style={[styles.corner, styles.cornerBL]} />
		</View>
	);
}

function MedScanResultCard({ result, onConfirm, onRescan, onOverride }: { result: MedScanResult; onConfirm: () => void; onRescan: () => void; onOverride: () => void }) {
	const { t } = useTranslation();
	const s = STYLE[result.outcome];
	const isCorrect = result.outcome === "correct";

	const heading = t(`scan.${result.outcome}.heading`);
	const sub = t(`scan.${result.outcome}.sub`);
	const row1Title = `${isCorrect ? "" : t("scan.plannedPrefix")}${result.plannedName}`;
	const row2Title = isCorrect ? `${t("scan.scannedAtPrefix")}${result.scannedAt}` : result.outcome === "wrongMed" ? `${t("scan.scannedPrefix")}${result.scannedName}` : `${t("scan.scannedAtPrefix")}${result.scannedAt}`;

	return (
		<View style={[styles.card, { borderColor: half(s.accent), shadowColor: s.accent }]}>
			<View style={[StyleSheet.absoluteFill, styles.cardGlass]} pointerEvents="none" />
			<View style={[StyleSheet.absoluteFill, { backgroundColor: BOX_FILL }]} pointerEvents="none" />

			<View style={styles.cardContent}>
				<Text style={[styles.cardTitle, { color: s.title }]}>{heading}</Text>
				<Text style={styles.cardSub}>{sub}</Text>

				<InfoBox icon={s.row1Icon} title={row1Title} sub={result.plannedWhen} />
				<InfoBox icon={s.row2Icon} title={row2Title} sub={result.row2Sub} />

				{isCorrect ? (
					<Pressable style={styles.primaryBtn} onPress={onConfirm}>
						<Text style={styles.primaryBtnText}>{t("scan.confirm")}</Text>
					</Pressable>
				) : (
					<View style={styles.btnStack}>
						<Pressable style={styles.primaryBtn} onPress={onRescan}>
							<Text style={styles.primaryBtnText}>{t("scan.rescan")}</Text>
						</Pressable>
						{result.taskId ? (
							<Pressable style={styles.outlineBtn} onPress={onOverride}>
								<Text style={styles.outlineBtnText}>{t("scan.overrideBtn")}</Text>
							</Pressable>
						) : null}
					</View>
				)}
			</View>
		</View>
	);
}

function InfoBox({ icon, title, sub }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; title: string; sub: string }) {
	return (
		<View style={styles.infoBox}>
			<View style={styles.infoBoxLight} pointerEvents="none" />
			<View style={styles.infoIcon}>
				<MaterialCommunityIcons name={icon} size={20} color="#5E7A00" />
			</View>
			<View style={{ flex: 1 }}>
				<Text style={styles.infoTitle}>{title}</Text>
				{!!sub && <Text style={styles.infoSub}>{sub}</Text>}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1, backgroundColor: "#000" },
	scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.22)" },
	backBtn: { position: "absolute", left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", zIndex: 5 },

	topOverlay: { position: "absolute", left: 0, right: 0, alignItems: "center" },
	titleRow: { flexDirection: "row", alignItems: "center" },
	titleText: { fontFamily: FONTS.heading, fontSize: 24, color: "#2F4A00", textShadowColor: "rgba(255,255,255,0.55)", textShadowRadius: 5 },
	highlightWrapper: { backgroundColor: SCAN_YELLOW, paddingHorizontal: 12, paddingVertical: 3, borderRadius: 16 },
	highlightText: { fontFamily: FONTS.heading, fontSize: 24, color: COLORS.primary },
	subtitle: { fontFamily: FONTS.body, fontSize: 13, color: "#FFFFFF", marginTop: 8, textShadowColor: "rgba(0,0,0,0.4)", textShadowRadius: 4 },

	frameArea: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
	resultArea: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },

	scanWindow: { position: "absolute", top: WINDOW_INSET, left: WINDOW_INSET, right: WINDOW_INSET, bottom: WINDOW_INSET, borderRadius: 30, borderWidth: 1.25, borderColor: "rgba(255,255,255,0.45)", backgroundColor: "rgba(255,255,255,0.05)" },
	corner: { position: "absolute", width: BRACKET, height: BRACKET, borderColor: SCAN_YELLOW },
	cornerGlow: { shadowColor: SCAN_YELLOW, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 14, elevation: 16 },
	cornerTL: { top: 0, left: 0, borderTopWidth: THICK, borderLeftWidth: THICK, borderTopLeftRadius: RADIUS },
	cornerTR: { top: 0, right: 0, borderTopWidth: THICK, borderRightWidth: THICK, borderTopRightRadius: RADIUS },
	cornerBR: { bottom: 0, right: 0, borderBottomWidth: THICK, borderRightWidth: THICK, borderBottomRightRadius: RADIUS },
	cornerBL: { bottom: 0, left: 0, borderBottomWidth: THICK, borderLeftWidth: THICK, borderBottomLeftRadius: RADIUS },

	card: { width: "100%", maxWidth: 420, borderRadius: 28, borderWidth: 1.5, overflow: "hidden", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 18, elevation: 10 },
	cardGlass: { backgroundColor: "rgba(20,24,10,0.55)" },
	cardContent: { padding: 20, gap: 11 },
	cardTitle: { fontFamily: "BricolageBold", fontSize: 19, textAlign: "center" },
	cardSub: { fontFamily: FONTS.body, fontSize: 13.5, color: "rgba(255,255,255,0.92)", textAlign: "center", lineHeight: 19, marginBottom: 4 },

	infoBox: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "rgba(233,233,228,0.92)", borderRadius: 16, padding: 12, overflow: "hidden" },
	infoBoxLight: { position: "absolute", top: 0, left: 0, right: 0, height: 1, backgroundColor: "rgba(255,255,255,0.7)" },
	infoIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(197,214,54,0.30)", alignItems: "center", justifyContent: "center" },
	infoTitle: { fontFamily: "InterSemiBold", fontSize: 14.5, color: COLORS.primary },
	infoSub: { fontFamily: FONTS.body, fontSize: 12, color: "rgba(35,54,0,0.6)", marginTop: 1 },

	btnStack: { gap: 10, marginTop: 6 },
	primaryBtn: {
		backgroundColor: COLORS.buttonFill,
		borderRadius: 16,
		paddingVertical: 15,
		alignItems: "center",
		marginTop: 6,
		shadowColor: COLORS.buttonShadow,
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.7,
		shadowRadius: 12,
		elevation: 6,
	},
	primaryBtnText: { fontFamily: FONTS.button, fontSize: 16, color: COLORS.buttonText },
	outlineBtn: { backgroundColor: "#FFFFFF", borderRadius: 16, paddingVertical: 15, alignItems: "center" },
	outlineBtnText: { fontFamily: FONTS.button, fontSize: 16, color: COLORS.primary },

	permWrap: { flex: 1, backgroundColor: COLORS.background, alignItems: "center", justifyContent: "center", paddingHorizontal: 36, gap: 12 },
	permTitle: { fontFamily: FONTS.heading, fontSize: 20, color: COLORS.primary, marginTop: 8 },
	permText: { fontFamily: FONTS.body, fontSize: 14, color: "rgba(35,54,0,0.6)", textAlign: "center", lineHeight: 21 },
	permBtn: { backgroundColor: COLORS.buttonFill, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14, marginTop: 8 },
	permBtnText: { fontFamily: FONTS.button, fontSize: 15, color: COLORS.buttonText },
	permBack: { fontFamily: "InterMedium", fontSize: 14, color: "rgba(35,54,0,0.6)", marginTop: 12 },
});
