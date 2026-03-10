import { PurchasedSkill } from "@/types/character";

/**
 * Checks if a character meets the prerequisites for purchasing a skill.
 * Returns { met: true } if prerequisites are satisfied, or { met: false, reason: string } if not.
 */
export function checkPrerequisites(
  skillName: string,
  prerequisite: string | undefined,
  purchasedSkills: PurchasedSkill[],
  bonusSkillNames: string[]
): { met: boolean; reason?: string } {
  const owned = new Map<string, number>();
  for (const ps of purchasedSkills) {
    owned.set(ps.skillName, ps.purchaseCount);
  }
  for (const bs of bonusSkillNames) {
    owned.set(bs, (owned.get(bs) ?? 0) + 1);
  }

  const has = (name: string, minCount = 1) => (owned.get(name) ?? 0) >= minCount;

  // --- Added Damage chain ---
  if (skillName === "Added Damage 2") {
    if (!has("Added Damage 1")) return { met: false, reason: "Requires Added Damage 1" };
  }
  if (skillName === "Added Damage 3") {
    if (!has("Added Damage 2")) return { met: false, reason: "Requires Added Damage 2" };
  }
  if (skillName === "Added Damage 4") {
    if (!has("Added Damage 3")) return { met: false, reason: "Requires Added Damage 3" };
  }

  // --- Martial Abilities ---
  if (skillName === "Hamstring" || skillName === "Disarm/Resist Disarm") {
    if (!has("Added Damage 1")) return { met: false, reason: "Requires Added Damage 1" };
  }
  if (skillName === "Critical Parry" || skillName === "Knockdown") {
    if (!has("Added Damage 2")) return { met: false, reason: "Requires Added Damage 2" };
  }
  if (skillName === "Stun") {
    if (!has("Added Damage 3")) return { met: false, reason: "Requires Added Damage 3" };
  }
  if (skillName === "Death Strike" || skillName === "Massive Damage") {
    if (!has("Added Damage 4")) return { met: false, reason: "Requires Added Damage 4" };
  }

  // --- Surprise Attacks chain ---
  if (skillName === "Backstab") {
    const hasOneHanded = has("One-Handed Weapons") ||
      ["Dagger", "Club/Mace", "Short Sword", "Longsword", "Hatchet/Hammer", "Hand Axe/Sledge"].some(w => has(w));
    if (!hasOneHanded) return { met: false, reason: "Requires a one-handed weapon skill" };
  }
  if (skillName === "Knockout") {
    if (!has("Backstab")) return { met: false, reason: "Requires Backstab" };
  }
  if (skillName === "Assassinate") {
    if (!has("Knockout")) return { met: false, reason: "Requires Knockout" };
  }
  if (skillName === "Silent Kill") {
    if (!has("Assassinate")) return { met: false, reason: "Requires Assassinate" };
  }

  // --- Magic abilities ---
  if (skillName === "Bardic Ability") {
    if (!has("Musical Training")) return { met: false, reason: "Requires Musical Training" };
    if (!hasAnyReadWrite(owned)) return { met: false, reason: "Requires Read/Write (Any)" };
  }
  if (skillName === "Earth-Water Ability") {
    if (!has("First Aid")) return { met: false, reason: "Requires First Aid" };
    if (!hasAnyReadWrite(owned)) return { met: false, reason: "Requires Read/Write (Any)" };
  }
  if (skillName === "Fire-Air Ability") {
    if (!hasAnyReadWrite(owned)) return { met: false, reason: "Requires Read/Write (Any)" };
  }

  // --- Spell slot prerequisites ---
  if (skillName === "Bardic 1") {
    if (!has("Bardic Ability")) return { met: false, reason: "Requires Bardic Ability" };
  }
  if (skillName === "Earth-Water 1") {
    if (!has("Earth-Water Ability")) return { met: false, reason: "Requires Earth-Water Ability" };
  }
  if (skillName === "Fire-Air 1") {
    if (!has("Fire-Air Ability")) return { met: false, reason: "Requires Fire-Air Ability" };
  }

  // --- Spell slot level requirements (pyramid: need 2 of N-1, 3 of N-2, ..., N of 1) ---
  const spellSlotMatch = skillName.match(/^(Bardic|Earth-Water|Fire-Air) (\d+)$/);
  if (spellSlotMatch) {
    const prefix = spellSlotMatch[1];
    const slotLevel = parseInt(spellSlotMatch[2]);
    for (let k = 1; k < slotLevel; k++) {
      const requiredLevel = slotLevel - k;
      const requiredCount = k + 1;
      const actualCount = owned.get(`${prefix} ${requiredLevel}`) ?? 0;
      if (actualCount < requiredCount) {
        return { met: false, reason: `Requires at least ${requiredCount} ${prefix} ${requiredLevel} slot${requiredCount > 1 ? "s" : ""}` };
      }
    }
  }

  // --- Research prerequisites ---
  if (skillName === "Bardic Research") {
    if (!has("Bardic Ability")) return { met: false, reason: "Requires Bardic Ability" };
    if (!has("Bardic 1")) return { met: false, reason: "Requires Bardic 1" };
  }
  if (skillName === "Earth-Water Research") {
    if (!has("Earth-Water Ability")) return { met: false, reason: "Requires Earth-Water Ability" };
    if (!has("Earth-Water 1")) return { met: false, reason: "Requires Earth-Water 1" };
  }
  if (skillName === "Fire-Air Research") {
    if (!has("Fire-Air Ability")) return { met: false, reason: "Requires Fire-Air Ability" };
    if (!has("Fire-Air 1")) return { met: false, reason: "Requires Fire-Air 1" };
  }

  // --- Mystic Runes ---
  if (skillName === "Mystic Runes") {
    if (!has("Bardic Ability") && !has("Earth-Water Ability") && !has("Fire-Air Ability")) {
      return { met: false, reason: "Requires Bardic, Earth-Water, or Fire-Air Ability" };
    }
  }

  // --- Analyze Magic Item ---
  if (skillName === "Analyze Magic Item") {
    if (!has("Mystic Runes")) return { met: false, reason: "Requires Mystic Runes" };
  }

  // --- Enchanting chain ---
  // Basic Enchanting requires Mystic Runes, previous level, AND spell slots of equivalent level
  const enchantMatch = skillName.match(/^Basic Enchanting (\d+)$/);
  if (enchantMatch) {
    const enchantLevel = parseInt(enchantMatch[1]);
    if (!has("Mystic Runes")) return { met: false, reason: "Requires Mystic Runes" };
    if (enchantLevel >= 2) {
      if (!has(`Basic Enchanting ${enchantLevel - 1}`)) return { met: false, reason: `Requires Basic Enchanting ${enchantLevel - 1}` };
    }
    // Spell slots of equivalent level required (any school)
    if (enchantLevel >= 1) {
      const hasSpellSlot =
        (owned.get(`Bardic ${enchantLevel}`) ?? 0) >= 1 ||
        (owned.get(`Earth-Water ${enchantLevel}`) ?? 0) >= 1 ||
        (owned.get(`Fire-Air ${enchantLevel}`) ?? 0) >= 1;
      if (!hasSpellSlot) {
        return { met: false, reason: `Requires a level ${enchantLevel} spell slot (Bardic, Earth-Water, or Fire-Air)` };
      }
    }
  }
  if (skillName === "Demi-Enchanting 1") {
    if (!has("Basic Enchanting 3")) return { met: false, reason: "Requires Basic Enchanting 3" };
  }
  if (skillName === "Demi-Enchanting 2") {
    if (!has("Basic Enchanting 6")) return { met: false, reason: "Requires Basic Enchanting 6" };
  }
  if (skillName === "Demi-Enchanting 3") {
    if (!has("Basic Enchanting 9")) return { met: false, reason: "Requires Basic Enchanting 9" };
  }

  // --- More Math ---
  if (skillName === "More Math") {
    if (!has("Math")) return { met: false, reason: "Requires Math" };
  }

  // --- Forgery ---
  if (skillName === "Forgery") {
    if (!hasAnyReadWrite(owned)) return { met: false, reason: "Requires Read/Write (Any)" };
  }

  // --- Forensics prerequisites ---
  if (skillName === "Forensics") {
    if (!has("First Aid")) return { met: false, reason: "Requires First Aid" };
    const currentForensics = owned.get("Forensics") ?? 0;
    if (currentForensics >= 3 && !has("Handle Toxin")) {
      return { met: false, reason: "Forensics level 4+ requires Handle Toxin" };
    }
  }

  // --- Handle Toxin ---
  if (skillName === "Handle Toxin") {
    if (!has("Flora Lore") && !has("Fauna Lore")) return { met: false, reason: "Requires Flora Lore or Fauna Lore" };
  }

  // --- Paired Weapons ---
  if (skillName === "Paired Weapons") {
    const hasOneHanded = has("One-Handed Weapons") ||
      ["Dagger", "Club/Mace", "Short Sword", "Longsword", "Hatchet/Hammer", "Hand Axe/Sledge"].some(w => has(w));
    if (!hasOneHanded) return { met: false, reason: "Requires One-Handed Weapons or an individual one-handed weapon skill" };
  }

  // --- Herbalism ---
  if (skillName === "Herbalism") {
    if (!has("First Aid")) return { met: false, reason: "Requires First Aid" };
    if (!has("Flora Lore")) return { met: false, reason: "Requires Flora Lore" };
  }

  // --- Item Creation ---
  if (skillName === "Alchemy") {
    if (!hasAnyReadWrite(owned)) return { met: false, reason: "Requires Read/Write (Any)" };
    if (!has("Math")) return { met: false, reason: "Requires Math" };
    const currentAlchemy = owned.get("Alchemy") ?? 0;
    if (currentAlchemy >= 3 && !has("More Math")) {
      return { met: false, reason: "Alchemy level 4+ requires More Math" };
    }
  }
  if (skillName === "Potions") {
    if (!has("Alchemy")) return { met: false, reason: "Requires Alchemy 1" };
    if (!has("Herbalism")) return { met: false, reason: "Requires Herbalism 1" };
  }
  if (skillName === "Scrolls") {
    if (!hasAnyReadWrite(owned)) return { met: false, reason: "Requires Read/Write (Any)" };
  }
  if (skillName === "Toxins") {
    if (!has("Handle Toxin")) return { met: false, reason: "Requires Handle Toxin" };
  }
  if (skillName === "Traps") {
    if (!has("Locate/Remove Traps")) return { met: false, reason: "Requires Locate/Remove Traps" };
  }

  return { met: true };
}

/**
 * Returns the effective max purchases for a skill, factoring in character level.
 * Some skills have level-dependent caps per the rulebook:
 * - Spell slots: max 6 of any level before character level 7; max = character level at 7+
 * - Disarm/Resist Disarm: max purchases = character level (per weapon specialization)
 */
export function getEffectiveMaxPurchases(
  skillName: string,
  baseMaxPurchases: number,
  level: number
): number {
  // Spell slot level-gating: max 6 before level 7, max = character level at 7+
  const spellSlotMatch = skillName.match(/^(Bardic|Earth-Water|Fire-Air) \d+$/);
  if (spellSlotMatch) {
    if (level < 7) return Math.min(baseMaxPurchases, 6);
    return Math.min(baseMaxPurchases, level);
  }

  // Disarm/Resist Disarm: max = character level
  if (skillName === "Disarm/Resist Disarm") {
    return Math.min(baseMaxPurchases, level);
  }

  return baseMaxPurchases;
}

function hasAnyReadWrite(owned: Map<string, number>): boolean {
  for (const key of owned.keys()) {
    if (key === "Read/Write" || key.startsWith("Read/Write")) return true;
  }
  return false;
}
