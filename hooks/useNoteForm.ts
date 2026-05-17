import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Linking } from "react-native";
import { useSession } from "../context";
import { addNoteToDB, NoteInputData, updateNoteInDB } from "../services/firebase/notes.service";

export const NOTE_CATEGORIES = [
	{ id: "Medisch", icon: "hospital-building" },
	{ id: "Dagelijks", icon: "weather-sunny" },
	{ id: "Belangrijk", icon: "alert-circle-outline" },
	{ id: "Gevoel", icon: "emoticon-happy-outline" },
	{ id: "Praktisch", icon: "cart-outline" },
	{ id: "Slaap", icon: "bed-empty" },
	{ id: "Anders", icon: "dots-horizontal" },
];

export function useNoteForm(visible: boolean, onClose: () => void, noteToEdit?: any) {
	const { t } = useTranslation();
	const { user, userData } = useSession();
	const circleId = userData?.careCircleId;

	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [selectedCategory, setSelectedCategory] = useState(NOTE_CATEGORIES[1]);
	const [isImportant, setIsImportant] = useState(false);
	const [images, setImages] = useState<string[]>([]);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (visible) {
			if (noteToEdit) {
				setTitle(noteToEdit.title || "");
				setContent(noteToEdit.content || "");
				setIsImportant(noteToEdit.isImportant || false);
				const cat = NOTE_CATEGORIES.find((c) => c.id === noteToEdit.tag) || NOTE_CATEGORIES[6];
				setSelectedCategory(cat);
				setImages(noteToEdit.images || []);
			} else {
				setTitle("");
				setContent("");
				setIsImportant(false);
				setSelectedCategory(NOTE_CATEGORIES[1]);
				setImages([]);
			}
		}
	}, [visible, noteToEdit]);

	const handlePickImage = async () => {
		if (images.length >= 3) {
			Alert.alert("Maximum bereikt", "Je kunt maximaal 3 foto's per notitie toevoegen.");
			return;
		}

		try {
			const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
			if (!permissionResult.granted) {
				Alert.alert("Toegang vereist", "We hebben toegang tot je foto's nodig. Wil je dit aanzetten in je instellingen?", [
					{ text: "Annuleren", style: "cancel" },
					{ text: "Instellingen", onPress: () => Linking.openSettings() },
				]);
				return;
			}

			let result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ["images"],
				allowsEditing: true,
				quality: 0.5,
			});

			if (!result.canceled && result.assets && result.assets[0].uri) {
				setImages([...images, result.assets[0].uri]);
			}
		} catch (error) {
			console.error("Fout bij foto selecteren:", error);
			Alert.alert("Fout", "Er ging iets mis bij het openen van de galerij.");
		}
	};

	const handleRemoveImage = (indexToRemove: number) => {
		setImages(images.filter((_, index) => index !== indexToRemove));
	};

	const handleSaveNote = async () => {
		if (!circleId || !user?.uid) {
			Alert.alert("Fout", "Je bent niet gekoppeld aan een zorgkring.");
			return;
		}
		if (!title.trim() || !content.trim()) {
			Alert.alert("Verplicht", "Vul zowel een titel als een bericht in.");
			return;
		}

		setIsSaving(true);
		try {
			const now = new Date();
			const year = now.getFullYear();
			const month = (now.getMonth() + 1).toString().padStart(2, "0");
			const day = now.getDate().toString().padStart(2, "0");

			const authorName = userData?.name || user?.displayName || "Lid";
			const authorInitials = authorName.substring(0, 2).toUpperCase();
			const authorPhoto = userData?.photoUrl || user?.photoURL || null;

			const noteData: NoteInputData = {
				title: title.trim(),
				content: content.trim(),
				date: noteToEdit ? noteToEdit.date : `${year}-${month}-${day}`,
				time: noteToEdit ? noteToEdit.time : now.toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" }),
				tag: selectedCategory.id,
				icon: selectedCategory.icon,
				isImportant: isImportant,
				localImages: images.filter((img) => !img.startsWith("http")),
				existingImages: images.filter((img) => img.startsWith("http")),

				author: {
					name: authorName,
					initials: authorInitials,
					photo: authorPhoto,
				},
			};

			if (noteToEdit && noteToEdit.id && !noteToEdit.id.startsWith("tmpl_")) {
				await updateNoteInDB(circleId, noteToEdit.id, noteData);
			} else {
				await addNoteToDB(circleId, noteData, user.uid);
			}

			onClose();
		} catch (error) {
			console.error(error);
			Alert.alert("Fout", "Kon de notitie niet opslaan.");
		} finally {
			setIsSaving(false);
		}
	};

	return {
		title,
		setTitle,
		content,
		setContent,
		selectedCategory,
		setSelectedCategory,
		isImportant,
		setIsImportant,
		images,
		handlePickImage,
		handleRemoveImage,
		isSaving,
		handleSaveNote,
	};
}
