import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS, FONTS } from "../../constants/theme";

interface CalendarHeroProps {
	year: number;
	month: number;
	isCurrentMonth: boolean;
	onPrev: () => void;
	onNext: () => void;
	onToday: () => void;
	locale: string;
}

export function CalendarHero({ year, month, isCurrentMonth, onPrev, onNext, onToday, locale }: CalendarHeroProps) {
	const { t } = useTranslation();

	const monthName = useMemo(() => {
		const d = new Date(year, month, 1);
		const name = d.toLocaleDateString(locale, { month: "long" });
		return name.charAt(0).toUpperCase() + name.slice(1);
	}, [year, month, locale]);

	const handlePrev = () => {
		Haptics.selectionAsync();
		onPrev();
	};
	const handleNext = () => {
		Haptics.selectionAsync();
		onNext();
	};
	const handleToday = () => {
		Haptics.selectionAsync();
		onToday();
	};

	return (
		<View style={styles.container}>
			<Text style={styles.monthName} numberOfLines={1} adjustsFontSizeToFit allowFontScaling={false}>
				{monthName}
			</Text>

			<View style={styles.controlsRow}>
				<Pressable onPress={handlePrev} style={styles.arrowBtn} hitSlop={10}>
					<Ionicons name="chevron-back" size={20} color={COLORS.primary} />
				</Pressable>

				<View style={styles.yearPill}>
					<Text style={styles.yearText}>{year}</Text>
				</View>

				<Pressable onPress={handleNext} style={styles.arrowBtn} hitSlop={10}>
					<Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
				</Pressable>
			</View>

			{!isCurrentMonth && (
				<Pressable onPress={handleToday} style={styles.todayChip} hitSlop={6}>
					<Ionicons name="locate" size={13} color={COLORS.primary} />
					<Text style={styles.todayText}>{t("calendar.today")}</Text>
				</Pressable>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		alignItems: "center",
		marginBottom: 22,
		gap: 12,
	},
	monthName: {
		fontFamily: FONTS.heading,
		fontSize: 56,
		lineHeight: 64,
		color: "#233600",
		letterSpacing: -1.5,
		textAlign: "center",
	},
	controlsRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	arrowBtn: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: COLORS.white,
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 1.2,
		borderColor: COLORS.iconColor,
		shadowColor: "#233600",
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.08,
		shadowRadius: 5,
		elevation: 2,
	},
	yearPill: {
		backgroundColor: "transparent",
		borderWidth: 1.2,
		borderColor: COLORS.iconColor,
		paddingHorizontal: 14,
		paddingVertical: 5,
		borderRadius: 14,
	},
	yearText: {
		fontFamily: "InterBold",
		fontSize: 14,
		color: COLORS.primary,
	},
	todayChip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 5,
		backgroundColor: COLORS.white,
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 14,
		borderWidth: 1,
		borderColor: "rgba(35, 54, 0, 0.1)",
	},
	todayText: {
		fontFamily: "InterSemiBold",
		fontSize: 12,
		color: COLORS.primary,
	},
});
