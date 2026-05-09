import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { RELATION_KEYS } from "./useCreateCircle";

export function useJoinCircle() {
	const { t } = useTranslation();
	const router = useRouter();

	const [inviteCode, setInviteCode] = useState("");
	const [relation, setRelation] = useState("");
	const [customRelation, setCustomRelation] = useState("");
	const [profileImage, setProfileImage] = useState<string | null>(null);

	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [isPermissionAlertVisible, setIsPermissionAlertVisible] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [alertConfig, setAlertConfig] = useState({ visible: false, title: "", message: "", isSuccess: false });

	const relationOptions = RELATION_KEYS.map((key) => ({
		value: key,
		label: t(`createCircle.relations.${key}`, key),
	}));

	const selectedRelationLabel = relation ? t(`createCircle.relations.${relation}`, relation) : t("createCircle.step1.chooseRelation", "Kies een relatie...");

	const pickImage = async () => {
		try {
			let result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ["images"],
				allowsEditing: true,
				aspect: [1, 1],
				quality: 0.5,
			});

			if (!result.canceled) {
				setProfileImage(result.assets[0].uri);
			}
		} catch (error) {
			setIsPermissionAlertVisible(true);
		}
	};

	const handleRelationSelect = (value: string) => {
		setRelation(value);
		if (value !== "andere") setCustomRelation("");
		setIsDropdownOpen(false);
	};

	const handleJoinSubmit = async () => {
		if (inviteCode.length !== 6) {
			setAlertConfig({ visible: true, title: "Oeps!", message: t("joinCircle.errors.invalidCode", "De code moet precies 6 tekens lang zijn."), isSuccess: false });
			return;
		}

		if (!relation || (relation === "andere" && !customRelation.trim())) {
			setAlertConfig({ visible: true, title: "Oeps!", message: t("errors.missingFields", "Vul aub alle velden in."), isSuccess: false });
			return;
		}

		setIsLoading(true);

		try {
			const fullCode = `LUME-${inviteCode}`;
			console.log("Zoeken naar kring met code:", fullCode);

			await new Promise((resolve) => setTimeout(resolve, 1500));

			setAlertConfig({ visible: true, title: "Welkom!", message: t("joinCircle.success", "Je bent succesvol toegevoegd aan de zorgkring."), isSuccess: true });
		} catch (error) {
			console.error("Fout bij joinen:", error);
			setAlertConfig({ visible: true, title: "Oeps!", message: t("joinCircle.errors.notFound", "Geen zorgkring gevonden met deze code."), isSuccess: false });
		} finally {
			setIsLoading(false);
		}
	};

	const closeAlert = () => {
		setAlertConfig({ ...alertConfig, visible: false });
		if (alertConfig.isSuccess) {
			router.replace("/");
		}
	};

	return {
		inviteCode,
		setInviteCode,
		relation,
		handleRelationSelect,
		customRelation,
		setCustomRelation,
		profileImage,
		pickImage,
		isDropdownOpen,
		setIsDropdownOpen,
		relationOptions,
		selectedRelationLabel,
		handleJoinSubmit,
		isLoading,
		alertConfig,
		closeAlert,
		isPermissionAlertVisible,
		setIsPermissionAlertVisible,
	};
}
