"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CHARACTER_STATUSES, INACTIVE_LABEL, type CharacterStatus } from "@/lib/character-status";

interface CharRow {
  id: string;
  name: string;
  status: CharacterStatus;
  inactive: boolean;
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
  skillsLearned: string | null;
  skillsTaught: string | null;
  eventRating: number | null;
  roleplayQuality: string | null;
  enjoyedEncounters: string | null;
  dislikedEncounters: string | null;
  notableRoleplay: string | null;
  npcDetails: string | null;
  staffDetails: string | null;
  betweenEventDetails: string | null;
  processNotes: string | null;
  xpAwarded: number;
  createdAt: string;
}

type SubTab = "signouts" | "review" | "characters";

const ACTION_LABELS: Record<string, string> = {
  adventuring: "Adventuring",
  researching: "Researching",
  crafting: "Crafting",
  traveling: "Traveling",
  governing: "Governing",
  nothing: "Nothing",
};

const RP_LABELS: Record<string, string> = {
  outstanding: "Outstanding",
  excellent: "Excellent",
  above_average: "Above Average",
  average: "Average",
  below_average: "Below Average",
  poor: "Poor",
  abysmal: "Abysmal",
};

export default function CBDDepartment({ userRole }: { userRole: string }) {
  const [subTab, setSubTab] = useState<SubTab>("signouts");
  const [characters, setCharacters] = useState<CharRow[]>([]);
  const [signOuts, setSignOuts] = useState<SignOutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("pending");

  // Tab counts (fetched independently so they're always visible)
  const [counts, setCounts] = useState<{ signouts: number; review: number; characters: number }>({
    signouts: 0, review: 0, characters: 0,
  });

  // Process modal
  const [processModal, setProcessModal] = useState<SignOutRow | null>(null);
  const [processNotes, setProcessNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  // Fetch counts for all tabs
  useEffect(() => {
    Promise.all([
      fetch("/api/admin/cbd/signouts?status=pending").then((r) => r.ok ? r.json() : []),
      fetch("/api/admin/characters?status=pending_review").then((r) => r.ok ? r.json() : []),
      fetch("/api/admin/characters").then((r) => r.ok ? r.json() : []),
    ]).then(([so, rev, all]) => {
      setCounts({
        signouts: Array.isArray(so) ? so.length : 0,
        review: Array.isArray(rev) ? rev.length : 0,
        characters: Array.isArray(all) ? all.length : 0,
      });
    }).catch(() => {});
  }, [refreshKey]);

  useEffect(() => {
    setLoading(true);
    if (subTab === "signouts") {
      fetch(`/api/admin/cbd/signouts?status=${statusFilter}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => setSignOuts(Array.isArray(data) ? data : []))
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
  }, [subTab, refreshKey, statusFilter]);

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

  const reactivateCharacter = async (charId: string) => {
    setActionLoading(charId);
    try {
      const res = await fetch(`/api/admin/characters/${charId}/reactivate`, { method: "POST" });
      if (res.ok) {
        setCharacters((prev) =>
          prev.map((c) => (c.id === charId ? { ...c, inactive: false } : c))
        );
      }
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  const handleProcess = async (action: "process" | "reject") => {
    if (!processModal) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/cbd/signouts/${processModal.id}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes: processNotes.trim() || null }),
      });
      if (res.ok) {
        const result = await res.json();
        if (action === "process") {
          alert(`Sign-out processed. ${result.xpAwarded} XP awarded.`);
        } else {
          alert("Sign-out rejected.");
        }
        setProcessModal(null);
        setProcessNotes("");
        setRefreshKey((k) => k + 1);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to process sign-out");
      }
    } finally {
      setProcessing(false);
    }
  };

  // Compute XP preview for the modal
  const getXpPreview = (so: SignOutRow) => {
    const eventStart = new Date(so.event.date);
    const eventEnd = so.event.endDate ? new Date(so.event.endDate) : eventStart;
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysDiff = Math.ceil((eventEnd.getTime() - eventStart.getTime()) / msPerDay);
    const eventDays = daysDiff >= 1 ? 2 : 1;
    const baseXP = eventDays * 6;
    const npcXP = Math.floor(so.npcMinutes / 30);
    const totalXP = Math.min(baseXP + npcXP, eventDays * 10);
    return { eventDays, baseXP, npcXP, totalXP, cap: eventDays * 10 };
  };

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
          Sign-Out Queue ({counts.signouts})
        </button>
        <button
          onClick={() => setSubTab("review")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
            subTab === "review"
              ? "bg-amber-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          Character Review ({counts.review})
        </button>
        <button
          onClick={() => setSubTab("characters")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
            subTab === "characters"
              ? "bg-amber-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          All Characters ({counts.characters})
        </button>
      </div>

      {loading ? (
        <div className="text-gray-500 text-center py-8">Loading...</div>
      ) : subTab === "signouts" ? (
        <div className="space-y-3">
          {/* Status filter */}
          <div className="flex gap-2">
            {["pending", "processed", "rejected"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2 py-1 rounded text-xs ${
                  statusFilter === s
                    ? "bg-gray-600 text-white"
                    : "bg-gray-800 text-gray-500 hover:bg-gray-700"
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {signOuts.length === 0 ? (
            <div className="text-center py-12 bg-gray-900/30 rounded-lg border border-gray-800">
              <p className="text-gray-500">No {statusFilter} sign-outs.</p>
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
                    <th className="text-center py-2 px-3">NPC</th>
                    <th className="text-center py-2 px-3">Status</th>
                    {statusFilter === "processed" && (
                      <th className="text-center py-2 px-3">XP</th>
                    )}
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
                      <td className="py-2 px-3 text-center text-gray-400">
                        {so.npcMinutes > 0 ? `${so.npcMinutes}m` : "—"}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            so.status === "processed"
                              ? "bg-green-900 text-green-300"
                              : so.status === "rejected"
                                ? "bg-red-900 text-red-300"
                                : "bg-yellow-900 text-yellow-300"
                          }`}
                        >
                          {so.status}
                        </span>
                      </td>
                      {statusFilter === "processed" && (
                        <td className="py-2 px-3 text-center text-amber-400">
                          {so.xpAwarded}
                        </td>
                      )}
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => {
                            setProcessModal(so);
                            setProcessNotes("");
                          }}
                          className={`px-3 py-1 rounded text-xs ${
                            so.status === "pending"
                              ? "bg-amber-800 text-amber-300 hover:bg-amber-700"
                              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          }`}
                        >
                          {so.status === "pending" ? "Process" : "Details"}
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
              <div key={char.id} className="p-4 bg-gray-900 rounded-lg border border-yellow-800/50">
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
                    {char.inactive && (
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${INACTIVE_LABEL.color}`}>
                        {INACTIVE_LABEL.label}
                      </span>
                    )}
                  </div>
                  <div className="text-gray-500 text-sm">
                    Owner: {char.userName} ({char.userEmail})
                  </div>
                  <div className="text-gray-600 text-xs mt-1">
                    Updated {new Date(char.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  {char.inactive && (
                    <button
                      onClick={() => reactivateCharacter(char.id)}
                      disabled={actionLoading === char.id}
                      className="text-xs px-2 py-1 rounded bg-orange-800 text-orange-200 hover:bg-orange-700 disabled:opacity-50"
                    >
                      Reactivate
                    </button>
                  )}
                  <Link href={`/characters/${char.id}`} className="text-xs text-amber-400 hover:underline">
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

      {/* Sign-Out Process/Detail Modal */}
      {processModal && (
        <SignOutModal
          signOut={processModal}
          xpPreview={getXpPreview(processModal)}
          notes={processNotes}
          onNotesChange={setProcessNotes}
          processing={processing}
          onProcess={handleProcess}
          onClose={() => {
            setProcessModal(null);
            setProcessNotes("");
          }}
        />
      )}
    </div>
  );
}

function SignOutModal({
  signOut,
  xpPreview,
  notes,
  onNotesChange,
  processing,
  onProcess,
  onClose,
}: {
  signOut: SignOutRow;
  xpPreview: { eventDays: number; baseXP: number; npcXP: number; totalXP: number; cap: number };
  notes: string;
  onNotesChange: (v: string) => void;
  processing: boolean;
  onProcess: (action: "process" | "reject") => void;
  onClose: () => void;
}) {
  const isPending = signOut.status === "pending";
  const skillsLearned = signOut.skillsLearned ? JSON.parse(signOut.skillsLearned) : [];
  const skillsTaught = signOut.skillsTaught ? JSON.parse(signOut.skillsTaught) : [];
  const beaDetails = signOut.betweenEventDetails ? JSON.parse(signOut.betweenEventDetails) : null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">
              Sign-Out: {signOut.character.name}
            </h3>
            <p className="text-gray-400 text-sm">
              Player: {signOut.user.name} &middot; Event: {signOut.event.name}
            </p>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-xs font-bold ${
              signOut.status === "processed"
                ? "bg-green-900 text-green-300"
                : signOut.status === "rejected"
                  ? "bg-red-900 text-red-300"
                  : "bg-yellow-900 text-yellow-300"
            }`}
          >
            {signOut.status}
          </span>
        </div>

        <div className="space-y-4">
          {/* XP Preview */}
          {isPending && (
            <div className="p-3 rounded-lg bg-amber-900/20 border border-amber-800/50">
              <div className="text-amber-400 text-xs font-bold mb-2">XP Calculation Preview</div>
              <div className="grid grid-cols-4 gap-2 text-center text-sm">
                <div>
                  <div className="text-white font-bold">{xpPreview.eventDays}</div>
                  <div className="text-gray-500 text-xs">Event Days</div>
                </div>
                <div>
                  <div className="text-white font-bold">{xpPreview.baseXP}</div>
                  <div className="text-gray-500 text-xs">Base XP</div>
                </div>
                <div>
                  <div className="text-white font-bold">+{xpPreview.npcXP}</div>
                  <div className="text-gray-500 text-xs">NPC Bonus</div>
                </div>
                <div>
                  <div className="text-amber-400 font-bold text-lg">{xpPreview.totalXP}</div>
                  <div className="text-gray-500 text-xs">Total XP</div>
                </div>
              </div>
              {xpPreview.baseXP + xpPreview.npcXP > xpPreview.cap && (
                <div className="text-yellow-400 text-xs mt-2">
                  Capped at {xpPreview.cap} XP ({xpPreview.eventDays} days × 10 max/day)
                </div>
              )}
            </div>
          )}

          {/* Already processed info */}
          {signOut.status === "processed" && (
            <div className="p-3 rounded-lg bg-green-900/20 border border-green-800/50">
              <div className="text-green-400 text-xs font-bold mb-1">Processed</div>
              <div className="text-white text-sm">{signOut.xpAwarded} XP awarded</div>
              {signOut.processNotes && (
                <div className="text-gray-400 text-xs mt-1">Notes: {signOut.processNotes}</div>
              )}
            </div>
          )}

          {signOut.status === "rejected" && signOut.processNotes && (
            <div className="p-3 rounded-lg bg-red-900/20 border border-red-800/50">
              <div className="text-red-400 text-xs font-bold mb-1">Rejected</div>
              <div className="text-gray-400 text-xs">Notes: {signOut.processNotes}</div>
            </div>
          )}

          {/* NPC & Staff Service */}
          <Section title="Service">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500 text-xs">NPC Minutes</div>
                <div className="text-white">{signOut.npcMinutes || 0}</div>
                {signOut.npcDetails && (
                  <div className="text-gray-400 text-xs mt-1">{signOut.npcDetails}</div>
                )}
              </div>
              <div>
                <div className="text-gray-500 text-xs">Staff Minutes</div>
                <div className="text-white">{signOut.staffMinutes || 0}</div>
                {signOut.staffDetails && (
                  <div className="text-gray-400 text-xs mt-1">{signOut.staffDetails}</div>
                )}
              </div>
            </div>
            {signOut.lifeCreditsLost > 0 && (
              <div className="mt-2 text-sm">
                <span className="text-red-400 font-medium">
                  {signOut.lifeCreditsLost} life credit{signOut.lifeCreditsLost > 1 ? "s" : ""} lost
                </span>
              </div>
            )}
          </Section>

          {/* Skills */}
          {(skillsLearned.length > 0 || skillsTaught.length > 0) && (
            <Section title="Skills">
              {skillsLearned.length > 0 && (
                <div className="mb-2">
                  <div className="text-gray-500 text-xs mb-1">Learned</div>
                  {skillsLearned.map((s: { skillName: string; count: number; teacherName: string }, i: number) => (
                    <div key={i} className="text-sm text-gray-300">
                      {s.skillName} ×{s.count} — taught by {s.teacherName}
                    </div>
                  ))}
                </div>
              )}
              {skillsTaught.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs mb-1">Taught</div>
                  {skillsTaught.map((s: { skillName: string; studentNames: string }, i: number) => (
                    <div key={i} className="text-sm text-gray-300">
                      {s.skillName} — to {s.studentNames}
                    </div>
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* Event Feedback */}
          {(signOut.eventRating || signOut.roleplayQuality || signOut.enjoyedEncounters || signOut.dislikedEncounters || signOut.notableRoleplay) && (
            <Section title="Event Feedback">
              <div className="space-y-2 text-sm">
                {signOut.eventRating && (
                  <div>
                    <span className="text-gray-500 text-xs">Rating: </span>
                    <span className="text-amber-400 font-bold">{signOut.eventRating}/10</span>
                  </div>
                )}
                {signOut.roleplayQuality && (
                  <div>
                    <span className="text-gray-500 text-xs">Roleplay Quality: </span>
                    <span className="text-gray-300">{RP_LABELS[signOut.roleplayQuality] ?? signOut.roleplayQuality}</span>
                  </div>
                )}
                {signOut.enjoyedEncounters && (
                  <div>
                    <div className="text-gray-500 text-xs">Enjoyed</div>
                    <div className="text-gray-300">{signOut.enjoyedEncounters}</div>
                  </div>
                )}
                {signOut.dislikedEncounters && (
                  <div>
                    <div className="text-gray-500 text-xs">Could Improve</div>
                    <div className="text-gray-300">{signOut.dislikedEncounters}</div>
                  </div>
                )}
                {signOut.notableRoleplay && (
                  <div>
                    <div className="text-gray-500 text-xs">Notable Roleplay</div>
                    <div className="text-gray-300">{signOut.notableRoleplay}</div>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Between-Event Action */}
          {signOut.betweenEventAction && signOut.betweenEventAction !== "nothing" && (
            <Section title={`Between-Event: ${ACTION_LABELS[signOut.betweenEventAction] ?? signOut.betweenEventAction}`}>
              {beaDetails && (
                <div className="text-sm text-gray-300 space-y-1">
                  {Object.entries(beaDetails).map(([key, val]) => {
                    if (key.startsWith("gm") || !val) return null;
                    return (
                      <div key={key}>
                        <span className="text-gray-500 text-xs">{key}: </span>
                        <span>{String(val)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Section>
          )}

          {/* Process/Reject actions */}
          {isPending && (
            <div className="border-t border-gray-700 pt-4">
              <div className="mb-3">
                <label className="block text-xs text-gray-400 mb-1">
                  Processing Notes (required for rejection)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => onNotesChange(e.target.value)}
                  rows={2}
                  placeholder="Optional notes..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:border-amber-500 outline-none"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onProcess("reject")}
                  disabled={processing || !notes.trim()}
                  className="px-4 py-2 rounded bg-red-700 text-white hover:bg-red-600 disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  onClick={() => onProcess("process")}
                  disabled={processing}
                  className="px-4 py-2 rounded bg-green-700 text-white hover:bg-green-600 disabled:opacity-50"
                >
                  {processing ? "Processing..." : `Process (${xpPreview.totalXP} XP)`}
                </button>
              </div>
            </div>
          )}

          {/* Close for non-pending */}
          {!isPending && (
            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-2 border-b border-gray-800 pb-1">
        {title}
      </div>
      {children}
    </div>
  );
}
