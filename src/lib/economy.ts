// Economy constants and helpers for the Kanar game system

/** Profession earning rates per event period (in copper; 1 silver = 100 copper) */
export const PROFESSION_RATES = {
  novice:      { standard: 800,  winter: 4000 },   // 8 silver / 40 silver
  trainee:     { standard: 1600, winter: 8000 },   // 16 / 80
  apprentice:  { standard: 2400, winter: 12000 },  // 24 / 120
  journeyman:  { standard: 3200, winter: 16000 },  // 32 / 160
  master:      { standard: 4000, winter: 20000 },   // 40 / 200
} as const;

export type ProfessionTier = keyof typeof PROFESSION_RATES;

/**
 * For 9-level skills: map skill level to profession tier.
 * Levels 1-2 = Novice, 3-4 = Trainee, 5-6 = Apprentice, 7-8 = Journeyman, 9 = Master
 */
export function skillLevelToTier(level: number): ProfessionTier {
  if (level <= 2) return "novice";
  if (level <= 4) return "trainee";
  if (level <= 6) return "apprentice";
  if (level <= 8) return "journeyman";
  return "master";
}

/**
 * For 5-level skills: map skill level to profession tier.
 * Level 1 = Novice, 2 = Trainee, 3 = Apprentice, 4 = Journeyman, 5 = Master
 */
export function craftLevelToTier(level: number): ProfessionTier {
  if (level <= 1) return "novice";
  if (level <= 2) return "trainee";
  if (level <= 3) return "apprentice";
  if (level <= 4) return "journeyman";
  return "master";
}

/** Starting silver for new characters (in copper) */
export const STARTING_SILVER = 5000; // 50 silver

/** Format copper amount as silver display string */
export function formatSilver(copper: number): string {
  const silver = copper / 100;
  if (Number.isInteger(silver)) return `${silver} silver`;
  return `${silver.toFixed(1)} silver`;
}

/** Item types that can be submitted for creation */
export const ITEM_TYPES = {
  alchemy: "Alchemy",
  armor: "Armor",
  herbs: "Herbs",
  enchanting: "Enchanting",
  magic_item: "Magic Item",
  potions: "Potions",
  scrolls: "Scrolls",
  toxins: "Toxins",
  traps: "Traps",
  weapons: "Weapons",
  misc_craft: "Miscellaneous Craft",
  coin_earning: "Coin Earning",
} as const;

export type ItemType = keyof typeof ITEM_TYPES;

/** Craft specializations from the rulebook */
export const CRAFT_SPECIALIZATIONS = [
  "Armor Smithing",
  "Artistry",
  "Bookbinding",
  "Brewing",
  "Carpentry",
  "Chandlery",
  "Cooking",
  "Disguises",
  "Glassmaking",
  "Leatherworking",
  "Masonry",
  "Metalsmithing",
  "Pottery",
  "Siege Smithing",
  "Tailoring",
  "Weapon Smithing",
] as const;

/** Standard crafting time between events */
export const CRAFTING_WEEKS_STANDARD = 4;
export const CRAFTING_WEEKS_WINTER = 20;

/** Roleplay quality options from the sign-out form */
export const ROLEPLAY_QUALITY_OPTIONS = [
  { value: "outstanding", label: "Outstanding" },
  { value: "excellent", label: "Excellent" },
  { value: "above_average", label: "Above Average" },
  { value: "average", label: "Average" },
  { value: "below_average", label: "Below Average" },
  { value: "poor", label: "Poor" },
  { value: "abysmal", label: "Abysmal" },
] as const;

/** Between-event action types from the sign-out form */
export const BETWEEN_EVENT_ACTIONS = {
  adventuring: "Adventuring",
  researching: "Researching",
  crafting: "Crafting",
  traveling: "Traveling",
  governing: "Governing",
  nothing: "Nothing",
} as const;

export type BetweenEventAction = keyof typeof BETWEEN_EVENT_ACTIONS;

/**
 * XP calculation per the Kanar XP Policy:
 * - 6 XP per event day
 * - 1 XP per 30 minutes NPC played
 * - Max 10 XP per event day
 */
export function calculateSignOutXP(eventDays: number, npcMinutes: number): number {
  const baseXP = eventDays * 6;
  const npcXP = Math.floor(npcMinutes / 30);
  // Max 10 XP per event day total
  return Math.min(baseXP + npcXP, eventDays * 10);
}

/** Skill training cost: 1 silver per XP when learning "in town" (between events) */
export const SKILL_TRAINING_COST_PER_XP = 100; // 1 silver = 100 copper
