import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

interface EnergyBatteryProps {
	percentage: number;
	color: string;
	onChange: (next: number) => void;
}

export function EnergyBattery({ percentage, color, onChange }: EnergyBatteryProps) {
	const trackWidth = useSharedValue(0);
	const progress = useSharedValue(percentage / 100);
	const draggingRef = useRef(false);

	const setDragging = (v: boolean) => {
		draggingRef.current = v;
	};
	const commit = (p: number) => onChange(p * 100);

	useEffect(() => {
		if (!draggingRef.current) progress.value = withTiming(percentage / 100, { duration: 200 });
	}, [percentage, progress]);

	const pan = Gesture.Pan()
		.onBegin(() => scheduleOnRN(setDragging, true))
		.onChange((e) => {
			if (trackWidth.value === 0) return;
			const next = Math.min(1, Math.max(0, progress.value + e.changeX / trackWidth.value));
			progress.value = next;
			scheduleOnRN(commit, next);
		})
		.onFinalize(() => scheduleOnRN(setDragging, false));

	const tap = Gesture.Tap().onEnd((e) => {
		if (trackWidth.value === 0) return;
		const next = Math.min(1, Math.max(0, e.x / trackWidth.value));
		progress.value = withTiming(next, { duration: 150 });
		scheduleOnRN(commit, next);
	});

	const gesture = Gesture.Race(pan, tap);

	const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
	const thumbStyle = useAnimatedStyle(() => ({ left: `${progress.value * 100}%` }));

	return (
		<View>
			<View style={styles.batteryOuter}>
				<View style={styles.batteryTip} />
				<Animated.View style={[styles.batteryInner, fillStyle, { backgroundColor: color }]}>
					<View style={styles.batteryGlans} />
				</Animated.View>
			</View>

			<GestureDetector gesture={gesture}>
				<View style={styles.sliderHitbox}>
					<View style={styles.sliderTrack} onLayout={(e) => (trackWidth.value = e.nativeEvent.layout.width)} />
					<Animated.View style={[styles.sliderThumb, thumbStyle, { backgroundColor: color, shadowColor: color }]} />
				</View>
			</GestureDetector>
		</View>
	);
}

const styles = StyleSheet.create({
	batteryOuter: {
		width: "100%",
		height: 54,
		borderWidth: 2,
		borderColor: "rgba(35, 54, 0, 0.2)",
		borderRadius: 16,
		padding: 4,
		justifyContent: "center",
		backgroundColor: "rgba(255,255,255,0.4)",
	},
	batteryTip: { width: 8, height: 20, borderRadius: 4, position: "absolute", right: -10, top: 15, backgroundColor: "rgba(35, 54, 0, 0.2)" },
	batteryInner: { height: "100%", borderRadius: 10, overflow: "hidden" },
	batteryGlans: { position: "absolute", top: 2, left: 2, right: 2, height: 8, backgroundColor: "rgba(255,255,255,0.4)", borderRadius: 4 },

	sliderHitbox: { width: "100%", height: 36, justifyContent: "center", marginTop: 20, position: "relative" },
	sliderTrack: {
		width: "100%",
		height: 8,
		backgroundColor: "rgba(255, 255, 255, 0.5)",
		borderRadius: 4,
		borderWidth: 1,
		borderColor: "rgba(35,54,0,0.05)",
	},
	sliderThumb: {
		width: 24,
		height: 24,
		borderRadius: 12,
		borderWidth: 3,
		borderColor: "#FFF",
		position: "absolute",
		marginLeft: -12,
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.8,
		shadowRadius: 10,
		elevation: 5,
	},
});
