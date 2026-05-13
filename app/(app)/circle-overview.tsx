import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Button from "../../components/ui/Button";
import CircleMember from "../../components/ui/CircleMember";
import { COLORS, FONTS, TYPOGRAPHY } from "../../constants/theme";

export default function CircleOverviewScreen() {
	const router = useRouter();
	const { t } = useTranslation();
	const tCircle = (key: string) => t(`circleOverview.${key}`);

	const [isTemplateMode, setIsTemplateMode] = useState(true);

	const dummyMembers = [
		{ id: "1", name: "Thomas B.", role: "Broer", photo: require("../../assets/images/thomas.jpg") },
		{ id: "2", name: "Arnaud", role: "Buurman", photo: require("../../assets/images/arnaud.jpg") },
		{ id: "3", name: "Beatrice B.", role: "Zus", photo: require("../../assets/images/beatrice.jpg") },
		{ id: "4", name: "Vanessa B.", role: "Zus", photo: require("../../assets/images/vanessa.jpg") },
		{ id: "5", name: "Amin H.", role: "Nonkel", photo: require("../../assets/images/amin.jpg") },
	];

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

				{isTemplateMode && (
					<View style={styles.templateBanner}>
						<MaterialCommunityIcons name="information-outline" size={20} color="#354E00" style={{ marginRight: 10 }} />
						<Text style={styles.templateText}>{tCircle("templateMessage")}</Text>
					</View>
				)}

				<View style={styles.gridContainer}>
					<View style={[styles.memberWrapper, { left: 0, top: 0, zIndex: 1 }]}>
						<CircleMember size={130} name={dummyMembers[0].name} role={dummyMembers[0].role} photoUrl={dummyMembers[0].photo} onPressOptions={() => console.log("Opties 1")} />
					</View>

					<View style={[styles.memberWrapper, { right: 0, top: 40, zIndex: 1 }]}>
						<CircleMember size={130} name={dummyMembers[1].name} role={dummyMembers[1].role} photoUrl={dummyMembers[1].photo} onPressOptions={() => console.log("Opties 2")} />
					</View>

					<View style={[styles.memberWrapper, { left: "50%", transform: [{ translateX: -95 }], top: 165, zIndex: 10 }]}>
						<CircleMember size={190} name={dummyMembers[2].name} role={dummyMembers[2].role} photoUrl={dummyMembers[2].photo} onPressOptions={() => console.log("Opties 3")} />
					</View>

					<View style={[styles.memberWrapper, { left: 10, top: 380, zIndex: 1 }]}>
						<CircleMember size={130} name={dummyMembers[3].name} role={dummyMembers[3].role} photoUrl={dummyMembers[3].photo} onPressOptions={() => console.log("Opties 4")} />
					</View>

					<View style={[styles.memberWrapper, { right: 10, top: 360, zIndex: 1 }]}>
						<CircleMember size={130} name={dummyMembers[4].name} role={dummyMembers[4].role} photoUrl={dummyMembers[4].photo} onPressOptions={() => console.log("Opties 5")} />
					</View>
				</View>

				<View style={{ height: 180 }} />
			</ScrollView>

			<View style={styles.bottomContainer}>
				<Button title={tCircle("inviteBtn")} onPress={() => console.log("Uitnodigen")} variant="primary" />
				<View style={styles.infoRow}>
					<MaterialCommunityIcons name="information-outline" size={20} color={COLORS.primary} />
					<Text style={styles.infoText}>{tCircle("inviteInfo")}</Text>
				</View>
			</View>
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
	gridContainer: { position: "relative", height: 520, width: "100%", marginTop: 10 },
	memberWrapper: { position: "absolute" },
	bottomContainer: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 30, backgroundColor: "rgba(255, 255, 255, 0.95)" },
	infoRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 12 },
	infoText: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.primary, marginLeft: 6 },
});
