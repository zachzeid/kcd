/**
 * Import monsters from GMS-019.1 Monster Book Excel file into seed-compatible format.
 * Usage: npx tsx scripts/import-monsters.ts
 *
 * Outputs the createMany data array to stdout for pasting into seed.ts,
 * and also directly inserts into the database.
 */
import XLSX from "xlsx";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

const url = process.env.DATABASE_URL || `file:${path.join(process.cwd(), "dev.db")}`;
const authToken = process.env.DATABASE_AUTH_TOKEN || undefined;
const adapter = new PrismaLibSql({ url, authToken });
const prisma = new PrismaClient({ adapter });

function parseCategory(npcType: string, terrain: string): string {
  const t = (npcType || "").toLowerCase();
  if (t.includes("undead")) return "undead";
  if (t.includes("draconic") || t.includes("dragon")) return "dragon";
  if (t.includes("fairy") || t.includes("fey") || t.includes("faerie")) return "fey";
  if (t.includes("demon") || t.includes("devil") || t.includes("infernal")) return "demon";
  if (t.includes("elemental") || t.includes("planar")) return "elemental";
  if (t.includes("construct") || t.includes("golem")) return "construct";
  if (t.includes("plant") || t.includes("fungus")) return "plant";
  if (t.includes("ooze") || t.includes("slime")) return "ooze";
  if (t.includes("humanoid")) return "humanoid";
  if (t.includes("psionic")) return "aberration";
  if (t.includes("natural") || t.includes("monster")) return "beast";

  // Fallback: guess from terrain or name
  const tr = (terrain || "").toLowerCase();
  if (tr.includes("plane") || tr.includes("astral") || tr.includes("ethereal")) return "elemental";
  return "beast"; // default
}

function parseBP(bp: string | number): number {
  if (typeof bp === "number") return bp;
  const s = String(bp).trim();
  // Handle formats like "9   (11)" — take first number
  const match = s.match(/(\d+)/);
  return match ? parseInt(match[1]) : 1;
}

function parseAbilities(row: Record<string, string>): string[] {
  const abilities: string[] = [];

  // Weapon/damage info
  const weapon = String(row["Weapon Types"] || "").trim();
  const damage = String(row["Damage"] || "").trim();
  if (weapon && weapon !== "0") {
    abilities.push(`${weapon}${damage ? ` (${damage} damage)` : ""}`);
  } else if (damage && damage !== "0") {
    abilities.push(`Attack (${damage} damage)`);
  }

  // Special attacks
  const attacks = String(row["Special Attacks"] || "").trim();
  if (attacks && attacks !== "0") {
    // Split long text into individual abilities where possible
    const parts = attacks.split(/\.\s+/).filter(Boolean);
    for (const p of parts.slice(0, 5)) { // Cap at 5 for readability
      const cleaned = p.trim().replace(/\s+/g, " ");
      if (cleaned.length > 3) abilities.push(cleaned.endsWith(".") ? cleaned : cleaned + ".");
    }
  }

  return abilities;
}

function parseDefenses(row: Record<string, string>): { resistances: string[]; weaknesses: string[] } {
  const resistances: string[] = [];
  const weaknesses: string[] = [];

  const defenses = String(row["Special Defenses"] || "").trim();
  if (defenses && defenses !== "0") {
    // Extract common defense patterns
    if (/immune|immunity/i.test(defenses)) resistances.push("See special defenses");
    if (/magic|magical/i.test(defenses) && /only|hit.*by/i.test(defenses)) resistances.push("Physical (requires magic)");
    if (/silver/i.test(defenses)) resistances.push("Requires silver weapons");
    if (/fire/i.test(defenses) && /resist|immune/i.test(defenses)) resistances.push("Fire");
    if (/cold/i.test(defenses) && /resist|immune/i.test(defenses)) resistances.push("Cold");
    if (resistances.length === 0 && defenses.length > 5) {
      resistances.push(defenses.slice(0, 150));
    }
  }

  // Check notes for weaknesses
  const notes = String(row["Notes"] || "").trim();
  if (notes && /vulner|weak/i.test(notes)) {
    weaknesses.push(notes.slice(0, 150));
  }

  return { resistances, weaknesses };
}

function parseMagicLevel(magic: string): number {
  // Magic field is like "0 0 0 0 0 0 0 0 0" (9 spell levels)
  const parts = String(magic || "").trim().split(/\s+/);
  let total = 0;
  for (const p of parts) {
    total += parseInt(p) || 0;
  }
  return total;
}

function parseTags(row: Record<string, string>): string[] {
  const tags: string[] = [];
  const freq = String(row["Frequency"] || "").toLowerCase();
  if (freq.includes("unique") || freq.includes("rare")) tags.push("rare");
  if (freq.includes("common")) tags.push("common");

  const source = String(row["Source"] || "");
  if (source === "Master") tags.push("core");

  // Estimate difficulty
  const bp = parseBP(row["BP"]);
  if (bp >= 50) tags.push("boss");
  else if (bp >= 25) tags.push("elite");
  else tags.push("minion");

  return tags;
}

async function main() {
  const wb = XLSX.readFile("GMS-019.1 Monster Book 12.03.xlsx");
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { defval: "" }) as Record<string, string>[];

  console.log(`Found ${data.length} rows in Excel`);

  // Get or create a system user for createdBy
  let gmUser = await prisma.user.findFirst({ where: { role: "gm" } });
  if (!gmUser) {
    gmUser = await prisma.user.findFirst({ where: { role: "admin" } });
  }
  if (!gmUser) {
    console.error("No GM or admin user found. Run seed first.");
    process.exit(1);
  }

  // Clear existing monster book entries
  await prisma.monsterBookEntry.deleteMany();
  console.log("Cleared existing monster book entries");

  let imported = 0;
  let skipped = 0;

  for (const row of data) {
    const name = String(row["NPC Name"] || "").trim();
    if (!name) { skipped++; continue; }

    const category = parseCategory(
      String(row["NPC Type"] || ""),
      String(row["Terrain"] || "")
    );
    const bp = parseBP(row["BP"]);
    const ap = parseInt(String(row["AP"] || "0")) || 0;
    const description = String(row["Description"] || "").trim().replace(/\s+/g, " ") || null;
    const abilities = parseAbilities(row);
    const { resistances, weaknesses } = parseDefenses(row);
    const tags = parseTags(row);
    const magicLevel = parseMagicLevel(String(row["Magic"] || ""));

    // Use magic level to estimate creature level (rough heuristic)
    const level = Math.max(1, Math.min(30, Math.ceil(bp / 5) + (magicLevel > 0 ? Math.min(5, Math.ceil(magicLevel / 3)) : 0)));

    // Build lore connections
    const loreRefs: string[] = [];
    for (let i = 1; i <= 5; i++) {
      const lore = String(row[`Applicable Lore ${i}`] || "").trim();
      if (lore) loreRefs.push(lore);
    }

    // Add AP and terrain info to description
    let fullDesc = description || "";
    if (ap > 0) fullDesc += ` AP: ${ap}.`;
    const terrain = String(row["Terrain"] || "").trim();
    if (terrain) fullDesc += ` Terrain: ${terrain}.`;
    if (loreRefs.length > 0) fullDesc += ` Lore: ${loreRefs.join(", ")}.`;

    const roleplaying = String(row["Roleplaying Tips"] || "").trim();
    if (roleplaying && roleplaying !== "0" && roleplaying.length > 5) {
      abilities.push(`RP: ${roleplaying.slice(0, 200)}`);
    }

    await prisma.monsterBookEntry.create({
      data: {
        name,
        category,
        race: String(row["NPC Type"] || "").trim() || null,
        level,
        bodyPoints: bp || 1,
        description: fullDesc.trim() || null,
        abilities: JSON.stringify(abilities),
        resistances: JSON.stringify(resistances),
        weaknesses: JSON.stringify(weaknesses),
        loot: null,
        tags: JSON.stringify(tags),
        createdBy: gmUser.id,
      },
    });
    imported++;
  }

  console.log(`\nImport complete: ${imported} monsters imported, ${skipped} skipped`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
