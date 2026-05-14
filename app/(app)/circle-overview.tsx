import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Button from "../../components/ui/Button";
import CircleMember from "../../components/ui/CircleMember";
import CustomAlert from "../../components/ui/CustomAlert";
import InviteModal from "../../components/ui/InviteModal";
import { COLORS, FONTS, TYPOGRAPHY } from "../../constants/theme";
import { useCircleInvite } from "../../hooks/useCircleInvite";

import { getCircleMembers, getCurrentUserCircleData, removeCircleMember } from "../../lib/firebase-service";

export default function CircleOverviewScreen() {
	const router = useRouter();
	const { t } = useTranslation();
	const tCircle = (key: string) => t(`circleOverview.${key}`);

	const [members, setMembers] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [circleData, setCircleData] = useState<{ careCircleId: string; role: string; currentUserId: string } | null>(null);

	const [isRemoveModalVisible, setRemoveModalVisible] = useState(false);
	const [selectedMemberToRemove, setSelectedMemberToRemove] = useState<string | null>(null);
	const [isRemoving, setIsRemoving] = useState(false);

	const isTemplateMode = members.length <= 1;
	const isAdmin = circleData?.role === "admin";

	// Let op: shareSMS uit de hook gehaald (in plaats van shareWhatsApp)
	const { isVisible: isInviteModalVisible, setIsVisible: setInviteModalVisible, inviteCode, formattedTime, shareSMS, shareEmail } = useCircleInvite(circleData?.careCircleId);

	const SLOT_STYLES = [
		{ left: 0, top: 0, zIndex: 1, size: 130, isCenter: false },
		{ right: 0, top: 40, zIndex: 1, size: 130, isCenter: false },
		{ left: "50%", transform: [{ translateX: -95 }], top: 165, zIndex: 10, size: 190, isCenter: true },
		{ left: 10, top: 380, zIndex: 1, size: 130, isCenter: false },
		{ right: 10, top: 360, zIndex: 1, size: 130, isCenter: false },
	];

	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		try {
			setIsLoading(true);
			const data = await getCurrentUserCircleData();
			if (data && data.careCircleId) {
				setCircleData(data);
				const fetchedMembers = await getCircleMembers(data.careCircleId);
				setMembers(fetchedMembers);
			}
		} catch (error) {
			console.error("Fout bij laden leden:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleOpenRemoveModal = (memberId: string) => {
		setSelectedMemberToRemove(memberId);
		setRemoveModalVisible(true);
	};

	const handleConfirmRemove = async () => {
		if (!circleData?.careCircleId || !selectedMemberToRemove) return;

		try {
			setIsRemoving(true);
			await removeCircleMember(circleData.careCircleId, selectedMemberToRemove);

			setMembers((prev) => prev.filter((m) => m.id !== selectedMemberToRemove));
			setRemoveModalVisible(false);
		} catch (error) {
			console.error("Kon lid niet verwijderen:", error);
		} finally {
			setIsRemoving(false);
		}
	};

	const blocksOfFive = Math.max(1, Math.ceil(members.length / 5));
	const dynamicGridHeight = blocksOfFive * 520;

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.backButtonContainer}>
				<Pressable onPress={() => router.back()} style={styles.backButton}>
					<Ionicons name="chevron-back" size={28} color={COLORS.primary} />
				</Pressable>
			</View>

			<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
				<View style={styles.header}>
					<Text style={styles.titleText}>{tCircle("titlePart1").trim()}</Text>
					<View style={styles.highlightWrapper}>
						<Text style={styles.highlightText}>{tCircle("titlePart2")}</Text>
					</View>
				</View>

				<Text style={styles.subtitle}>{tCircle("subtitle")}</Text>

				{isTemplateMode && !isLoading && (
					<View style={styles.templateBanner}>
						<MaterialCommunityIcons name="information-outline" size={20} color="#354E00" style={{ marginRight: 10 }} />
						<Text style={styles.templateText}>{tCircle("templateMessage")}</Text>
					</View>
				)}

				{isLoading ? (
					<ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
				) : (
					<View style={[styles.gridContainer, { height: dynamicGridHeight }]}>
						{members.map((member, index) => {
							const baseStyle = SLOT_STYLES[index % 5];
							const verticalOffset = Math.floor(index / 5) * 520;

							const positionStyle: any = {
								position: "absolute",
								top: baseStyle.top + verticalOffset,
								zIndex: baseStyle.zIndex,
							};
							if (baseStyle.left !== undefined) positionStyle.left = baseStyle.left;
							if (baseStyle.right !== undefined) positionStyle.right = baseStyle.right;
							if (baseStyle.transform) positionStyle.transform = baseStyle.transform;

							const canShowOptions = isAdmin && member.id !== circleData?.currentUserId;

							return (
								<View key={member.id} style={positionStyle}>
									<CircleMember size={baseStyle.size} name={member.name} role={member.role} photoUrl={member.photoUrl} onPressOptions={canShowOptions ? () => handleOpenRemoveModal(member.id) : undefined} />
								</View>
							);
						})}
					</View>
				)}

				<View style={{ height: 180 }} />
			</ScrollView>

			<View style={styles.bottomContainer}>
				<Button title={tCircle("inviteBtn")} onPress={() => setInviteModalVisible(true)} variant="primary" />
				<View style={styles.infoRow}>
					<MaterialCommunityIcons name="information-outline" size={20} color={COLORS.primary} />
					<Text style={styles.infoText}>{tCircle("inviteInfo")}</Text>
				</View>
			</View>

			<CustomAlert
				visible={isRemoveModalVisible}
				title={tCircle("removeTitle")}
				message={tCircle("removeMessage")}
				confirmText={isRemoving ? t("common.loading") : tCircle("removeConfirm")}
				cancelText={tCircle("removeCancel")}
				onConfirm={handleConfirmRemove}
				onCancel={() => setRemoveModalVisible(false)}
				messageStyle={{ color: "#C94B47" }}
				isConfirming={isRemoving}
				primaryLeft={true}
			/>

			<InviteModal visible={isInviteModalVisible} onClose={() => setInviteModalVisible(false)} inviteCode={inviteCode} formattedTime={formattedTime} onShareSMS={shareSMS} onShareEmail={shareEmail} />
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
	backButtonContainer: { width: "100%", paddingHorizontal: 16, paddingTop: 10, zIndex: 10 },
	backButton: { padding: 8, marginLeft: -8, alignSelf: "flex-start" },
	scrollContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 40 },
	header: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 15, gap: 6 },
	titleText: { ...TYPOGRAPHY.h1, color: COLORS.primary, zIndex: 10 },
	highlightWrapper: { backgroundColor: COLORS.accent, paddingHorizontal: 12, paddingVertical: 2, borderRadius: 20 },
	highlightText: { ...TYPOGRAPHY.h1, color: COLORS.primary },
	subtitle: { fontFamily: "InterMedium", fontSize: 14, color: COLORS.primary, textAlign: "center", marginBottom: 30, lineHeight: 20 },

	templateBanner: { flexDirection: "row", backgroundColor: "rgba(233, 248, 0, 0.15)", padding: 12, borderRadius: 12, marginBottom: 20, alignItems: "center", borderWidth: 1, borderColor: "rgba(154, 217, 0, 0.2)", width: "100%" },
	templateText: { flex: 1, fontFamily: FONTS.body, fontSize: 13, color: "#354E00", lineHeight: 18 },

	gridContainer: { position: "relative", width: "100%", marginTop: 10 },

	bottomContainer: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 30, backgroundColor: "rgba(255, 255, 255, 0.95)" },
	infoRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 12 },
	infoText: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.primary, marginLeft: 6 },
});
