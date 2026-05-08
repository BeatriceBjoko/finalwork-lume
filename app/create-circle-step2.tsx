import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Button from "../components/ui/Button";
import ShadowCard from "../components/ui/ShadowCard";
import StepIndicator from "../components/ui/StepIndicator";
import { COLORS, FONTS, TYPOGRAPHY } from "../constants/theme";

interface Invitee {
	id: string;
	contact: string;
	name: string;
	color: string;
}

const AVATAR_COLORS = ["#FCF6CC", "#F0F4DC", "#DAFFDE"];

export default function CreateCircleStep2() {
	const { t } = useTranslation();
	const params = useLocalSearchParams();

	const [inviteInput, setInviteInput] = useState("");
	const [inviteList, setInviteList] = useState<Invitee[]>([]);

	const handleAddPerson = () => {
		const inputStr = inviteInput.trim();
		if (!inputStr) return;

		let extractedName = inputStr.includes("@") ? inputStr.split("@")[0] : inputStr;
		extractedName = extractedName.charAt(0).toUpperCase() + extractedName.slice(1);

		const newInvitee: Invitee = {
			id: Math.random().toString(),
			contact: inputStr,
			name: extractedName,
			color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
		};

		setInviteList([...inviteList, newInvitee]);
		setInviteInput("");
		Keyboard.dismiss();
	};

	const handleCreateCircle = () => {
		console.log("Data van stap 1:", params);
		console.log("Uitgenodigde mensen:", inviteList);
		Alert.alert("Succes", "Zorgkring wordt aangemaakt!");
		router.push("/");
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
				<View style={styles.topBar}>
					<Pressable onPress={() => router.back()} style={styles.backBtn}>
						<MaterialCommunityIcons name="arrow-left" size={28} color={COLORS.primary} />
					</Pressable>
				</View>

				<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
					<View style={styles.header}>
						<Text style={styles.titleText}>{t("createCircle.step1.titlePart1")}</Text>
						<View style={styles.highlightWrapper}>
							<Text style={styles.highlightText}>{t("createCircle.step1.titlePart2")}</Text>
						</View>
					</View>

					<StepIndicator currentStep={2} totalSteps={2} />

					<Text style={styles.subtitle}>{t("createCircle.step1.subtitle")}</Text>

					<ShadowCard style={{ marginBottom: 20 }}>
						<View style={styles.cardHeader}>
							<View style={styles.iconWrapper}>
								<MaterialCommunityIcons name="account-group-outline" size={28} color={COLORS.primary} />
							</View>
							<Text style={styles.cardTitle}>{t("createCircle.step2.inviteLabel")}</Text>
						</View>

						<View style={styles.inputWrapper}>
							<TextInput style={styles.inviteInput} placeholder={t("createCircle.step2.invitePlaceholder")} placeholderTextColor="rgba(35, 54, 0, 0.4)" value={inviteInput} onChangeText={setInviteInput} autoCorrect={false} autoCapitalize="none" />

							<Pressable style={styles.glassAddBtn} onPress={handleAddPerson}>
								<BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
								<View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(224, 224, 224, 0.5)" }]} />
								<Text style={styles.glassAddBtnText}>{t("createCircle.step2.addBtn")}</Text>
							</Pressable>
						</View>

						{inviteList.map((person) => (
							<View key={person.id} style={styles.personRow}>
								<View style={[styles.avatar, { backgroundColor: person.color }]}>
									<Text style={styles.avatarText}>{person.name.charAt(0).toUpperCase()}</Text>
								</View>

								<View style={styles.personInfo}>
									<Text style={styles.personName} numberOfLines={1}>
										{person.name}
									</Text>
									<Text style={styles.personContact} numberOfLines={1}>
										{person.contact}
									</Text>
								</View>

								<View style={styles.statusPill}>
									<View style={styles.statusCircle} />
									<Text style={styles.statusText}>{t("createCircle.step2.invitedStatus")}</Text>
								</View>
							</View>
						))}

						<View style={styles.dashedBox}>
							<View style={styles.linkHeaderRow}>
								<View style={styles.linkIconWrapper}>
									<MaterialCommunityIcons name="export-variant" size={20} color={COLORS.primary} />
								</View>
								<Text style={styles.linkTitle}>{t("createCircle.step2.linkSectionTitle")}</Text>
							</View>

							<Text style={styles.linkSubtitle}>{t("createCircle.step2.linkSectionSubtitle")}</Text>

							<View style={styles.copyBtnWrapper}>
								<Button title={t("createCircle.step2.copyLinkBtn")} variant="secondary" onPress={() => {}} />
							</View>
						</View>
					</ShadowCard>

					<View style={styles.footer}>
						<Button title={t("createCircle.step2.finishBtn")} onPress={handleCreateCircle} variant="primary" />
						<View style={styles.infoRow}>
							<MaterialCommunityIcons name="information-outline" size={20} color={COLORS.primary} />
							<Text style={styles.infoText}>{t("createCircle.step1.infoText")}</Text>
						</View>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
	topBar: { paddingHorizontal: 16, paddingTop: 10 },
	backBtn: { padding: 8, alignSelf: "flex-start" },
	scrollContent: { paddingHorizontal: 16, paddingBottom: 40, alignItems: "center" },
	header: { alignItems: "center", marginBottom: 20 },
	titleText: { ...TYPOGRAPHY.h1, color: COLORS.primary, zIndex: 10 },
	highlightWrapper: { backgroundColor: COLORS.accent, paddingHorizontal: 16, paddingVertical: 2, borderRadius: 20, marginTop: -5 },
	highlightText: { ...TYPOGRAPHY.h1, color: COLORS.primary },
	subtitle: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.primary, textAlign: "center", marginBottom: 30, lineHeight: 20 },

	cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
	iconWrapper: { width: 54, height: 54, borderRadius: 27, backgroundColor: "rgba(176, 248, 0, 0.2)", justifyContent: "center", alignItems: "center", marginRight: 10 },
	cardTitle: { fontFamily: "BricolageMedium", fontSize: 18, color: "#000000" },

	inputWrapper: {
		flexDirection: "row",
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#233600",
		borderRadius: 12,
		backgroundColor: "#FFF",
		paddingHorizontal: 6,
		height: 56,
		marginBottom: 24,
	},
	inviteInput: {
		flex: 1,
		height: "100%",
		fontFamily: FONTS.body,
		paddingHorizontal: 10,
		color: COLORS.primary,
		fontSize: 14,
	},
	glassAddBtn: {
		width: 100,
		height: 42,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: "rgba(35, 54, 0, 0.8)",
		overflow: "hidden",
		justifyContent: "center",
		alignItems: "center",
	},
	glassAddBtnText: { fontFamily: FONTS.button, fontSize: 14, color: "#233600" },

	personRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
	avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center", marginRight: 12 },
	avatarText: { fontFamily: FONTS.button, fontSize: 18, color: COLORS.primary },

	personInfo: { flex: 1, flexShrink: 1, marginRight: 12 },
	personName: { fontFamily: "InterRegular", fontSize: 16, color: COLORS.primary },
	personContact: { fontFamily: FONTS.body, fontSize: 12, color: "rgba(35, 54, 0, 0.6)" },

	statusPill: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "rgba(250, 254, 166, 0.5)",
		paddingHorizontal: 8,
		paddingVertical: 6,
		borderRadius: 5,
		gap: 6,
	},
	statusCircle: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFE32E" },
	statusText: { fontFamily: "InterRegular", fontSize: 12, color: "#464A00" },

	dashedBox: {
		borderWidth: 1.5,
		borderColor: "rgba(35, 54, 0, 0.4)",
		borderStyle: "dashed",
		borderRadius: 16,
		padding: 20,
		alignItems: "center",
		marginTop: 10,
		backgroundColor: "rgba(76, 175, 80, 0.05)",
	},
	linkHeaderRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 8,
	},
	linkIconWrapper: {
		width: 54,
		height: 54,
		borderRadius: 27,
		backgroundColor: "rgba(176, 248, 0, 0.2)",
		justifyContent: "center",
		alignItems: "center",
		marginRight: 10,
	},
	linkTitle: { fontFamily: "InterBold", fontSize: 14, color: "#354E00" },
	linkSubtitle: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.primary, textAlign: "center", marginBottom: 16 },
	copyBtnWrapper: { width: "100%" },

	footer: { width: "100%", marginTop: 20 },
	infoRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 12 },
	infoText: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.primary, marginLeft: 6 },
});
