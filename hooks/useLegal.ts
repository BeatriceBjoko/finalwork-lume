import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export function useLegal() {
	const { t } = useTranslation();
	const { tab } = useLocalSearchParams();

	const [activeTab, setActiveTab] = useState(tab === "terms" ? "terms" : "privacy");

	const contentData = activeTab === "privacy" ? t("legal.privacyContent", { returnObjects: true }) : t("legal.termsContent", { returnObjects: true });

	return {
		activeTab,
		setActiveTab,
		contentData,
		t,
	};
}
