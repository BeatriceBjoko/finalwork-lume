export type MedicationVisibility = "admin" | "selected" | "everyone";

export type MedicationMismatch = "wrongMed" | "wrongTime" | "wrongDay";

export type ScanOutcome = "correct" | "wrongMed" | "wrongTime" | "wrongDay";

/**
 * Extra fields added to an existing careCircleTasks doc when it's a
 * medication slot. PUBLIC — readable by every circle member (no medicine name).
 */
export interface MedicationTaskFields {
	isMedication: boolean;
	neutralTitle: string;
	medicationId: string | null;
}

/** PROTECTED medicine record, locked down by Firestore Security Rules. */
export interface MedicationDetails {
	id: string;
	careCircleId: string;
	createdBy: string;
	medName: string;
	dose: string;
	instructions: string;
	gtin: string | null; // scannable identifier (FMD/GTIN from FAGG)
	cnk: string | null; // backup identifier
	activeIngredient: string | null;
	atc: string | null;
	faggRef: string | null; // fagg_medicijnen doc id
	visibility: MedicationVisibility;
	allowedUserIds: string[]; // admin is always implicitly allowed
	createdAt: string;
}

/**
 * PROTECTED audit trail, one entry per confirmation/override.
 * Override entries double as the authorized-only "off-schedule" alert.
 */
export interface MedicationLog {
	id: string;
	careCircleId: string;
	medicationId: string;
	taskId: string;
	scannedGtin: string | null;
	scannedName: string | null;
	scannedAt: string;
	confirmedBy: string;
	confirmedByName: string;
	status: "confirmed" | "override";
	mismatch: MedicationMismatch | null;
}

/** One row of the imported Belgian FAGG reference database. */
export interface FaggMedicine {
	gtin: string; // Firestore doc id (instant lookup on scan)
	cnk: string | null;
	name: string;
	activeIngredient: string | null;
	atc: string | null;
	form: string | null;
	delivery: string | null;
	leafletUrl: string | null;
}

export const MEDICATION = {
	defaultNeutralTitle: "Medicatiemoment",
	timeWindowHours: 2,
	defaultVisibility: "selected" as MedicationVisibility,
} as const;
