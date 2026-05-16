import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase-config";

export async function getDailyNote(circleId: string, dateString: string): Promise<any | null> {
	const notesRef = collection(db, "careCircleNotes");
	const q = query(notesRef, where("careCircleId", "==", circleId), where("date", "==", dateString));

	const snapshot = await getDocs(q);

	if (snapshot.empty) {
		return null;
	}

	const notes: any[] = [];
	snapshot.forEach((docSnap) => {
		notes.push({ id: docSnap.id, ...docSnap.data() });
	});

	const importantNote = notes.find((n) => n.isImportant === true);
	if (importantNote) return importantNote;

	return notes[0];
}
