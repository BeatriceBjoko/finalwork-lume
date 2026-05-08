import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

export const RELATION_KEYS = ["partner", "dochter", "zoon", "moeder", "vader", "zus", "broer", "kleindochter", "kleinzoon", "vriend_vriendin", "buur", "familielid", "vertrouwenspersoon", "vrijwilliger", "andere"];

export function useCreateCircle() {
	const { t } = useTranslation();

	const [circleName, setCircleName] = useState("");
	const [receiverName, setReceiverName] = useState("");
	const [relation, setRelation] = useState("");
	const [customRelation, setCustomRelation] = useState("");
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [profileImage, setProfileImage] = useState<string | null>(null);

	const relationOptions = RELATION_KEYS.map((key) => ({
		value: key,
		label: t(`createCircle.relations.${key}`),
	}));

	const selectedRelationLabel = relation ? t(`createCircle.relations.${relation}`) : t("createCircle.step1.chooseRelation", "Kies een relatie...");

	const pickImage = async () => {
		const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

		if (permissionResult.granted === false) {
			Alert.alert(t("createCircle.step1.photoPermissionTitle"), t("createCircle.step1.photoPermissionMessage"), [{ text: t("createCircle.step1.photoPermissionButton") }]);
			return;
		}

		let result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.5,
		});

		if (!result.canceled) {
			setProfileImage(result.assets[0].uri);
		}
	};

	const handleRelationSelect = (value: string) => {
		setRelation(value);
		if (value !== "andere") {
			setCustomRelation("");
		}
		setIsDropdownOpen(false);
		setErrorMessage("");
	};

	const handleNext = () => {
		setErrorMessage("");

		if (!circleName.trim() || !receiverName.trim() || !relation) {
			setErrorMessage(t("errors.missingFields"));
			return;
		}

		if (relation === "andere" && !customRelation.trim()) {
			setErrorMessage(t("errors.missingFields"));
			return;
		}

		// naar stap 2 gaan en data meenemen
		router.push({
			pathname: "/create-circle-step2",
			params: {
				circleName: circleName.trim(),
				receiverName: receiverName.trim(),
				relation: relation,
				customRelation: relation === "andere" ? customRelation.trim() : "",
				profileImage: profileImage || "",
			},
		});
	};

	return {
		circleName,
		setCircleName: (v: string) => {
			setCircleName(v);
			setErrorMessage("");
		},
		receiverName,
		setReceiverName: (v: string) => {
			setReceiverName(v);
			setErrorMessage("");
		},
		relation,
		handleRelationSelect,
		customRelation,
		setCustomRelation: (v: string) => {
			setCustomRelation(v);
			setErrorMessage("");
		},
		profileImage,
		pickImage,
		isDropdownOpen,
		setIsDropdownOpen,
		relationOptions,
		selectedRelationLabel,
		handleNext,
		errorMessage,
	};
}
