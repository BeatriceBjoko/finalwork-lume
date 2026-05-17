import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { useSession } from "../context";
import { deleteNoteFromDB, getNotesByDate, getNotesFeed, toggleImportantInDB } from "../services/firebase/notes.service";

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
	const [lastVisible, setLastVisible] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const [isTemplateMode, setIsTemplateMode] = useState(false);

	const [activeFilter, setActiveFilter] = useState("Alles");
	const [selectedDate, setSelectedDate] = useState<string | null>(null);

	const loadNotes = useCallback(
		async (isRefresh = false) => {
			if (!circleId) {
				setNotes(TEMPLATE_NOTES);
				setIsTemplateMode(true);
				setIsLoading(false);
				return;
			}

			if (isRefresh) {
				setIsRefreshing(true);
				setLastVisible(null);
				setHasMore(true);
			} else {
				setIsLoading(true);
			}

			try {
				if (activeFilter === "Datum" && selectedDate) {
					const data = await getNotesByDate(circleId, selectedDate);
					setNotes(data);
					setHasMore(false);
					setIsTemplateMode(false);
				} else {
					const currentLastVisible = isRefresh ? null : lastVisible;
					const { notes: newNotes, lastVisible: newLastVisible } = await getNotesFeed(circleId, currentLastVisible, 10);

					if (newNotes.length < 10) setHasMore(false);
					setLastVisible(newLastVisible);

					if (isRefresh && newNotes.length === 0) {
						setNotes(TEMPLATE_NOTES);
						setIsTemplateMode(true);
					} else if (isRefresh) {
						setNotes(newNotes);
						setIsTemplateMode(false);
					} else {
						setNotes((prev) => {
							const realPrev = prev.filter((n) => !n.id.startsWith("tmpl_"));
							const existingIds = new Set(realPrev.map((n) => n.id));
							const uniqueNewNotes = newNotes.filter((n) => !existingIds.has(n.id));
							return [...realPrev, ...uniqueNewNotes];
						});
						setIsTemplateMode(false);
					}
				}
			} catch (error) {
				console.error("Fout bij laden notities:", error);
			} finally {
				setIsLoading(false);
				setIsRefreshing(false);
			}
		},
		[circleId, lastVisible, activeFilter, selectedDate],
	);

	useEffect(() => {
		loadNotes(true);
	}, [circleId, activeFilter, selectedDate]);

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
		} catch (error) {
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
			setNotes((prev) => prev.filter((n) => n.id !== noteId));
		} catch (error: any) {
			Alert.alert("Geweigerd", error.message);
		}
	};

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
		loadMore: () => hasMore && !isLoading && loadNotes(),
		refresh: () => loadNotes(true),
		handleToggleImportant,
		handleDeleteNote,
	};
}
