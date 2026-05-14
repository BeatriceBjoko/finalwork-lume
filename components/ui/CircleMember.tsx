import { Ionicons } from "@expo/vector-icons";
import { BlurMask, Canvas, Group, Path, Rect, Shadow, Image as SkImage, useImage } from "@shopify/react-native-skia";
import { BlurView } from "expo-blur";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../constants/theme";

interface CircleMemberProps {
	name: string;
	role: string;
	photoUrl?: string | number | null;
	size: number;
	onPressOptions?: () => void;
}

export default function CircleMember({ name, role, photoUrl, size, onPressOptions }: CircleMemberProps) {
	const CANVAS_PADDING = size * 0.45;

	const skiaImage = useImage(photoUrl);

	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.substring(0, 2)
			.toUpperCase();
	};

	const SVG_PATH = "M 48 -4 C 75 -2 96 20 96 50 C 96 82 72 98 45 98 C 20 98 6 70 5 55 C 4 30 22 -4 48 -4 Z";
	const scale = size / 100;

	const anchorX = 82;
	const anchorY = 14;

	const glassLeft = anchorX * scale - 16;
	const glassTop = anchorY * scale - 16;

	return (
		<View style={{ width: size, alignItems: "center" }}>
			<View style={{ width: size, height: size, position: "relative" }}>
				<Canvas style={{ width: size + CANVAS_PADDING * 2, height: size + CANVAS_PADDING * 2, position: "absolute", top: -CANVAS_PADDING, left: -CANVAS_PADDING }} pointerEvents="none">
					<Group transform={[{ translateX: CANVAS_PADDING }, { translateY: CANVAS_PADDING }, { scaleX: scale }, { scaleY: scale }]}>
						<Path path={SVG_PATH} color="white">
							<Shadow dx={0} dy={-7} blur={10} color="rgba(182, 232, 54, 0.46)" />
							<Shadow dx={0} dy={7} blur={10} color="rgba(156, 217, 0, 0.53)" />
						</Path>

						<Group clip={SVG_PATH}>
							{skiaImage ? <SkImage image={skiaImage} x={-10} y={-10} width={120} height={120} fit="cover" /> : <Rect x={-10} y={-10} width={120} height={120} color="#E2E8F0" />}

							<Path path={SVG_PATH} color="rgba(156, 217, 0, 0.42)" style="stroke" strokeWidth={25 / scale}>
								<BlurMask blur={15 / scale} style="normal" />
							</Path>
						</Group>

						<Path path={SVG_PATH} color="rgba(154, 217, 0, 0.6)" style="stroke" strokeWidth={3 / scale} />
					</Group>
				</Canvas>

				{!photoUrl && (
					<View style={{ position: "absolute", width: size, height: size, justifyContent: "center", alignItems: "center" }} pointerEvents="none">
						<Text style={{ fontFamily: "BricolageBold", fontSize: size * 0.3, color: "#94A3B8" }}>{getInitials(name)}</Text>
					</View>
				)}

				{onPressOptions && (
					<Pressable style={[styles.glassButton, { top: glassTop, left: glassLeft }]} onPress={onPressOptions}>
						<BlurView intensity={15} tint="light" style={styles.glassBlur}>
							<View style={styles.glassInner}>
								<Ionicons name="ellipsis-vertical" size={16} color="#FFFFFF" />
							</View>
						</BlurView>
					</Pressable>
				)}
			</View>

			<View style={styles.textContainer}>
				<Text style={styles.nameText} numberOfLines={1}>
					{name}
				</Text>
				<Text style={styles.roleText} numberOfLines={1}>
					{role}
				</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	glassButton: {
		position: "absolute",
		width: 32,
		height: 32,
		borderRadius: 16,
		overflow: "hidden",
		borderWidth: 1.5,
		borderColor: "rgba(255, 255, 255, 0.6)",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 5,
		zIndex: 10,
	},
	glassBlur: { flex: 1 },
	glassInner: {
		flex: 1,
		backgroundColor: "rgba(255, 255, 255, 0.15)",
		justifyContent: "center",
		alignItems: "center",
	},
	textContainer: {
		marginTop: 12,
		alignItems: "center",
	},
	nameText: {
		fontFamily: FONTS.body,
		fontSize: 14,
		color: "#131F00",
	},
	roleText: {
		fontFamily: FONTS.body,
		fontSize: 12,
		color: "rgba(19, 31, 0, 0.6)",
		marginTop: 2,
	},
});
