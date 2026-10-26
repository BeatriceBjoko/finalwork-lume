import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { db } from "../lib/firebase-config";
import i18n from "../locales/i18n";
import type { MedicationDetails } from "../services/firebase/medication.types";

export type MedDetailsMap = Record<string, MedicationDetails | null>;

const MAX_ATTEMPTS = 6;
const RETRY_MS = 500;

/**
 * Permission-checked medicine details for a set of medication slots, kept LIVE:
 * a changed dose or name shows immediately, and losing access hides the details
 * immediately. A refused read (no permission) is retried a few times, because right
 * after creating a medicine the read can briefly be refused; after that it stays null.
 */
export function useMedicationDetails(medicationIds: string[]): MedDetailsMap {
	const [map, setMap] = useState<MedDetailsMap>({});

	const key = useMemo(
		() =>
			Array.from(new Set(medicationIds.filter(Boolean)))
				.sort()
				.join("|"),
		[medicationIds],
	);

	useEffect(() => {
		const ids = key ? key.split("|") : [];
		if (ids.length === 0) return;
		let cancelled = false;
		const unsubscribers = new Map<string, () => void>();
		const timers: ReturnType<typeof setTimeout>[] = [];

		const listen = (id: string, attempt: number) => {
			const unsubscribe = onSnapshot(
				doc(db, "medicationDetails", id),
				(snap) => {
					const details = snap.exists() ? ({ id: snap.id, ...snap.data() } as MedicationDetails) : null;
					setMap((prev) => ({ ...prev, [id]: details }));
				},
				() => {
					// permission-denied (not allowed, or not yet) → retry, then treat as no access
					unsubscribers.delete(id);
					if (cancelled) return;
					if (attempt < MAX_ATTEMPTS) {
						timers.push(setTimeout(() => !cancelled && listen(id, attempt + 1), RETRY_MS));
					} else {
						setMap((prev) => ({ ...prev, [id]: null }));
					}
				},
			);
			unsubscribers.set(id, unsubscribe);
		};

		ids.forEach((id) => listen(id, 0));

		return () => {
			cancelled = true;
			timers.forEach(clearTimeout);
			unsubscribers.forEach((unsubscribe) => unsubscribe());
		};
	}, [key]);

	return map;
}

export function enrichMedicationTask<T extends { isMedication?: boolean; medicationId?: string | null; title: string; description?: string[] }>(task: T, details: MedDetailsMap): T & { locked?: boolean } {
	if (!task.isMedication || !task.medicationId) return task;
	const d = details[task.medicationId];
	if (!d) return { ...task, locked: true };
	const description = [d.dose ? i18n.t("tasks.medication.doseLine", { dose: d.dose }) : null, d.instructions || null].filter(Boolean) as string[];
	return { ...task, title: d.medName, description: description.length ? description : task.description, locked: false };
}
