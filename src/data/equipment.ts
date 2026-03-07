import { EquipmentItem } from "@/types/character";

export const startingEquipment: EquipmentItem[] = [
  // Miscellaneous
  { name: "Trade Tools", category: "Miscellaneous", cost: 5 },

  // Armor
  { name: "Leather Armor", category: "Armor", cost: 5 },
  { name: "Composite Leather Armor", category: "Armor", cost: 10 },
  { name: "Chain Armor", category: "Armor", cost: 15 },

  // Books
  { name: "Spell Book", category: "Books", cost: 30 },
  { name: "Recipe Book", category: "Books", cost: 20 },

  // Consumables - Alchemy
  { name: "Alchemy 1", category: "Alchemy", cost: 2, requiresSkill: "Alchemy 1", maxAtCreation: 5 },
  { name: "Alchemy 2", category: "Alchemy", cost: 6, requiresSkill: "Alchemy 2", maxAtCreation: 5 },
  { name: "Alchemy 3", category: "Alchemy", cost: 12, requiresSkill: "Alchemy 3", maxAtCreation: 5 },
  { name: "Alchemy 4", category: "Alchemy", cost: 24, requiresSkill: "Alchemy 4", maxAtCreation: 5 },

  // Consumables - Potions
  { name: "Potions 1", category: "Potions", cost: 2, requiresSkill: "Potions 1", maxAtCreation: 5 },
  { name: "Potions 2", category: "Potions", cost: 6, requiresSkill: "Potions 2", maxAtCreation: 5 },
  { name: "Potions 3", category: "Potions", cost: 12, requiresSkill: "Potions 3", maxAtCreation: 5 },
  { name: "Potions 4", category: "Potions", cost: 24, requiresSkill: "Potions 4", maxAtCreation: 5 },

  // Consumables - Toxins (Vapor)
  { name: "Toxins 1 (Vapor)", category: "Toxins", cost: 12, requiresSkill: "Toxins 1", maxAtCreation: 5 },
  { name: "Toxins 2 (Vapor)", category: "Toxins", cost: 24, requiresSkill: "Toxins 2", maxAtCreation: 5 },
  { name: "Toxins 3 (Vapor)", category: "Toxins", cost: 36, requiresSkill: "Toxins 3", maxAtCreation: 5 },

  // Consumables - Toxins (Liquid & Paste)
  { name: "Toxins 1 (Liquid & Paste)", category: "Toxins", cost: 2, requiresSkill: "Toxins 1", maxAtCreation: 5 },
  { name: "Toxins 2 (Liquid & Paste)", category: "Toxins", cost: 6, requiresSkill: "Toxins 2", maxAtCreation: 5 },
  { name: "Toxins 3 (Liquid & Paste)", category: "Toxins", cost: 12, requiresSkill: "Toxins 3", maxAtCreation: 5 },
  { name: "Toxins 4 (Liquid & Paste)", category: "Toxins", cost: 24, requiresSkill: "Toxins 4", maxAtCreation: 5 },

  // Consumables - Scrolls
  { name: "Scrolls 1", category: "Scrolls", cost: 2, requiresSkill: "Scrolls 1", maxAtCreation: 5 },
  { name: "Scrolls 2", category: "Scrolls", cost: 6, requiresSkill: "Scrolls 2", maxAtCreation: 5 },
  { name: "Scrolls 3", category: "Scrolls", cost: 12, requiresSkill: "Scrolls 3", maxAtCreation: 5 },
  { name: "Scrolls 4", category: "Scrolls", cost: 24, requiresSkill: "Scrolls 4", maxAtCreation: 5 },
];

export const equipmentCategories = [
  "Miscellaneous",
  "Armor",
  "Books",
  "Alchemy",
  "Potions",
  "Toxins",
  "Scrolls",
];
