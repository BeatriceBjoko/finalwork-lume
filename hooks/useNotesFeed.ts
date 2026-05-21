import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { useSession } from "../context";
import { deleteNoteFromDB, getNotesByDate, subscribeToNotesFeed, toggleImportantInDB } from "../services/firebase/notes.service";

const PAGE_SIZE = 10;

const TEMPLATE_NOTES = [
	{
		id: "tmpl_1",
		title: "Doktersbezoek",
		time: "10:30",
		content: "Dit is een voorbeeld van een notitie. Je kunt hier alles bijhouden rondom doktersbezoeken of observaties.",
		tag: "Medisch",
		icon: "hospital-building",
		isImportant: true,
		date: new Date().toISOString().split("T")[0],
		createdBy: "demo",
		author: { name: "Lume", initials: "LU" },
	},
	{
		id: "tmpl_2",
		title: "Wandeling in het park",
		time: "15:00",
		content: "De zon scheen en we hebben een prachtige wandeling gemaakt. Het deed enorm veel deugd!",
		tag: "Dagelijks",
		icon: "weather-sunny",
		isImportant: false,
		date: new Date().toISOString().split("T")[0],
		createdBy: "demo",
		author: { name: "Lume", initials: "LU" },
	},
];

export function useNotesFeed() {
	const { user, userData } = useSession();
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
			setNotes(TEMPLATE_NOTES);
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
					setNotes(TEMPLATE_NOTES);
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
	}, [circleId, activeFilter, selectedDate, feedLimit]);

	useEffect(() => {
		let filtered = notes;
		if (activeFilter === "Belangrijk") {
			filtered = notes.filter((n) => n.isImportant);
		}

		const grouped: any[] = [];
		let currentDate = "";

		const todayStr = new Date().toISOString().split("T")[0];
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		const yesterdayStr = yesterday.toISOString().split("T")[0];

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
			Alert.alert("Fout", "Kon status niet aanpassen.");
		}
	};

	const handleDeleteNote = async (noteId: string, creatorId: string) => {
		if (isTemplateMode) {
			setNotes((prev) => prev.filter((n) => n.id !== noteId));
			return;
		}
		try {
			await deleteNoteFromDB(noteId, creatorId, userData?.role || "member", user!.uid);
		} catch (error: any) {
			Alert.alert("Geweigerd", error.message);
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
