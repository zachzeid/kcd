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
  if (!prerequisite) return { met: true };

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

  // --- Spell slot level requirements (need 2 of previous, 3 of two-below, etc.) ---
  const spellSlotMatch = skillName.match(/^(Bardic|Earth-Water|Fire-Air) (\d+)$/);
  if (spellSlotMatch) {
    const prefix = spellSlotMatch[1];
    const level = parseInt(spellSlotMatch[2]);
    if (level >= 2) {
      const prevCount = owned.get(`${prefix} ${level - 1}`) ?? 0;
      if (prevCount < 2) return { met: false, reason: `Requires at least 2 ${prefix} ${level - 1} slots` };
    }
    if (level >= 3) {
      const prevCount = owned.get(`${prefix} ${level - 2}`) ?? 0;
      if (prevCount < 3) return { met: false, reason: `Requires at least 3 ${prefix} ${level - 2} slots` };
    }
    if (level >= 4) {
      const prevCount = owned.get(`${prefix} ${level - 3}`) ?? 0;
      if (prevCount < 4) return { met: false, reason: `Requires at least 4 ${prefix} ${level - 3} slots` };
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
  for (let i = 2; i <= 9; i++) {
    if (skillName === `Basic Enchanting ${i}`) {
      if (!has(`Basic Enchanting ${i - 1}`)) return { met: false, reason: `Requires Basic Enchanting ${i - 1}` };
    }
  }
  if (skillName === "Basic Enchanting 1") {
    if (!has("Mystic Runes")) return { met: false, reason: "Requires Mystic Runes" };
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

function hasAnyReadWrite(owned: Map<string, number>): boolean {
  for (const key of owned.keys()) {
    if (key === "Read/Write" || key.startsWith("Read/Write")) return true;
  }
  return false;
}
