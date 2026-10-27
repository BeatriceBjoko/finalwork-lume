// One way to make initials everywhere in the app.
// "Beatrice Bjoko" → "BB", "del-admin" → "DA", "Bea" → "BE", "" → "?"
// Hyphens, underscores and dots count as word separators, so similar names stay distinct.
export function getInitials(name?: string | null): string {
	const words = (name ?? "")
		.trim()
		.split(/[\s\-_.@]+/)
		.filter(Boolean);
	if (words.length === 0) return "?";
	if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
	return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
