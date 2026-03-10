import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { hash } from "bcryptjs";
import path from "path";

const url = process.env.DATABASE_URL || `file:${path.join(process.cwd(), "dev.db")}`;
const authToken = process.env.DATABASE_AUTH_TOKEN || undefined;
const adapter = new PrismaLibSql({ url, authToken });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database (reset)...\n");

  // ─── WIPE ALL DATA ──────────────────────────────────────────────────────────
  // Delete in dependency order
  await prisma.encounterNPC.deleteMany();
  await prisma.encounterEvent.deleteMany();
  await prisma.encounterCharacter.deleteMany();
  await prisma.encounter.deleteMany();
  await prisma.monsterBookEntry.deleteMany();
  await prisma.bankTransaction.deleteMany();
  await prisma.playerBank.deleteMany();
  await prisma.characterSignOut.deleteMany();
  await prisma.itemSubmission.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.eventRegistration.deleteMany();
  await prisma.character.deleteMany();
  await prisma.event.deleteMany();
  await prisma.loreCharacter.deleteMany();
  await prisma.location.deleteMany();
  await prisma.loreEntry.deleteMany();
  await prisma.user.deleteMany();
  console.log("✓ Wiped all existing data\n");

  // ─── USERS ───────────────────────────────────────────────────────────────────
  const pw = await hash("password123", 10);

  const admin = await prisma.user.create({
    data: { email: "admin@kanar.test", name: "Admin User", hashedPassword: pw, role: "admin" },
  });
  const cbd = await prisma.user.create({
    data: { email: "cbd@kanar.test", name: "Character Book Director", hashedPassword: pw, role: "cbd" },
  });
  const gm = await prisma.user.create({
    data: { email: "gm@kanar.test", name: "Gamemaster Quinn", hashedPassword: pw, role: "gm" },
  });
  const econ = await prisma.user.create({
    data: { email: "econ@kanar.test", name: "Economy Marshal", hashedPassword: pw, role: "economy_marshal" },
  });

  // 5 player logins with Mystic Quill–inspired characters
  const p1 = await prisma.user.create({
    data: { email: "kara@kanar.test", name: "Kara Whitfield", hashedPassword: pw, role: "user" },
  });
  const p2 = await prisma.user.create({
    data: { email: "maeven@kanar.test", name: "Evan Greentree", hashedPassword: pw, role: "user" },
  });
  const p3 = await prisma.user.create({
    data: { email: "elara@kanar.test", name: "Elena Sunbright", hashedPassword: pw, role: "user" },
  });
  const p4 = await prisma.user.create({
    data: { email: "marcus@kanar.test", name: "Marcus Thornwell", hashedPassword: pw, role: "user" },
  });
  const p5 = await prisma.user.create({
    data: { email: "vael@kanar.test", name: "Veronica Ashford", hashedPassword: pw, role: "user" },
  });

  const p6 = await prisma.user.create({
    data: { email: "grimm@kanar.test", name: "Derek Grimshaw", hashedPassword: pw, role: "user" },
  });

  console.log("✓ Created 10 users (4 staff + 6 players)");

  // ─── EVENTS ──────────────────────────────────────────────────────────────────
  const event1 = await prisma.event.create({
    data: {
      name: "Autumn's End 2025",
      date: new Date("2025-10-18T10:00:00"),
      endDate: new Date("2025-10-19T18:00:00"),
      location: "Kanar Campgrounds, Vermont",
      description: "The harvest festival takes a dark turn as undead rise from ancient barrows near the village. Heroes must protect the realm while uncovering the source of the curse.",
      ticketPriceA: 3500, ticketPriceB: 4500, dayPassPrice: 2000,
      status: "completed",
    },
  });

  const event2 = await prisma.event.create({
    data: {
      name: "Winter's Tale 2026",
      date: new Date("2026-02-15T10:00:00"),
      endDate: new Date("2026-02-16T18:00:00"),
      location: "Kanar Campgrounds, Vermont",
      description: "The realm faces a bitter winter as dark forces gather. Rumors of a Frostpeak Temple and the Scepter of Eternal Winter draw adventurers from across the land.",
      ticketPriceA: 3500, ticketPriceB: 4500, dayPassPrice: 2000,
      status: "completed",
    },
  });

  const event3 = await prisma.event.create({
    data: {
      name: "Spring Awakening 2026",
      date: new Date("2026-03-08T10:00:00"),
      endDate: new Date("2026-03-09T18:00:00"),
      location: "Kanar Campgrounds, Vermont",
      description: "As winter recedes, a new threat emerges. Orc scouts have been sighted along the old trade road, and strange lights flicker near the Old Mill after dark.",
      ticketPriceA: 3500, ticketPriceB: 4500, dayPassPrice: 2000,
      status: "active",
    },
  });

  const event4 = await prisma.event.create({
    data: {
      name: "Midsummer Celebration 2026",
      date: new Date("2026-06-20T10:00:00"),
      endDate: new Date("2026-06-21T18:00:00"),
      location: "Kanar Campgrounds, Vermont",
      description: "Annual festival and tournament honoring the longest day of the year. Merchants, artisans, and warriors gather for celebration and competition.",
      ticketPriceA: 3500, ticketPriceB: 4500, dayPassPrice: 2000,
      status: "upcoming",
    },
  });

  const event5 = await prisma.event.create({
    data: {
      name: "Harvest Moon 2026",
      date: new Date("2026-09-12T10:00:00"),
      endDate: new Date("2026-09-13T18:00:00"),
      location: "Kanar Campgrounds, Vermont",
      description: "The annual harvest brings bounty—and danger. Strange creatures have been emerging from the Darkwood under the full moon.",
      ticketPriceA: 3500, ticketPriceB: 4500, dayPassPrice: 2000,
      status: "upcoming",
    },
  });

  // Old event for inactive character registrations (>12 months ago)
  const eventOld = await prisma.event.create({
    data: {
      name: "Midwinter Revel 2024",
      date: new Date("2024-02-10T10:00:00"),
      endDate: new Date("2024-02-11T18:00:00"),
      location: "Kanar Campgrounds, Vermont",
      description: "A long-past gathering where many characters last saw action.",
      ticketPriceA: 3500, ticketPriceB: 4500, dayPassPrice: 2000,
      status: "completed",
    },
  });

  console.log("✓ Created 6 events (3 completed, 1 active, 2 upcoming)");

  // ─── CHARACTERS ──────────────────────────────────────────────────────────────
  // Mystic Quill characters: Kara Swiftblade, Maeven, Elara, Marcus, Vaelith

  // P1: Kara Swiftblade — Human Warrior, tournament champion
  const karaData = {
    name: "Kara Swiftblade",
    race: "Human",
    characterClass: "Warrior",
    level: 1,
    xp: 0,
    totalXP: 0,
    bodyPoints: 8, // Human L1 (4) + Warrior L1 (4)
    skillPoints: 140,
    freeLanguage: "Common",
    history: "Born to a military family in the Capital, Kara earned her name fighting in border skirmishes before turning to tournament combat.",
    skills: [
      { skillName: "Urban Lore", purchaseCount: 1, totalCost: 0, acquiredAt: "2025-09-28", reason: "Racial bonus" },
      { skillName: "One-Handed Weapons", purchaseCount: 1, totalCost: 30, acquiredAt: "2025-09-28", reason: "Character creation" },
      { skillName: "Shields", purchaseCount: 1, totalCost: 20, acquiredAt: "2025-09-28", reason: "Character creation" },
      { skillName: "First Aid", purchaseCount: 1, totalCost: 20, acquiredAt: "2025-09-28", reason: "Character creation" },
      { skillName: "Added Damage 1 (Longsword, 1H)", purchaseCount: 1, totalCost: 20, acquiredAt: "2025-09-28", reason: "Character creation" },
      { skillName: "Armor Move", purchaseCount: 1, totalCost: 10, acquiredAt: "2025-09-28", reason: "Character creation" },
      { skillName: "Craft (Weapons)", purchaseCount: 2, totalCost: 32, acquiredAt: "2025-09-28", reason: "Character creation" },
      { skillName: "Dagger", purchaseCount: 1, totalCost: 6, acquiredAt: "2025-09-28", reason: "Character creation" },
    ],
    skillPointsSpent: 138,
    equipment: [
      { itemName: "Leather Armor", quantity: 1, totalCost: 5, acquiredAt: "2025-09-28", reason: "Starting equipment" },
      { itemName: "Composite Leather Armor", quantity: 1, totalCost: 10, acquiredAt: "2025-09-28", reason: "Starting equipment" },
      { itemName: "Trade Tools", quantity: 1, totalCost: 5, acquiredAt: "2025-09-28", reason: "Starting equipment" },
    ],
    startingSilver: 50,
    silverSpent: 20,
    lifeCredits: 3,
  };
  const kara = await prisma.character.create({
    data: {
      userId: p1.id, name: "Kara Swiftblade",
      data: JSON.stringify(karaData),
      status: "approved",
      submittedAt: new Date("2025-10-01"),
      reviewedBy: cbd.id, reviewedAt: new Date("2025-10-02"),
      reviewNotes: "Clean build, approved for play.",
    },
  });

  // P2: Maeven — Forest Elf Rogue, legendary ranger
  const maevenData = {
    name: "Maeven",
    race: "Forest Elf",
    characterClass: "Rogue",
    level: 1,
    xp: 0,
    totalXP: 0,
    bodyPoints: 8, // Forest Elf L1 (4) + Rogue L1 (4)
    skillPoints: 140,
    freeLanguage: "Elvish",
    history: "A legendary ranger of the Greenwood whose arrows never miss. Played a crucial role in the Battle of Thornwood Pass, her arrows cutting down orc scouts before they could breach the lines. Quiet and deadly, she speaks little but acts decisively.",
    skills: [
      { skillName: "Resist Disease", purchaseCount: 1, totalCost: 0, acquiredAt: "2025-09-18", reason: "Racial bonus" },
      { skillName: "Resist Sleep", purchaseCount: 1, totalCost: 0, acquiredAt: "2025-09-18", reason: "Racial bonus" },
      { skillName: "Bow", purchaseCount: 1, totalCost: 36, acquiredAt: "2025-09-18", reason: "Character creation" },
      { skillName: "Dagger", purchaseCount: 1, totalCost: 6, acquiredAt: "2025-09-18", reason: "Character creation" },
      { skillName: "Tracking", purchaseCount: 1, totalCost: 40, acquiredAt: "2025-09-18", reason: "Character creation" },
      { skillName: "First Aid", purchaseCount: 1, totalCost: 20, acquiredAt: "2025-09-18", reason: "Character creation" },
      { skillName: "Navigation", purchaseCount: 1, totalCost: 20, acquiredAt: "2025-09-18", reason: "Character creation" },
      { skillName: "Appraisal", purchaseCount: 1, totalCost: 15, acquiredAt: "2025-09-18", reason: "Character creation" },
    ],
    skillPointsSpent: 137,
    equipment: [
      { itemName: "Leather Armor", quantity: 1, totalCost: 5, acquiredAt: "2025-09-18", reason: "Starting equipment" },
    ],
    startingSilver: 50,
    silverSpent: 5,
    lifeCredits: 3,
  };
  const maeven = await prisma.character.create({
    data: {
      userId: p2.id, name: "Maeven",
      data: JSON.stringify(maevenData),
      status: "approved",
      submittedAt: new Date("2025-09-20"),
      reviewedBy: cbd.id, reviewedAt: new Date("2025-09-22"),
      reviewNotes: "Approved. Strong wilderness build.",
    },
  });

  // P3: Elara — Human Cleric, healer from the Battle of Thornwood
  const elaraData = {
    name: "Elara",
    race: "Human",
    characterClass: "Cleric",
    level: 1,
    xp: 0,
    totalXP: 0,
    bodyPoints: 8, // Human L1 (4) + Cleric L1 (4)
    skillPoints: 140,
    freeLanguage: "Common",
    history: "A devoted healer who tended the wounded tirelessly during the Battle of Thornwood Pass. She has since taken up residence at the Temple of the Silver Moon, training young clerics and researching ancient healing rituals.",
    skills: [
      { skillName: "Urban Lore", purchaseCount: 1, totalCost: 0, acquiredAt: "2025-09-12", reason: "Racial bonus" },
      { skillName: "First Aid", purchaseCount: 1, totalCost: 10, acquiredAt: "2025-09-12", reason: "Character creation" },
      { skillName: "Read/Write (Common)", purchaseCount: 1, totalCost: 10, acquiredAt: "2025-09-12", reason: "Character creation" },
      { skillName: "Flora Lore", purchaseCount: 1, totalCost: 10, acquiredAt: "2025-09-12", reason: "Character creation" },
      { skillName: "Earth-Water Ability", purchaseCount: 1, totalCost: 30, acquiredAt: "2025-09-12", reason: "Character creation" },
      { skillName: "Earth-Water 1", purchaseCount: 3, totalCost: 15, acquiredAt: "2025-09-12", reason: "Character creation" },
      { skillName: "Earth-Water 2", purchaseCount: 1, totalCost: 5, acquiredAt: "2025-09-12", reason: "Character creation" },
      { skillName: "Herbalism", purchaseCount: 2, totalCost: 32, acquiredAt: "2025-09-12", reason: "Character creation" },
      { skillName: "Craft (Brewing)", purchaseCount: 1, totalCost: 16, acquiredAt: "2025-09-12", reason: "Character creation" },
    ],
    skillPointsSpent: 128,
    equipment: [
      { itemName: "Spell Book", quantity: 1, totalCost: 30, acquiredAt: "2025-09-12", reason: "Starting equipment" },
      { itemName: "Trade Tools", quantity: 1, totalCost: 5, acquiredAt: "2025-09-12", reason: "Starting equipment" },
    ],
    startingSilver: 50,
    silverSpent: 35,
    lifeCredits: 3,
  };
  const elara = await prisma.character.create({
    data: {
      userId: p3.id, name: "Elara",
      data: JSON.stringify(elaraData),
      status: "approved",
      submittedAt: new Date("2025-09-15"),
      reviewedBy: cbd.id, reviewedAt: new Date("2025-09-16"),
      reviewNotes: "Approved. Solid healer build.",
    },
  });

  // P4: Marcus Thornwell — Human Warrior, son of Lord Cedric
  const marcusData = {
    name: "Marcus of Thornwood",
    race: "Human",
    characterClass: "Warrior",
    level: 1,
    xp: 0,
    totalXP: 0,
    bodyPoints: 8, // Human L1 (4) + Warrior L1 (4)
    skillPoints: 140,
    freeLanguage: "Common",
    history: "Young Lord Marcus, son of the fallen Lord Cedric who gave his life holding Thornwood Pass. Sworn to continue his father's legacy of service to the realm. Though still young, he commands respect among the soldiers who served under his father.",
    skills: [
      { skillName: "Urban Lore", purchaseCount: 1, totalCost: 0, acquiredAt: "2026-01-05", reason: "Racial bonus" },
      { skillName: "Two-Handed Weapons", purchaseCount: 1, totalCost: 30, acquiredAt: "2026-01-05", reason: "Character creation" },
      { skillName: "First Aid", purchaseCount: 1, totalCost: 20, acquiredAt: "2026-01-05", reason: "Character creation" },
      { skillName: "War Tactics (Small Unit)", purchaseCount: 1, totalCost: 20, acquiredAt: "2026-01-05", reason: "Character creation" },
      { skillName: "Horsemanship", purchaseCount: 1, totalCost: 20, acquiredAt: "2026-01-05", reason: "Character creation" },
      { skillName: "Read/Write (Common)", purchaseCount: 1, totalCost: 20, acquiredAt: "2026-01-05", reason: "Character creation" },
      { skillName: "Navigation", purchaseCount: 1, totalCost: 20, acquiredAt: "2026-01-05", reason: "Character creation" },
    ],
    skillPointsSpent: 130,
    equipment: [
      { itemName: "Leather Armor", quantity: 1, totalCost: 5, acquiredAt: "2026-01-05", reason: "Starting equipment" },
      { itemName: "Composite Leather Armor", quantity: 1, totalCost: 10, acquiredAt: "2026-01-05", reason: "Starting equipment" },
    ],
    startingSilver: 50,
    silverSpent: 15,
    lifeCredits: 3,
  };
  const marcus = await prisma.character.create({
    data: {
      userId: p4.id, name: "Marcus of Thornwood",
      data: JSON.stringify(marcusData),
      status: "approved",
      submittedAt: new Date("2026-01-10"),
      reviewedBy: cbd.id, reviewedAt: new Date("2026-01-12"),
      reviewNotes: "Approved. Welcome to the realm, Lord Marcus.",
    },
  });

  // P5: Vaelith Stormweaver — Common Elf Mage, seeker of the Lost Temple
  const vaelithData = {
    name: "Vaelith Stormweaver",
    race: "Common Elf",
    characterClass: "Mage",
    level: 1,
    xp: 0,
    totalXP: 0,
    bodyPoints: 8, // Common Elf L1 (4) + Mage L1 (4)
    skillPoints: 140,
    freeLanguage: "Elvish",
    history: "An elven scholar who left the Ivory Tower to study wild magic in the untamed lands. Recently spotted asking questions about the Lost Temple of Mysteries. Some whisper she commissioned a replica of the Crown of Stars — but for what purpose?",
    skills: [
      { skillName: "Resist Charm", purchaseCount: 1, totalCost: 0, acquiredAt: "2025-10-01", reason: "Racial bonus" },
      { skillName: "Resist Sleep", purchaseCount: 1, totalCost: 0, acquiredAt: "2025-10-01", reason: "Racial bonus" },
      { skillName: "Read/Write (Common)", purchaseCount: 1, totalCost: 10, acquiredAt: "2025-10-01", reason: "Character creation" },
      { skillName: "Read/Write (Elvish)", purchaseCount: 1, totalCost: 10, acquiredAt: "2025-10-01", reason: "Character creation" },
      { skillName: "Fire-Air Ability", purchaseCount: 1, totalCost: 30, acquiredAt: "2025-10-01", reason: "Character creation" },
      { skillName: "Fire-Air 1", purchaseCount: 3, totalCost: 15, acquiredAt: "2025-10-01", reason: "Character creation" },
      { skillName: "Fire-Air 2", purchaseCount: 1, totalCost: 5, acquiredAt: "2025-10-01", reason: "Character creation" },
      { skillName: "Staff", purchaseCount: 1, totalCost: 17, acquiredAt: "2025-10-01", reason: "Character creation" },
      { skillName: "Dagger", purchaseCount: 1, totalCost: 6, acquiredAt: "2025-10-01", reason: "Character creation" },
      { skillName: "Appraisal", purchaseCount: 1, totalCost: 15, acquiredAt: "2025-10-01", reason: "Character creation" },
      { skillName: "Flora Lore", purchaseCount: 1, totalCost: 20, acquiredAt: "2025-10-01", reason: "Character creation" },
    ],
    skillPointsSpent: 128,
    equipment: [
      { itemName: "Spell Book", quantity: 1, totalCost: 30, acquiredAt: "2025-10-01", reason: "Starting equipment" },
    ],
    startingSilver: 50,
    silverSpent: 30,
    lifeCredits: 3,
  };
  const vaelith = await prisma.character.create({
    data: {
      userId: p5.id, name: "Vaelith Stormweaver",
      data: JSON.stringify(vaelithData),
      status: "approved",
      submittedAt: new Date("2025-10-05"),
      reviewedBy: cbd.id, reviewedAt: new Date("2025-10-06"),
      reviewNotes: "Approved. Interesting backstory tie to the Lost Temple lore.",
    },
  });

  // P3 also has a draft character
  await prisma.character.create({
    data: {
      userId: p3.id, name: "Sister Miriel",
      data: JSON.stringify({
        name: "Sister Miriel", race: "Human", characterClass: "Cleric", level: 1,
        xp: 0, totalXP: 0, bodyPoints: 8, skillPoints: 140,
        freeLanguage: "Common",
        history: "A traveling priestess of the Silver Moon, newly arrived to the realm.",
        skills: [
          { skillName: "Urban Lore", purchaseCount: 1, totalCost: 0, acquiredAt: "2026-03-01", reason: "Racial bonus" },
          { skillName: "First Aid", purchaseCount: 1, totalCost: 10, acquiredAt: "2026-03-01", reason: "Character creation" },
          { skillName: "Read/Write (Common)", purchaseCount: 1, totalCost: 10, acquiredAt: "2026-03-01", reason: "Character creation" },
          { skillName: "Earth-Water Ability", purchaseCount: 1, totalCost: 30, acquiredAt: "2026-03-01", reason: "Character creation" },
        ],
        skillPointsSpent: 50,
        equipment: [],
        startingSilver: 50,
        silverSpent: 0,
      }),
      status: "draft",
    },
  });

  // P4 has a pending_review character
  const pendingChar = await prisma.character.create({
    data: {
      userId: p4.id, name: "Grimjaw the Unyielding",
      data: JSON.stringify({
        name: "Grimjaw the Unyielding", race: "Half-Orc", characterClass: "Warrior", level: 1,
        xp: 0, totalXP: 0, bodyPoints: 8, skillPoints: 140,
        freeLanguage: "Common",
        history: "A fierce half-orc from the Badlands, seeking redemption in the civilized lands.",
        skills: [
          { skillName: "Resist Stun", purchaseCount: 1, totalCost: 0, acquiredAt: "2026-03-03", reason: "Racial bonus" },
          { skillName: "Resist Sleep", purchaseCount: 1, totalCost: 0, acquiredAt: "2026-03-03", reason: "Racial bonus" },
          { skillName: "Two-Handed Weapons", purchaseCount: 1, totalCost: 30, acquiredAt: "2026-03-03", reason: "Character creation" },
          { skillName: "Added Damage 1 (Great Axe, 2H)", purchaseCount: 1, totalCost: 20, acquiredAt: "2026-03-03", reason: "Character creation" },
          { skillName: "Damage Control", purchaseCount: 1, totalCost: 40, acquiredAt: "2026-03-03", reason: "Character creation" },
          { skillName: "First Aid", purchaseCount: 1, totalCost: 20, acquiredAt: "2026-03-03", reason: "Character creation" },
          { skillName: "Blind Fighting", purchaseCount: 1, totalCost: 20, acquiredAt: "2026-03-03", reason: "Character creation" },
        ],
        skillPointsSpent: 130,
        equipment: [
          { itemName: "Leather Armor", quantity: 1, totalCost: 5, acquiredAt: "2026-03-03", reason: "Starting equipment" },
        ],
        startingSilver: 50,
        silverSpent: 5,
      }),
      status: "pending_review",
      submittedAt: new Date("2026-03-05"),
    },
  });

  // ─── INACTIVE CHARACTERS (one per player, last activity >12 months ago) ─────
  // These characters were played in early 2024 and haven't attended an event since.

  const inactiveKara = await prisma.character.create({
    data: {
      userId: p1.id, name: "Brynn the Bold",
      data: JSON.stringify({
        name: "Brynn the Bold", race: "Human", characterClass: "Warrior", level: 1,
        xp: 0, totalXP: 0, bodyPoints: 8, skillPoints: 140,
        freeLanguage: "Common",
        history: "A boisterous sell-sword who joined every tavern brawl in the Capital before retiring to a quiet farm life.",
        skills: [
          { skillName: "Urban Lore", purchaseCount: 1, totalCost: 0, acquiredAt: "2024-01-10", reason: "Racial bonus" },
          { skillName: "One-Handed Weapons", purchaseCount: 1, totalCost: 30, acquiredAt: "2024-01-10", reason: "Character creation" },
          { skillName: "Shields", purchaseCount: 1, totalCost: 20, acquiredAt: "2024-01-10", reason: "Character creation" },
          { skillName: "First Aid", purchaseCount: 1, totalCost: 20, acquiredAt: "2024-01-10", reason: "Character creation" },
        ],
        skillPointsSpent: 70, equipment: [], startingSilver: 50, silverSpent: 0,
      }),
      status: "approved", inactive: true,
      createdAt: new Date("2024-01-10"),
      submittedAt: new Date("2024-01-12"),
      reviewedBy: cbd.id, reviewedAt: new Date("2024-01-14"),
      reviewNotes: "Approved for play.",
    },
  });

  const inactiveMaeven = await prisma.character.create({
    data: {
      userId: p2.id, name: "Fenwick Thornfoot",
      data: JSON.stringify({
        name: "Fenwick Thornfoot", race: "Halfling", characterClass: "Rogue", level: 1,
        xp: 0, totalXP: 0, bodyPoints: 8, skillPoints: 140,
        freeLanguage: "Common",
        history: "A curious halfling locksmith who got in over his head exploring ruins near the Darkwood.",
        skills: [
          { skillName: "Resist Charm", purchaseCount: 1, totalCost: 0, acquiredAt: "2024-02-05", reason: "Racial bonus" },
          { skillName: "Resist Disease", purchaseCount: 1, totalCost: 0, acquiredAt: "2024-02-05", reason: "Racial bonus" },
          { skillName: "Pick Locks", purchaseCount: 1, totalCost: 40, acquiredAt: "2024-02-05", reason: "Character creation" },
          { skillName: "Dagger", purchaseCount: 1, totalCost: 6, acquiredAt: "2024-02-05", reason: "Character creation" },
          { skillName: "First Aid", purchaseCount: 1, totalCost: 20, acquiredAt: "2024-02-05", reason: "Character creation" },
        ],
        skillPointsSpent: 66, equipment: [], startingSilver: 50, silverSpent: 0,
      }),
      status: "approved", inactive: true,
      createdAt: new Date("2024-02-05"),
      submittedAt: new Date("2024-02-07"),
      reviewedBy: cbd.id, reviewedAt: new Date("2024-02-08"),
      reviewNotes: "Approved.",
    },
  });

  const inactiveElara = await prisma.character.create({
    data: {
      userId: p3.id, name: "Brother Aldous",
      data: JSON.stringify({
        name: "Brother Aldous", race: "Dwarf", characterClass: "Cleric", level: 1,
        xp: 0, totalXP: 0, bodyPoints: 8, skillPoints: 140,
        freeLanguage: "Common",
        history: "A dwarven monk who wandered the realm dispensing wisdom and ale in equal measure.",
        skills: [
          { skillName: "Resist Charm", purchaseCount: 1, totalCost: 0, acquiredAt: "2024-03-01", reason: "Racial bonus" },
          { skillName: "Resist Stun", purchaseCount: 1, totalCost: 0, acquiredAt: "2024-03-01", reason: "Racial bonus" },
          { skillName: "First Aid", purchaseCount: 1, totalCost: 10, acquiredAt: "2024-03-01", reason: "Character creation" },
          { skillName: "Read/Write (Common)", purchaseCount: 1, totalCost: 10, acquiredAt: "2024-03-01", reason: "Character creation" },
          { skillName: "Earth-Water Ability", purchaseCount: 1, totalCost: 30, acquiredAt: "2024-03-01", reason: "Character creation" },
        ],
        skillPointsSpent: 50, equipment: [], startingSilver: 50, silverSpent: 0,
      }),
      status: "approved", inactive: true,
      createdAt: new Date("2024-03-01"),
      submittedAt: new Date("2024-03-03"),
      reviewedBy: cbd.id, reviewedAt: new Date("2024-03-04"),
      reviewNotes: "Approved. Welcome, Brother.",
    },
  });

  const inactiveMarcus = await prisma.character.create({
    data: {
      userId: p4.id, name: "Sable Nightwhisper",
      data: JSON.stringify({
        name: "Sable Nightwhisper", race: "Common Elf", characterClass: "Rogue", level: 1,
        xp: 0, totalXP: 0, bodyPoints: 8, skillPoints: 140,
        freeLanguage: "Elvish",
        history: "An elven spy who once served the court but vanished after a scandal involving forged documents.",
        skills: [
          { skillName: "Resist Charm", purchaseCount: 1, totalCost: 0, acquiredAt: "2024-01-20", reason: "Racial bonus" },
          { skillName: "Resist Sleep", purchaseCount: 1, totalCost: 0, acquiredAt: "2024-01-20", reason: "Racial bonus" },
          { skillName: "Dagger", purchaseCount: 1, totalCost: 6, acquiredAt: "2024-01-20", reason: "Character creation" },
          { skillName: "Tracking", purchaseCount: 1, totalCost: 40, acquiredAt: "2024-01-20", reason: "Character creation" },
          { skillName: "Appraisal", purchaseCount: 1, totalCost: 15, acquiredAt: "2024-01-20", reason: "Character creation" },
        ],
        skillPointsSpent: 61, equipment: [], startingSilver: 50, silverSpent: 0,
      }),
      status: "approved", inactive: true,
      createdAt: new Date("2024-01-20"),
      submittedAt: new Date("2024-01-22"),
      reviewedBy: cbd.id, reviewedAt: new Date("2024-01-24"),
      reviewNotes: "Approved. Interesting concept.",
    },
  });

  const inactiveVaelith = await prisma.character.create({
    data: {
      userId: p5.id, name: "Old Garreth",
      data: JSON.stringify({
        name: "Old Garreth", race: "Human", characterClass: "Mage", level: 1,
        xp: 0, totalXP: 0, bodyPoints: 8, skillPoints: 140,
        freeLanguage: "Common",
        history: "A retired village wizard who once dreamed of grand adventures but settled for fixing leaky roofs with minor cantrips.",
        skills: [
          { skillName: "Urban Lore", purchaseCount: 1, totalCost: 0, acquiredAt: "2024-02-15", reason: "Racial bonus" },
          { skillName: "Read/Write (Common)", purchaseCount: 1, totalCost: 10, acquiredAt: "2024-02-15", reason: "Character creation" },
          { skillName: "Fire-Air Ability", purchaseCount: 1, totalCost: 30, acquiredAt: "2024-02-15", reason: "Character creation" },
          { skillName: "Fire-Air 1", purchaseCount: 2, totalCost: 10, acquiredAt: "2024-02-15", reason: "Character creation" },
        ],
        skillPointsSpent: 50, equipment: [], startingSilver: 50, silverSpent: 0,
      }),
      status: "approved", inactive: true,
      createdAt: new Date("2024-02-15"),
      submittedAt: new Date("2024-02-17"),
      reviewedBy: cbd.id, reviewedAt: new Date("2024-02-18"),
      reviewNotes: "Approved. Charming backstory.",
    },
  });

  // Register inactive characters at the old event (their last activity)
  for (const { user, char } of [
    { user: p1, char: inactiveKara },
    { user: p2, char: inactiveMaeven },
    { user: p3, char: inactiveElara },
    { user: p4, char: inactiveMarcus },
    { user: p5, char: inactiveVaelith },
  ]) {
    await prisma.eventRegistration.create({
      data: {
        userId: user.id, eventId: eventOld.id, characterId: char.id,
        ticketType: "single_a", amountPaid: 3500, paymentStatus: "paid",
        arfSignedAt: new Date("2024-01-15"), arfYear: 2024,
        checkedInAt: new Date("2024-02-10T10:00:00"),
      },
    });
  }

  console.log("✓ Created 5 inactive characters (one per player, last activity >12 months ago)");
  console.log("✓ Created Midwinter Revel 2024 registrations for inactive characters");

  // ─── NEAR-DEATH TEST CHARACTER ───────────────────────────────────────────────
  // Grimm Deathwalker: Level 3 Half-Orc Warrior with only 1 life credit remaining
  const grimmData = {
    name: "Grimm Deathwalker",
    race: "Half-Orc",
    characterClass: "Warrior",
    level: 3,
    xp: 0,
    totalXP: 30,
    bodyPoints: 14,
    skillPoints: 170,
    freeLanguage: "Common",
    history: "A battle-scarred warrior who has cheated death many times. His reckless fighting style has cost him dearly — he has lost 4 of his 5 life credits across various events. One more death and Grimm walks the final road.",
    skills: [
      { skillName: "Orcish Lore", purchaseCount: 1, totalCost: 0, acquiredAt: "2025-06-01", reason: "Racial bonus" },
      { skillName: "One-Handed Weapons", purchaseCount: 1, totalCost: 30, acquiredAt: "2025-06-01", reason: "Character creation" },
      { skillName: "Two-Handed Weapons", purchaseCount: 1, totalCost: 30, acquiredAt: "2025-06-01", reason: "Character creation" },
      { skillName: "Added Damage 1 (Greatsword, 2H)", purchaseCount: 1, totalCost: 20, acquiredAt: "2025-06-01", reason: "Character creation" },
      { skillName: "First Aid", purchaseCount: 1, totalCost: 20, acquiredAt: "2025-06-01", reason: "Character creation" },
      { skillName: "Physical Development", purchaseCount: 1, totalCost: 30, acquiredAt: "2025-10-18", reason: "Learned at Autumn's End 2025" },
    ],
    skillPointsSpent: 130,
    equipment: [
      { itemName: "Greatsword", quantity: 1, totalCost: 10, acquiredAt: "2025-06-01", reason: "Starting equipment" },
      { itemName: "Leather Armor", quantity: 1, totalCost: 5, acquiredAt: "2025-06-01", reason: "Starting equipment" },
    ],
    startingSilver: 50,
    silverSpent: 15,
    lifeCredits: 1, // Base 3 + 2 level-ups = 5 total, lost 4 → 1 remaining
    dead: false,
  };
  const grimm = await prisma.character.create({
    data: {
      userId: p6.id, name: "Grimm Deathwalker",
      data: JSON.stringify(grimmData),
      status: "approved",
      submittedAt: new Date("2025-06-05"),
      reviewedBy: cbd.id, reviewedAt: new Date("2025-06-06"),
      reviewNotes: "Approved. Note: character is at critically low life credits.",
    },
  });

  console.log("✓ Created 13 characters (6 approved, 5 inactive, 1 draft, 1 pending review)");
  console.log("  ⚠ Grimm Deathwalker: 1 life credit remaining (test character for death system)");

  // ─── AUDIT LOGS ──────────────────────────────────────────────────────────────
  const allApproved = [
    { char: kara, player: p1, charName: "Kara Swiftblade", created: "2025-09-28", submitted: "2025-10-01", approved: "2025-10-02" },
    { char: maeven, player: p2, charName: "Maeven", created: "2025-09-18", submitted: "2025-09-20", approved: "2025-09-22" },
    { char: elara, player: p3, charName: "Elara", created: "2025-09-12", submitted: "2025-09-15", approved: "2025-09-16" },
    { char: marcus, player: p4, charName: "Marcus of Thornwood", created: "2026-01-05", submitted: "2026-01-10", approved: "2026-01-12" },
    { char: vaelith, player: p5, charName: "Vaelith Stormweaver", created: "2025-10-01", submitted: "2025-10-05", approved: "2025-10-06" },
    { char: grimm, player: p6, charName: "Grimm Deathwalker", created: "2025-06-01", submitted: "2025-06-05", approved: "2025-06-06" },
  ];

  for (const c of allApproved) {
    await prisma.auditLog.createMany({
      data: [
        { characterId: c.char.id, actorId: c.player.id, actorName: c.player.name, actorRole: "user", action: "created", details: JSON.stringify({ name: c.charName }), createdAt: new Date(c.created) },
        { characterId: c.char.id, actorId: c.player.id, actorName: c.player.name, actorRole: "user", action: "submitted", details: JSON.stringify({ submittedFor: "review" }), createdAt: new Date(c.submitted) },
        { characterId: c.char.id, actorId: cbd.id, actorName: cbd.name, actorRole: "cbd", action: "approved", details: JSON.stringify({ notes: "Approved for play." }), createdAt: new Date(c.approved) },
      ],
    });
  }

  // Inactive character audit logs
  const allInactive = [
    { char: inactiveKara, player: p1, charName: "Brynn the Bold", created: "2024-01-10", submitted: "2024-01-12", approved: "2024-01-14" },
    { char: inactiveMaeven, player: p2, charName: "Fenwick Thornfoot", created: "2024-02-05", submitted: "2024-02-07", approved: "2024-02-08" },
    { char: inactiveElara, player: p3, charName: "Brother Aldous", created: "2024-03-01", submitted: "2024-03-03", approved: "2024-03-04" },
    { char: inactiveMarcus, player: p4, charName: "Sable Nightwhisper", created: "2024-01-20", submitted: "2024-01-22", approved: "2024-01-24" },
    { char: inactiveVaelith, player: p5, charName: "Old Garreth", created: "2024-02-15", submitted: "2024-02-17", approved: "2024-02-18" },
  ];

  for (const c of allInactive) {
    await prisma.auditLog.createMany({
      data: [
        { characterId: c.char.id, actorId: c.player.id, actorName: c.player.name, actorRole: "user", action: "created", details: JSON.stringify({ name: c.charName }), createdAt: new Date(c.created) },
        { characterId: c.char.id, actorId: c.player.id, actorName: c.player.name, actorRole: "user", action: "submitted", details: JSON.stringify({ submittedFor: "review" }), createdAt: new Date(c.submitted) },
        { characterId: c.char.id, actorId: cbd.id, actorName: cbd.name, actorRole: "cbd", action: "approved", details: JSON.stringify({ notes: "Approved for play." }), createdAt: new Date(c.approved) },
      ],
    });
  }

  // Pending review audit log
  await prisma.auditLog.createMany({
    data: [
      { characterId: pendingChar.id, actorId: p4.id, actorName: p4.name, actorRole: "user", action: "created", details: JSON.stringify({ name: "Grimjaw the Unyielding" }), createdAt: new Date("2026-03-03") },
      { characterId: pendingChar.id, actorId: p4.id, actorName: p4.name, actorRole: "user", action: "submitted", details: JSON.stringify({ submittedFor: "review" }), createdAt: new Date("2026-03-05") },
    ],
  });
  console.log("✓ Created audit logs");

  // ─── PLAYER BANKS ────────────────────────────────────────────────────────────
  const chars = [kara, maeven, elara, marcus, vaelith];
  for (const c of chars) {
    const charData = JSON.parse(c.data);
    const silverSpent = charData.silverSpent ?? 0;
    const equipmentCost = silverSpent * 100; // convert silver to copper
    const startingBalance = 5000 - equipmentCost;
    const transactions: { type: string; amount: number; description: string }[] = [
      { type: "deposit", amount: 5000, description: "Starting silver for new character" },
    ];
    if (equipmentCost > 0) {
      transactions.push({ type: "withdrawal", amount: -equipmentCost, description: "Starting equipment purchases" });
    }
    await prisma.playerBank.create({
      data: {
        characterId: c.id,
        balance: startingBalance,
        transactions: { create: transactions },
      },
    });
  }
  console.log("✓ Created player banks with starting silver (minus equipment)");

  // ─── EVENT 1 REGISTRATIONS: Autumn's End 2025 (completed) ────────────────────
  // Attended: Kara, Maeven, Elara, Vaelith (4 of 5 — Marcus wasn't created yet)

  await prisma.eventRegistration.create({
    data: {
      userId: p1.id, eventId: event1.id, characterId: kara.id,
      ticketType: "single_a", amountPaid: 3500, paymentStatus: "paid",
      arfSignedAt: new Date("2025-10-01"), arfYear: 2025,
      checkedInAt: new Date("2025-10-18T09:30:00"),
    },
  });
  await prisma.eventRegistration.create({
    data: {
      userId: p2.id, eventId: event1.id, characterId: maeven.id,
      ticketType: "single_a", amountPaid: 3500, paymentStatus: "paid",
      arfSignedAt: new Date("2025-10-01"), arfYear: 2025,
      checkedInAt: new Date("2025-10-18T09:45:00"),
    },
  });
  await prisma.eventRegistration.create({
    data: {
      userId: p3.id, eventId: event1.id, characterId: elara.id,
      ticketType: "single_b", amountPaid: 4500, paymentStatus: "paid",
      arfSignedAt: new Date("2025-10-05"), arfYear: 2025,
      checkedInAt: new Date("2025-10-18T10:15:00"),
    },
  });
  await prisma.eventRegistration.create({
    data: {
      userId: p5.id, eventId: event1.id, characterId: vaelith.id,
      ticketType: "single_a", amountPaid: 3500, paymentStatus: "paid",
      arfSignedAt: new Date("2025-10-10"), arfYear: 2025,
      checkedInAt: new Date("2025-10-18T10:00:00"),
    },
  });

  console.log("✓ Created Autumn's End registrations (4 players)");

  // ─── EVENT 2 REGISTRATIONS: Winter's Tale 2026 (completed) ────────────────────
  // Attended: Kara, Maeven, Marcus (3 of 5 — Elara was ill, Vaelith was traveling)

  await prisma.eventRegistration.create({
    data: {
      userId: p1.id, eventId: event2.id, characterId: kara.id,
      ticketType: "single_a", amountPaid: 3500, paymentStatus: "paid",
      arfSignedAt: new Date("2025-10-01"), arfYear: 2026,
      checkedInAt: new Date("2026-02-15T09:30:00"),
    },
  });
  await prisma.eventRegistration.create({
    data: {
      userId: p2.id, eventId: event2.id, characterId: maeven.id,
      ticketType: "single_a", amountPaid: 3500, paymentStatus: "paid",
      arfSignedAt: new Date("2025-10-01"), arfYear: 2026,
      checkedInAt: new Date("2026-02-15T09:45:00"),
    },
  });
  await prisma.eventRegistration.create({
    data: {
      userId: p4.id, eventId: event2.id, characterId: marcus.id,
      ticketType: "single_b", amountPaid: 4500, paymentStatus: "paid",
      arfSignedAt: new Date("2026-01-20"), arfYear: 2026,
      checkedInAt: new Date("2026-02-15T10:00:00"),
    },
  });

  // Elara and Vaelith also attended Winter's Tale — NO sign-outs yet (for testing)
  await prisma.eventRegistration.create({
    data: {
      userId: p3.id, eventId: event2.id, characterId: elara.id,
      ticketType: "single_a", amountPaid: 3500, paymentStatus: "paid",
      arfSignedAt: new Date("2026-01-18"), arfYear: 2026,
      checkedInAt: new Date("2026-02-15T10:30:00"),
    },
  });
  await prisma.eventRegistration.create({
    data: {
      userId: p5.id, eventId: event2.id, characterId: vaelith.id,
      ticketType: "single_a", amountPaid: 3500, paymentStatus: "paid",
      arfSignedAt: new Date("2026-01-22"), arfYear: 2026,
      checkedInAt: new Date("2026-02-15T11:00:00"),
    },
  });

  // Grimm at Winter's Tale
  await prisma.eventRegistration.create({
    data: {
      userId: p6.id, eventId: event2.id, characterId: grimm.id,
      ticketType: "single_a", amountPaid: 3500, paymentStatus: "paid",
      arfSignedAt: new Date("2026-01-10"), arfYear: 2026,
      checkedInAt: new Date("2026-02-15T09:30:00"),
    },
  });

  console.log("✓ Created Winter's Tale registrations (6 players)");

  // No sign-outs yet — clean slate for testing the sign-out flow
  console.log("✓ No sign-outs created (clean slate for testing)");

  // ─── EVENT 3 REGISTRATIONS: Spring Awakening (active) ────────────────────────
  // Some players registered for the active event
  await prisma.eventRegistration.create({
    data: {
      userId: p1.id, eventId: event3.id,
      ticketType: "single_a", amountPaid: 3500, paymentStatus: "paid",
      arfSignedAt: new Date("2025-10-01"), arfYear: 2026,
    },
  });
  await prisma.eventRegistration.create({
    data: {
      userId: p2.id, eventId: event3.id,
      ticketType: "single_a", amountPaid: 3500, paymentStatus: "paid",
      arfSignedAt: new Date("2025-10-01"), arfYear: 2026,
    },
  });
  await prisma.eventRegistration.create({
    data: {
      userId: p3.id, eventId: event3.id,
      ticketType: "single_b", amountPaid: 4500, paymentStatus: "unpaid",
      arfSignedAt: new Date("2026-03-01"), arfYear: 2026,
    },
  });
  await prisma.eventRegistration.create({
    data: {
      userId: p4.id, eventId: event3.id,
      ticketType: "single_a", amountPaid: 3500, paymentStatus: "paid",
      arfSignedAt: new Date("2026-01-20"), arfYear: 2026,
    },
  });
  await prisma.eventRegistration.create({
    data: {
      userId: p5.id, eventId: event3.id,
      ticketType: "single_b", amountPaid: 4500, paymentStatus: "paid",
      arfSignedAt: new Date("2026-02-28"), arfYear: 2026,
    },
  });

  // Grimm at Spring Awakening (active event — for testing sign-out with life credit loss)
  await prisma.eventRegistration.create({
    data: {
      userId: p6.id, eventId: event3.id, characterId: grimm.id,
      ticketType: "single_a", amountPaid: 3500, paymentStatus: "paid",
      arfSignedAt: new Date("2026-01-10"), arfYear: 2026,
      checkedInAt: new Date("2026-03-08T09:00:00"),
    },
  });

  console.log("✓ Created Spring Awakening registrations (6 players)");

  // ─── MONSTER BOOK ENTRIES ──────────────────────────────────────────────────
  await prisma.monsterBookEntry.createMany({
    data: [
      // Beasts
      {
        name: "Dire Wolf", category: "beast", race: null, level: 3, bodyPoints: 15,
        description: "A massive wolf with glowing amber eyes. Hunts in packs and is fiercely territorial.",
        abilities: JSON.stringify(["Bite (3 damage)", "Pack Tactics (+1 damage when flanking)", "Knockdown (1/encounter)"]),
        resistances: JSON.stringify(["Cold"]),
        weaknesses: JSON.stringify(["Fire"]),
        loot: JSON.stringify({ silver: 5, items: ["Wolf Pelt", "Dire Wolf Fang"] }),
        tags: JSON.stringify(["minion", "pack"]),
        createdBy: gm.id,
      },
      {
        name: "Giant Spider", category: "beast", race: null, level: 4, bodyPoints: 20,
        description: "Car-sized arachnid that lurks in dark caves and forest canopies. Spins webs to trap prey.",
        abilities: JSON.stringify(["Bite (4 damage + poison)", "Web Trap (entangle 30 seconds)", "Wall Climb"]),
        resistances: JSON.stringify([]),
        weaknesses: JSON.stringify(["Fire", "Slashing"]),
        loot: JSON.stringify({ silver: 8, items: ["Spider Silk", "Venom Sac"] }),
        tags: JSON.stringify(["minion"]),
        createdBy: gm.id,
      },
      {
        name: "Owlbear", category: "beast", race: null, level: 6, bodyPoints: 35,
        description: "A fearsome hybrid creature with the body of a bear and the head of an owl. Extremely aggressive when cornered.",
        abilities: JSON.stringify(["Claw (5 damage)", "Beak Strike (4 damage)", "Screech (fear 10 seconds, 1/encounter)", "Frenzy (double attacks for 15 seconds when below half HP)"]),
        resistances: JSON.stringify([]),
        weaknesses: JSON.stringify([]),
        loot: JSON.stringify({ silver: 20, items: ["Owlbear Feathers", "Owlbear Claw"] }),
        tags: JSON.stringify(["elite"]),
        createdBy: gm.id,
      },
      // Undead
      {
        name: "Skeleton Warrior", category: "undead", race: null, level: 2, bodyPoints: 10,
        description: "Animated remains of fallen soldiers. Fights with rusted weapons and tattered shields.",
        abilities: JSON.stringify(["Sword Strike (2 damage)", "Shield Block (1/encounter)"]),
        resistances: JSON.stringify(["Piercing", "Cold"]),
        weaknesses: JSON.stringify(["Bludgeoning", "Holy"]),
        loot: JSON.stringify({ silver: 3, items: ["Bone Dust", "Rusted Blade"] }),
        tags: JSON.stringify(["minion", "pack"]),
        createdBy: gm.id,
      },
      {
        name: "Wraith", category: "undead", race: null, level: 7, bodyPoints: 25,
        description: "A spectral horror that drains the life force of the living. Partially incorporeal.",
        abilities: JSON.stringify(["Life Drain (3 damage + heal self 2)", "Phase (become incorporeal 10 seconds, 2/encounter)", "Fear Aura (all within 10 feet, resist or flee)"]),
        resistances: JSON.stringify(["Physical (half damage)", "Cold"]),
        weaknesses: JSON.stringify(["Holy", "Silver", "Magic"]),
        loot: JSON.stringify({ silver: 30, items: ["Ectoplasm", "Shadow Essence"] }),
        tags: JSON.stringify(["elite"]),
        createdBy: gm.id,
      },
      {
        name: "Zombie", category: "undead", race: null, level: 1, bodyPoints: 12,
        description: "Shambling corpse animated by dark magic. Slow but relentless.",
        abilities: JSON.stringify(["Slam (2 damage)", "Undead Fortitude (first lethal blow leaves at 1 BP, 1/encounter)"]),
        resistances: JSON.stringify(["Piercing"]),
        weaknesses: JSON.stringify(["Fire", "Holy", "Slashing"]),
        loot: JSON.stringify({ silver: 1, items: ["Rotted Cloth"] }),
        tags: JSON.stringify(["minion", "pack"]),
        createdBy: gm.id,
      },
      // Humanoid
      {
        name: "Orc Raider", category: "humanoid", race: "Orc", level: 3, bodyPoints: 18,
        description: "Battle-hardened orc warrior carrying a crude but effective axe.",
        abilities: JSON.stringify(["Axe Strike (3 damage)", "Battle Cry (+1 damage to allies for 15 seconds, 1/encounter)", "Thick Hide (reduce first hit by 1)"]),
        resistances: JSON.stringify([]),
        weaknesses: JSON.stringify([]),
        loot: JSON.stringify({ silver: 10, items: ["Crude Axe", "Orc War Paint"] }),
        tags: JSON.stringify(["minion"]),
        createdBy: gm.id,
      },
      {
        name: "Bandit Captain", category: "humanoid", race: "Human", level: 5, bodyPoints: 28,
        description: "Leader of a bandit gang. Cunning fighter who uses dirty tactics.",
        abilities: JSON.stringify(["Dual Strike (2x3 damage)", "Parry (negate one attack, 2/encounter)", "Rally (heal allies 3 BP, 1/encounter)", "Dirty Fighting (blind 10 seconds, 1/encounter)"]),
        resistances: JSON.stringify([]),
        weaknesses: JSON.stringify([]),
        loot: JSON.stringify({ silver: 40, items: ["Fine Sword", "Coin Purse", "Map Fragment"] }),
        tags: JSON.stringify(["elite", "leader"]),
        createdBy: gm.id,
      },
      // Fey
      {
        name: "Will-o-Wisp", category: "fey", race: null, level: 4, bodyPoints: 8,
        description: "Flickering ball of ethereal light that lures travelers into bogs and swamps.",
        abilities: JSON.stringify(["Shock (3 lightning damage)", "Lure (charm target to follow, resist with willpower)", "Blink (teleport 20 feet, 3/encounter)", "Invisibility (until next attack)"]),
        resistances: JSON.stringify(["Physical (immune)", "Lightning"]),
        weaknesses: JSON.stringify(["Magic", "Radiant"]),
        loot: JSON.stringify({ silver: 15, items: ["Wisp Essence"] }),
        tags: JSON.stringify(["elite"]),
        createdBy: gm.id,
      },
      // Demons
      {
        name: "Shadow Imp", category: "demon", race: null, level: 2, bodyPoints: 8,
        description: "A small, mischievous demon that delights in causing chaos and stealing shiny objects.",
        abilities: JSON.stringify(["Claw (2 damage)", "Shadow Step (teleport to shadow, 2/encounter)", "Steal (pickpocket on touch)"]),
        resistances: JSON.stringify(["Fire"]),
        weaknesses: JSON.stringify(["Holy", "Silver"]),
        loot: JSON.stringify({ silver: 5, items: ["Imp Horn", "Stolen Trinket"] }),
        tags: JSON.stringify(["minion"]),
        createdBy: gm.id,
      },
      {
        name: "Pit Fiend", category: "demon", race: null, level: 10, bodyPoints: 80,
        description: "A towering demon lord wreathed in hellfire. Commands lesser demons with iron authority.",
        abilities: JSON.stringify(["Hellfire Sword (8 fire damage)", "Flame Whip (5 damage, pull target)", "Infernal Command (summon 2 Shadow Imps)", "Fire Nova (6 damage to all within 15 feet, 1/encounter)", "Regeneration (heal 2 BP per 30 seconds)"]),
        resistances: JSON.stringify(["Fire (immune)", "Physical (half)"]),
        weaknesses: JSON.stringify(["Holy", "Cold", "Silver"]),
        loot: JSON.stringify({ silver: 200, items: ["Hellfire Shard", "Demon Horn", "Infernal Contract"] }),
        tags: JSON.stringify(["boss"]),
        createdBy: gm.id,
      },
      // Constructs
      {
        name: "Stone Golem", category: "construct", race: null, level: 8, bodyPoints: 60,
        description: "An animated stone guardian, typically found protecting ancient temples and vaults.",
        abilities: JSON.stringify(["Slam (6 damage)", "Ground Pound (4 damage to all within 10 feet, 1/encounter)", "Stone Skin (reduce all damage by 2)"]),
        resistances: JSON.stringify(["Physical (reduce by 2)", "Poison (immune)", "Charm (immune)"]),
        weaknesses: JSON.stringify(["Adamantine", "Siege damage"]),
        loot: JSON.stringify({ silver: 0, items: ["Animated Stone Fragment", "Guardian Rune"] }),
        tags: JSON.stringify(["elite"]),
        createdBy: gm.id,
      },
      // NPCs (non-combat characters for encounters)
      {
        name: "Town Guard", category: "npc", race: "Human", level: 2, bodyPoints: 12,
        description: "Standard town militia member. Maintains order and patrols the streets.",
        abilities: JSON.stringify(["Spear Strike (2 damage)", "Shield Wall (with other guards, +2 BP each)"]),
        resistances: JSON.stringify([]),
        weaknesses: JSON.stringify([]),
        loot: null,
        tags: JSON.stringify(["npc", "guard"]),
        createdBy: gm.id,
      },
      {
        name: "Traveling Merchant", category: "npc", race: "Human", level: 1, bodyPoints: 6,
        description: "A well-traveled trader with goods from distant lands. Eager to barter.",
        abilities: JSON.stringify(["Bargain (can trade goods)", "Escape (flee combat, 1/encounter)"]),
        resistances: JSON.stringify([]),
        weaknesses: JSON.stringify([]),
        loot: null,
        tags: JSON.stringify(["npc", "merchant"]),
        createdBy: gm.id,
      },
      {
        name: "Village Elder", category: "npc", race: "Human", level: 1, bodyPoints: 4,
        description: "Wise elder who holds the community's history and secrets. Quest giver.",
        abilities: JSON.stringify(["Lore Knowledge", "Blessing (heal 2 BP to one target, 1/day)"]),
        resistances: JSON.stringify([]),
        weaknesses: JSON.stringify([]),
        loot: null,
        tags: JSON.stringify(["npc", "quest"]),
        createdBy: gm.id,
      },
      {
        name: "Tavern Keeper", category: "npc", race: "Dwarf", level: 3, bodyPoints: 16,
        description: "Stout dwarf who runs the Golden Griffin. Knows everyone's business and serves the best ale.",
        abilities: JSON.stringify(["Brawl (2 damage)", "Barkeep's Knowledge (rumors and information)", "Liquid Courage (serve ale to grant +1 damage for 5 minutes)"]),
        resistances: JSON.stringify(["Poison"]),
        weaknesses: JSON.stringify([]),
        loot: null,
        tags: JSON.stringify(["npc", "tavern"]),
        createdBy: gm.id,
      },
      {
        name: "Mysterious Stranger", category: "npc", race: "Common Elf", level: 5, bodyPoints: 20,
        description: "A hooded figure who appears at key moments with cryptic warnings and hidden agendas.",
        abilities: JSON.stringify(["Vanish (disappear from scene, 1/encounter)", "Cryptic Warning (foreshadow events)", "Hidden Blade (4 damage, surprise only)"]),
        resistances: JSON.stringify([]),
        weaknesses: JSON.stringify([]),
        loot: null,
        tags: JSON.stringify(["npc", "quest", "recurring"]),
        createdBy: gm.id,
      },
      {
        name: "Royal Herald", category: "npc", race: "Human", level: 2, bodyPoints: 8,
        description: "Official messenger of the crown. Delivers proclamations and summons.",
        abilities: JSON.stringify(["Royal Authority (cannot be attacked without consequence)", "Proclamation (deliver quest/event hooks)"]),
        resistances: JSON.stringify([]),
        weaknesses: JSON.stringify([]),
        loot: null,
        tags: JSON.stringify(["npc", "quest", "royal"]),
        createdBy: gm.id,
      },
    ],
  });
  console.log("✓ Created 18 monster/NPC book entries");

  // ─── LORE ENTRIES ────────────────────────────────────────────────────────────
  await prisma.loreEntry.createMany({
    data: [
      {
        title: "The Battle of Thornwood Pass",
        content: `In the autumn of the 42nd year of King Aldric's reign, a great battle was fought at Thornwood Pass. The forces of the Kingdom faced an unprecedented incursion of orcish tribes led by the fearsome warlord Gruk'tar Bonecrusher.\n\nThe battle raged for three days. Heroes emerged from unexpected places - a young cleric named Elara healed the wounded tirelessly, while the ranger Maeven's arrows found their marks in the darkness. On the third dawn, as hope waned, the cavalry of the Silver Order arrived, led by Commander Theron Brightblade.\n\nThough the kingdom prevailed, the cost was high. Many brave souls fell defending the pass, including the beloved Lord Cedric of Thornwood, who gave his life holding the line so others could retreat to safety.`,
        summary: "Major battle at Thornwood Pass against orcish invaders. Kingdom victory but heavy casualties including Lord Cedric.",
        source: "Mystic Quill - Autumn 2023",
        year: 2023, month: 10,
        locations: JSON.stringify(["Thornwood Pass", "Kingdom"]),
        characters: JSON.stringify(["Gruk'tar Bonecrusher", "Elara", "Maeven", "Theron Brightblade", "Lord Cedric"]),
        tags: JSON.stringify(["battle", "orcs", "war", "kingdom"]),
        category: "story",
      },
      {
        title: "In Memory: Lord Cedric of Thornwood",
        content: `It is with heavy hearts that we remember Lord Cedric of Thornwood, who fell defending the pass that bears his family name. A seasoned warrior and beloved leader, he stood firm when others faltered, buying time for civilians to escape the orcish advance.\n\nHis sacrifice will not be forgotten. A memorial stone has been erected at the pass, and his son, Young Lord Marcus, has sworn to continue his father's legacy of service to the realm.`,
        summary: "Memorial for Lord Cedric, fallen hero of Thornwood Pass. His son Marcus vows to continue his legacy.",
        source: "Mystic Quill - Autumn 2023",
        year: 2023, month: 11,
        locations: JSON.stringify(["Thornwood Pass"]),
        characters: JSON.stringify(["Lord Cedric", "Marcus of Thornwood"]),
        tags: JSON.stringify(["death", "memorial", "hero"]),
        category: "obituary",
      },
      {
        title: "Autumn's End 2025 Event Recap",
        content: `The harvest festival drew nearly 60 adventurers to face the rising dead from the ancient barrows. Kara Swiftblade led the charge against the barrow wights while Maeven's scouts tracked the source of the curse to a corrupted druidic circle.\n\nElara of the Silver Moon provided invaluable healing support throughout the weekend, keeping the front line standing during the final siege. Vaelith Stormweaver discovered crucial magical anomalies that pointed to deeper mysteries beneath the barrow mounds.\n\nThe weekend concluded with a spectacular bonfire ceremony purifying the corrupted ground.`,
        summary: "Recap of Autumn's End 2025 event. Barrow delve, undead threat, druidic corruption, and purification ceremony.",
        source: "Event Recap - Autumn's End 2025",
        year: 2025, month: 10,
        locations: JSON.stringify(["Ancient Barrows", "Druidic Circle"]),
        characters: JSON.stringify(["Kara Swiftblade", "Maeven", "Elara", "Vaelith Stormweaver"]),
        tags: JSON.stringify(["event", "undead", "harvest", "barrows", "druid"]),
        category: "recap",
      },
      {
        title: "Winter's Tale 2026 Event Recap",
        content: `Nearly 80 adventurers braved the February cold to defend the realm from a mysterious winter curse. The weekend saw fierce combat as undead forces threatened the northern villages.\n\nA coalition of heroes worked tirelessly to uncover the source of the curse — an ancient artifact buried beneath the Frostpeak Temple. Special commendation to the party who successfully completed the Temple Delve module, recovering the Scepter of Eternal Winter.\n\nThe Saturday night ritual was spectacular, with over 30 participants combining their magical energies to shatter the curse. The weekend concluded with the traditional tournament, with Kara Swiftblade taking first place. Young Lord Marcus of Thornwood made a stirring appearance, swearing his oath at the memorial stone his father's comrades erected at the pass.\n\nThank you to all our NPCs, especially Maeven's player who ran monster camp tirelessly!`,
        summary: "Recap of Winter's Tale 2026. Undead threat, Frostpeak Temple delve, curse-breaking ritual, Kara wins tournament, Marcus swears oath.",
        source: "Event Recap - Winter's Tale 2026",
        year: 2026, month: 2,
        locations: JSON.stringify(["Frostpeak Temple", "Northern Villages", "Thornwood Pass Memorial"]),
        characters: JSON.stringify(["Kara Swiftblade", "Marcus of Thornwood", "Maeven"]),
        tags: JSON.stringify(["event", "undead", "curse", "tournament", "ritual"]),
        category: "recap",
      },
      {
        title: "Rumors from the Tavern",
        content: `Whispers in the Golden Griffin speak of strange lights seen near the Old Mill after dark. Some say it's smugglers, others claim it's something far more sinister. The miller's daughter swears she heard voices chanting in an unknown tongue.\n\nMeanwhile, a mysterious hooded figure has been asking questions about the location of the Lost Temple of Mysteries. Several adventurers have followed leads into the Darkwood, but none have returned with answers. Some say this figure bears an uncanny resemblance to the elven scholar Vaelith Stormweaver.\n\nAnd perhaps most intriguing — the royal jeweler reported that someone commissioned a replica of the Crown of Stars, an artifact that was supposedly destroyed centuries ago. Why would anyone want a copy of a cursed crown?`,
        summary: "Tavern rumors: Strange lights at Old Mill, mysterious figure (possibly Vaelith?) seeking Lost Temple, replica of cursed crown.",
        source: "Mystic Quill - March 2026",
        year: 2026, month: 3,
        locations: JSON.stringify(["Golden Griffin Tavern", "Old Mill", "Darkwood", "Lost Temple of Mysteries"]),
        characters: JSON.stringify(["Vaelith Stormweaver"]),
        tags: JSON.stringify(["mystery", "tavern", "rumors", "temple", "artifact"]),
        category: "rumor",
      },
      {
        title: "New Trade Routes Open to Silverport",
        content: `By decree of the Merchants' Guild, new trade routes have been established connecting Silverport to the eastern kingdoms. Caravans will depart weekly, carrying goods and opportunities for adventurers seeking work as guards.\n\nAll interested parties should register with the Guild Hall before the next departure on the 15th day of the Spring Moon.`,
        summary: "Announcement: New trade routes to Silverport, weekly caravans seeking guards.",
        source: "Mystic Quill - March 2026",
        year: 2026, month: 3,
        locations: JSON.stringify(["Silverport", "Eastern Kingdoms"]),
        characters: JSON.stringify([]),
        tags: JSON.stringify(["trade", "caravan", "opportunity"]),
        category: "announcement",
      },
    ],
  });
  console.log("✓ Created 6 lore entries");

  // ─── LORE CHARACTERS ─────────────────────────────────────────────────────────
  await prisma.loreCharacter.createMany({
    data: [
      { name: "Theron Brightblade", title: "Commander", race: "Human", class: "Warrior", faction: "Silver Order", description: "Commander of the Silver Order cavalry. Distinguished by his shining plate armor and tactical brilliance.", firstMentioned: "Mystic Quill - Autumn 2023" },
      { name: "Gruk'tar Bonecrusher", title: "Warlord", race: "Orc", class: "Warrior", faction: "Orcish Tribes", description: "Fearsome orcish warlord who united multiple tribes for the assault on Thornwood Pass. Last seen retreating into the Badlands.", firstMentioned: "Mystic Quill - Autumn 2023" },
      { name: "Lord Cedric", title: "Lord", race: "Human", class: "Warrior", faction: "Kingdom", description: "Fallen lord of Thornwood. Died heroically holding Thornwood Pass. Father of Lord Marcus.", firstMentioned: "Mystic Quill - Autumn 2023" },
      { name: "Kara Swiftblade", title: "Tournament Champion", race: "Human", class: "Warrior", faction: null, description: "Tournament champion. Won the Winter's Tale 2026 tournament. Known for incredible speed and technique.", firstMentioned: "Event Recap - Autumn's End 2025", assignedToId: p1.id },
      { name: "Maeven", title: "Ranger", race: "Forest Elf", class: "Rogue", faction: null, description: "Legendary ranger whose arrows never miss. Played crucial role in the Battle of Thornwood Pass.", firstMentioned: "Mystic Quill - Autumn 2023", assignedToId: p2.id },
      { name: "Elara", title: "Healer", race: "Human", class: "Cleric", faction: "Temple of the Silver Moon", description: "Devoted healer who tended the wounded tirelessly during the Battle of Thornwood Pass.", firstMentioned: "Mystic Quill - Autumn 2023", assignedToId: p3.id },
      { name: "Marcus of Thornwood", title: "Young Lord", race: "Human", class: "Warrior", faction: "Kingdom", description: "Son of the fallen Lord Cedric. Sworn to continue his father's legacy of service to the realm.", firstMentioned: "Mystic Quill - Autumn 2023", assignedToId: p4.id },
      { name: "Vaelith Stormweaver", title: "Scholar", race: "Common Elf", class: "Mage", faction: null, description: "Elven scholar seeking the Lost Temple of Mysteries. Rumored to have commissioned a replica of the Crown of Stars.", firstMentioned: "Mystic Quill - March 2026", assignedToId: p5.id },
    ],
  });
  console.log("✓ Created 8 lore characters");

  console.log("✓ No profession earnings (clean slate)");

  // ─── LOCATIONS ──────────────────────────────────────────────────────────────
  // Extracted from the Barony of Bellanmo map and the full world map

  // Region constants
  const bellanmo    = "The Barony of Bellanmo";
  const oshain      = "Kingdom of Oshain";
  const novashan    = "Kingdom of Novashan";
  const aspenshae   = "Protectorate of Aspenshae";
  const quethMarch  = "Queth March";
  const greenwood   = "Greenwood";
  const vinYaMara   = "Vin Ya Mara";
  const tarridear   = "Tarridear";
  const oluhm       = "Oluhm";
  const caathlon    = "Caathlon";
  const baklarholt  = "Baklarholt";
  const iomall      = "Iomall";
  const meraki      = "Meraki";
  const viscara     = "Viscara";
  const wildemere   = "Wildemere";
  const gaelbahn    = "Gaelbahn";
  const cherbourg   = "Cherbourg";
  const niskara     = "Niskara";
  const aerenal     = "Aerenal";

  const locations = [
    // ── Kingdoms & Major Regions ───────────────────────────────────────────
    { name: "The Barony of Bellanmo",      type: "region",   region: null },
    { name: "The Regency of Mokinár",      type: "region",   region: null },
    { name: "Kingdom of Oshain",           type: "region",   region: null },
    { name: "Kingdom of Novashan",         type: "region",   region: null },
    { name: "Kingdom of Narrdmyr",         type: "region",   region: null },
    { name: "Protectorate of Aspenshae",   type: "region",   region: null },
    { name: "Queth March",                 type: "region",   region: null },
    { name: "Greenwood",                   type: "region",   region: null },
    { name: "Drannidwood",                 type: "region",   region: null },
    { name: "Vin Ya Mara",                 type: "region",   region: null },
    { name: "Tarridear",                   type: "region",   region: null },
    { name: "Oluhm",                       type: "region",   region: null },
    { name: "Caathlon",                    type: "region",   region: null },
    { name: "Baklarholt",                  type: "region",   region: null },
    { name: "Historical Bastinc",          type: "region",   region: null },
    { name: "Iomall",                      type: "region",   region: null },
    { name: "Meraki",                      type: "region",   region: null },
    { name: "Viscara",                     type: "region",   region: null },
    { name: "Wildemere",                   type: "region",   region: null },
    { name: "Gaelbahn",                    type: "region",   region: null },
    { name: "Cherbourg",                   type: "region",   region: null },
    { name: "Niskara",                     type: "region",   region: null },
    { name: "Aerenal",                     type: "region",   region: null },

    // ── Bodies of Water & Landmarks ────────────────────────────────────────
    { name: "The Jaded Sea",               type: "landmark", region: null },
    { name: "Emerald Sea",                 type: "landmark", region: null },
    { name: "The Northern Baronial Divide", type: "landmark", region: null },
    { name: "The Southern Baronial Divide", type: "landmark", region: null },

    // ── The Barony of Bellanmo (from detailed Bellanmo map) ────────────────
    { name: "Nightbourne",       type: "town",  region: bellanmo },
    { name: "Riversfork",        type: "town",  region: bellanmo },
    { name: "Redpoole",          type: "town",  region: bellanmo },
    { name: "Yardsmuth",         type: "town",  region: bellanmo },
    { name: "Allowen",           type: "town",  region: bellanmo },
    { name: "Sorvan",            type: "town",  region: bellanmo },
    { name: "Ilveresh",          type: "town",  region: bellanmo },
    { name: "New Aladine",       type: "town",  region: bellanmo },
    { name: "Brenn",             type: "town",  region: bellanmo },
    { name: "Hallot",            type: "town",  region: bellanmo },
    { name: "Crossroads",        type: "town",  region: bellanmo },
    { name: "Fennor",            type: "town",  region: bellanmo },
    { name: "Gray Haven",        type: "town",  region: bellanmo },
    { name: "Pelain",            type: "town",  region: bellanmo },
    { name: "Wyndover",          type: "town",  region: bellanmo },
    { name: "Lenik",             type: "town",  region: bellanmo },
    { name: "South Bay",         type: "town",  region: bellanmo },
    { name: "Ruins of Fenrest",  type: "ruins", region: bellanmo },
    { name: "Ruins of Tarn",     type: "ruins", region: bellanmo },

    // ── Kingdom of Oshain / Keiryindal ─────────────────────────────────────
    { name: "Keiryindal",        type: "city",  region: oshain },
    { name: "Prawn",             type: "town",  region: oshain },
    { name: "Dilai",             type: "town",  region: oshain },
    { name: "Urizel",           type: "town",  region: oshain },
    { name: "Quinia",            type: "town",  region: oshain },
    { name: "Nalypaaor",         type: "town",  region: oshain },
    { name: "Orchid",            type: "town",  region: oshain },
    { name: "Daven",             type: "town",  region: oshain },
    { name: "Hezairmar",         type: "town",  region: oshain },
    { name: "Charic",            type: "town",  region: oshain },

    // ── Queth March ────────────────────────────────────────────────────────
    { name: "Tipicia",           type: "town",  region: quethMarch },
    { name: "Urlo",              type: "town",  region: quethMarch },
    { name: "Calcagnir",         type: "town",  region: quethMarch },
    { name: "Maitaway",          type: "town",  region: quethMarch },
    { name: "Hlashde",           type: "town",  region: quethMarch },

    // ── Greenwood ──────────────────────────────────────────────────────────
    { name: "Lecoyant",          type: "town",  region: greenwood },
    { name: "Ingmenivier",       type: "town",  region: greenwood },
    { name: "Yscere",            type: "town",  region: greenwood },

    // ── Drannidwood / Aerenal ──────────────────────────────────────────────
    { name: "Puoria",            type: "town",  region: aerenal },
    { name: "Incura",            type: "town",  region: aerenal },
    { name: "Eastufrale",        type: "town",  region: aerenal },
    { name: "Stolieia",          type: "town",  region: aerenal },
    { name: "Yathiel",           type: "town",  region: aerenal },
    { name: "Deve",              type: "town",  region: aerenal },
    { name: "Hattayaclicia",     type: "town",  region: aerenal },
    { name: "Munyvayl",          type: "town",  region: aerenal },
    { name: "Callenátur",        type: "town",  region: aerenal },
    { name: "Locchem",           type: "town",  region: aerenal },

    // ── Protectorate of Aspenshae ──────────────────────────────────────────
    { name: "Aderanti",          type: "town",  region: aspenshae },
    { name: "Perookc",           type: "town",  region: aspenshae },
    { name: "Vandrac",           type: "town",  region: aspenshae },
    { name: "Necinei",           type: "town",  region: aspenshae },
    { name: "Jenoray",           type: "town",  region: aspenshae },

    // ── Vin Ya Mara ────────────────────────────────────────────────────────
    { name: "Weigarec",          type: "town",  region: vinYaMara },
    { name: "Sahoa Estay",       type: "town",  region: vinYaMara },

    // ── Tarridear ──────────────────────────────────────────────────────────
    { name: "Nabrood",           type: "town",  region: tarridear },
    { name: "Mongol",            type: "town",  region: tarridear },
    { name: "Parmas",            type: "town",  region: tarridear },
    { name: "Zoninc",            type: "town",  region: tarridear },
    { name: "Traveldown",        type: "town",  region: tarridear },
    { name: "Waloen",            type: "town",  region: tarridear },
    { name: "Hannon",            type: "town",  region: tarridear },
    { name: "Doinra",            type: "town",  region: tarridear },

    // ── Oluhm / Caathlon ───────────────────────────────────────────────────
    { name: "Middleton",         type: "town",  region: oluhm },
    { name: "Faviaflé",          type: "town",  region: oluhm },
    { name: "Gunia",             type: "town",  region: caathlon },
    { name: "Duncreck",          type: "town",  region: caathlon },
    { name: "Blancham",          type: "town",  region: caathlon },
    { name: "Biroelin",          type: "town",  region: baklarholt },

    // ── Eastern border towns ───────────────────────────────────────────────
    { name: "Yishwing",          type: "town",  region: null },
    { name: "Redishoon",         type: "town",  region: null },
    { name: "Morandalé",         type: "town",  region: null },
    { name: "Lorthay",           type: "town",  region: null },
    { name: "Istifret",          type: "town",  region: null },
    { name: "Teniti",            type: "town",  region: null },
    { name: "Siracnia",          type: "town",  region: null },
    { name: "Melitgs",           type: "town",  region: null },
    { name: "Nogthdom",          type: "town",  region: null },

    // ── Kingdom of Novashan ────────────────────────────────────────────────
    { name: "Elnidoen",          type: "town",  region: novashan },
    { name: "Urhi",              type: "town",  region: novashan },
    { name: "Freclaen",          type: "town",  region: novashan },
    { name: "Doinilas",          type: "town",  region: novashan },

    // ── Iomall ─────────────────────────────────────────────────────────────
    { name: "Quillen's Point",   type: "town",  region: iomall },
    { name: "Pleasant Creek",    type: "town",  region: iomall },
    { name: "Lexrye",            type: "town",  region: iomall },
    { name: "New Lomat",         type: "town",  region: iomall },
    { name: "Cúlet",             type: "town",  region: iomall },
    { name: "Lightmoon",         type: "town",  region: iomall },
    { name: "Craterfoot",        type: "town",  region: iomall },
    { name: "Redwoodlé",         type: "town",  region: iomall },

    // ── Viscara ────────────────────────────────────────────────────────────
    { name: "King's Land",       type: "town",  region: viscara },
    { name: "Deepanwood",        type: "town",  region: viscara },
    { name: "Marwick",           type: "town",  region: viscara },
    { name: "Harwick",           type: "town",  region: viscara },

    // ── Niskara ────────────────────────────────────────────────────────────
    { name: "Vinyard",           type: "town",  region: niskara },

    // ── Meraki ─────────────────────────────────────────────────────────────
    { name: "Glenmoorc",         type: "town",  region: meraki },
    { name: "Brunswick",         type: "town",  region: meraki },

    // ── Wildemere ──────────────────────────────────────────────────────────
    { name: "Chadington",        type: "town",  region: wildemere },
    { name: "Hepsenwood",        type: "town",  region: wildemere },

    // ── Cherbourg ──────────────────────────────────────────────────────────
    { name: "Abrafiren",         type: "town",  region: cherbourg },
    { name: "Devillar",          type: "town",  region: cherbourg },
    { name: "Basol",             type: "town",  region: cherbourg },
    { name: "Veamin",            type: "town",  region: cherbourg },
    { name: "Girwood",           type: "town",  region: cherbourg },
    { name: "Topping Worth",     type: "town",  region: cherbourg },
    { name: "Malinek",           type: "town",  region: cherbourg },
    { name: "Valderbun",         type: "town",  region: cherbourg },
    { name: "Clawfield",         type: "town",  region: cherbourg },

    // ── Western coast (near Aspenshae / independent) ───────────────────────
    { name: "High Haven",        type: "town",  region: aspenshae },
    { name: "Hawk Haven",        type: "town",  region: null },
    { name: "Whitestall",        type: "town",  region: null },
    { name: "Jennica",           type: "town",  region: cherbourg },
    { name: "Green Port",        type: "town",  region: gaelbahn },
    { name: "Hithal",            type: "town",  region: gaelbahn },

    // ── Gaelbahn / Kingdom of Narrdmyr ─────────────────────────────────────
    { name: "Willowdale",        type: "town",  region: gaelbahn },

    // ── Kengate area (central forests) ─────────────────────────────────────
    { name: "Kengate",           type: "town",  region: null },
  ];

  for (const loc of locations) {
    await prisma.location.create({ data: loc });
  }
  console.log(`✓ Created ${locations.length} locations`);

  // ─── DONE ────────────────────────────────────────────────────────────────────
  console.log("\n✅ Seeding complete!\n");
  console.log("Test Accounts (all passwords: password123):");
  console.log("─────────────────────────────────────────────");
  console.log("  Staff:");
  console.log("  - admin@kanar.test     (Admin)");
  console.log("  - cbd@kanar.test       (Character Book Director)");
  console.log("  - gm@kanar.test        (Gamemaster)");
  console.log("  - econ@kanar.test      (Economy Marshal)");
  console.log("");
  console.log("  Players:");
  console.log("  - kara@kanar.test      → Kara Swiftblade (Lvl 1 Human Warrior)");
  console.log("  - maeven@kanar.test    → Maeven (Lvl 1 Forest Elf Rogue)");
  console.log("  - elara@kanar.test     → Elara (Lvl 1 Human Cleric)");
  console.log("  - marcus@kanar.test    → Marcus of Thornwood (Lvl 1 Human Warrior)");
  console.log("  - vael@kanar.test      → Vaelith Stormweaver (Lvl 1 Common Elf Mage)");
  console.log("  - grimm@kanar.test     → Grimm Deathwalker (Lvl 3 Half-Orc Warrior, 1 LIFE CREDIT)");
  console.log("");
  console.log("Events:");
  console.log("  - Autumn's End 2025     (completed, 4 attended, no sign-outs)");
  console.log("  - Winter's Tale 2026    (completed, 5 attended, no sign-outs)");
  console.log("  - Spring Awakening 2026 (active, 5 registered)");
  console.log("  - Midsummer 2026        (upcoming)");
  console.log("  - Harvest Moon 2026     (upcoming)");
  console.log("");
  console.log("Characters: 6 approved, 5 inactive, 1 draft, 1 pending review");
  console.log("  Inactive: Brynn the Bold, Fenwick Thornfoot, Brother Aldous,");
  console.log("            Sable Nightwhisper, Old Garreth");
  console.log("Sign-outs: none (clean slate for testing)");
  console.log("Lore: 6 entries, 8 lore characters (5 assigned to players)");
  console.log(`Locations: ${locations.length} (towns, ruins, regions from the Bellanmo map)`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
