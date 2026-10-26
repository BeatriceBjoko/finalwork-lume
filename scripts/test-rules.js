/**
 * Runs the Firestore and Storage rules tests against the local emulators.
 *
 *   npm run test:rules
 *
 * Uses firebase.rules-test.json, which points at the local (gitignored) firestore.rules
 * and storage.rules. The normal firebase.json has no rules entries, so a deploy never
 * overwrites the rules that are managed in the Firebase Console.
 *
 * On Windows the Firebase CLI stops only the Firestore emulator's launcher, so the Java
 * process keeps port 8080 busy and the next run fails with "port taken".
 * After the tests we therefore stop the leftover emulator on that port.
 */
const { spawnSync } = require("node:child_process");

const PORT = 8080;

const result = spawnSync(
	"firebase",
	["emulators:exec", "--config", "firebase.rules-test.json", "--only", "firestore,storage", "--project", "demo-lume", '"node --test --test-concurrency=1 tests/firestore.rules.test.js tests/storage.rules.test.js"'],
	{ stdio: "inherit", shell: true },
);

if (process.platform === "win32") {
	// Only stops a process that listens on the emulator port AND is the Firestore emulator
	const cleanup = `Get-NetTCPConnection -LocalPort ${PORT} -State Listen -ErrorAction SilentlyContinue | ForEach-Object { $c = (Get-CimInstance Win32_Process -Filter "ProcessId=$($_.OwningProcess)").CommandLine; if ($c -match 'cloud-firestore-emulator') { Stop-Process -Id $_.OwningProcess -Force } }`;
	spawnSync("powershell", ["-NoProfile", "-Command", cleanup], { stdio: "ignore" });
}

process.exit(result.status ?? 1);
