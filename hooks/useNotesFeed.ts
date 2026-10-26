import { useCallback, useEffect, useState } from "react";
import { useSession } from "../context";
import { deleteNoteFromDB, getNotesByDate, subscribeToNotesFeed, toggleImportantInDB } from "../services/firebase/notes.service";
import { appAlert } from "../lib/appAlert";
import { toDateKey } from "../lib/dates";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

const PAGE_SIZE = 10;

// Example notes shown while the circle has none yet, in the current language and with today's date
const buildTemplateNotes = (t: TFunction) => [
	{
		id: "tmpl_1",
		title: t("logbook.templates.note1Title"),
		time: "10:30",
		content: t("logbook.templates.note1Content"),
		tag: "Medisch",
		icon: "hospital-building",
		isImportant: true,
		date: toDateKey(),
		createdBy: "demo",
		author: { name: "Lume", initials: "LU" },
	},
	{
		id: "tmpl_2",
		title: t("logbook.templates.note2Title"),
		time: "15:00",
		content: t("logbook.templates.note2Content"),
		tag: "Dagelijks",
		icon: "weather-sunny",
		isImportant: false,
		date: toDateKey(),
		createdBy: "demo",
		author: { name: "Lume", initials: "LU" },
	},
];

export function useNotesFeed() {
	const { t } = useTranslation();
	const { user, userData, isCircleAdmin } = useSession();
	const circleId = userData?.careCircleId;

	const [notes, setNotes] = useState<any[]>([]);
	const [feedData, setFeedData] = useState<any[]>([]);
	const [feedLimit, setFeedLimit] = useState(PAGE_SIZE);
	const [isLoading, setIsLoading] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const [isTemplateMode, setIsTemplateMode] = useState(false);

	const [activeFilter, setActiveFilter] = useState("Alles");
	const [selectedDate, setSelectedDate] = useState<string | null>(null);

	useEffect(() => {
		if (!circleId) {
			setNotes(buildTemplateNotes(t));
			setIsTemplateMode(true);
			setIsLoading(false);
			return;
		}

		if (activeFilter === "Datum" && selectedDate) {
			setIsLoading(true);
			getNotesByDate(circleId, selectedDate)
				.then((data) => {
					setNotes(data);
					setHasMore(false);
					setIsTemplateMode(false);
				})
				.catch((e) => console.error("Fout bij laden notities:", e))
				.finally(() => {
					setIsLoading(false);
					setIsRefreshing(false);
				});
			return;
		}

		setIsLoading(true);
		const unsubscribe = subscribeToNotesFeed(
			circleId,
			feedLimit,
			(liveNotes) => {
				setHasMore(liveNotes.length >= feedLimit);
				if (liveNotes.length === 0) {
					setNotes(buildTemplateNotes(t));
					setIsTemplateMode(true);
				} else {
					setNotes(liveNotes);
					setIsTemplateMode(false);
				}
				setIsLoading(false);
				setIsRefreshing(false);
			},
			(e) => {
				console.error("Fout bij live notities:", e);
				setIsLoading(false);
				setIsRefreshing(false);
			},
		);

		return () => unsubscribe();
	}, [circleId, activeFilter, selectedDate, feedLimit, t]);

	useEffect(() => {
		let filtered = notes;
		if (activeFilter === "Belangrijk") {
			filtered = notes.filter((n) => n.isImportant);
		}

		const grouped: any[] = [];
		let currentDate = "";

		const todayStr = toDateKey();
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		const yesterdayStr = toDateKey(yesterday);

		filtered.forEach((note, index) => {
			if (note.date !== currentDate) {
				currentDate = note.date;
				let titleKey = currentDate;
				if (currentDate === todayStr) titleKey = "today";
				else if (currentDate === yesterdayStr) titleKey = "yesterday";

				grouped.push({ type: "header", titleKey, id: `header_${currentDate}_${index}` });
			}
			grouped.push({ type: "note", ...note });
		});

		setFeedData(grouped);
	}, [notes, activeFilter]);

	const handleToggleImportant = async (noteId: string, currentStatus: boolean) => {
		if (isTemplateMode) return;
		setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, isImportant: !currentStatus } : n)));
		try {
			await toggleImportantInDB(noteId, currentStatus);
		} catch {
			setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, isImportant: currentStatus } : n)));
			appAlert(t("errors.errorTitle"), t("logbook.alerts.importantFailed"));
		}
	};

	const handleDeleteNote = async (noteId: string, creatorId: string) => {
		if (isTemplateMode) {
			setNotes((prev) => prev.filter((n) => n.id !== noteId));
			return;
		}
		try {
			await deleteNoteFromDB(noteId, creatorId, isCircleAdmin ? "admin" : "member", user!.uid);
		} catch {
			appAlert(t("tasks.errors.deniedTitle"), t("logbook.alerts.deleteDenied"));
		}
	};

	const loadMore = useCallback(() => {
		if (hasMore && !isLoading && activeFilter !== "Datum") {
			setFeedLimit((prev) => prev + PAGE_SIZE);
		}
	}, [hasMore, isLoading, activeFilter]);

	const refresh = useCallback(() => {
		setIsRefreshing(true);
		setFeedLimit(PAGE_SIZE);
		setTimeout(() => setIsRefreshing(false), 500);
	}, []);

	return {
		feedData,
		isLoading,
		isRefreshing,
		hasMore,
		activeFilter,
		setActiveFilter,
		selectedDate,
		setSelectedDate,
		isTemplateMode,
		loadMore,
		refresh,
		handleToggleImportant,
		handleDeleteNote,
	};
}
