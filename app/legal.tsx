import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, FONTS } from "../constants/theme";

import { useLegal } from "../hooks/useLegal";

export default function Legal() {
	const { activeTab, setActiveTab, contentData, t } = useLegal();

	const renderContentBlock = (item: any, index: number) => {
		if (item.type === "subtitle") {
			return (
				<Text key={index} style={styles.subtitle}>
					{item.text}
				</Text>
			);
		}
		if (item.type === "highlight") {
			return (
				<Text key={index} style={[styles.body, styles.highlight]}>
					{item.text}
				</Text>
			);
		}
		return (
			<Text key={index} style={styles.body}>
				{item.text}
			</Text>
		);
	};

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.header}>
				<Pressable onPress={() => router.back()} style={styles.backButton}>
					<Feather name="arrow-left" size={24} color={COLORS.primary} />
				</Pressable>
				<Text style={styles.headerTitle}>{t("legal.title")}</Text>
				<View style={{ width: 40 }} />
			</View>

			<View style={styles.tabContainer}>
				<Pressable style={[styles.tab, activeTab === "privacy" && styles.activeTab]} onPress={() => setActiveTab("privacy")}>
					<Text style={[styles.tabText, activeTab === "privacy" && styles.activeTabText]}>{t("legal.tabPrivacy")}</Text>
				</Pressable>
				<Pressable style={[styles.tab, activeTab === "terms" && styles.activeTab]} onPress={() => setActiveTab("terms")}>
					<Text style={[styles.tabText, activeTab === "terms" && styles.activeTabText]}>{t("legal.tabTerms")}</Text>
				</Pressable>
			</View>

			<ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
				<View style={styles.textContent}>{Array.isArray(contentData) && contentData.map((item, index) => renderContentBlock(item, index))}</View>
				<View style={{ height: 40 }} />
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: COLORS.background },
	header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16 },
	backButton: { padding: 8, marginLeft: -8 },
	headerTitle: { fontFamily: FONTS.heading, fontSize: 20, color: COLORS.primary },
	tabContainer: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "rgba(35, 54, 0, 0.1)" },
	tab: { flex: 1, paddingVertical: 16, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
	activeTab: { borderBottomColor: COLORS.primary },
	tabText: { fontFamily: FONTS.body, fontSize: 15, color: "rgba(35, 54, 0, 0.5)" },
	activeTabText: { fontFamily: FONTS.button, color: COLORS.primary },
	contentContainer: { flex: 1, paddingHorizontal: 24 },
	textContent: { marginTop: 24 },
	subtitle: { fontFamily: FONTS.button, fontSize: 16, color: COLORS.primary, marginTop: 24, marginBottom: 8 },
	body: { fontFamily: FONTS.body, fontSize: 15, color: COLORS.primary, lineHeight: 24, marginBottom: 16 },
	highlight: { fontFamily: FONTS.button },
});
