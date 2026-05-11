import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useSession } from "../context";
import { db } from "../lib/firebase-config";

export function useProfile() {
	const { user, userData, signOut } = useSession();

	const [relation, setRelation] = useState("");
	const [circleRole, setCircleRole] = useState("lid");
	const [memberPhoto, setMemberPhoto] = useState<string | null>(null);

	useEffect(() => {
		async function fetchMemberData() {
			if (userData?.careCircleId && user?.uid) {
				try {
					const memberRef = doc(db, "careCircleMembers", `${userData.careCircleId}_${user.uid}`);
					const memberSnap = await getDoc(memberRef);

					if (memberSnap.exists()) {
						const data = memberSnap.data();

						setRelation(data.relationshipToCareReceiver || "");
						setCircleRole(data.role || "lid");

						if (data.photoUrl) {
							setMemberPhoto(data.photoUrl);
						}
					}
				} catch (error) {
					console.error("Kon member data niet ophalen:", error);
				}
			}
		}
		fetchMemberData();
	}, [userData, user]);

	const handleLogout = async () => {
		await signOut();
	};

	const getInitials = () => {
		const nameToUse = user?.displayName || userData?.name || user?.email || "?";
		return nameToUse.substring(0, 2).toUpperCase();
	};

	const displayName = user?.displayName || userData?.name || "Gebruiker";

	const roleDisplay = circleRole === "admin" ? "beheerder" : "lid";

	const profileImage = memberPhoto || userData?.photoUrl || null;

	return {
		displayName,
		roleDisplay,
		relation,
		profileImage,
		getInitials,
		handleLogout,
	};
}
