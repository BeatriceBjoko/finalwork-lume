import { collection, doc, getDoc, getDocs, query, where, writeBatch } from "firebase/firestore";
import { db } from "../../lib/firebase-config";
import { MEDICATION, type FaggMedicine, type MedicationDetails, type MedicationMismatch, type MedicationVisibility } from "./medication.types";

// Create: medicine record (protected) + public task slots
export interface CreateMedicationTaskParams {
	circleId: string;
	adminId: string;
	medName: string;
	dose: string;
	instructions: string;
	gtin: string | null;
	cnk: string | null;
	activeIngredient: string | null;
	atc: string | null;
	faggRef: string | null;
	date: string;
	times: string[];
	visibility: MedicationVisibility;
	allowedUserIds: string[];
	neutralTitle?: string;
}

export async function createMedicationTask(p: CreateMedicationTaskParams): Promise<{ medicationId: string; taskIds: string[] }> {
	const batch = writeBatch(db);
	const now = new Date().toISOString();

	// 1) the PROTECTED medicine record (only the bouncer lets the right people read it)
	const medRef = doc(collection(db, "medicationDetails"));
	const medicationId = medRef.id;
	batch.set(medRef, {
		id: medicationId,
		careCircleId: p.circleId,
		createdBy: p.adminId,
		medName: p.medName,
		dose: p.dose,
		instructions: p.instructions,
		gtin: p.gtin,
		cnk: p.cnk,
		activeIngredient: p.activeIngredient,
		atc: p.atc,
		faggRef: p.faggRef,
		visibility: p.visibility,
		allowedUserIds: p.allowedUserIds,
		createdAt: now,
	});

	// 2) one PUBLIC task slot per time, neutral info only, NO medicine name
	const neutralTitle = p.neutralTitle?.trim() || MEDICATION.defaultNeutralTitle;
	const taskIds: string[] = [];
	for (const time of p.times) {
		const taskRef = doc(collection(db, "careCircleTasks"));
		taskIds.push(taskRef.id);
		batch.set(taskRef, {
			careCircleId: p.circleId,
			createdBy: p.adminId,
			createdAt: now,
			title: neutralTitle,
			time,
			date: p.date,
			icon: "pill",
			description: [], // never put medicine info on the public task
			assignee: null,
			status: "Nog te doen",
			isMedication: true,
			neutralTitle,
			medicationId, // pointer to the protected record
		});
	}

	await batch.commit();
	return { medicationId, taskIds };
}

// Read with permission check
// The Security Rule decides. If the user isn't allowed, the read is
// rejected → we return null → the UI safely shows the neutral label.
export async function getMedicationDetails(medicationId: string): Promise<MedicationDetails | null> {
	try {
		const snap = await getDoc(doc(db, "medicationDetails", medicationId));
		if (!snap.exists()) return null;
		return { id: snap.id, ...(snap.data() as Omit<MedicationDetails, "id">) };
	} catch {
		// permission-denied (unauthorized member) → treat as no access
		return null;
	}
}

// Look up a scanned code in the FAGG reference list
function digitsOnly(code: string): string {
	return code.replace(/\D/g, "");
}

export async function lookupFaggByCode(rawCode: string): Promise<FaggMedicine | null> {
	const digits = digitsOnly(rawCode);
	const padded = digits.padStart(14, "0"); // EAN-13 → GTIN-14 so it matches FAGG ids

	// 1) direct document-id lookup (fast path)
	for (const id of [padded, digits]) {
		const snap = await getDoc(doc(db, "fagg_medicijnen", id));
		if (snap.exists()) return snap.data() as FaggMedicine;
	}

	// 2) fallback: match on the CNK field
	const res = await getDocs(query(collection(db, "fagg_medicijnen"), where("cnk", "==", digits)));
	if (!res.empty) return res.docs[0].data() as FaggMedicine;

	return null;
}

// "X van Y voltooid vandaag" for one medicine
export async function getMedicationSlotProgress(circleId: string, medicationId: string, date: string): Promise<{ total: number; done: number }> {
	const res = await getDocs(query(collection(db, "careCircleTasks"), where("careCircleId", "==", circleId), where("medicationId", "==", medicationId), where("date", "==", date)));
	let done = 0;
	res.forEach((d) => {
		if (d.data().status === "Voltooid") done++;
	});
	return { total: res.size, done };
}

// Log a confirmation / override + mark the slot done
export interface LogConfirmationParams {
	circleId: string;
	medicationId: string;
	taskId: string;
	confirmedBy: string;
	confirmedByName: string;
	scannedGtin: string | null;
	scannedName: string | null;
	status: "confirmed" | "override";
	mismatch: MedicationMismatch | null;
	allowedUserIds: string[];
}

export async function logMedicationConfirmation(p: LogConfirmationParams): Promise<void> {
	const batch = writeBatch(db);

	// 1) audit-trail entry (override entries double as the authorized-only alert)
	const logRef = doc(collection(db, "medicationLogs"));
	batch.set(logRef, {
		id: logRef.id,
		careCircleId: p.circleId,
		medicationId: p.medicationId,
		taskId: p.taskId,
		scannedGtin: p.scannedGtin,
		scannedName: p.scannedName,
		scannedAt: new Date().toISOString(),
		confirmedBy: p.confirmedBy,
		confirmedByName: p.confirmedByName,
		status: p.status,
		mismatch: p.mismatch,
		allowedUserIds: p.allowedUserIds,
	});

	// 2) mark this slot as given (drives the live update + "X van Y")
	batch.update(doc(db, "careCircleTasks", p.taskId), { status: "Voltooid" });

	await batch.commit();
}
