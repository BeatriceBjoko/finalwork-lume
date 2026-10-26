/**
 * One-time migration for the stricter Firestore rules (October 2026).
 *
 * 1. Copies name + photo from users/{uid} onto every careCircleMembers doc that
 *    has no name yet. Members read each other's name from the membership, because
 *    users documents (e-mail, push token) become private.
 * 2. Moves the current invite code from careCircles/{id} to circlePrivate/{id},
 *    which the app cannot read.
 *
 * Dry run (only shows what would change):  node scripts/migrate-security.js
 * Write the changes:                       node scripts/migrate-security.js --apply
 */
const admin = require("firebase-admin");

const APPLY = process.argv.includes("--apply");

if (process.env.FIRESTORE_EMULATOR_HOST) {
	admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT || "demo-lume" });
} else {
	// Service-account key downloaded from the Firebase console (gitignored)
	const serviceAccount = require("./serviceAccountKey.json");
	admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();
const { FieldValue, Timestamp } = admin.firestore;

async function backfillMemberProfiles() {
	const members = await db.collection("careCircleMembers").get();
	let changed = 0;
	for (const m of members.docs) {
		const data = m.data();
		if (data.name) continue;
		const userSnap = await db.collection("users").doc(data.userId).get();
		const user = userSnap.exists ? userSnap.data() : {};
		const update = { name: user.name || "", photoUrl: data.photoUrl || user.photoUrl || null };
		console.log(`  member ${m.id}: name="${update.name}" photo=${update.photoUrl ? "yes" : "no"}`);
		if (APPLY) await m.ref.update(update);
		changed++;
	}
	return changed;
}

async function moveInviteCodes() {
	const circles = await db.collection("careCircles").get();
	let changed = 0;
	for (const c of circles.docs) {
		const { inviteCode, inviteCodeExpiresAt } = c.data();
		if (inviteCode === undefined && inviteCodeExpiresAt === undefined) continue;
		// Only codes made by the Cloud Functions (with an expiry) are still valid
		const valid = typeof inviteCode === "string" && inviteCodeExpiresAt instanceof Timestamp;
		console.log(`  circle ${c.id}: ${valid ? `move code ${inviteCode} to circlePrivate` : `remove old code ${inviteCode}`}`);
		if (APPLY) {
			const batch = db.batch();
			if (valid) batch.set(db.collection("circlePrivate").doc(c.id), { inviteCode, inviteCodeExpiresAt });
			batch.update(c.ref, { inviteCode: FieldValue.delete(), inviteCodeExpiresAt: FieldValue.delete() });
			await batch.commit();
		}
		changed++;
	}
	return changed;
}

(async () => {
	console.log(APPLY ? "APPLYING changes\n" : "DRY RUN (nothing is written, add --apply to write)\n");
	console.log("Memberships without name/photo:");
	const members = await backfillMemberProfiles();
	console.log("\nCircles with an invite code on the circle document:");
	const circles = await moveInviteCodes();
	console.log(`\n${members} membership(s) and ${circles} circle(s) ${APPLY ? "updated" : "would be updated"}.`);
	process.exit(0);
})().catch((err) => {
	console.error("Migration failed:", err);
	process.exit(1);
});
