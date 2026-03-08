export const ROLES = {
  user: { label: "Player", description: "Standard player account", color: "bg-gray-700 text-gray-300" },
  admin: { label: "Admin", description: "Full system administrator", color: "bg-red-900 text-red-300" },
  cbd: { label: "CBD", description: "Character Book Director — processes sign-outs, manages character sheets", color: "bg-purple-900 text-purple-300" },
  gm: { label: "GM", description: "Gamemaster — runs modules, makes field rulings", color: "bg-blue-900 text-blue-300" },
  economy_marshal: { label: "Econ Marshal", description: "Economy Marshal — starting equipment, coin, player banks", color: "bg-green-900 text-green-300" },
  play_master: { label: "Play Master", description: "Play Master — weapon/armor safety, field oversight", color: "bg-orange-900 text-orange-300" },
} as const;

export type Role = keyof typeof ROLES;

export const STAFF_ROLES: Role[] = ["admin", "cbd", "gm", "economy_marshal", "play_master"];

export const ALL_ROLES: Role[] = ["user", ...STAFF_ROLES];

/** Check if a role has permission to review/approve characters */
export function canReviewCharacters(role: string): boolean {
  return ["admin", "cbd", "gm"].includes(role);
}

/** Check if a role is any kind of staff */
export function isStaff(role: string): boolean {
  return STAFF_ROLES.includes(role as Role);
}

/** Check if a role can manage users */
export function canManageUsers(role: string): boolean {
  return role === "admin";
}

/** Staff with character-review roles cannot modify their own characters */
export function canEditOwnCharacters(role: string): boolean {
  return !["admin", "cbd", "gm"].includes(role);
}

/** Check if a role can access the Character Book Department tab */
export function canAccessCBD(role: string): boolean {
  return ["admin", "cbd"].includes(role);
}

/** Check if a role can access the Economy Department tab */
export function canAccessEconomy(role: string): boolean {
  return ["admin", "economy_marshal"].includes(role);
}

/** Check if a role can access the Game Master Department tab */
export function canAccessGM(role: string): boolean {
  return ["admin", "gm"].includes(role);
}
