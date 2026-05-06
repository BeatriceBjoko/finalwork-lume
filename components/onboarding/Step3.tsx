import React from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, FONTS } from "../../constants/theme";

import Button from "../ui/Button";
import FeatureCard from "../ui/FeatureCard";

const { width, height } = Dimensions.get("window");

export default function Step3() {
	const { t } = useTranslation();

	return (
		<View style={styles.slide}>
			<View style={StyleSheet.absoluteFillObject}>
				<Image source={require("../../assets/images/screen3down.jpg")} style={[styles.backgroundImage, styles.bgImageBottom]} />
				<Image source={require("../../assets/images/screen3up.jpg")} style={[styles.backgroundImage, styles.bgImageTop]} />
			</View>

			<SafeAreaView style={styles.safeArea}>
				<View style={styles.headerContainer}>
					<Text style={styles.titleText}>{t("onboarding.step3.titleLine1", "Start met jouw")}</Text>
					<View style={styles.highlightWrapper}>
						<Text style={styles.highlightText}>{t("onboarding.step3.titleLine2", "zorgkring")}</Text>
					</View>
				</View>

				<View style={styles.cardsList}>
					<FeatureCard title={t("onboarding.step3.feature1_title", "Gedeeld zorgoverzicht")} subtitle={t("onboarding.step3.feature1_sub", "iedereen ziet dezelfde planning")} />
					<FeatureCard title={t("onboarding.step3.feature2_title", "Zekerheid bij medicatie")} subtitle={t("onboarding.step3.feature2_sub", "scan & check in één seconde")} />
					<FeatureCard title={t("onboarding.step3.feature3_title", "Minder mentale last")} subtitle={t("onboarding.step3.feature3_sub", "Taken duidelijk verdeeld")} />
				</View>

				<View style={styles.buttonsContainer}>
					<Button title={t("onboarding.step3.btn_primary", "Zorgkring aanmaken")} variant="primary" onPress={() => {}} />
					<Button title={t("onboarding.step3.btn_secondary", "Join zorgkring")} variant="secondary" onPress={() => {}} />
				</View>
			</SafeAreaView>
		</View>
	);
}

const styles = StyleSheet.create({
	slide: {
		width: width,
		height: height,
		backgroundColor: COLORS.white,
	},
	safeArea: {
		flex: 1,
		paddingHorizontal: 24,
		paddingTop: 60,
		paddingBottom: 40,
		justifyContent: "space-between",
	},

	backgroundImage: {
		position: "absolute",
		width: "95%",
		height: "65%",
		borderRadius: 24,
		resizeMode: "cover",
		top: "15%",
	},
	bgImageBottom: {
		left: "-8%",
		transform: [{ rotate: "-6deg" }],
	},
	bgImageTop: {
		right: "-5%",
		transform: [{ rotate: "4deg" }],
		marginTop: 30,
	},

	headerContainer: { alignItems: "center", marginTop: 10 },
	titleText: {
		fontFamily: FONTS.heading,
		fontSize: 32,
		color: COLORS.primary,
		textAlign: "center",
	},
	highlightWrapper: {
		backgroundColor: COLORS.accent,
		paddingHorizontal: 16,
		paddingVertical: 2,
		borderRadius: 20,
		marginTop: 4,
	},
	highlightText: {
		fontFamily: FONTS.heading,
		fontSize: 32,
		color: COLORS.primary,
		textAlign: "center",
	},

	cardsList: {
		gap: 16,
		marginTop: 40,
	},

	buttonsContainer: {
		gap: 16,
		width: "100%",
		marginTop: "auto",
	},
});
