import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export const RELATION_KEYS = ["partner", "dochter", "zoon", "moeder", "vader", "zus", "broer", "kleindochter", "kleinzoon", "vriend_vriendin", "buur", "familielid", "vertrouwenspersoon", "vrijwilliger", "andere"];

export function useCreateCircle() {
	const { t } = useTranslation();

	const [circleName, setCircleName] = useState("");
	const [receiverName, setReceiverName] = useState("");
	const [relation, setRelation] = useState("");
	const [customRelation, setCustomRelation] = useState("");
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);

	const relationOptions = RELATION_KEYS.map((key) => ({
		value: key,
		label: t(`createCircle.relations.${key}`),
	}));

	const selectedRelationLabel = relation ? t(`createCircle.relations.${relation}`) : t("createCircle.chooseRelation", "Kies een relatie...");

	const handleRelationSelect = (value: string) => {
		setRelation(value);
		if (value !== "andere") {
			setCustomRelation("");
		}
		setIsDropdownOpen(false);
	};

	const handleNext = () => {
		router.push("/create-circle-step2");
	};

	return {
		circleName,
		setCircleName,
		receiverName,
		setReceiverName,
		relation,
		handleRelationSelect,
		customRelation,
		setCustomRelation,
		isDropdownOpen,
		setIsDropdownOpen,
		relationOptions,
		selectedRelationLabel,
		handleNext,
	};
}
