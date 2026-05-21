import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS, FONTS } from "../../constants/theme";
import { useSession } from "../../context";
import { ScanIcon } from "./TabIcons";

export function TopBar() {
	const router = useRouter();
	const { userData, user } = useSession();

	const photoUrl = userData?.photoUrl || user?.photoURL || null;

	const getInitials = () => {
		const name = userData?.name || user?.displayName || user?.email || "?";
		return name.substring(0, 2).toUpperCase();
	};

	const handleScanPress = () => {
		Haptics.selectionAsync();
		router.push("/scan");
	};

	const handleProfilePress = () => {
		Haptics.selectionAsync();
		router.push("/profile");
	};

	return (
		<View style={styles.container}>
			<Pressable style={styles.iconBtn} onPress={handleScanPress} hitSlop={6}>
				<ScanIcon color={COLORS.primary} size={22} strokeWidth={2} />
			</Pressable>

			<View style={styles.logoWrap}>
				<Image source={require("../../assets/images/logo-lume.png")} style={styles.logoImage} resizeMode="contain" />
			</View>

			<Pressable style={styles.profileBtn} onPress={handleProfilePress} hitSlop={6}>
				{photoUrl ? (
					<Image source={{ uri: photoUrl }} style={styles.profileImage} />
				) : (
					<View style={styles.profileInitials}>
						<Text style={styles.initialsText}>{getInitials()}</Text>
					</View>
				)}
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 20,
		paddingTop: 8,
		paddingBottom: 6,
		backgroundColor: "transparent",
	},
	iconBtn: {
		width: 42,
		height: 42,
		borderRadius: 21,
		backgroundColor: COLORS.white,
		borderWidth: 2,
		borderColor: COLORS.accent,
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#233600",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.06,
		shadowRadius: 4,
		elevation: 2,
	},
	logoWrap: {
		justifyContent: "center",
		alignItems: "center",
	},
	logoImage: {
		width: 132,
		height: 42,
	},
	profileBtn: {
		width: 42,
		height: 42,
		borderRadius: 21,
		borderWidth: 2,
		borderColor: COLORS.accent,
		justifyContent: "center",
		alignItems: "center",
		overflow: "hidden",
		backgroundColor: COLORS.white,
	},
	profileImage: {
		width: "100%",
		height: "100%",
	},
	profileInitials: {
		width: "100%",
		height: "100%",
		backgroundColor: "rgba(239, 252, 0, 0.4)",
		justifyContent: "center",
		alignItems: "center",
	},
	initialsText: {
		fontFamily: FONTS.heading,
		fontSize: 14,
		color: COLORS.primary,
	},
});
