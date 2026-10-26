import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import fr from "./fr.json";
import nl from "./nl.json";

// 1. Haal de taalcode van het toestel op
// De '?.' zorgt ervoor dat de app niet crasht als hij de taal even niet kan vinden.
const deviceLanguage = getLocales()[0]?.languageCode ?? "nl";

// 2. Check of ik deze taal ondersteun in app.
const supportedLanguages = ["nl", "fr"];

// 3. Als de gsm in het 'fr' of 'nl' staat, gebruik dat.
// Staat de gsm in het Engels of andere taal? Val dan terug op 'nl'.
const initialLanguage = supportedLanguages.includes(deviceLanguage) ? deviceLanguage : "nl";

i18n.use(initReactI18next).init({
	compatibilityJSON: "v4",
	resources: {
		nl: { translation: nl },
		fr: { translation: fr },
	},
	// Hier detectie toe passen
	lng: initialLanguage,

	// Mocht een specifieke vertaling ontbreken in het Frans,
	// dan toont hij automatisch de Nederlandse tekst.
	fallbackLng: "nl",

	interpolation: { escapeValue: false },
});

// 4. De taal die op dit toestel gekozen werd (bv. met de FR/NL-knop op het loginscherm)
// wint van de toesteltaal. Na het inloggen wint de taal van het account (zie context).
const LANGUAGE_KEY = "lume.language";

export type AppLanguage = "nl" | "fr";

export function isSupportedLanguage(value: unknown): value is AppLanguage {
	return typeof value === "string" && supportedLanguages.includes(value);
}

AsyncStorage.getItem(LANGUAGE_KEY)
	.then((saved) => {
		if (isSupportedLanguage(saved) && saved !== i18n.language) i18n.changeLanguage(saved);
	})
	.catch(() => {});

// Switch the app language and remember it on this phone
export async function setAppLanguage(lang: AppLanguage) {
	if (i18n.language !== lang) await i18n.changeLanguage(lang);
	await AsyncStorage.setItem(LANGUAGE_KEY, lang).catch(() => {});
}

// "nl" or "fr" for the language the app is showing right now
export function currentAppLanguage(): AppLanguage {
	return i18n.language?.startsWith("fr") ? "fr" : "nl";
}

export default i18n;
