"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CHARACTER_STATUSES, INACTIVE_LABEL, type CharacterStatus } from "@/lib/character-status";
import { ITEM_TYPES } from "@/lib/economy";
import { races } from "@/data/races";
import { classes } from "@/data/classes";

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
  totalXP?: number;
  skills: { skillName: string; specialization?: string; purchaseCount: number; totalCost: number; acquiredAt?: string; reason?: string }[];
  equipment: { itemName: string; quantity: number; totalCost: number; acquiredAt?: string; reason?: string }[];
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
  inactive: boolean;
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

interface TagItem {
  id: string;
  itemType: string;
  itemName: string;
  itemDescription: string | null;
  craftingSkill: string;
  craftingLevel: number;
  quantity: number;
  primaryMaterial: string | null;
  secondaryMaterial: string | null;
  masterCrafted: boolean;
  status: string;
  tagCode: number | null;
  printedAt: string | null;
  createdAt: string;
}

function CollapsibleSection({
  title,
  defaultOpen = true,
  count,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  count?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-lg font-bold text-amber-500 mb-3 border-b border-gray-800 pb-2 hover:text-amber-400 transition-colors"
      >
        <span>
          {title}
          {count !== undefined && (
            <span className="text-gray-600 text-sm font-normal ml-2">({count})</span>
          )}
        </span>
        <span className={`text-gray-500 text-sm transition-transform ${open ? "rotate-180" : ""}`}>
          &#9660;
        </span>
      </button>
      {open && children}
    </section>
  );
}

export default function CharacterSummaryPage() {
  const params = useParams();
  const router = useRouter();
  const [character, setCharacter] = useState<CharacterResponse | null>(null);
  const [history, setHistory] = useState<CharacterHistory | null>(null);
  const [bank, setBank] = useState<BankData | null>(null);
  const [loreMentions, setLoreMentions] = useState<LoreMention[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
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
      fetch(`/api/characters/${params.id}/items`).then((r) =>
        r.ok ? r.json() : { items: [] }
      ),
    ])
      .then(([charData, historyData, bankData, itemsData]) => {
        setCharacter(charData);
        setHistory(historyData);
        setBank(bankData?.bank ?? null);
        setTags(itemsData?.items ?? []);
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

  // Calculate body points from race + class + level
  const raceInfo = races.find((r) => r.name === d.race);
  const classInfo = classes.find((c) => c.name === d.characterClass);
  const bodyPoints = (raceInfo?.bodyPointsByLevel[d.level - 1] ?? 0) + (classInfo?.bodyPointsByLevel[d.level - 1] ?? 0);
  // Physical Development adds 4 BP per purchase
  const physDevPurchases = d.skills.find((s) => s.skillName === "Physical Development")?.purchaseCount ?? 0;
  const totalBodyPoints = bodyPoints + physDevPurchases * 4;

  // Group tags by itemType
  const tagsByType: Record<string, TagItem[]> = {};
  for (const tag of tags) {
    if (!tagsByType[tag.itemType]) tagsByType[tag.itemType] = [];
    tagsByType[tag.itemType].push(tag);
  }
  const tagTypeKeys = Object.keys(tagsByType).sort();

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
            {character.inactive && (
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${INACTIVE_LABEL.color}`}>
                {INACTIVE_LABEL.label}
              </span>
            )}
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

        {/* Inactive notice */}
        {character.inactive && (
          <div className="p-3 rounded-lg border border-orange-800/50 bg-orange-900/10">
            <p className="text-orange-300 text-sm">
              This character has been inactive for over 12 months. Contact CBD staff to reactivate.
            </p>
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
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <StatCard label="Level" value={String(d.level)} />
          <StatCard label="Race" value={d.race} />
          <StatCard label="Class" value={d.characterClass} />
          <StatCard label="Body Points" value={String(totalBodyPoints)} />
          <StatCard label="Language" value={d.freeLanguage} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Skill Points"
            value={`${d.skillPointsSpent} / ${140 + (history?.totalXP ?? d.totalXP ?? 0)}`}
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
          <CollapsibleSection title="Bank">
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
                  {showAuditLog ? "Hide" : "View"} Transactions
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
          </CollapsibleSection>
        )}

        {/* Tags (Item Submissions) */}
        {tags.length > 0 && (
          <CollapsibleSection title="Tags" count={tags.length}>
            <TagsSection
              tagsByType={tagsByType}
              tagTypeKeys={tagTypeKeys}
              onTagPrinted={(tagCode) =>
                setTags((prev) =>
                  prev.map((t) =>
                    t.tagCode === tagCode
                      ? { ...t, printedAt: new Date().toISOString() }
                      : t
                  )
                )
              }
            />
          </CollapsibleSection>
        )}

        {/* Skills */}
        <CollapsibleSection title="Skills" count={d.skills.length}>
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
                    <th className="text-left py-2 px-3">Acquired</th>
                    <th className="text-left py-2 px-3">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {d.skills.map((s) => (
                    <tr key={s.skillName + (s.specialization || "")} className="border-b border-gray-800">
                      <td className="py-1.5 px-3 text-white">
                        {s.skillName}{s.specialization ? ` (${s.specialization})` : ""}
                      </td>
                      <td className="py-1.5 px-3 text-center text-gray-400">
                        {s.purchaseCount}
                      </td>
                      <td className="py-1.5 px-3 text-right text-gray-400">
                        {s.totalCost}p
                      </td>
                      <td className="py-1.5 px-3 text-gray-500 text-xs">
                        {s.acquiredAt ? new Date(s.acquiredAt).toLocaleDateString() : "\u2014"}
                      </td>
                      <td className="py-1.5 px-3 text-gray-500 text-xs">
                        {s.reason || "\u2014"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CollapsibleSection>

        {/* Equipment */}
        <CollapsibleSection title="Equipment" count={d.equipment.length}>
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
                    <th className="text-left py-2 px-3">Acquired</th>
                    <th className="text-left py-2 px-3">Reason</th>
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
                      <td className="py-1.5 px-3 text-gray-500 text-xs">
                        {e.acquiredAt ? new Date(e.acquiredAt).toLocaleDateString() : "\u2014"}
                      </td>
                      <td className="py-1.5 px-3 text-gray-500 text-xs">
                        {e.reason || "\u2014"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CollapsibleSection>

        {/* Event History */}
        {history && history.eventsAttended > 0 && (
          <CollapsibleSection title="Event History" count={history.eventsAttended}>
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
          </CollapsibleSection>
        )}

        {/* Character History/Backstory */}
        {d.history && (
          <CollapsibleSection title="Character History">
            <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
              {d.history}
            </p>
          </CollapsibleSection>
        )}

        {/* Mystic Quill Mentions */}
        {loreMentions.length > 0 && (
          <CollapsibleSection title="Mystic Quill Mentions" count={loreMentions.length}>
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
          </CollapsibleSection>
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

function TagsSection({
  tagsByType,
  tagTypeKeys,
  onTagPrinted,
}: {
  tagsByType: Record<string, TagItem[]>;
  tagTypeKeys: string[];
  onTagPrinted: (tagCode: number) => void;
}) {
  const [activeTab, setActiveTab] = useState(tagTypeKeys[0] ?? "");
  const [printing, setPrinting] = useState<number | null>(null);

  const typeLabel = (type: string) =>
    (ITEM_TYPES as Record<string, string>)[type] ?? type;

  const activeTags = tagsByType[activeTab] ?? [];

  const handlePrint = async (tag: TagItem) => {
    if (!tag.tagCode || tag.printedAt) return;
    setPrinting(tag.tagCode);
    try {
      const r = await fetch(`/api/tags/${tag.tagCode}/print`, { method: "POST" });
      if (!r.ok) {
        const data = await r.json();
        alert(data.error || "Print failed");
        return;
      }
      onTagPrinted(tag.tagCode);
      // Open print-friendly image in new window
      const printWin = window.open(`/api/tags/${tag.tagCode}/image`, "_blank");
      if (printWin) {
        printWin.addEventListener("load", () => {
          printWin.print();
        });
      }
    } finally {
      setPrinting(null);
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800">
      {/* Tab bar */}
      <div className="flex gap-1 p-2 border-b border-gray-800 overflow-x-auto">
        {tagTypeKeys.map((type) => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === type
                ? "bg-amber-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {typeLabel(type)}
            <span className="ml-1 text-[10px] opacity-70">
              ({tagsByType[type].length})
            </span>
          </button>
        ))}
      </div>

      {/* Tag items */}
      <div className="p-3 space-y-3">
        {activeTags.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No tags in this category.</p>
        ) : (
          activeTags.map((tag) => (
            <div
              key={tag.id}
              className="rounded-lg border border-gray-800 bg-gray-950/50 overflow-hidden"
            >
              {/* Tag image + details row */}
              <div className="flex gap-3 p-3">
                {/* Tag image thumbnail */}
                {tag.tagCode ? (
                  <a
                    href={`/t/${tag.tagCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/tags/${tag.tagCode}/image`}
                      alt={`Tag #${tag.tagCode}`}
                      className="w-24 h-24 rounded border border-gray-700 object-cover hover:border-amber-600 transition-colors"
                    />
                  </a>
                ) : (
                  <div className="w-24 h-24 rounded border border-gray-800 bg-gray-900 flex items-center justify-center shrink-0">
                    <span className="text-gray-600 text-xs">No tag</span>
                  </div>
                )}

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white text-sm font-medium">{tag.itemName}</span>
                    {tag.quantity > 1 && (
                      <span className="text-gray-500 text-xs">x{tag.quantity}</span>
                    )}
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        tag.status === "approved"
                          ? "bg-green-900 text-green-300"
                          : tag.status === "denied"
                            ? "bg-red-900 text-red-300"
                            : "bg-yellow-900 text-yellow-300"
                      }`}
                    >
                      {tag.status}
                    </span>
                    {tag.masterCrafted && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-900 text-purple-300">
                        Master
                      </span>
                    )}
                  </div>
                  <div className="text-gray-500 text-xs mt-1">
                    {tag.craftingSkill} Lv.{tag.craftingLevel}
                    {tag.primaryMaterial && <> &middot; {tag.primaryMaterial}</>}
                    {tag.secondaryMaterial && <> + {tag.secondaryMaterial}</>}
                  </div>
                  {tag.itemDescription && (
                    <div className="text-gray-600 text-xs mt-0.5">{tag.itemDescription}</div>
                  )}
                  {tag.tagCode && (
                    <div className="text-amber-400/70 text-xs font-mono mt-1">
                      Tag #{tag.tagCode}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="shrink-0 flex flex-col gap-1.5 items-end">
                  {tag.tagCode && (
                    <a
                      href={`/t/${tag.tagCode}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded text-xs bg-indigo-800 text-indigo-200 hover:bg-indigo-700 transition-colors"
                    >
                      View
                    </a>
                  )}
                  {tag.tagCode && !tag.printedAt ? (
                    <button
                      onClick={() => handlePrint(tag)}
                      disabled={printing === tag.tagCode}
                      className="px-3 py-1.5 rounded text-xs bg-amber-700 text-amber-100 hover:bg-amber-600 disabled:opacity-50 transition-colors"
                    >
                      {printing === tag.tagCode ? "..." : "Print"}
                    </button>
                  ) : tag.printedAt ? (
                    <span className="px-3 py-1.5 rounded text-xs bg-gray-800 text-gray-500 cursor-not-allowed">
                      Printed
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
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
