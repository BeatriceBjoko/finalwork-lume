import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AddNoteModal } from "../../components/ui/AddNoteModal";
import { NoteCard } from "../../components/ui/NoteCard";
import { COLORS, FONTS } from "../../constants/theme";
import { useSession } from "../../context";
import { useNotesFeed } from "../../hooks/useNotesFeed";

export default function NotesScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const { user, userData } = useSession();

	const [searchQuery, setSearchQuery] = useState("");
	const [isAddModalVisible, setAddModalVisible] = useState(false);
	const [isDatePickerVisible, setDatePickerVisible] = useState(false);
	const [noteToEdit, setNoteToEdit] = useState<any>(null);

	const { feedData, isLoading, isRefreshing, activeFilter, setActiveFilter, selectedDate, setSelectedDate, isTemplateMode, loadMore, refresh, handleToggleImportant, handleDeleteNote } = useNotesFeed();

	const handleEditNote = useCallback((note: any) => {
		setNoteToEdit(note);
		setAddModalVisible(true);
	}, []);

	const onDateChange = (event: any, date?: Date) => {
		if (Platform.OS === "android") {
			setDatePickerVisible(false);
		}
		if (event.type === "set" && date) {
			const dateStr = date.toISOString().split("T")[0];
			setSelectedDate(dateStr);
			setActiveFilter("Datum");
			if (Platform.OS === "ios") setDatePickerVisible(false);
		} else if (event.type === "dismissed") {
			setDatePickerVisible(false);
		}
	};

	const displayData = useMemo(() => {
		return feedData.filter((item) => {
			if (item.type === "header") return true;
			if (!searchQuery) return true;
			const searchLower = searchQuery.toLowerCase();
			return item.title?.toLowerCase().includes(searchLower) || item.content?.toLowerCase().includes(searchLower);
		});
	}, [feedData, searchQuery]);

	const isEmpty = displayData.filter((d) => d.type !== "header").length === 0;

	const renderFeedItem = useCallback(
		({ item }: { item: any }) => {
			if (item.type === "header") {
				if (searchQuery) return null;

				const isFr = t("createCircle.relations.andere") === "Autre";
				let headerTitle = item.titleKey;
				if (item.titleKey === "today") headerTitle = isFr ? "Aujourd'hui" : "Vandaag";
				if (item.titleKey === "yesterday") headerTitle = isFr ? "Hier" : "Gisteren";

				return (
					<View style={styles.dateHeaderWrap}>
						<Text style={styles.dateHeaderImport}>{headerTitle}</Text>
						<View style={styles.dateHeaderLine} />
					</View>
				);
			}

			const isOwner = item.createdBy === user?.uid;
			const isAdmin = userData?.role === "admin";
			const canEdit = isTemplateMode ? true : isOwner || isAdmin;

			return (
				<NoteCard note={item} onToggleImportant={() => handleToggleImportant(item.id, item.isImportant)} onEdit={canEdit ? () => handleEditNote(item) : undefined} onDelete={canEdit ? () => handleDeleteNote(item.id, item.createdBy) : undefined} />
			);
		},
		[searchQuery, t, user?.uid, userData?.role, isTemplateMode, handleToggleImportant, handleEditNote, handleDeleteNote],
	);

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
					<TextInput style={styles.searchInput} placeholder={t("tasks.taskTitlePlaceholder") || "Zoeken..."} placeholderTextColor="#9ca3af" value={searchQuery} onChangeText={setSearchQuery} />
				</View>

				<View style={styles.filterRow}>
					<Pressable
						onPress={() => {
							setActiveFilter("Alles");
							setSelectedDate(null);
						}}
						style={[styles.filterChip, activeFilter === "Alles" && styles.filterChipActive]}
					>
						<Text style={[styles.filterChipText, activeFilter === "Alles" && styles.filterChipTextActive]}>{t("createCircle.relations.andere") === "Autre" ? "Tout" : "Alles"}</Text>
					</Pressable>

					<Pressable
						onPress={() => {
							setActiveFilter("Belangrijk");
							setSelectedDate(null);
						}}
						style={[styles.filterChip, activeFilter === "Belangrijk" && styles.filterChipActive]}
					>
						<Text style={[styles.filterChipText, activeFilter === "Belangrijk" && styles.filterChipTextActive]}>♥ {t("dailySummary.importantTag")}</Text>
					</Pressable>

					<Pressable onPress={() => setDatePickerVisible(true)} style={[styles.filterChip, activeFilter === "Datum" && styles.filterChipActive, styles.dateChip]}>
						<Ionicons name="calendar-outline" size={14} color={activeFilter === "Datum" ? COLORS.primary : "rgba(35, 54, 0, 0.6)"} style={{ marginRight: 4 }} />
						<Text style={[styles.filterChipText, activeFilter === "Datum" && styles.filterChipTextActive]}>{selectedDate && activeFilter === "Datum" ? selectedDate : t("createCircle.relations.andere") === "Autre" ? "Date" : "Datum"}</Text>
					</Pressable>
				</View>
			</View>

			{isTemplateMode && (
				<View style={styles.templateBanner}>
					<MaterialCommunityIcons name="information-outline" size={20} color="#354E00" style={{ marginRight: 10 }} />
					<Text style={styles.templateText}>Dit is een voorbeeld van het logboek. Verwijder deze gerust en schrijf je eigen notitie!</Text>
				</View>
			)}

			{isEmpty && !isLoading && (
				<View style={styles.emptyState}>
					<MaterialCommunityIcons name="text-box-search-outline" size={56} color="rgba(35,54,0,0.15)" />
					<Text style={styles.emptyStateText}>{searchQuery ? `Geen notities gevonden voor "${searchQuery}".` : activeFilter === "Datum" ? "Geen notities geschreven op deze datum." : "Er zijn nog geen notities."}</Text>
				</View>
			)}

			{isLoading && feedData.length === 0 ? (
				<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
					<ActivityIndicator size="large" color={COLORS.accent} />
				</View>
			) : (
				<FlatList
					data={displayData}
					keyExtractor={(item, index) => item.id + index}
					contentContainerStyle={styles.listContent}
					showsVerticalScrollIndicator={false}
					onRefresh={refresh}
					refreshing={isRefreshing}
					onEndReached={loadMore}
					onEndReachedThreshold={0.5}
					renderItem={renderFeedItem}
					ListFooterComponent={<View style={{ paddingVertical: 30, alignItems: "center" }}>{isLoading && feedData.length > 0 && <ActivityIndicator color={COLORS.accent} />}</View>}
				/>
			)}

			<Pressable
				style={styles.fab}
				onPress={() => {
					setNoteToEdit(null);
					setAddModalVisible(true);
				}}
			>
				<MaterialCommunityIcons name="pencil-plus-outline" size={28} color={COLORS.primary} />
			</Pressable>

			<AddNoteModal
				visible={isAddModalVisible}
				onClose={() => {
					setAddModalVisible(false);
					refresh();
				}}
				noteToEdit={noteToEdit}
			/>

			{isDatePickerVisible && Platform.OS === "ios" && (
				<Modal transparent animationType="fade">
					<Pressable style={styles.calendarOverlay} onPress={() => setDatePickerVisible(false)}>
						<Pressable style={styles.calendarContent}>
							<DateTimePicker value={selectedDate ? new Date(selectedDate) : new Date()} mode="date" display="inline" onChange={onDateChange} maximumDate={new Date()} themeVariant="light" />
						</Pressable>
					</Pressable>
				</Modal>
			)}
			{isDatePickerVisible && Platform.OS === "android" && <DateTimePicker value={selectedDate ? new Date(selectedDate) : new Date()} mode="date" display="calendar" onChange={onDateChange} maximumDate={new Date()} />}
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
	templateBanner: { flexDirection: "row", backgroundColor: "rgba(233, 248, 0, 0.15)", padding: 14, borderRadius: 14, marginHorizontal: 24, marginTop: 10, alignItems: "center", borderWidth: 1, borderColor: "rgba(154, 217, 0, 0.2)" },
	templateText: { flex: 1, fontFamily: FONTS.body, fontSize: 13, color: "#354E00", lineHeight: 18 },
	emptyState: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40, marginTop: 40 },
	emptyStateText: { marginTop: 16, fontFamily: "InterMedium", fontSize: 15, color: "rgba(35, 54, 0, 0.5)", textAlign: "center", lineHeight: 22 },
	listContent: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 100 },
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
	calendarOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
	calendarContent: { backgroundColor: "#FFF", borderRadius: 20, width: "100%", padding: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 10 },
});
