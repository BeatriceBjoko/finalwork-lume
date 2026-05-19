import * as Haptics from "expo-haptics";
import React, { useMemo } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { COLORS } from "../../constants/theme";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = 70;

interface CalendarMonthProps {
	year: number;
	month: number;
	selectedDate: string;
	taskDaysInMonth: Set<string>;
	onSelectDate: (date: string) => void;
	onPrev: () => void;
	onNext: () => void;
	locale: string;
}

function formatDateKey(year: number, month: number, day: number): string {
	return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getTodayKey(): string {
	const now = new Date();
	return formatDateKey(now.getFullYear(), now.getMonth(), now.getDate());
}

export function CalendarMonth({ year, month, selectedDate, taskDaysInMonth, onSelectDate, onPrev, onNext, locale }: CalendarMonthProps) {
	const translateX = useSharedValue(0);

	const triggerPrev = () => {
		Haptics.selectionAsync();
		onPrev();
	};
	const triggerNext = () => {
		Haptics.selectionAsync();
		onNext();
	};

	const panGesture = Gesture.Pan()
		.activeOffsetX([-20, 20])
		.failOffsetY([-15, 15])
		.onUpdate((event) => {
			const clamped = Math.max(-SCREEN_WIDTH / 2, Math.min(SCREEN_WIDTH / 2, event.translationX));
			translateX.value = clamped;
		})
		.onEnd((event) => {
			if (event.translationX > SWIPE_THRESHOLD) {
				scheduleOnRN(triggerPrev);
			} else if (event.translationX < -SWIPE_THRESHOLD) {
				scheduleOnRN(triggerNext);
			}
			translateX.value = withSpring(0, { damping: 18, stiffness: 220 });
		});

	const animStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: translateX.value }],
	}));

	const weekLabels = useMemo(() => {
		const labels: { id: string; label: string }[] = [];
		const refMonday = new Date(2024, 0, 1);
		for (let i = 0; i < 7; i++) {
			const d = new Date(refMonday);
			d.setDate(refMonday.getDate() + i);
			labels.push({
				id: d.toISOString(),
				label: d.toLocaleDateString(locale, { weekday: "narrow" }).toUpperCase(),
			});
		}
		return labels;
	}, [locale]);

	const weeks = useMemo(() => {
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0).getDate();
		const jsStart = firstDay.getDay();
		const startOffset = jsStart === 0 ? 6 : jsStart - 1;

		type Cell = { day: number; key: string } | { day: null; key: string };

		const flat: Cell[] = [];
		const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;

		for (let i = 0; i < startOffset; i++) {
			flat.push({ day: null, key: `${monthPrefix}-empty-pre-${i}` });
		}
		for (let d = 1; d <= lastDay; d++) {
			flat.push({ day: d, key: formatDateKey(year, month, d) });
		}
		let trailingCounter = 0;
		while (flat.length % 7 !== 0) {
			flat.push({ day: null, key: `${monthPrefix}-empty-post-${trailingCounter++}` });
		}

		const rows: Cell[][] = [];
		for (let i = 0; i < flat.length; i += 7) rows.push(flat.slice(i, i + 7));
		return rows;
	}, [year, month]);

	const todayKey = getTodayKey();

	const handleDayPress = (key: string) => {
		Haptics.selectionAsync();
		onSelectDate(key);
	};

	return (
		<View>
			<View style={styles.weekHeader}>
				{weekLabels.map((wl) => (
					<View key={wl.id} style={styles.weekHeaderCell}>
						<Text style={styles.weekLabel}>{wl.label}</Text>
					</View>
				))}
			</View>

			<GestureDetector gesture={panGesture}>
				<Animated.View style={[styles.weeksColumn, animStyle]}>
					{weeks.map((week) => {
						const firstActiveIdx = week.findIndex((c) => c.day !== null);
						let lastActiveIdx = -1;
						for (let i = week.length - 1; i >= 0; i--) {
							if (week[i].day !== null) {
								lastActiveIdx = i;
								break;
							}
						}
						const rowKey = week.find((c) => c.day !== null)?.key ?? week[0].key;

						return (
							<View key={rowKey} style={styles.weekRow}>
								{week.map((cell, ci) => {
									if (cell.day === null) {
										return <View key={cell.key} style={styles.dayCell} />;
									}

									const { day, key } = cell;
									const isSelected = key === selectedDate;
									const isToday = key === todayKey;
									const hasTask = taskDaysInMonth.has(key);

									const roundLeft = ci === firstActiveIdx;
									const roundRight = ci === lastActiveIdx;

									return (
										<Pressable key={key} style={styles.dayCell} onPress={() => handleDayPress(key)} hitSlop={2}>
											<View
												style={[
													styles.weekBand,
													{
														borderTopLeftRadius: roundLeft ? 22 : 0,
														borderBottomLeftRadius: roundLeft ? 22 : 0,
														borderTopRightRadius: roundRight ? 22 : 0,
														borderBottomRightRadius: roundRight ? 22 : 0,
													},
												]}
											/>

											{hasTask && <View style={[styles.taskDisc, isSelected && styles.taskDiscSelected]} />}
											{!hasTask && isSelected && <View style={styles.selectedRing} />}
											{isToday && !isSelected && !hasTask && <View style={styles.todayDot} />}

											<Text style={[styles.dayNumber, hasTask && styles.dayNumberOnDisc, !hasTask && isSelected && styles.dayNumberSelectedRing]}>{day}</Text>
										</Pressable>
									);
								})}
							</View>
						);
					})}
				</Animated.View>
			</GestureDetector>
		</View>
	);
}

const styles = StyleSheet.create({
	weekHeader: { flexDirection: "row", marginBottom: 10, paddingHorizontal: 4 },
	weekHeaderCell: { flex: 1, alignItems: "center" },
	weekLabel: { fontFamily: "InterSemiBold", fontSize: 11, color: "rgba(35, 54, 0, 0.4)", letterSpacing: 1 },

	weeksColumn: { gap: 6 },
	weekRow: { flexDirection: "row" },
	dayCell: { flex: 1, aspectRatio: 1, justifyContent: "center", alignItems: "center", position: "relative" },
	weekBand: { position: "absolute", top: 5, bottom: 5, left: 0, right: 0, backgroundColor: COLORS.accent },

	taskDisc: { position: "absolute", width: 30, height: 30, borderRadius: 15, backgroundColor: "#354E00" },
	taskDiscSelected: {
		shadowColor: "#354E00",
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.35,
		shadowRadius: 5,
		elevation: 3,
		borderWidth: 1.5,
		borderColor: "#FFF",
	},
	selectedRing: { position: "absolute", width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: "#354E00" },
	todayDot: { position: "absolute", bottom: 10, width: 4, height: 4, borderRadius: 2, backgroundColor: "#354E00", opacity: 0.6 },

	dayNumber: { fontFamily: "InterSemiBold", fontSize: 13, color: COLORS.primary, zIndex: 1 },
	dayNumberOnDisc: { color: "#FFFFFF", fontFamily: "InterBold" },
	dayNumberSelectedRing: { fontFamily: "InterBold", color: "#354E00" },
});
