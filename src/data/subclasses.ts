/**
 * Kanar Subclass Codex (2024)
 *
 * Subclasses (also called Innates) grant special abilities.
 * - A character may only have one active subclass at a time.
 * - Subclasses marked with (*) are higher-tier and cost 1 Life Credit.
 * - Any character can take any subclass if they meet the prerequisites,
 *   but subclasses are sorted by their "natural" class for convenience.
 * - Can change subclass once per season; first subclass doesn't count as a change.
 * - Play Master staff must review before the ability can be used in game.
 */

export interface Subclass {
  name: string;
  classAffinity: "Cleric" | "Mage" | "Rogue" | "Warrior" | "Miscellaneous";
  higherTier: boolean; // (*) subclasses — cost 1 Life Credit
  ability: string;
  prerequisites: string;
}

export const subclasses: Subclass[] = [
  // ── Cleric ──────────────────────────────────────────
  {
    name: "Acolyte",
    classAffinity: "Cleric",
    higherTier: false,
    ability: "Healing caused by any instant; healing-based spell cast is increased by one per level of the spell. This ability does not apply to heals cast on oneself.",
    prerequisites: "E/W 4th Level Spell Slots (4), E/W 5th Level Spell Slots (3), E/W Ability, E/W Research, First Aid, Flora Lore, Herbalism (4), Planar Lore (Positive), Planar Lore (Water), Read/Write (Any)",
  },
  {
    name: "Dread Cleric",
    classAffinity: "Cleric",
    higherTier: false,
    ability: "Dread Cleric can throw all their Inflict Spells. Does not include Degenerate or Death.",
    prerequisites: "E/W 5th Level Spell Slots (4), E/W Ability, E/W Research, First Aid, Forensics, Planar Lore (Negative), Planar Lore (Negative/Affinity), Planar Lore (Water), Read/Write (Any)",
  },
  {
    name: "Druid",
    classAffinity: "Cleric",
    higherTier: false,
    ability: "Speak with Animals at will. May use this ability to speak to other Druids as if they were animals.",
    prerequisites: "Astronomy Lore, E/W 4th Level Spell Slots (4), E/W 5th Level Spell Slots (3), E/W Ability, Fauna Lore, First Aid, Flora Lore, Planar Lore (Wild), Planar Lore (Wild – Affinity), Read/Write (Any), Terrain Lore (Forest), Wilderness Survival",
  },
  {
    name: "Shaman",
    classAffinity: "Cleric",
    higherTier: false,
    ability: "Shamans may dance and chant for 3 seconds per level of spell they are going to cast up to a max of 18 seconds. May Speak with Dead at will.",
    prerequisites: "Culture Lore (Any), E/W 5th Level Spell Slots (4), E/W Ability, E/W Research, First Aid, Flora Lore, Fortune Telling, Resist Disease, Undead Lore, Wilderness Survival",
  },
  {
    name: "Healer",
    classAffinity: "Cleric",
    higherTier: true,
    ability: "Healer adds two white marbles to their bag for resurrection ceremonies. Healing caused by any instant; healing-based spell cast is increased by two per level of the spell. This ability does not apply to heals cast on oneself.",
    prerequisites: "E/W 9th Level Spell Slots (4), E/W Ability, E/W Research, First Aid, Flora Lore, Forensics (3), Fortune Telling, Herbalism (5), Planar Lore (Positive), Planar Lore (Positive – Affinity), Planar Lore (Water), Read/Write (Any), 1 Life Credit",
  },
  {
    name: "Warlock",
    classAffinity: "Cleric",
    higherTier: true,
    ability: "Warlock does not lose a spell slot if interrupted while casting instant spells.",
    prerequisites: "Damage Control, E/W 9th Level Spell Slots (4), E/W Ability, E/W Research, First Aid, Math, Planar Lore (Earth), Planar Lore (Negative), Planar Lore (Water), Planar Lore (Wild), Planar Lore (* – Affinity) (* – must have affinity specialization in one plane listed here), Read/Write (Any), Resist Any (2), Symbol Lore, Symbol Lore (Rituals), Symbol Lore (Rituals – Binding/Warding), Symbol Lore (Rituals – Summoning), 1 Life Credit",
  },
  {
    name: "Arch Druid",
    classAffinity: "Cleric",
    higherTier: true,
    ability: "Cure Disease, Neutralize Toxin, and Gully's Restoration Spells are areas of effect. If Arch Druid Casts Speak with Animals, they may use this spell to speak to other Druids as if they were animals.",
    prerequisites: "Astronomy Lore, E/W 9th Level Spell Slots (4), E/W Ability, Fauna Lore, First Aid, Flora Lore, Herbalism (5), Math, Planar Lore (Positive), Planar Lore (Wild), Planar Lore (Wild – Affinity), Read/Write (Any), Terrain Lore (Any), Tracking, Wilderness Survival, 1 Life Credit",
  },

  // ── Mage ────────────────────────────────────────────
  {
    name: "Battle Mage",
    classAffinity: "Mage",
    higherTier: false,
    ability: "Damage caused by any instant; damage-based spell cast is increased by one per level of the spell.",
    prerequisites: "F/A 5th Level Spell Slots (4), F/A Ability, F/A Research, Math, Planar Lore (Air), Planar Lore (Fire), Planar Lore (Negative), Planar Lore (Negative – Affinity), Read/Write (Any)",
  },
  {
    name: "Scholar",
    classAffinity: "Mage",
    higherTier: false,
    ability: 'Once per day a Scholar can call "Scholar Innate" and gain the benefit of a lore skill they do not possess.',
    prerequisites: "Appraisal, Artifact Lore, Cartography, Culture Lore (Any), Detect Magic, F/A 1st Level Spell Slot, F/A Ability, Language (Any 2), Math, More Math, Planar Lore (Any 7), Read/Write (Any 3), Scribe Lore",
  },
  {
    name: "Sorcerer",
    classAffinity: "Mage",
    higherTier: false,
    ability: "All Protection and Boons are +1 to their numerical value.",
    prerequisites: "Detect Magic, F/A 1st Level Spell Slots (5), F/A 5th Level Spell Slots (4), F/A Ability, F/A Research, Math, More Math, Planar Lore (Air), Planar Lore (Fire), Planar Lore (Neutral), Read/Write (Any)",
  },
  {
    name: "Witch Doctor",
    classAffinity: "Mage",
    higherTier: false,
    ability: 'Witch Doctors may dance and chant for 3 seconds per level of spell they are going to cast up to a maximum of 18 seconds. Witch Doctor can call "Witch Doctor Innate" and can use Detect Magic, Lesser at will.',
    prerequisites: "Alchemy/Potions/Scrolls (Any 1) (3), Culture Lore (Any), F/A 5th Level Spell Slots (4), F/A Ability, F/A Research, Planar Lore (Air), Planar Lore (Fire), Read/Write (Any), Resist (Any)",
  },
  {
    name: "Arch Mage",
    classAffinity: "Mage",
    higherTier: true,
    ability: "Once per event Arch Mage may open a portal in a Keystone Archway that is Mastercraft to journey to a destination that they have been to before. The portal stays open on both ends until the Arch Mage returns through the portal.",
    prerequisites: "Analyze Magic Item, Artifact Lore, F/A 9th Level Spell Slots (4), F/A Ability, F/A Research, Math, Mystic Runes, Planar Lore (Air), Planar Lore (Air – Affinity), Planar Lore (Fire), Planar Lore (Fire – Affinity), Read/Write (Any), Symbol Lore, Symbol Lore (Rituals), Symbol Lore (Rituals – Travel), 1 Life Credit",
  },
  {
    name: "Elementalist",
    classAffinity: "Mage",
    higherTier: true,
    ability: "Damage caused by any instant; damage-based spell cast is increased by one per level of the spell. Elementalist can change the element of a damage spell to any element they can cast. This changes only the damage component of the spell. This ability will not work to meet requirements for Rituals.",
    prerequisites: "E/W Ability, E/W Research, First Aid, F/A 9th Level Spell Slots (4), F/A Ability, F/A Research, Planar Lore (Air), Planar Lore (Air – Affinity), Planar Lore (Earth), Planar Lore (Fire), Planar Lore (Fire – Affinity), Planar Lore (Negative), Planar Lore (Positive), Planar Lore (Water), Read/Write (Any), 1 Life Credit",
  },
  {
    name: "Wizard",
    classAffinity: "Mage",
    higherTier: true,
    ability: "The Wizard may once per day cast any one Kanar legal spell that is in their spell book without expending a spell slot and without pre-memorizing a spell. Spell still requires complete incantation.",
    prerequisites: "Analyze Item, Artifact Lore, Astronomy Lore, F/A 9th Level Spell Slots (4), F/A Ability, F/A Research, First Aid, Fortune Telling, Math, Mystic Runes, Planar Lore (Air), Planar Lore (Fire), Planar Lore (Neutral), Planar Lore (Wild), Read/Write (Any), 1 Life Credit",
  },

  // ── Rogue ───────────────────────────────────────────
  {
    name: "Assassin",
    classAffinity: "Rogue",
    higherTier: false,
    ability: 'Once per day an Assassin can call "Assassin Innate" and can sheath a weapon on their person that is coated in a toxin without expending the toxins use. May only possess one sheathed toxin weapon at a time. If the weapon is handed off or stored not on the assassin the toxin is considered consumed.',
    prerequisites: "Assassinate, Backstab, Fauna or Flora Lore, Handle Toxin, Knockout, Create Toxin (2)",
  },
  {
    name: "Ranger",
    classAffinity: "Rogue",
    higherTier: false,
    ability: "Rangers can track at night. They can also track during and after rainfall. Rangers can only use these abilities in a terrain they are specialized in.",
    prerequisites: "Backstab, Blind Fighting, Bow or CrossBow, Cartography, Knockout, Navigation, Paired Weapons, Tanning, Thrown Rock/Knife, Terrain Lore (Any 3), Tracking, Weapon (Any), Weapon Group (Any), Wilderness Survival",
  },
  {
    name: "Swashbuckler",
    classAffinity: "Rogue",
    higherTier: false,
    ability: "If the Swashbuckler lands a successful backstab on a target, they get +2 damage on that target for five minutes.",
    prerequisites: "Backstab, Dagger, Fauna or Flora Lore, Forensics (3), Handle Toxin, Knockout, Math, Navigation, One-Handed Group, Paired Weapons, Sailing Lore or Terrain Lore, Urban Lore, Drug Tolerance (Any), Horsemanship or Seamanship",
  },
  {
    name: "Bard",
    classAffinity: "Rogue",
    higherTier: false,
    ability: 'Once per event bard can do a 5-minute public performance. 10 people watching the performance including the bard within a 30 ft range will regain 1 resist ability they have expended when the bard finishes and calls "Bardic Innate". Bard will have to pick the 10 people if there are over 10 people within range.',
    prerequisites: "Appraisal, Bardic 5th Level Spell Slots (4), Bardic Ability, Bardic Research, Forgery, Musical Training, Planar Lore (Positive), Planar Lore (Wild)",
  },
  {
    name: "Aristocrat",
    classAffinity: "Rogue",
    higherTier: true,
    ability: 'Once per day the aristocratic may cast a charm person spell and announce "aristocrat innate". In addition to the effects of the charm spell the caster may ask two questions that the target may not lie in their response. If the target resists the charm effect, they also resist this ability.',
    prerequisites: "Appraisal, Bardic 9th Level Spell Slots (4), Bardic Ability, Bardic Research, Culture Lore (Any) (3), Musical Training, Planar Lore (Air), Planar Lore (Air – Affinity), Planar Lore (Wild – Affinity), Planar Lore (Wild), Read/Write (Any), Urban Lore (Any 2), 1 Life Credit",
  },
  {
    name: "Shadow Blade",
    classAffinity: "Rogue",
    higherTier: true,
    ability: "Once per day, The Shadow Blade may deliver two sneak attacks simultaneously on two separate targets.",
    prerequisites: "Assassinate, Backstab, Blind Fighting, Craft (Disguise) (5), Culture Lore (Any), Dagger, Forensics (5), Knockout, One-Handed Group, Pick Locks (5), Planar Lore (Neutral), Planar Lore (Neutral – Affinity), Short Sword or Longsword, Silent Kill, Tracking, Urban Lore (Any 3), 1 Life Credit",
  },
  {
    name: "Spell Weaver",
    classAffinity: "Rogue",
    higherTier: true,
    ability: "Once per Event, the Spell Weaver may cast any protection, augment, or boon that is not target caster/caster as a 5 target plus the caster.",
    prerequisites: "Astronomy Lore, Bardic 9th Level Spell Slots (4), Bardic Ability, Bardic Research, Dagger, Detect Magic, Fortune Telling, Math, More Math, Musical Training, Mystic Runes, Planar Lore (Positive), Planar Lore (Positive – Affinity), Planar Lore (Wild), Read/Write (Any), War Tactics, 1 Life Credit",
  },

  // ── Warrior ─────────────────────────────────────────
  {
    name: "Barbarian",
    classAffinity: "Warrior",
    higherTier: false,
    ability: 'Once per day, when the Barbarian hits 0 BP they may announce "Barbarian Innate" and enter into Idiocy 3 Status. You gain half of your BP back. If Barbarian goes 60 seconds without attacking someone with the intention of downing the target the Barbarian falls unconscious with 0 BP. Barbarians will attack all perceived hostile targets they can see with no thought to their personal safety. Barbarians can distinguish friend from foe unless a friend attacks them.',
    prerequisites: "Added Damage 2, Culture Lore (Any) (2), Damage Control, First Aid, Physical Development, Resist Stun, Weapon (Any), Weapon Group (Any), Wilderness Survival",
  },
  {
    name: "Great Weapon Master",
    classAffinity: "Warrior",
    higherTier: false,
    ability: "When using a two-handed weapon, and successfully making a knockdown attack, add +5 damage to your next swing.",
    prerequisites: "Added Damage 2, Buckler, Disarm/Resist Disarm, Knockdown (2), Two-Handed Group, War Tactics, Weapon (Any 2-Handed)",
  },
  {
    name: "Champion",
    classAffinity: "Warrior",
    higherTier: false,
    ability: "Gains 10AP if not wearing a helmet. This ability will not stop knockout. This armor regenerates at dawn.",
    prerequisites: "Added Damage 2, Blind Fighting, Forensics (2), Hamstring, Heraldry Lore, Weapon (Any), Weapon Group (Any)",
  },
  {
    name: "Sharpshooter",
    classAffinity: "Warrior",
    higherTier: false,
    ability: 'Once per day a Sharpshooter can cause the Pinned "Ankle" Status on a target successfully struck by their projectile (except rock or hammer) for 1 minute. A pinned target cannot move from their position but can otherwise defend themselves and cast spells.',
    prerequisites: "Added Damage 2, Bow or Crossbow, Forensics (2), Knockdown, Ranged Group, Tracking",
  },
  {
    name: "Paladin",
    classAffinity: "Warrior",
    higherTier: true,
    ability: "Paladin can heal twice their level in Body Points (self or other) the Paladin can break this healing up as they see fit. The Paladin must focus for an out loud count to 3 with their palm open to target. A Paladin may be interrupted. This ability resets at dawn.",
    prerequisites: "Added Damage 4, Critical Parry, Damage Control, Death Strike, E/W 3rd Level Spell Slots (4), E/W Ability, E/W Research, First Aid, Heraldry Lore, Planar Lore (Positive), Planar Lore (Positive – Affinity), Read/Write (Any), Shield, Shield Group, Undead Lore, Undead Lore (Any), Weapon (Any Non-Shield), Weapon Group (Any Non-Shield), 1 Life Credit",
  },
  {
    name: "Warden",
    classAffinity: "Warrior",
    higherTier: true,
    ability: 'Once per day while wielding a shield, excluding buckler, the Warden can call "Wardens Parry" to counter a spell which they are target of. This ability must be called at the time of spell contact.',
    prerequisites: "Added Damage 2 (Shield), Added Damage 3 (Any Non-Shield), Armor Move (28), Critical Parry (Any Non-Shield), Critical Parry (Shield), Damage Control, First Aid, Heraldry Lore, Knockdown, Physical Development, Resist Stun, Shield, Shield Group, Stun, Weapon (Any – Non-Shield), War Tactics, Weapon Group (Any – Non-Shield), 1 Life Credit",
  },
  {
    name: "Warlord",
    classAffinity: "Warrior",
    higherTier: true,
    ability: 'Warlords can call "Warlord Innate" while in a tactical unit. All players in the tactics gain an additional +1 dmg. If War Casting is active spells are also an additional +1 damage per level of spell. Only 1 warlord innate can be active in a unit at a time.',
    prerequisites: "Added Damage 4, Armor Move (10), Blind Fighting, Critical Parry, Damage Control, Death Strike, Disarm/Resist Disarm, First Aid, Heraldry Lore, Math, Planar Lore (Neutral), Resist Sleep, Resist Stun, Stun, Tracking, War Casting, War Tactics (3), Weapon (Any), Weapon Group (Any), Wilderness Survival, 1 Life Credit",
  },

  // ── Miscellaneous (Any Class) ───────────────────────
  {
    name: "Artisan",
    classAffinity: "Miscellaneous",
    higherTier: false,
    ability: "Allows the artisan to either craft an item of up to 8 weeks of time or craft two items of 4 weeks or less on field. (Does not include Enchanting).",
    prerequisites: "Alchemy/Potions/Scrolls (Pick 1) (2), Appraisal, Artistry (3), Astronomy Lore, Cartography, Craft: Any (3), Fauna Lore, First Aid, Flora Lore, Math, Metal Lore, More Math, Physical Development, Scribe Lore, Symbol Lore, Symbol Lore: Makers Sigil, Urban Lore, Urban Lore:(Guilds)",
  },
  {
    name: "Artificer",
    classAffinity: "Miscellaneous",
    higherTier: true,
    ability: "Allows the Artificer to either craft an item of up to 8 weeks of time or craft two items of 4 weeks or less on field. Crafting on field takes half the amount of time that it normally would. (Does not include enchanting)",
    prerequisites: "Analyze Magic Item, Appraisal, Artifact Lore, Artistry (5), Craft: X (5), Culture Lore (Any) (5), Detect Magic, Fauna Lore, First Aid, Flora Lore, Math, Metal Lore, Metal/Stone/Flora/Fauna (Specialization) (20), More Math, Planar Lore (Any), Read/Write Ancient Common, Resist Sleep (2), Scribe Lore, Second Craft: X (5), Siege Group, Stone Lore, Symbol Lore, Symbol Lore (Makers Sigil), Tanning, Third Craft: X (5), Urban Lore, Urban Lore (Guilds), Urban Lore:(Any) (4), 1 Life Credit",
  },
  {
    name: "Chef",
    classAffinity: "Miscellaneous",
    higherTier: false,
    ability: 'Once per day when Chef cooks food on the field they can call "Chef Innate" and imbue the food with +4 Magical Body. Anyone who consumes the food will receive this bonus. This magical body is unique and stacks with other augments. May only be under the effect of one Chef Innate at a time.',
    prerequisites: "Alchemy, Craft: Artistry (2), Craft: Cooking (5), Culture Lore (Any), E/W Ability, Fauna Lore, First Aid, Flora Lore, Flora Lore (Mushrooms), Fortune Telling, Herbalism (3), Physical Development, Read/Write (Any), Wilderness Survival",
  },
];

/** Get subclasses grouped by class affinity */
export function getSubclassesByClass() {
  const grouped: Record<string, Subclass[]> = {};
  for (const sc of subclasses) {
    if (!grouped[sc.classAffinity]) grouped[sc.classAffinity] = [];
    grouped[sc.classAffinity].push(sc);
  }
  return grouped;
}

/** Get all subclass names for dropdowns */
export const SUBCLASS_NAMES = subclasses.map((s) => s.name);

/** Find a subclass by name */
export function getSubclass(name: string): Subclass | undefined {
  return subclasses.find((s) => s.name === name);
}
