"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CHARACTER_STATUSES, type CharacterStatus } from "@/lib/character-status";

interface CharRow {
  id: string;
  name: string;
  status: CharacterStatus;
  reviewNotes: string | null;
  submittedAt: string | null;
  userName: string;
  userEmail: string;
  createdAt: string;
  updatedAt: string;
}

interface SignOutRow {
  id: string;
  character: { id: string; name: string };
  user: { id: string; name: string; email: string };
  event: { id: string; name: string; date: string; endDate: string | null };
  status: string;
  npcMinutes: number;
  staffMinutes: number;
  lifeCreditsLost: number;
  betweenEventAction: string;
  createdAt: string;
}

type SubTab = "signouts" | "review" | "characters";

export default function CBDDepartment({ userRole }: { userRole: string }) {
  const [subTab, setSubTab] = useState<SubTab>("signouts");
  const [characters, setCharacters] = useState<CharRow[]>([]);
  const [signOuts, setSignOuts] = useState<SignOutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    if (subTab === "signouts") {
      fetch("/api/admin/cbd/signouts")
        .then((r) => {
          if (r.ok) return r.json();
          return [];
        })
        .then(setSignOuts)
        .catch(() => setSignOuts([]))
        .finally(() => setLoading(false));
    } else if (subTab === "review") {
      fetch("/api/admin/characters?status=pending_review")
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => setCharacters(Array.isArray(data) ? data : []))
        .catch(() => setCharacters([]))
        .finally(() => setLoading(false));
    } else {
      fetch("/api/admin/characters")
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => setCharacters(Array.isArray(data) ? data : []))
        .catch(() => setCharacters([]))
        .finally(() => setLoading(false));
    }
  }, [subTab, refreshKey]);

  const handleReview = async (charId: string, action: "approve" | "reject") => {
    setActionLoading(charId);
    await fetch(`/api/admin/characters/${charId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, notes: reviewNotes[charId] || "" }),
    });
    setReviewNotes((prev) => {
      const n = { ...prev };
      delete n[charId];
      return n;
    });
    setActionLoading(null);
    setRefreshKey((k) => k + 1);
  };

  const deleteCharacter = async (charId: string) => {
    if (!confirm("Delete this character?")) return;
    await fetch(`/api/admin/characters?id=${charId}`, { method: "DELETE" });
    setCharacters((prev) => prev.filter((c) => c.id !== charId));
  };

  const pendingCount = subTab === "review" ? characters.length : 0;

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSubTab("signouts")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
            subTab === "signouts"
              ? "bg-amber-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          Sign-Out Queue
        </button>
        <button
          onClick={() => setSubTab("review")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
            subTab === "review"
              ? "bg-amber-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          Character Review{pendingCount > 0 && subTab === "review" ? ` (${pendingCount})` : ""}
        </button>
        <button
          onClick={() => setSubTab("characters")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
            subTab === "characters"
              ? "bg-amber-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          All Characters
        </button>
      </div>

      {loading ? (
        <div className="text-gray-500 text-center py-8">Loading...</div>
      ) : subTab === "signouts" ? (
        <div className="space-y-3">
          {signOuts.length === 0 ? (
            <div className="text-center py-12 bg-gray-900/30 rounded-lg border border-gray-800">
              <p className="text-gray-500">No pending sign-outs.</p>
              <p className="text-gray-600 text-xs mt-2">
                Sign-outs submitted by players after events will appear here for processing.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-700">
                    <th className="text-left py-2 px-3">Player</th>
                    <th className="text-left py-2 px-3">Character</th>
                    <th className="text-left py-2 px-3">Event</th>
                    <th className="text-left py-2 px-3">Submitted</th>
                    <th className="text-center py-2 px-3">Status</th>
                    <th className="text-right py-2 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {signOuts.map((so) => (
                    <tr key={so.id} className="border-b border-gray-800">
                      <td className="py-2 px-3 text-white">{so.user.name}</td>
                      <td className="py-2 px-3 text-gray-300">
                        <Link href={`/characters/${so.character.id}`} className="hover:text-amber-400">
                          {so.character.name}
                        </Link>
                      </td>
                      <td className="py-2 px-3 text-gray-400">{so.event.name}</td>
                      <td className="py-2 px-3 text-gray-500 text-xs">
                        {new Date(so.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-900 text-yellow-300">
                          {so.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button className="px-3 py-1 rounded text-xs bg-amber-800 text-amber-300 hover:bg-amber-700">
                          Process
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : subTab === "review" ? (
        <div className="space-y-3">
          {characters.length === 0 ? (
            <div className="text-center py-12 bg-gray-900/30 rounded-lg border border-gray-800">
              <p className="text-gray-500">No characters pending review.</p>
            </div>
          ) : (
            characters.map((char) => (
              <div
                key={char.id}
                className="p-4 bg-gray-900 rounded-lg border border-yellow-800/50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-lg">{char.name}</span>
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-900 text-yellow-300">
                        Pending Review
                      </span>
                    </div>
                    <div className="text-gray-400 text-sm mt-1">
                      Player: {char.userName} ({char.userEmail})
                    </div>
                    <div className="text-gray-600 text-xs mt-1">
                      Submitted {char.submittedAt ? new Date(char.submittedAt).toLocaleString() : "N/A"}
                    </div>
                  </div>
                  <button
                    onClick={() => window.open(`/print/${char.id}`, "_blank")}
                    className="px-3 py-1.5 rounded text-xs bg-gray-700 text-gray-300 hover:bg-gray-600"
                  >
                    View Sheet
                  </button>
                </div>

                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Review notes (required for rejection)..."
                    value={reviewNotes[char.id] || ""}
                    onChange={(e) =>
                      setReviewNotes((prev) => ({ ...prev, [char.id]: e.target.value }))
                    }
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:border-amber-500 outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReview(char.id, "approve")}
                      disabled={actionLoading === char.id}
                      className="px-4 py-2 rounded text-sm font-medium bg-green-700 text-white hover:bg-green-600 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReview(char.id, "reject")}
                      disabled={actionLoading === char.id || !(reviewNotes[char.id]?.trim())}
                      className="px-4 py-2 rounded text-sm font-medium bg-red-700 text-white hover:bg-red-600 disabled:opacity-50"
                    >
                      Request Changes
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {characters.length === 0 && (
            <div className="text-gray-500 text-center py-8">No characters yet.</div>
          )}
          {characters.map((char) => {
            const statusInfo = CHARACTER_STATUSES[char.status] ?? CHARACTER_STATUSES.draft;
            return (
              <div
                key={char.id}
                className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-800"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{char.name}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="text-gray-500 text-sm">
                    Owner: {char.userName} ({char.userEmail})
                  </div>
                  <div className="text-gray-600 text-xs mt-1">
                    Updated {new Date(char.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/characters/${char.id}`}
                    className="text-xs text-amber-400 hover:underline"
                  >
                    View
                  </Link>
                  {userRole === "admin" && (
                    <button
                      onClick={() => deleteCharacter(char.id)}
                      className="text-xs text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
