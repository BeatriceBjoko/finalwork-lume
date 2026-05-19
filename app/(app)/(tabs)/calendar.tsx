import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AddTaskModal } from "../../../components/ui/AddTaskModal";
import { CalendarHero } from "../../../components/ui/CalendarHero";
import { CalendarMonth } from "../../../components/ui/CalendarMonth";
import CustomAlert from "../../../components/ui/CustomAlert";
import { DayAgenda } from "../../../components/ui/DayAgenda";
import { COLORS, FONTS } from "../../../constants/theme";
import { CalendarTask, useCalendarFeed } from "../../../hooks/useCalendarFeed";

export default function CalendarScreen() {
	const { t, i18n } = useTranslation();
	const insets = useSafeAreaInsets();
	const locale = i18n.language.startsWith("fr") ? "fr-FR" : "nl-BE";

	const [isAddTaskModalVisible, setAddTaskModalVisible] = useState(false);
	const [taskToEdit, setTaskToEdit] = useState<any>(null);

	const {
		selectedDate,
		setSelectedDate,
		syncResult,
		openSyncedEvent,
		dismissSyncResult,
		currentMonth,
		goToPreviousMonth,
		goToNextMonth,
		goToToday,
		isCurrentMonth,
		tasksForSelectedDate,
		taskDaysInMonth,
		isLoading,
		exportToDeviceCalendar,
		handleToggleTaskStatus,
		handleDeleteTask,
	} = useCalendarFeed();

	const formattedSelectedDate = (() => {
		const [y, m, d] = selectedDate.split("-").map(Number);
		const date = new Date(y, m - 1, d);
		const raw = date.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });
		return raw.charAt(0).toUpperCase() + raw.slice(1);
	})();

	const handleTaskPress = (task: CalendarTask) => {
		setTaskToEdit(task);
		setAddTaskModalVisible(true);
	};

	const renderDayContent = () => {
		if (isLoading) {
			return (
				<View style={styles.loadingWrap}>
					<ActivityIndicator color={COLORS.primary} size="large" />
				</View>
			);
		}

		if (tasksForSelectedDate.length === 0) {
			return (
				<View style={styles.emptyState}>
					<View style={styles.emptyCircle}>
						<MaterialCommunityIcons name="white-balance-sunny" size={36} color="rgba(35, 54, 0, 0.5)" />
					</View>
					<Text style={styles.emptyTitle}>{t("calendar.empty.title")}</Text>
					<Text style={styles.emptyText}>{t("calendar.empty.subtitle")}</Text>
				</View>
			);
		}

		return (
			<DayAgenda
				tasks={tasksForSelectedDate}
				onTaskPress={handleTaskPress}
				onTaskToggleStatus={(task) => handleToggleTaskStatus(task.id, task.status)}
				onTaskSync={(task) => exportToDeviceCalendar(task)}
				onTaskDelete={(task) => handleDeleteTask(task.id, task.createdBy)}
			/>
		);
	};

	return (
		<View style={styles.container}>
			<ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 160 }]} showsVerticalScrollIndicator={false}>
				<CalendarHero year={currentMonth.year} month={currentMonth.month} isCurrentMonth={isCurrentMonth} onPrev={goToPreviousMonth} onNext={goToNextMonth} onToday={goToToday} locale={locale} />

				<CalendarMonth year={currentMonth.year} month={currentMonth.month} selectedDate={selectedDate} taskDaysInMonth={taskDaysInMonth} onSelectDate={setSelectedDate} locale={locale} />

				<View style={styles.daySection}>
					<View style={styles.dayHeaderRow}>
						<Text style={styles.dayTitle}>{formattedSelectedDate}</Text>
						{tasksForSelectedDate.length > 0 && (
							<View style={styles.countPill}>
								<Text style={styles.countText}>{t("calendar.tasksCount", { count: tasksForSelectedDate.length })}</Text>
							</View>
						)}
					</View>

					<View style={styles.dayCard}>{renderDayContent()}</View>
				</View>
			</ScrollView>

			<Pressable
				style={[styles.fab, { bottom: insets.bottom + 100 }]}
				onPress={() => {
					setTaskToEdit(null);
					setAddTaskModalVisible(true);
				}}
			>
				<MaterialCommunityIcons name="plus" size={30} color={COLORS.primary} />
			</Pressable>

			<AddTaskModal
				visible={isAddTaskModalVisible}
				onClose={() => {
					setAddTaskModalVisible(false);
					setTaskToEdit(null);
				}}
				currentDateStr={selectedDate}
				taskToEdit={taskToEdit}
			/>

			<CustomAlert
				visible={syncResult.visible}
				title={t("calendar.syncedTitle")}
				message={t("calendar.syncedMessage", { task: syncResult.taskTitle })}
				confirmText={t("calendar.openCalendar")}
				cancelText={t("common.ok")}
				onConfirm={openSyncedEvent}
				onCancel={dismissSyncResult}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: COLORS.background },
	scroll: { paddingHorizontal: 20, paddingTop: 8 },

	daySection: { marginTop: 28 },
	dayHeaderRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 14,
		paddingHorizontal: 4,
	},
	dayTitle: {
		fontFamily: "BricolageMedium",
		fontSize: 16,
		color: COLORS.primary,
		flex: 1,
	},
	countPill: {
		backgroundColor: "rgba(239, 252, 0, 0.30)",
		paddingHorizontal: 10,
		paddingVertical: 3,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: "rgba(239, 252, 0, 0.5)",
	},
	countText: {
		fontFamily: "InterSemiBold",
		fontSize: 11,
		color: "#354E00",
	},

	dayCard: {
		backgroundColor: COLORS.white,
		borderRadius: 24,
		paddingHorizontal: 14,
		paddingVertical: 18,
		shadowColor: "#233600",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.06,
		shadowRadius: 12,
		elevation: 3,
		borderWidth: 1,
		borderColor: "rgba(35, 54, 0, 0.06)",
	},

	loadingWrap: { paddingVertical: 40, alignItems: "center" },

	emptyState: {
		alignItems: "center",
		paddingVertical: 20,
		paddingHorizontal: 16,
		gap: 12,
	},
	emptyCircle: {
		width: 64,
		height: 64,
		borderRadius: 32,
		backgroundColor: "rgba(239, 252, 0, 0.4)",
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 4,
	},
	emptyTitle: {
		fontFamily: FONTS.heading,
		fontSize: 16,
		color: COLORS.primary,
	},
	emptyText: {
		fontFamily: FONTS.body,
		fontSize: 13,
		color: "rgba(35, 54, 0, 0.55)",
		textAlign: "center",
		lineHeight: 20,
	},

	fab: {
		position: "absolute",
		right: 24,
		width: 60,
		height: 60,
		borderRadius: 30,
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
