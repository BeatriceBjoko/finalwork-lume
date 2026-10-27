import { useCallback } from "react";

import { useSession } from "../context";
import { addNoteToDB } from "../services/firebase/notes.service";
import { toDateKey } from "../lib/dates";
import { getInitials } from "../lib/initials";


/** Sends an SOS to the circle by creating an important note in the shared logbook. */
export function useSupportRequest() {
	const { user, userData } = useSession();
	const canSend = !!user && !!userData?.careCircleId;

	const send = useCallback(
		async ({ title, content }: { title: string; content: string }) => {
			if (!user || !userData?.careCircleId) throw new Error("no-circle");

			const now = new Date();
			const name = userData.name ?? "";

			await addNoteToDB(
				userData.careCircleId,
				{
					title,
					content,
					date: toDateKey(now),
					time: now.toTimeString().slice(0, 5),
					tag: "feeling",
					icon: "heart-pulse",
					isImportant: true,
					author: { name, initials: getInitials(name), photo: userData.photoUrl ?? null },
				},
				user.uid,
			);
		},
		[user, userData],
	);

	return { send, canSend };
}
