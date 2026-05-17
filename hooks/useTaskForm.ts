import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { useSession } from "../context";
import { getCircleMembers } from "../lib/firebase-service";
import { addTaskToDB, TaskInputData, updateTaskInDB } from "../services/firebase/tasks.service";

export const TASK_ICONS = [
	{ id: "pill", label: "Medicatie" },
	{ id: "food-fork-drink", label: "Maaltijd" },
	{ id: "flower-outline", label: "Therapie" },
	{ id: "clipboard-pulse-outline", label: "Medisch" },
	{ id: "shower", label: "Hygiëne" },
	{ id: "cart-outline", label: "Winkel" },
	{ id: "broom", label: "Kuisen" },
	{ id: "car", label: "Vervoer" },
];

export function useTaskForm(selectedDateStr: string, onTaskSaved: () => void, taskToEdit?: any) {
	const { t } = useTranslation();
	const { user, userData } = useSession();
	const circleId = userData?.careCircleId;

	const [title, setTitle] = useState("");
	const [startTime, setStartTime] = useState("09:00");
	const [endTime, setEndTime] = useState("10:00");
	const [selectedIcon, setSelectedIcon] = useState(TASK_ICONS[0].id);
	const [descriptionText, setDescriptionText] = useState("");

	const [members, setMembers] = useState<any[]>([]);
	const [selectedMember, setSelectedMember] = useState<any | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (circleId) {
			getCircleMembers(circleId).then(setMembers).catch(console.error);
		}
	}, [circleId]);

	useEffect(() => {
		if (taskToEdit) {
			setTitle(taskToEdit.title || "");

			if (taskToEdit.time && taskToEdit.time.includes(" - ")) {
				const times = taskToEdit.time.split(" - ");
				setStartTime(times[0]);
				setEndTime(times[1]);
			} else {
				setStartTime(taskToEdit.time || "09:00");
				setEndTime("10:00");
			}

			setSelectedIcon(taskToEdit.icon || TASK_ICONS[0].id);
			setDescriptionText(taskToEdit.description ? taskToEdit.description.join("\n") : "");
		} else {
			setTitle("");
			setStartTime("09:00");
			setEndTime("10:00");
			setSelectedIcon(TASK_ICONS[0].id);
			setDescriptionText("");
			setSelectedMember(null);
		}
	}, [taskToEdit]);

	useEffect(() => {
		if (taskToEdit?.assignee && members.length > 0) {
			const memberMatch = members.find((m) => m.name === taskToEdit.assignee.name);
			if (memberMatch) setSelectedMember(memberMatch);
		}
	}, [taskToEdit, members]);

	const handleSaveTask = async () => {
		if (!circleId || !user?.uid) {
			Alert.alert(t("tasks.errors.errorTitle"), t("tasks.errors.noCircle"));
			return;
		}
		if (!title.trim()) {
			Alert.alert(t("tasks.errors.required"), t("tasks.errors.noTitle"));
			return;
		}

		setIsSaving(true);
		try {
			const bullets = descriptionText
				.split("\n")
				.map((s) => s.trim())
				.filter((s) => s.length > 0);

			const assigneeData = selectedMember
				? {
						name: selectedMember.name,
						initials: selectedMember.name.substring(0, 2).toUpperCase(),
						photo: selectedMember.photoUrl || null,
					}
				: null;

			const taskData: TaskInputData = {
				title: title.trim(),
				timeStr: `${startTime} - ${endTime}`,
				icon: selectedIcon,
				description: bullets,
				assignee: assigneeData,
				date: selectedDateStr,
			};

			if (taskToEdit && taskToEdit.id && !taskToEdit.id.startsWith("tmpl_")) {
				await updateTaskInDB(taskToEdit.id, taskData);
			} else {
				await addTaskToDB(circleId, taskData, user.uid);
			}

			onTaskSaved();
		} catch (error) {
			console.error(error);
			Alert.alert(t("tasks.errors.errorTitle"), t("tasks.errors.saveFailed"));
		} finally {
			setIsSaving(false);
		}
	};

	return {
		title,
		setTitle,
		startTime,
		setStartTime,
		endTime,
		setEndTime,
		selectedIcon,
		setSelectedIcon,
		descriptionText,
		setDescriptionText,
		members,
		selectedMember,
		setSelectedMember,
		isSaving,
		handleSaveTask,
	};
}
