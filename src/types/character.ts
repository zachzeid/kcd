export type Race =
  | "Human"
  | "Common Elf"
  | "Forest Elf"
  | "Dwarf"
  | "Halfling"
  | "Half-Ogre"
  | "Half-Orc"
  | "Hybrid";

export type CharacterClass = "Warrior" | "Rogue" | "Cleric" | "Mage";

export interface BonusSkill {
  name: string;
  count: number;
}

export interface RaceInfo {
  name: Race;
  description: string;
  society: string;
  bonusSkills: BonusSkill[];
  costumingRequirements: string;
  bodyPointsByLevel: number[]; // index 0 = level 1, up to level 30
}

export interface SkillDefinition {
  name: string;
  category: string;
  costs: Record<CharacterClass, number>;
  maxPurchases: number;
  selfTaught: boolean;
  prerequisite?: string;
  description: string;
  specialization?: boolean;
}

export interface WeaponInfo {
  name: string;
  size: string;
  baseDamage: number | string;
  hand: "1H" | "2H";
  characteristics: string;
  group: string;
}

export interface EquipmentItem {
  name: string;
  category: string;
  cost: number;
  requiresSkill?: string;
  maxAtCreation?: number;
}

export interface PurchasedSkill {
  skillName: string;
  specialization?: string;
  purchaseCount: number;
  totalCost: number;
  acquiredAt?: string; // ISO date string — when the skill was learned
  reason?: string; // e.g. "Learned from Marcus at Winter's Tale 2026"
}

export interface PurchasedEquipment {
  itemName: string;
  quantity: number;
  totalCost: number;
  acquiredAt?: string; // ISO date string — when the item was acquired
  reason?: string; // e.g. "Starting equipment" or "Purchased at Spring Awakening"
}

export interface Character {
  name: string;
  race: Race;
  characterClass: CharacterClass;
  level: number;
  xp: number;
  totalXP?: number;
  bodyPoints: number;
  skillPoints: number;
  skillPointsSpent: number;
  skills: PurchasedSkill[];
  startingSilver: number;
  silverSpent: number;
  equipment: PurchasedEquipment[];
  history: string;
  freeLanguage: string;
  lifeCredits?: number; // Current remaining life credits (start with 3, +1 per level gained)
  dead?: boolean;       // True when life credits reach 0 — character is permanently dead
}
