import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, Share } from "react-native";

import { createCareCircleInDB } from "../lib/firebase-service";

export interface Invitee {
	id: string;
	contact: string;
	name: string;
	color: string;
}

const AVATAR_COLORS = ["#FCF6CC", "#F0F4DC", "#DAFFDE"];

const generateInviteCode = () => {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	let result = "LUME-";
	for (let i = 0; i < 6; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
};

export function useCreateCircleStep2() {
	const { t } = useTranslation();
	const params = useLocalSearchParams();

	const [inviteInput, setInviteInput] = useState("");
	const [inviteList, setInviteList] = useState<Invitee[]>([]);
	const [hasShared, setHasShared] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [circleCode, setCircleCode] = useState("");

	useEffect(() => {
		setCircleCode(generateInviteCode());
	}, []);

	const [alertConfig, setAlertConfig] = useState({
		visible: false,
		title: "",
		message: "",
		isSuccess: false,
	});

	const isValidEmail = (email: string) => {
		const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return regex.test(email);
	};

	const handleAddPerson = () => {
		const inputStr = inviteInput.trim();
		if (!inputStr) return;

		if (!isValidEmail(inputStr)) {
			setAlertConfig({ visible: true, title: "Oeps!", message: t("errors.invalidEmail"), isSuccess: false });
			return;
		}

		let extractedName = inputStr.split("@")[0];
		extractedName = extractedName.charAt(0).toUpperCase() + extractedName.slice(1);

		const newInvitee: Invitee = {
			id: Math.random().toString(),
			contact: inputStr,
			name: extractedName,
			color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
		};

		setInviteList([...inviteList, newInvitee]);
		setInviteInput("");
		Keyboard.dismiss();
	};

	const handleShareLink = async () => {
		try {
			const baseMessage = t("createCircle.step2.shareMessage");
			const fullMessage = `${baseMessage}\n\nCode: ${circleCode}`;
			const result = await Share.share({ message: fullMessage });

			if (result.action === Share.sharedAction) {
				setHasShared(true);
				setTimeout(() => setHasShared(false), 7000);
			}
		} catch (error: any) {
			console.error("Fout bij delen:", error.message);
		}
	};

	const handleCreateCircle = async () => {
		setIsLoading(true);

		try {
			// Roep functie aan uit de firebase-service
			await createCareCircleInDB({
				circleName: params.circleName as string,
				receiverName: params.receiverName as string,
				profileImage: (params.profileImage as string) || "",
				relation: params.relation as string,
				customRelation: params.customRelation as string,
				inviteCode: circleCode,
				invitees: inviteList.map((i) => ({ contact: i.contact })),
			});

			setAlertConfig({
				visible: true,
				title: "Succes",
				message: "Zorgkring is succesvol aangemaakt!",
				isSuccess: true,
			});
		} catch (error) {
			console.error("Fout bij opslaan database:", error);
			setAlertConfig({
				visible: true,
				title: "Oeps!",
				message: t("errors.default"),
				isSuccess: false,
			});
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
		inviteInput,
		setInviteInput,
		inviteList,
		hasShared,
		alertConfig,
		isLoading,
		handleAddPerson,
		handleShareLink,
		handleCreateCircle,
		closeAlert,
	};
}
