import { useFocusEffect } from "expo-router";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSession } from "../context";
import { db } from "../lib/firebase-config";
import { setAppLanguage } from "../locales/i18n";

export function useProfile() {
	const { user, userData, signOut } = useSession();
	const { t, i18n } = useTranslation();

	const [relation, setRelation] = useState("");
	const [circleRole, setCircleRole] = useState("lid");
	const [memberPhoto, setMemberPhoto] = useState<string | null>(null);

	const [memberName, setMemberName] = useState<string | null>(null);
	const [isLangModalVisible, setLangModalVisible] = useState(false);

	const careCircleId = userData?.careCircleId;
	const uid = user?.uid;

	// Live membership (name, photo, relation, role). Re-subscribed every time the screen
	// gains focus, so changes made in "Profiel bewerken" show as soon as you come back.
	useFocusEffect(
		useCallback(() => {
			if (!careCircleId || !uid) return;
			const memberRef = doc(db, "careCircleMembers", `${careCircleId}_${uid}`);
			return onSnapshot(
				memberRef,
				(snap) => {
					if (!snap.exists()) return;
					const data = snap.data();
					setRelation(data.relationshipToCareReceiver || "");
					setCircleRole(data.role || "lid");
					setMemberPhoto(data.photoUrl || null);
					setMemberName(data.name || null);
				},
				(error) => console.error("Kon member data niet ophalen:", error),
			);
		}, [careCircleId, uid]),
	);

	const handleLogout = async () => {
		await signOut();
	};

	const getInitials = () => {
		// The live membership name is updated by "Profiel bewerken" together with the profile
		const nameToUse = memberName || userData?.name || user?.displayName || user?.email || "?";
		return nameToUse.substring(0, 2).toUpperCase();
	};

	// Functie om taal te veranderen in de app en in de database
	const changeLanguage = async (langCode: "nl" | "fr") => {
		try {
			await setAppLanguage(langCode); // Verandert de taal direct in de app en onthoudt ze op dit toestel
			setLangModalVisible(false);

			// Sla het op in Firebase zodat het bewaard blijft
			if (user?.uid) {
				await updateDoc(doc(db, "users", user.uid), { language: langCode });
			}
		} catch (error) {
			console.error("Fout bij veranderen van taal:", error);
		}
	};

	const displayName = memberName || userData?.name || user?.displayName || t("common.userFallback");

	const roleDisplay = circleRole === "admin" ? t("profile.roleAdmin", "beheerder") : t("profile.roleMember", "lid");

	const relationDisplay = relation ? t(`createCircle.relations.${relation}`, relation) : t("profile.unknownRelation", "Onbekend");
	const profileImage = memberPhoto || userData?.photoUrl || null;

	return {
		displayName,
		roleDisplay,
		relationDisplay,
		profileImage,
		getInitials,
		handleLogout,

		isLangModalVisible,
		setLangModalVisible,
		changeLanguage,
		currentLanguage: i18n.language,
	};
}
