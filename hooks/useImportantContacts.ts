import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Contact } from "../components/ui/ContactCard";
import { useSession } from "../context";
import { getImportantContactsFromDB, saveImportantContactsToDB } from "../services/firebase/contacts.service";

export function useImportantContacts() {
	const { t, i18n } = useTranslation();
	const tContacts = (key: string) => t(`importantContacts.${key}`);

	const router = useRouter();

	const { userData } = useSession();

	const getInitialContacts = (): Contact[] => [
		{ id: "1", name: tContacts("dummyData.docName"), role: tContacts("dummyData.docRole"), phone: "0470 12 34 56", photo: null, address: tContacts("dummyData.addressGent1"), blob1: "rgba(255, 210, 0, 0.35)", blob2: "rgba(255, 140, 0, 0.25)" },
		{ id: "2", name: tContacts("dummyData.pharmName"), role: tContacts("dummyData.pharmRole"), phone: "09 234 56 78", photo: null, address: tContacts("dummyData.addressGent2"), blob1: "rgba(120, 230, 150, 0.35)", blob2: "rgba(60, 200, 100, 0.25)" },
		{ id: "3", name: tContacts("dummyData.physioName"), role: tContacts("dummyData.physioRole"), phone: "0488 99 88 77", photo: null, address: tContacts("dummyData.addressGent3"), blob1: "rgba(239, 252, 0, 0.25)", blob2: "rgba(197, 207, 0, 0.15)" },
		{ id: "4", name: tContacts("dummyData.nurseName"), role: tContacts("dummyData.nurseRole"), phone: "0499 11 22 33", photo: null, address: tContacts("dummyData.addressMobile"), blob1: "rgba(255, 255, 255, 0.6)", blob2: "rgba(200, 200, 200, 0.2)" },
	];

	const [contacts, setContacts] = useState<Contact[]>([]);
	const [focusedCardId, setFocusedCardId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isTemplateMode, setIsTemplateMode] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [alertConfig, setAlertConfig] = useState({ visible: false, title: "", message: "", type: "", contactId: "" });
	const [formVisible, setFormVisible] = useState(false);
	const [editingContact, setEditingContact] = useState<Contact | null>(null);

	useEffect(() => {
		const fetchContacts = async () => {
			if (!userData?.careCircleId) return;
			try {
				const dbContacts = await getImportantContactsFromDB(userData.careCircleId);
				if (dbContacts.length > 0) {
					setContacts(dbContacts);
					setIsTemplateMode(false);
				} else {
					setContacts(getInitialContacts());
					setIsTemplateMode(true);
				}
			} catch (error) {
				console.error("Fout bij laden contacten:", error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchContacts();
	}, [userData]);

	useEffect(() => {
		if (isTemplateMode) {
			setContacts(getInitialContacts());
		}
	}, [i18n.language, isTemplateMode]);

	const handleSaveToDB = async () => {
		if (!userData?.careCircleId) return;
		setIsSaving(true);
		try {
			await saveImportantContactsToDB(userData.careCircleId, contacts);
			setIsTemplateMode(false);
			setAlertConfig({ visible: true, title: tContacts("saveSuccessTitle"), message: tContacts("saveSuccessMessage"), type: "save", contactId: "" });
		} catch (error) {
			console.error(error);
			setAlertConfig({ visible: true, title: "Oei", message: "Er ging iets mis bij het opslaan.", type: "error", contactId: "" });
		} finally {
			setIsSaving(false);
		}
	};

	const confirmDelete = (id: string) => {
		setAlertConfig({ visible: true, title: tContacts("deleteTitle"), message: tContacts("deleteMessage"), type: "delete", contactId: id });
	};

	const handleAlertConfirm = () => {
		if (alertConfig.type === "delete") {
			setContacts((prev) => prev.filter((c) => c.id !== alertConfig.contactId));
			setAlertConfig({ visible: false, title: "", message: "", type: "", contactId: "" });
		} else if (alertConfig.type === "save") {
			setAlertConfig({ visible: false, title: "", message: "", type: "", contactId: "" });
			router.back();
		} else {
			setAlertConfig({ visible: false, title: "", message: "", type: "", contactId: "" });
		}
	};

	const openAddForm = () => {
		setEditingContact(null);
		setFormVisible(true);
	};

	const openEditForm = (id: string) => {
		const c = contacts.find((x) => x.id === id);
		if (c) {
			setEditingContact(c);
			setFormVisible(true);
		}
	};

	const saveForm = (name: string, role: string, phone: string, address: string) => {
		if (editingContact) {
			setContacts((prev) => prev.map((c) => (c.id === editingContact.id ? { ...c, name, role, phone, address } : c)));
		} else {
			const randomColors = [
				{ b1: "rgba(255, 210, 0, 0.35)", b2: "rgba(255, 140, 0, 0.25)" },
				{ b1: "rgba(120, 230, 150, 0.35)", b2: "rgba(60, 200, 100, 0.25)" },
				{ b1: "rgba(255, 100, 200, 0.25)", b2: "rgba(150, 50, 255, 0.15)" },
				{ b1: "rgba(0, 200, 255, 0.25)", b2: "rgba(0, 100, 255, 0.15)" },
			];
			const blobs = randomColors[Math.floor(Math.random() * randomColors.length)];

			const newContact: Contact = {
				id: Date.now().toString(),
				name,
				role,
				phone,
				address,
				photo: null,
				blob1: blobs.b1,
				blob2: blobs.b2,
			};
			setContacts([...contacts, newContact]);
		}
		setFormVisible(false);
	};

	return {
		tContacts,
		contacts,
		focusedCardId,
		setFocusedCardId,
		isLoading,
		isTemplateMode,
		isSaving,
		alertConfig,
		setAlertConfig,
		formVisible,
		setFormVisible,
		editingContact,
		handleSaveToDB,
		confirmDelete,
		handleAlertConfirm,
		openAddForm,
		openEditForm,
		saveForm,
	};
}
