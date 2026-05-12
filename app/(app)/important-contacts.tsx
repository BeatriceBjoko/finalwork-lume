import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Button from "../../components/ui/Button";
import ContactCard, { Contact } from "../../components/ui/ContactCard";

// Mock Data erna firebase
const INITIAL_CONTACTS: Contact[] = [
	{
		id: "1",
		name: "Dr. Peeters",
		role: "Huisarts",
		phone: "0470 12 34 56",
		photo: null,
		address: "Kerkstraat 14\n9000 Gent",
		blob1: "rgba(255, 210, 0, 0.35)",
		blob2: "rgba(255, 140, 0, 0.25)",
	},
	{
		id: "2",
		name: "Apotheek Voorzorg",
		role: "Apotheker",
		phone: "09 234 56 78",
		photo: null,
		address: "Zonnelaan 88\n9000 Gent",
		blob1: "rgba(160, 220, 140, 0.35)",
		blob2: "rgba(120, 190, 100, 0.25)",
	},
	{
		id: "3",
		name: "Kine De Smet",
		role: "Kinesist",
		phone: "0488 99 88 77",
		photo: null,
		address: "Sportweg 2\n9000 Gent",
		blob1: "rgba(255, 100, 200, 0.25)",
		blob2: "rgba(150, 50, 255, 0.15)",
	},
	{
		id: "4",
		name: "Thuiszorg Rita",
		role: "Verpleegkundige",
		phone: "0499 11 22 33",
		photo: null,
		address: "Mobiele diensten\nRegio Gent",
		blob1: "rgba(255, 150, 0, 0.25)",
		blob2: "rgba(255, 50, 0, 0.15)",
	},
];

export default function ImportantContactsScreen() {
	const router = useRouter();
	const { width } = useWindowDimensions();
	const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
	const [focusedCardId, setFocusedCardId] = useState<string | null>(null);

	const CARD_WIDTH = width - 48;
	const CARD_HEIGHT = 140;

	const handleEditContact = (id: string) => {
		console.log("Navigeer naar edit formulier voor ID:", id);
		// router.push(`/edit-contact/${id}`);
	};

	const handleDeleteContact = (id: string) => {
		console.log("Verwijder contact met ID:", id);
		setContacts((prev) => prev.filter((c) => c.id !== id));
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.headerRow}>
				<Pressable onPress={() => router.back()} style={styles.backButton}>
					<Ionicons name="arrow-back" size={28} color="#233600" />
				</Pressable>
			</View>

			<View style={styles.titleContainer}>
				<Text style={styles.titleText}>Belangrijke contactpersonen</Text>
				<Text style={styles.subtitle}>Lijst met contactkaarten</Text>
			</View>

			<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} onScrollBeginDrag={() => setFocusedCardId(null)}>
				<Pressable style={{ flex: 1 }} onPress={() => setFocusedCardId(null)}>
					{contacts.map((contact, index) => (
						<ContactCard
							key={contact.id}
							contact={contact}
							index={index}
							cardWidth={CARD_WIDTH}
							cardHeight={CARD_HEIGHT}
							isFocused={focusedCardId === contact.id}
							onFocus={() => setFocusedCardId(contact.id)}
							onEdit={handleEditContact}
							onDelete={handleDeleteContact}
						/>
					))}
					<View style={{ height: 160 }} />
				</Pressable>
			</ScrollView>

			<View style={styles.bottomContainer}>
				<Button title="Contactpersoon toevoegen" onPress={() => console.log("Voeg toe geklikt")} variant="secondary" style={{ marginBottom: 12, borderColor: "#233600" }} />
				<Button title="Wijzigingen opslaan" onPress={() => console.log("Opslaan geklikt")} variant="primary" />
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: "#FDFBF7" },
	headerRow: { width: "100%", paddingHorizontal: 24, paddingTop: 10, zIndex: 10 },
	backButton: { padding: 8, marginLeft: -8, alignSelf: "flex-start" },
	titleContainer: { paddingHorizontal: 24, marginTop: 16, marginBottom: 24, alignItems: "center" },
	titleText: { fontFamily: "BricolageBold", fontSize: 24, color: "#233600", textAlign: "center" },
	subtitle: { fontFamily: "InterRegular", fontSize: 16, color: "#475569", marginTop: 8 },
	scrollContent: { paddingHorizontal: 24, paddingTop: 10 },
	bottomContainer: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40, backgroundColor: "rgba(253, 251, 247, 0.95)" },
});
