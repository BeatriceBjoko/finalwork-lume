import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { useSession } from "../context";
import { getCircleMembers } from "../lib/firebase-service";
import { createMedicationTask } from "../services/firebase/medication.service";
import { MEDICATION, type MedicationVisibility } from "../services/firebase/medication.types";
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

export function useTaskForm(visible: boolean, selectedDateStr: string, onTaskSaved: () => void, taskToEdit?: any) {
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

	const [isMedication, setIsMedication] = useState(false);
	const [medName, setMedName] = useState("");
	const [dose, setDose] = useState("");
	const [instructions, setInstructions] = useState("");
	const [times, setTimes] = useState<string[]>(["09:00"]);
	const [visibility, setVisibility] = useState<MedicationVisibility>(MEDICATION.defaultVisibility);
	const [allowedMemberIds, setAllowedMemberIds] = useState<string[]>([]);

	const isAdmin = useMemo(() => members.some((m) => m.id === user?.uid && m.isAdmin), [members, user?.uid]);

	useEffect(() => {
		if (circleId) {
			getCircleMembers(circleId).then(setMembers).catch(console.error);
		}
	}, [circleId]);

	useEffect(() => {
		if (!visible) return;

		if (taskToEdit) {
			setTitle(taskToEdit.title || "");
			if (taskToEdit.time && taskToEdit.time.includes(" - ")) {
				const tms = taskToEdit.time.split(" - ");
				setStartTime(tms[0]);
				setEndTime(tms[1]);
			} else {
				setStartTime(taskToEdit.time || "09:00");
				setEndTime("10:00");
			}
			setSelectedIcon(taskToEdit.icon || TASK_ICONS[0].id);
			setDescriptionText(taskToEdit.description ? taskToEdit.description.join("\n") : "");
			setIsMedication(false);
		} else {
			setTitle("");
			setStartTime("09:00");
			setEndTime("10:00");
			setSelectedIcon(TASK_ICONS[0].id);
			setDescriptionText("");
			setSelectedMember(null);
			setIsMedication(false);
			setMedName("");
			setDose("");
			setInstructions("");
			setTimes(["09:00"]);
			setVisibility(MEDICATION.defaultVisibility);
			setAllowedMemberIds([]);
		}
	}, [visible, taskToEdit]);

	useEffect(() => {
		if (!visible) return;
		if (taskToEdit?.assignee && members.length > 0) {
			const memberMatch = members.find((m) => m.name === taskToEdit.assignee.name);
			if (memberMatch) setSelectedMember(memberMatch);
		}
	}, [visible, taskToEdit, members]);

	const addTime = (time: string) => setTimes((prev) => Array.from(new Set([...prev, time])).sort());
	const removeTime = (time: string) => setTimes((prev) => prev.filter((x) => x !== time));
	const toggleAllowedMember = (id: string) => setAllowedMemberIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

	const handleSaveTask = async () => {
		if (!circleId || !user?.uid) {
			Alert.alert(t("tasks.errors.errorTitle"), t("tasks.errors.noCircle"));
			return;
		}

		if (isMedication) {
			if (!medName.trim()) {
				Alert.alert(t("tasks.errors.required"), t("tasks.medication.errors.noMedName"));
				return;
			}
			if (times.length === 0) {
				Alert.alert(t("tasks.errors.required"), t("tasks.medication.errors.noTimes"));
				return;
			}
			setIsSaving(true);
			try {
				await createMedicationTask({
					circleId,
					adminId: user.uid,
					medName: medName.trim(),
					dose: dose.trim(),
					instructions: instructions.trim(),
					gtin: null,
					cnk: null,
					activeIngredient: null,
					atc: null,
					faggRef: null,
					date: selectedDateStr,
					times,
					visibility,
					allowedUserIds: visibility === "selected" ? allowedMemberIds : [],
					neutralTitle: title.trim() || MEDICATION.defaultNeutralTitle,
				});
				onTaskSaved();
			} catch (error) {
				console.error(error);
				Alert.alert(t("tasks.errors.errorTitle"), t("tasks.errors.saveFailed"));
			} finally {
				setIsSaving(false);
			}
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
		isAdmin,
		isMedication,
		setIsMedication,
		medName,
		setMedName,
		dose,
		setDose,
		instructions,
		setInstructions,
		times,
		addTime,
		removeTime,
		visibility,
		setVisibility,
		allowedMemberIds,
		toggleAllowedMember,
	};
}
