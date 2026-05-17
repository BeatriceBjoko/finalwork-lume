import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BackdropBlur, Canvas, Fill, Group, RoundedRect, Shadow, rect, rrect } from "@shopify/react-native-skia";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { COLORS } from "../../constants/theme";
import CustomAlert from "./CustomAlert";

export interface TaskData {
	id: string;
	title: string;
	time: string;
	status: "Voltooid" | "Nog te doen";
	theme: "yellow" | "purple";
	icon: keyof typeof MaterialCommunityIcons.glyphMap;
	description?: string[];
	assignee?: {
		name: string;
		photo?: string;
		initials: string;
	};
	createdBy?: string;
}

interface TaskCardProps {
	task: TaskData;
	expanded: boolean;
	onPress: () => void;
	onToggleStatus?: () => void;
	canManage?: boolean;
	onEdit?: () => void;
	onDelete?: () => void;
	overlap?: boolean;
	stackIndex?: number;
}

const CARD_RADIUS = 10;
const OVERLAP_OFFSET = 12;

export function TaskCard({ task, expanded, onPress, onToggleStatus, canManage = false, onEdit, onDelete, overlap = false, stackIndex = 0 }: TaskCardProps) {
	const [cardWidth, setCardWidth] = useState(0);
	const [cardHeight, setCardHeight] = useState(0);

	const [isDeleteAlertVisible, setDeleteAlertVisible] = useState(false);

	const isYellow = task.theme === "yellow";
	const isCompleted = task.status === "Voltooid";

	const iconCircleBg = isYellow ? "rgba(239, 252, 0, 0.5)" : "#D4CEEA";
	const iconColor = isYellow ? "#464A00" : "#FFFFFF";

	const strokeColor = isYellow ? "rgba(255, 228, 0, 0.60)" : "rgba(196, 176, 230, 0.70)";
	const dropShadowColor = isYellow ? "rgba(239, 252, 0, 0.30)" : "rgba(180, 140, 230, 0.30)";
	const innerShadowColor = isYellow ? "rgba(239, 252, 0, 0.10)" : "rgba(180, 140, 230, 0.10)";

	const glowStart = isYellow ? "rgba(255, 230, 0, 0.42)" : "rgba(196, 176, 230, 0.31)";
	const glowMid = isYellow ? "rgba(255, 230, 0, 0)" : "rgba(196, 176, 230, 0)";

	const descOpacity = useSharedValue(expanded ? 1 : 0);
	useEffect(() => {
		descOpacity.value = withTiming(expanded ? 1 : 0, { duration: 220 });
	}, [expanded]);
	const descStyle = useAnimatedStyle(() => ({ opacity: descOpacity.value }));

	const handleTrashClick = (e: any) => {
		e.stopPropagation();
		setDeleteAlertVisible(true);
	};

	const handleEditClick = (e: any) => {
		e.stopPropagation();
		if (onEdit) onEdit();
	};

	const PAD = 18;
	const hasSize = cardWidth > 0 && cardHeight > 0;
	const clipPath = hasSize ? rrect(rect(0, 0, cardWidth, cardHeight), CARD_RADIUS, CARD_RADIUS) : null;

	return (
		<>
			<Pressable onPress={onPress} style={[styles.pressable, overlap && { marginBottom: -OVERLAP_OFFSET }, { zIndex: stackIndex }]} onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)}>
				<View style={{ position: "relative", minHeight: 72 }} onLayout={(e) => setCardHeight(e.nativeEvent.layout.height)}>
					{hasSize && clipPath && (
						<Canvas style={{ position: "absolute", top: -PAD, left: -PAD, width: cardWidth + PAD * 2, height: cardHeight + PAD * 2 }} pointerEvents="none">
							<Group transform={[{ translateX: PAD }, { translateY: PAD }]}>
								<RoundedRect x={0} y={0} width={cardWidth} height={cardHeight} r={CARD_RADIUS} color="rgba(255,255,255,0.01)">
									<Shadow dx={0} dy={4} blur={4} color={dropShadowColor} />
								</RoundedRect>

								<Group clip={clipPath}>
									<BackdropBlur blur={5} />
									<Fill color="rgba(255, 255, 255, 0.10)" />
									<Group blendMode="screen">
										<RoundedRect x={0} y={0} width={cardWidth} height={cardHeight} r={CARD_RADIUS} color="rgba(255, 255, 255, 0.090)">
											<Shadow dx={0} dy={-4} blur={55} color={innerShadowColor} inner />
										</RoundedRect>
									</Group>
								</Group>
								<RoundedRect x={0} y={0} width={cardWidth} height={cardHeight} r={CARD_RADIUS} color={strokeColor} style="stroke" strokeWidth={1.5} />
							</Group>
						</Canvas>
					)}

					<BlurView intensity={5} tint="light" style={[StyleSheet.absoluteFill, styles.glassClip]} pointerEvents="none" />

					<View style={[StyleSheet.absoluteFill, styles.glassClip]} pointerEvents="none">
						<LinearGradient
							colors={[glowStart, glowMid, "transparent"]}
							start={{ x: 0, y: 0 }}
							end={{ x: 0, y: 1 }}
							style={{ position: "absolute", top: 0, left: 0, right: 0, height: 70, borderTopLeftRadius: CARD_RADIUS, borderTopRightRadius: CARD_RADIUS }}
						/>
					</View>

					<View style={styles.content}>
						<View style={styles.topRow}>
							<View style={[styles.iconCircle, { backgroundColor: iconCircleBg }]}>
								<MaterialCommunityIcons name={task.icon} size={22} color={iconColor} />
							</View>

							<View style={styles.titleBlock}>
								<Text style={styles.title} numberOfLines={expanded ? undefined : 1}>
									{task.title}
								</Text>
								{!expanded && <Text style={styles.timeCollapsed}>{task.time}</Text>}
							</View>

							<View style={styles.chevronCircle}>
								<MaterialCommunityIcons name={expanded ? "chevron-down" : "chevron-right"} size={20} color="#464A00" />
							</View>
						</View>

						{expanded && task.description && (
							<Animated.View style={[styles.descBlock, descStyle]}>
								{task.description.map((line, i) => (
									<Text key={i} style={styles.bullet}>
										• {line}
									</Text>
								))}
							</Animated.View>
						)}

						<View style={[styles.footer, expanded && styles.footerExpanded]}>
							{expanded ? (
								<View style={styles.footerLeft}>
									<Text style={styles.timeExpanded}>{task.time}</Text>

									{canManage && (
										<View style={styles.actionButtons}>
											<Pressable onPress={handleEditClick} style={[styles.actionBtnBase, styles.actionBtnEdit]}>
												<MaterialCommunityIcons name="pencil-outline" size={16} color="#475569" />
											</Pressable>
											<Pressable onPress={handleTrashClick} style={[styles.actionBtnBase, styles.actionBtnDelete]}>
												<MaterialCommunityIcons name="trash-can-outline" size={16} color="#C94B47" />
											</Pressable>
										</View>
									)}
								</View>
							) : (
								<View />
							)}

							<View style={styles.footerRight}>
								{expanded &&
									task.assignee &&
									(task.assignee.photo ? (
										<View style={styles.assigneeRing}>
											<Image source={{ uri: task.assignee.photo }} style={styles.assigneePhoto} />
										</View>
									) : (
										<View style={[styles.assigneeRing, styles.initialsCircle]}>
											<Text style={styles.initials}>{task.assignee.initials}</Text>
										</View>
									))}

								<Pressable
									onPress={(e) => {
										e.stopPropagation();
										if (onToggleStatus) onToggleStatus();
									}}
									style={[styles.badge, isCompleted ? styles.badgeDone : styles.badgeOpen]}
								>
									<Text style={[styles.badgeText, isCompleted ? styles.badgeTextDone : styles.badgeTextOpen]}>{task.status}</Text>
								</Pressable>
							</View>
						</View>
					</View>
				</View>
			</Pressable>

			<CustomAlert
				visible={isDeleteAlertVisible}
				title="Taak verwijderen?"
				message="Weet je zeker dat je deze taak wilt verwijderen? Dit kan niet ongedaan worden gemaakt."
				confirmText="Verwijderen"
				cancelText="Annuleren"
				primaryLeft={true}
				onConfirm={() => {
					setDeleteAlertVisible(false);
					if (onDelete) onDelete();
				}}
				onCancel={() => setDeleteAlertVisible(false)}
			/>
		</>
	);
}

const styles = StyleSheet.create({
	pressable: { marginBottom: 8 },
	glassClip: { borderRadius: CARD_RADIUS, overflow: "hidden" },
	content: { padding: 14, paddingBottom: 18 },
	topRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
	iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 4, elevation: 4 },
	titleBlock: { flex: 1, marginTop: 2 },
	title: { fontFamily: "InterSemiBold", fontSize: 16, color: COLORS.primary, marginBottom: 2, lineHeight: 20 },
	timeCollapsed: { fontFamily: "InterRegular", fontSize: 14, color: COLORS.primary, opacity: 0.6 },
	timeExpanded: { fontFamily: "InterRegular", fontSize: 12, color: "#475569" },
	chevronCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: "rgba(70, 74, 0, 0.35)", justifyContent: "center", alignItems: "center", marginTop: 2 },
	descBlock: { paddingLeft: 54, paddingRight: 8, marginTop: 10 },
	bullet: { fontFamily: "InterRegular", fontSize: 13, color: COLORS.primary, lineHeight: 21, marginBottom: 2 },
	footer: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", marginTop: 10 },
	footerExpanded: { justifyContent: "space-between", marginTop: 14 },
	footerLeft: { flexDirection: "row", alignItems: "center", gap: 14 },

	actionButtons: { flexDirection: "row", gap: 8 },
	actionBtnBase: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: "rgba(255, 255, 255, 0.85)",
		borderWidth: 1,
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.08,
		shadowRadius: 2,
		elevation: 2,
	},
	actionBtnEdit: {
		borderColor: "rgba(71, 85, 105, 0.3)",
	},
	actionBtnDelete: {
		borderColor: "rgba(201, 75, 71, 0.35)",
		backgroundColor: "rgba(255, 245, 245, 0.8)",
	},

	footerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
	assigneeRing: { borderRadius: 20, borderWidth: 2, borderColor: COLORS.accent, padding: 1 },
	assigneePhoto: { width: 34, height: 34, borderRadius: 17 },
	initialsCircle: { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(239, 252, 0, 0.30)" },
	initials: { fontFamily: "InterBold", fontSize: 11, color: COLORS.primary },
	badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
	badgeDone: { backgroundColor: "#d4eaaa5f" },
	badgeOpen: { backgroundColor: "#f2e3c676" },
	badgeText: { fontFamily: "InterSemiBold", fontSize: 11 },
	badgeTextDone: { color: "#4A7A1E" },
	badgeTextOpen: { color: "#C07828" },
});
