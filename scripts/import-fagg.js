/**
 * One-time import of the Belgian FAGG medicine list into Firestore.
 *
 * Keeps only COMMERCIALIZED rows that have a scannable code (GTIN or CNK),
 * and writes one lean document PER GTIN into `fagg_medicijnen`, using the
 * GTIN as the document id so a scan is an instant lookup.
 */
const admin = require("firebase-admin");
const csv = require("csvtojson");

// 1) Service-account key downloaded from the Firebase console
const serviceAccount = require("./serviceAccountKey.json");

const CSV_PATH = "C:/Users/Beatr/Downloads/Export-vergunde geneesmiddelen-menselijk gebruik-verpakkingsgrootte-20260523.csv";

const COLLECTION = "fagg_medicijnen";
const BATCH_SIZE = 450;

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// FMD codes look like """05055565781661""" — strip quotes/spaces, KEEP as string
// so the leading zero of the GTIN is never lost.
function clean(value) {
	if (value == null) return "";
	return String(value).replace(/"/g, "").trim();
}
function emptyToNull(value) {
	const c = clean(value);
	return c.length ? c : null;
}

async function run() {
	console.log("Reading CSV…");
	const rows = await csv({ delimiter: ";", trim: true }).fromFile(CSV_PATH);
	console.log(`Total rows in file: ${rows.length}`);

	// Build lean docs, de-duped by id (one document per GTIN)
	const byId = new Map();
	let skipped = 0;

	for (const r of rows) {
		const commercialized = clean(r["Gecommercialiseerd"]).toLowerCase() === "ja";
		const gtinRaw = clean(r["FMD Code"]);
		const cnk = clean(r["CNK Code"]);

		// a cell can hold several GTINs separated by ";" or "," → split them
		const gtins = gtinRaw
			? gtinRaw
					.split(/[;,]/)
					.map((g) => g.trim())
					.filter(Boolean)
			: [];

		// keep only real, scannable boxes
		if (!commercialized || (gtins.length === 0 && !cnk)) {
			skipped++;
			continue;
		}

		const fields = {
			cnk: cnk || null,
			name: clean(r["Benaming"]),
			activeIngredient: emptyToNull(r["Werkzaam bestanddeel"]),
			atc: emptyToNull(r["ATC code "] ?? r["ATC code"]),
			form: emptyToNull(r["Farmaceutische vorm"]),
			delivery: emptyToNull(r["Afleveringswijze"]),
			leafletUrl: emptyToNull(r["URL Bijsluiter NL"]),
		};

		if (gtins.length > 0) {
			// one document per GTIN → each scannable code maps to a medicine
			for (const g of gtins) byId.set(g, { gtin: g, ...fields });
		} else {
			// no GTIN, but a CNK exists → still importable, looked up by CNK
			byId.set(`cnk-${cnk}`, { gtin: null, ...fields });
		}
	}

	const entries = [...byId.entries()];
	console.log(`Skipped (not commercialized / no code): ${skipped}`);
	console.log(`Unique medicines to import: ${entries.length}`);

	let written = 0;
	for (let i = 0; i < entries.length; i += BATCH_SIZE) {
		const batch = db.batch();
		for (const [id, data] of entries.slice(i, i + BATCH_SIZE)) {
			batch.set(db.collection(COLLECTION).doc(id), data);
		}
		await batch.commit();
		written += Math.min(BATCH_SIZE, entries.length - i);
		console.log(`Imported ${written}/${entries.length}…`);
	}

	console.log("Done.");
	process.exit(0);
}

run().catch((err) => {
	console.error("Import failed:", err);
	process.exit(1);
});
