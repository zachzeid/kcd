"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ChronicleCharacter {
  id: string;
  characterId: string;
  characterName: string;
  race: string;
  characterClass: string;
  summary: string;
}

interface EventChronicle {
  id: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  title: string;
  recap: string;
  narrative: string;
  locations: string[];
  tags: string[];
  messageCount: number;
  createdAt: string;
  characters: ChronicleCharacter[];
}

export default function EventLoreTab() {
  const [chronicles, setChronicles] = useState<EventChronicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/chronicles")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setChronicles(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-gray-500 text-center py-8">Loading...</div>;
  }

  if (chronicles.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-900/30 rounded-lg border border-gray-800">
        <p className="text-gray-500">No event chronicles yet.</p>
        <p className="text-gray-600 text-xs mt-2">
          Chronicles are generated from Discord RP sessions using the Chronicler bot.
          Use <code className="text-amber-500">/event-start</code> in Discord to begin recording.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-white">Event Lore</h2>
        <span className="text-gray-500 text-xs">{chronicles.length} chronicle{chronicles.length !== 1 ? "s" : ""}</span>
      </div>

      {chronicles.map((c) => (
        <div
          key={c.id}
          className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden"
        >
          {/* Header — click to expand */}
          <div
            className="p-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
            onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-medium">{c.title}</span>
                  <span className="px-1.5 py-0.5 rounded text-xs bg-amber-900 text-amber-300">
                    Chronicle
                  </span>
                </div>
                <div className="text-amber-500/70 text-xs mb-2">{c.eventName}</div>
                <p className="text-gray-400 text-sm">{c.recap}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {c.locations.map((loc) => (
                    <span
                      key={loc}
                      className="px-1.5 py-0.5 rounded text-xs bg-green-900/50 text-green-300"
                    >
                      {loc}
                    </span>
                  ))}
                  {c.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 rounded text-xs bg-blue-900/50 text-blue-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right shrink-0 ml-4">
                <div className="text-gray-500 text-xs">
                  {new Date(c.eventDate).toLocaleDateString()}
                </div>
                <div className="text-gray-600 text-xs mt-1">
                  {c.messageCount} messages
                </div>
                <div className="text-gray-600 text-xs">
                  {c.characters.length} character{c.characters.length !== 1 ? "s" : ""}
                </div>
                <span className={`text-gray-500 text-sm inline-block mt-1 transition-transform ${expandedId === c.id ? "rotate-180" : ""}`}>
                  &#9660;
                </span>
              </div>
            </div>
          </div>

          {/* Expanded detail */}
          {expandedId === c.id && (
            <div className="border-t border-gray-800 p-4 space-y-4">
              {/* Narrative */}
              {c.narrative && (
                <div>
                  <h4 className="text-amber-500 text-xs font-bold uppercase mb-2">Narrative</h4>
                  <div className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                    {c.narrative}
                  </div>
                </div>
              )}

              {/* Character summaries */}
              {c.characters.length > 0 && (
                <div>
                  <h4 className="text-amber-500 text-xs font-bold uppercase mb-2">Character Accounts</h4>
                  <div className="space-y-2">
                    {c.characters.map((ch) => (
                      <div
                        key={ch.id}
                        className="p-3 bg-gray-950 rounded border border-gray-800"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Link
                            href={`/characters/${ch.characterId}`}
                            className="text-white text-sm font-medium hover:text-amber-400"
                          >
                            {ch.characterName}
                          </Link>
                          <span className="text-gray-600 text-xs">
                            {ch.race} {ch.characterClass}
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs leading-relaxed">
                          {ch.summary}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {c.characters.length === 0 && (
                <p className="text-gray-600 text-xs">
                  No characters were linked to this chronicle. Players need to use <code className="text-amber-500">/register</code> in Discord before RP sessions.
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
