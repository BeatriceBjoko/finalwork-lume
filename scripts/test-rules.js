/**
 * Runs tests/firestore.rules.test.js against the Firestore emulator.
 *
 *   npm run test:rules
 *
 * On Windows the Firebase CLI stops only the emulator's launcher, so the Java
 * process keeps port 8080 busy and the next run fails with "port taken".
 * After the tests we therefore stop the leftover emulator on that port.
 */
const { spawnSync } = require("node:child_process");

const PORT = 8080;

const result = spawnSync("firebase", ["emulators:exec", "--only", "firestore", "--project", "demo-lume", '"node --test tests/firestore.rules.test.js"'], { stdio: "inherit", shell: true });

if (process.platform === "win32") {
	// Only stops a process that listens on the emulator port AND is the Firestore emulator
	const cleanup = `Get-NetTCPConnection -LocalPort ${PORT} -State Listen -ErrorAction SilentlyContinue | ForEach-Object { $c = (Get-CimInstance Win32_Process -Filter "ProcessId=$($_.OwningProcess)").CommandLine; if ($c -match 'cloud-firestore-emulator') { Stop-Process -Id $_.OwningProcess -Force } }`;
	spawnSync("powershell", ["-NoProfile", "-Command", cleanup], { stdio: "ignore" });
}

process.exit(result.status ?? 1);
