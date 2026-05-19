import * as Calendar from "expo-calendar";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Linking, Platform } from "react-native";

import { useSession } from "../context";
import { db } from "../lib/firebase-config";
import { deleteTaskFromDB, toggleTaskStatusInDB } from "../services/firebase/tasks.service";

export interface CalendarTask {
	id: string;
	title: string;
	time: string;
	date: string;
	status: "Voltooid" | "Nog te doen";
	icon: string;
	description?: string[];
	assignee?: { name: string; initials: string; photo: string | null };
	createdBy: string;
}

export type CalendarSyncStatus = "idle" | "syncing" | "success" | "error";

interface SyncResultState {
	visible: boolean;
	eventId: string;
	taskTitle: string;
	eventStartMs: number;
}

function formatDateKey(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

export function useCalendarFeed() {
	const { t } = useTranslation();
	const { user, userData } = useSession();
	const circleId = userData?.careCircleId;

	const [selectedDate, setSelectedDate] = useState<string>(() => formatDateKey(new Date()));
	const [currentMonth, setCurrentMonth] = useState<{ year: number; month: number }>(() => {
		const now = new Date();
		return { year: now.getFullYear(), month: now.getMonth() };
	});

	const [allTasks, setAllTasks] = useState<CalendarTask[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [syncStatus, setSyncStatus] = useState<CalendarSyncStatus>("idle");

	const [syncResult, setSyncResult] = useState<SyncResultState>({
		visible: false,
		eventId: "",
		taskTitle: "",
		eventStartMs: 0,
	});

	useEffect(() => {
		if (!circleId) {
			setAllTasks([]);
			setIsLoading(false);
			return;
		}

		setIsLoading(true);
		const q = query(collection(db, "careCircleTasks"), where("careCircleId", "==", circleId));

		const unsub = onSnapshot(
			q,
			(snapshot) => {
				const items: CalendarTask[] = snapshot.docs.map((doc) => ({
					id: doc.id,
					...(doc.data() as any),
				}));
				setAllTasks(items);
				setIsLoading(false);
			},
			(err) => {
				console.error("Calendar feed error:", err);
				setIsLoading(false);
			},
		);

		return () => unsub();
	}, [circleId]);

	const taskDaysInMonth = useMemo(() => {
		const prefix = `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, "0")}`;
		const set = new Set<string>();
		allTasks.forEach((task) => {
			if (task.date && task.date.startsWith(prefix)) set.add(task.date);
		});
		return set;
	}, [allTasks, currentMonth.year, currentMonth.month]);

	const tasksForSelectedDate = useMemo(() => allTasks.filter((t) => t.date === selectedDate).sort((a, b) => (a.time ?? "").localeCompare(b.time ?? "")), [allTasks, selectedDate]);

	const goToPreviousMonth = () => {
		setCurrentMonth((prev) => {
			const m = prev.month - 1;
			if (m < 0) return { year: prev.year - 1, month: 11 };
			return { ...prev, month: m };
		});
	};

	const goToNextMonth = () => {
		setCurrentMonth((prev) => {
			const m = prev.month + 1;
			if (m > 11) return { year: prev.year + 1, month: 0 };
			return { ...prev, month: m };
		});
	};

	const goToToday = () => {
		const now = new Date();
		setCurrentMonth({ year: now.getFullYear(), month: now.getMonth() });
		setSelectedDate(formatDateKey(now));
	};

	const isCurrentMonth = useMemo(() => {
		const now = new Date();
		return currentMonth.year === now.getFullYear() && currentMonth.month === now.getMonth();
	}, [currentMonth.year, currentMonth.month]);

	const exportToDeviceCalendar = async (task: CalendarTask) => {
		console.log("[Calendar] exportToDeviceCalendar called for:", task.title);
		setSyncStatus("syncing");
		try {
			const { status } = await Calendar.requestCalendarPermissionsAsync();
			console.log("[Calendar] Permission status:", status);

			if (status !== "granted") {
				setSyncStatus("error");
				Alert.alert(t("calendar.permission.title"), t("calendar.permission.message"));
				setTimeout(() => setSyncStatus("idle"), 2000);
				return;
			}

			const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
			const writable = calendars.filter((c) => c.allowsModifications);
			console.log("[Calendar] Writable calendars found:", writable.length);

			const defaultCal = writable.find((c) => (c as any).isPrimary) ?? writable[0];
			if (!defaultCal) {
				setSyncStatus("error");
				Alert.alert(t("calendar.errors.noCalendar"));
				setTimeout(() => setSyncStatus("idle"), 2000);
				return;
			}

			const [startStr, endStr] = (task.time ?? "09:00").includes(" - ") ? task.time.split(" - ") : [task.time, null];
			const [sH, sM] = (startStr ?? "09:00").split(":").map(Number);
			const [eH, eM] = endStr ? endStr.split(":").map(Number) : [(sH ?? 9) + 1, sM ?? 0];

			const [y, mo, d] = task.date.split("-").map(Number);
			const startDate = new Date(y, mo - 1, d, sH ?? 9, sM ?? 0);
			const endDate = new Date(y, mo - 1, d, eH, eM);

			const eventId = await Calendar.createEventAsync(defaultCal.id, {
				title: `Lume — ${task.title}`,
				startDate,
				endDate,
				notes: (task.description ?? []).join("\n"),
				timeZone: "Europe/Brussels",
				alarms: [{ relativeOffset: -15 }],
			});
			console.log("[Calendar] Event created with ID:", eventId);

			setSyncStatus("success");
			setSyncResult({
				visible: true,
				eventId,
				taskTitle: task.title,
				eventStartMs: startDate.getTime(),
			});
			setTimeout(() => setSyncStatus("idle"), 2500);
		} catch (err: any) {
			console.error("[Calendar] Error:", err);
			setSyncStatus("error");
			Alert.alert(t("calendar.errors.exportFailed"), err?.message ?? "Unknown error");
			setTimeout(() => setSyncStatus("idle"), 2500);
		}
	};

	const openSyncedEvent = async () => {
		const { eventStartMs } = syncResult;
		setSyncResult((prev) => ({ ...prev, visible: false }));
		try {
			if (Platform.OS === "ios") {
				const cocoaSeconds = Math.floor((eventStartMs - 978307200000) / 1000);
				await Linking.openURL(`calshow:${cocoaSeconds}`);
			} else {
				await Linking.openURL(`content://com.android.calendar/time/${eventStartMs}`);
			}
		} catch (err) {
			console.error("[Calendar] Failed to open calendar app:", err);
			try {
				if (Platform.OS === "ios") await Linking.openURL("calshow:");
			} catch {}
		}
	};

	const dismissSyncResult = () => {
		setSyncResult((prev) => ({ ...prev, visible: false }));
	};

	const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
		try {
			await toggleTaskStatusInDB(taskId, currentStatus);
		} catch (err) {
			Alert.alert(t("tasks.errors.errorTitle"), t("tasks.errors.statusFailed"));
		}
	};

	const handleDeleteTask = async (taskId: string, creatorId: string) => {
		if (!user) return;
		try {
			await deleteTaskFromDB(taskId, creatorId, userData?.role ?? "member", user.uid);
		} catch (err: any) {
			Alert.alert(t("tasks.errors.deniedTitle"), err.message ?? t("tasks.errors.deleteDenied"));
		}
	};

	return {
		selectedDate,
		setSelectedDate,
		currentMonth,
		goToPreviousMonth,
		goToNextMonth,
		goToToday,
		isCurrentMonth,
		tasksForSelectedDate,
		taskDaysInMonth,
		isLoading,
		syncStatus,
		syncResult,
		exportToDeviceCalendar,
		openSyncedEvent,
		dismissSyncResult,
		handleToggleTaskStatus,
		handleDeleteTask,
	};
}
