import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { COLORS } from "../../constants/theme";

export interface NoteData {
	id: string;
	title: string;
	time: string;
	content: string;
	tag?: string;
	icon?: keyof typeof MaterialCommunityIcons.glyphMap;
	isImportant?: boolean;
	author?: {
		name: string;
		photo?: string;
		initials?: string;
	};
	images?: string[];
}

interface NoteCardProps {
	note: NoteData;
	onToggleImportant?: () => void;
}

export function NoteCard({ note, onToggleImportant }: NoteCardProps) {
	const floatY = useSharedValue(0);

	useEffect(() => {
		floatY.value = withRepeat(withSequence(withTiming(-5, { duration: 2800 }), withTiming(0, { duration: 2800 })), -1, true);
	}, []);

	const floatStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: floatY.value }],
	}));

	const hasImages = note.images && note.images.length > 0;

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
						<View style={styles.tagWrap}>
							<View style={styles.tag}>
								<MaterialCommunityIcons name={note.icon ?? "notebook-outline"} size={13} color="#FFF" />
								<Text style={styles.tagText}>{note.tag ?? "Notitie"}</Text>
							</View>
						</View>

						<View style={styles.topRight}>
							<Text style={styles.time}>{note.time}</Text>
							<Pressable onPress={onToggleImportant} style={styles.heartBtn}>
								<MaterialCommunityIcons name={note.isImportant ? "heart" : "heart-outline"} size={22} color={note.isImportant ? "#C94B47" : "rgba(35, 54, 0, 0.4)"} />
							</Pressable>
						</View>
					</View>

					<View style={styles.divider} />

					<Text style={styles.title}>{note.title}</Text>
					<Text style={styles.content}>{note.content}</Text>

					<View style={styles.bottomRow}>
						{note.author && (
							<View style={styles.authorWrap}>
								{note.author.photo ? (
									<Image source={{ uri: note.author.photo }} style={styles.authorPhoto} />
								) : (
									<View style={styles.authorInitialsCircle}>
										<Text style={styles.authorInitialsText}>{note.author.initials}</Text>
									</View>
								)}
								<Text style={styles.authorName}>{note.author.name}</Text>
							</View>
						)}

						{hasImages && (
							<View style={styles.dotsWrap}>
								<View style={[styles.dot, styles.dotActive]} />
								<View style={styles.dot} />
								<View style={styles.dot} />
							</View>
						)}
					</View>
				</LinearGradient>
			</Animated.View>
		</View>
	);
}

const RADIUS = 24;

const styles = StyleSheet.create({
	scene: { marginTop: 16, marginBottom: 20, paddingTop: 18, paddingBottom: 14, paddingHorizontal: 8 },
	stackCard: { position: "absolute", left: 8, right: 8, borderRadius: RADIUS, top: 0, bottom: 0 },
	stackCard1: { backgroundColor: "#354E00", top: 10, transform: [{ rotate: "2deg" }], opacity: 0.75, shadowColor: "#233600", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 3 },
	stackCard2: { backgroundColor: "#AACC00", top: 18, transform: [{ rotate: "-1.5deg" }], opacity: 0.6, shadowColor: "#233600", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 2 },
	cardWrap: { borderRadius: RADIUS, shadowColor: "#233600", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 18, elevation: 8 },
	card: { borderRadius: RADIUS, padding: 24, paddingBottom: 16, overflow: "hidden" },
	blobTopRight: { position: "absolute", top: -50, right: -50, width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(255, 255, 255, 0.55)" },
	blobBottomLeft: { position: "absolute", bottom: -35, left: -35, width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(122, 173, 0, 0.20)" },
	watermark: { position: "absolute", bottom: -10, right: -10 },
	shimmerWrap: { position: "absolute", top: 0, left: 0, right: 0, height: 60, borderTopLeftRadius: RADIUS, borderTopRightRadius: RADIUS, overflow: "hidden" },

	topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
	tagWrap: { flex: 1 },
	tag: { flexDirection: "row", alignItems: "center", backgroundColor: "#4b6800b9", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, alignSelf: "flex-start" },
	tagText: { fontFamily: "InterSemiBold", fontSize: 12, color: "#ffffff", marginLeft: 5 },
	topRight: { flexDirection: "row", alignItems: "center", gap: 10 },
	time: { fontFamily: "InterRegular", fontSize: 13, color: "rgba(35, 54, 0, 0.50)" },
	heartBtn: { padding: 2 },

	divider: { height: 1, backgroundColor: "rgba(35, 54, 0, 0.12)", marginBottom: 16 },
	title: { fontFamily: "InterSemiBold", fontSize: 18, color: COLORS.primary, marginBottom: 10, lineHeight: 24 },
	content: { fontFamily: "InterRegular", fontSize: 14, color: "rgba(35, 54, 0, 0.72)", lineHeight: 22, minHeight: 40 },

	bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20 },
	authorWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
	authorPhoto: { width: 24, height: 24, borderRadius: 12 },
	authorInitialsCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(35, 54, 0, 0.1)", justifyContent: "center", alignItems: "center" },
	authorInitialsText: { fontFamily: "InterBold", fontSize: 9, color: COLORS.primary },
	authorName: { fontFamily: "InterMedium", fontSize: 12, color: "rgba(35, 54, 0, 0.6)" },

	dotsWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
	dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(35, 54, 0, 0.15)" },
	dotActive: { backgroundColor: "rgba(35, 54, 0, 0.6)", width: 8, height: 8, borderRadius: 4 },
});
