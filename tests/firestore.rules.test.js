/**
 * Tests for firestore.rules, run against the local Firestore emulator.
 *
 *   npm run test:rules
 *
 * Cast: circle c1 with admin Alice and members Bob and Carl.
 * Eve is admin of another circle (c2) and plays the attacker.
 */
const fs = require("node:fs");
const path = require("node:path");
const { after, before, beforeEach, describe, test } = require("node:test");
const { assertFails, assertSucceeds, initializeTestEnvironment } = require("@firebase/rules-unit-testing");
const { collection, deleteDoc, deleteField, doc, getDoc, getDocs, query, setDoc, updateDoc, where } = require("firebase/firestore");

let env;

const userDoc = (uid, circleId) => ({ uid, email: `${uid}@test.be`, name: uid, language: "nl", role: "mantelzorger", onboardingCompleted: true, careCircleId: circleId, pushToken: `ExponentPushToken[${uid}]` });
const member = (circleId, uid, role) => ({ careCircleId: circleId, userId: uid, role, name: uid, photoUrl: null, relationshipToCareReceiver: "zoon", status: "active" });

before(async () => {
	env = await initializeTestEnvironment({
		projectId: "demo-lume",
		firestore: { rules: fs.readFileSync(path.join(__dirname, "..", "firestore.rules"), "utf8") },
	});
});

after(async () => {
	await env.cleanup();
});

beforeEach(async () => {
	await env.clearFirestore();
	await env.withSecurityRulesDisabled(async (ctx) => {
		const db = ctx.firestore();
		const seed = {
			"users/alice": userDoc("alice", "c1"),
			"users/bob": userDoc("bob", "c1"),
			"users/carl": userDoc("carl", "c1"),
			"users/eve": userDoc("eve", "c2"),
			"careCircles/c1": { id: "c1", name: "Zorg voor oma", createdBy: "alice", careReceiver: { name: "Oma", diagnoses: "Diabetes", allergies: "Penicilline" } },
			"careCircles/c2": { id: "c2", name: "Andere kring", createdBy: "eve", careReceiver: { name: "Opa" } },
			"careCircleMembers/c1_alice": member("c1", "alice", "admin"),
			"careCircleMembers/c1_bob": member("c1", "bob", "member"),
			"careCircleMembers/c1_carl": member("c1", "carl", "member"),
			"careCircleMembers/c2_eve": member("c2", "eve", "admin"),
			"careCircleTasks/t1": { careCircleId: "c1", createdBy: "bob", title: "Boodschappen", status: "Nog te doen", date: "2026-10-26" },
			"careCircleTasks/med1": { careCircleId: "c1", createdBy: "alice", title: "Medicatiemoment", status: "Nog te doen", date: "2026-10-26", isMedication: true, medicationId: "mSelected" },
			"careCircleNotes/n1": { careCircleId: "c1", createdBy: "bob", title: "Dokter", content: "Alles goed", isImportant: false, images: [] },
			"medicationDetails/mSelected": { careCircleId: "c1", createdBy: "alice", medName: "Metformine", visibility: "selected", allowedUserIds: ["bob"] },
			"medicationDetails/mAdmin": { careCircleId: "c1", createdBy: "alice", medName: "Oxazepam", visibility: "admin", allowedUserIds: [] },
			"medicationDetails/mEveryone": { careCircleId: "c1", createdBy: "alice", medName: "Paracetamol", visibility: "everyone", allowedUserIds: [] },
			"medicationLogs/l1": { careCircleId: "c1", medicationId: "mSelected", confirmedBy: "bob", status: "confirmed", allowedUserIds: ["bob"] },
			"inviteCodes/ABC234": { careCircleId: "c1" },
			"circlePrivate/c1": { inviteCode: "ABC234" },
			"joinAttempts/eve": { failures: 5 },
			"careCircleInvites/i1": { careCircleId: "c1", emailOrPhone: "tante@test.be" },
			"fagg_medicijnen/05411234567890": { name: "Dafalgan 1 g", cnk: "1234567" },
		};
		for (const [p, data] of Object.entries(seed)) await setDoc(doc(db, p), data);
	});
});

const as = (uid) => env.authenticatedContext(uid, { email: `${uid}@test.be` }).firestore();
const anonymous = () => env.unauthenticatedContext().firestore();

describe("users (private profiles)", () => {
	test("you can read your own profile", () => assertSucceeds(getDoc(doc(as("alice"), "users/alice"))));
	test("a circle member cannot read another member's profile (e-mail, push token)", () => assertFails(getDoc(doc(as("bob"), "users/alice"))));
	test("logged-out users cannot read profiles", () => assertFails(getDoc(doc(anonymous(), "users/alice"))));
	test("you can change your own name, photo and language", () => assertSucceeds(updateDoc(doc(as("alice"), "users/alice"), { name: "Alice B", photoUrl: "https://x.test/a.jpg", language: "fr" })));
	test("you can save your own push token", () => assertSucceeds(setDoc(doc(as("alice"), "users/alice"), { pushToken: "ExponentPushToken[new]", pushPlatform: "ios", pushUpdatedAt: "now" }, { merge: true })));
	test("you can remove your own push token when logging out", () =>
		assertSucceeds(updateDoc(doc(as("alice"), "users/alice"), { pushToken: deleteField(), pushPlatform: deleteField(), pushUpdatedAt: deleteField() })));
	test("you cannot remove someone else's push token", () => assertFails(updateDoc(doc(as("eve"), "users/bob"), { pushToken: deleteField() })));
	test("you cannot move yourself into another circle", () => assertFails(updateDoc(doc(as("alice"), "users/alice"), { careCircleId: "c2" })));
	test("you cannot change your role", () => assertFails(updateDoc(doc(as("alice"), "users/alice"), { role: "admin" })));
	test("you cannot edit someone else's profile", () => assertFails(updateDoc(doc(as("eve"), "users/bob"), { name: "Hacked" })));
	test("a new user can create their own profile at sign-up", () =>
		assertSucceeds(setDoc(doc(as("frank"), "users/frank"), { uid: "frank", email: "frank@test.be", name: "Frank", language: "nl", createdAt: "now", role: "mantelzorger", onboardingCompleted: false })));
	test("a new user cannot sign up straight into a circle", () =>
		assertFails(setDoc(doc(as("frank"), "users/frank"), { uid: "frank", email: "frank@test.be", name: "Frank", language: "nl", createdAt: "now", role: "mantelzorger", onboardingCompleted: false, careCircleId: "c1" })));
	test("you cannot create a profile for someone else", () =>
		assertFails(setDoc(doc(as("frank"), "users/zoe"), { uid: "zoe", email: "frank@test.be", name: "Zoe", language: "nl", createdAt: "now", role: "mantelzorger", onboardingCompleted: false })));
});

describe("careCircles", () => {
	test("a member can read their circle (care receiver profile)", () => assertSucceeds(getDoc(doc(as("bob"), "careCircles/c1"))));
	test("a stranger cannot read another circle's medical info", () => assertFails(getDoc(doc(as("eve"), "careCircles/c1"))));
	test("nobody can list all circles", () => assertFails(getDocs(collection(as("eve"), "careCircles"))));
	test("a member can edit the care receiver profile", () => assertSucceeds(updateDoc(doc(as("bob"), "careCircles/c1"), { careReceiver: { name: "Oma Marie", diagnoses: "Diabetes type 2" } })));
	test("a member can save the important contacts", () => assertSucceeds(updateDoc(doc(as("bob"), "careCircles/c1"), { importantContacts: [{ id: "1", name: "Dr. Peeters", phone: "0470" }] })));
	test("a member cannot take over the circle (createdBy)", () => assertFails(updateDoc(doc(as("bob"), "careCircles/c1"), { createdBy: "bob" })));
	test("a member cannot plant an invite code on the circle", () => assertFails(updateDoc(doc(as("alice"), "careCircles/c1"), { inviteCode: "HACK22" })));
	test("circles cannot be created from the app", () => assertFails(setDoc(doc(as("frank"), "careCircles/new"), { createdBy: "frank", careReceiver: {} })));
	test("circles cannot be deleted from the app, not even by the admin", () => assertFails(deleteDoc(doc(as("alice"), "careCircles/c1"))));
});

describe("careCircleMembers", () => {
	test("a member can see who is in their circle", () => assertSucceeds(getDocs(query(collection(as("bob"), "careCircleMembers"), where("careCircleId", "==", "c1")))));
	test("you can read your own membership", () => assertSucceeds(getDoc(doc(as("bob"), "careCircleMembers/c1_bob"))));
	test("a stranger cannot see the members of another circle", () => assertFails(getDocs(query(collection(as("eve"), "careCircleMembers"), where("careCircleId", "==", "c1")))));
	test("nobody can list all memberships", () => assertFails(getDocs(collection(as("eve"), "careCircleMembers"))));
	test("ATTACK: a stranger cannot make themselves admin of another circle", () => assertFails(setDoc(doc(as("eve"), "careCircleMembers/c1_eve"), member("c1", "eve", "admin"))));
	test("ATTACK: a stranger cannot even join as member without a code", () => assertFails(setDoc(doc(as("eve"), "careCircleMembers/c1_eve"), member("c1", "eve", "member"))));
	test("ATTACK: a member cannot promote themselves to admin", () => assertFails(updateDoc(doc(as("bob"), "careCircleMembers/c1_bob"), { role: "admin" })));
	test("you can update your own name, photo and relation", () => assertSucceeds(updateDoc(doc(as("bob"), "careCircleMembers/c1_bob"), { name: "Bob J", photoUrl: "https://x.test/b.jpg", relationshipToCareReceiver: "kleinzoon" })));
	test("you cannot edit another member's membership", () => assertFails(updateDoc(doc(as("bob"), "careCircleMembers/c1_carl"), { name: "Hacked" })));
	test("memberships cannot be deleted from the app (removeMember function only)", () => assertFails(deleteDoc(doc(as("alice"), "careCircleMembers/c1_bob"))));
});

describe("careCircleTasks", () => {
	test("a member can load the circle's tasks", () => assertSucceeds(getDocs(query(collection(as("carl"), "careCircleTasks"), where("careCircleId", "==", "c1")))));
	test("a stranger cannot load another circle's tasks", () => assertFails(getDocs(query(collection(as("eve"), "careCircleTasks"), where("careCircleId", "==", "c1")))));
	test("a member can add a task", () => assertSucceeds(setDoc(doc(as("bob"), "careCircleTasks/new"), { careCircleId: "c1", createdBy: "bob", title: "Wandelen", status: "Nog te doen" })));
	test("you cannot add a task in someone else's name", () => assertFails(setDoc(doc(as("bob"), "careCircleTasks/new"), { careCircleId: "c1", createdBy: "carl", title: "Wandelen", status: "Nog te doen" })));
	test("a stranger cannot add tasks to another circle", () => assertFails(setDoc(doc(as("eve"), "careCircleTasks/new"), { careCircleId: "c1", createdBy: "eve", title: "Spam", status: "Nog te doen" })));
	test("a member cannot create a medication slot", () => assertFails(setDoc(doc(as("bob"), "careCircleTasks/new"), { careCircleId: "c1", createdBy: "bob", title: "Medicatiemoment", status: "Nog te doen", isMedication: true })));
	test("an admin can create a medication slot", () => assertSucceeds(setDoc(doc(as("alice"), "careCircleTasks/new"), { careCircleId: "c1", createdBy: "alice", title: "Medicatiemoment", status: "Nog te doen", isMedication: true, medicationId: "mAdmin" })));
	test("any member can tick off someone else's task", () => assertSucceeds(updateDoc(doc(as("carl"), "careCircleTasks/t1"), { status: "Voltooid" })));
	test("a member cannot edit someone else's task", () => assertFails(updateDoc(doc(as("carl"), "careCircleTasks/t1"), { title: "Gewijzigd" })));
	test("the admin can edit any task", () => assertSucceeds(updateDoc(doc(as("alice"), "careCircleTasks/t1"), { title: "Gewijzigd" })));
	test("a task cannot be moved to another circle", () => assertFails(updateDoc(doc(as("bob"), "careCircleTasks/t1"), { careCircleId: "c2" })));
	test("a medication slot cannot be turned into a normal task", () => assertFails(updateDoc(doc(as("alice"), "careCircleTasks/med1"), { isMedication: false })));
	test("a member cannot delete someone else's task", () => assertFails(deleteDoc(doc(as("carl"), "careCircleTasks/t1"))));
	test("the creator can delete their own task", () => assertSucceeds(deleteDoc(doc(as("bob"), "careCircleTasks/t1"))));
	test("the admin can delete any task", () => assertSucceeds(deleteDoc(doc(as("alice"), "careCircleTasks/t1"))));
});

describe("careCircleNotes", () => {
	test("a member can read the logbook", () => assertSucceeds(getDocs(query(collection(as("carl"), "careCircleNotes"), where("careCircleId", "==", "c1")))));
	test("a stranger cannot read another circle's logbook", () => assertFails(getDoc(doc(as("eve"), "careCircleNotes/n1"))));
	test("a member can write a note with up to 3 photos", () =>
		assertSucceeds(setDoc(doc(as("carl"), "careCircleNotes/new"), { careCircleId: "c1", createdBy: "carl", title: "Slaap", content: "Goed geslapen", isImportant: false, images: ["a", "b", "c"] })));
	test("a note cannot have more than 3 photos", () =>
		assertFails(setDoc(doc(as("carl"), "careCircleNotes/new"), { careCircleId: "c1", createdBy: "carl", title: "Slaap", content: "x", isImportant: false, images: ["a", "b", "c", "d"] })));
	test("any member can mark a note as important", () => assertSucceeds(updateDoc(doc(as("carl"), "careCircleNotes/n1"), { isImportant: true })));
	test("a member cannot rewrite someone else's note", () => assertFails(updateDoc(doc(as("carl"), "careCircleNotes/n1"), { content: "Gewijzigd" })));
	test("the creator can edit their note", () => assertSucceeds(updateDoc(doc(as("bob"), "careCircleNotes/n1"), { content: "Toch niet goed" })));
	test("the admin can delete any note", () => assertSucceeds(deleteDoc(doc(as("alice"), "careCircleNotes/n1"))));
	test("a member cannot delete someone else's note", () => assertFails(deleteDoc(doc(as("carl"), "careCircleNotes/n1"))));
});

describe("medicationDetails (privacy-first)", () => {
	test("a selected member can read the medicine", () => assertSucceeds(getDoc(doc(as("bob"), "medicationDetails/mSelected"))));
	test("a member who is not selected cannot read it", () => assertFails(getDoc(doc(as("carl"), "medicationDetails/mSelected"))));
	test("every member can read 'everyone' medication", () => assertSucceeds(getDoc(doc(as("carl"), "medicationDetails/mEveryone"))));
	test("members cannot read 'admin only' medication", () => assertFails(getDoc(doc(as("bob"), "medicationDetails/mAdmin"))));
	test("the admin can read all medication", () => assertSucceeds(getDoc(doc(as("alice"), "medicationDetails/mAdmin"))));
	test("a stranger cannot read 'everyone' medication of another circle", () => assertFails(getDoc(doc(as("eve"), "medicationDetails/mEveryone"))));
	test("REMOVED MEMBER: loses access even if still listed in allowedUserIds", async () => {
		await env.withSecurityRulesDisabled((ctx) => deleteDoc(doc(ctx.firestore(), "careCircleMembers/c1_bob")));
		await assertFails(getDoc(doc(as("bob"), "medicationDetails/mSelected")));
	});
	test("a member cannot add medication", () => assertFails(setDoc(doc(as("bob"), "medicationDetails/new"), { careCircleId: "c1", createdBy: "bob", visibility: "everyone", allowedUserIds: [] })));
	test("the admin can add medication", () => assertSucceeds(setDoc(doc(as("alice"), "medicationDetails/new"), { careCircleId: "c1", createdBy: "alice", medName: "Ibuprofen", visibility: "selected", allowedUserIds: ["carl"] })));
	test("ATTACK: a member cannot add themselves to allowedUserIds", () => assertFails(updateDoc(doc(as("carl"), "medicationDetails/mSelected"), { allowedUserIds: ["bob", "carl"] })));
	test("medication cannot be moved to another circle", () => assertFails(updateDoc(doc(as("alice"), "medicationDetails/mSelected"), { careCircleId: "c2" })));
	test("the admin of another circle cannot read or change this medication", () => assertFails(updateDoc(doc(as("eve"), "medicationDetails/mSelected"), { visibility: "everyone" })));
});

describe("medicationLogs (audit trail)", () => {
	test("the person who confirmed can read the log", () => assertSucceeds(getDoc(doc(as("bob"), "medicationLogs/l1"))));
	test("a member who is not allowed cannot read the log", () => assertFails(getDoc(doc(as("carl"), "medicationLogs/l1"))));
	test("the admin can read the log", () => assertSucceeds(getDoc(doc(as("alice"), "medicationLogs/l1"))));
	test("a member can log their own confirmation", () =>
		assertSucceeds(setDoc(doc(as("carl"), "medicationLogs/new"), { careCircleId: "c1", medicationId: "mEveryone", confirmedBy: "carl", status: "confirmed", allowedUserIds: [] })));
	test("you cannot log a confirmation in someone else's name", () =>
		assertFails(setDoc(doc(as("carl"), "medicationLogs/new"), { careCircleId: "c1", medicationId: "mEveryone", confirmedBy: "bob", status: "confirmed", allowedUserIds: [] })));
	test("the audit trail cannot be changed", () => assertFails(updateDoc(doc(as("bob"), "medicationLogs/l1"), { status: "override" })));
	test("the audit trail cannot be deleted, not even by the admin", () => assertFails(deleteDoc(doc(as("alice"), "medicationLogs/l1"))));
});

describe("server-only collections", () => {
	test("invite codes cannot be read from the app", () => assertFails(getDoc(doc(as("alice"), "inviteCodes/ABC234"))));
	test("invite codes cannot be listed from the app", () => assertFails(getDocs(collection(as("eve"), "inviteCodes"))));
	test("invite codes cannot be created from the app", () => assertFails(setDoc(doc(as("eve"), "inviteCodes/HACK22"), { careCircleId: "c1" })));
	test("the circle's current code is hidden even from its admin", () => assertFails(getDoc(doc(as("alice"), "circlePrivate/c1"))));
	test("ATTACK: you cannot reset your own wrong-attempt counter", () => assertFails(deleteDoc(doc(as("eve"), "joinAttempts/eve"))));
	test("e-mail invitations cannot be read from the app", () => assertFails(getDoc(doc(as("alice"), "careCircleInvites/i1"))));
});

describe("fagg_medicijnen (reference list)", () => {
	test("signed-in users can look up a scanned medicine", () => assertSucceeds(getDoc(doc(as("bob"), "fagg_medicijnen/05411234567890"))));
	test("signed-in users can search by CNK", () => assertSucceeds(getDocs(query(collection(as("bob"), "fagg_medicijnen"), where("cnk", "==", "1234567")))));
	test("logged-out users cannot read it", () => assertFails(getDoc(doc(anonymous(), "fagg_medicijnen/05411234567890"))));
	test("nobody can change the list from the app", () => assertFails(setDoc(doc(as("alice"), "fagg_medicijnen/05411234567890"), { name: "Fake" })));
});
