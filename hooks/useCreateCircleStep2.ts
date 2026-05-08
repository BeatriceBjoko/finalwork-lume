import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, Share } from "react-native";

export interface Invitee {
	id: string;
	contact: string;
	name: string;
	color: string;
}

const AVATAR_COLORS = ["#FCF6CC", "#F0F4DC", "#DAFFDE"];

export function useCreateCircleStep2() {
	const { t } = useTranslation();
	const params = useLocalSearchParams();

	const [inviteInput, setInviteInput] = useState("");
	const [inviteList, setInviteList] = useState<Invitee[]>([]);
	const [hasShared, setHasShared] = useState(false);

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
			setAlertConfig({
				visible: true,
				title: "Oeps!",
				message: t("errors.invalidEmail"),
				isSuccess: false,
			});
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
			const result = await Share.share({
				message: t("createCircle.step2.shareMessage"),
			});

			if (result.action === Share.sharedAction) {
				setHasShared(true);
				setTimeout(() => setHasShared(false), 3000);
			}
		} catch (error: any) {
			console.error("Fout bij delen:", error.message);
		}
	};

	const handleCreateCircle = () => {
		console.log("Data van stap 1:", params);
		console.log("Uitgenodigde mensen:", inviteList);

		setAlertConfig({
			visible: true,
			title: "Succes",
			message: "Zorgkring wordt aangemaakt!",
			isSuccess: true,
		});
	};

	const closeAlert = () => {
		setAlertConfig({ ...alertConfig, visible: false });
		if (alertConfig.isSuccess) {
			router.push("/");
		}
	};

	return {
		inviteInput,
		setInviteInput,
		inviteList,
		hasShared,
		alertConfig,
		handleAddPerson,
		handleShareLink,
		handleCreateCircle,
		closeAlert,
	};
}
