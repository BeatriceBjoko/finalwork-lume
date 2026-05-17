import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { NoteData } from "../components/ui/NoteCard";
import { getDailyQuote } from "../constants/quotes";
import { useSession } from "../context";
import { getDailyNote } from "../services/firebase/notes.service";
import { deleteTaskFromDB, getTasksForDate, toggleTaskStatusInDB } from "../services/firebase/tasks.service";

const TEMPLATE_TASKS = [
	{
		id: "tmpl_1",
		title: "Ochtend vitals & medicatie",
		time: "08:00",
		status: "Voltooid" as const,
		icon: "pill" as const,
		createdBy: "demo",
		description: ["Bloeddruk en hartslag controleren", "Ochtendmedicatie geven na het ontbijt"],
		assignee: { name: "Beatrice", initials: "BB", photo: "https://i.pravatar.cc/100?img=5" },
	},
	{ id: "tmpl_2", title: "Tuintherapie", time: "09:00", status: "Nog te doen" as const, icon: "flower-outline" as const, createdBy: "demo", description: ["Rustige wandeling in de tuin", "Water meenemen"] },
	{ id: "tmpl_3", title: "Voedzame lunch", time: "11:30", status: "Nog te doen" as const, icon: "food-fork-drink" as const, createdBy: "demo", description: ["Lichte lunch met zalm, groenten en rijst klaarmaken"] },
	{
		id: "tmpl_4",
		title: "Kinesitherapie – Controle na operatie",
		time: "15:30",
		status: "Voltooid" as const,
		icon: "clipboard-pulse-outline" as const,
		createdBy: "demo",
		expanded: true,
		description: ["Opvolgafspraak bij UZ Brussel"],
		assignee: { name: "Beatrice", initials: "BB", photo: "https://i.pravatar.cc/100?img=5" },
	},
];

export function useDailySummary() {
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
						title: "Schrijf je eerste herinnering!",
						time: "--:--",
						icon: "comment-plus-outline",
						tag: "Tip van Lume",
						content: "Er zijn vandaag nog geen observaties of notities gedeeld. Schrijf een kort berichtje over hoe de dag verloopt! Het geeft de hele zorgkring enorm veel rust. ♥",
					});
				} else {
					setNote({
						id: fetchedNote.id,
						title: fetchedNote.title,
						time: fetchedNote.time,
						icon: fetchedNote.icon || "notebook-outline",
						tag: fetchedNote.isImportant ? "Belangrijk" : "Notitie",
						content: fetchedNote.content,
					});
				}
			} catch (error) {
				console.error("Fout bij het inladen:", error);
			}
			military: {
				setIsLoading(false);
			}
		}

		loadFirebaseData();
	}, [circleId, databaseDateQueryString, refreshTrigger]);

	const displayName = userData?.name || user?.displayName?.split(" ")[0] || "Beatrice";
	const formattedTime = currentTime.toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" });
	const formattedDate = `${dayStr}.${monthStr}`;
	const dayName = currentTime.toLocaleDateString("nl-BE", { weekday: "long" });
	const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
	const dailyQuote = getDailyQuote(currentTime);

	const totalToday = tasks.length;
	const completed = tasks.filter((t) => t.status === "Voltooid").length;
	const open = tasks.filter((t) => t.status !== "Voltooid").length;

	const toggleTaskExpanded = (id: string) => {
		setTasks(tasks.map((t) => (t.id === id ? { ...t, expanded: !t.expanded } : t)));
	};

	const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
		if (isTemplateMode) {
			setTasks(tasks.map((t) => (t.id === taskId ? { ...t, status: currentStatus === "Voltooid" ? "Nog te doen" : "Voltooid" } : t)));
			return;
		}
		try {
			await toggleTaskStatusInDB(taskId, currentStatus);
			setTasks(tasks.map((t) => (t.id === taskId ? { ...t, status: currentStatus === "Voltooid" ? "Nog te doen" : "Voltooid" } : t)));
		} catch (error) {
			console.error(error);
		}
	};

	const handleTriggerDeleteTask = async (taskId: string, taskCreatorId: string) => {
		if (isTemplateMode) {
			setTasks(tasks.filter((t) => t.id !== taskId));
			return;
		}

		if (!currentUserId) return;

		try {
			await deleteTaskFromDB(taskId, taskCreatorId, userRole, currentUserId);

			setTasks(tasks.filter((t) => t.id !== taskId));
		} catch (error: any) {
			Alert.alert("Oei, actie geweigerd", error.message || "Je hebt geen rechten om deze taak te verwijderen.");
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
