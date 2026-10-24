import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, Linking, Share } from "react-native";
import { clearCircleCache } from "./useCreateCircle";

import { createCareCircleInDB, type CreatedCircle } from "../lib/firebase-service";

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
	const [isLoading, setIsLoading] = useState(false);

	// The circle is created at most once, by whichever button is pressed first
	const createdCircleRef = useRef<CreatedCircle | null>(null);
	const creatingRef = useRef<Promise<CreatedCircle> | null>(null);

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
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
			setAlertConfig({ visible: true, title: "Oeps!", message: t("errors.invalidEmail"), isSuccess: false });
			return;
		}

		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

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

	const ensureCircle = async (): Promise<CreatedCircle> => {
		if (createdCircleRef.current) return createdCircleRef.current;
		if (!creatingRef.current) {
			creatingRef.current = createCareCircleInDB({
				circleName: params.circleName as string,
				receiverName: params.receiverName as string,
				profileImage: (params.profileImage as string) || "",
				relation: params.relation as string,
				customRelation: params.customRelation as string,
				invitees: inviteList.map((i) => ({ contact: i.contact })),
			})
				.then((created) => {
					createdCircleRef.current = created;
					clearCircleCache(); // Wis het werkgeheugen nadat de kring is aangemaakt
					return created;
				})
				.finally(() => {
					creatingRef.current = null;
				});
		}
		return creatingRef.current;
	};

	const showCreateError = (error: unknown) => {
		console.error("Fout bij aanmaken zorgkring:", error);
		const alreadyInCircle = (error as Error)?.message === "ALREADY_IN_CIRCLE";
		setAlertConfig({
			visible: true,
			title: "Oeps!",
			message: alreadyInCircle ? t("joinCircle.errors.alreadyInCircle") : t("errors.default"),
			isSuccess: false,
		});
	};

	const handleShareLink = async () => {
		setIsLoading(true);
		let created: CreatedCircle;
		try {
			created = await ensureCircle();
		} catch (error) {
			showCreateError(error);
			return;
		} finally {
			setIsLoading(false);
		}

		try {
			const baseMessage = t("createCircle.step2.shareMessage");
			const fullMessage = `${baseMessage}\n\nCode: LUME-${created.code}`;
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
			await ensureCircle();
			setAlertConfig({
				visible: true,
				title: "Succes",
				message: "Zorgkring is succesvol aangemaakt!",
				isSuccess: true,
			});
		} catch (error) {
			showCreateError(error);
		} finally {
			setIsLoading(false);
		}
	};

	const closeAlert = () => {
		setAlertConfig({ ...alertConfig, visible: false });

		if (alertConfig.isSuccess) {
			const created = createdCircleRef.current;
			// Als er e-mailadressen zijn ingevuld, open de mail app
			if (created && inviteList.length > 0) {
				const emails = inviteList.map((i) => i.contact).join(",");
				const subject = encodeURIComponent("Uitnodiging voor Zorgkring op Lume");
				const body = encodeURIComponent(`${t("createCircle.step2.shareMessage")}\n\nCode: LUME-${created.code}`);

				// Open de native mail app met BCC (zodat ze elkaars adres niet zien)
				Linking.openURL(`mailto:?bcc=${emails}&subject=${subject}&body=${body}`).catch((err) => console.error("Kon de mail app niet openen:", err));
			}

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
