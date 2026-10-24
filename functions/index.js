const crypto = require("node:crypto");
const { setGlobalOptions } = require("firebase-functions/v2");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");

setGlobalOptions({ region: "europe-west1" });

initializeApp();
const db = getFirestore();
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

// ─── Care circle membership (server-side only) ───────────────────────────────
// Circles, memberships and invite codes are created ONLY here. Firestore rules
// deny these writes from the app, so a modified client cannot make itself a
// member or an admin of someone else's circle.

const INVITE_CODE_LENGTH = 6;
// No 0/O and 1/I, so codes are easy to read aloud and type
const INVITE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const INVITE_CODE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Anti-guessing: at most 5 wrong codes per account per 15 minutes
const JOIN_MAX_FAILURES = 5;
const JOIN_WINDOW_MS = 15 * 60 * 1000;

const RELATION_KEYS = ["partner", "dochter", "zoon", "moeder", "vader", "zus", "broer", "kleindochter", "kleinzoon", "vriend_vriendin", "buur", "familielid", "vertrouwenspersoon", "vrijwilliger", "andere"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requireAuth(request) {
	if (!request.auth) throw new HttpsError("unauthenticated", "Je bent niet ingelogd.");
	return request.auth.uid;
}

function cleanText(value, field, maxLength, { required = true } = {}) {
	if (value == null || value === "") {
		if (required) throw new HttpsError("invalid-argument", `${field} ontbreekt.`);
		return "";
	}
	if (typeof value !== "string") throw new HttpsError("invalid-argument", `${field} is ongeldig.`);
	const trimmed = value.trim();
	if (required && !trimmed) throw new HttpsError("invalid-argument", `${field} ontbreekt.`);
	if (trimmed.length > maxLength) throw new HttpsError("invalid-argument", `${field} is te lang.`);
	return trimmed;
}

// Returns the text stored as relationshipToCareReceiver
function cleanRelation(relation, customRelation) {
	if (!RELATION_KEYS.includes(relation)) throw new HttpsError("invalid-argument", "Relatie is ongeldig.");
	if (relation !== "andere") return relation;
	return cleanText(customRelation, "Relatie", 40);
}

// Accepts "LUME-ABC234", "abc234" or "ABC 234" and returns "ABC234"
function normalizeInviteCode(raw) {
	if (typeof raw !== "string") throw new HttpsError("invalid-argument", "Code is ongeldig.");
	const code = raw
		.toUpperCase()
		.replace(/^LUME-?/, "")
		.replace(/[^A-Z0-9]/g, "");
	if (code.length !== INVITE_CODE_LENGTH) throw new HttpsError("invalid-argument", "Code is ongeldig.");
	return code;
}

function randomInviteCode() {
	let code = "";
	for (let i = 0; i < INVITE_CODE_LENGTH; i++) code += INVITE_CODE_ALPHABET[crypto.randomInt(INVITE_CODE_ALPHABET.length)];
	return code;
}

// Creates a fresh code for the circle, removes its previous one and returns { code, expiresAt }
async function issueInviteCode(circleId, createdBy) {
	const circleRef = db.collection("careCircles").doc(circleId);
	for (let attempt = 0; attempt < 5; attempt++) {
		const code = randomInviteCode();
		const expiresAt = Timestamp.fromMillis(Date.now() + INVITE_CODE_TTL_MS);
		try {
			await db.runTransaction(async (tx) => {
				const circleSnap = await tx.get(circleRef);
				const previous = circleSnap.get("inviteCode");
				tx.create(db.collection("inviteCodes").doc(code), { careCircleId: circleId, createdBy, createdAt: FieldValue.serverTimestamp(), expiresAt });
				if (previous && previous !== code) tx.delete(db.collection("inviteCodes").doc(previous));
				tx.update(circleRef, { inviteCode: code, inviteCodeExpiresAt: expiresAt });
			});
			return { code, expiresAt: expiresAt.toMillis() };
		} catch (err) {
			// ALREADY_EXISTS (6): this random code is taken, try another one
			if (err.code !== 6) throw err;
		}
	}
	throw new HttpsError("internal", "Kon geen uitnodigingscode maken.");
}

async function assertNotInCircle(uid) {
	const userSnap = await db.collection("users").doc(uid).get();
	if (userSnap.exists && userSnap.get("careCircleId")) {
		throw new HttpsError("failed-precondition", "Je bent al lid van een zorgkring.");
	}
}

// Throws when the account has too many recent wrong codes
async function assertJoinAllowed(uid) {
	const snap = await db.collection("joinAttempts").doc(uid).get();
	if (!snap.exists) return;
	const { failures = 0, windowStart } = snap.data();
	const inWindow = windowStart && Date.now() - windowStart.toMillis() < JOIN_WINDOW_MS;
	if (inWindow && failures >= JOIN_MAX_FAILURES) {
		throw new HttpsError("resource-exhausted", "Te veel pogingen. Probeer het later opnieuw.");
	}
}

async function recordJoinFailure(uid) {
	const ref = db.collection("joinAttempts").doc(uid);
	await db.runTransaction(async (tx) => {
		const snap = await tx.get(ref);
		const data = snap.exists ? snap.data() : null;
		const inWindow = data && data.windowStart && Date.now() - data.windowStart.toMillis() < JOIN_WINDOW_MS;
		tx.set(ref, inWindow ? { failures: (data.failures || 0) + 1, windowStart: data.windowStart } : { failures: 1, windowStart: Timestamp.now() });
	});
}

// Creates a circle with the caller as admin, plus its first invite code
exports.createCircle = onCall(async (request) => {
	const uid = requireAuth(request);
	const data = request.data || {};
	const circleName = cleanText(data.circleName, "Naam zorgkring", 60);
	const receiverName = cleanText(data.receiverName, "Naam zorgontvanger", 60);
	const relationship = cleanRelation(data.relation, data.customRelation);
	const invitees = Array.isArray(data.invitees) ? data.invitees : [];
	if (invitees.length > 20) throw new HttpsError("invalid-argument", "Te veel uitnodigingen.");
	const inviteeEmails = invitees.map((e) => cleanText(e, "E-mail", 254).toLowerCase());
	if (inviteeEmails.some((e) => !EMAIL_RE.test(e))) throw new HttpsError("invalid-argument", "Ongeldig e-mailadres.");

	await assertNotInCircle(uid);

	const circleRef = db.collection("careCircles").doc();
	const circleId = circleRef.id;
	const now = new Date().toISOString();
	const batch = db.batch();

	batch.set(circleRef, {
		id: circleId,
		name: circleName,
		careReceiver: { name: receiverName, photoUrl: "", dob: null, hobbies: "", address: "", medication: "", allergies: "", diagnoses: "", gpVisit: "" },
		createdBy: uid,
		createdAt: now,
	});
	batch.set(db.collection("careCircleMembers").doc(`${circleId}_${uid}`), {
		careCircleId: circleId,
		userId: uid,
		role: "admin",
		relationshipToCareReceiver: relationship,
		status: "active",
		joinedAt: now,
	});
	batch.set(db.collection("users").doc(uid), { careCircleId: circleId, onboardingCompleted: true }, { merge: true });
	await batch.commit();

	const { code, expiresAt } = await issueInviteCode(circleId, uid);

	// Record who was invited by e-mail (the app opens the mail client to send the code)
	if (inviteeEmails.length > 0) {
		const inviteBatch = db.batch();
		for (const email of inviteeEmails) {
			const ref = db.collection("careCircleInvites").doc();
			inviteBatch.set(ref, { id: ref.id, careCircleId: circleId, emailOrPhone: email, invitedBy: uid, roleOnJoin: "member", status: "pending", createdAt: now, expiresAt: new Date(expiresAt).toISOString() });
		}
		await inviteBatch.commit();
	}

	return { circleId, inviteCode: code, expiresAt };
});

// Returns the circle's current invite code (admins only); issues a new one when expired
exports.getInviteCode = onCall(async (request) => {
	const uid = requireAuth(request);
	const circleId = cleanText((request.data || {}).circleId, "Zorgkring", 128);

	const memberSnap = await db.collection("careCircleMembers").doc(`${circleId}_${uid}`).get();
	if (!memberSnap.exists || memberSnap.get("role") !== "admin") {
		throw new HttpsError("permission-denied", "Alleen een beheerder kan uitnodigen.");
	}

	const circleSnap = await db.collection("careCircles").doc(circleId).get();
	if (!circleSnap.exists) throw new HttpsError("not-found", "Zorgkring niet gevonden.");
	const code = circleSnap.get("inviteCode");
	const expiresAt = circleSnap.get("inviteCodeExpiresAt");
	const stillValid = code && expiresAt instanceof Timestamp && expiresAt.toMillis() > Date.now();
	if (stillValid) return { inviteCode: code, expiresAt: expiresAt.toMillis() };

	const fresh = await issueInviteCode(circleId, uid);
	return { inviteCode: fresh.code, expiresAt: fresh.expiresAt };
});

// Joins the circle that owns the invite code, always as "member"
exports.joinCircle = onCall(async (request) => {
	const uid = requireAuth(request);
	const data = request.data || {};
	const code = normalizeInviteCode(data.inviteCode);
	const relationship = cleanRelation(data.relation, data.customRelation);

	await assertJoinAllowed(uid);
	await assertNotInCircle(uid);

	const codeSnap = await db.collection("inviteCodes").doc(code).get();
	const expiresAt = codeSnap.exists ? codeSnap.get("expiresAt") : null;
	if (!codeSnap.exists || !(expiresAt instanceof Timestamp) || expiresAt.toMillis() <= Date.now()) {
		await recordJoinFailure(uid);
		// Same message for unknown and expired codes, so guesses learn nothing
		throw new HttpsError("not-found", "Geen zorgkring gevonden met deze code.");
	}

	const circleId = codeSnap.get("careCircleId");
	const now = new Date().toISOString();
	const batch = db.batch();
	batch.set(db.collection("careCircleMembers").doc(`${circleId}_${uid}`), {
		careCircleId: circleId,
		userId: uid,
		role: "member",
		relationshipToCareReceiver: relationship,
		status: "active",
		joinedAt: now,
	});
	batch.set(db.collection("users").doc(uid), { careCircleId: circleId, onboardingCompleted: true }, { merge: true });
	batch.delete(db.collection("joinAttempts").doc(uid));
	await batch.commit();

	return { circleId };
});

async function fetchTokens(uids) {
	const tokens = [];
	await Promise.all(
		uids.map(async (uid) => {
			const u = await db.collection("users").doc(uid).get();
			const tok = u.exists ? u.data().pushToken : null;
			if (tok && String(tok).startsWith("ExponentPushToken")) tokens.push(tok);
		}),
	);
	return tokens;
}

async function sendExpoPush(messages) {
	for (let i = 0; i < messages.length; i += 100) {
		await fetch(EXPO_PUSH_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json", Accept: "application/json" },
			body: JSON.stringify(messages.slice(i, i + 100)),
		});
	}
}

// Medication override → notify authorized members
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
	recipients.delete(confirmedBy);
	if (recipients.size === 0) return;

	const tokens = await fetchTokens([...recipients]);
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
	await sendExpoPush(messages);
});

// "Deel je status" SOS → notify the whole circle (except the author)
exports.onSosNote = onDocumentCreated("careCircleNotes/{noteId}", async (event) => {
	const note = event.data && event.data.data();
	if (!note) return;
	if (note.isImportant !== true || note.tag !== "feeling") return;

	const circleId = note.careCircleId;
	const authorUid = note.createdBy;
	if (!circleId) return;

	const membersSnap = await db.collection("careCircleMembers").where("careCircleId", "==", circleId).get();
	const recipients = [];
	membersSnap.forEach((d) => {
		const m = d.data();
		if (m.userId && m.userId !== authorUid) recipients.push(m.userId);
	});
	if (recipients.length === 0) return;

	const tokens = await fetchTokens(recipients);
	if (tokens.length === 0) return;

	const authorName = (note.author && note.author.name) || "Iemand";
	const body = (note.content || "").trim().slice(0, 140) || "wil iets met de kring delen.";
	const messages = tokens.map((to) => ({
		to,
		sound: "default",
		title: `💚 ${authorName} vraagt om steun`,
		body,
		data: { type: "sosNote", noteId: event.params.noteId, careCircleId: circleId },
	}));
	await sendExpoPush(messages);
});
