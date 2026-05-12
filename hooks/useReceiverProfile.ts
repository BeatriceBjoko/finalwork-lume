import * as ImagePicker from "expo-image-picker";
import { doc, onSnapshot, Timestamp } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSession } from "../context";
import { db } from "../lib/firebase-config";
import { updateCareReceiverInDB, uploadImageAsync } from "../lib/firebase-service";

export function useReceiverProfile() {
	const { t } = useTranslation();
	const { userData } = useSession();
	const circleId = userData?.careCircleId;

	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

	const [alertConfig, setAlertConfig] = useState<{
		visible: boolean;
		title: string;
		message: string;
		type: "success" | "error" | "info";
	}>({
		visible: false,
		title: "",
		message: "",
		type: "info",
	});

	const [name, setName] = useState("");
	const [dob, setDob] = useState<Date | null>(null);
	const [hobbies, setHobbies] = useState("");
	const [address, setAddress] = useState("");
	const [profileImage, setProfileImage] = useState<string | null>(null);

	const [medication, setMedication] = useState("");
	const [allergies, setAllergies] = useState("");
	const [diagnoses, setDiagnoses] = useState("");
	const [gpVisit, setGpVisit] = useState("");

	useEffect(() => {
		if (!circleId) return;

		const unsubscribe = onSnapshot(doc(db, "careCircles", circleId), (snapshot) => {
			if (snapshot.exists()) {
				const receiver = snapshot.data().careReceiver || {};
				setName(receiver.name || "");
				setHobbies(receiver.hobbies || "");
				setAddress(receiver.address || "");
				setProfileImage(receiver.photoUrl || null);

				if (receiver.dob) {
					setDob(receiver.dob instanceof Timestamp ? receiver.dob.toDate() : new Date(receiver.dob));
				}

				setMedication(receiver.medication || "");
				setAllergies(receiver.allergies || "");
				setDiagnoses(receiver.diagnoses || "");
				setGpVisit(receiver.gpVisit || "");
			}
			setIsLoading(false);
		});

		return () => unsubscribe();
	}, [circleId]);

	const pickImage = async () => {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.5,
		});

		if (!result.canceled) {
			setProfileImage(result.assets[0].uri);
		}
	};

	const handleSave = useCallback(async () => {
		if (!circleId) return;
		setIsSaving(true);

		try {
			let finalPhotoUrl = profileImage;

			if (profileImage && (profileImage.startsWith("file://") || profileImage.startsWith("content://"))) {
				const storagePath = `circles/${circleId}/receiver_profile.jpg`;
				finalPhotoUrl = await uploadImageAsync(profileImage, storagePath);
			}

			const updateData = {
				name,
				hobbies,
				address,
				photoUrl: finalPhotoUrl,
				dob: dob ? Timestamp.fromDate(dob) : null,
				medication,
				allergies,
				diagnoses,
				gpVisit,
			};

			await updateCareReceiverInDB(circleId, updateData);

			setAlertConfig({
				visible: true,
				title: t("editProfile.alerts.successTitle"),
				message: t("receiverProfile.savedSuccessMessage"),
				type: "success",
			});
		} catch (err: any) {
			console.error(err);
			setAlertConfig({
				visible: true,
				title: t("errors.errorTitle"),
				message: err.message || t("errors.default"),
				type: "error",
			});
		} finally {
			setIsSaving(false);
		}
	}, [circleId, name, dob, hobbies, address, profileImage, medication, allergies, diagnoses, gpVisit, t]);

	return {
		state: { name, dob, hobbies, address, profileImage, medication, allergies, diagnoses, gpVisit },
		setters: { setName, setDob, setHobbies, setAddress, setMedication, setAllergies, setDiagnoses, setGpVisit },
		pickImage,
		handleSave,
		isLoading,
		isSaving,
		alertConfig,
		setAlertConfig,
	};
}
