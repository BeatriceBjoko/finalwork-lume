import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../../components/ui/Button";
import { NoteCard, NoteData } from "../../components/ui/NoteCard";
import { QuoteCard } from "../../components/ui/QuoteCard";
import { TaskCard, TaskData } from "../../components/ui/TaskCard";
import { TaskSummaryCards } from "../../components/ui/TaskSummaryCards";
import { COLORS, FONTS } from "../../constants/theme";
import { useSession } from "../../context";

const DAILY_QUOTE = "Je hoeft het niet allemaal alleen te dragen";

const MOCK_NOTE: NoteData = {
	id: "1",
	title: "Praktische info",
	time: "15:00",
	icon: "notebook-outline",
	tag: "Vandaag",
	content: "Nieuwe medicatie moet morgen nog opgehaald worden. Doktersbrief moet nog ingevuld worden. Boodschappen zijn bijna op en het verband moet vervangen worden om 18u.",
};

const MOCK_TASKS: (TaskData & { expanded: boolean })[] = [
	{
		id: "1",
		title: "Ochtend vitals & medicatie",
		time: "08:00",
		status: "Voltooid",
		theme: "yellow",
		icon: "pill",
		expanded: false,
		description: ["Bloeddruk en hartslag controleren", "Ochtendmedicatie geven na het ontbijt", "Noteer als er iets ongewoon is"],
		assignee: { name: "Beatrice", initials: "BB", photo: "https://i.pravatar.cc/100?img=5" },
	},
	{
		id: "2",
		title: "Tuintherapie",
		time: "09:00",
		status: "Nog te doen",
		theme: "purple",
		icon: "flower-outline",
		expanded: false,
		description: ["Rustige wandeling in de tuin", "Let op vermoeidheid of duizeligheid", "Water meenemen"],
	},
	{
		id: "3",
		title: "Voedzame lunch",
		time: "11:30",
		status: "Nog te doen",
		theme: "yellow",
		icon: "food-fork-drink",
		expanded: false,
		description: ["Lichte lunch met zalm, groenten en rijst klaarmaken", "Zorg voor een rustig eetmoment zonder haast", "Noteer of de maaltijd goed werd opgegeten"],
	},
	{
		id: "4",
		title: "Kinesitherapie – Controle na operatie",
		time: "15:30",
		status: "Voltooid",
		theme: "purple",
		icon: "clipboard-pulse-outline",
		expanded: true,
		description: ["Opvolgafspraak bij UZ Brussel", "Kamer 402 – hoofdgebouw", "Vergeet je medische dossiers niet mee te nemen"],
		assignee: { name: "Beatrice", initials: "BB", photo: "https://i.pravatar.cc/100?img=5" },
	},
];

export default function DailySummaryHome() {
	const { user } = useSession();
	const [tasks, setTasks] = useState(MOCK_TASKS);

	const displayName = user?.displayName || "Beatrice Bjoko";
	const totalToday = tasks.length;
	const completed = tasks.filter((t) => t.status === "Voltooid").length;
	const open = tasks.filter((t) => t.status !== "Voltooid").length;

	const toggleTask = (id: string) => {
		setTasks(tasks.map((t) => (t.id === id ? { ...t, expanded: !t.expanded } : t)));
	};

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
					<QuoteCard quote={DAILY_QUOTE} />
				</View>

				<View style={styles.dateRow}>
					<View>
						<Text style={styles.dateNum}>27.04</Text>
						<Text style={styles.dateDay}>Zaterdag</Text>
					</View>
					<View style={styles.timeBlock}>
						<View style={styles.timeDivider} />
						<Text style={styles.timeText}>14:50 uur</Text>
					</View>
				</View>

				<View style={styles.section}>
					<TaskSummaryCards totalToday={totalToday} completed={completed} open={open} />
				</View>

				<View style={styles.panel}>
					<Text style={styles.panelTitle}>Taken van vandaag</Text>

					{tasks.map((task, idx) => (
						<TaskCard key={task.id} task={task} expanded={task.expanded} onPress={() => toggleTask(task.id)} overlap={!task.expanded && idx < tasks.length - 1} stackIndex={idx} />
					))}

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

					<NoteCard note={MOCK_NOTE} />

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
