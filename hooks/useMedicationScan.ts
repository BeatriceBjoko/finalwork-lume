import { collection, getDocs, query, where } from "firebase/firestore";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSession } from "../context";
import { db } from "../lib/firebase-config";
import { getMedicationDetails, logMedicationConfirmation, lookupFaggByCode } from "../services/firebase/medication.service";
import { MEDICATION, type MedicationDetails, type ScanOutcome } from "../services/firebase/medication.types";

export interface MedScanResult {
	outcome: ScanOutcome;
	medicationId: string | null;
	taskId: string | null;
	plannedName: string;
	plannedWhen: string;
	scannedName: string;
	scannedAt: string;
	row2Sub: string;
	scannedGtin: string | null;
	allowedUserIds: string[];
}

interface UseMedicationScanOptions {
	targetTaskId?: string | null;
}

const todayStr = () => {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const hhmmNow = () => {
	const d = new Date();
	return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
const minutesNow = () => {
	const d = new Date();
	return d.getHours() * 60 + d.getMinutes();
};
const toMinutes = (hhmm: string) => {
	const [h, m] = (hhmm ?? "0:0").split(":").map(Number);
	return (h || 0) * 60 + (m || 0);
};
const fmtWhen = (date: string, time: string) => {
	const [y, m, d] = date.split("-");
	return `${d}/${m}/${y} • ${time}`;
};
const normalize = (s: string) =>
	(s || "")
		.toLowerCase()
		.normalize("NFD")
		.replace(/[^a-z0-9 ]/g, "")
		.trim();
const mainToken = (name: string) => normalize(name).split(" ")[0] || "";

function extractCode(raw: string): string {
	const m = raw.match(/01(\d{14})/);
	if (m) return m[1];
	return raw.replace(/\D/g, "");
}

function medicineMatches(planned: MedicationDetails, scannedName: string, scannedIngredient: string | null, scannedGtin: string | null): boolean {
	if (planned.gtin && scannedGtin && planned.gtin.replace(/\D/g, "") === scannedGtin.replace(/\D/g, "")) return true;
	const token = mainToken(planned.medName);
	if (!token) return false;
	const hay = `${normalize(scannedName)} ${normalize(scannedIngredient || "")}`;
	return hay.includes(token);
}

export function useMedicationScan(options?: UseMedicationScanOptions) {
	const { t } = useTranslation();
	const targetTaskId = options?.targetTaskId ?? null;
	const { user, userData } = useSession();
	const circleId = userData?.careCircleId;

	const [result, setResult] = useState<MedScanResult | null>(null);
	const [busy, setBusy] = useState(false);
	const lockRef = useRef(false);

	const handleScan = useCallback(
		async (rawCode: string) => {
			if (lockRef.current || !circleId || !user) return;
			lockRef.current = true;
			setBusy(true);
			try {
				const code = extractCode(rawCode);
				const scanned = await lookupFaggByCode(code);
				const scannedName = scanned?.name ?? t("scan.unknownPackage");
				const scannedAt = hhmmNow();
				const today = todayStr();
				const nowM = minutesNow();

				const snap = await getDocs(query(collection(db, "careCircleTasks"), where("careCircleId", "==", circleId), where("isMedication", "==", true)));
				const slots = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

				// medicationId → details (permission-checked: returns null if not allowed)
				const medIds = Array.from(new Set(slots.map((s) => s.medicationId).filter(Boolean)));
				const entries = await Promise.all(medIds.map(async (id) => [id, await getMedicationDetails(id)] as const));
				const detailsMap = new Map(entries.filter(([, d]) => d).map(([id, d]) => [id, d as MedicationDetails]));

				if (targetTaskId) {
					const target = slots.find((s) => s.id === targetTaskId);
					if (target) {
						const d = detailsMap.get(target.medicationId) ?? null;
						const expectedName = d?.medName ?? "—";
						const plannedWhen = fmtWhen(target.date, target.time);
						const allowed = d?.allowedUserIds ?? [];
						const base = { medicationId: target.medicationId, taskId: target.id, plannedName: expectedName, plannedWhen, scannedName, scannedAt, scannedGtin: code, allowedUserIds: allowed };

						const matches = d ? medicineMatches(d, scannedName, scanned?.activeIngredient ?? null, scanned?.gtin ?? null) : false;
						if (!matches) {
							setResult({ ...base, outcome: "wrongMed", row2Sub: t("scan.wrongMed.row2Sub") });
							return;
						}
						if (target.date !== today) {
							setResult({ ...base, outcome: "wrongDay", row2Sub: t("scan.wrongDay.row2Sub") });
							return;
						}
						const diff = Math.abs(toMinutes(target.time) - nowM);
						if (diff > MEDICATION.timeWindowHours * 60) {
							const early = toMinutes(target.time) > nowM;
							setResult({ ...base, outcome: "wrongTime", row2Sub: early ? t("scan.wrongTime.early") : t("scan.wrongTime.late") });
							return;
						}
						const sameMed = slots.filter((s) => s.medicationId === target.medicationId && s.date === today);
						const total = sameMed.length;
						const done = sameMed.filter((s) => s.status === "Voltooid").length;
						const newDone = target.status === "Voltooid" ? done : done + 1;
						setResult({ ...base, outcome: "correct", row2Sub: t("scan.progress", { done: newDone, total }) });
						return;
					}
				}

				const matchMedIds = medIds.filter((id) => {
					const d = detailsMap.get(id);
					return d && medicineMatches(d, scannedName, scanned?.activeIngredient ?? null, scanned?.gtin ?? null);
				});

				if (matchMedIds.length === 0) {
					let plannedName = "—";
					let plannedWhen = "";
					let allowed: string[] = [];
					let refSlot: any = null;
					const todayMedIds = Array.from(new Set(slots.filter((s) => s.date === today).map((s) => s.medicationId)));
					if (todayMedIds.length === 1) {
						refSlot = slots.find((s) => s.date === today && s.medicationId === todayMedIds[0]) ?? null;
					}
					if (refSlot) {
						const d = detailsMap.get(refSlot.medicationId);
						if (d) {
							plannedName = d.medName;
							plannedWhen = fmtWhen(refSlot.date, refSlot.time);
							allowed = d.allowedUserIds;
						}
					}
					setResult({
						outcome: "wrongMed",
						medicationId: refSlot?.medicationId ?? null,
						taskId: refSlot?.id ?? null,
						plannedName,
						plannedWhen,
						scannedName,
						scannedAt,
						row2Sub: t("scan.wrongMed.row2Sub"),
						scannedGtin: code,
						allowedUserIds: allowed,
					});
					return;
				}

				const candidates = slots.filter((s) => matchMedIds.includes(s.medicationId));
				const todaySlots = candidates.filter((s) => s.date === today);

				if (todaySlots.length === 0) {
					const s = candidates[0];
					const d = detailsMap.get(s.medicationId)!;
					setResult({
						outcome: "wrongDay",
						medicationId: s.medicationId,
						taskId: s.id,
						plannedName: d.medName,
						plannedWhen: fmtWhen(s.date, s.time),
						scannedName,
						scannedAt,
						row2Sub: t("scan.wrongDay.row2Sub"),
						scannedGtin: code,
						allowedUserIds: d.allowedUserIds,
					});
					return;
				}

				todaySlots.sort((a, b) => Math.abs(toMinutes(a.time) - nowM) - Math.abs(toMinutes(b.time) - nowM));
				const slot = todaySlots.find((s) => s.status !== "Voltooid") ?? todaySlots[0];
				const d = detailsMap.get(slot.medicationId)!;
				const total = todaySlots.length;
				const done = todaySlots.filter((s) => s.status === "Voltooid").length;
				const diff = Math.abs(toMinutes(slot.time) - nowM);

				if (diff > MEDICATION.timeWindowHours * 60) {
					const early = toMinutes(slot.time) > nowM;
					setResult({
						outcome: "wrongTime",
						medicationId: slot.medicationId,
						taskId: slot.id,
						plannedName: d.medName,
						plannedWhen: fmtWhen(slot.date, slot.time),
						scannedName,
						scannedAt,
						row2Sub: early ? t("scan.wrongTime.early") : t("scan.wrongTime.late"),
						scannedGtin: code,
						allowedUserIds: d.allowedUserIds,
					});
					return;
				}

				const newDone = slot.status === "Voltooid" ? done : done + 1;
				setResult({
					outcome: "correct",
					medicationId: slot.medicationId,
					taskId: slot.id,
					plannedName: d.medName,
					plannedWhen: fmtWhen(slot.date, slot.time),
					scannedName,
					scannedAt,
					row2Sub: t("scan.progress", { done: newDone, total }),
					scannedGtin: code,
					allowedUserIds: d.allowedUserIds,
				});
			} catch (e) {
				console.error("[scan] error", e);
			} finally {
				setBusy(false);
			}
		},
		[circleId, user, targetTaskId, t],
	);

	const reset = useCallback(() => {
		setResult(null);
		lockRef.current = false;
	}, []);

	const confirm = useCallback(
		async (override: boolean) => {
			if (!result || !result.taskId || !result.medicationId || !user || !circleId) {
				reset();
				return;
			}
			await logMedicationConfirmation({
				circleId,
				medicationId: result.medicationId,
				taskId: result.taskId,
				confirmedBy: user.uid,
				confirmedByName: userData?.name ?? "",
				scannedGtin: result.scannedGtin,
				scannedName: result.scannedName,
				status: override ? "override" : "confirmed",
				mismatch: override && result.outcome !== "correct" ? result.outcome : null,
				allowedUserIds: result.allowedUserIds,
			});
			reset();
		},
		[result, user, circleId, userData, reset],
	);

	return { result, busy, handleScan, reset, confirm };
}
