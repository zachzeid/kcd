import Anthropic from "@anthropic-ai/sdk";
import type { EventSession } from "./recorder.js";

const anthropic = new Anthropic();

export interface CharacterUpdate {
  characterName: string;
  historyEntry: string;
}

export interface LoreEntryData {
  title: string;
  content: string;
  summary: string;
  characters: string[];
  locations: string[];
  tags: string[];
}

export interface ChronicleResult {
  characterUpdates: CharacterUpdate[];
  loreEntries: LoreEntryData[];
  recap: string; // Short summary to post in Discord
}

const SYSTEM_PROMPT = `You are the Chronicler of K1 (Kanar), a LARP world. Your job is to read a transcript of an online roleplay event and produce structured output that becomes part of the game's permanent history.

You will receive:
1. The event title
2. A character roster mapping Discord usernames to character names, races, and classes
3. The full message transcript from the roleplay session

From this, produce a JSON object with exactly this structure:
{
  "characterUpdates": [
    {
      "characterName": "Exact character name from roster",
      "historyEntry": "A 2-4 sentence narrative of what this character did, experienced, or how they changed during the event. Written in third person past tense, in an in-world voice."
    }
  ],
  "loreEntries": [
    {
      "title": "A concise title for this world event",
      "content": "A full narrative account (3-8 paragraphs) of what happened, written as an in-world historical record. Include key actions, discoveries, conflicts, and outcomes.",
      "summary": "A 1-2 sentence summary for search results.",
      "characters": ["Character names involved"],
      "locations": ["Location names mentioned or implied"],
      "tags": ["Relevant tags like: battle, diplomacy, exploration, magic, undead, artifact, trade, etc."]
    }
  ],
  "recap": "A 2-3 sentence summary suitable for a Discord announcement. Engaging but concise."
}

Rules:
- Only include characters who actually participated in the roleplay (appeared in the transcript).
- If a Discord user is not in the roster, use their Discord display name and note them as an unregistered participant.
- Group related events into a single lore entry when they form one narrative arc. Create multiple entries only if genuinely separate events occurred.
- Write in the voice of a medieval chronicler — evocative but factual.
- Preserve the actual outcomes of the roleplay. Do not invent events that didn't happen.
- For character updates, focus on what is narratively significant — not every small action, but meaningful moments.
- Return ONLY the JSON object, no markdown fences or commentary.`;

export async function synthesize(
  session: EventSession,
  roster: Map<string, { characterName: string; race: string; characterClass: string }>
): Promise<ChronicleResult> {
  // Build roster context
  const rosterLines = Array.from(roster.entries())
    .map(([discordName, char]) => `  ${discordName} → ${char.characterName} (${char.race} ${char.characterClass})`)
    .join("\n");

  // Build transcript (limit to most recent messages if very long)
  const transcript = session.messages
    .map((m) => `[${m.timestamp}] ${m.authorName}: ${m.content}`)
    .join("\n");

  const userMessage = `EVENT TITLE: ${session.eventTitle}

CHARACTER ROSTER:
${rosterLines || "  (No registered characters — use Discord display names)"}

TRANSCRIPT (${session.messages.length} messages):
${transcript}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  try {
    return JSON.parse(text) as ChronicleResult;
  } catch {
    throw new Error(`Failed to parse Claude response as JSON: ${text.slice(0, 200)}...`);
  }
}
