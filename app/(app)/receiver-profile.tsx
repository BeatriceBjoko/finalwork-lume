import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { BackdropBlur, BlurMask, Canvas, Circle, Fill, FillType, Group, RoundedRect, Shadow, Skia, LinearGradient as SkiaGradient, rect, rrect, vec } from "@shopify/react-native-skia";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { COLORS, FONTS } from "../../constants/theme";

const PHOTO_SIZE = 130;

const MOCK_MEDICAL_DATA = [
	{ id: "1", title: "Medicatie", subtitle: "Metformine 500mg, Lisinopril 10mg", icon: "pill", highlighted: true },
	{ id: "2", title: "Allergieën", subtitle: "Penicilline, noten", icon: "alert-outline", highlighted: false },
	{ id: "3", title: "Diagnoses", subtitle: "Diabetes type 2, lichte dementie", icon: "file-document-outline", highlighted: true },
	{ id: "4", title: "Laatste huisartsbezoek", subtitle: "15 maart 2026", icon: "calendar-blank-outline", highlighted: false },
];

export default function ReceiverProfileScreen() {
	const router = useRouter();
	const { width } = useWindowDimensions();

	const [name, setName] = useState("Oma Marie");
	const [dob, setDob] = useState("12-03-1941");
	const [hobbies, setHobbies] = useState("Schaken");
	const [address, setAddress] = useState("Hofstraat 12, 9000 Gent");
	const [profileImage, setProfileImage] = useState<string | null>(null);

	// Skia dimensies voor de medische kaart
	const cardWidth = width - 48;
	const [cardHeight, setCardHeight] = useState(300);

	// Padding voor canvas
	const SKIA_PADDING = 30;

	const getInitials = (userName: string) => {
		if (!userName) return "?";
		return userName
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	// trick voor drop shadow
	const outerClipPath = useMemo(() => {
		if (cardWidth <= 0 || cardHeight <= 0) return null;
		const path = Skia.Path.Make();
		path.addRect(rect(-SKIA_PADDING, -SKIA_PADDING, cardWidth + SKIA_PADDING * 2, cardHeight + SKIA_PADDING * 2));
		path.addRRect(rrect(rect(0, 0, cardWidth, cardHeight), 16, 16));
		path.setFillType(FillType.EvenOdd);
		return path;
	}, [cardWidth, cardHeight]);

	return (
		<SafeAreaView style={styles.safeArea}>
			<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
				<View style={styles.headerRow}>
					<Pressable onPress={() => router.back()} style={styles.backButton}>
						<Ionicons name="arrow-undo-outline" size={24} color="#233600" />
					</Pressable>
				</View>

				<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
					<View style={styles.titleContainer}>
						<View style={styles.titleRow}>
							<Text style={styles.titleText}>Zorgontvanger </Text>
							<View style={styles.highlightWrapper}>
								<Text style={styles.titleText}>overzicht</Text>
							</View>
						</View>
						<Text style={styles.subtitle}>Informatie over je dierbare</Text>
					</View>

					<View style={styles.photoContainer}>
						<Pressable style={styles.photoGlow}>
							<View style={styles.photoBorder}>
								<View style={styles.photoClip}>
									{profileImage ? (
										<Image source={{ uri: profileImage }} style={styles.photo} />
									) : (
										<View style={styles.initialsBox}>
											<Text style={styles.initialsText}>{getInitials(name)}</Text>
										</View>
									)}
									<View style={styles.photoInnerGlow} pointerEvents="none" />
								</View>
							</View>
							<View style={styles.cameraBadge}>
								<MaterialCommunityIcons name="camera-plus-outline" size={20} color={COLORS.primary} />
							</View>
						</Pressable>
					</View>

					<View style={styles.section}>
						<Text style={styles.sectionHeader}>Persoonlijke gegevens</Text>
						<Input label="Naam" value={name} onChangeText={setName} variant="outline" />

						<View style={styles.row}>
							<View style={{ flex: 1, marginRight: 8 }}>
								<Text style={styles.inputLabel}>Geboortedatum</Text>
								<Pressable style={styles.fakeInput}>
									<Text style={styles.fakeInputText}>{dob}</Text>
								</Pressable>
							</View>
							<View style={{ flex: 1, marginLeft: 8 }}>
								<Input label="Hobby's" value={hobbies} onChangeText={setHobbies} variant="outline" />
							</View>
						</View>

						<Input label="Adres" value={address} onChangeText={setAddress} variant="outline" />
					</View>

					<View style={styles.section}>
						<Text style={styles.sectionHeader}>Medische informatie</Text>

						<View style={styles.medicalCardWrapper}>
							{cardHeight > 0 && outerClipPath && (
								<Canvas
									style={{
										position: "absolute",
										top: -SKIA_PADDING,
										left: -SKIA_PADDING,
										width: cardWidth + SKIA_PADDING * 2,
										height: cardHeight + SKIA_PADDING * 2,
									}}
									pointerEvents="none"
								>
									<Group transform={[{ translateX: SKIA_PADDING }, { translateY: SKIA_PADDING }]}>
										{/* drop shadow */}
										<Group clip={outerClipPath}>
											<RoundedRect x={0} y={0} width={cardWidth} height={cardHeight} r={16} color="white">
												<Shadow dx={0} dy={4} blur={9.2} color="rgba(70, 104, 5, 0.5)" />
											</RoundedRect>
										</Group>

										<Group clip={rrect(rect(0, 0, cardWidth, cardHeight), 16, 16)}>
											{/* Achtergrond Blur */}
											<BackdropBlur blur={50} />

											<Circle cx={cardWidth - 10} cy={cardHeight - 10} r={110} color="rgba(255, 230, 0, 0.45)">
												<BlurMask blur={45} style="normal" />
											</Circle>

											<Fill color="rgba(227, 219, 219, 0.10)" />

											{/* Inner Shadows voor Glass Effect */}
											<RoundedRect x={0} y={0} width={cardWidth} height={cardHeight} r={16} color="transparent">
												<Shadow dx={3} dy={5} blur={10} color="rgba(35, 54, 0, 0.08)" inner />
											</RoundedRect>
											<RoundedRect x={0} y={0} width={cardWidth} height={cardHeight} r={16} color="transparent">
												<Shadow dx={-2} dy={-2} blur={4} color="rgba(255,255,255,0.5)" inner />
											</RoundedRect>

											{/* Diagonale glans op het glas */}
											<RoundedRect x={0} y={0} width={cardWidth} height={cardHeight} r={16}>
												<SkiaGradient start={vec(0, 0)} end={vec(cardWidth, cardHeight)} colors={["rgba(255,255,255,0.4)", "rgba(255,255,255,0.0)"]} />
											</RoundedRect>

											<Group transform={[{ translateY: 10 }]}>
												<Group clip={rrect(rect(8, 0, cardWidth - 16, 60), 8, 8)}>
													<BackdropBlur blur={6.25}>
														<Fill color="rgba(197, 207, 0, 0.05)" />
													</BackdropBlur>
													<RoundedRect x={0} y={0} width={cardWidth - 16} height={60} r={8} color="transparent">
														<Shadow dx={-1} dy={-1} blur={1} color="rgba(255,255,255,0.3)" inner />
													</RoundedRect>
												</Group>
											</Group>

											<Group transform={[{ translateY: 140 }]}>
												<Group clip={rrect(rect(8, 0, cardWidth - 16, 60), 8, 8)}>
													<BackdropBlur blur={6.25}>
														<Fill color="rgba(197, 207, 0, 0.05)" />
													</BackdropBlur>
													<RoundedRect x={0} y={0} width={cardWidth - 16} height={60} r={8} color="transparent">
														<Shadow dx={-1} dy={-1} blur={1} color="rgba(255,255,255,0.3)" inner />
													</RoundedRect>
												</Group>
											</Group>
										</Group>

										<RoundedRect x={0} y={0} width={cardWidth} height={cardHeight} r={16} color="rgba(35, 54, 0, 0.20)" style="stroke" strokeWidth={1.5} />
									</Group>
								</Canvas>
							)}

							<View style={styles.medicalCardContent} onLayout={(e) => setCardHeight(e.nativeEvent.layout.height)}>
								{MOCK_MEDICAL_DATA.map((item, index) => (
									<View key={item.id} style={styles.contentRowWrapper}>
										<View style={[styles.medicalRow]}>
											<View style={[styles.iconCircle, item.highlighted ? styles.iconCircleHighlighted : styles.iconCircleNormal]}>
												<MaterialCommunityIcons name={item.icon as any} size={20} color="#464A00" />
											</View>

											<View style={styles.medicalTextContainer}>
												<Text style={styles.medicalTitle}>{item.title}</Text>
												<Text style={styles.medicalSubtitle}>{item.subtitle}</Text>
											</View>
										</View>

										{index < MOCK_MEDICAL_DATA.length - 1 && (
											<View style={styles.separatorContainer}>
												<View style={styles.separator} />
											</View>
										)}
									</View>
								))}
							</View>
						</View>
					</View>

					<View style={styles.footer}>
						<Button title="Profiel opslaan" onPress={() => {}} variant="primary" />
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: "#FDFBF7" },
	headerRow: { width: "100%", paddingHorizontal: 24, paddingTop: 10, zIndex: 10 },
	backButton: { padding: 8, marginLeft: -8, alignSelf: "flex-start" },
	scrollContent: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 60, alignItems: "center" },

	titleContainer: { alignItems: "center", marginBottom: 24 },
	titleRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", justifyContent: "center" },
	titleText: { fontFamily: FONTS.heading, fontSize: 24, color: COLORS.primary, zIndex: 2 },
	highlightWrapper: { backgroundColor: COLORS.accent, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 20, zIndex: 1, marginTop: 4 },
	subtitle: { fontFamily: "InterRegular", fontSize: 16, color: "#475569", marginTop: 8 },

	photoContainer: { marginBottom: 32, alignItems: "center" },
	photoGlow: { position: "relative", shadowColor: "#EFFC00", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 8 },
	photoBorder: { width: PHOTO_SIZE + 6, height: PHOTO_SIZE + 6, borderRadius: (PHOTO_SIZE + 6) / 2, borderWidth: 3, borderColor: "#EFFC00", justifyContent: "center", alignItems: "center" },
	photoClip: { width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: PHOTO_SIZE / 2, overflow: "hidden", position: "relative" },
	photo: { width: PHOTO_SIZE, height: PHOTO_SIZE },
	initialsBox: { width: PHOTO_SIZE, height: PHOTO_SIZE, backgroundColor: "rgba(239, 252, 0, 0.4)", justifyContent: "center", alignItems: "center" },
	initialsText: { fontFamily: FONTS.heading, fontSize: 42, color: COLORS.primary },
	photoInnerGlow: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(239, 252, 0, 0.12)" },
	cameraBadge: {
		position: "absolute",
		bottom: 4,
		right: 4,
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: COLORS.white,
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.15,
		shadowRadius: 4,
		elevation: 4,
		borderWidth: 1,
		borderColor: "rgba(35, 54, 0, 0.1)",
	},

	section: { width: "100%", marginBottom: 24 },
	sectionHeader: { fontFamily: "InterBold", fontSize: 16, color: COLORS.primary, marginBottom: 16 },
	row: { flexDirection: "row", width: "100%", justifyContent: "space-between" },
	inputLabel: { fontFamily: "InterMedium", fontSize: 14, color: COLORS.primary, marginBottom: 8 },
	fakeInput: { borderWidth: 1, borderColor: "rgba(35, 54, 0, 0.16)", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "rgba(255,255,255,0.65)", marginBottom: 16 },
	fakeInputText: { fontFamily: "InterRegular", fontSize: 14, color: COLORS.primary },

	medicalCardWrapper: { position: "relative", width: "100%", minHeight: 150 },
	medicalCardContent: { width: "100%", paddingVertical: 10, paddingHorizontal: 8, zIndex: 2 },
	contentRowWrapper: { marginBottom: 0 },

	medicalRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 12, height: 60 },

	iconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center", marginRight: 16 },
	iconCircleHighlighted: { backgroundColor: "rgba(197, 207, 0, 0.25)", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 3, elevation: 3 },
	iconCircleNormal: { backgroundColor: "rgba(35, 54, 0, 0.05)", borderWidth: 1, borderColor: "rgba(35, 54, 0, 0.1)" },

	medicalTextContainer: { flex: 1 },
	medicalTitle: { fontFamily: "InterMedium", fontSize: 14, color: COLORS.primary, marginBottom: 2 },
	medicalSubtitle: { fontFamily: "InterRegular", fontSize: 13, color: "#475569" },

	separatorContainer: { paddingHorizontal: 16 },
	separator: { height: 1, backgroundColor: "rgba(51, 152, 59, 0.15)", marginVertical: 2 },

	footer: { width: "100%", marginTop: 10 },
});
