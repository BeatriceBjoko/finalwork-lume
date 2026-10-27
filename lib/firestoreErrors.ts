// Firestore answers "permission-denied" when the user no longer has access to data,
// for example right after deleting their account or being removed from the circle.
// That is expected, so live screens clear their data quietly instead of logging an error.
export function isAccessRevoked(error: unknown): boolean {
	return (error as { code?: string } | null)?.code === "permission-denied";
}

// Error handler for live listeners: quiet when access was revoked, logged otherwise
export function listenerError(label: string, onRevoked?: () => void) {
	return (error: unknown) => {
		if (isAccessRevoked(error)) {
			onRevoked?.();
			return;
		}
		console.error(label, error);
	};
}
