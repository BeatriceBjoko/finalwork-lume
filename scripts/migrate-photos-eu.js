/**
 * One-time migration of all photos from the default US bucket to the EU bucket (October 2026).
 *
 * 1. Copies every file from finalwork-lume.firebasestorage.app (US-EAST1) to finalwork-lume
 *    (EUROPE-WEST1), with the same path and metadata. The download token is part of the
 *    metadata, so the existing links keep working once their bucket name is changed.
 * 2. Rewrites every photo link in Firestore to point to the EU bucket.
 *
 * The old files are NOT deleted: check the app first, then empty the US bucket by hand.
 *
 * Dry run (only shows what would change):  node scripts/migrate-photos-eu.js
 * Copy and rewrite:                        node scripts/migrate-photos-eu.js --apply
 */
const admin = require("firebase-admin");

const APPLY = process.argv.includes("--apply");
const OLD_BUCKET = "finalwork-lume.firebasestorage.app";
const NEW_BUCKET = "finalwork-lume";
const COLLECTIONS = ["users", "careCircleMembers", "careCircles", "careCircleNotes", "careCircleTasks"];

// Service-account key downloaded from the Firebase console (gitignored)
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const storage = admin.storage();

async function copyFiles() {
	const [files] = await storage.bucket(OLD_BUCKET).getFiles();
	const target = storage.bucket(NEW_BUCKET);
	let copied = 0;
	for (const file of files) {
		if (file.name.endsWith("/")) continue; // folder placeholder
		const [exists] = await target.file(file.name).exists();
		if (exists) continue;
		console.log(`  copy ${file.name}`);
		if (APPLY) await file.copy(target.file(file.name));
		copied++;
	}
	return { total: files.length, copied };
}

// Changes the bucket name inside Storage links, in strings at any depth (arrays, maps)
function rewrite(value) {
	if (typeof value === "string") {
		return value.includes("storage.googleapis.com") ? value.split(`/${OLD_BUCKET}/`).join(`/${NEW_BUCKET}/`) : value;
	}
	if (Array.isArray(value)) return value.map(rewrite);
	if (value && typeof value === "object" && value.constructor === Object) {
		return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, rewrite(v)]));
	}
	return value; // Timestamp, null, number, ...
}

async function rewriteLinks() {
	let changed = 0;
	for (const name of COLLECTIONS) {
		const snap = await db.collection(name).get();
		for (const docSnap of snap.docs) {
			const update = {};
			for (const [field, value] of Object.entries(docSnap.data())) {
				const next = rewrite(value);
				if (JSON.stringify(next) !== JSON.stringify(value)) update[field] = next;
			}
			if (Object.keys(update).length === 0) continue;
			console.log(`  ${name}/${docSnap.id}: ${Object.keys(update).join(", ")}`);
			if (APPLY) await docSnap.ref.update(update);
			changed++;
		}
	}
	return changed;
}

(async () => {
	console.log(APPLY ? "APPLYING changes\n" : "DRY RUN (nothing is written; add --apply to write)\n");
	console.log("1. Copy photos to the EU bucket");
	const { total, copied } = await copyFiles();
	console.log(`   ${copied} of ${total} files ${APPLY ? "copied" : "to copy"}\n`);
	console.log("2. Rewrite photo links in Firestore");
	const changed = await rewriteLinks();
	console.log(`   ${changed} documents ${APPLY ? "updated" : "to update"}`);
})().catch((err) => {
	console.error(err);
	process.exit(1);
});
