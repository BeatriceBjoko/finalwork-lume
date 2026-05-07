export const COLORS = {
	primary: "#233600",
	primaryLight: "#395717",
	accent: "#FEF970",
	white: "#FFFFFF",
	background: "#FDFBF7",
	transparent: "transparent",

	buttonFill: "#354E00",
	buttonText: "#D5FF8C",
	buttonShadow: "#9AD900",
	buttonSecondaryBorder: "#354E00",
	buttonSecondaryText: "#354E00",

	iconColor: "#354E00",

	glassGradientStart: "rgba(242, 230, 238, 0.90)",
	glassGradientEnd: "rgba(255, 227, 46, 0.090)",
	glassBorder: "rgba(239, 252, 0, 0.60)",
	inputPlaceholder: "rgba(35, 54, 0, 0.5)",

	innerGlowStart: "rgba(239, 252, 0, 0.4)",
	innerGlowEnd: "transparent",
};

export const FONTS = {
	heading: "BricolageBold",
	body: "InterRegular",
	button: "InterBold",
};

export const TYPOGRAPHY = {
	h1: {
		fontFamily: FONTS.heading,
		fontSize: 30,
		lineHeight: 38,
		color: COLORS.primary,
		textAlign: "center" as const,
	},
	h3: { fontFamily: "BricolageGrotesque-Medium", fontSize: 18, color: COLORS.primary },
	body: {
		fontFamily: FONTS.body,
		fontSize: 14,
		lineHeight: 22,
		color: COLORS.primary,
		textAlign: "center" as const,
	},
};

export const SIZES = {
	radius: 12,
	cardRadius: 34,
	padding: 24,
};
