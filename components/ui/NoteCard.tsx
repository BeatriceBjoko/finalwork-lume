import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { Alert, Dimensions, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { COLORS } from "../../constants/theme";
import CustomAlert from "./CustomAlert";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export interface NoteData {
	id: string;
	title: string;
	time: string;
	content: string;
	tag?: string;
	icon?: keyof typeof MaterialCommunityIcons.glyphMap;
	isImportant?: boolean;
	author?: { name: string; photo?: string; initials?: string };
	images?: string[];
	createdBy?: string;
}

interface NoteCardProps {
	note: NoteData;
	onToggleImportant?: () => void;
	onEdit?: () => void;
	onDelete?: () => void;
}

export function NoteCard({ note, onToggleImportant, onEdit, onDelete }: NoteCardProps) {
	const floatY = useSharedValue(0);
	const translateX = useSharedValue(0);
	const startX = useSharedValue(0);

	const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
	const [isDeleteAlertVisible, setDeleteAlertVisible] = useState(false);

	useEffect(() => {
		floatY.value = withRepeat(withSequence(withTiming(-5, { duration: 2800 }), withTiming(0, { duration: 2800 })), -1, true);
	}, []);

	const hasImages = note.images && note.images.length > 0;
	const SWIPE_LIMIT = -220;

	const panGesture = Gesture.Pan()
		.onStart(() => {
			startX.value = translateX.value;
		})
		.onUpdate((event) => {
			if (!hasImages) return;
			let newVal = startX.value + event.translationX;
			if (newVal > 0) newVal = 0;
			if (newVal < SWIPE_LIMIT - 50) newVal = SWIPE_LIMIT - 50;
			translateX.value = newVal;
		})
		.onEnd(() => {
			if (!hasImages) return;
			if (translateX.value < SWIPE_LIMIT / 2) {
				translateX.value = withSpring(SWIPE_LIMIT, { damping: 14 });
			} else {
				translateX.value = withSpring(0, { damping: 14 });
			}
		});

	const floatStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: floatY.value }, { translateX: translateX.value }],
	}));

	const handleOptionsClick = () => {
		Alert.alert("Notitie Opties", "Wat wil je doen met deze notitie?", [
			{ text: "Bewerken", onPress: onEdit },
			{ text: "Verwijderen", onPress: () => setDeleteAlertVisible(true), style: "destructive" },
			{ text: "Annuleren", style: "cancel" },
		]);
	};

	return (
		<View style={styles.scene}>
			<View style={[styles.stackCard, styles.stackCard2]} />
			<View style={[styles.stackCard, styles.stackCard1]} />

			{hasImages && (
				<Pressable style={styles.imageUnderlay} onPress={() => setIsImageViewerOpen(true)}>
					<Image source={{ uri: note.images![0] }} style={styles.underlayImage} />
					<View style={styles.underlayOverlay}>
						<MaterialCommunityIcons name="magnify-plus-outline" size={36} color="#FFF" />
						<Text style={styles.underlayText}>Bekijk {note.images!.length} foto's</Text>
					</View>
				</Pressable>
			)}

			<GestureDetector gesture={panGesture}>
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
								<Pressable onPress={onToggleImportant} style={styles.actionBtn}>
									<MaterialCommunityIcons name={note.isImportant ? "heart" : "heart-outline"} size={22} color={note.isImportant ? "#C94B47" : "rgba(35, 54, 0, 0.4)"} />
								</Pressable>

								{(onEdit || onDelete) && (
									<Pressable onPress={handleOptionsClick} style={styles.actionBtn}>
										<MaterialCommunityIcons name="dots-horizontal" size={24} color="rgba(35, 54, 0, 0.4)" />
									</Pressable>
								)}
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
									<MaterialCommunityIcons name="gesture-swipe-left" size={14} color="rgba(35, 54, 0, 0.4)" style={{ marginRight: 4 }} />
									<View style={[styles.dot, styles.dotActive]} />
									<View style={styles.dot} />
								</View>
							)}
						</View>
					</LinearGradient>
				</Animated.View>
			</GestureDetector>

			<Modal visible={isImageViewerOpen} transparent={true} animationType="fade">
				<View style={styles.viewerContainer}>
					<Pressable style={styles.viewerCloseBtn} onPress={() => setIsImageViewerOpen(false)}>
						<Ionicons name="close" size={32} color="#FFF" />
					</Pressable>
					<ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
						{note.images?.map((imgUri, idx) => (
							<View key={idx} style={styles.viewerImageWrapper}>
								<Image source={{ uri: imgUri }} style={styles.viewerImage} resizeMode="contain" />
								<Text style={styles.viewerCounter}>
									{idx + 1} / {note.images!.length}
								</Text>
							</View>
						))}
					</ScrollView>
				</View>
			</Modal>

			<CustomAlert
				visible={isDeleteAlertVisible}
				title="Notitie verwijderen?"
				message="Weet je zeker dat je deze notitie wilt verwijderen? Dit kan niet ongedaan worden gemaakt."
				confirmText="Verwijderen"
				cancelText="Annuleren"
				primaryLeft={true}
				onConfirm={() => {
					setDeleteAlertVisible(false);
					if (onDelete) onDelete();
				}}
				onCancel={() => setDeleteAlertVisible(false)}
			/>
		</View>
	);
}

const RADIUS = 24;

const styles = StyleSheet.create({
	scene: { marginTop: 16, marginBottom: 20, paddingTop: 18, paddingBottom: 14, paddingHorizontal: 8 },
	stackCard: { position: "absolute", left: 8, right: 8, borderRadius: RADIUS, top: 0, bottom: 0 },
	stackCard1: { backgroundColor: "#354E00", top: 10, transform: [{ rotate: "2deg" }], opacity: 0.75 },
	stackCard2: { backgroundColor: "#AACC00", top: 18, transform: [{ rotate: "-1.5deg" }], opacity: 0.6 },
	imageUnderlay: { position: "absolute", top: 18, bottom: 14, left: 8, right: 8, borderRadius: RADIUS, backgroundColor: "#000", overflow: "hidden" },
	underlayImage: { width: "100%", height: "100%", opacity: 0.5 },
	underlayOverlay: { position: "absolute", top: 0, bottom: 0, right: 20, justifyContent: "center", alignItems: "center" },
	underlayText: { fontFamily: "InterSemiBold", color: "#FFF", fontSize: 13, marginTop: 8 },
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
	topRight: { flexDirection: "row", alignItems: "center", gap: 4 },
	time: { fontFamily: "InterRegular", fontSize: 13, color: "rgba(35, 54, 0, 0.50)", marginRight: 4 },
	actionBtn: { padding: 4 },
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
	viewerContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)" },
	viewerCloseBtn: { position: "absolute", top: 50, right: 20, zIndex: 10, padding: 10, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 30 },
	viewerImageWrapper: { width: SCREEN_WIDTH, height: "100%", justifyContent: "center", alignItems: "center" },
	viewerImage: { width: "100%", height: "80%" },
	viewerCounter: { position: "absolute", bottom: 40, color: "#FFF", fontFamily: "InterMedium", fontSize: 16, backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
});
