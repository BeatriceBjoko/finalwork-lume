import { collection, deleteDoc, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { db } from "../../lib/firebase-config";

export async function getTasksForDate(circleId: string, dateString: string): Promise<any[]> {
	const tasksRef = collection(db, "careCircleTasks");
	const q = query(tasksRef, where("careCircleId", "==", circleId), where("date", "==", dateString));

	const snapshot = await getDocs(q);
	const tasks: any[] = [];

	snapshot.forEach((docSnap) => {
		tasks.push({ id: docSnap.id, ...docSnap.data() });
	});

	return tasks.sort((a, b) => a.time.localeCompare(b.time));
}

export async function toggleTaskStatusInDB(taskId: string, currentStatus: string): Promise<void> {
	const newStatus = currentStatus === "Voltooid" ? "Nog te doen" : "Voltooid";
	const taskRef = doc(db, "careCircleTasks", taskId);

	await updateDoc(taskRef, {
		status: newStatus,
	});
}

export async function deleteTaskFromDB(taskId: string, taskCreatorId: string, userRole: string, currentUserId: string): Promise<void> {
	if (userRole !== "admin" && currentUserId !== taskCreatorId) {
		throw new Error("Je hebt geen rechten om deze taak te verwijderen.");
	}

	const taskRef = doc(db, "careCircleTasks", taskId);
	await deleteDoc(taskRef);
}
