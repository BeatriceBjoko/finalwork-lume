import React from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FONTS } from "../../constants/theme";

const { width, height } = Dimensions.get("window");

const GlowingCard = ({ text, style, zIndex }: { text: string; style?: object; zIndex?: number }) => {
	return (
		<View style={[{ zIndex }, style]}>
			<View style={styles.shadowOuter}>
				<View style={styles.shadowInner}>
					<View style={styles.glassContainer}>
						<Text style={styles.cardText}>{text}</Text>
					</View>
				</View>
			</View>
		</View>
	);
};

const GridPhoto = ({ source, imageStyle }: { source: any; imageStyle?: object }) => (
	<View style={styles.gridImageWrapper}>
		<Image source={source} style={[styles.gridImageInner, imageStyle]} />
	</View>
);

export default function Step2() {
	const { t } = useTranslation();

	return (
		<View style={styles.slide}>
			<SafeAreaView style={styles.safeArea}>
				<View style={styles.headerContainer}>
					<Text style={styles.title}>{t("onboarding.step2.title", "SAMEN zorgen, met\nmeer rust in je hoofd")}</Text>
				</View>

				<View style={styles.contentContainer}>
					<View style={styles.cardsWrapper}>
						<GlowingCard text={t("onboarding.step2.card1", "Van medicatie tot planning: alles komt samen op één gedeelde plek.")} zIndex={1} />

						<GlowingCard
							text={t("onboarding.step2.card2", "Zodat jullie zorgkring verbonden blijft en jij rust in je zorgdag vindt.")}
							zIndex={2}
							style={{
								transform: [{ rotate: "13deg" }],
								marginTop: 30,
								marginLeft: 1,
								marginRight: -5,
							}}
						/>
					</View>

					<View style={styles.gridWrapper}>
						<View style={[styles.yellowLine, styles.lineTopHorizontal]} />
						<View style={[styles.yellowLine, styles.lineLeftVertical]} />
						<View style={[styles.yellowLine, styles.lineBottomHorizontal]} />
						<View style={[styles.yellowLine, styles.lineRightVertical]} />

						<View style={styles.gridRow}>
							<GridPhoto
								source={require("../../assets/images/screen2girl.jpg")}
								imageStyle={{
									position: "absolute",
									width: 160,
									height: 230,
									top: 0,
								}}
							/>

							<GridPhoto source={require("../../assets/images/screen2woman.jpg")} />
						</View>

						<View style={styles.gridRow}>
							<GridPhoto source={require("../../assets/images/screen2under.jpg")} />

							<GridPhoto
								source={require("../../assets/images/screen2man.jpg")}
								imageStyle={{
									position: "absolute",
									width: 160,
									height: 230,
									top: -8,
								}}
							/>
						</View>
					</View>
				</View>
			</SafeAreaView>
		</View>
	);
}

const styles = StyleSheet.create({
	slide: {
		width: width,
		height: height,
		backgroundColor: "#FFFFFF",
	},
	safeArea: {
		flex: 1,
		paddingHorizontal: 24,
		paddingTop: 60,
	},
	headerContainer: { alignItems: "center", marginBottom: 30 },
	title: {
		fontFamily: FONTS.heading,
		fontSize: 32,
		color: "#233600",
		textAlign: "center",
		lineHeight: 38,
	},
	contentContainer: {
		flex: 1,
		alignItems: "center",
	},

	cardsWrapper: {
		width: "100%",
		marginBottom: 20,
	},
	shadowOuter: {
		shadowColor: "#EFFC00",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.25,
		shadowRadius: 25,
		elevation: 8,
	},
	shadowInner: {
		shadowColor: "#EFFC00",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.5,
		shadowRadius: 5,
		elevation: 4,
	},
	glassContainer: {
		backgroundColor: "rgba(255, 255, 255, 0.85)",
		borderRadius: 15,
		borderWidth: 1,
		borderColor: "rgba(53, 78, 0, 0.2)",
		paddingHorizontal: 20,
		paddingVertical: 16,
	},
	cardText: {
		fontFamily: FONTS.body,
		fontSize: 15,
		color: "#233600",
		lineHeight: 22,
	},

	gridWrapper: {
		marginTop: 30,
		width: 340,
		height: 340,
		justifyContent: "space-between",
		position: "relative",
	},
	gridRow: {
		flexDirection: "row",
		justifyContent: "space-between",
	},

	gridImageWrapper: {
		width: 160,
		height: 160,
		borderRadius: 15,
		backgroundColor: "#E0E0E0",
		overflow: "hidden",
	},
	gridImageInner: {
		width: "100%",
		height: "100%",
		resizeMode: "cover",
	},

	yellowLine: {
		position: "absolute",
		backgroundColor: "rgba(239, 252, 0, 0.8)",
		zIndex: -1,
	},
	lineTopHorizontal: {
		top: 70,
		left: 80,
		right: 80,
		height: 20,
	},
	lineBottomHorizontal: {
		bottom: 70,
		left: 80,
		right: 80,
		height: 20,
	},
	lineLeftVertical: {
		left: 70,
		top: 80,
		bottom: 80,
		width: 20,
	},
	lineRightVertical: {
		right: 70,
		top: 80,
		bottom: 80,
		width: 20,
	},
});
