import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { hash } from "bcryptjs";
import path from "path";

const dbPath = path.join(process.cwd(), "dev.db");
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Create users with different roles
  const password = await hash("password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@kanar.test" },
    update: {},
    create: {
      email: "admin@kanar.test",
      name: "Admin User",
      hashedPassword: password,
      role: "admin",
    },
  });
  console.log("✓ Created admin user");

  const cbd = await prisma.user.upsert({
    where: { email: "cbd@kanar.test" },
    update: {},
    create: {
      email: "cbd@kanar.test",
      name: "Character Book Director",
      hashedPassword: password,
      role: "cbd",
    },
  });
  console.log("✓ Created CBD user");

  const gm = await prisma.user.upsert({
    where: { email: "gm@kanar.test" },
    update: {},
    create: {
      email: "gm@kanar.test",
      name: "Gamemaster Quinn",
      hashedPassword: password,
      role: "gm",
    },
  });
  console.log("✓ Created GM user");

  const econMarshal = await prisma.user.upsert({
    where: { email: "econ@kanar.test" },
    update: {},
    create: {
      email: "econ@kanar.test",
      name: "Economy Marshal",
      hashedPassword: password,
      role: "economy_marshal",
    },
  });
  console.log("✓ Created Economy Marshal user");

  const player1 = await prisma.user.upsert({
    where: { email: "player1@kanar.test" },
    update: {},
    create: {
      email: "player1@kanar.test",
      name: "Alice Adventurer",
      hashedPassword: password,
      role: "user",
    },
  });

  const player2 = await prisma.user.upsert({
    where: { email: "player2@kanar.test" },
    update: {},
    create: {
      email: "player2@kanar.test",
      name: "Bob Barbarian",
      hashedPassword: password,
      role: "user",
    },
  });

  const player3 = await prisma.user.upsert({
    where: { email: "player3@kanar.test" },
    update: {},
    create: {
      email: "player3@kanar.test",
      name: "Carol Cleric",
      hashedPassword: password,
      role: "user",
    },
  });
  console.log("✓ Created 3 player users");

  // Create events
  const pastEvent = await prisma.event.create({
    data: {
      name: "Winter's Tale 2026",
      date: new Date("2026-02-15T10:00:00"),
      endDate: new Date("2026-02-16T18:00:00"),
      location: "Kanar Campgrounds, Vermont",
      description: "The realm faces a bitter winter as dark forces gather...",
      ticketPriceA: 3500,
      ticketPriceB: 4500,
      dayPassPrice: 2000,
      status: "completed",
    },
  });
  console.log("✓ Created past event");

  const upcomingEvent = await prisma.event.create({
    data: {
      name: "Spring Awakening 2026",
      date: new Date("2026-04-12T10:00:00"),
      endDate: new Date("2026-04-13T18:00:00"),
      location: "Kanar Campgrounds, Vermont",
      description: "As winter recedes, heroes are called to defend the realm from a new threat.",
      ticketPriceA: 3500,
      ticketPriceB: 4500,
      dayPassPrice: 2000,
      status: "upcoming",
    },
  });
  console.log("✓ Created upcoming event");

  const futureEvent = await prisma.event.create({
    data: {
      name: "Midsummer Celebration 2026",
      date: new Date("2026-06-20T10:00:00"),
      endDate: new Date("2026-06-21T18:00:00"),
      location: "Kanar Campgrounds, Vermont",
      description: "Annual festival and tournament honoring the longest day of the year.",
      ticketPriceA: 3500,
      ticketPriceB: 4500,
      dayPassPrice: 2000,
      status: "upcoming",
    },
  });
  console.log("✓ Created future event");

  // Create event registrations
  await prisma.eventRegistration.create({
    data: {
      userId: player1.id,
      eventId: pastEvent.id,
      ticketType: "single_a",
      amountPaid: 3500,
      paymentStatus: "paid",
      arfSignedAt: new Date("2026-01-15"),
      arfYear: 2026,
      checkedInAt: new Date("2026-02-15T09:30:00"),
      checkedOutAt: new Date("2026-02-16T18:15:00"),
      xpEarned: 40,
    },
  });

  await prisma.eventRegistration.create({
    data: {
      userId: player2.id,
      eventId: pastEvent.id,
      ticketType: "single_b",
      amountPaid: 4500,
      paymentStatus: "paid",
      arfSignedAt: new Date("2026-02-01"),
      arfYear: 2026,
      checkedInAt: new Date("2026-02-15T09:45:00"),
      checkedOutAt: new Date("2026-02-16T18:00:00"),
      xpEarned: 40,
      npcMinutes: 120,
    },
  });

  await prisma.eventRegistration.create({
    data: {
      userId: player1.id,
      eventId: upcomingEvent.id,
      ticketType: "single_a",
      amountPaid: 3500,
      paymentStatus: "paid",
      arfSignedAt: new Date("2026-01-15"),
      arfYear: 2026,
    },
  });

  await prisma.eventRegistration.create({
    data: {
      userId: player3.id,
      eventId: upcomingEvent.id,
      ticketType: "single_b",
      amountPaid: 4500,
      paymentStatus: "unpaid",
      arfSignedAt: new Date("2026-03-01"),
      arfYear: 2026,
    },
  });
  console.log("✓ Created event registrations");

  // Create sample characters
  const warriorData = {
    name: "Thorin Ironheart",
    race: "Dwarf",
    characterClass: "Warrior",
    level: 1,
    freeLanguage: "Common",
    history: "A stout warrior from the mountain clans, seeking glory and gold in the realm.",
    skills: [
      { skillName: "One-Handed Weapons", purchaseCount: 1, totalCost: 10 },
      { skillName: "Two-Handed Weapons", purchaseCount: 1, totalCost: 15 },
      { skillName: "Shield", purchaseCount: 1, totalCost: 10 },
      { skillName: "Light Armor", purchaseCount: 1, totalCost: 15 },
      { skillName: "Medium Armor", purchaseCount: 1, totalCost: 20 },
      { skillName: "Added Damage 1", purchaseCount: 1, totalCost: 20 },
      { skillName: "First Aid", purchaseCount: 1, totalCost: 20 },
      { skillName: "Wilderness Lore", purchaseCount: 1, totalCost: 15 },
      { skillName: "Urban Survival", purchaseCount: 1, totalCost: 15 },
    ],
    skillPointsSpent: 140,
    equipment: [
      { itemName: "Longsword", quantity: 1, totalCost: 10 },
      { itemName: "Shield", quantity: 1, totalCost: 5 },
      { itemName: "Leather Armor", quantity: 1, totalCost: 15 },
      { itemName: "Backpack", quantity: 1, totalCost: 2 },
      { itemName: "Torch", quantity: 3, totalCost: 3 },
      { itemName: "Rations", quantity: 5, totalCost: 5 },
      { itemName: "Bedroll", quantity: 1, totalCost: 2 },
      { itemName: "Rope (50ft)", quantity: 1, totalCost: 5 },
      { itemName: "Waterskin", quantity: 1, totalCost: 1 },
    ],
    silverSpent: 48,
  };

  const approvedChar = await prisma.character.create({
    data: {
      userId: player1.id,
      name: "Thorin Ironheart",
      data: JSON.stringify(warriorData),
      status: "approved",
      submittedAt: new Date("2026-02-01T10:00:00"),
      reviewedBy: cbd.id,
      reviewedAt: new Date("2026-02-01T14:30:00"),
      reviewNotes: "Character approved! Well-balanced build. See you at the event!",
    },
  });

  await prisma.auditLog.createMany({
    data: [
      {
        characterId: approvedChar.id,
        actorId: player1.id,
        actorName: player1.name,
        actorRole: player1.role,
        action: "created",
        details: JSON.stringify({ name: "Thorin Ironheart" }),
        createdAt: new Date("2026-01-25T15:00:00"),
      },
      {
        characterId: approvedChar.id,
        actorId: player1.id,
        actorName: player1.name,
        actorRole: player1.role,
        action: "updated",
        details: JSON.stringify({ changes: ["Added equipment"] }),
        createdAt: new Date("2026-01-28T12:00:00"),
      },
      {
        characterId: approvedChar.id,
        actorId: player1.id,
        actorName: player1.name,
        actorRole: player1.role,
        action: "submitted",
        details: JSON.stringify({ submittedFor: "review" }),
        createdAt: new Date("2026-02-01T10:00:00"),
      },
      {
        characterId: approvedChar.id,
        actorId: cbd.id,
        actorName: cbd.name,
        actorRole: cbd.role,
        action: "approved",
        details: JSON.stringify({ notes: "Character approved! Well-balanced build." }),
        createdAt: new Date("2026-02-01T14:30:00"),
      },
    ],
  });

  const rogueData = {
    name: "Shadowmere",
    race: "Common Elf",
    characterClass: "Rogue",
    level: 1,
    freeLanguage: "Elvish",
    history: "A mysterious elf with a talent for stealth and deception, searching for lost artifacts.",
    skills: [
      { skillName: "One-Handed Weapons", purchaseCount: 1, totalCost: 10 },
      { skillName: "Dagger", purchaseCount: 1, totalCost: 5 },
      { skillName: "Backstab", purchaseCount: 1, totalCost: 20 },
      { skillName: "Light Armor", purchaseCount: 1, totalCost: 15 },
      { skillName: "Pick Locks", purchaseCount: 1, totalCost: 15 },
      { skillName: "Find/Remove Traps", purchaseCount: 1, totalCost: 15 },
      { skillName: "Urban Lore", purchaseCount: 1, totalCost: 15 },
      { skillName: "Appraisal", purchaseCount: 1, totalCost: 10 },
      { skillName: "Tracking", purchaseCount: 1, totalCost: 15 },
      { skillName: "Stealth", purchaseCount: 1, totalCost: 20 },
    ],
    skillPointsSpent: 140,
    equipment: [
      { itemName: "Dagger", quantity: 2, totalCost: 4 },
      { itemName: "Short Sword", quantity: 1, totalCost: 8 },
      { itemName: "Leather Armor", quantity: 1, totalCost: 15 },
      { itemName: "Lockpicks", quantity: 1, totalCost: 10 },
      { itemName: "Backpack", quantity: 1, totalCost: 2 },
      { itemName: "Rope (50ft)", quantity: 1, totalCost: 5 },
      { itemName: "Waterskin", quantity: 1, totalCost: 1 },
      { itemName: "Cloak", quantity: 1, totalCost: 3 },
    ],
    silverSpent: 48,
  };

  const pendingChar = await prisma.character.create({
    data: {
      userId: player2.id,
      name: "Shadowmere",
      data: JSON.stringify(rogueData),
      status: "pending_review",
      submittedAt: new Date("2026-03-05T16:00:00"),
    },
  });

  await prisma.auditLog.createMany({
    data: [
      {
        characterId: pendingChar.id,
        actorId: player2.id,
        actorName: player2.name,
        actorRole: player2.role,
        action: "created",
        details: JSON.stringify({ name: "Shadowmere" }),
        createdAt: new Date("2026-03-04T20:00:00"),
      },
      {
        characterId: pendingChar.id,
        actorId: player2.id,
        actorName: player2.name,
        actorRole: player2.role,
        action: "submitted",
        details: JSON.stringify({ submittedFor: "review" }),
        createdAt: new Date("2026-03-05T16:00:00"),
      },
    ],
  });

  const clericData = {
    name: "Sister Elara",
    race: "Human",
    characterClass: "Cleric",
    level: 1,
    freeLanguage: "Common",
    history: "A devoted healer pledged to ease suffering and protect the innocent.",
    skills: [
      { skillName: "First Aid", purchaseCount: 1, totalCost: 20 },
      { skillName: "Earth-Water Ability", purchaseCount: 1, totalCost: 30 },
      { skillName: "Earth-Water 1", purchaseCount: 3, totalCost: 30 },
      { skillName: "Read/Write Common", purchaseCount: 1, totalCost: 10 },
      { skillName: "Light Armor", purchaseCount: 1, totalCost: 15 },
      { skillName: "One-Handed Weapons", purchaseCount: 1, totalCost: 10 },
      { skillName: "Healing Lore", purchaseCount: 1, totalCost: 15 },
      { skillName: "Religion", purchaseCount: 1, totalCost: 10 },
    ],
    skillPointsSpent: 140,
    equipment: [
      { itemName: "Mace", quantity: 1, totalCost: 8 },
      { itemName: "Leather Armor", quantity: 1, totalCost: 15 },
      { itemName: "Holy Symbol", quantity: 1, totalCost: 5 },
      { itemName: "Healing Herbs", quantity: 3, totalCost: 9 },
      { itemName: "Backpack", quantity: 1, totalCost: 2 },
      { itemName: "Waterskin", quantity: 1, totalCost: 1 },
      { itemName: "Rations", quantity: 5, totalCost: 5 },
      { itemName: "Bedroll", quantity: 1, totalCost: 2 },
    ],
    silverSpent: 47,
  };

  const draftChar = await prisma.character.create({
    data: {
      userId: player3.id,
      name: "Sister Elara",
      data: JSON.stringify(clericData),
      status: "draft",
    },
  });

  await prisma.auditLog.create({
    data: {
      characterId: draftChar.id,
      actorId: player3.id,
      actorName: player3.name,
      actorRole: player3.role,
      action: "created",
      details: JSON.stringify({ name: "Sister Elara" }),
    },
  });

  const rejectedData = {
    name: "Gandor the Mighty",
    race: "Half-Ogre",
    characterClass: "Warrior",
    level: 1,
    freeLanguage: "Common",
    history: "A towering warrior with unmatched strength.",
    skills: [
      { skillName: "Two-Handed Weapons", purchaseCount: 1, totalCost: 15 },
      { skillName: "Added Damage 1", purchaseCount: 1, totalCost: 20 },
      { skillName: "Added Damage 2", purchaseCount: 1, totalCost: 30 },
      { skillName: "Medium Armor", purchaseCount: 1, totalCost: 20 },
    ],
    skillPointsSpent: 85,
    equipment: [
      { itemName: "Greatsword", quantity: 1, totalCost: 15 },
      { itemName: "Chainmail", quantity: 1, totalCost: 25 },
    ],
    silverSpent: 40,
  };

  const rejectedChar = await prisma.character.create({
    data: {
      userId: player2.id,
      name: "Gandor the Mighty",
      data: JSON.stringify(rejectedData),
      status: "rejected",
      submittedAt: new Date("2026-03-01T10:00:00"),
      reviewedBy: gm.id,
      reviewedAt: new Date("2026-03-01T15:00:00"),
      reviewNotes: "Please spend all 140 skill points. You still have 55 points remaining. Also consider adding Light Armor before Medium Armor as it's more cost-effective for level 1.",
    },
  });

  await prisma.auditLog.createMany({
    data: [
      {
        characterId: rejectedChar.id,
        actorId: player2.id,
        actorName: player2.name,
        actorRole: player2.role,
        action: "created",
        details: JSON.stringify({ name: "Gandor the Mighty" }),
        createdAt: new Date("2026-02-28T18:00:00"),
      },
      {
        characterId: rejectedChar.id,
        actorId: player2.id,
        actorName: player2.name,
        actorRole: player2.role,
        action: "submitted",
        details: JSON.stringify({ submittedFor: "review" }),
        createdAt: new Date("2026-03-01T10:00:00"),
      },
      {
        characterId: rejectedChar.id,
        actorId: gm.id,
        actorName: gm.name,
        actorRole: gm.role,
        action: "rejected",
        details: JSON.stringify({ notes: "Please spend all skill points" }),
        createdAt: new Date("2026-03-01T15:00:00"),
      },
    ],
  });

  // Create another pending_review character (for testing review queue)
  const mageData = {
    name: "Vaelith Stormweaver",
    race: "Common Elf",
    characterClass: "Mage",
    level: 1,
    freeLanguage: "Elvish",
    history: "An elven scholar who left the Ivory Tower to study wild magic in the untamed lands.",
    skills: [
      { skillName: "Fire-Air Ability", purchaseCount: 1, totalCost: 30 },
      { skillName: "Fire-Air 1", purchaseCount: 3, totalCost: 30 },
      { skillName: "Read/Write Common", purchaseCount: 1, totalCost: 10 },
      { skillName: "Read/Write Elvish", purchaseCount: 1, totalCost: 10 },
      { skillName: "Magical Lore", purchaseCount: 1, totalCost: 15 },
      { skillName: "Appraisal", purchaseCount: 1, totalCost: 10 },
      { skillName: "Alchemy 1", purchaseCount: 1, totalCost: 15 },
      { skillName: "Dagger", purchaseCount: 1, totalCost: 5 },
      { skillName: "Staff", purchaseCount: 1, totalCost: 5 },
      { skillName: "Herbalism", purchaseCount: 1, totalCost: 10 },
    ],
    skillPointsSpent: 140,
    equipment: [
      { itemName: "Staff", quantity: 1, totalCost: 5 },
      { itemName: "Dagger", quantity: 1, totalCost: 2 },
      { itemName: "Spell Components", quantity: 5, totalCost: 10 },
      { itemName: "Backpack", quantity: 1, totalCost: 2 },
      { itemName: "Bedroll", quantity: 1, totalCost: 2 },
      { itemName: "Waterskin", quantity: 1, totalCost: 1 },
      { itemName: "Rations", quantity: 5, totalCost: 5 },
      { itemName: "Alchemy Kit", quantity: 1, totalCost: 15 },
    ],
    silverSpent: 42,
  };

  const pendingMage = await prisma.character.create({
    data: {
      userId: player3.id,
      name: "Vaelith Stormweaver",
      data: JSON.stringify(mageData),
      status: "pending_review",
      submittedAt: new Date("2026-03-06T09:00:00"),
    },
  });

  await prisma.auditLog.createMany({
    data: [
      {
        characterId: pendingMage.id,
        actorId: player3.id,
        actorName: player3.name,
        actorRole: player3.role,
        action: "created",
        details: JSON.stringify({ name: "Vaelith Stormweaver" }),
        createdAt: new Date("2026-03-05T14:00:00"),
      },
      {
        characterId: pendingMage.id,
        actorId: player3.id,
        actorName: player3.name,
        actorRole: player3.role,
        action: "submitted",
        details: JSON.stringify({ submittedFor: "review" }),
        createdAt: new Date("2026-03-06T09:00:00"),
      },
    ],
  });

  console.log("✓ Created sample characters (including 2 pending review)");

  // Link characters to past event registrations and create sign-outs
  const pastReg1 = await prisma.eventRegistration.findFirst({
    where: { userId: player1.id, eventId: pastEvent.id },
  });
  const pastReg2 = await prisma.eventRegistration.findFirst({
    where: { userId: player2.id, eventId: pastEvent.id },
  });

  if (pastReg1) {
    await prisma.eventRegistration.update({
      where: { id: pastReg1.id },
      data: { characterId: approvedChar.id },
    });

    await prisma.characterSignOut.create({
      data: {
        characterId: approvedChar.id,
        userId: player1.id,
        eventId: pastEvent.id,
        registrationId: pastReg1.id,
        status: "pending",
        npcMinutes: 45,
        npcDetails: "Played orc scout in module 2, townsfolk in opening scene",
        staffMinutes: 0,
        lifeCreditsLost: 0,
        skillsLearned: JSON.stringify([
          {
            skillName: "Heavy Armor",
            count: 1,
            teacherName: "Bob Barbarian",
            teacherCharacter: "Gandor the Mighty",
          },
        ]),
        skillsTaught: JSON.stringify([
          {
            skillName: "First Aid",
            studentNames: "Carol Cleric",
          },
        ]),
        eventRating: 8,
        roleplayQuality: "above_average",
        enjoyedEncounters: "The undead siege on the northern gate was amazing. Great costuming on the necromancer NPC.",
        dislikedEncounters: "The puzzle in module 3 was a bit confusing with unclear clues.",
        notableRoleplay: "Had a great tavern scene with the elven delegation, lots of political intrigue.",
        atmosphereFeedback: "Camp decorations were great, especially the fog machines at night.",
        betweenEventAction: "adventuring",
        betweenEventDetails: JSON.stringify({
          destination: "Thornwood Pass",
          purpose: "Investigating reports of orc scouts along the old trade road",
        }),
      },
    });
  }

  if (pastReg2) {
    // Bob played a character that was later rejected, but the sign-out is from the event
    await prisma.eventRegistration.update({
      where: { id: pastReg2.id },
      data: { characterId: rejectedChar.id },
    });

    await prisma.characterSignOut.create({
      data: {
        characterId: rejectedChar.id,
        userId: player2.id,
        eventId: pastEvent.id,
        registrationId: pastReg2.id,
        status: "pending",
        npcMinutes: 120,
        npcDetails: "Ran monster camp for module 1 and 4, various undead and bandits",
        staffMinutes: 30,
        staffDetails: "Helped with gate logistics during check-in",
        lifeCreditsLost: 1,
        skillsLearned: JSON.stringify([]),
        skillsTaught: JSON.stringify([
          {
            skillName: "Two-Handed Weapons",
            studentNames: "Alice Adventurer, Carol Cleric",
          },
        ]),
        eventRating: 9,
        roleplayQuality: "excellent",
        enjoyedEncounters: "Every combat encounter was well-paced. The final battle was epic.",
        dislikedEncounters: null,
        notableRoleplay: "Organized a mercenary guild in-game, recruited 4 other players.",
        atmosphereFeedback: "Best event yet. The night ambush was terrifying in the best way.",
        betweenEventAction: "crafting",
        betweenEventDetails: JSON.stringify({
          craftingSkill: "Weaponsmithing",
          itemName: "Reinforced Greatsword",
          description: "Reforging my greatsword with salvaged orc iron from the battle",
        }),
      },
    });
  }

  // Create a third registration + sign-out for player3 at the past event
  const pastReg3 = await prisma.eventRegistration.create({
    data: {
      userId: player3.id,
      eventId: pastEvent.id,
      ticketType: "day_pass",
      amountPaid: 2000,
      paymentStatus: "paid",
      arfSignedAt: new Date("2026-02-14"),
      arfYear: 2026,
      characterId: draftChar.id,
      checkedInAt: new Date("2026-02-15T11:00:00"),
      checkedOutAt: new Date("2026-02-15T19:00:00"),
      xpEarned: 20,
    },
  });

  await prisma.characterSignOut.create({
    data: {
      characterId: draftChar.id,
      userId: player3.id,
      eventId: pastEvent.id,
      registrationId: pastReg3.id,
      status: "pending",
      npcMinutes: 60,
      npcDetails: "Played temple guardian and healer NPC in module 2",
      staffMinutes: 0,
      lifeCreditsLost: 0,
      skillsLearned: JSON.stringify([
        {
          skillName: "Earth-Water 1",
          count: 1,
          teacherName: "Alice Adventurer",
          teacherCharacter: "Thorin Ironheart",
        },
      ]),
      skillsTaught: JSON.stringify([]),
      eventRating: 7,
      roleplayQuality: "average",
      enjoyedEncounters: "The healing challenge module was right up my alley.",
      dislikedEncounters: "Wished there were more non-combat encounters for healer characters.",
      notableRoleplay: null,
      atmosphereFeedback: "Good overall, would love more ambient music at the tavern.",
      betweenEventAction: "researching",
      betweenEventDetails: JSON.stringify({
        topic: "Ancient healing rituals",
        library: "Temple of the Silver Moon archives",
      }),
    },
  });

  console.log("✓ Created 3 sign-out records (all pending)");

  // Link upcoming event registrations to characters
  const upcomingReg1 = await prisma.eventRegistration.findFirst({
    where: { userId: player1.id, eventId: upcomingEvent.id },
  });
  if (upcomingReg1) {
    await prisma.eventRegistration.update({
      where: { id: upcomingReg1.id },
      data: { characterId: approvedChar.id },
    });
  }
  console.log("✓ Linked upcoming registrations to characters");

  // Create lore entries
  await prisma.loreEntry.createMany({
    data: [
      {
        title: "The Battle of Thornwood Pass",
        content: `In the autumn of the 42nd year of King Aldric's reign, a great battle was fought at Thornwood Pass. The forces of the Kingdom faced an unprecedented incursion of orcish tribes led by the fearsome warlord Gruk'tar Bonecrusher.\n\nThe battle raged for three days. Heroes emerged from unexpected places - a young cleric named Elara healed the wounded tirelessly, while the ranger Maeven's arrows found their marks in the darkness. On the third dawn, as hope waned, the cavalry of the Silver Order arrived, led by Commander Theron Brightblade.\n\nThough the kingdom prevailed, the cost was high. Many brave souls fell defending the pass, including the beloved Lord Cedric of Thornwood, who gave his life holding the line so others could retreat to safety.`,
        summary: "Major battle at Thornwood Pass against orcish invaders. Kingdom victory but heavy casualties including Lord Cedric.",
        source: "Mystic Quill - Autumn 2023",
        year: 2023,
        month: 10,
        locations: JSON.stringify(["Thornwood Pass", "Kingdom"]),
        characters: JSON.stringify(["Gruk'tar Bonecrusher", "Elara", "Maeven", "Theron Brightblade", "Lord Cedric"]),
        tags: JSON.stringify(["battle", "orcs", "war", "kingdom"]),
        category: "story",
      },
      {
        title: "Winter's Tale Event Recap",
        content: `This past weekend marked another successful chapter in Kanar's ongoing saga. Nearly 80 adventurers braved the February cold to defend the realm from a mysterious winter curse.\n\nThe weekend saw fierce combat as undead forces threatened the northern villages. A coalition of heroes worked tirelessly to uncover the source of the curse - an ancient artifact buried beneath the Frostpeak Temple. Special commendation to the party who successfully completed the Temple Delve module, recovering the Scepter of Eternal Winter.\n\nThe Saturday night ritual was spectacular, with over 30 participants combining their magical energies to shatter the curse. The weekend concluded with the traditional tournament, with Kara Swiftblade taking first place.\n\nThank you to all our NPCs who helped bring this event to life!`,
        summary: "Recap of Winter's Tale 2026 event. Undead threat, temple delve, curse-breaking ritual, and tournament.",
        source: "Event Recap - Winter's Tale 2026",
        year: 2026,
        month: 2,
        locations: JSON.stringify(["Frostpeak Temple", "Northern Villages"]),
        characters: JSON.stringify(["Kara Swiftblade"]),
        tags: JSON.stringify(["event", "undead", "curse", "tournament", "ritual"]),
        category: "recap",
      },
      {
        title: "New Trade Routes Open to Silverport",
        content: `By decree of the Merchants' Guild, new trade routes have been established connecting Silverport to the eastern kingdoms. Caravans will depart weekly, carrying goods and opportunities for adventurers seeking work as guards.\n\nAll interested parties should register with the Guild Hall before the next departure on the 15th day of the Spring Moon.`,
        summary: "Announcement: New trade routes to Silverport, weekly caravans seeking guards.",
        source: "Mystic Quill - March 2026",
        year: 2026,
        month: 3,
        locations: JSON.stringify(["Silverport", "Eastern Kingdoms"]),
        characters: JSON.stringify([]),
        tags: JSON.stringify(["trade", "caravan", "opportunity"]),
        category: "announcement",
      },
      {
        title: "In Memory: Lord Cedric of Thornwood",
        content: `It is with heavy hearts that we remember Lord Cedric of Thornwood, who fell defending the pass that bears his family name. A seasoned warrior and beloved leader, he stood firm when others faltered, buying time for civilians to escape the orcish advance.\n\nHis sacrifice will not be forgotten. A memorial stone has been erected at the pass, and his son, Young Lord Marcus, has sworn to continue his father's legacy of service to the realm.`,
        summary: "Memorial for Lord Cedric, fallen hero of Thornwood Pass.",
        source: "Mystic Quill - Autumn 2023",
        year: 2023,
        month: 11,
        locations: JSON.stringify(["Thornwood Pass"]),
        characters: JSON.stringify(["Lord Cedric", "Marcus"]),
        tags: JSON.stringify(["death", "memorial", "hero"]),
        category: "obituary",
      },
      {
        title: "Rumors from the Tavern",
        content: `Whispers in the Golden Griffin speak of strange lights seen near the Old Mill after dark. Some say it's smugglers, others claim it's something far more sinister. The miller's daughter swears she heard voices chanting in an unknown tongue.\n\nMeanwhile, a mysterious hooded figure has been asking questions about the location of the Lost Temple of Mysteries. Several adventurers have followed leads into the Darkwood, but none have returned with answers.\n\nAnd perhaps most intriguing - the royal jeweler reported that someone commissioned a replica of the Crown of Stars, an artifact that was supposedly destroyed centuries ago. Why would anyone want a copy of a cursed crown?`,
        summary: "Tavern rumors: Strange lights at Old Mill, mysterious figure seeking Lost Temple, replica of cursed crown commissioned.",
        source: "Mystic Quill - March 2026",
        year: 2026,
        month: 3,
        locations: JSON.stringify(["Golden Griffin Tavern", "Old Mill", "Darkwood", "Lost Temple of Mysteries"]),
        characters: JSON.stringify([]),
        tags: JSON.stringify(["mystery", "tavern", "rumors", "temple", "artifact"]),
        category: "rumor",
      },
    ],
  });
  console.log("✓ Created lore entries");

  // Create lore characters
  await prisma.loreCharacter.createMany({
    data: [
      {
        name: "Theron Brightblade",
        title: "Commander",
        race: "Human",
        class: "Warrior",
        faction: "Silver Order",
        description: "Commander of the Silver Order cavalry. Distinguished by his shining plate armor and tactical brilliance. Known for arriving just in time to turn the tide of battle.",
        firstMentioned: "Mystic Quill - Autumn 2023",
      },
      {
        name: "Gruk'tar Bonecrusher",
        title: "Warlord",
        race: "Orc",
        class: "Warrior",
        faction: "Orcish Tribes",
        description: "Fearsome orcish warlord who united multiple tribes for the assault on Thornwood Pass. Last seen retreating into the Badlands after the defeat.",
        firstMentioned: "Mystic Quill - Autumn 2023",
      },
      {
        name: "Lord Cedric",
        title: "Lord",
        race: "Human",
        class: "Warrior",
        faction: "Kingdom",
        description: "Fallen lord of Thornwood. Died heroically holding Thornwood Pass. Father of Young Lord Marcus.",
        firstMentioned: "Mystic Quill - Autumn 2023",
      },
      {
        name: "Maeven",
        title: null,
        race: "Forest Elf",
        class: "Rogue",
        faction: null,
        description: "Legendary ranger whose arrows never miss. Played crucial role in the Battle of Thornwood Pass.",
        firstMentioned: "Mystic Quill - Autumn 2023",
      },
      {
        name: "Kara Swiftblade",
        title: null,
        race: "Human",
        class: "Warrior",
        faction: null,
        description: "Tournament champion. Won the Winter's Tale 2026 tournament. Known for incredible speed and technique.",
        firstMentioned: "Event Recap - Winter's Tale 2026",
        assignedToId: player1.id,
      },
    ],
  });
  console.log("✓ Created lore characters");

  console.log("\n✅ Seeding complete!\n");
  console.log("Test Accounts (all passwords: password123):");
  console.log("- admin@kanar.test (Admin)");
  console.log("- cbd@kanar.test (Character Book Director)");
  console.log("- gm@kanar.test (Gamemaster)");
  console.log("- econ@kanar.test (Economy Marshal)");
  console.log("- player1@kanar.test (Alice Adventurer)");
  console.log("- player2@kanar.test (Bob Barbarian)");
  console.log("- player3@kanar.test (Carol Cleric)");
  console.log("\nSample data created:");
  console.log("- 3 events (1 past, 2 upcoming)");
  console.log("- 5 characters (approved, 2 pending review, draft, rejected)");
  console.log("- 3 sign-out records (all pending, for CBD queue)");
  console.log("- 5 lore entries");
  console.log("- 5 lore characters");
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
