"use client";

import { useEffect, useState } from "react";
import EncountersTab from "./EncountersTab";
import MonsterBookTab from "./MonsterBookTab";
import NPCBookTab from "./NPCBookTab";
import LocationsTab from "./LocationsTab";

interface EventRow {
  id: string;
  name: string;
  date: string;
  endDate: string | null;
  location: string | null;
  description: string | null;
  status: string;
  _count: { registrations: number };
  registrations: {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    ticketType: string;
    paymentStatus: string;
    arfSignedAt: string | null;
    arfYear: number | null;
    checkedInAt: string | null;
    checkedOutAt: string | null;
    xpEarned: number;
    npcMinutes: number;
  }[];
}

interface CharacterOption {
  id: string;
  name: string;
  status: string;
}

interface BEARow {
  id: string;
  characterId: string;
  characterName: string;
  userId: string;
  playerName: string;
  eventId: string;
  eventName: string;
  betweenEventAction: string;
  betweenEventDetails: Record<string, unknown> | null;
  createdAt: string;
}

type SubTab = "events" | "bea" | "encounters" | "monsters" | "npcs" | "locations" | "lore";

export default function GMDepartment() {
  const [subTab, setSubTab] = useState<SubTab>("events");
  const [events, setEvents] = useState<EventRow[]>([]);
  const [beas, setBeas] = useState<BEARow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);
  const [checkinModal, setCheckinModal] = useState<{
    eventId: string;
    regId: string;
    userId: string;
  } | null>(null);
  const [availableChars, setAvailableChars] = useState<CharacterOption[]>([]);
  const [selectedCharId, setSelectedCharId] = useState<string>("");
  const [xpModal, setXpModal] = useState<{
    eventId: string;
    regId: string;
    userName: string;
    currentXP: number;
    currentNPC: number;
  } | null>(null);
  const [xpInput, setXpInput] = useState("0");
  const [npcInput, setNpcInput] = useState("0");
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingEvent, setEditingEvent] = useState<EventRow | null>(null);
  const [respondModal, setRespondModal] = useState<BEARow | null>(null);
  const [respondText, setRespondText] = useState("");
  const [responding, setResponding] = useState(false);
  const [createEncounter, setCreateEncounter] = useState(false);
  const [encounterName, setEncounterName] = useState("");

  const refresh = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    if (subTab === "events") {
      fetch("/api/admin/events")
        .then((r) => {
          if (r.ok) return r.json();
          return [];
        })
        .then((data) => setEvents(Array.isArray(data) ? data : []))
        .catch(() => setEvents([]))
        .finally(() => setLoading(false));
    } else if (subTab === "bea") {
      fetch("/api/admin/gm/between-events")
        .then((r) => (r.ok ? r.json() : { betweenEvents: [] }))
        .then((data) => setBeas(data.betweenEvents ?? []))
        .catch(() => setBeas([]))
        .finally(() => setLoading(false));
    }
  }, [subTab, refreshKey]);

  const handlePaymentAction = async (
    eventId: string,
    registrationId: string,
    action: "confirm" | "comp"
  ) => {
    setPaymentLoading(registrationId);
    await fetch(`/api/admin/events/${eventId}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId, action }),
    });
    setPaymentLoading(null);
    refresh();
  };

  const openCheckinModal = async (eventId: string, regId: string, userId: string) => {
    const res = await fetch(`/api/admin/users/${userId}/characters`);
    if (res.ok) {
      const chars = await res.json();
      setAvailableChars(chars.filter((c: CharacterOption) => c.status === "approved"));
      setCheckinModal({ eventId, regId, userId });
      setSelectedCharId("");
    }
  };

  const handleCheckin = async () => {
    if (!checkinModal) return;
    setActionLoading(checkinModal.regId);
    const res = await fetch(`/api/admin/events/${checkinModal.eventId}/checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        registrationId: checkinModal.regId,
        action: "checkin",
        characterId: selectedCharId || null,
      }),
    });
    if (res.ok) {
      setCheckinModal(null);
      setActionLoading(null);
      refresh();
    } else {
      const err = await res.json();
      alert(err.error || "Failed to check in");
      setActionLoading(null);
    }
  };

  const handleCheckout = async (eventId: string, regId: string) => {
    setActionLoading(regId);
    const res = await fetch(`/api/admin/events/${eventId}/checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId: regId, action: "checkout" }),
    });
    if (res.ok) {
      refresh();
    } else {
      const err = await res.json();
      alert(err.error || "Failed to check out");
    }
    setActionLoading(null);
  };

  const deleteEvent = async (eventId: string) => {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/events/${eventId}`, { method: "DELETE" });
    if (res.ok) {
      refresh();
    } else {
      const err = await res.json().catch(() => null);
      alert(err?.error ?? "Failed to delete event");
    }
  };

  const openXpModal = (
    eventId: string,
    regId: string,
    userName: string,
    currentXP: number,
    currentNPC: number
  ) => {
    setXpModal({ eventId, regId, userName, currentXP, currentNPC });
    setXpInput(String(currentXP));
    setNpcInput(String(currentNPC));
  };

  const handleAwardXP = async () => {
    if (!xpModal) return;
    setActionLoading(xpModal.regId);
    const res = await fetch(`/api/admin/events/${xpModal.eventId}/xp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        registrationId: xpModal.regId,
        xpEarned: parseInt(xpInput) || 0,
        npcMinutes: parseInt(npcInput) || 0,
      }),
    });
    if (res.ok) {
      setXpModal(null);
      refresh();
    } else {
      const err = await res.json();
      alert(err.error || "Failed to award XP");
    }
    setActionLoading(null);
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSubTab("events")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
            subTab === "events"
              ? "bg-amber-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          Events
        </button>
        <button
          onClick={() => setSubTab("bea")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
            subTab === "bea"
              ? "bg-amber-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          Between-Event Actions
        </button>
        <button
          onClick={() => setSubTab("encounters")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
            subTab === "encounters"
              ? "bg-amber-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          Encounters
        </button>
        <button
          onClick={() => setSubTab("monsters")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
            subTab === "monsters"
              ? "bg-amber-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          Monster Book
        </button>
        <button
          onClick={() => setSubTab("npcs")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
            subTab === "npcs"
              ? "bg-amber-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          NPC Book
        </button>
        <button
          onClick={() => setSubTab("locations")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
            subTab === "locations"
              ? "bg-amber-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          Locations
        </button>
        <button
          onClick={() => setSubTab("lore")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
            subTab === "lore"
              ? "bg-amber-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          Lore
        </button>
      </div>

      {loading ? (
        <div className="text-gray-500 text-center py-8">Loading...</div>
      ) : subTab === "events" ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">Events</h2>
            <button
              onClick={() => setShowCreateEvent(!showCreateEvent)}
              className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-500"
            >
              {showCreateEvent ? "Cancel" : "+ Create Event"}
            </button>
          </div>

          {showCreateEvent && (
            <CreateEventForm
              onCreated={() => {
                setShowCreateEvent(false);
                refresh();
              }}
            />
          )}

          {events.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No events yet.</div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="p-4 bg-gray-900 rounded-lg border border-gray-800">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{event.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          event.status === "active"
                            ? "bg-green-900 text-green-300"
                            : event.status === "completed"
                            ? "bg-gray-700 text-gray-400"
                            : event.status === "cancelled"
                            ? "bg-red-900 text-red-300"
                            : "bg-blue-900 text-blue-300"
                        }`}
                      >
                        {event.status}
                      </span>
                    </div>
                    <div className="text-gray-400 text-sm">
                      {new Date(event.date).toLocaleDateString()}
                      {event.endDate && ` – ${new Date(event.endDate).toLocaleDateString()}`}
                    </div>
                    {event.location && (
                      <div className="text-gray-500 text-xs">{event.location}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-gray-400 text-sm">
                      {event._count.registrations} registered
                    </div>
                    <div className="text-gray-600 text-xs">
                      {event.registrations.filter((r) => r.arfSignedAt).length} ARF signed
                    </div>
                    <div className="text-gray-600 text-xs">
                      {event.registrations.filter((r) => r.paymentStatus === "paid").length} paid
                    </div>
                    <div className="flex gap-2 mt-2 justify-end">
                      <button
                        onClick={() => setEditingEvent(event)}
                        className="px-2 py-1 rounded text-xs bg-gray-700 text-gray-300 hover:bg-gray-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteEvent(event.id)}
                        className="px-2 py-1 rounded text-xs bg-red-900 text-red-300 hover:bg-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                {event.registrations.length > 0 && (
                  <details className="mt-3">
                    <summary className="text-amber-400 text-sm cursor-pointer hover:underline">
                      View registrations ({event.registrations.length})
                    </summary>
                    <div className="mt-2 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-gray-500 border-b border-gray-700">
                            <th className="text-left py-1 px-2">Player</th>
                            <th className="text-left py-1 px-2">Ticket</th>
                            <th className="text-center py-1 px-2">Payment</th>
                            <th className="text-center py-1 px-2">ARF</th>
                            <th className="text-center py-1 px-2">Status</th>
                            <th className="text-right py-1 px-2">XP/NPC</th>
                            <th className="text-right py-1 px-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {event.registrations.map((r) => {
                            const canCheckIn =
                              r.paymentStatus !== "unpaid" && r.arfSignedAt && !r.checkedInAt;
                            const canCheckOut = r.checkedInAt && !r.checkedOutAt;
                            const canAwardXP = r.checkedOutAt;

                            return (
                              <tr key={r.id} className="border-b border-gray-800">
                                <td className="py-1 px-2 text-white">{r.userName}</td>
                                <td className="py-1 px-2 text-gray-400">
                                  {r.ticketType.replace(/_/g, " ")}
                                </td>
                                <td className="py-1 px-2 text-center">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-xs ${
                                      r.paymentStatus === "paid"
                                        ? "bg-green-900 text-green-300"
                                        : r.paymentStatus === "comped"
                                        ? "bg-blue-900 text-blue-300"
                                        : "bg-yellow-900 text-yellow-300"
                                    }`}
                                  >
                                    {r.paymentStatus}
                                  </span>
                                </td>
                                <td className="py-1 px-2 text-center">
                                  {r.arfSignedAt ? (
                                    <span className="text-green-400">&#10003;</span>
                                  ) : (
                                    <span className="text-red-400">&#10007;</span>
                                  )}
                                </td>
                                <td className="py-1 px-2 text-center">
                                  {r.checkedOutAt ? (
                                    <span className="px-1.5 py-0.5 rounded text-xs bg-gray-700 text-gray-300">
                                      Out
                                    </span>
                                  ) : r.checkedInAt ? (
                                    <span className="px-1.5 py-0.5 rounded text-xs bg-blue-900 text-blue-300">
                                      In
                                    </span>
                                  ) : (
                                    <span className="text-gray-600">&mdash;</span>
                                  )}
                                </td>
                                <td className="py-1 px-2 text-right">
                                  <div className="text-amber-400">{r.xpEarned} XP</div>
                                  {r.npcMinutes > 0 && (
                                    <div className="text-purple-400 text-xs">
                                      {r.npcMinutes}m NPC
                                    </div>
                                  )}
                                </td>
                                <td className="py-1 px-2 text-right">
                                  <div className="flex gap-1 justify-end flex-wrap">
                                    {r.paymentStatus === "unpaid" && (
                                      <>
                                        <button
                                          onClick={() =>
                                            handlePaymentAction(event.id, r.id, "confirm")
                                          }
                                          disabled={paymentLoading === r.id}
                                          className="px-2 py-0.5 rounded text-xs bg-green-800 text-green-300 hover:bg-green-700 disabled:opacity-50"
                                        >
                                          Pay
                                        </button>
                                        <button
                                          onClick={() =>
                                            handlePaymentAction(event.id, r.id, "comp")
                                          }
                                          disabled={paymentLoading === r.id}
                                          className="px-2 py-0.5 rounded text-xs bg-blue-800 text-blue-300 hover:bg-blue-700 disabled:opacity-50"
                                        >
                                          Comp
                                        </button>
                                      </>
                                    )}
                                    {canCheckIn && (
                                      <button
                                        onClick={() =>
                                          openCheckinModal(event.id, r.id, r.userId)
                                        }
                                        disabled={actionLoading === r.id}
                                        className="px-2 py-0.5 rounded text-xs bg-green-800 text-green-300 hover:bg-green-700 disabled:opacity-50"
                                      >
                                        Check In
                                      </button>
                                    )}
                                    {canCheckOut && (
                                      <button
                                        onClick={() => handleCheckout(event.id, r.id)}
                                        disabled={actionLoading === r.id}
                                        className="px-2 py-0.5 rounded text-xs bg-orange-800 text-orange-300 hover:bg-orange-700 disabled:opacity-50"
                                      >
                                        Check Out
                                      </button>
                                    )}
                                    {canAwardXP && (
                                      <button
                                        onClick={() =>
                                          openXpModal(
                                            event.id,
                                            r.id,
                                            r.userName,
                                            r.xpEarned,
                                            r.npcMinutes
                                          )
                                        }
                                        disabled={actionLoading === r.id}
                                        className="px-2 py-0.5 rounded text-xs bg-amber-800 text-amber-300 hover:bg-amber-700 disabled:opacity-50"
                                      >
                                        XP
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </details>
                )}
              </div>
            ))
          )}
        </div>
      ) : subTab === "bea" ? (
        <div className="space-y-3">
          {beas.length === 0 ? (
            <div className="text-center py-12 bg-gray-900/30 rounded-lg border border-gray-800">
              <p className="text-gray-500">No between-event actions submitted.</p>
              <p className="text-gray-600 text-xs mt-2">
                Between-event actions submitted during sign-out will appear here for GM review and response.
              </p>
            </div>
          ) : (
            beas.map((bea) => {
              const details = bea.betweenEventDetails;
              const hasGmResponse = !!(details && details.gmResponse);
              return (
                <div
                  key={bea.id}
                  className={`p-4 bg-gray-900 rounded-lg border ${
                    hasGmResponse ? "border-green-800/50" : "border-gray-800"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium capitalize">
                          {bea.betweenEventAction}
                        </span>
                        {hasGmResponse ? (
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-900 text-green-300">
                            Responded
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-900 text-yellow-300">
                            Awaiting Response
                          </span>
                        )}
                      </div>
                      <div className="text-gray-400 text-sm mt-1">
                        {bea.playerName} &middot; {bea.characterName} &middot; {bea.eventName}
                      </div>
                      {details && (
                        <div className="mt-2 text-sm text-gray-300 space-y-1">
                          {Object.entries(details).map(([key, val]) => {
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
                      {hasGmResponse && details && (
                        <div className="mt-3 p-2 rounded bg-green-900/20 border border-green-800/30">
                          <div className="text-green-400 text-xs font-bold mb-1">
                            GM Response
                            {details.gmRespondedByName ? (
                              <span className="font-normal text-gray-500">
                                {" "}by {String(details.gmRespondedByName)}
                              </span>
                            ) : null}
                          </div>
                          <div className="text-gray-300 text-sm">{String(details.gmResponse)}</div>
                        </div>
                      )}
                      <div className="text-gray-600 text-xs mt-2">
                        Submitted {new Date(bea.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setRespondModal(bea);
                        setRespondText(hasGmResponse ? String(details.gmResponse) : "");
                        setCreateEncounter(false);
                        setEncounterName("");
                      }}
                      className={`ml-3 px-3 py-1.5 rounded text-xs shrink-0 ${
                        hasGmResponse
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          : "bg-blue-800 text-blue-300 hover:bg-blue-700"
                      }`}
                    >
                      {hasGmResponse ? "Edit Response" : "Respond"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : subTab === "encounters" ? (
        <EncountersTab />
      ) : subTab === "monsters" ? (
        <MonsterBookTab />
      ) : subTab === "npcs" ? (
        <NPCBookTab />
      ) : subTab === "locations" ? (
        <LocationsTab />
      ) : (
        <div className="text-center py-12 bg-gray-900/30 rounded-lg border border-gray-800">
          <p className="text-gray-500">Lore Management</p>
          <p className="text-gray-600 text-xs mt-2">
            Lore entries, world-building documents, and in-game history management will be available here.
          </p>
        </div>
      )}

      {/* Check-in Modal */}
      {checkinModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-white mb-4">Check In Player</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Select Character (optional)
                </label>
                {availableChars.length === 0 ? (
                  <p className="text-gray-500 text-sm">No approved characters available</p>
                ) : (
                  <select
                    value={selectedCharId}
                    onChange={(e) => setSelectedCharId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                  >
                    <option value="">No character (NPC/observer)</option>
                    {availableChars.map((char) => (
                      <option key={char.id} value={char.id}>
                        {char.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setCheckinModal(null)}
                  className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCheckin}
                  disabled={!!actionLoading}
                  className="px-4 py-2 rounded bg-green-700 text-white hover:bg-green-600 disabled:opacity-50"
                >
                  {actionLoading ? "Checking in..." : "Check In"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSaved={() => {
            setEditingEvent(null);
            refresh();
          }}
        />
      )}

      {/* XP Award Modal */}
      {xpModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-white mb-4">Award XP & NPC Credit</h3>
            <p className="text-gray-400 text-sm mb-4">Player: {xpModal.userName}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">XP Earned (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={xpInput}
                  onChange={(e) => setXpInput(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Standard: 40 XP for weekend event, 20 XP for one-day
                </p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">NPC Minutes</label>
                <input
                  type="number"
                  min="0"
                  value={npcInput}
                  onChange={(e) => setNpcInput(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setXpModal(null)}
                  className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAwardXP}
                  disabled={!!actionLoading}
                  className="px-4 py-2 rounded bg-amber-700 text-white hover:bg-amber-600 disabled:opacity-50"
                >
                  {actionLoading ? "Saving..." : "Award"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Between-Event Response Modal */}
      {respondModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-1">
              Respond to Between-Event Action
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              {respondModal.playerName} &middot; {respondModal.characterName} &middot;{" "}
              <span className="capitalize">{respondModal.betweenEventAction}</span>
            </p>

            {/* Show the player's submission details */}
            {respondModal.betweenEventDetails && (
              <div className="mb-4 p-3 rounded bg-gray-800 border border-gray-700">
                <div className="text-gray-400 text-xs font-bold mb-2">Player&apos;s Submission</div>
                <div className="text-sm text-gray-300 space-y-1">
                  {Object.entries(respondModal.betweenEventDetails).map(([key, val]) => {
                    if (key.startsWith("gm") || !val) return null;
                    return (
                      <div key={key}>
                        <span className="text-gray-500 text-xs">{key}: </span>
                        <span>{String(val)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-2">Your Narrative Response</label>
              <textarea
                value={respondText}
                onChange={(e) => setRespondText(e.target.value)}
                rows={6}
                placeholder="Describe what happens during the character's between-event action..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:border-blue-500 outline-none"
              />
            </div>

            {/* Create Encounter checkbox */}
            <div className="mt-3 p-3 rounded bg-gray-800 border border-gray-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createEncounter}
                  onChange={(e) => setCreateEncounter(e.target.checked)}
                  className="rounded border-gray-600"
                />
                <span className="text-sm text-gray-300">Create Encounter from this action</span>
              </label>
              {createEncounter && (
                <input
                  type="text"
                  value={encounterName}
                  onChange={(e) => setEncounterName(e.target.value)}
                  placeholder="Encounter name (optional)"
                  className="mt-2 w-full px-3 py-1.5 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                />
              )}
            </div>

            <div className="flex gap-3 justify-end mt-4">
              <button
                onClick={() => {
                  setRespondModal(null);
                  setRespondText("");
                }}
                className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!respondText.trim()) return;
                  setResponding(true);
                  try {
                    const res = await fetch(
                      `/api/admin/gm/between-events/${respondModal.id}/respond`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          response: respondText.trim(),
                          createEncounter,
                          encounterName: encounterName.trim() || undefined,
                        }),
                      }
                    );
                    if (res.ok) {
                      const data = await res.json();
                      if (data.encounter) {
                        alert(`Encounter "${data.encounter.name}" created! View it in the Encounters tab.`);
                      }
                      setRespondModal(null);
                      setRespondText("");
                      setCreateEncounter(false);
                      setEncounterName("");
                      refresh();
                    } else {
                      const err = await res.json();
                      alert(err.error || "Failed to submit response");
                    }
                  } finally {
                    setResponding(false);
                  }
                }}
                disabled={responding || !respondText.trim()}
                className="px-4 py-2 rounded bg-blue-700 text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {responding ? "Submitting..." : "Submit Response"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateEventForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        date,
        endDate: endDate || null,
        location,
        description,
      }),
    });
    setSaving(false);
    if (res.ok) {
      onCreated();
    } else {
      const errData = await res.json().catch(() => null);
      alert(errData?.error ?? "Failed to create event");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 bg-gray-800 rounded-lg border border-gray-700 space-y-3"
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Event Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Start Date *</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={saving || !name || !date}
        className="px-4 py-2 rounded-lg bg-green-700 text-white text-sm font-medium hover:bg-green-600 disabled:opacity-50"
      >
        {saving ? "Creating..." : "Create Event"}
      </button>
    </form>
  );
}

function EditEventModal({
  event,
  onClose,
  onSaved,
}: {
  event: EventRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(event.name);
  const [date, setDate] = useState(event.date.slice(0, 10));
  const [endDate, setEndDate] = useState(
    event.endDate ? event.endDate.slice(0, 10) : ""
  );
  const [location, setLocation] = useState(event.location || "");
  const [status, setStatus] = useState(event.status);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/admin/events/${event.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        date,
        endDate: endDate || null,
        location,
        status,
      }),
    });
    setSaving(false);
    if (res.ok) {
      onSaved();
    } else {
      const errData = await res.json().catch(() => null);
      alert(errData?.error ?? "Failed to update event");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 max-w-lg w-full">
        <h3 className="text-lg font-bold text-white mb-4">Edit Event</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Event Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Start Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
            >
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name || !date}
              className="px-4 py-2 rounded bg-amber-700 text-white hover:bg-amber-600 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
