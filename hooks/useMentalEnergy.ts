import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";

import { COLORS } from "../constants/theme";

const STORAGE_KEY = "lume.wellbeing.mentalEnergy";
const DEFAULT_ENERGY = 60;

export type EnergyLevel = "depleted" | "low" | "ok" | "full";

export function getEnergyLevel(percentage: number): EnergyLevel {
	if (percentage <= 20) return "depleted";
	if (percentage <= 50) return "low";
	if (percentage <= 80) return "ok";
	return "full";
}

export const ENERGY_COLORS: Record<EnergyLevel, string> = {
	depleted: "#C94B47",
	low: "#E2A44B",
	ok: "#FFF24D",
	full: COLORS.accent ?? "#AACC00",
};

export function useMentalEnergy() {
	const [percentage, setPercentage] = useState(DEFAULT_ENERGY);
	const [isLoaded, setIsLoaded] = useState(false);
	const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		let active = true;
		AsyncStorage.getItem(STORAGE_KEY)
			.then((stored) => {
				const n = Number(stored);
				if (active && stored != null && !Number.isNaN(n)) setPercentage(n);
			})
			.finally(() => {
				if (active) setIsLoaded(true);
			});
		return () => {
			active = false;
		};
	}, []);

	useEffect(
		() => () => {
			if (saveTimer.current) clearTimeout(saveTimer.current);
		},
		[],
	);

	const setEnergy = useCallback((next: number) => {
		const clamped = Math.max(0, Math.min(100, Math.round(next)));
		setPercentage(clamped);
		if (saveTimer.current) clearTimeout(saveTimer.current);
		saveTimer.current = setTimeout(() => {
			AsyncStorage.setItem(STORAGE_KEY, String(clamped)).catch(() => {});
		}, 400);
	}, []);

	const level = getEnergyLevel(percentage);

	return {
		percentage,
		setEnergy,
		isLoaded,
		level,
		color: ENERGY_COLORS[level],
		isLow: percentage <= 30,
	};
}
