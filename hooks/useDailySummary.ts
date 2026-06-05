import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { NoteData } from "../components/ui/NoteCard";
import { getDailyQuote } from "../constants/quotes";
import { useSession } from "../context";
import { db } from "../lib/firebase-config";
import { subscribeToDailyNote } from "../services/firebase/notes.service";
import { deleteTaskFromDB, toggleTaskStatusInDB } from "../services/firebase/tasks.service";
import { enrichMedicationTask, useMedicationDetails } from "./useMedicationDetails";

export function useDailySummary() {
	const { t, i18n } = useTranslation();
	const { userData, user } = useSession();
	const circleId = userData?.careCircleId;
	const currentUserId = user?.uid;
	const userRole = userData?.role || "member";

	const [currentTime, setCurrentTime] = useState(new Date());
	const [liveTasks, setLiveTasks] = useState<any[]>([]);
	const [templateTasks, setTemplateTasks] = useState<any[]>([]);
	const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
	const [note, setNote] = useState<NoteData | null>(null);
	const [isTemplateMode, setIsTemplateMode] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const seededDateRef = useRef<string>("");

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
		const timer = setInterval(() => setCurrentTime(new Date()), 60000);
		return () => clearInterval(timer);
	}, []);

	const year = currentTime.getFullYear();
	const monthStr = (currentTime.getMonth() + 1).toString().padStart(2, "0");
	const dayStr = currentTime.getDate().toString().padStart(2, "0");
	const databaseDateQueryString = `${year}-${monthStr}-${dayStr}`;

	// LIVE tasks for today (auto-updates from any screen)
	useEffect(() => {
		if (!circleId) {
			setLiveTasks([]);
			setIsTemplateMode(true);
			return;
		}
		const q = query(collection(db, "careCircleTasks"), where("careCircleId", "==", circleId), where("date", "==", databaseDateQueryString));
		const unsub = onSnapshot(
			q,
			(snap) => {
				const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
				setLiveTasks(items);
				setIsTemplateMode(items.length === 0);
			},
			(e) => console.error("Daily tasks feed error:", e),
		);
		return () => unsub();
	}, [circleId, databaseDateQueryString]);

	useEffect(() => {
		if (isTemplateMode) {
			setTemplateTasks(TEMPLATE_TASKS.map((tk, i) => ({ ...tk, expanded: i === TEMPLATE_TASKS.length - 1 })));
		}
	}, [isTemplateMode, TEMPLATE_TASKS]);

	useEffect(() => {
		if (isTemplateMode || liveTasks.length === 0) return;
		if (seededDateRef.current === databaseDateQueryString) return;
		const sorted = [...liveTasks].sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
		seededDateRef.current = databaseDateQueryString;
		setExpandedIds(new Set([sorted[sorted.length - 1].id]));
	}, [isTemplateMode, liveTasks, databaseDateQueryString]);

	const medicationIds = useMemo(() => liveTasks.filter((tk) => tk.isMedication && tk.medicationId).map((tk) => tk.medicationId as string), [liveTasks]);
	const medDetails = useMedicationDetails(medicationIds);

	const tasks = useMemo(() => {
		if (isTemplateMode) return templateTasks;
		const sorted = [...liveTasks].sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
		return sorted.map((tk) => ({ ...enrichMedicationTask(tk, medDetails), expanded: expandedIds.has(tk.id) }));
	}, [isTemplateMode, templateTasks, liveTasks, medDetails, expandedIds]);

	useEffect(() => {
		if (!circleId) {
			setNote(null);
			return;
		}
		const unsubscribe = subscribeToDailyNote(
			circleId,
			databaseDateQueryString,
			(fetchedNote) => {
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
			},
			(e) => console.error("Error live daily note:", e),
		);
		return () => unsubscribe();
	}, [circleId, databaseDateQueryString, t]);

	const displayName = userData?.name || user?.displayName?.split(" ")[0] || "Beatrice";
	const locale = i18n.language.startsWith("fr") ? "fr-FR" : "nl-BE";
	const formattedTime = currentTime.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
	const formattedDate = `${dayStr}.${monthStr}`;
	const dayName = currentTime.toLocaleDateString(locale, { weekday: "long" });
	const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
	const dailyQuote = getDailyQuote(currentTime, i18n.language);

	const { totalToday, completed, open } = useMemo(() => {
		const total = tasks.length;
		const comp = tasks.filter((tk) => tk.status === "Voltooid").length;
		return { totalToday: total, completed: comp, open: total - comp };
	}, [tasks]);

	const toggleTaskExpanded = (id: string) => {
		if (isTemplateMode) {
			setTemplateTasks((prev) => prev.map((tk) => (tk.id === id ? { ...tk, expanded: !tk.expanded } : tk)));
			return;
		}
		setExpandedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
		if (isTemplateMode) {
			const newStatus = currentStatus === "Voltooid" ? "Nog te doen" : "Voltooid";
			setTemplateTasks((prev) => prev.map((tk) => (tk.id === taskId ? { ...tk, status: newStatus } : tk)));
			return;
		}
		try {
			await toggleTaskStatusInDB(taskId, currentStatus);
		} catch (error) {
			console.error(error);
			Alert.alert(t("tasks.errors.errorTitle"), t("tasks.errors.statusFailed"));
		}
	};

	const handleTriggerDeleteTask = async (taskId: string, taskCreatorId: string) => {
		if (isTemplateMode) {
			setTemplateTasks((prev) => prev.filter((tk) => tk.id !== taskId));
			return;
		}
		if (!currentUserId) return;
		try {
			await deleteTaskFromDB(taskId, taskCreatorId, userRole, currentUserId);
		} catch (error: any) {
			Alert.alert(t("tasks.errors.deniedTitle"), error.message || t("tasks.errors.deleteDenied"));
		}
	};

	const triggerRefresh = async () => {
		setIsRefreshing(true);
		await new Promise((resolve) => setTimeout(resolve, 600));
		setIsRefreshing(false);
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
		isRefreshing,
	};
}
