import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "../../constants/theme";
import { CalendarIcon, HomeIcon, NotesIcon, WellbeingIcon, type TabIconProps } from "./TabIcons";

interface TabConfig {
	Icon: React.ComponentType<TabIconProps>;
	labelKey: string;
}

const TAB_CONFIG: Record<string, TabConfig> = {
	index: { Icon: HomeIcon, labelKey: "nav.home" },
	calendar: { Icon: CalendarIcon, labelKey: "nav.calendar" },
	notes: { Icon: NotesIcon, labelKey: "nav.notes" },
	wellbeing: { Icon: WellbeingIcon, labelKey: "nav.wellbeing" },
};

const PILL_SIZE = 44;
const ROW_PADDING_H = 6;

export function BottomTabBar({ state, navigation }: BottomTabBarProps) {
	const { t } = useTranslation();
	const insets = useSafeAreaInsets();

	const [rowWidth, setRowWidth] = useState(0);
	const hasInitialized = useRef(false);

	const pillX = useSharedValue(0);
	const numTabs = state.routes.length;
	const tabWidth = rowWidth > 0 ? (rowWidth - ROW_PADDING_H * 2) / numTabs : 0;

	useEffect(() => {
		if (tabWidth > 0) {
			const target = ROW_PADDING_H + tabWidth * state.index + (tabWidth - PILL_SIZE) / 2;
			if (!hasInitialized.current) {
				pillX.value = target;
				hasInitialized.current = true;
			} else {
				pillX.value = withSpring(target, { damping: 20, stiffness: 180, mass: 0.8 });
			}
		}
	}, [state.index, tabWidth]);

	const pillAnimStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: pillX.value }],
	}));

	return (
		<View style={[styles.container, { bottom: Math.max(insets.bottom, 12) + 8 }]} pointerEvents="box-none">
			<View style={styles.glow}>
				<View style={styles.contactShadow}>
					<View style={styles.borderWrap}>
						<BlurView intensity={50} tint="light" style={styles.blur}>
							<View style={styles.glassTint} />

							<LinearGradient colors={["rgba(255, 255, 255, 0.55)", "rgba(255, 255, 255, 0)"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.innerTop} pointerEvents="none" />

							<LinearGradient colors={["rgba(35, 54, 0, 0)", "rgba(35, 54, 0, 0.10)"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.innerBottom} pointerEvents="none" />

							<View style={styles.row} onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}>
								{rowWidth > 0 && (
									<Animated.View style={[styles.pill, pillAnimStyle]} pointerEvents="none">
										<LinearGradient colors={["#FFFCA0", COLORS.accent]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
										<View style={styles.pillSpecular} />
									</Animated.View>
								)}

								{state.routes.map((route, index) => {
									const config = TAB_CONFIG[route.name];
									if (!config) return null;

									const { Icon } = config;
									const isFocused = state.index === index;

									const onPress = () => {
										const event = navigation.emit({
											type: "tabPress",
											target: route.key,
											canPreventDefault: true,
										});

										if (!isFocused && !event.defaultPrevented) {
											Haptics.selectionAsync();
											navigation.navigate(route.name);
										}
									};

									return (
										<Pressable key={route.key} onPress={onPress} style={styles.tab} hitSlop={4}>
											<View style={styles.iconWrap}>
												<Icon color={isFocused ? COLORS.iconColor : "#A8A39A"} size={24} strokeWidth={isFocused ? 2.2 : 1.8} />
											</View>
											<Text style={[styles.label, isFocused && styles.labelActive]} numberOfLines={1}>
												{t(config.labelKey)}
											</Text>
										</Pressable>
									);
								})}
							</View>
						</BlurView>
					</View>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		position: "absolute",
		left: 16,
		right: 16,
		alignItems: "center",
	},
	glow: {
		width: "100%",
		shadowColor: "#EFFC00",
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.38,
		shadowRadius: 20,
		elevation: 10,
		borderRadius: 28,
	},
	contactShadow: {
		width: "100%",
		shadowColor: "#233600",
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.22,
		shadowRadius: 18,
		elevation: 14,
		borderRadius: 28,
	},
	borderWrap: {
		borderRadius: 28,
		borderWidth: 1.5,
		borderColor: "rgba(255, 228, 0, 0.55)",
		overflow: "hidden",
	},
	blur: {
		width: "100%",
	},
	glassTint: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(255, 255, 255, 0.15)",
	},
	innerTop: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		height: 16,
	},
	innerBottom: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		height: 12,
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-around",
		paddingVertical: 10,
		paddingHorizontal: ROW_PADDING_H,
		position: "relative",
	},
	pill: {
		position: "absolute",
		top: 10,
		left: 0,
		width: PILL_SIZE,
		height: PILL_SIZE,
		borderTopLeftRadius: 26,
		borderTopRightRadius: 18,
		borderBottomLeftRadius: 16,
		borderBottomRightRadius: 22,
		overflow: "hidden",
		shadowColor: "#EFFC00",
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.5,
		shadowRadius: 8,
		elevation: 4,
	},
	pillSpecular: {
		position: "absolute",
		top: 4,
		left: 8,
		right: 8,
		height: 13,
		borderTopLeftRadius: 14,
		borderTopRightRadius: 10,
		borderBottomLeftRadius: 8,
		borderBottomRightRadius: 12,
		backgroundColor: "rgba(255, 255, 255, 0.45)",
	},
	tab: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		gap: 3,
	},
	iconWrap: {
		width: PILL_SIZE,
		height: PILL_SIZE,
		justifyContent: "center",
		alignItems: "center",
	},
	label: {
		fontFamily: "InterMedium",
		fontSize: 11,
		color: "#A8A39A",
	},
	labelActive: {
		fontFamily: "InterSemiBold",
		color: COLORS.iconColor,
	},
});
