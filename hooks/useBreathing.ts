import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
import { Easing, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

export type Phase = "idle" | "inhale" | "hold1" | "exhale" | "hold2" | "complete";
export type ShapeKind = "polygon" | "blob" | "bloom";
export type SessionId = "box" | "relax" | "simple";
export type SessionCategory = "breath" | "relax" | "sleep" | "energy";

export interface Technique {
	inhale: number;
	hold1: number;
	exhale: number;
	hold2: number;
}

export interface Session {
	id: SessionId;
	technique: Technique;
	rounds: number;
	durationMin: number;
	gradient: [string, string];
	accentColor: string;
	textOnGradient: string;
	polygonColor: string;
	polygonGlow: string;
	shape: ShapeKind;
	vertexCount: number;
	rotateOffset: number;
	categories: SessionCategory[];
}

export const PHASE_ORDER: Phase[] = ["inhale", "hold1", "exhale", "hold2"];

export const BREATHING = {
	sceneSize: 320,
	polygonBaseRadius: 90,
	minScale: 0.6,
	maxScale: 1.0,
	rotationDurationMs: 60_000,
} as const;

export function useBreathing(session: Session | null) {
	const [phase, setPhase] = useState<Phase>("idle");
	const [round, setRound] = useState(1);
	const [secondsLeft, setSecondsLeft] = useState(0);

	const breathValue = useSharedValue<number>(BREATHING.minScale);
	const haloOpacity = useSharedValue<number>(0.5);
	const continuousRotation = useSharedValue<number>(0);

	const phaseRef = useRef(phase);
	phaseRef.current = phase;
	const roundRef = useRef(round);
	roundRef.current = round;

	useEffect(() => {
		if (!session) {
			setPhase("idle");
			setRound(1);
		}
	}, [session]);

	useEffect(() => {
		continuousRotation.value = withRepeat(withTiming(360, { duration: BREATHING.rotationDurationMs, easing: Easing.linear }), -1, false);
	}, [continuousRotation]);

	const advancePhase = useCallback(() => {
		if (!session) return;
		const activePhases = PHASE_ORDER.filter((p) => session.technique[p as keyof Technique] > 0);
		const currentIdx = activePhases.indexOf(phaseRef.current);
		if (currentIdx === -1) return;

		const nextIdx = (currentIdx + 1) % activePhases.length;
		const nextPhase = activePhases[nextIdx];

		if (nextIdx === 0) {
			if (roundRef.current >= session.rounds) {
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
				setPhase("complete");
				return;
			}
			setRound((r) => r + 1);
		}
		setPhase(nextPhase);
	}, [session]);

	useEffect(() => {
		if (!session || phase === "idle" || phase === "complete") {
			breathValue.value = withTiming(BREATHING.minScale, { duration: 800, easing: Easing.bezier(0.4, 0, 0.2, 1) });
			haloOpacity.value = withTiming(0.5, { duration: 800 });
			return;
		}

		const duration = session.technique[phase as keyof Technique];
		if (duration === 0) {
			advancePhase();
			return;
		}

		const targetScale = phase === "inhale" || phase === "hold1" ? BREATHING.maxScale : BREATHING.minScale;
		const targetHalo = phase === "inhale" || phase === "hold1" ? 0.95 : 0.4;

		breathValue.value = withTiming(targetScale, { duration: duration * 1000, easing: Easing.bezier(0.4, 0, 0.2, 1) });
		haloOpacity.value = withTiming(targetHalo, { duration: duration * 1000, easing: Easing.bezier(0.4, 0, 0.2, 1) });

		if (phase === "inhale" || phase === "exhale") {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
		} else {
			Haptics.selectionAsync();
		}

		setSecondsLeft(duration);
		let s = duration;
		const interval = setInterval(() => {
			s -= 1;
			if (s <= 0) {
				clearInterval(interval);
				advancePhase();
			} else {
				setSecondsLeft(s);
			}
		}, 1000);

		return () => clearInterval(interval);
	}, [phase, session, advancePhase, breathValue, haloOpacity]);

	const start = useCallback(() => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		setRound(1);
		setPhase("inhale");
	}, []);

	const reset = useCallback(() => {
		setPhase("idle");
		setRound(1);
	}, []);

	return {
		phase,
		round,
		secondsLeft,
		breathValue,
		haloOpacity,
		continuousRotation,
		isRunning: phase !== "idle" && phase !== "complete",
		start,
		reset,
	};
}
