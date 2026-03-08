export const CHARACTER_STATUSES = {
  draft: { label: "Draft", color: "bg-gray-700 text-gray-300", description: "Work in progress" },
  pending_review: { label: "Pending Review", color: "bg-yellow-900 text-yellow-300", description: "Submitted for staff review" },
  approved: { label: "Approved", color: "bg-green-900 text-green-300", description: "Approved by staff — ready for check-in" },
  rejected: { label: "Changes Requested", color: "bg-red-900 text-red-300", description: "Staff has requested changes" },
  checked_in: { label: "Checked In", color: "bg-blue-900 text-blue-300", description: "Checked in at current event" },
  checked_out: { label: "Checked Out", color: "bg-indigo-900 text-indigo-300", description: "Checked out from event" },
  retired: { label: "Retired", color: "bg-gray-800 text-gray-500", description: "Character permanently retired" },
} as const;

export type CharacterStatus = keyof typeof CHARACTER_STATUSES;

/** Statuses where a player can still edit their character */
export function canPlayerEdit(status: string): boolean {
  return ["draft", "rejected"].includes(status);
}

/** Statuses where a player can submit for review */
export function canSubmitForReview(status: string): boolean {
  return ["draft", "rejected"].includes(status);
}
