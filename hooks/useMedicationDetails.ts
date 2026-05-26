import { useEffect, useMemo, useRef, useState } from "react";
import { getMedicationDetails } from "../services/firebase/medication.service";
import type { MedicationDetails } from "../services/firebase/medication.types";

export type MedDetailsMap = Record<string, MedicationDetails | null>;

const MAX_ATTEMPTS = 6;
const RETRY_MS = 500;

/**
 * Permission-checked medicine details for a set of medication slots.
 */
export function useMedicationDetails(medicationIds: string[]): MedDetailsMap {
	const [map, setMap] = useState<MedDetailsMap>({});
	const resolvedRef = useRef<Set<string>>(new Set());

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

		const load = async (id: string, attempt: number) => {
			const d = await getMedicationDetails(id);
			if (cancelled) return;
			if (d) {
				resolvedRef.current.add(id);
				setMap((prev) => ({ ...prev, [id]: d }));
			} else if (attempt < MAX_ATTEMPTS) {
				setTimeout(() => {
					if (!cancelled) load(id, attempt + 1);
				}, RETRY_MS);
			} else {
				resolvedRef.current.add(id);
				setMap((prev) => ({ ...prev, [id]: null }));
			}
		};

		ids.forEach((id) => {
			if (!resolvedRef.current.has(id)) load(id, 0);
		});

		return () => {
			cancelled = true;
		};
	}, [key]);

	return map;
}

export function enrichMedicationTask<T extends { isMedication?: boolean; medicationId?: string | null; title: string; description?: string[] }>(task: T, details: MedDetailsMap): T & { locked?: boolean } {
	if (!task.isMedication || !task.medicationId) return task;
	const d = details[task.medicationId];
	if (!d) return { ...task, locked: true };
	const description = [d.dose ? `Dosis: ${d.dose}` : null, d.instructions || null].filter(Boolean) as string[];
	return { ...task, title: d.medName, description: description.length ? description : task.description, locked: false };
}
