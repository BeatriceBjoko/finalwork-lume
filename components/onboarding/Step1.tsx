import React from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FONTS } from "../../constants/theme";

const { width, height } = Dimensions.get("window");

export default function Step1() {
	const { t } = useTranslation();

	return (
		<View style={styles.slide}>
			<View style={StyleSheet.absoluteFillObject}>
				<Image source={require("../../assets/images/blobs-left.png")} style={styles.blob1} />
				<View style={[styles.avatarWrapper, styles.avatar1]}>
					<Image source={require("../../assets/images/person1.png")} style={styles.avatarImage} />
					<View style={styles.avatarInnerShadow} />
				</View>
				<Image source={require("../../assets/images/blobs-right.png")} style={styles.blob2} />
				<View style={[styles.avatarWrapper, styles.avatar2]}>
					<Image source={require("../../assets/images/person2.png")} style={styles.avatarImage} />
					<View style={styles.avatarInnerShadow} />
				</View>
				<Image source={require("../../assets/images/blobs-left.png")} style={styles.blob3} />
				<View style={[styles.avatarWrapper, styles.avatar3]}>
					<Image source={require("../../assets/images/person3.png")} style={styles.avatarImage} />
					<View style={styles.avatarInnerShadow} />
				</View>
			</View>

			<SafeAreaView style={styles.safeArea}>
				<View style={styles.headerContainer}>
					<Text style={styles.title}>{t("onboarding.step1.title", "Zorg voor een dierbare\nis mooi. Maar soms ook\nzwaar")}</Text>
				</View>
				<View style={styles.spacer} />
				<Text style={styles.paragraph}>{t("onboarding.step1.description", "Afspraken, medicatie, taken... iedereen helpt\nmee, maar het overzicht ontbreekt vaak.")}</Text>
				<View style={{ height: 80 }} />
			</SafeAreaView>
		</View>
	);
}

const styles = StyleSheet.create({
	slide: { width: width, height: height },
	blob1: {
		position: "absolute",
		top: "25%",
		left: "-12%",
		width: "90%",
		height: "45%",
		resizeMode: "contain",
		zIndex: 1,
		opacity: 0.89,
	},
	avatar1: {
		position: "absolute",
		top: "27%",
		left: "35%",
		zIndex: 2,
	},
	blob2: {
		position: "absolute",
		top: "42%",
		right: "-6%",
		width: "80%",
		height: "45%",
		resizeMode: "contain",
		zIndex: 1,
		opacity: 0.85,
	},
	avatar2: {
		position: "absolute",
		top: "44%",
		right: "34%",
		zIndex: 2,
	},
	blob3: {
		position: "absolute",
		top: "59%",
		left: "-11%",
		width: "90%",
		height: "45%",
		resizeMode: "contain",
		zIndex: 1,
		opacity: 0.89,
	},
	avatar3: {
		position: "absolute",
		top: "61%",
		left: "36%",
		zIndex: 2,
	},
	avatarWrapper: {
		width: 105,
		height: 107,
		borderRadius: 53.5,
		backgroundColor: "#fff",
		shadowColor: "#233600",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.4,
		shadowRadius: 4,
		elevation: 6,
	},
	avatarImage: { width: "100%", height: "100%", borderRadius: 53.5, borderWidth: 1.3, borderColor: "#FFFFFF" },
	avatarInnerShadow: { ...StyleSheet.absoluteFillObject, borderRadius: 53.5, borderWidth: 4, borderColor: "rgba(70, 74, 0, 0.1)" },
	safeArea: { flex: 1, justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 60, paddingBottom: 30, zIndex: 10 },
	spacer: { flex: 1 },
	headerContainer: { alignItems: "center" },
	title: { fontFamily: FONTS.heading, fontSize: 30, color: "#233600", textAlign: "center", lineHeight: 36 },
	paragraph: { fontFamily: FONTS.body, fontSize: 14, color: "#233600", textAlign: "center", lineHeight: 22 },
});
