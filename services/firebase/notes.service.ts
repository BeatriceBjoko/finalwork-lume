import { addDoc, collection, deleteDoc, doc, getDocs, limit, orderBy, query, startAfter, updateDoc, where } from "firebase/firestore";
import { db } from "../../lib/firebase-config";
import { uploadImageAsync } from "../../lib/firebase-service";

export interface NoteInputData {
	title: string;
	content: string;
	date: string;
	time: string;
	tag: string;
	icon: string;
	isImportant: boolean;
	localImages?: string[];
	existingImages?: string[];
	author?: {
		name: string;
		initials: string;
		photo: string | null;
	};
}

export async function getDailyNote(circleId: string, dateString: string): Promise<any | null> {
	const notesRef = collection(db, "careCircleNotes");
	const q = query(notesRef, where("careCircleId", "==", circleId), where("date", "==", dateString));
	const snapshot = await getDocs(q);
	if (snapshot.empty) return null;

	const notes: any[] = [];
	snapshot.forEach((docSnap) => notes.push({ id: docSnap.id, ...docSnap.data() }));

	const importantNote = notes.find((n) => n.isImportant === true);
	if (importantNote) return importantNote;
	return notes[0];
}

export async function getNotesByDate(circleId: string, dateString: string): Promise<any[]> {
	const notesRef = collection(db, "careCircleNotes");
	const q = query(notesRef, where("careCircleId", "==", circleId), where("date", "==", dateString), orderBy("createdAt", "desc"));
	const snapshot = await getDocs(q);
	return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function getNotesFeed(circleId: string, lastVisibleDoc: any = null, fetchLimit: number = 10): Promise<{ notes: any[]; lastVisible: any }> {
	const notesRef = collection(db, "careCircleNotes");
	let q;
	if (lastVisibleDoc) {
		q = query(notesRef, where("careCircleId", "==", circleId), orderBy("createdAt", "desc"), startAfter(lastVisibleDoc), limit(fetchLimit));
	} else {
		q = query(notesRef, where("careCircleId", "==", circleId), orderBy("createdAt", "desc"), limit(fetchLimit));
	}
	const snapshot = await getDocs(q);
	const notes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
	const lastVisible = snapshot.docs[snapshot.docs.length - 1];
	return { notes, lastVisible };
}

export async function addNoteToDB(circleId: string, noteData: NoteInputData, creatorId: string): Promise<string> {
	const notesRef = collection(db, "careCircleNotes");
	const newNoteDoc = doc(notesRef);
	const noteId = newNoteDoc.id;

	const uploadedImageUrls: string[] = [];
	if (noteData.localImages && noteData.localImages.length > 0) {
		for (let i = 0; i < noteData.localImages.length; i++) {
			const localUri = noteData.localImages[i];
			const imagePath = `careCircles/${circleId}/notes/${noteId}/photo_${i}_${Date.now()}.jpg`;
			const downloadUrl = await uploadImageAsync(localUri, imagePath);
			uploadedImageUrls.push(downloadUrl);
		}
	}

	const newNote = {
		careCircleId: circleId,
		createdBy: creatorId,
		createdAt: new Date().toISOString(),
		date: noteData.date,
		time: noteData.time,
		title: noteData.title,
		content: noteData.content,
		tag: noteData.tag,
		icon: noteData.icon,
		isImportant: noteData.isImportant,
		images: uploadedImageUrls,
		author: noteData.author || null,
	};

	await updateDoc(newNoteDoc, newNote).catch(async () => {
		await addDoc(notesRef, newNote);
	});

	return noteId;
}

export async function toggleImportantInDB(noteId: string, currentStatus: boolean): Promise<void> {
	const noteRef = doc(db, "careCircleNotes", noteId);
	await updateDoc(noteRef, { isImportant: !currentStatus });
}

export async function updateNoteInDB(circleId: string, noteId: string, noteData: Partial<NoteInputData>): Promise<void> {
	const noteRef = doc(db, "careCircleNotes", noteId);

	const uploadedImageUrls: string[] = [];
	if (noteData.localImages && noteData.localImages.length > 0) {
		for (let i = 0; i < noteData.localImages.length; i++) {
			const localUri = noteData.localImages[i];
			const imagePath = `careCircles/${circleId}/notes/${noteId}/photo_upd_${i}_${Date.now()}.jpg`;
			const downloadUrl = await uploadImageAsync(localUri, imagePath);
			uploadedImageUrls.push(downloadUrl);
		}
	}

	const finalImages = [...(noteData.existingImages || []), ...uploadedImageUrls];

	const updates: any = {};
	if (noteData.title !== undefined) updates.title = noteData.title;
	if (noteData.content !== undefined) updates.content = noteData.content;
	if (noteData.tag !== undefined) updates.tag = noteData.tag;
	if (noteData.icon !== undefined) updates.icon = noteData.icon;
	if (noteData.isImportant !== undefined) updates.isImportant = noteData.isImportant;
	if (noteData.existingImages !== undefined || noteData.localImages !== undefined) updates.images = finalImages;

	await updateDoc(noteRef, updates);
}

export async function deleteNoteFromDB(noteId: string, noteCreatorId: string, userRole: string, currentUserId: string): Promise<void> {
	if (userRole !== "admin" && currentUserId !== noteCreatorId) {
		throw new Error("Je hebt geen rechten om deze notitie te verwijderen.");
	}
	const noteRef = doc(db, "careCircleNotes", noteId);
	await deleteDoc(noteRef);
}
