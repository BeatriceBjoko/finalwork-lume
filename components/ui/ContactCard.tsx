import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurMask, Canvas, Circle, Group, RoundedRect, Shadow, rect, rrect } from "@shopify/react-native-skia";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Animated, Image, Linking, Pressable, StyleSheet, Text, View } from "react-native";

export interface Contact {
	id: string;
	name: string;
	role: string;
	phone: string;
	photo: string | null;
	address: string;
	blob1: string;
	blob2: string;
}

interface ContactCardProps {
	contact: Contact;
	index: number;
	cardWidth: number;
	cardHeight: number;
	isFocused: boolean;
	onFocus: () => void;
	onEdit?: (id: string) => void;
	onDelete?: (id: string) => void;
}

const ContactCard: React.FC<ContactCardProps> = ({ contact, index, cardWidth, cardHeight, isFocused, onFocus, onEdit, onDelete }) => {
	const { t } = useTranslation();
	const SKIA_PADDING = 30;
	const isStacked = index > 0;

	const [menuVisible, setMenuVisible] = useState(false);
	const [isFlipped, setIsFlipped] = useState(false);

	const flipAnim = useRef(new Animated.Value(0)).current;
	const focusAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		Animated.spring(focusAnim, {
			toValue: isFocused ? 1 : 0,
			friction: 7,
			tension: 40,
			useNativeDriver: true,
		}).start();

		if (!isFocused && isFlipped) {
			setIsFlipped(false);
			Animated.timing(flipAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
			setMenuVisible(false);
		}
	}, [isFocused, isFlipped]);

	const handleCardPress = () => {
		setMenuVisible(false);

		if (!isFocused) {
			onFocus();
		} else {
			Animated.spring(flipAnim, {
				toValue: isFlipped ? 0 : 1,
				friction: 8,
				tension: 10,
				useNativeDriver: true,
			}).start();
			setIsFlipped(!isFlipped);
		}
	};

	const handleCall = () => {
		const formattedNumber = contact.phone.replace(/\s+/g, "");
		Linking.openURL(`tel:${formattedNumber}`).catch(() => {
			Alert.alert("Fout", "Kan de telefoon-app niet openen op dit apparaat.");
		});
	};

	const frontRotateY = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });
	const backRotateY = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ["180deg", "360deg"] });
	const translateY = focusAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -15] });

	const cardClipPath = useMemo(() => rrect(rect(0, 0, cardWidth, cardHeight), 24, 24), [cardWidth, cardHeight]);

	const SkiaBackground = () => (
		<Canvas style={{ position: "absolute", top: -SKIA_PADDING, left: -SKIA_PADDING, width: cardWidth + SKIA_PADDING * 2, height: cardHeight + SKIA_PADDING * 2 }} pointerEvents="none">
			<Group transform={[{ translateX: SKIA_PADDING }, { translateY: SKIA_PADDING }]}>
				<Group clip={cardClipPath}>
					<RoundedRect rect={cardClipPath} color="rgba(255, 255, 255, 0.90)" />
					<Circle cx={cardWidth * 0.85} cy={10} r={65} color={contact.blob1}>
						<BlurMask blur={40} style="normal" />
					</Circle>
					<Circle cx={cardWidth * 0.15} cy={cardHeight - 10} r={75} color={contact.blob2}>
						<BlurMask blur={45} style="normal" />
					</Circle>
					<RoundedRect rect={cardClipPath} color="rgba(255, 255, 255, 0.3)" />
					<RoundedRect rect={cardClipPath} color="transparent">
						<Shadow dx={-2} dy={-2} blur={4} color="rgba(255, 255, 255, 1)" inner />
						<Shadow dx={3} dy={5} blur={8} color="rgba(35, 54, 0, 0.06)" inner />
					</RoundedRect>
				</Group>
				<RoundedRect rect={cardClipPath} color="rgba(255, 255, 255, 0.7)" style="stroke" strokeWidth={1.5} />
			</Group>
		</Canvas>
	);

	return (
		<Animated.View
			style={[
				styles.cardWrapper,
				{
					marginTop: isStacked ? -60 : 0,
					zIndex: isFocused ? 100 : index,
					transform: [{ translateY }],
				},
			]}
		>
			<Animated.View style={[styles.cardFace, { transform: [{ rotateY: frontRotateY }] }]}>
				<View style={[styles.shadowBase, isFocused && styles.shadowBaseFocused]} />
				<Pressable style={StyleSheet.absoluteFill} onPress={handleCardPress} />
				<SkiaBackground />

				<View style={styles.cardContent} pointerEvents="box-none">
					<View style={styles.cardTopRow} pointerEvents="box-none">
						<View style={styles.avatarContainer} pointerEvents="none">
							{contact.photo ? (
								<Image source={{ uri: contact.photo }} style={styles.avatar} />
							) : (
								<View style={styles.dummyAvatar}>
									<Ionicons name="person" size={24} color="#233600" />
								</View>
							)}
						</View>
						<View style={styles.textContainer} pointerEvents="none">
							<Text style={styles.contactName}>{contact.name}</Text>
							<Text style={styles.contactRole}>{contact.role}</Text>
						</View>

						<Pressable style={styles.editButton} onPress={() => setMenuVisible(!menuVisible)} hitSlop={15}>
							<MaterialCommunityIcons name="dots-vertical" size={24} color="#233600" />
						</Pressable>
					</View>

					<View style={styles.cardBottomRow} pointerEvents="box-none">
						<Pressable style={styles.phonePill} onPress={handleCall}>
							<Ionicons name="call" size={14} color="#233600" style={{ marginRight: 6 }} />
							<Text style={styles.phoneText}>{contact.phone}</Text>
						</Pressable>
					</View>
				</View>

				{menuVisible && (
					<View style={styles.dropdownMenu}>
						<Pressable
							style={styles.dropdownItem}
							onPress={() => {
								setMenuVisible(false);
								onEdit?.(contact.id);
							}}
						>
							<Ionicons name="pencil" size={16} color="#233600" style={styles.dropdownIcon} />
							<Text style={styles.dropdownText}>{t("importantContacts.editAction", "Bewerken")}</Text>
						</Pressable>
						<View style={styles.dropdownDivider} />
						<Pressable
							style={styles.dropdownItem}
							onPress={() => {
								setMenuVisible(false);
								onDelete?.(contact.id);
							}}
						>
							<Ionicons name="trash" size={16} color="#ef4444" style={styles.dropdownIcon} />
							<Text style={[styles.dropdownText, { color: "#ef4444" }]}>{t("importantContacts.deleteAction", "Verwijderen")}</Text>
						</Pressable>
					</View>
				)}
			</Animated.View>

			<Animated.View style={[styles.cardFace, styles.cardBack, { transform: [{ rotateY: backRotateY }] }]} pointerEvents={isFlipped ? "auto" : "none"}>
				<View style={[styles.shadowBase, isFocused && styles.shadowBaseFocused]} />
				<Pressable style={{ flex: 1, justifyContent: "center", alignItems: "center" }} onPress={handleCardPress}>
					<SkiaBackground />
					<View style={styles.cardContentBack} pointerEvents="none">
						<Ionicons name="location" size={32} color="#233600" style={{ marginBottom: 8 }} />
						<Text style={styles.backTitle}>{t("importantContacts.addressDetails", "Adresgegevens")}</Text>
						<Text style={styles.backAddress}>{contact.address}</Text>
					</View>
				</Pressable>
			</Animated.View>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	cardWrapper: { width: "100%", height: 140, position: "relative" },
	cardFace: { width: "100%", height: "100%", position: "absolute", backfaceVisibility: "hidden" },
	cardBack: {},
	shadowBase: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "white",
		borderRadius: 24,
		shadowColor: "#233600",
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.1,
		shadowRadius: 10,
		elevation: 6,
	},
	shadowBaseFocused: {
		shadowOffset: { width: 0, height: 12 },
		shadowOpacity: 0.15,
		shadowRadius: 20,
		elevation: 12,
	},
	cardContent: { flex: 1, padding: 20, justifyContent: "space-between", zIndex: 2 },
	cardTopRow: { flexDirection: "row", alignItems: "center" },
	avatarContainer: { marginRight: 16 },
	dummyAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: "rgba(255, 255, 255, 0.7)", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "rgba(255, 179, 0, 0.35)" },
	avatar: { width: 50, height: 50, borderRadius: 25 },
	textContainer: { flex: 1 },
	contactName: { fontFamily: "BricolageMedium", fontSize: 18, color: "#233600" },
	contactRole: { fontFamily: "InterRegular", fontSize: 14, color: "#475569", marginTop: 2 },
	editButton: { padding: 4 },
	cardBottomRow: { flexDirection: "row", justifyContent: "flex-start" },
	phonePill: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255, 255, 255, 0.8)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255, 255, 255, 1)" },
	phoneText: { fontFamily: "InterMedium", fontSize: 13, color: "#233600" },
	cardContentBack: { flex: 1, padding: 20, justifyContent: "center", alignItems: "center", zIndex: 2 },
	backTitle: { fontFamily: "BricolageMedium", fontSize: 16, color: "#233600", marginBottom: 4 },
	backAddress: { fontFamily: "InterRegular", fontSize: 14, color: "#475569", textAlign: "center", lineHeight: 20 },
	dropdownMenu: {
		position: "absolute",
		top: 45,
		right: 20,
		backgroundColor: "rgba(255,255,255,0.95)",
		borderRadius: 12,
		paddingVertical: 8,
		width: 140,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 5,
		zIndex: 999,
		borderWidth: 1,
		borderColor: "rgba(35, 54, 0, 0.05)",
	},
	dropdownItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 16 },
	dropdownIcon: { marginRight: 10 },
	dropdownText: { fontFamily: "InterMedium", fontSize: 14, color: "#233600" },
	dropdownDivider: { height: 1, backgroundColor: "rgba(35, 54, 0, 0.05)", marginHorizontal: 12 },
});

export default React.memo(ContactCard);
