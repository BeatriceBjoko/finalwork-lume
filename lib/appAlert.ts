import { useEffect, useId, useSyncExternalStore } from "react";
import { Platform } from "react-native";

// Lume-styled replacement for React Native's Alert.alert, with the same call shape:
//   appAlert(title, message?, buttons?)
// The alert is drawn by <AppAlertHost />. A host is mounted at the app root and inside
// every full-screen modal (an alert from the root cannot appear on top of a modal);
// the most recently mounted host shows the alert.

export interface AppAlertButton {
	text: string;
	style?: "default" | "cancel" | "destructive";
	onPress?: () => void;
}

export interface AppAlertState {
	id: number;
	title: string;
	message?: string;
	buttons: AppAlertButton[];
}

interface Snapshot {
	alert: AppAlertState | null;
	topHost: string | null;
}

let nextId = 1;
let current: AppAlertState | null = null;
const queue: AppAlertState[] = [];
const hosts: string[] = [];
const listeners = new Set<() => void>();
let snapshot: Snapshot = { alert: null, topHost: null };

function emit() {
	snapshot = { alert: current, topHost: hosts[hosts.length - 1] ?? null };
	listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

export function appAlert(title: string, message?: string, buttons?: AppAlertButton[]) {
	const alert: AppAlertState = { id: nextId++, title, message, buttons: buttons?.length ? buttons : [] };
	if (current) queue.push(alert);
	else current = alert;
	emit();
}

// Closes the alert, then runs the pressed button's action. On iOS we wait for the
// fade-out, so an action that opens another modal does not collide with this one.
export function closeAppAlert(pressed?: AppAlertButton) {
	current = queue.shift() ?? null;
	emit();
	if (pressed?.onPress) setTimeout(pressed.onPress, Platform.OS === "ios" ? 350 : 0);
}

// Registers the calling component as an alert host; returns the alert to show
// when this host is the top-most one, otherwise null.
export function useAppAlertHost(): AppAlertState | null {
	const hostId = useId();
	useEffect(() => {
		hosts.push(hostId);
		emit();
		return () => {
			const index = hosts.lastIndexOf(hostId);
			if (index !== -1) hosts.splice(index, 1);
			emit();
		};
	}, [hostId]);
	const state = useSyncExternalStore(subscribe, () => snapshot);
	return state.topHost === hostId ? state.alert : null;
}
