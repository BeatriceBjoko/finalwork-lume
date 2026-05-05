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
// Staat de gsm in het Engels of Arabisch? Val dan terug op 'nl'.
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

export default i18n;
