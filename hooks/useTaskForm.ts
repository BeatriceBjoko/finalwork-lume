import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSession } from "../context";
import { createMedicationTask, getMedicationDetails, updateMedicationTask } from "../services/firebase/medication.service";
import { MEDICATION, type FaggMedicine, type MedicationVisibility } from "../services/firebase/medication.types";
import { addTaskToDB, TaskInputData, updateTaskInDB } from "../services/firebase/tasks.service";
import { appAlert } from "../lib/appAlert";
import { getInitials } from "../lib/initials";

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
	// Live member list from the session: names and photos are always up to date
	const { user, userData, circleMembers: members, isCircleAdmin: isAdmin } = useSession();
	const circleId = userData?.careCircleId;

	const [title, setTitle] = useState("");
	const [startTime, setStartTime] = useState("09:00");
	const [endTime, setEndTime] = useState("10:00");
	const [selectedIcon, setSelectedIcon] = useState(TASK_ICONS[0].id);
	const [descriptionText, setDescriptionText] = useState("");

	const [selectedMember, setSelectedMember] = useState<any | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	const [isMedication, setIsMedication] = useState(false);
	const [medName, setMedName] = useState("");
	const [dose, setDose] = useState("");
	const [instructions, setInstructions] = useState("");
	const [times, setTimes] = useState<string[]>(["09:00"]);
	const [visibility, setVisibility] = useState<MedicationVisibility>(MEDICATION.defaultVisibility);
	const [allowedMemberIds, setAllowedMemberIds] = useState<string[]>([]);
	const [isLoadingMedication, setIsLoadingMedication] = useState(false);

	// scan-to-attach: codes captured from the box (enables exact GTIN matching)
	const [gtin, setGtin] = useState<string | null>(null);
	const [cnk, setCnk] = useState<string | null>(null);
	const [activeIngredient, setActiveIngredient] = useState<string | null>(null);
	const [atc, setAtc] = useState<string | null>(null);
	const [faggRef, setFaggRef] = useState<string | null>(null);
	const [scannedMedName, setScannedMedName] = useState<string | null>(null);


	const clearScannedMedicine = () => {
		setGtin(null);
		setCnk(null);
		setActiveIngredient(null);
		setAtc(null);
		setFaggRef(null);
		setScannedMedName(null);
	};

	// Editing a medication slot: fill the medication form from the PROTECTED record.
	// Never start from taskToEdit.title, which shows the real medicine name to admins.
	useEffect(() => {
		if (!visible || !taskToEdit?.isMedication || !taskToEdit.medicationId) return;
		let active = true;
		setIsMedication(true);
		setTitle(taskToEdit.neutralTitle || "");
		setTimes([String(taskToEdit.time ?? "09:00").split(" - ")[0]]);
		setMedName("");
		setDose("");
		setInstructions("");
		clearScannedMedicine();
		setIsLoadingMedication(true);
		getMedicationDetails(taskToEdit.medicationId)
			.then((d) => {
				if (!active) return;
				if (!d) {
					appAlert(t("tasks.errors.errorTitle"), t("tasks.medication.errors.noAccess"));
					onTaskSaved();
					return;
				}
				setMedName(d.medName || "");
				setDose(d.dose || "");
				setInstructions(d.instructions || "");
				setVisibility(d.visibility);
				setAllowedMemberIds(d.allowedUserIds || []);
				setGtin(d.gtin);
				setCnk(d.cnk);
				setActiveIngredient(d.activeIngredient);
				setAtc(d.atc);
				setFaggRef(d.faggRef);
				setScannedMedName(d.faggRef ? d.medName : null);
			})
			.finally(() => {
				if (active) setIsLoadingMedication(false);
			});
		return () => {
			active = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [visible, taskToEdit]);

	useEffect(() => {
		if (!visible) return;

		if (taskToEdit?.isMedication) {
			// handled by the medication effect above
		} else if (taskToEdit) {
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
			clearScannedMedicine();
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
			clearScannedMedicine();
		}
	}, [visible, taskToEdit]);

	useEffect(() => {
		if (!visible) return;
		if (taskToEdit?.assignee && members.length > 0) {
			const a = taskToEdit.assignee;
			const memberMatch = members.find((m) => (a.uid ? m.id === a.uid : m.name === a.name));
			if (memberMatch) setSelectedMember(memberMatch);
		}
	}, [visible, taskToEdit, members]);

	const addTime = (time: string) => setTimes((prev) => Array.from(new Set([...prev, time])).sort());
	const removeTime = (time: string) => setTimes((prev) => prev.filter((x) => x !== time));
	const toggleAllowedMember = (id: string) => setAllowedMemberIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

	// fill the form from a scanned FAGG medicine
	const applyScannedMedicine = (f: FaggMedicine) => {
		setMedName((prev) => (prev.trim() ? prev : f.name));
		setGtin(f.gtin ?? null);
		setCnk(f.cnk ?? null);
		setActiveIngredient(f.activeIngredient ?? null);
		setAtc(f.atc ?? null);
		setFaggRef(f.gtin ?? null);
		setScannedMedName(f.name);
	};

	// box scanned but not found in FAGG, still store the raw code for exact matching
	const attachRawCode = (code: string) => {
		setGtin(code);
		setFaggRef(null);
		setScannedMedName(null);
	};

	const handleSaveTask = async () => {
		if (!circleId || !user?.uid) {
			appAlert(t("tasks.errors.errorTitle"), t("tasks.errors.noCircle"));
			return;
		}

		if (isMedication) {
			if (!medName.trim()) {
				appAlert(t("tasks.errors.required"), t("tasks.medication.errors.noMedName"));
				return;
			}
			if (times.length === 0) {
				appAlert(t("tasks.errors.required"), t("tasks.medication.errors.noTimes"));
				return;
			}
			if (isLoadingMedication) return;
			setIsSaving(true);
			try {
				const medication = {
					circleId,
					adminId: user.uid,
					medName: medName.trim(),
					dose: dose.trim(),
					instructions: instructions.trim(),
					gtin,
					cnk,
					activeIngredient,
					atc,
					faggRef,
					times,
					visibility,
					allowedUserIds: visibility === "selected" ? allowedMemberIds : [],
					neutralTitle: title.trim() || t("tasks.medication.neutralPlaceholder"),
				};
				if (taskToEdit?.isMedication && taskToEdit.medicationId) {
					// Existing slot: keep its own date, update the protected record + this slot
					await updateMedicationTask({ ...medication, date: taskToEdit.date, taskId: taskToEdit.id, medicationId: taskToEdit.medicationId });
				} else {
					await createMedicationTask({ ...medication, date: selectedDateStr });
				}
				onTaskSaved();
			} catch (error) {
				console.error(error);
				appAlert(t("tasks.errors.errorTitle"), t("tasks.errors.saveFailed"));
			} finally {
				setIsSaving(false);
			}
			return;
		}

		if (!title.trim()) {
			appAlert(t("tasks.errors.required"), t("tasks.errors.noTitle"));
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
						uid: selectedMember.id,
						name: selectedMember.name,
						initials: getInitials(selectedMember.name),
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
			appAlert(t("tasks.errors.errorTitle"), t("tasks.errors.saveFailed"));
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
		isLoadingMedication,
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
		// scan-to-attach
		gtin,
		scannedMedName,
		applyScannedMedicine,
		attachRawCode,
		clearScannedMedicine,
	};
}
