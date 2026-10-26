/**
 * Tests for storage.rules, run against the local Storage + Firestore emulators.
 *
 *   npm run test:rules
 *
 * Cast: circle c1 with admin Alice and member Bob. Eve is admin of another circle (c2)
 * and plays the attacker. Membership is read from Firestore by the Storage rules.
 */
const fs = require("node:fs");
const path = require("node:path");
const { after, before, beforeEach, describe, test } = require("node:test");
const { assertFails, assertSucceeds, initializeTestEnvironment } = require("@firebase/rules-unit-testing");
const { doc, setDoc } = require("firebase/firestore");

const root = path.join(__dirname, "..");
const IMAGE = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4]);
const JPEG = { contentType: "image/jpeg" };

let env;

before(async () => {
	env = await initializeTestEnvironment({
		projectId: "demo-lume",
		firestore: { rules: fs.readFileSync(path.join(root, "firestore.rules"), "utf8") },
		storage: { rules: fs.readFileSync(path.join(root, "storage.rules"), "utf8") },
	});
});

after(async () => {
	await env.cleanup();
});

beforeEach(async () => {
	await env.clearFirestore();
	await env.clearStorage();
	await env.withSecurityRulesDisabled(async (ctx) => {
		const db = ctx.firestore();
		await setDoc(doc(db, "careCircleMembers/c1_alice"), { careCircleId: "c1", userId: "alice", role: "admin" });
		await setDoc(doc(db, "careCircleMembers/c1_bob"), { careCircleId: "c1", userId: "bob", role: "member" });
		await setDoc(doc(db, "careCircleMembers/c2_eve"), { careCircleId: "c2", userId: "eve", role: "admin" });
		const storage = ctx.storage();
		await storage.ref("careCircles/c1/notes/n1/photo_0.jpg").put(IMAGE, JPEG);
		await storage.ref("careCircles/c1/receiver/photo_1.jpg").put(IMAGE, JPEG);
		await storage.ref("users/bob/profile_1.jpg").put(IMAGE, JPEG);
	});
});

const as = (uid) => env.authenticatedContext(uid).storage();
const anonymous = () => env.unauthenticatedContext().storage();

describe("circle photos (careCircles/{circleId}/...)", () => {
	test("a member can view the circle's note photos", () => assertSucceeds(as("bob").ref("careCircles/c1/notes/n1/photo_0.jpg").getMetadata()));
	test("a member can list the circle's photos", () => assertSucceeds(as("bob").ref("careCircles/c1").listAll()));
	test("a stranger cannot view another circle's photos", () => assertFails(as("eve").ref("careCircles/c1/notes/n1/photo_0.jpg").getMetadata()));
	test("a stranger cannot list another circle's photos", () => assertFails(as("eve").ref("careCircles/c1").listAll()));
	test("logged-out users cannot view circle photos", () => assertFails(anonymous().ref("careCircles/c1/receiver/photo_1.jpg").getMetadata()));
	test("a member can upload a note photo", () => assertSucceeds(as("bob").ref("careCircles/c1/notes/n2/photo_0.jpg").put(IMAGE, JPEG)));
	test("the admin can upload the care receiver photo", () => assertSucceeds(as("alice").ref("careCircles/c1/receiver/photo_2.jpg").put(IMAGE, JPEG)));
	test("ATTACK: a stranger cannot upload into another circle", () => assertFails(as("eve").ref("careCircles/c1/notes/n2/photo_0.jpg").put(IMAGE, JPEG)));
	test("ATTACK: a stranger cannot overwrite another circle's photo", () => assertFails(as("eve").ref("careCircles/c1/receiver/photo_1.jpg").put(IMAGE, JPEG)));
	test("only images can be uploaded", () => assertFails(as("bob").ref("careCircles/c1/notes/n2/file.pdf").put(IMAGE, { contentType: "application/pdf" })));
	test("uploads without an image type are refused", () => assertFails(as("bob").ref("careCircles/c1/notes/n2/photo_0.jpg").put(IMAGE, { contentType: "application/octet-stream" })));
	test("images of 10 MB or more are refused", () => assertFails(as("bob").ref("careCircles/c1/notes/n2/big.jpg").put(new Uint8Array(10 * 1024 * 1024), JPEG)));
	test("photos cannot be deleted from the app, not even by the admin", () => assertFails(as("alice").ref("careCircles/c1/notes/n1/photo_0.jpg").delete()));
});

describe("profile photos (users/{userId}/...)", () => {
	test("you can upload your own profile photo", () => assertSucceeds(as("bob").ref("users/bob/profile_2.jpg").put(IMAGE, JPEG)));
	test("you can view your own profile photo", () => assertSucceeds(as("bob").ref("users/bob/profile_1.jpg").getMetadata()));
	test("ATTACK: you cannot replace someone else's profile photo", () => assertFails(as("eve").ref("users/bob/profile_1.jpg").put(IMAGE, JPEG)));
	test("you cannot browse someone else's profile photos", () => assertFails(as("eve").ref("users/bob").listAll()));
	test("a profile photo must be an image", () => assertFails(as("bob").ref("users/bob/profile_2.jpg").put(IMAGE, { contentType: "text/html" })));
});

describe("everything else is closed", () => {
	test("the old circles/ folder is closed for uploads", () => assertFails(as("alice").ref("circles/c1/receiver_profile.jpg").put(IMAGE, JPEG)));
	test("the old profilePhotos/ folder is closed for uploads", () => assertFails(as("bob").ref("profilePhotos/bob_1").put(IMAGE, JPEG)));
	test("nobody can upload to the root of the bucket", () => assertFails(as("bob").ref("anything.jpg").put(IMAGE, JPEG)));
	test("nobody can list the whole bucket", () => assertFails(as("alice").ref("").listAll()));
});
