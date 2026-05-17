import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AddTaskModal } from "../../components/ui/AddTaskModal";
import Button from "../../components/ui/Button";
import { NoteCard } from "../../components/ui/NoteCard";
import { QuoteCard } from "../../components/ui/QuoteCard";
import { TaskCard } from "../../components/ui/TaskCard";
import { TaskSummaryCards } from "../../components/ui/TaskSummaryCards";

import { COLORS, FONTS } from "../../constants/theme";
import { useSession } from "../../context";
import { useDailySummary } from "../../hooks/useDailySummary";

export default function DailySummaryHome() {
	const { t } = useTranslation();
	const router = useRouter();
	const { user, userData } = useSession();

	const [isAddTaskModalVisible, setAddTaskModalVisible] = useState(false);
	const [taskToEdit, setTaskToEdit] = useState<any>(null);

	const {
		displayName,
		formattedTime,
		formattedDate,
		capitalizedDayName,
		dailyQuote,
		tasks,
		note,
		totalToday,
		completed,
		open,
		isTemplateMode,
		databaseDateQueryString,
		toggleTaskExpanded,
		handleToggleTaskStatus,
		handleTriggerDeleteTask,
		triggerRefresh,
	} = useDailySummary();

	const handleEditTask = (task: any) => {
		setTaskToEdit(task);
		setAddTaskModalVisible(true);
	};

	const handleDeleteTask = (taskId: string, taskCreatorId: string) => {
		handleTriggerDeleteTask(taskId, taskCreatorId);
	};

	const handleCloseModal = () => {
		setAddTaskModalVisible(false);
		setTaskToEdit(null);
		triggerRefresh();
	};

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
				<View style={styles.header}>
					<View style={styles.titleRow}>
						<Text style={styles.titleText}>{t("dailySummary.titlePart1")}</Text>
						<View style={styles.highlightWrapper}>
							<Text style={styles.highlightText}>{t("dailySummary.titlePart2")}</Text>
						</View>
					</View>
					<Text style={styles.greeting}>{t("dailySummary.greeting", { name: displayName })}</Text>
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
					<Text style={styles.panelTitle}>{t("dailySummary.tasksToday")}</Text>

					{isTemplateMode && (
						<View style={styles.templateBanner}>
							<MaterialCommunityIcons name="information-outline" size={20} color="#354E00" style={{ marginRight: 10 }} />
							<Text style={styles.templateText}>{t("dailySummary.templateBanner")}</Text>
						</View>
					)}

					{tasks.map((task, idx) => {
						const taskTheme = idx % 2 === 0 ? "yellow" : "purple";

						const currentUserId = user?.uid;
						const isOwner = task.createdBy === currentUserId;
						const isAdmin = userData?.role === "admin";
						const canManageTask = isTemplateMode ? true : isAdmin || isOwner;

						return (
							<TaskCard
								key={task.id}
								task={{ ...task, theme: taskTheme }}
								expanded={task.expanded}
								onPress={() => toggleTaskExpanded(task.id)}
								onToggleStatus={() => handleToggleTaskStatus(task.id, task.status)}
								canManage={canManageTask}
								onEdit={() => handleEditTask(task)}
								onDelete={() => handleDeleteTask(task.id, task.createdBy)}
								overlap={!task.expanded && idx < tasks.length - 1}
								stackIndex={idx}
							/>
						);
					})}

					<View style={styles.addWrapper}>
						<Pressable
							style={styles.addButton}
							onPress={() => {
								setTaskToEdit(null);
								setAddTaskModalVisible(true);
							}}
						>
							<Text style={styles.addButtonText}>{t("tasks.addTask")}</Text>
						</Pressable>
					</View>
				</View>

				<View style={styles.notesSection}>
					<View style={styles.notesTitleRow}>
						<Text style={styles.notesTitleText}>{t("dailySummary.my")}</Text>
						<View style={styles.notesHighlightWrapper}>
							<Text style={styles.notesHighlightText}>{t("dailySummary.notes")}</Text>
						</View>
					</View>

					{note && <NoteCard note={note} />}

					<View style={styles.seeMoreWrapper}>
						<Button title={t("dailySummary.seeMoreNotes")} onPress={() => router.push("/notes")} variant="primary" />
					</View>
				</View>
			</ScrollView>

			{databaseDateQueryString && <AddTaskModal visible={isAddTaskModalVisible} onClose={handleCloseModal} currentDateStr={databaseDateQueryString} taskToEdit={taskToEdit} />}
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
