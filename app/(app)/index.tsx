import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../../components/ui/Button";
import { NoteCard } from "../../components/ui/NoteCard";
import { QuoteCard } from "../../components/ui/QuoteCard";
import { TaskCard } from "../../components/ui/TaskCard";
import { TaskSummaryCards } from "../../components/ui/TaskSummaryCards";
import { COLORS, FONTS } from "../../constants/theme";
import { useDailySummary } from "../../hooks/useDailySummary";

export default function DailySummaryHome() {
	const { displayName, formattedTime, formattedDate, capitalizedDayName, dailyQuote, tasks, note, totalToday, completed, open, isTemplateMode, toggleTask } = useDailySummary();

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
				<View style={styles.header}>
					<View style={styles.titleRow}>
						<Text style={styles.titleText}>Dagelijkse</Text>
						<View style={styles.highlightWrapper}>
							<Text style={styles.highlightText}>samenvatting</Text>
						</View>
					</View>
					<Text style={styles.greeting}>Halloo! {displayName}</Text>
				</View>

				<View style={styles.section}>
					<QuoteCard quote={dailyQuote} />
				</View>

				<View style={styles.dateRow}>
					<View>
						<Text style={styles.dateNum}>{formattedDate}</Text>
						<Text style={styles.dateDay}>{capitalizedDayName}</Text>
					</View>
					<View style={styles.timeBlock}>
						<View style={styles.timeDivider} />
						<Text style={styles.timeText}>{formattedTime} uur</Text>
					</View>
				</View>

				<View style={styles.section}>
					<TaskSummaryCards totalToday={totalToday} completed={completed} open={open} />
				</View>

				<View style={styles.panel}>
					<Text style={styles.panelTitle}>Taken van vandaag</Text>

					{isTemplateMode && (
						<View style={styles.templateBanner}>
							<MaterialCommunityIcons name="information-outline" size={20} color="#354E00" style={{ marginRight: 10 }} />
							<Text style={styles.templateText}>Dit zijn voorbeeldtaken om te laten zien hoe de app werkt. Verwijder deze gerust en voeg je eigen taken toe!</Text>
						</View>
					)}

					{tasks.map((task, idx) => {
						const taskTheme = idx % 2 === 0 ? "yellow" : "purple";

						return <TaskCard key={task.id} task={{ ...task, theme: taskTheme }} expanded={task.expanded} onPress={() => toggleTask(task.id)} overlap={!task.expanded && idx < tasks.length - 1} stackIndex={idx} />;
					})}

					<View style={styles.addWrapper}>
						<Pressable style={styles.addButton}>
							<Text style={styles.addButtonText}>Taak toevoegen</Text>
						</Pressable>
					</View>
				</View>

				<View style={styles.notesSection}>
					<View style={styles.notesTitleRow}>
						<Text style={styles.notesTitleText}>Mijn</Text>
						<View style={styles.notesHighlightWrapper}>
							<Text style={styles.notesHighlightText}>notities</Text>
						</View>
					</View>

					{note && <NoteCard note={note} />}

					<View style={styles.seeMoreWrapper}>
						<Button title="Zie meer notities" onPress={() => {}} variant="primary" />
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: COLORS.background },
	scroll: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 60 },

	header: { alignItems: "center", marginBottom: 28 },
	titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
	titleText: { fontFamily: FONTS.heading, fontSize: 28, color: COLORS.primary },
	highlightWrapper: { backgroundColor: COLORS.accent, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
	highlightText: { fontFamily: FONTS.heading, fontSize: 28, color: COLORS.primary },
	greeting: { fontFamily: FONTS.body, fontSize: 15, color: COLORS.primary, marginTop: 8, opacity: 0.75 },

	section: { marginBottom: 24 },

	dateRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
	dateNum: { fontFamily: "InterMedium", fontSize: 48, color: "#000000", lineHeight: 52 },
	dateDay: { fontFamily: "InterMedium", fontSize: 32, color: "#233600", lineHeight: 36 },
	timeBlock: { flexDirection: "row", alignItems: "center" },
	timeDivider: { width: 1, height: 48, backgroundColor: "rgba(35, 54, 0, 0.15)", marginRight: 14 },
	timeText: { fontFamily: "InterSemiBold", fontSize: 15, color: COLORS.primary },

	panel: {
		backgroundColor: COLORS.white,
		marginHorizontal: -24,
		paddingHorizontal: 24,
		paddingTop: 28,
		borderTopLeftRadius: 36,
		borderTopRightRadius: 36,
		borderWidth: 1,
		borderColor: "rgba(35, 54, 0, 0.10)",
		borderBottomWidth: 0,
		shadowColor: COLORS.primary,
		shadowOffset: { width: 0, height: -4 },
		shadowOpacity: 0.05,
		shadowRadius: 12,
		elevation: 8,
		minHeight: 400,
	},
	panelTitle: { fontFamily: "BricolageMedium", fontSize: 18, color: COLORS.primary, marginBottom: 18 },

	templateBanner: {
		flexDirection: "row",
		backgroundColor: "rgba(233, 248, 0, 0.15)",
		padding: 14,
		borderRadius: 14,
		marginBottom: 20,
		alignItems: "center",
		borderWidth: 1,
		borderColor: "rgba(154, 217, 0, 0.2)",
	},
	templateText: { flex: 1, fontFamily: FONTS.body, fontSize: 13, color: "#354E00", lineHeight: 18 },

	addWrapper: { alignItems: "center", marginTop: 12, marginBottom: 32 },
	addButton: {
		backgroundColor: COLORS.buttonFill,
		paddingVertical: 14,
		paddingHorizontal: 28,
		borderRadius: 12,
		shadowColor: COLORS.buttonShadow,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.4,
		shadowRadius: 8,
		elevation: 4,
	},
	addButtonText: { fontFamily: FONTS.button, fontSize: 14, color: COLORS.buttonText },

	notesSection: { marginTop: 32, paddingHorizontal: 0, alignItems: "center" },
	notesTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 16, gap: 6 },
	notesTitleText: { fontFamily: FONTS.heading, fontSize: 22, color: COLORS.primary },
	notesHighlightWrapper: { backgroundColor: COLORS.accent, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 16 },
	notesHighlightText: { fontFamily: FONTS.heading, fontSize: 22, color: COLORS.primary },

	seeMoreWrapper: {
		alignItems: "stretch",
		width: "100%",
		marginTop: 20,
		marginBottom: 16,
	},
});
