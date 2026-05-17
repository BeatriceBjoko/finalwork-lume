import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
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

export interface TaskInputData {
	title: string;
	timeStr: string;
	icon: string;
	description: string[];
	assignee: { name: string; initials: string; photo: string | null } | null;
	date: string;
}

export async function addTaskToDB(circleId: string, taskData: TaskInputData, creatorId: string): Promise<string> {
	const tasksRef = collection(db, "careCircleTasks");

	const newTask = {
		careCircleId: circleId,
		createdBy: creatorId,
		createdAt: new Date().toISOString(),
		title: taskData.title,
		time: taskData.timeStr,
		icon: taskData.icon,
		description: taskData.description,
		assignee: taskData.assignee,
		date: taskData.date,
		status: "Nog te doen",
	};

	const docRef = await addDoc(tasksRef, newTask);
	return docRef.id;
}

export async function updateTaskInDB(taskId: string, taskData: Partial<TaskInputData>): Promise<void> {
	const taskRef = doc(db, "careCircleTasks", taskId);

	await updateDoc(taskRef, {
		title: taskData.title,
		time: taskData.timeStr,
		icon: taskData.icon,
		description: taskData.description,
		assignee: taskData.assignee,
	});
}
