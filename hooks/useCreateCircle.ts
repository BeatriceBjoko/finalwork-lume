import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export const RELATION_KEYS = ["partner", "dochter", "zoon", "moeder", "vader", "zus", "broer", "kleindochter", "kleinzoon", "vriend_vriendin", "buur", "familielid", "vertrouwenspersoon", "vrijwilliger", "andere"];

//  Dit onthoudt de velden in het werkgeheugen, zelfs als het scherm helemaal wordt afgesloten
export let cachedStep1Data = {
	circleName: "",
	receiverName: "",
	relation: "",
	customRelation: "",
	profileImage: null as string | null,
};

export function clearCircleCache() {
	Object.assign(cachedStep1Data, {
		circleName: "",
		receiverName: "",
		relation: "",
		customRelation: "",
		profileImage: null,
	});
}

export function useCreateCircle() {
	const { t } = useTranslation();

	const [circleName, setCircleName] = useState(cachedStep1Data.circleName);
	const [receiverName, setReceiverName] = useState(cachedStep1Data.receiverName);
	const [relation, setRelation] = useState(cachedStep1Data.relation);
	const [customRelation, setCustomRelation] = useState(cachedStep1Data.customRelation);
	const [profileImage, setProfileImage] = useState<string | null>(cachedStep1Data.profileImage);

	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [isPermissionAlertVisible, setIsPermissionAlertVisible] = useState(false);

	const relationOptions = RELATION_KEYS.map((key) => ({
		value: key,
		label: t(`createCircle.relations.${key}`),
	}));

	const selectedRelationLabel = relation ? t(`createCircle.relations.${relation}`) : t("createCircle.step1.chooseRelation", "Kies een relatie...");

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

		// Update het geheugenbestand vlak voordat we naar stap 2 gaan
		cachedStep1Data = {
			circleName: circleName.trim(),
			receiverName: receiverName.trim(),
			relation: relation,
			customRelation: relation === "andere" ? customRelation.trim() : "",
			profileImage: profileImage,
		};

		// Naar stap 2 gaan en de data meenemen
		router.push({
			pathname: "/create-circle-step2",
			params: {
				circleName: cachedStep1Data.circleName,
				receiverName: cachedStep1Data.receiverName,
				relation: cachedStep1Data.relation,
				customRelation: cachedStep1Data.customRelation,
				profileImage: cachedStep1Data.profileImage || "",
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
		isPermissionAlertVisible,
		setIsPermissionAlertVisible,
	};
}
