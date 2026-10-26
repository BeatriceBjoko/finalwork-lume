// Date keys ("YYYY-MM-DD") in the phone's LOCAL time zone.
//
// Do not use date.toISOString().split("T")[0]: that is UTC, so between midnight and
// 1:00 (winter) or 2:00 (summer) in Belgium it returns yesterday's date.

export function toDateKey(date: Date = new Date()): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

// "YYYY-MM-DD" → Date at local midnight (new Date("YYYY-MM-DD") would be UTC midnight)
export function fromDateKey(key: string): Date {
	const [y, m, d] = key.split("-").map(Number);
	return new Date(y, m - 1, d);
}
