import * as ImagePicker from "expo-image-picker";
import { updatePassword, updateProfile } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSession } from "../context";
import { db, storage } from "../lib/firebase-config";

export function useEditProfile() {
	const { user, userData } = useSession();
	const { t } = useTranslation();

	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [relation, setRelation] = useState("");
	const [password, setPassword] = useState("");
	const [repeatPassword, setRepeatPassword] = useState("");
	const [profileImage, setProfileImage] = useState<string | null>(null);

	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const [alertConfig, setAlertConfig] = useState<{
		visible: boolean;
		title: string;
		message: string;
		type: "success" | "error" | "info";
	}>({
		visible: false,
		title: "",
		message: "",
		type: "info",
	});

	useEffect(() => {
		if (user && userData) {
			setName(user.displayName || userData.name || "");
			setEmail(user.email || "");
			setProfileImage(userData.photoUrl || null);

			const fetchMemberInfo = async () => {
				if (userData.careCircleId && user.uid) {
					try {
						const memberRef = doc(db, "careCircleMembers", `${userData.careCircleId}_${user.uid}`);
						const snap = await getDoc(memberRef);
						if (snap.exists()) {
							setRelation(snap.data().relationshipToCareReceiver || "");
							if (snap.data().photoUrl) {
								setProfileImage(snap.data().photoUrl);
							}
						}
					} catch (error) {
						console.error("Fout bij ophalen member info:", error);
					}
				}
			};
			fetchMemberInfo();
		}
	}, [user, userData]);

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
			setAlertConfig({
				visible: true,
				title: t("createCircle.step1.photoPermissionTitle"),
				message: t("createCircle.step1.photoPermissionMessage"),
				type: "info",
			});
		}
	};

	const uploadImageAsync = async (uri: string) => {
		const blob: any = await new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.onload = () => resolve(xhr.response);
			xhr.onerror = () => reject(new TypeError("Network request failed"));
			xhr.responseType = "blob";
			xhr.open("GET", uri, true);
			xhr.send(null);
		});

		const fileRef = ref(storage, `profilePhotos/${user?.uid}_${Date.now()}`);
		await uploadBytes(fileRef, blob);
		blob.close();
		return await getDownloadURL(fileRef);
	};

	const handleSave = async () => {
		if (!user || !userData) return false;

		if (password && password !== repeatPassword) {
			setAlertConfig({
				visible: true,
				title: t("errors.errorTitle"),
				message: t("editProfile.alerts.passwordMismatch"),
				type: "error",
			});
			return false;
		}

		if (password && password.length < 6) {
			setAlertConfig({
				visible: true,
				title: t("errors.errorTitle"),
				message: t("errors.weakPassword"),
				type: "error",
			});
			return false;
		}

		setIsLoading(true);
		let wasPasswordChanged = false;

		try {
			let finalPhotoUrl = profileImage;

			if (profileImage && (profileImage.startsWith("file://") || profileImage.startsWith("content://"))) {
				finalPhotoUrl = await uploadImageAsync(profileImage);
			}

			if (password) {
				try {
					await updatePassword(user, password);
					wasPasswordChanged = true;
					setPassword("");
					setRepeatPassword("");
				} catch (pwError: any) {
					if (pwError.code === "auth/requires-recent-login") {
						setAlertConfig({
							visible: true,
							title: t("editProfile.alerts.securityTitle"),
							message: t("editProfile.alerts.reauthRequired"),
							type: "info",
						});
						setIsLoading(false);
						return false;
					}
					throw pwError;
				}
			}

			// De rest van de updates (Database & Auth Profile)
			const userRef = doc(db, "users", user.uid);
			await updateDoc(userRef, { name: name, photoUrl: finalPhotoUrl });

			if (userData.careCircleId) {
				const memberRef = doc(db, "careCircleMembers", `${userData.careCircleId}_${user.uid}`);
				await updateDoc(memberRef, {
					relationshipToCareReceiver: relation,
					photoUrl: finalPhotoUrl,
					name: name,
				});
			}
			await updateProfile(user, { displayName: name, photoURL: finalPhotoUrl });

			setAlertConfig({
				visible: true,
				title: t("editProfile.alerts.successTitle"),
				message: wasPasswordChanged ? t("editProfile.alerts.successWithPassword", "Je profiel en wachtwoord zijn succesvol bijgewerkt!") : t("editProfile.alerts.successMessage"),
				type: "success",
			});

			return true;
		} catch (error: any) {
			setAlertConfig({
				visible: true,
				title: t("errors.default"),
				message: error.message || t("errors.default"),
				type: "error",
			});
			return false;
		} finally {
			setIsLoading(false);
		}
	};
	return {
		name,
		setName,
		email,
		setEmail,
		relation,
		setRelation,
		password,
		setPassword,
		repeatPassword,
		setRepeatPassword,
		profileImage,
		pickImage,
		isDropdownOpen,
		setIsDropdownOpen,
		isLoading,
		handleSave,
		alertConfig,
		setAlertConfig,
	};
}
