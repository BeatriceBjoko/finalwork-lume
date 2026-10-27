import type { CircleMemberInfo } from "./firebase-service";
import { getInitials } from "./initials";

// Notes and tasks store a COPY of a person's name and photo at the moment they were
// written. These helpers show the CURRENT name and photo from the live member list
// instead, so a changed name or photo shows everywhere; the copy is only a fallback
// (older data, or someone who is no longer in the circle).

export interface PersonDisplay {
	name: string;
	initials: string;
	photo: string | null;
}

type StoredPerson = { uid?: string; name?: string; initials?: string; photo?: string | null } | null | undefined;

function fromMember(member: CircleMemberInfo): PersonDisplay {
	return { name: member.name, initials: getInitials(member.name), photo: member.photoUrl };
}

function fromStored(stored: NonNullable<StoredPerson>): PersonDisplay {
	return { name: stored.name ?? "", initials: getInitials(stored.name), photo: stored.photo ?? null };
}

// The author of a note: every note has createdBy, so it is always found while they are a member
export function resolveAuthor(members: CircleMemberInfo[], createdBy: string | undefined, stored: StoredPerson): PersonDisplay | undefined {
	const member = createdBy ? members.find((m) => m.id === createdBy) : undefined;
	if (member) return fromMember(member);
	return stored ? fromStored(stored) : undefined;
}

// The person a task is assigned to: by uid (newer tasks), otherwise the stored copy
export function resolveAssignee(members: CircleMemberInfo[], stored: StoredPerson): PersonDisplay | undefined {
	if (!stored) return undefined;
	const member = stored.uid ? members.find((m) => m.id === stored.uid) : undefined;
	return member ? fromMember(member) : fromStored(stored);
}
