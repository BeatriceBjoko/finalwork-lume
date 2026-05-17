import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { COLORS } from "../../constants/theme";

interface TaskSummaryCardsProps {
	totalToday: number;
	completed: number;
	open: number;
}

interface CardConfig {
	label: string;
	sublabel: string;
	value: number;
	icon: keyof typeof MaterialCommunityIcons.glyphMap;
	bg: string;
	iconBg: string;
	iconColor: string;
}

function useCountUp(target: number, delay = 0) {
	const [display, setDisplay] = useState(0);
	const [isFirstRender, setIsFirstRender] = useState(true);

	useEffect(() => {
		if (!isFirstRender) {
			setDisplay(target);
			return;
		}

		if (target === 0) {
			setDisplay(0);
			return;
		}

		const timeout = setTimeout(() => {
			let current = 0;
			const increment = Math.ceil(target / 20);
			const interval = setInterval(() => {
				current += increment;
				if (current >= target) {
					setDisplay(target);
					setIsFirstRender(false);
					clearInterval(interval);
				} else {
					setDisplay(current);
				}
			}, 35);
			return () => clearInterval(interval);
		}, delay);
		return () => clearTimeout(timeout);
	}, [target, delay, isFirstRender]);

	return display;
}

function LargeCard({ config, index }: { config: CardConfig; index: number }) {
	const count = useCountUp(config.value, index * 120);

	const translateY = useSharedValue(30);
	const opacity = useSharedValue(0);
	const scale = useSharedValue(1);
	const iconFloat = useSharedValue(0);

	useEffect(() => {
		translateY.value = withDelay(index * 100, withSpring(0, { damping: 14, stiffness: 110 }));
		opacity.value = withDelay(index * 100, withTiming(1, { duration: 400 }));
		iconFloat.value = withDelay(600, withRepeat(withSequence(withTiming(-5, { duration: 1200 }), withTiming(0, { duration: 1200 })), -1, true));
	}, []);

	const entranceStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: translateY.value }, { scale: scale.value }],
		opacity: opacity.value,
		flex: 1,
	}));

	const iconStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: iconFloat.value }],
	}));

	return (
		<Animated.View style={entranceStyle}>
			<Pressable
				onPressIn={() => {
					scale.value = withSpring(0.95, { damping: 10, stiffness: 200 });
				}}
				onPressOut={() => {
					scale.value = withSpring(1, { damping: 10, stiffness: 200 });
				}}
				style={[styles.largeCard, { backgroundColor: config.bg }]}
			>
				<Animated.View style={[styles.largeIconCircle, { backgroundColor: config.iconBg }, iconStyle]}>
					<MaterialCommunityIcons name={config.icon} size={26} color={config.iconColor} />
				</Animated.View>

				<View style={styles.largeBottom}>
					<Text style={[styles.largeNumber, { color: config.iconColor }]}>{count}</Text>
					<Text style={styles.largeLabel}>{config.label}</Text>
				</View>
			</Pressable>
		</Animated.View>
	);
}

function SmallCard({ config, index }: { config: CardConfig; index: number }) {
	const count = useCountUp(config.value, index * 120);

	const translateX = useSharedValue(30);
	const opacity = useSharedValue(0);
	const scale = useSharedValue(1);
	const iconFloat = useSharedValue(0);

	useEffect(() => {
		translateX.value = withDelay(index * 120, withSpring(0, { damping: 14, stiffness: 110 }));
		opacity.value = withDelay(index * 120, withTiming(1, { duration: 400 }));
		iconFloat.value = withDelay(800 + index * 200, withRepeat(withSequence(withTiming(-4, { duration: 1400 }), withTiming(0, { duration: 1400 })), -1, true));
	}, []);

	const entranceStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: translateX.value }, { scale: scale.value }],
		opacity: opacity.value,
		flex: 1,
	}));

	const iconStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: iconFloat.value }],
	}));

	return (
		<Animated.View style={entranceStyle}>
			<Pressable
				onPressIn={() => {
					scale.value = withSpring(0.95, { damping: 10, stiffness: 200 });
				}}
				onPressOut={() => {
					scale.value = withSpring(1, { damping: 10, stiffness: 200 });
				}}
				style={[styles.smallCard, { backgroundColor: config.bg }]}
			>
				<Animated.View style={[styles.smallIconCircle, { backgroundColor: config.iconBg }, iconStyle]}>
					<MaterialCommunityIcons name={config.icon} size={22} color={config.iconColor} />
				</Animated.View>

				<View>
					<Text style={[styles.smallNumber, { color: config.iconColor }]}>{count}</Text>
					<Text style={styles.smallLabel}>{config.label}</Text>
				</View>
			</Pressable>
		</Animated.View>
	);
}

export function TaskSummaryCards({ totalToday, completed, open }: TaskSummaryCardsProps) {
	const { t } = useTranslation();

	const largeCard: CardConfig = {
		label: t("tasks.today"),
		sublabel: t("tasks.tasksCount", { count: totalToday }),
		value: totalToday,
		icon: "calendar-month",
		bg: "#FEFBE0",
		iconBg: "rgba(239, 252, 0, 0.40)",
		iconColor: "#7A7000",
	};

	const smallCards: CardConfig[] = [
		{
			label: t("tasks.completed"),
			sublabel: t("tasks.tasksCount", { count: completed }),
			value: completed,
			icon: "check-circle-outline",
			bg: "#E8F5DC",
			iconBg: "rgba(42, 122, 58, 0.13)",
			iconColor: "#2A7A3A",
		},
		{
			label: t("tasks.open"),
			sublabel: t("tasks.tasksCount", { count: open }),
			value: open,
			icon: "clock-outline",
			bg: "#FFE8C8",
			iconBg: "rgba(210, 120, 20, 0.15)",
			iconColor: "#C97B20",
		},
	];

	return (
		<View style={styles.grid}>
			<LargeCard config={largeCard} index={0} />
			<View style={styles.rightColumn}>
				{smallCards.map((card, i) => (
					<SmallCard key={card.label} config={card} index={i + 1} />
				))}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	grid: {
		flexDirection: "row",
		gap: 10,
		alignItems: "stretch",
	},

	rightColumn: {
		flex: 1,
		gap: 10,
	},

	largeCard: {
		flex: 1,
		borderRadius: 22,
		padding: 16,
		justifyContent: "space-between",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.08,
		shadowRadius: 8,
		elevation: 3,
		minHeight: 180,
	},

	largeIconCircle: {
		width: 52,
		height: 52,
		borderRadius: 26,
		justifyContent: "center",
		alignItems: "center",
	},

	largeBottom: {
		gap: 2,
	},

	largeNumber: {
		fontFamily: "InterBold",
		fontSize: 32,
		lineHeight: 36,
	},

	largeLabel: {
		fontFamily: "InterBold",
		fontSize: 13,
		color: COLORS.primary,
		lineHeight: 18,
	},

	largeSublabel: {
		fontFamily: "InterRegular",
		fontSize: 11,
		color: COLORS.primary,
		opacity: 0.55,
	},

	smallCard: {
		borderRadius: 18,
		padding: 14,
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.07,
		shadowRadius: 6,
		elevation: 2,
	},

	smallIconCircle: {
		width: 44,
		height: 44,
		borderRadius: 22,
		justifyContent: "center",
		alignItems: "center",
	},

	smallNumber: {
		fontFamily: "InterBold",
		fontSize: 22,
		lineHeight: 26,
	},

	smallLabel: {
		fontFamily: "InterRegular",
		fontSize: 11,
		color: COLORS.primary,
		opacity: 0.65,
	},
});
