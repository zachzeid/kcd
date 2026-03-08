"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface LoreEntry {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string | null;
  date: string | null;
  year: number | null;
  characters: string[];
  locations: string[];
  tags: string[];
  category: string;
}

interface LoreCharacter {
  id: string;
  name: string;
  title: string | null;
  race: string | null;
  class: string | null;
  faction: string | null;
  description: string | null;
  firstMentioned: string | null;
  assignedToId: string | null;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  story: { label: "Story", color: "bg-purple-900 text-purple-300" },
  recap: { label: "Event Recap", color: "bg-blue-900 text-blue-300" },
  announcement: { label: "Announcement", color: "bg-green-900 text-green-300" },
  obituary: { label: "Obituary", color: "bg-gray-700 text-gray-300" },
  rumor: { label: "Rumor", color: "bg-yellow-900 text-yellow-300" },
};

export default function CompendiumPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<"history" | "characters">("history");
  const [entries, setEntries] = useState<LoreEntry[]>([]);
  const [characters, setCharacters] = useState<LoreCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [entryContent, setEntryContent] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (yearFilter) params.set("year", yearFilter);
    if (categoryFilter) params.set("category", categoryFilter);
    params.set("page", String(page));

    const res = await fetch(`/api/lore?${params}`);
    if (res.ok) {
      const data = await res.json();
      setEntries(data.entries);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    }
    setLoading(false);
  }, [search, yearFilter, categoryFilter, page]);

  const loadCharacters = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    const res = await fetch(`/api/lore/characters?${params}`);
    if (res.ok) {
      setCharacters(await res.json());
    }
    setLoading(false);
  }, [search]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (tab === "history") loadEntries();
    else loadCharacters();
  }, [status, tab, loadEntries, loadCharacters]);

  const viewEntry = async (id: string) => {
    setSelectedEntry(id);
    setEntryContent(null);
    const res = await fetch(`/api/lore/${id}`);
    if (res.ok) {
      const data = await res.json();
      setEntryContent(data.content);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    if (tab === "history") loadEntries();
    else loadCharacters();
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-amber-500">World History Compendium</h1>
            <p className="text-gray-500 text-xs">The Mystic Quill Archives — Since 1994</p>
          </div>
          <Link href="/" className="text-gray-400 hover:text-white text-sm">
            Back to Characters
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => { setTab("history"); setSearch(""); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              tab === "history" ? "bg-amber-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            World History
          </button>
          <button
            onClick={() => { setTab("characters"); setSearch(""); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              tab === "characters" ? "bg-amber-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            Characters
          </button>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === "history" ? "Search stories, locations, characters..." : "Search character names..."}
            className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:border-amber-500 outline-none"
          />
          {tab === "history" && (
            <>
              <select
                value={yearFilter}
                onChange={(e) => { setYearFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm"
              >
                <option value="">All Years</option>
                {Array.from({ length: 27 }, (_, i) => 2020 - i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm"
              >
                <option value="">All Types</option>
                {Object.entries(CATEGORY_LABELS).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </>
          )}
          <button
            type="submit"
            className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-500"
          >
            Search
          </button>
        </form>

        {loading ? (
          <div className="text-gray-500 text-center py-12">Loading...</div>
        ) : tab === "history" ? (
          <>
            {/* Entry detail modal */}
            {selectedEntry && (
              <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                <div className="bg-gray-900 rounded-lg border border-gray-700 max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold text-white">
                      {entries.find((e) => e.id === selectedEntry)?.title}
                    </h2>
                    <button
                      onClick={() => setSelectedEntry(null)}
                      className="text-gray-400 hover:text-white text-lg px-2"
                    >
                      X
                    </button>
                  </div>
                  <div className="text-gray-500 text-xs mb-4">
                    {entries.find((e) => e.id === selectedEntry)?.source}
                  </div>
                  {entryContent ? (
                    <div className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                      {entryContent}
                    </div>
                  ) : (
                    <div className="text-gray-500">Loading content...</div>
                  )}
                </div>
              </div>
            )}

            <div className="text-gray-500 text-xs mb-3">{total} entries found</div>

            {entries.length === 0 ? (
              <div className="text-center py-12 bg-gray-900/30 rounded-lg border border-gray-800">
                <p className="text-gray-500">No lore entries found. The compendium is being populated from the Mystic Quill archives.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map((entry) => {
                  const catInfo = CATEGORY_LABELS[entry.category] ?? CATEGORY_LABELS.story;
                  return (
                    <div
                      key={entry.id}
                      className="p-4 bg-gray-900 rounded-lg border border-gray-800 hover:border-gray-700 cursor-pointer transition-colors"
                      onClick={() => viewEntry(entry.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-medium">{entry.title}</span>
                            <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${catInfo.color}`}>
                              {catInfo.label}
                            </span>
                            {entry.year && (
                              <span className="text-gray-600 text-xs">{entry.year}</span>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm">{entry.summary}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {entry.characters.map((c) => (
                              <span
                                key={c}
                                onClick={(e) => { e.stopPropagation(); setSearch(c); setPage(1); }}
                                className="px-1.5 py-0.5 rounded text-xs bg-purple-900/50 text-purple-300 cursor-pointer hover:bg-purple-800"
                              >
                                {c}
                              </span>
                            ))}
                            {entry.locations.map((l) => (
                              <span
                                key={l}
                                onClick={(e) => { e.stopPropagation(); setSearch(l); setPage(1); }}
                                className="px-1.5 py-0.5 rounded text-xs bg-green-900/50 text-green-300 cursor-pointer hover:bg-green-800"
                              >
                                {l}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-gray-600 text-xs shrink-0 ml-4">
                          {entry.source}
                          {entry.sourceUrl && (
                            <a
                              href={entry.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="block text-amber-500 hover:underline mt-1"
                            >
                              View PDF
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded bg-gray-800 text-gray-400 text-sm disabled:opacity-30"
                >
                  Prev
                </button>
                <span className="px-3 py-1 text-gray-500 text-sm">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded bg-gray-800 text-gray-400 text-sm disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          /* Characters tab */
          <div>
            {characters.length === 0 ? (
              <div className="text-center py-12 bg-gray-900/30 rounded-lg border border-gray-800">
                <p className="text-gray-500">No characters found in the archives yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {characters.map((char) => (
                  <div
                    key={char.id}
                    className="p-4 bg-gray-900 rounded-lg border border-gray-800"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {char.title && (
                        <span className="text-amber-500 text-sm">{char.title}</span>
                      )}
                      <span className="text-white font-medium">{char.name}</span>
                    </div>
                    <div className="flex gap-2 text-xs text-gray-500 mb-2">
                      {char.race && <span>{char.race}</span>}
                      {char.class && <span>{char.class}</span>}
                      {char.faction && (
                        <span className="text-amber-400/70">{char.faction}</span>
                      )}
                    </div>
                    {char.description && (
                      <p className="text-gray-400 text-sm">{char.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      {char.firstMentioned && (
                        <span className="text-gray-600 text-xs">First: {char.firstMentioned}</span>
                      )}
                      {char.assignedToId ? (
                        <span className="px-1.5 py-0.5 rounded text-xs bg-green-900 text-green-300">
                          Assigned
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-xs bg-gray-700 text-gray-400">
                          Unassigned
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
