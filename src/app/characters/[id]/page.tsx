"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CHARACTER_STATUSES, type CharacterStatus } from "@/lib/character-status";

function formatSilver(copper: number): string {
  const silver = copper / 100;
  if (Number.isInteger(silver)) return `${silver} silver`;
  return `${silver.toFixed(1)} silver`;
}

interface CharacterData {
  name: string;
  race: string;
  characterClass: string;
  level: number;
  freeLanguage: string;
  history: string;
  skillPointsSpent: number;
  silverSpent: number;
  skills: { skillName: string; purchaseCount: number; totalCost: number }[];
  equipment: { itemName: string; quantity: number; totalCost: number }[];
}

interface BankTransaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

interface BankData {
  balance: number;
  balanceFormatted: string;
  transactions: BankTransaction[];
}

interface LoreMention {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string | null;
  date: string | null;
  year: number | null;
  category: string;
}

interface CharacterResponse {
  id: string;
  name: string;
  status: CharacterStatus;
  reviewNotes: string | null;
  data: CharacterData;
  userName?: string;
  userEmail?: string;
  createdAt: string;
  updatedAt: string;
}

interface EventHistory {
  eventId: string;
  eventTitle: string;
  startDate: string;
  xpEarned: number;
  npcMinutes: number;
}

interface CharacterHistory {
  totalXP: number;
  totalNPCMinutes: number;
  eventsAttended: number;
  eventHistory: EventHistory[];
}

export default function CharacterSummaryPage() {
  const params = useParams();
  const router = useRouter();
  const [character, setCharacter] = useState<CharacterResponse | null>(null);
  const [history, setHistory] = useState<CharacterHistory | null>(null);
  const [bank, setBank] = useState<BankData | null>(null);
  const [loreMentions, setLoreMentions] = useState<LoreMention[]>([]);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/characters/${params.id}`).then((r) =>
        r.ok ? r.json() : null
      ),
      fetch(`/api/characters/${params.id}/history`).then((r) =>
        r.ok ? r.json() : null
      ),
      fetch(`/api/characters/${params.id}/bank`).then((r) =>
        r.ok ? r.json() : null
      ),
    ])
      .then(([charData, historyData, bankData]) => {
        setCharacter(charData);
        setHistory(historyData);
        setBank(bankData?.bank ?? null);
        // Fetch lore mentions by character name
        if (charData?.data?.name) {
          fetch(`/api/lore?character=${encodeURIComponent(charData.data.name)}`)
            .then((r) => (r.ok ? r.json() : { entries: [] }))
            .then((data) => setLoreMentions(data.entries ?? []))
            .catch(() => setLoreMentions([]));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
        <div className="text-gray-400">Character not found.</div>
        <button
          onClick={() => router.back()}
          className="text-amber-400 hover:underline text-sm"
        >
          Go back
        </button>
      </div>
    );
  }

  const d = character.data;
  const statusInfo =
    CHARACTER_STATUSES[character.status] ?? CHARACTER_STATUSES.draft;

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{d.name}</h1>
            <p className="text-gray-400 text-sm">
              Level {d.level} {d.race} {d.characterClass}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`px-2 py-0.5 rounded text-xs font-bold ${statusInfo.color}`}
            >
              {statusInfo.label}
            </span>
            <Link
              href={`/print/${character.id}`}
              target="_blank"
              className="px-3 py-1.5 rounded text-xs bg-gray-700 text-gray-300 hover:bg-gray-600"
            >
              Print Sheet
            </Link>
            <button
              onClick={() => router.back()}
              className="text-gray-400 hover:text-white text-sm"
            >
              Back
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Owner info (if available) */}
        {character.userName && (
          <div className="text-gray-500 text-sm">
            Player: {character.userName}
            {character.userEmail && (
              <span className="text-gray-600"> ({character.userEmail})</span>
            )}
          </div>
        )}

        {/* Review notes */}
        {character.reviewNotes && (
          <div className="p-3 rounded-lg border border-yellow-800/50 bg-yellow-900/10">
            <div className="text-yellow-400 text-xs font-bold mb-1">
              Review Notes
            </div>
            <p className="text-gray-300 text-sm">{character.reviewNotes}</p>
          </div>
        )}

        {/* Stats overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Level" value={String(d.level)} />
          <StatCard label="Race" value={d.race} />
          <StatCard label="Class" value={d.characterClass} />
          <StatCard label="Language" value={d.freeLanguage} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Skill Points"
            value={`${d.skillPointsSpent} / ${140 + (d.level - 1) * 20}`}
          />
          {history && (
            <>
              <StatCard label="Total XP" value={String(history.totalXP)} />
              <StatCard
                label="Events Attended"
                value={String(history.eventsAttended)}
              />
            </>
          )}
        </div>

        {/* Bank */}
        {bank && (
          <section>
            <h2 className="text-lg font-bold text-amber-500 mb-3 border-b border-gray-800 pb-2">
              Bank
            </h2>
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-gray-400 text-sm">Balance: </span>
                  <span
                    className={`text-lg font-bold ${
                      bank.balance < 0 ? "text-red-400" : "text-amber-400"
                    }`}
                  >
                    {bank.balanceFormatted}
                  </span>
                </div>
                <button
                  onClick={() => setShowAuditLog(!showAuditLog)}
                  className="text-xs text-gray-400 hover:text-white px-3 py-1 rounded bg-gray-800 hover:bg-gray-700"
                >
                  {showAuditLog ? "Hide" : "View"} Audit Log
                </button>
              </div>
              {showAuditLog && (
                <div className="border-t border-gray-800 pt-3">
                  {bank.transactions.length === 0 ? (
                    <p className="text-gray-600 text-xs text-center py-2">
                      No transactions yet.
                    </p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-500 border-b border-gray-800">
                          <th className="text-left py-1.5 pr-2">Date</th>
                          <th className="text-left py-1.5 pr-2">Description</th>
                          <th className="text-right py-1.5">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bank.transactions.map((txn) => (
                          <tr
                            key={txn.id}
                            className="border-b border-gray-800/50"
                          >
                            <td className="py-1.5 pr-2 text-gray-500">
                              {new Date(txn.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-1.5 pr-2 text-gray-300">
                              {txn.description}
                            </td>
                            <td
                              className={`py-1.5 text-right font-medium ${
                                txn.amount >= 0
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {txn.amount >= 0 ? "+" : ""}
                              {formatSilver(txn.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Skills */}
        <section>
          <h2 className="text-lg font-bold text-amber-500 mb-3 border-b border-gray-800 pb-2">
            Skills
          </h2>
          {d.skills.length === 0 ? (
            <p className="text-gray-500 text-sm">No skills purchased.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-700">
                    <th className="text-left py-2 px-3">Skill</th>
                    <th className="text-center py-2 px-3">Purchases</th>
                    <th className="text-right py-2 px-3">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {d.skills.map((s) => (
                    <tr key={s.skillName} className="border-b border-gray-800">
                      <td className="py-1.5 px-3 text-white">{s.skillName}</td>
                      <td className="py-1.5 px-3 text-center text-gray-400">
                        {s.purchaseCount}
                      </td>
                      <td className="py-1.5 px-3 text-right text-gray-400">
                        {s.totalCost}p
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Equipment */}
        <section>
          <h2 className="text-lg font-bold text-amber-500 mb-3 border-b border-gray-800 pb-2">
            Equipment
          </h2>
          {d.equipment.length === 0 ? (
            <p className="text-gray-500 text-sm">No equipment purchased.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-700">
                    <th className="text-left py-2 px-3">Item</th>
                    <th className="text-center py-2 px-3">Qty</th>
                    <th className="text-right py-2 px-3">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {d.equipment.map((e) => (
                    <tr key={e.itemName} className="border-b border-gray-800">
                      <td className="py-1.5 px-3 text-white">{e.itemName}</td>
                      <td className="py-1.5 px-3 text-center text-gray-400">
                        {e.quantity}
                      </td>
                      <td className="py-1.5 px-3 text-right text-gray-400">
                        {e.totalCost} Ag
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Event History */}
        {history && history.eventsAttended > 0 && (
          <section>
            <h2 className="text-lg font-bold text-amber-500 mb-3 border-b border-gray-800 pb-2">
              Event History
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-700">
                    <th className="text-left py-2 px-3">Event</th>
                    <th className="text-left py-2 px-3">Date</th>
                    <th className="text-center py-2 px-3">XP</th>
                    <th className="text-center py-2 px-3">NPC Min</th>
                  </tr>
                </thead>
                <tbody>
                  {history.eventHistory.map((evt) => (
                    <tr key={evt.eventId} className="border-b border-gray-800">
                      <td className="py-1.5 px-3 text-white">
                        {evt.eventTitle}
                      </td>
                      <td className="py-1.5 px-3 text-gray-400">
                        {new Date(evt.startDate).toLocaleDateString()}
                      </td>
                      <td className="py-1.5 px-3 text-center text-amber-400">
                        {evt.xpEarned}
                      </td>
                      <td className="py-1.5 px-3 text-center text-gray-400">
                        {evt.npcMinutes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Character History/Backstory */}
        {d.history && (
          <section>
            <h2 className="text-lg font-bold text-amber-500 mb-3 border-b border-gray-800 pb-2">
              Character History
            </h2>
            <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
              {d.history}
            </p>
          </section>
        )}

        {/* Mystic Quill Mentions */}
        {loreMentions.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-amber-500 mb-3 border-b border-gray-800 pb-2">
              Mystic Quill Mentions
            </h2>
            <div className="space-y-3">
              {loreMentions.map((entry) => (
                <Link
                  key={entry.id}
                  href={entry.sourceUrl ?? `/compendium?q=${encodeURIComponent(entry.title)}`}
                  target={entry.sourceUrl ? "_blank" : undefined}
                  className="block p-3 bg-gray-900 rounded-lg border border-gray-800 hover:border-amber-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-medium text-sm">
                      {entry.title}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {entry.source}
                      {entry.year && ` (${entry.year})`}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    {entry.summary}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Metadata */}
        <div className="text-gray-600 text-xs border-t border-gray-800 pt-4 flex gap-4">
          <span>Created {new Date(character.createdAt).toLocaleDateString()}</span>
          <span>
            Updated {new Date(character.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-gray-900 rounded-lg border border-gray-800 text-center">
      <div className="text-white font-bold text-lg">{value}</div>
      <div className="text-gray-500 text-xs uppercase">{label}</div>
    </div>
  );
}
