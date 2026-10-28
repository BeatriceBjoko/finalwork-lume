const crypto = require("node:crypto");
const { setGlobalOptions } = require("firebase-functions/v2");
const { onDocumentCreated, onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");

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

// The circle's current invite code lives in circlePrivate/{circleId}. Firestore rules
// do not allow the app to read that collection, not even for members.
function circlePrivateRef(circleId) {
	return db.collection("circlePrivate").doc(circleId);
}

// Creates a fresh code for the circle, removes its previous one and returns { code, expiresAt }
async function issueInviteCode(circleId, createdBy) {
	const circleRef = db.collection("careCircles").doc(circleId);
	const privateRef = circlePrivateRef(circleId);
	for (let attempt = 0; attempt < 5; attempt++) {
		const code = randomInviteCode();
		const expiresAt = Timestamp.fromMillis(Date.now() + INVITE_CODE_TTL_MS);
		try {
			await db.runTransaction(async (tx) => {
				const [circleSnap, privateSnap] = await Promise.all([tx.get(circleRef), tx.get(privateRef)]);
				// Older circles kept the code on the circle document itself
				const legacy = circleSnap.get("inviteCode");
				const previous = privateSnap.get("inviteCode") || legacy;
				tx.create(db.collection("inviteCodes").doc(code), { careCircleId: circleId, createdBy, createdAt: FieldValue.serverTimestamp(), expiresAt });
				if (previous && previous !== code) tx.delete(db.collection("inviteCodes").doc(previous));
				tx.set(privateRef, { inviteCode: code, inviteCodeExpiresAt: expiresAt });
				if (legacy !== undefined) tx.update(circleRef, { inviteCode: FieldValue.delete(), inviteCodeExpiresAt: FieldValue.delete() });
			});
			return { code, expiresAt: expiresAt.toMillis() };
		} catch (err) {
			// ALREADY_EXISTS (6): this random code is taken, try another one
			if (err.code !== 6) throw err;
		}
	}
	throw new HttpsError("internal", "Kon geen uitnodigingscode maken.");
}

// Throws when the user is already in a circle; returns the name and photo to copy onto the
// membership, so circle members never need to read each other's private users document
async function getProfileOutsideCircle(uid) {
	const userSnap = await db.collection("users").doc(uid).get();
	if (userSnap.exists && userSnap.get("careCircleId")) {
		throw new HttpsError("failed-precondition", "Je bent al lid van een zorgkring.");
	}
	return { name: (userSnap.exists && userSnap.get("name")) || "", photoUrl: (userSnap.exists && userSnap.get("photoUrl")) || null };
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

	const profile = await getProfileOutsideCircle(uid);

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
		name: profile.name,
		photoUrl: profile.photoUrl,
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

	const privateSnap = await circlePrivateRef(circleId).get();
	const code = privateSnap.get("inviteCode");
	const expiresAt = privateSnap.get("inviteCodeExpiresAt");
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
	const profile = await getProfileOutsideCircle(uid);

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
		name: profile.name,
		photoUrl: profile.photoUrl,
		relationshipToCareReceiver: relationship,
		status: "active",
		joinedAt: now,
	});
	batch.set(db.collection("users").doc(uid), { careCircleId: circleId, onboardingCompleted: true }, { merge: true });
	batch.delete(db.collection("joinAttempts").doc(uid));
	await batch.commit();

	return { circleId };
});

// Removes uid from allowedUserIds on every doc of the circle in this collection
// (circleId null: in every circle, used when an account is deleted)
async function revokeAllowedUser(collectionName, circleId, uid) {
	// Single-field query (no composite index needed); filter on the circle here
	const snap = await db.collection(collectionName).where("allowedUserIds", "array-contains", uid).get();
	const docs = circleId === null ? snap.docs : snap.docs.filter((d) => d.get("careCircleId") === circleId);
	for (let i = 0; i < docs.length; i += 400) {
		const batch = db.batch();
		for (const d of docs.slice(i, i + 400)) batch.update(d.ref, { allowedUserIds: FieldValue.arrayRemove(uid) });
		await batch.commit();
	}
	return docs.length;
}

// Removes a member from the circle (admins only). The member loses access to
// the circle and to every medication record they were allowed to see.
exports.removeMember = onCall(async (request) => {
	const uid = requireAuth(request);
	const data = request.data || {};
	const circleId = cleanText(data.circleId, "Zorgkring", 128);
	const memberUid = cleanText(data.userId, "Lid", 128);

	const callerSnap = await db.collection("careCircleMembers").doc(`${circleId}_${uid}`).get();
	if (!callerSnap.exists || callerSnap.get("role") !== "admin") {
		throw new HttpsError("permission-denied", "Alleen een beheerder kan leden verwijderen.");
	}
	if (memberUid === uid) {
		throw new HttpsError("failed-precondition", "Je kan jezelf niet verwijderen.");
	}

	const memberRef = db.collection("careCircleMembers").doc(`${circleId}_${memberUid}`);
	const userRef = db.collection("users").doc(memberUid);
	await db.runTransaction(async (tx) => {
		const [memberSnap, userSnap] = await Promise.all([tx.get(memberRef), tx.get(userRef)]);
		if (!memberSnap.exists) throw new HttpsError("not-found", "Deze persoon is geen lid van de zorgkring.");
		tx.delete(memberRef);
		// Only unlink the account if it points to this circle
		if (userSnap.exists && userSnap.get("careCircleId") === circleId) {
			tx.update(userRef, { careCircleId: FieldValue.delete() });
		}
	});

	await revokeAllowedUser("medicationDetails", circleId, memberUid);
	await revokeAllowedUser("medicationLogs", circleId, memberUid);

	return { removed: memberUid };
});

// ─── Account deletion (App Store 5.1.1(v), Google Play, GDPR art. 17) ───────────
// Removes everything that belongs to the user. Data that belongs to the circle (care
// receiver, medication schedule, other members' notes and tasks) stays when the circle
// continues. The function can safely be called again if it stops halfway; the login
// account is deleted last, so the user can always retry.

const RECENT_LOGIN_SECONDS = 5 * 60;

async function deleteRefs(refs) {
	if (refs.length === 0) return;
	const writer = db.bulkWriter();
	for (const ref of refs) writer.delete(ref);
	await writer.close();
}

async function deleteStoragePrefix(prefix) {
	try {
		await getStorage().bucket().deleteFiles({ prefix, force: true });
	} catch (err) {
		if (err.code !== 404) throw err;
	}
}

// The user was the only member: delete the circle with all its data and photos
async function deleteWholeCircle(circleId) {
	for (const name of ["careCircleTasks", "careCircleNotes", "medicationDetails", "medicationLogs", "careCircleInvites", "inviteCodes", "careCircleMembers"]) {
		const snap = await db.collection(name).where("careCircleId", "==", circleId).get();
		await deleteRefs(snap.docs.map((d) => d.ref));
	}
	await deleteRefs([db.collection("circlePrivate").doc(circleId), db.collection("careCircles").doc(circleId)]);
	await deleteStoragePrefix(`careCircles/${circleId}/`);
}

// The admin leaves but others stay: the new admin takes over the circle's own records
async function transferCircle(circleId, fromUid, toUid) {
	const writer = db.bulkWriter();
	writer.update(db.collection("careCircleMembers").doc(`${circleId}_${toUid}`), { role: "admin" });
	const circleRef = db.collection("careCircles").doc(circleId);
	if ((await circleRef.get()).get("createdBy") === fromUid) writer.update(circleRef, { createdBy: toUid });
	for (const name of ["medicationDetails", "careCircleTasks", "inviteCodes"]) {
		const snap = await db.collection(name).where("createdBy", "==", fromUid).get();
		for (const d of snap.docs) {
			if (d.get("careCircleId") !== circleId) continue;
			// Medication slots belong to the circle; the admin's normal tasks are deleted later
			if (name === "careCircleTasks" && d.get("isMedication") !== true) continue;
			writer.update(d.ref, { createdBy: toUid });
		}
	}
	await writer.close();
}

// Removes the user as assignee from the circle's tasks. Older tasks stored only the
// name and photo of the assignee (no uid), so those are matched on name.
async function unassignUser(circleId, uid, name) {
	const snap = await db.collection("careCircleTasks").where("careCircleId", "==", circleId).get();
	const writer = db.bulkWriter();
	for (const d of snap.docs) {
		const assignee = d.get("assignee");
		if (!assignee) continue;
		const isUser = assignee.uid ? assignee.uid === uid : !!name && assignee.name === name;
		if (isUser) writer.update(d.ref, { assignee: null });
	}
	await writer.close();
}

// Shown to the user before deleting: what will happen to their circle
async function planCircles(uid) {
	const memberships = await db.collection("careCircleMembers").where("userId", "==", uid).get();
	const plans = [];
	for (const m of memberships.docs) {
		const circleId = m.get("careCircleId");
		if (m.get("role") !== "admin") {
			plans.push({ circleId, outcome: "leave" });
			continue;
		}
		const others = (await db.collection("careCircleMembers").where("careCircleId", "==", circleId).get()).docs.filter((d) => d.get("userId") !== uid);
		if (others.length === 0) {
			plans.push({ circleId, outcome: "deleteCircle" });
			continue;
		}
		// An existing admin takes over; otherwise the member who joined earliest
		const byJoined = (a, b) => String(a.get("joinedAt") || "").localeCompare(String(b.get("joinedAt") || ""));
		const next = others.filter((d) => d.get("role") === "admin").sort(byJoined)[0] || others.sort(byJoined)[0];
		plans.push({ circleId, outcome: "transfer", newAdminUid: next.get("userId"), newAdminName: next.get("name") || "" });
	}
	return plans;
}

// What deleting the account would do, so the app can explain it before the user confirms
exports.getAccountDeletionPlan = onCall(async (request) => {
	const uid = requireAuth(request);
	const plans = await planCircles(uid);
	const plan = plans[0] || { outcome: "noCircle" };
	return { outcome: plan.outcome, newAdminName: plan.newAdminName || null };
});

exports.deleteAccount = onCall(async (request) => {
	const uid = requireAuth(request);

	// The app asks for the password right before deleting (re-authentication)
	const authTime = request.auth.token.auth_time;
	if (!authTime || Date.now() / 1000 - authTime > RECENT_LOGIN_SECONDS) {
		throw new HttpsError("failed-precondition", "Log opnieuw in om je account te verwijderen.", { reason: "requires-recent-login" });
	}

	const userSnap = await db.collection("users").doc(uid).get();
	const name = (userSnap.exists && userSnap.get("name")) || "";

	// 1. The circle: delete it (alone), hand it over (admin with others) or just leave it
	const plans = await planCircles(uid);
	for (const plan of plans) {
		if (plan.outcome === "deleteCircle") {
			await deleteWholeCircle(plan.circleId);
			continue;
		}
		if (plan.outcome === "transfer") await transferCircle(plan.circleId, uid, plan.newAdminUid);
		await unassignUser(plan.circleId, uid, name);
	}

	// 2. Everything the user wrote or created, in any circle
	const notes = await db.collection("careCircleNotes").where("createdBy", "==", uid).get();
	for (const n of notes.docs) await deleteStoragePrefix(`careCircles/${n.get("careCircleId")}/notes/${n.id}/`);
	await deleteRefs(notes.docs.map((d) => d.ref));

	for (const [collectionName, field] of [
		["careCircleTasks", "createdBy"],
		["medicationLogs", "confirmedBy"],
		["careCircleInvites", "invitedBy"],
		["careCircleMembers", "userId"],
	]) {
		const snap = await db.collection(collectionName).where(field, "==", uid).get();
		await deleteRefs(snap.docs.map((d) => d.ref));
	}

	// 3. Access lists that mention the user
	await revokeAllowedUser("medicationDetails", null, uid);
	await revokeAllowedUser("medicationLogs", null, uid);

	// 4. Profile photos (current folder and the older profilePhotos/ folder)
	await deleteStoragePrefix(`users/${uid}/`);
	await deleteStoragePrefix(`profilePhotos/${uid}_`);

	// 5. Profile, wrong-code counter and finally the login account itself
	await deleteRefs([db.collection("joinAttempts").doc(uid), db.collection("users").doc(uid)]);
	try {
		await getAuth().deleteUser(uid);
	} catch (err) {
		if (err.code !== "auth/user-not-found") throw err;
	}

	return { deleted: true };
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
	// Never send the same notification twice to one phone
	return [...new Set(tokens)];
}

// A push token belongs to one phone, so it may only be on one account. When a phone
// registers its token for a user, remove that token from any other account (for
// example someone who used this phone before and never logged out).
exports.onPushTokenChanged = onDocumentWritten("users/{uid}", async (event) => {
	const before = event.data && event.data.before.exists ? event.data.before.get("pushToken") : undefined;
	const after = event.data && event.data.after.exists ? event.data.after.get("pushToken") : undefined;
	if (!after || after === before) return;

	// Triggers can run late or out of order, so do not trust "this write is the newest":
	// the account that registered the token most recently keeps it, every other one loses it.
	const sameToken = await db.collection("users").where("pushToken", "==", after).get();
	if (sameToken.size < 2) return;

	// pushUpdatedAt is written by the app at registration; the uid breaks exact ties
	const registeredAt = (d) => `${d.get("pushUpdatedAt") || d.updateTime.toDate().toISOString()}|${d.id}`;
	const [newest, ...older] = [...sameToken.docs].sort((a, b) => registeredAt(b).localeCompare(registeredAt(a)));

	const batch = db.batch();
	for (const d of older) batch.update(d.ref, { pushToken: FieldValue.delete(), pushPlatform: FieldValue.delete(), pushUpdatedAt: FieldValue.delete() });
	await batch.commit();
	console.log(`Push token kept on ${newest.id}, removed from ${older.length} older account(s)`);
});

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

	// No medicine name in the push: it passes Expo, Apple/Google and shows on the lock screen
	const byName = log.confirmedByName || "Iemand";
	const messages = tokens.map((to) => ({
		to,
		sound: "default",
		title: "Medicatie buiten schema",
		body: `${byName} bevestigde een medicatie buiten het schema. Open Lume voor details.`,
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
	// No note text in the push: it passes Expo, Apple/Google and shows on the lock screen
	const messages = tokens.map((to) => ({
		to,
		sound: "default",
		title: `💚 ${authorName} vraagt om steun`,
		body: "Open Lume om het bericht te lezen.",
		data: { type: "sosNote", noteId: event.params.noteId, careCircleId: circleId },
	}));
	await sendExpoPush(messages);
});
