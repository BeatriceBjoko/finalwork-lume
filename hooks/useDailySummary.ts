import { useEffect, useState } from "react";
import { NoteData } from "../components/ui/NoteCard";
import { TaskData } from "../components/ui/TaskCard";
import { getDailyQuote } from "../constants/quotes";
import { useSession } from "../context";

const MOCK_TASKS: Omit<TaskData, "theme">[] = [
	{
		id: "1",
		title: "Ochtend vitals & medicatie",
		time: "08:00",
		status: "Voltooid",
		icon: "pill",
		description: ["Bloeddruk en hartslag controleren", "Ochtendmedicatie geven na het ontbijt", "Noteer als er iets ongewoon is"],
		assignee: { name: "Beatrice", initials: "BB", photo: "https://i.pravatar.cc/100?img=5" },
	},
	{ id: "2", title: "Tuintherapie", time: "09:00", status: "Nog te doen", icon: "flower-outline", description: ["Rustige wandeling in de tuin", "Let op vermoeidheid of duizeligheid", "Water meenemen"] },
	{ id: "3", title: "Voedzame lunch", time: "11:30", status: "Nog te doen", icon: "food-fork-drink", description: ["Lichte lunch met zalm, groenten en rijst klaarmaken", "Zorg voor een rustig eetmoment zonder haast"] },
	{
		id: "4",
		title: "Kinesitherapie – Controle na operatie",
		time: "15:30",
		status: "Voltooid",
		icon: "clipboard-pulse-outline",
		description: ["Opvolgafspraak bij UZ Brussel", "Kamer 402 – hoofdgebouw", "Vergeet je medische dossiers niet mee te nemen"],
		assignee: { name: "Beatrice", initials: "BB", photo: "https://i.pravatar.cc/100?img=5" },
	},
];

const MOCK_NOTE: NoteData = {
	id: "1",
	title: "Praktische info",
	time: "15:00",
	icon: "notebook-outline",
	tag: "Vandaag",
	content: "Nieuwe medicatie moet morgen nog opgehaald worden. Doktersbrief moet nog ingevuld worden. Boodschappen zijn bijna op en het verband moet vervangen worden om 18u.",
};

export function useDailySummary() {
	const { userData, user } = useSession();

	const [currentTime, setCurrentTime] = useState(new Date());

	const [tasks, setTasks] = useState(MOCK_TASKS.map((t, i) => ({ ...t, expanded: i === MOCK_TASKS.length - 1 })));
	const [note, setNote] = useState<NoteData | null>(MOCK_NOTE);

	const [isTemplateMode, setIsTemplateMode] = useState(true);

	useEffect(() => {
		const timer = setInterval(() => {
			setCurrentTime(new Date());
		}, 60000);
		return () => clearInterval(timer);
	}, []);

	const displayName = userData?.name || user?.displayName?.split(" ")[0] || "Beatrice";
	const formattedTime = currentTime.toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" });

	const day = currentTime.getDate().toString().padStart(2, "0");
	const month = (currentTime.getMonth() + 1).toString().padStart(2, "0");
	const formattedDate = `${day}.${month}`;

	const dayName = currentTime.toLocaleDateString("nl-BE", { weekday: "long" });
	const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);

	const dailyQuote = getDailyQuote(currentTime);

	const totalToday = tasks.length;
	const completed = tasks.filter((t) => t.status === "Voltooid").length;
	const open = tasks.filter((t) => t.status !== "Voltooid").length;

	const toggleTask = (id: string) => {
		setTasks(tasks.map((t) => (t.id === id ? { ...t, expanded: !t.expanded } : t)));
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
		toggleTask,
	};
}
