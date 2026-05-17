import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { NoteData } from "../components/ui/NoteCard";
import { getDailyQuote } from "../constants/quotes";
import { useSession } from "../context";
import { getDailyNote } from "../services/firebase/notes.service";
import { deleteTaskFromDB, getTasksForDate, toggleTaskStatusInDB } from "../services/firebase/tasks.service";

export function useDailySummary() {
	const { t } = useTranslation();
	const { userData, user } = useSession();
	const circleId = userData?.careCircleId;
	const currentUserId = user?.uid;
	const userRole = userData?.role || "member";

	const [currentTime, setCurrentTime] = useState(new Date());
	const [tasks, setTasks] = useState<any[]>([]);
	const [note, setNote] = useState<NoteData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isTemplateMode, setIsTemplateMode] = useState(false);

	const [refreshTrigger, setRefreshTrigger] = useState(0);

	const TEMPLATE_TASKS = useMemo(
		() => [
			{
				id: "tmpl_1",
				title: t("dailySummary.templateTask1"),
				time: "11:30",
				status: "Nog te doen" as const,
				icon: "food-fork-drink" as const,
				createdBy: "demo",
				description: [t("dailySummary.templateTask1Desc")],
			},
			{
				id: "tmpl_2",
				title: t("dailySummary.templateTask2"),
				time: "15:30",
				status: "Voltooid" as const,
				icon: "clipboard-pulse-outline" as const,
				createdBy: "demo",
				expanded: true,
				description: [t("dailySummary.templateTask2Desc1"), t("dailySummary.templateTask2Desc2"), t("dailySummary.templateTask2Desc3")],
				assignee: { name: "Beatrice", initials: "BB", photo: "https://i.pravatar.cc/100?img=5" },
			},
		],
		[t],
	);

	useEffect(() => {
		const timer = setInterval(() => {
			setCurrentTime(new Date());
		}, 60000);
		return () => clearInterval(timer);
	}, []);

	const year = currentTime.getFullYear();
	const monthStr = (currentTime.getMonth() + 1).toString().padStart(2, "0");
	const dayStr = currentTime.getDate().toString().padStart(2, "0");
	const databaseDateQueryString = `${year}-${monthStr}-${dayStr}`;

	useEffect(() => {
		async function loadFirebaseData() {
			if (!circleId) {
				setTasks(TEMPLATE_TASKS.map((t, i) => ({ ...t, expanded: i === TEMPLATE_TASKS.length - 1 })));
				setIsTemplateMode(true);
				setIsLoading(false);
				return;
			}

			try {
				setIsLoading(true);
				const [fetchedTasks, fetchedNote] = await Promise.all([getTasksForDate(circleId, databaseDateQueryString), getDailyNote(circleId, databaseDateQueryString)]);

				if (fetchedTasks.length === 0) {
					setTasks(TEMPLATE_TASKS.map((t, i) => ({ ...t, expanded: i === TEMPLATE_TASKS.length - 1 })));
					setIsTemplateMode(true);
				} else {
					setTasks(fetchedTasks.map((t, i) => ({ ...t, expanded: i === fetchedTasks.length - 1 })));
					setIsTemplateMode(false);
				}

				if (!fetchedNote) {
					setNote({
						id: "empty_state",
						title: t("dailySummary.emptyNoteTitle"),
						time: "--:--",
						icon: "comment-plus-outline",
						tag: t("dailySummary.emptyNoteTag"),
						content: t("dailySummary.emptyNoteContent"),
					});
				} else {
					setNote({
						id: fetchedNote.id,
						title: fetchedNote.title,
						time: fetchedNote.time,
						icon: fetchedNote.icon || "notebook-outline",
						tag: fetchedNote.isImportant ? t("dailySummary.importantTag") : t("dailySummary.noteTag"),
						content: fetchedNote.content,
					});
				}
			} catch (error) {
				console.error("Error loading:", error);
			} finally {
				setIsLoading(false);
			}
		}

		loadFirebaseData();
	}, [circleId, databaseDateQueryString, refreshTrigger, TEMPLATE_TASKS, t]);

	const displayName = userData?.name || user?.displayName?.split(" ")[0] || "Beatrice";
	const formattedTime = currentTime.toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" });
	const formattedDate = `${dayStr}.${monthStr}`;
	const dayName = currentTime.toLocaleDateString("nl-BE", { weekday: "long" });
	const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
	const dailyQuote = getDailyQuote(currentTime);

	const { totalToday, completed, open } = useMemo(() => {
		const total = tasks.length;
		const comp = tasks.filter((t) => t.status === "Voltooid").length;
		const op = tasks.filter((t) => t.status !== "Voltooid").length;
		return { totalToday: total, completed: comp, open: op };
	}, [tasks]);

	const toggleTaskExpanded = (id: string) => {
		setTasks((prevTasks) => prevTasks.map((t) => (t.id === id ? { ...t, expanded: !t.expanded } : t)));
	};

	const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
		const newStatus = currentStatus === "Voltooid" ? "Nog te doen" : "Voltooid";

		setTasks((prevTasks) => prevTasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));

		if (!isTemplateMode) {
			try {
				await toggleTaskStatusInDB(taskId, currentStatus);
			} catch (error) {
				console.error(error);
				setTasks((prevTasks) => prevTasks.map((t) => (t.id === taskId ? { ...t, status: currentStatus } : t)));
				Alert.alert(t("tasks.errors.errorTitle"), t("tasks.errors.statusFailed"));
			}
		}
	};

	const handleTriggerDeleteTask = async (taskId: string, taskCreatorId: string) => {
		if (isTemplateMode) {
			setTasks((prevTasks) => prevTasks.filter((t) => t.id !== taskId));
			return;
		}

		if (!currentUserId) return;

		try {
			await deleteTaskFromDB(taskId, taskCreatorId, userRole, currentUserId);
			setTasks((prevTasks) => prevTasks.filter((t) => t.id !== taskId));
		} catch (error: any) {
			Alert.alert(t("tasks.errors.deniedTitle"), error.message || t("tasks.errors.deleteDenied"));
		}
	};

	const triggerRefresh = () => {
		setRefreshTrigger((prev) => prev + 1);
	};

	return {
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
	};
}
