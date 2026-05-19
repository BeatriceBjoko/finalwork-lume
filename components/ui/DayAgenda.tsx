import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS } from "../../constants/theme";
import { useSession } from "../../context";
import { CalendarTask } from "../../hooks/useCalendarFeed";
import { TaskCard, TaskData } from "./TaskCard";

interface DayAgendaProps {
	tasks: CalendarTask[];
	onTaskPress: (task: CalendarTask) => void;
	onTaskToggleStatus: (task: CalendarTask) => void;
	onTaskSync: (task: CalendarTask) => void;
	onTaskDelete: (task: CalendarTask) => void;
}

function getStartTime(time: string): string {
	if (time?.includes(" - ")) return time.split(" - ")[0];
	return time ?? "";
}

function buildTaskCardData(task: CalendarTask, theme: "yellow" | "purple"): TaskData {
	return {
		id: task.id,
		title: task.title,
		time: task.time,
		status: task.status,
		theme,
		icon: task.icon as TaskData["icon"],
		description: task.description,
		assignee: task.assignee
			? {
					name: task.assignee.name,
					initials: task.assignee.initials,
					photo: task.assignee.photo ?? undefined,
				}
			: undefined,
		createdBy: task.createdBy,
	};
}

export function DayAgenda({ tasks, onTaskPress, onTaskToggleStatus, onTaskSync, onTaskDelete }: DayAgendaProps) {
	const { t } = useTranslation();
	const { user, userData } = useSession();
	const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

	const canManage = (task: CalendarTask) => {
		const isOwner = task.createdBy === user?.uid;
		const isAdmin = userData?.role === "admin";
		return isAdmin || isOwner;
	};

	return (
		<View style={styles.container}>
			{tasks.map((task, idx) => {
				const theme: "yellow" | "purple" = idx % 2 === 0 ? "yellow" : "purple";
				const taskData = buildTaskCardData(task, theme);
				const isExpanded = expandedTaskId === task.id;
				const isLast = idx === tasks.length - 1;
				const startTime = getStartTime(task.time);

				return (
					<View key={task.id} style={styles.row}>
						<View style={styles.timeCol}>
							<Text style={styles.timeStart}>{startTime}</Text>
						</View>

						<View style={styles.timelineCol}>
							<View style={styles.dot} />
							{!isLast && <View style={styles.line} />}
						</View>

						<View style={styles.cardArea}>
							<TaskCard
								task={taskData}
								expanded={isExpanded}
								onPress={() => {
									Haptics.selectionAsync();
									setExpandedTaskId(isExpanded ? null : task.id);
								}}
								onToggleStatus={() => onTaskToggleStatus(task)}
								canManage={canManage(task)}
								onEdit={() => onTaskPress(task)}
								onDelete={() => onTaskDelete(task)}
								overlap={false}
								stackIndex={idx}
							/>

							<Pressable
								onPress={() => {
									Haptics.selectionAsync();
									console.log("[Calendar] Sync pressed for:", task.title);
									onTaskSync(task);
								}}
								style={styles.syncBtn}
								hitSlop={10}
							>
								<MaterialCommunityIcons name="calendar-export" size={14} color={COLORS.primary} />
								<Text style={styles.syncText}>{t("calendar.syncBtn")}</Text>
							</Pressable>
						</View>
					</View>
				);
			})}
		</View>
	);
}

const styles = StyleSheet.create({
	container: { paddingTop: 4 },
	row: {
		flexDirection: "row",
		marginBottom: 14,
	},

	timeCol: {
		width: 46,
		paddingTop: 14,
	},
	timeStart: {
		fontFamily: "InterBold",
		fontSize: 13,
		color: COLORS.primary,
	},

	timelineCol: {
		width: 14,
		alignItems: "center",
		paddingTop: 18,
	},
	dot: {
		width: 10,
		height: 10,
		borderRadius: 5,
		backgroundColor: "#354E00",
		borderWidth: 2,
		borderColor: COLORS.accent,
	},
	line: {
		flex: 1,
		width: 2,
		backgroundColor: "rgba(35, 54, 0, 0.10)",
		marginTop: 4,
	},

	cardArea: {
		flex: 1,
		paddingLeft: 8,
	},
	syncBtn: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		alignSelf: "flex-start",
		backgroundColor: "rgba(239, 252, 0, 0.30)",
		borderWidth: 1,
		borderColor: "rgba(239, 252, 0, 0.55)",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 12,
		marginTop: 6,
		marginLeft: 4,
	},
	syncText: {
		fontFamily: "InterMedium",
		fontSize: 12,
		color: COLORS.primary,
	},
});
