import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { COLORS } from "../../constants/theme";

export interface NoteData {
	id: string;
	title: string;
	time: string;
	content: string;
	tag?: string;
	icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}

interface NoteCardProps {
	note: NoteData;
}

export function NoteCard({ note }: NoteCardProps) {
	const floatY = useSharedValue(0);

	useEffect(() => {
		floatY.value = withRepeat(withSequence(withTiming(-5, { duration: 2800 }), withTiming(0, { duration: 2800 })), -1, true);
	}, []);

	const floatStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: floatY.value }],
	}));

	return (
		<View style={styles.scene}>
			<View style={[styles.stackCard, styles.stackCard2]} />
			<View style={[styles.stackCard, styles.stackCard1]} />

			<Animated.View style={[styles.cardWrap, floatStyle]}>
				<LinearGradient colors={["#FEFCE8", "#F5F07A"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
					<View style={styles.blobTopRight} />
					<View style={styles.blobBottomLeft} />
					<View style={styles.watermark}>
						<MaterialCommunityIcons name={note.icon ?? "notebook-outline"} size={110} color="rgba(35, 54, 0, 0.05)" />
					</View>
					<View style={styles.shimmerWrap}>
						<LinearGradient colors={["rgba(255,255,255,0.45)", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
					</View>
					<View style={styles.topRow}>
						<View style={styles.tag}>
							<MaterialCommunityIcons name={note.icon ?? "notebook-outline"} size={13} color="#FFF" />
							<Text style={styles.tagText}>{note.tag ?? "Notitie"}</Text>
						</View>
						<Text style={styles.time}>{note.time}</Text>
					</View>
					<View style={styles.divider} />
					<Text style={styles.title}>{note.title}</Text>
					<Text style={styles.content}>{note.content}</Text>
				</LinearGradient>
			</Animated.View>
		</View>
	);
}

const RADIUS = 24;

const styles = StyleSheet.create({
	scene: {
		marginTop: 16,
		marginBottom: 20,
		paddingTop: 18,
		paddingBottom: 14,
		paddingHorizontal: 8,
	},

	stackCard: {
		position: "absolute",
		left: 8,
		right: 8,
		borderRadius: RADIUS,
		top: 0,
		bottom: 0,
	},
	stackCard1: {
		backgroundColor: "#354E00",
		top: 10,
		transform: [{ rotate: "2deg" }],
		opacity: 0.75,
		shadowColor: "#233600",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.18,
		shadowRadius: 8,
		elevation: 3,
	},
	stackCard2: {
		backgroundColor: "#AACC00",
		top: 18,
		transform: [{ rotate: "-1.5deg" }],
		opacity: 0.6,
		shadowColor: "#233600",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.12,
		shadowRadius: 6,
		elevation: 2,
	},

	cardWrap: {
		borderRadius: RADIUS,
		shadowColor: "#233600",
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.15,
		shadowRadius: 18,
		elevation: 8,
	},

	card: {
		borderRadius: RADIUS,
		padding: 24,
		overflow: "hidden",
	},

	blobTopRight: {
		position: "absolute",
		top: -50,
		right: -50,
		width: 160,
		height: 160,
		borderRadius: 80,
		backgroundColor: "rgba(255, 255, 255, 0.55)",
	},
	blobBottomLeft: {
		position: "absolute",
		bottom: -35,
		left: -35,
		width: 120,
		height: 120,
		borderRadius: 60,
		backgroundColor: "rgba(122, 173, 0, 0.20)",
	},

	watermark: {
		position: "absolute",
		bottom: -10,
		right: -10,
	},

	shimmerWrap: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		height: 60,
		borderTopLeftRadius: RADIUS,
		borderTopRightRadius: RADIUS,
		overflow: "hidden",
	},

	topRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 14,
	},

	tag: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#4b6800b9",
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 20,
	},
	tagText: {
		fontFamily: "InterSemiBold",
		fontSize: 12,
		color: "#ffffff",
		marginLeft: 5,
	},

	time: {
		fontFamily: "InterRegular",
		fontSize: 13,
		color: "rgba(35, 54, 0, 0.50)",
	},

	divider: {
		height: 1,
		backgroundColor: "rgba(35, 54, 0, 0.12)",
		marginBottom: 16,
	},

	title: {
		fontFamily: "InterSemiBold",
		fontSize: 18,
		color: COLORS.primary,
		marginBottom: 10,
		lineHeight: 24,
	},

	content: {
		fontFamily: "InterRegular",
		fontSize: 14,
		color: "rgba(35, 54, 0, 0.72)",
		lineHeight: 22,
	},
});
