import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { BackdropBlur, BlurMask, Canvas, Circle, Fill, FillType, Group, RoundedRect, Shadow, Skia, LinearGradient as SkiaGradient, rect, rrect, vec } from "@shopify/react-native-skia";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Button from "../../components/ui/Button";
import CustomAlert from "../../components/ui/CustomAlert";
import Input from "../../components/ui/Input";
import { COLORS } from "../../constants/theme";
import { useReceiverProfile } from "../../hooks/useReceiverProfile";

const PHOTO_SIZE = 130;
const SKIA_PADDING = 30;

export default function ReceiverProfileScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const { width } = useWindowDimensions();

	const { state, setters, pickImage, handleSave, isLoading, isSaving, alertConfig, setAlertConfig } = useReceiverProfile();

	const [showDatePicker, setShowDatePicker] = useState(false);
	const [cardHeight, setCardHeight] = useState(300);

	const cardWidth = width - 48;

	const medicalConfig = [
		{ id: "1", title: t("receiverProfile.medicationTitle"), value: state.medication, setter: setters.setMedication, icon: "pill", highlighted: true, placeholder: t("receiverProfile.medicationPlaceholder") },
		{ id: "2", title: t("receiverProfile.allergiesTitle"), value: state.allergies, setter: setters.setAllergies, icon: "alert-outline", highlighted: false, placeholder: t("receiverProfile.allergiesPlaceholder") },
		{ id: "3", title: t("receiverProfile.diagnosesTitle"), value: state.diagnoses, setter: setters.setDiagnoses, icon: "file-document-outline", highlighted: true, placeholder: t("receiverProfile.diagnosesPlaceholder") },
		{ id: "4", title: t("receiverProfile.gpVisitTitle"), value: state.gpVisit, setter: setters.setGpVisit, icon: "calendar-blank-outline", highlighted: false, placeholder: t("receiverProfile.gpVisitPlaceholder") },
	];

	const formatDate = (date: Date | null) => {
		if (!date) return t("receiverProfile.dobPlaceholder");
		return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
	};

	const getInitials = (userName: string) => {
		if (!userName) return "?";
		return userName
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	const outerClipPath = useMemo(() => {
		if (cardWidth <= 0 || cardHeight <= 0) return null;
		const path = Skia.Path.Make();
		path.addRect(rect(-SKIA_PADDING, -SKIA_PADDING, cardWidth + SKIA_PADDING * 2, cardHeight + SKIA_PADDING * 2));
		path.addRRect(rrect(rect(0, 0, cardWidth, cardHeight), 16, 16));
		path.setFillType(FillType.EvenOdd);
		return path;
	}, [cardWidth, cardHeight]);

	if (isLoading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#354E00" />
			</View>
		);
	}

	return (
		<SafeAreaView style={styles.safeArea}>
			<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
				<View style={styles.headerRow}>
					<Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={20}>
						<Ionicons name="arrow-back" size={28} color="#233600" />
					</Pressable>
				</View>

				<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
					<View style={styles.titleContainer}>
						<View style={styles.titleRow}>
							<Text style={styles.titleText}>{t("receiverProfile.titlePart1")} </Text>
							<View style={styles.highlightWrapper}>
								<Text style={styles.titleText}>{t("receiverProfile.titlePart2")}</Text>
							</View>
						</View>
						<Text style={styles.subtitle}>{t("receiverProfile.subtitle")}</Text>
					</View>

					<View style={styles.photoContainer}>
						<Pressable onPress={pickImage} style={styles.photoGlow}>
							<View style={styles.photoBorder}>
								<View style={styles.photoClip}>
									{state.profileImage ? (
										<Image source={{ uri: state.profileImage }} style={styles.photo} />
									) : (
										<View style={styles.initialsBox}>
											<Text style={styles.initialsText}>{getInitials(state.name)}</Text>
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

					<View style={styles.personalDataSection}>
						<Text style={styles.sectionHeader}>{t("receiverProfile.sectionPersonal")}</Text>

						<Input label={t("receiverProfile.nameLabel")} value={state.name} onChangeText={setters.setName} variant="outline" style={{ borderColor: "#233600" }} />

						<View style={styles.row}>
							<View style={{ flex: 1, marginRight: 8 }}>
								<Text style={styles.fieldLabel}>{t("receiverProfile.dobLabel")}</Text>
								<Pressable onPress={() => setShowDatePicker(true)} style={styles.fakeInput}>
									<Text style={[styles.fakeInputText, !state.dob && { color: "rgba(35, 54, 0, 0.4)" }]}>{formatDate(state.dob)}</Text>
									<Ionicons name="calendar-outline" size={18} color="rgba(35, 54, 0, 0.3)" />
								</Pressable>
							</View>
							<View style={{ flex: 1, marginLeft: 8 }}>
								<Text style={styles.fieldLabel}>{t("receiverProfile.hobbiesLabel")}</Text>
								<Input value={state.hobbies} onChangeText={setters.setHobbies} placeholder={t("receiverProfile.hobbiesPlaceholder")} variant="outline" style={{ borderColor: "#233600" }} />
							</View>
						</View>

						<Text style={styles.fieldLabel}>{t("receiverProfile.addressLabel")}</Text>
						<Input value={state.address} onChangeText={setters.setAddress} placeholder={t("receiverProfile.addressPlaceholder")} variant="outline" style={{ borderColor: "#233600" }} />
					</View>

					<View style={styles.section}>
						<Text style={styles.sectionHeader}>{t("receiverProfile.sectionMedical")}</Text>
						<Text style={styles.helperText}>{t("receiverProfile.helperMedical")}</Text>

						<View style={styles.medicalCardWrapper}>
							{cardHeight > 0 && outerClipPath && (
								<Canvas style={styles.skiaCanvas} pointerEvents="none">
									<Group transform={[{ translateX: SKIA_PADDING }, { translateY: SKIA_PADDING }]}>
										<Group clip={outerClipPath}>
											<RoundedRect x={0} y={0} width={cardWidth} height={cardHeight} r={16} color="white">
												<Shadow dx={0} dy={4} blur={9.2} color="rgba(70, 104, 5, 0.5)" />
											</RoundedRect>
										</Group>
										<Group clip={rrect(rect(0, 0, cardWidth, cardHeight), 16, 16)}>
											<BackdropBlur blur={50} />
											<Circle cx={cardWidth - 10} cy={cardHeight - 10} r={110} color="rgba(255, 230, 0, 0.45)">
												<BlurMask blur={45} style="normal" />
											</Circle>
											<Fill color="rgba(227, 219, 219, 0.10)" />
											<RoundedRect x={0} y={0} width={cardWidth} height={cardHeight} r={16} color="transparent">
												<Shadow dx={3} dy={5} blur={10} color="rgba(35, 54, 0, 0.08)" inner />
												<Shadow dx={-2} dy={-2} blur={4} color="rgba(255,255,255,0.5)" inner />
											</RoundedRect>
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
								{medicalConfig.map((item, index) => (
									<View key={item.id} style={styles.contentRowWrapper}>
										<View style={styles.medicalRow}>
											<View style={[styles.iconCircle, item.highlighted && styles.iconCircleHighlighted]}>
												<MaterialCommunityIcons name={item.icon as any} size={20} color="#464A00" />
											</View>
											<View style={styles.medicalTextContainer}>
												<Text style={styles.medicalTitle}>{item.title}</Text>
												<TextInput style={styles.medicalSubtitleInput} value={item.value} onChangeText={item.setter} placeholder={item.placeholder} placeholderTextColor="rgba(71, 85, 105, 0.4)" />
											</View>
										</View>
										{index < medicalConfig.length - 1 && <View style={styles.separator} />}
									</View>
								))}
							</View>
						</View>
					</View>

					<View style={styles.footer}>
						<Button title={isSaving ? t("common.loading") : t("receiverProfile.saveBtn")} onPress={handleSave} variant="primary" disabled={isSaving} />
					</View>
				</ScrollView>
			</KeyboardAvoidingView>

			<CustomAlert
				visible={alertConfig.visible}
				title={alertConfig.title}
				message={alertConfig.message}
				confirmText={t("common.ok")}
				onConfirm={() => {
					setAlertConfig({ ...alertConfig, visible: false });
					if (alertConfig.type === "success") {
						router.push("/profile");
					}
				}}
			/>

			<Modal visible={showDatePicker} transparent animationType="fade">
				<View style={styles.modalOverlay}>
					<View style={styles.datePickerCard}>
						<Text style={styles.modalTitle}>{t("receiverProfile.modalDateTitle")}</Text>
						<DateTimePicker
							value={state.dob || new Date(1950, 0, 1)}
							mode="date"
							display={Platform.OS === "ios" ? "spinner" : "default"}
							onChange={(e, d) => d && setters.setDob(d)}
							maximumDate={new Date()}
							textColor={COLORS.primary}
							themeVariant="light"
						/>
						<View style={styles.modalButtons}>
							<Button title={t("common.cancel")} variant="secondary" onPress={() => setShowDatePicker(false)} style={{ flex: 1 }} />
							<Button title={t("common.ok")} variant="primary" onPress={() => setShowDatePicker(false)} style={{ flex: 1 }} />
						</View>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: "#FDFBF7" },
	loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FDFBF7" },
	headerRow: { width: "100%", paddingHorizontal: 24, paddingTop: 10, zIndex: 100 },
	backButton: { padding: 8, marginLeft: -8 },
	scrollContent: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 60 },
	titleContainer: { alignItems: "center", marginBottom: 24 },
	titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
	titleText: { fontFamily: "BricolageBold", fontSize: 24, color: COLORS.primary },
	highlightWrapper: { backgroundColor: COLORS.accent, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 20, marginLeft: 4 },
	subtitle: { fontFamily: "InterRegular", fontSize: 16, color: "#475569", marginTop: 8 },
	photoContainer: { marginBottom: 32, alignItems: "center", zIndex: 1 },
	photoGlow: { position: "relative", shadowColor: "#EFFC00", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 8 },
	photoBorder: { width: PHOTO_SIZE + 6, height: PHOTO_SIZE + 6, borderRadius: 100, borderWidth: 3, borderColor: "#EFFC00", justifyContent: "center", alignItems: "center" },
	photoClip: { width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: 100, overflow: "hidden" },
	photo: { width: PHOTO_SIZE, height: PHOTO_SIZE },
	initialsBox: { width: PHOTO_SIZE, height: PHOTO_SIZE, backgroundColor: "rgba(239, 252, 0, 0.4)", justifyContent: "center", alignItems: "center" },
	initialsText: { fontFamily: "BricolageBold", fontSize: 42, color: COLORS.primary },
	photoInnerGlow: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(239, 252, 0, 0.12)" },
	cameraBadge: { position: "absolute", bottom: 4, right: 4, width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.white, justifyContent: "center", alignItems: "center", elevation: 4 },
	personalDataSection: { width: "100%", marginBottom: 24, zIndex: 10 },
	section: { width: "100%", marginBottom: 24 },
	sectionHeader: { fontFamily: "BricolageMedium", fontSize: 18, color: COLORS.primary, marginBottom: 8 },
	helperText: { fontFamily: "InterRegular", fontSize: 12, color: "#64748b", fontStyle: "italic", marginBottom: 12 },
	fieldLabel: { fontFamily: "InterRegular", fontSize: 16, color: COLORS.primary, marginBottom: 8 },
	row: { flexDirection: "row", width: "100%", justifyContent: "space-between" },
	fakeInput: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "white", marginBottom: 16, borderColor: "#233600" },
	fakeInputText: { fontFamily: "InterRegular", fontSize: 16, color: COLORS.primary },
	medicalCardWrapper: { position: "relative", width: "100%", minHeight: 150 },
	skiaCanvas: { position: "absolute", top: -SKIA_PADDING, left: -SKIA_PADDING, width: 500, height: 1000 },
	medicalCardContent: { width: "100%", paddingVertical: 10, paddingHorizontal: 8, zIndex: 2 },
	contentRowWrapper: { width: "100%" },
	medicalRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 12, height: 60 },
	iconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center", marginRight: 16, backgroundColor: "rgba(35, 54, 0, 0.05)" },
	iconCircleHighlighted: { backgroundColor: "rgba(197, 207, 0, 0.25)" },
	medicalTextContainer: { flex: 1 },
	medicalTitle: { fontFamily: "InterMedium", fontSize: 14, color: COLORS.primary },
	medicalSubtitleInput: { fontFamily: "InterRegular", fontSize: 14, color: "#475569", padding: 0 },
	separator: { height: 1, backgroundColor: "rgba(51, 152, 59, 0.15)", marginHorizontal: 16, marginVertical: 2 },
	footer: { width: "100%", marginTop: 10 },
	modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 24 },
	datePickerCard: { backgroundColor: "white", borderRadius: 20, padding: 24, alignItems: "center", width: "100%" },
	modalTitle: { fontFamily: "BricolageMedium", fontSize: 18, color: COLORS.primary, marginBottom: 15 },
	modalButtons: { flexDirection: "row", gap: 12, width: "100%", marginTop: 20 },
});
