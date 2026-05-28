const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

exports.onMedicationOverride = onDocumentCreated("medicationLogs/{logId}", async (event) => {
	const log = event.data && event.data.data();
	if (!log || log.status !== "override") return;

	const { careCircleId, confirmedBy, medicationId } = log;
	if (!careCircleId || !medicationId) return;

	const recipients = new Set();

	const membersSnap = await db.collection("careCircleMembers").where("careCircleId", "==", careCircleId).get();
	const allMemberIds = [];
	membersSnap.forEach((d) => {
		const m = d.data();
		allMemberIds.push(m.userId);
		if (m.role === "admin") recipients.add(m.userId);
	});

	const medSnap = await db.collection("medicationDetails").doc(medicationId).get();
	const med = medSnap.exists ? medSnap.data() : null;
	if (med) {
		if (med.visibility === "everyone") allMemberIds.forEach((id) => recipients.add(id));
		else if (med.visibility === "selected") (med.allowedUserIds || []).forEach((id) => recipients.add(id));
	}

	recipients.delete(confirmedBy); // don't notify the person who did it
	if (recipients.size === 0) return;

	const tokens = [];
	await Promise.all(
		[...recipients].map(async (uid) => {
			const u = await db.collection("users").doc(uid).get();
			const tok = u.exists ? u.data().pushToken : null;
			if (tok && String(tok).startsWith("ExponentPushToken")) tokens.push(tok);
		}),
	);
	if (tokens.length === 0) return;

	const medName = (med && med.medName) || "medicatie";
	const byName = log.confirmedByName || "Iemand";
	const messages = tokens.map((to) => ({
		to,
		sound: "default",
		title: "Medicatie buiten schema",
		body: `${byName} bevestigde ${medName} buiten het schema.`,
		data: { type: "medicationOverride", medicationId, taskId: log.taskId || null },
	}));

	for (let i = 0; i < messages.length; i += 100) {
		await fetch(EXPO_PUSH_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json", Accept: "application/json" },
			body: JSON.stringify(messages.slice(i, i + 100)),
		});
	}
});
