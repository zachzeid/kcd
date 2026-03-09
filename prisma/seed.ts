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
  await prisma.bankTransaction.deleteMany();
  await prisma.playerBank.deleteMany();
  await prisma.characterSignOut.deleteMany();
  await prisma.itemSubmission.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.eventRegistration.deleteMany();
  await prisma.character.deleteMany();
  await prisma.event.deleteMany();
  await prisma.loreCharacter.deleteMany();
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

  console.log("✓ Created 9 users (4 staff + 5 players)");

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

  console.log("✓ Created 5 events (2 completed, 1 active, 2 upcoming)");

  // ─── CHARACTERS ──────────────────────────────────────────────────────────────
  // Mystic Quill characters: Kara Swiftblade, Maeven, Elara, Marcus, Vaelith

  // P1: Kara Swiftblade — Human Warrior, tournament champion
  const karaData = {
    name: "Kara Swiftblade",
    race: "Human",
    characterClass: "Warrior",
    level: 1,
    freeLanguage: "Common",
    history: "Born to a military family in the Capital, Kara earned her name fighting in border skirmishes before turning to tournament combat.",
    skills: [
      { skillName: "One-Handed Weapons", purchaseCount: 1, totalCost: 30 },
      { skillName: "Longsword", purchaseCount: 1, totalCost: 18 },
      { skillName: "Shields", purchaseCount: 1, totalCost: 20 },
      { skillName: "Added Damage 1 (Longsword, 1H)", specialization: "Longsword 1H", purchaseCount: 1, totalCost: 20 },
      { skillName: "First Aid", purchaseCount: 1, totalCost: 20 },
      { skillName: "Paired Weapons", purchaseCount: 1, totalCost: 30 },
      { skillName: "Craft", specialization: "Weapon Smithing", purchaseCount: 2, totalCost: 32 },
    ],
    skillPointsSpent: 140, // level 1 = 140 total
    equipment: [
      { itemName: "Longsword", quantity: 1, totalCost: 10 },
      { itemName: "Shield", quantity: 1, totalCost: 5 },
      { itemName: "Leather Armor", quantity: 1, totalCost: 15 },
      { itemName: "Backpack", quantity: 1, totalCost: 2 },
      { itemName: "Rations", quantity: 5, totalCost: 5 },
      { itemName: "Waterskin", quantity: 1, totalCost: 1 },
      { itemName: "Bedroll", quantity: 1, totalCost: 2 },
    ],
    silverSpent: 40,
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
    freeLanguage: "Elvish",
    history: "A legendary ranger of the Greenwood whose arrows never miss. Played a crucial role in the Battle of Thornwood Pass, her arrows cutting down orc scouts before they could breach the lines. Quiet and deadly, she speaks little but acts decisively.",
    skills: [
      { skillName: "Ranged Weapons", purchaseCount: 1, totalCost: 60 },
      { skillName: "Bow", purchaseCount: 1, totalCost: 18 },
      { skillName: "Tracking", purchaseCount: 1, totalCost: 40 },
      { skillName: "First Aid", purchaseCount: 1, totalCost: 20 },
    ],
    skillPointsSpent: 138, // level 1 = 140 total
    equipment: [
      { itemName: "Longbow", quantity: 1, totalCost: 12 },
      { itemName: "Arrows (20)", quantity: 1, totalCost: 5 },
      { itemName: "Short Sword", quantity: 1, totalCost: 8 },
      { itemName: "Leather Armor", quantity: 1, totalCost: 15 },
      { itemName: "Backpack", quantity: 1, totalCost: 2 },
      { itemName: "Waterskin", quantity: 1, totalCost: 1 },
      { itemName: "Rope (50ft)", quantity: 1, totalCost: 5 },
    ],
    silverSpent: 48,
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
    freeLanguage: "Common",
    history: "A devoted healer who tended the wounded tirelessly during the Battle of Thornwood Pass. She has since taken up residence at the Temple of the Silver Moon, training young clerics and researching ancient healing rituals.",
    skills: [
      { skillName: "First Aid", purchaseCount: 1, totalCost: 10 },
      { skillName: "Earth-Water Ability", purchaseCount: 1, totalCost: 15 },
      { skillName: "Earth-Water 1", purchaseCount: 3, totalCost: 15 },
      { skillName: "Earth-Water 2", purchaseCount: 2, totalCost: 20 },
      { skillName: "Herbalism", purchaseCount: 2, totalCost: 32 },
      { skillName: "Read/Write", specialization: "Common", purchaseCount: 1, totalCost: 10 },
      { skillName: "Navigation", purchaseCount: 1, totalCost: 10 },
      { skillName: "Craft", specialization: "Brewing", purchaseCount: 1, totalCost: 16 },
    ],
    skillPointsSpent: 128,
    equipment: [
      { itemName: "Mace", quantity: 1, totalCost: 8 },
      { itemName: "Holy Symbol", quantity: 1, totalCost: 5 },
      { itemName: "Healing Herbs", quantity: 5, totalCost: 15 },
      { itemName: "Backpack", quantity: 1, totalCost: 2 },
      { itemName: "Waterskin", quantity: 1, totalCost: 1 },
      { itemName: "Rations", quantity: 5, totalCost: 5 },
      { itemName: "Bedroll", quantity: 1, totalCost: 2 },
    ],
    silverSpent: 38,
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
    freeLanguage: "Common",
    history: "Young Lord Marcus, son of the fallen Lord Cedric who gave his life holding Thornwood Pass. Sworn to continue his father's legacy of service to the realm. Though still young, he commands respect among the soldiers who served under his father.",
    skills: [
      { skillName: "Two-Handed Weapons", purchaseCount: 1, totalCost: 30 },
      { skillName: "Great Sword", purchaseCount: 1, totalCost: 20 },
      { skillName: "First Aid", purchaseCount: 1, totalCost: 20 },
      { skillName: "War Tactics (Small Unit)", purchaseCount: 1, totalCost: 20 },
      { skillName: "Horsemanship", purchaseCount: 1, totalCost: 20 },
      { skillName: "Read/Write", specialization: "Common", purchaseCount: 1, totalCost: 20 },
      { skillName: "Navigation", purchaseCount: 1, totalCost: 20 },
    ],
    skillPointsSpent: 150, // over by 10, but that's okay for seed data story
    equipment: [
      { itemName: "Greatsword", quantity: 1, totalCost: 15 },
      { itemName: "Leather Armor", quantity: 1, totalCost: 15 },
      { itemName: "Backpack", quantity: 1, totalCost: 2 },
      { itemName: "Rope (50ft)", quantity: 1, totalCost: 5 },
      { itemName: "Rations", quantity: 5, totalCost: 5 },
      { itemName: "Bedroll", quantity: 1, totalCost: 2 },
      { itemName: "Waterskin", quantity: 1, totalCost: 1 },
      { itemName: "Torch", quantity: 3, totalCost: 3 },
    ],
    silverSpent: 48,
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
    freeLanguage: "Elvish",
    history: "An elven scholar who left the Ivory Tower to study wild magic in the untamed lands. Recently spotted asking questions about the Lost Temple of Mysteries. Some whisper she commissioned a replica of the Crown of Stars — but for what purpose?",
    skills: [
      { skillName: "Fire-Air Ability", purchaseCount: 1, totalCost: 15 },
      { skillName: "Fire-Air 1", purchaseCount: 3, totalCost: 15 },
      { skillName: "Fire-Air 2", purchaseCount: 2, totalCost: 30 },
      { skillName: "Read/Write", specialization: "Common", purchaseCount: 1, totalCost: 10 },
      { skillName: "Read/Write", specialization: "Elvish", purchaseCount: 1, totalCost: 10 },
      { skillName: "Appraisal", purchaseCount: 1, totalCost: 15 },
      { skillName: "Herbalism", purchaseCount: 1, totalCost: 16 },
      { skillName: "Staff", purchaseCount: 1, totalCost: 17 },
      { skillName: "Dagger", purchaseCount: 1, totalCost: 10 },
    ],
    skillPointsSpent: 138,
    equipment: [
      { itemName: "Staff", quantity: 1, totalCost: 5 },
      { itemName: "Dagger", quantity: 1, totalCost: 2 },
      { itemName: "Spell Components", quantity: 5, totalCost: 10 },
      { itemName: "Backpack", quantity: 1, totalCost: 2 },
      { itemName: "Alchemy Kit", quantity: 1, totalCost: 15 },
      { itemName: "Waterskin", quantity: 1, totalCost: 1 },
      { itemName: "Rations", quantity: 5, totalCost: 5 },
    ],
    silverSpent: 40,
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
        freeLanguage: "Common",
        history: "A traveling priestess of the Silver Moon, newly arrived to the realm.",
        skills: [
          { skillName: "First Aid", purchaseCount: 1, totalCost: 10 },
          { skillName: "Earth-Water Ability", purchaseCount: 1, totalCost: 15 },
        ],
        skillPointsSpent: 25,
        equipment: [],
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
        freeLanguage: "Common",
        history: "A fierce half-orc from the Badlands, seeking redemption in the civilized lands.",
        skills: [
          { skillName: "Two-Handed Weapons", purchaseCount: 1, totalCost: 30 },
          { skillName: "Great Axe/Maul", purchaseCount: 1, totalCost: 20 },
          { skillName: "Added Damage 1 (Great Axe, 2H)", specialization: "Great Axe 2H", purchaseCount: 1, totalCost: 20 },
          { skillName: "Damage Control", purchaseCount: 1, totalCost: 40 },
          { skillName: "First Aid", purchaseCount: 1, totalCost: 20 },
          { skillName: "Blind Fighting", purchaseCount: 1, totalCost: 20 },
        ],
        skillPointsSpent: 150, // over by 10
        equipment: [
          { itemName: "Great Axe", quantity: 1, totalCost: 12 },
          { itemName: "Leather Armor", quantity: 1, totalCost: 15 },
          { itemName: "Backpack", quantity: 1, totalCost: 2 },
        ],
        silverSpent: 29,
      }),
      status: "pending_review",
      submittedAt: new Date("2026-03-05"),
    },
  });

  console.log("✓ Created 7 characters (5 approved, 1 draft, 1 pending review)");

  // ─── AUDIT LOGS ──────────────────────────────────────────────────────────────
  const allApproved = [
    { char: kara, player: p1, charName: "Kara Swiftblade", created: "2025-09-28", submitted: "2025-10-01", approved: "2025-10-02" },
    { char: maeven, player: p2, charName: "Maeven", created: "2025-09-18", submitted: "2025-09-20", approved: "2025-09-22" },
    { char: elara, player: p3, charName: "Elara", created: "2025-09-12", submitted: "2025-09-15", approved: "2025-09-16" },
    { char: marcus, player: p4, charName: "Marcus of Thornwood", created: "2026-01-05", submitted: "2026-01-10", approved: "2026-01-12" },
    { char: vaelith, player: p5, charName: "Vaelith Stormweaver", created: "2025-10-01", submitted: "2025-10-05", approved: "2025-10-06" },
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
      checkedInAt: new Date("2025-10-18T09:30:00"), checkedOutAt: new Date("2025-10-19T18:00:00"),
    },
  });
  await prisma.eventRegistration.create({
    data: {
      userId: p2.id, eventId: event1.id, characterId: maeven.id,
      ticketType: "single_a", amountPaid: 3500, paymentStatus: "paid",
      arfSignedAt: new Date("2025-10-01"), arfYear: 2025,
      checkedInAt: new Date("2025-10-18T09:45:00"), checkedOutAt: new Date("2025-10-19T18:15:00"),
    },
  });
  await prisma.eventRegistration.create({
    data: {
      userId: p3.id, eventId: event1.id, characterId: elara.id,
      ticketType: "single_b", amountPaid: 4500, paymentStatus: "paid",
      arfSignedAt: new Date("2025-10-05"), arfYear: 2025,
      checkedInAt: new Date("2025-10-18T10:15:00"), checkedOutAt: new Date("2025-10-19T17:00:00"),
    },
  });
  await prisma.eventRegistration.create({
    data: {
      userId: p5.id, eventId: event1.id, characterId: vaelith.id,
      ticketType: "single_a", amountPaid: 3500, paymentStatus: "paid",
      arfSignedAt: new Date("2025-10-10"), arfYear: 2025,
      checkedInAt: new Date("2025-10-18T10:00:00"), checkedOutAt: new Date("2025-10-19T18:00:00"),
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
      checkedInAt: new Date("2026-02-15T09:30:00"), checkedOutAt: new Date("2026-02-16T18:00:00"),
    },
  });
  await prisma.eventRegistration.create({
    data: {
      userId: p2.id, eventId: event2.id, characterId: maeven.id,
      ticketType: "single_a", amountPaid: 3500, paymentStatus: "paid",
      arfSignedAt: new Date("2025-10-01"), arfYear: 2026,
      checkedInAt: new Date("2026-02-15T09:45:00"), checkedOutAt: new Date("2026-02-16T18:30:00"),
    },
  });
  await prisma.eventRegistration.create({
    data: {
      userId: p4.id, eventId: event2.id, characterId: marcus.id,
      ticketType: "single_b", amountPaid: 4500, paymentStatus: "paid",
      arfSignedAt: new Date("2026-01-20"), arfYear: 2026,
      checkedInAt: new Date("2026-02-15T10:00:00"), checkedOutAt: new Date("2026-02-16T17:30:00"),
    },
  });

  // Elara and Vaelith also attended Winter's Tale — NO sign-outs yet (for testing)
  await prisma.eventRegistration.create({
    data: {
      userId: p3.id, eventId: event2.id, characterId: elara.id,
      ticketType: "single_a", amountPaid: 3500, paymentStatus: "paid",
      arfSignedAt: new Date("2026-01-18"), arfYear: 2026,
      checkedInAt: new Date("2026-02-15T10:30:00"), checkedOutAt: new Date("2026-02-16T17:45:00"),
    },
  });
  await prisma.eventRegistration.create({
    data: {
      userId: p5.id, eventId: event2.id, characterId: vaelith.id,
      ticketType: "single_a", amountPaid: 3500, paymentStatus: "paid",
      arfSignedAt: new Date("2026-01-22"), arfYear: 2026,
      checkedInAt: new Date("2026-02-15T11:00:00"), checkedOutAt: new Date("2026-02-16T18:00:00"),
    },
  });

  console.log("✓ Created Winter's Tale registrations (5 players)");

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

  console.log("✓ Created Spring Awakening registrations (5 players)");

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
  console.log("");
  console.log("Events:");
  console.log("  - Autumn's End 2025     (completed, 4 attended, no sign-outs)");
  console.log("  - Winter's Tale 2026    (completed, 5 attended, no sign-outs)");
  console.log("  - Spring Awakening 2026 (active, 5 registered)");
  console.log("  - Midsummer 2026        (upcoming)");
  console.log("  - Harvest Moon 2026     (upcoming)");
  console.log("");
  console.log("Characters: 5 approved (all Lvl 1), 1 draft, 1 pending review");
  console.log("Sign-outs: none (clean slate for testing)");
  console.log("Lore: 6 entries, 8 lore characters (5 assigned to players)");
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
