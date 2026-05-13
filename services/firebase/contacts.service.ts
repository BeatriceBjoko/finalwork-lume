import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase-config";

export async function getImportantContactsFromDB(circleId: string): Promise<any[]> {
	const circleRef = doc(db, "careCircles", circleId);
	const snap = await getDoc(circleRef);
	if (snap.exists() && snap.data().importantContacts) {
		return snap.data().importantContacts;
	}
	return [];
}

export async function saveImportantContactsToDB(circleId: string, contacts: any[]): Promise<void> {
	const circleRef = doc(db, "careCircles", circleId);
	await updateDoc(circleRef, {
		importantContacts: contacts,
	});
}
