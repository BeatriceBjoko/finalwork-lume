import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LEGAL_UPDATED, LEGAL_VERSION } from "../constants/legal";
import { fromDateKey } from "../lib/dates";

export function useLegal() {
	const { t, i18n } = useTranslation();
	const { tab } = useLocalSearchParams();

	const [activeTab, setActiveTab] = useState(tab === "terms" ? "terms" : "privacy");

	const contentData = activeTab === "privacy" ? t("legal.privacyContent", { returnObjects: true }) : t("legal.termsContent", { returnObjects: true });

	const locale = i18n.language.startsWith("fr") ? "fr-BE" : "nl-BE";
	const updatedDate = fromDateKey(LEGAL_UPDATED).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
	const versionLine = t("legal.updated", { version: LEGAL_VERSION, date: updatedDate });

	return {
		versionLine,
		activeTab,
		setActiveTab,
		contentData,
		t,
	};
}
