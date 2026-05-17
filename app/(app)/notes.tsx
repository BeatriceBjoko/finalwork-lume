import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { NoteCard } from "../../components/ui/NoteCard";
import { COLORS, FONTS } from "../../constants/theme";

const DUMMY_NOTES_FEED = [
	{
		type: "header",
		titleKey: "today",
		id: "h_today",
	},
	{
		type: "note",
		id: "note_1",
		title: "Doktersbezoek UZ Gent",
		time: "10:30",
		content: "Dokter zegt dat de bloeddruk perfect is. Volgende week mogen we overschakelen op een lagere dosis medicatie.",
		tag: "Medisch",
		icon: "hospital-building" as const,
		isImportant: true,
		author: { name: "Beatrice", initials: "BB", photo: "https://i.pravatar.cc/100?img=5" },
		images: ["foto1.jpg"],
	},
	{
		type: "header",
		titleKey: "yesterday",
		id: "h_yesterday",
	},
	{
		type: "note",
		id: "note_2",
		title: "Lekkere wandeling",
		time: "15:00",
		content: "Even naar het park geweest. Het zonnetje deed enorm veel deugd! Rollator liep heel soepel op de paden.",
		tag: "Dagelijks",
		icon: "weather-sunny" as const,
		isImportant: false,
		author: { name: "Thomas", initials: "TH" },
		images: [],
	},
	{
		type: "note",
		id: "note_3",
		title: "Apotheek",
		time: "18:15",
		content: "De nieuwe pleisters waren niet binnen. Ik moet ze woensdag nog even gaan ophalen.",
		tag: "Belangrijk",
		icon: "alert-circle-outline" as const,
		isImportant: false,
		author: { name: "Sofie", initials: "SO", photo: "https://i.pravatar.cc/100?img=9" },
		images: [],
	},
];

export default function NotesScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState("");
	const [activeFilter, setActiveFilter] = useState("Alles");

	const handleToggleImportant = (id: string) => {
		console.log("Toggle heart for note:", id);
	};

	const handleCreateNewNote = () => {
		console.log("Open nieuwe notitie modal/scherm");
	};

	const handleOpenDatePicker = () => {
		setActiveFilter("Datum");
		console.log("Open kalender picker");
	};

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.header}>
				<Pressable onPress={() => router.back()} style={styles.backBtn}>
					<Ionicons name="chevron-back" size={28} color={COLORS.primary} />
				</Pressable>
				<View style={styles.titleWrap}>
					<Text style={styles.titleText}>{t("dailySummary.my")}</Text>
					<View style={styles.highlightWrapper}>
						<Text style={styles.highlightText}>{t("dailySummary.notes")}</Text>
					</View>
				</View>
				<View style={{ width: 40 }} />
			</View>

			<View style={styles.searchSection}>
				<View style={styles.searchBox}>
					<Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
					<TextInput style={styles.searchInput} placeholder={t("tasks.taskTitlePlaceholder")} placeholderTextColor="#9ca3af" value={searchQuery} onChangeText={setSearchQuery} />
				</View>

				<View style={styles.filterRow}>
					<Pressable onPress={() => setActiveFilter("Alles")} style={[styles.filterChip, activeFilter === "Alles" && styles.filterChipActive]}>
						<Text style={[styles.filterChipText, activeFilter === "Alles" && styles.filterChipTextActive]}>{t("createCircle.relations.andere") === "Autre" ? "Tout" : "Alles"}</Text>
					</Pressable>

					<Pressable onPress={() => setActiveFilter("Belangrijk")} style={[styles.filterChip, activeFilter === "Belangrijk" && styles.filterChipActive]}>
						<Text style={[styles.filterChipText, activeFilter === "Belangrijk" && styles.filterChipTextActive]}>♥ {t("dailySummary.importantTag")}</Text>
					</Pressable>

					<Pressable onPress={handleOpenDatePicker} style={[styles.filterChip, activeFilter === "Datum" && styles.filterChipActive, styles.dateChip]}>
						<Ionicons name="calendar-outline" size={14} color={activeFilter === "Datum" ? COLORS.primary : "rgba(35, 54, 0, 0.6)"} style={{ marginRight: 4 }} />
						<Text style={[styles.filterChipText, activeFilter === "Datum" && styles.filterChipTextActive]}>{t("createCircle.relations.andere") === "Autre" ? "Choisir date" : "Kies datum"}</Text>
					</Pressable>
				</View>
			</View>

			<FlatList
				data={DUMMY_NOTES_FEED}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.listContent}
				showsVerticalScrollIndicator={false}
				renderItem={({ item }) => {
					if (item.type === "header") {
						const isFr = t("createCircle.relations.andere") === "Autre";
						let headerTitle = "";
						if (item.titleKey === "today") headerTitle = isFr ? "Aujourd'hui" : "Vandaag";
						if (item.titleKey === "yesterday") headerTitle = isFr ? "Hier" : "Gisteren";

						return (
							<View style={styles.dateHeaderWrap}>
								<Text style={styles.dateHeaderImport}>{headerTitle}</Text>
								<View style={styles.dateHeaderLine} />
							</View>
						);
					}

					return <NoteCard note={item as any} onToggleImportant={() => handleToggleImportant(item.id)} />;
				}}
				ListFooterComponent={<View style={{ height: 100 }} />}
			/>

			<Pressable style={styles.fab} onPress={handleCreateNewNote}>
				<MaterialCommunityIcons name="pencil-plus-outline" size={28} color={COLORS.primary} />
			</Pressable>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: COLORS.background },

	header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16 },
	backBtn: { padding: 8, marginLeft: -8 },
	titleWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
	titleText: { fontFamily: FONTS.heading, fontSize: 24, color: COLORS.primary },
	highlightWrapper: { backgroundColor: COLORS.accent, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 16 },
	highlightText: { fontFamily: FONTS.heading, fontSize: 24, color: COLORS.primary },

	searchSection: { paddingHorizontal: 24, paddingBottom: 10 },
	searchBox: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#FFF",
		borderRadius: 16,
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderWidth: 1,
		borderColor: "rgba(35, 54, 0, 0.1)",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.04,
		shadowRadius: 4,
		elevation: 2,
	},
	searchIcon: { marginRight: 10 },
	searchInput: { flex: 1, fontFamily: "InterRegular", fontSize: 15, color: COLORS.primary },

	filterRow: { flexDirection: "row", gap: 8, marginTop: 14 },
	filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "rgba(35, 54, 0, 0.05)", borderWidth: 1, borderColor: "transparent" },
	filterChipActive: { backgroundColor: "rgba(239, 252, 0, 0.2)", borderColor: COLORS.accent },
	filterChipText: { fontFamily: "InterMedium", fontSize: 13, color: "rgba(35, 54, 0, 0.6)" },
	filterChipTextActive: { color: COLORS.primary, fontFamily: "InterSemiBold" },
	dateChip: { flexDirection: "row", alignItems: "center" },

	listContent: { paddingHorizontal: 24, paddingTop: 10 },

	dateHeaderWrap: { flexDirection: "row", alignItems: "center", marginTop: 24, marginBottom: 8, gap: 12 },
	dateHeaderImport: { fontFamily: "BricolageMedium", fontSize: 16, color: COLORS.primary, opacity: 0.8 },
	dateHeaderLine: { flex: 1, height: 1, backgroundColor: "rgba(35, 54, 0, 0.1)" },

	fab: {
		position: "absolute",
		bottom: 30,
		right: 24,
		width: 64,
		height: 64,
		borderRadius: 32,
		backgroundColor: COLORS.accent,
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#233600",
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.25,
		shadowRadius: 10,
		elevation: 8,
		borderWidth: 2,
		borderColor: "rgba(255, 255, 255, 0.5)",
	},
});
