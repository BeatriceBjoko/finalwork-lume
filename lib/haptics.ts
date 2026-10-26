import * as Haptics from "expo-haptics";

// One place for the app's haptic vocabulary, so the same action always feels the same.
export const haptic = {
	// Closing a screen, sheet or viewer (✕)
	close: () => Haptics.selectionAsync(),
	// Removing a small item from a form (photo, time slot, linked medicine)
	remove: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
};
