import React from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, TYPOGRAPHY } from "../../constants/theme";

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
					<View style={[styles.cardWrapper, styles.card1Pos]}>
						<FeatureCard title={t("onboarding.step3.feature1_title", "Gedeeld zorgoverzicht")} subtitle={t("onboarding.step3.feature1_sub", "iedereen ziet dezelfde planning")} />
					</View>

					<View style={[styles.cardWrapper, styles.card2Pos]}>
						<FeatureCard title={t("onboarding.step3.feature2_title", "Zekerheid bij medicatie")} subtitle={t("onboarding.step3.feature2_sub", "scan & check in één seconde")} />
					</View>

					<View style={[styles.cardWrapper, styles.card3Pos]}>
						<FeatureCard title={t("onboarding.step3.feature3_title", "Minder mentale last")} subtitle={t("onboarding.step3.feature3_sub", "Taken duidelijk verdeeld")} />
					</View>
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
		overflow: "hidden",
	},
	safeArea: {
		flex: 1,
		paddingHorizontal: 16,
		paddingTop: 30,
		paddingBottom: 70,
		justifyContent: "space-between",
	},

	backgroundImage: {
		position: "absolute",
		borderRadius: 24,
		resizeMode: "cover",
	},
	bgImageBottom: {
		width: "85%",
		height: "50%",
		top: "21%",
		left: "2%",
		transform: [{ rotate: "-8deg" }],
	},
	bgImageTop: {
		width: "78%",
		height: "50%",
		top: "21%",
		right: "2%",
		transform: [{ rotate: "8deg" }],
		marginTop: 5,
	},

	headerContainer: { alignItems: "center" },
	titleText: {
		...TYPOGRAPHY.h1,
	},
	highlightWrapper: {
		backgroundColor: COLORS.accent,
		paddingHorizontal: 16,
		paddingVertical: 2,
		borderRadius: 20,
		marginTop: 4,
	},
	highlightText: {
		...TYPOGRAPHY.h1,
	},

	cardsList: {
		flex: 1,
		width: "100%",
		marginTop: 60,
		zIndex: 5,
	},

	cardWrapper: {
		position: "absolute",
		width: width * 0.8,
	},

	card1Pos: {
		top: height * 0.03,
		right: "-10%",
	},

	card2Pos: {
		top: height * 0.19,
		left: "-10%",
	},

	card3Pos: {
		top: height * 0.35,
		right: "-10%",
	},

	buttonsContainer: {
		gap: 16,
		width: "100%",
		marginTop: "auto",
	},
});
