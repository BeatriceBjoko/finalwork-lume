import * as ImagePicker from "expo-image-picker";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { useSession } from "../context";
import { db } from "../lib/firebase-config";

export function useEditProfile() {
	const { user, userData } = useSession();

	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [relation, setRelation] = useState("");
	const [password, setPassword] = useState("");
	const [repeatPassword, setRepeatPassword] = useState("");

	const [profileImage, setProfileImage] = useState<string | null>(null);

	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

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
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== "granted") {
			Alert.alert("Toegang nodig", "We hebben toegang tot je foto's nodig.");
			return;
		}

		let result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.5,
		});

		if (!result.canceled) {
			setProfileImage(result.assets[0].uri);
		}
	};

	const handleSave = async () => {
		setIsLoading(true);
		try {
			console.log("Opslaan data:", { name, email, relation, password, profileImage });

			await new Promise((resolve) => setTimeout(resolve, 1000));

			return true;
		} catch (error) {
			console.error("Fout bij opslaan:", error);
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
	};
}
