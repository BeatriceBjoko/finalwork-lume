import { Feather } from "@expo/vector-icons";
import React from "react";
import { Dimensions, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FONTS } from "../constants/theme";

const { width, height } = Dimensions.get("window");

export default function Onboarding() {
	const handleNext = () => {
		console.log("Next pressed");
	};

	return (
		<View style={styles.container}>
			<View style={StyleSheet.absoluteFillObject}>
				<Image source={require("../assets/images/blobs-left.png")} style={styles.blob1} />
				<View style={[styles.imageWrapper, styles.avatar1]}>
					<Image source={require("../assets/images/person1.png")} style={styles.image} />
					<View style={styles.innerShadowOverlay} />
				</View>

				<Image source={require("../assets/images/blobs-right.png")} style={styles.blob2} />
				<View style={[styles.imageWrapper, styles.avatar2]}>
					<Image source={require("../assets/images/person2.png")} style={styles.image} />
					<View style={styles.innerShadowOverlay} />
				</View>

				<Image source={require("../assets/images/blobs-left.png")} style={styles.blob3} />
				<View style={[styles.imageWrapper, styles.avatar3]}>
					<Image source={require("../assets/images/person3.png")} style={styles.image} />
					<View style={styles.innerShadowOverlay} />
				</View>
			</View>

			<SafeAreaView style={styles.safeArea}>
				<View style={styles.headerContainer}>
					<Text style={styles.title}>Zorg voor een dierbare</Text>
					<Text style={styles.title}>is mooi. Maar soms ook</Text>
					<Text style={styles.title}>zwaar</Text>
				</View>

				<View style={styles.spacer} />

				<Text style={styles.paragraph}>Afspraken, medicatie, taken... iedereen helpt{"\n"}mee, maar het overzicht ontbreekt vaak.</Text>

				<View style={styles.footer}>
					<View style={{ width: 50 }} />

					<View style={styles.paginationDots}>
						<View style={[styles.dot, styles.activeDot]} />
						<View style={styles.dot} />
						<View style={styles.dot} />
					</View>

					{/* Knop */}
					<Pressable style={styles.nextButton} onPress={handleNext}>
						<Feather name="chevron-right" size={24} color="#354E00" />
					</Pressable>
				</View>
			</SafeAreaView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F4F6D0",
	},

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
		right: "-7%",
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

	imageWrapper: {
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
	image: {
		width: "100%",
		height: "100%",
		borderRadius: 53.5,
		borderWidth: 1.3,
		borderColor: "#FFFFFF",
	},
	innerShadowOverlay: {
		...StyleSheet.absoluteFillObject,
		borderRadius: 53.5,
		borderWidth: 4,
		borderColor: "rgba(70, 74, 0, 0.1)",
	},

	safeArea: {
		flex: 1,
		justifyContent: "space-between",
		paddingHorizontal: 24,
		paddingTop: 50,
		paddingBottom: 30,
		zIndex: 10,
	},
	spacer: {
		flex: 1,
	},

	headerContainer: {
		alignItems: "center",
	},
	title: {
		fontFamily: FONTS.heading,
		fontSize: 30,
		color: "#233600",
		textAlign: "center",
		lineHeight: 36,
	},
	paragraph: {
		fontFamily: FONTS.body,
		fontSize: 14,
		color: "#233600",
		textAlign: "center",
		lineHeight: 22,
		marginBottom: 20,
	},

	footer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 10,
	},
	paginationDots: {
		flexDirection: "row",
		gap: 6,
	},
	dot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		borderWidth: 1,
		borderColor: "#354E00",
		backgroundColor: "transparent",
	},
	activeDot: {
		backgroundColor: "#354E00",
		shadowColor: "#2F3E2F",
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.6,
		shadowRadius: 4,
		elevation: 8,
	},

	nextButton: {
		width: 45,
		height: 45,
		borderRadius: 22.5,
		borderWidth: 1.5,
		borderColor: "#354E00",
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "transparent",
	},
});
