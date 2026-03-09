"use client";

import { useEffect, useState } from "react";

interface EncounterChar {
  id: string;
  characterId: string;
  characterName: string;
  notes: string | null;
}

interface EncounterEvt {
  id: string;
  eventId: string;
  eventName: string;
}

interface EncounterNPC {
  id: string;
  monsterBookId: string | null;
  monsterName: string;
  monsterCategory: string | null;
  customName: string | null;
  notes: string | null;
}

interface Encounter {
  id: string;
  name: string;
  description: string | null;
  status: string;
  signOutId: string | null;
  createdByName: string;
  completedAt: string | null;
  createdAt: string;
  characters: EncounterChar[];
  events: EncounterEvt[];
  npcs: EncounterNPC[];
}

interface EventOption {
  id: string;
  name: string;
}

interface MonsterOption {
  id: string;
  name: string;
  category: string | null;
}

export default function EncountersTab() {
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // For adding characters/events/npcs
  const [addCharModal, setAddCharModal] = useState<string | null>(null);
  const [addEventModal, setAddEventModal] = useState<string | null>(null);
  const [addNpcModal, setAddNpcModal] = useState<string | null>(null);
  const [tagModal, setTagModal] = useState<string | null>(null);

  const refresh = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/gm/encounters")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setEncounters(Array.isArray(data) ? data : []))
      .catch(() => setEncounters([]))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this encounter?")) return;
    const res = await fetch(`/api/admin/gm/encounters/${id}`, { method: "DELETE" });
    if (res.ok) refresh();
    else alert("Failed to delete");
  };

  const handleComplete = async (id: string) => {
    const res = await fetch(`/api/admin/gm/encounters/${id}/complete`, { method: "POST" });
    if (res.ok) refresh();
    else {
      const err = await res.json().catch(() => null);
      alert(err?.error || "Failed");
    }
  };

  const handleActivate = async (id: string) => {
    const res = await fetch(`/api/admin/gm/encounters/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    });
    if (res.ok) refresh();
  };

  if (loading) return <div className="text-gray-500 text-center py-8">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-white">Encounters</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-500"
        >
          {showCreate ? "Cancel" : "+ New Encounter"}
        </button>
      </div>

      {showCreate && (
        <CreateEncounterForm
          onCreated={() => {
            setShowCreate(false);
            refresh();
          }}
        />
      )}

      {encounters.length === 0 ? (
        <div className="text-center py-12 bg-gray-900/30 rounded-lg border border-gray-800">
          <p className="text-gray-500">No encounters yet.</p>
          <p className="text-gray-600 text-xs mt-2">
            Create encounters from BEA responses or the button above.
          </p>
        </div>
      ) : (
        encounters.map((enc) => (
          <div
            key={enc.id}
            className={`p-4 bg-gray-900 rounded-lg border ${
              enc.status === "complete"
                ? "border-green-800/50"
                : enc.status === "active"
                ? "border-blue-800/50"
                : "border-gray-800"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{enc.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold ${
                      enc.status === "complete"
                        ? "bg-green-900 text-green-300"
                        : enc.status === "active"
                        ? "bg-blue-900 text-blue-300"
                        : "bg-gray-700 text-gray-400"
                    }`}
                  >
                    {enc.status}
                  </span>
                </div>
                {enc.description && (
                  <p className="text-gray-400 text-sm mt-1">{enc.description}</p>
                )}
                <div className="text-gray-600 text-xs mt-1">
                  by {enc.createdByName} &middot; {new Date(enc.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex gap-2">
                {enc.status === "draft" && (
                  <button
                    onClick={() => handleActivate(enc.id)}
                    className="px-2 py-1 rounded text-xs bg-blue-800 text-blue-300 hover:bg-blue-700"
                  >
                    Activate
                  </button>
                )}
                {enc.status !== "complete" && (
                  <button
                    onClick={() => handleComplete(enc.id)}
                    className="px-2 py-1 rounded text-xs bg-green-800 text-green-300 hover:bg-green-700"
                  >
                    Complete
                  </button>
                )}
                <button
                  onClick={() => setEditId(editId === enc.id ? null : enc.id)}
                  className="px-2 py-1 rounded text-xs bg-gray-700 text-gray-300 hover:bg-gray-600"
                >
                  {editId === enc.id ? "Close" : "Edit"}
                </button>
                <button
                  onClick={() => handleDelete(enc.id)}
                  className="px-2 py-1 rounded text-xs bg-red-900 text-red-300 hover:bg-red-800"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Summary pills */}
            <div className="flex flex-wrap gap-2 mt-3">
              {enc.events.map((ev) => (
                <span key={ev.id} className="px-2 py-0.5 rounded text-xs bg-blue-900/50 text-blue-300">
                  {ev.eventName}
                </span>
              ))}
              {enc.characters.map((c) => (
                <span key={c.id} className="px-2 py-0.5 rounded text-xs bg-amber-900/50 text-amber-300">
                  {c.characterName}
                </span>
              ))}
              {enc.npcs.map((npc) => (
                <span key={npc.id} className="px-2 py-0.5 rounded text-xs bg-purple-900/50 text-purple-300">
                  {npc.monsterName}
                </span>
              ))}
            </div>

            {/* Expanded edit panel */}
            {editId === enc.id && (
              <div className="mt-4 pt-4 border-t border-gray-800 space-y-4">
                {/* Edit name/desc */}
                <EditEncounterInline encounter={enc} onSaved={refresh} />

                {/* Characters section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-gray-300">Characters</h4>
                    <button
                      onClick={() => setAddCharModal(enc.id)}
                      className="px-2 py-1 rounded text-xs bg-amber-800 text-amber-300 hover:bg-amber-700"
                    >
                      + Add
                    </button>
                  </div>
                  {enc.characters.length === 0 ? (
                    <p className="text-gray-600 text-xs">No characters assigned.</p>
                  ) : (
                    <div className="space-y-1">
                      {enc.characters.map((c) => (
                        <div key={c.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">{c.characterName}</span>
                          <button
                            onClick={async () => {
                              await fetch(`/api/admin/gm/encounters/${enc.id}/characters`, {
                                method: "DELETE",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ characterId: c.characterId }),
                              });
                              refresh();
                            }}
                            className="text-red-400 hover:text-red-300 text-xs"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Events section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-gray-300">Events</h4>
                    <button
                      onClick={() => setAddEventModal(enc.id)}
                      className="px-2 py-1 rounded text-xs bg-blue-800 text-blue-300 hover:bg-blue-700"
                    >
                      + Assign Event
                    </button>
                  </div>
                  {enc.events.length === 0 ? (
                    <p className="text-gray-600 text-xs">No events assigned.</p>
                  ) : (
                    <div className="space-y-1">
                      {enc.events.map((ev) => (
                        <div key={ev.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">{ev.eventName}</span>
                          <button
                            onClick={async () => {
                              await fetch(`/api/admin/gm/encounters/${enc.id}/events`, {
                                method: "DELETE",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ eventId: ev.eventId }),
                              });
                              refresh();
                            }}
                            className="text-red-400 hover:text-red-300 text-xs"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* NPCs section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-gray-300">NPCs</h4>
                    <button
                      onClick={() => setAddNpcModal(enc.id)}
                      className="px-2 py-1 rounded text-xs bg-purple-800 text-purple-300 hover:bg-purple-700"
                    >
                      + Add NPC
                    </button>
                  </div>
                  {enc.npcs.length === 0 ? (
                    <p className="text-gray-600 text-xs">No NPCs added.</p>
                  ) : (
                    <div className="space-y-1">
                      {enc.npcs.map((npc) => (
                        <div key={npc.id} className="flex items-center justify-between text-sm">
                          <div>
                            <span className="text-gray-300">{npc.monsterName}</span>
                            {npc.monsterCategory && (
                              <span className="text-gray-600 text-xs ml-2">({npc.monsterCategory})</span>
                            )}
                          </div>
                          <button
                            onClick={async () => {
                              await fetch(`/api/admin/gm/encounters/${enc.id}/npcs`, {
                                method: "DELETE",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ npcId: npc.id }),
                              });
                              refresh();
                            }}
                            className="text-red-400 hover:text-red-300 text-xs"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Request Tags button */}
                <button
                  onClick={() => setTagModal(enc.id)}
                  disabled={enc.characters.length === 0}
                  className="px-3 py-1.5 rounded text-xs bg-green-800 text-green-300 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Request Tags for Econ
                </button>
              </div>
            )}
          </div>
        ))
      )}

      {/* Add Character Modal */}
      {addCharModal && (
        <AddCharacterModal
          encounterId={addCharModal}
          onClose={() => setAddCharModal(null)}
          onAdded={() => {
            setAddCharModal(null);
            refresh();
          }}
        />
      )}

      {/* Add Event Modal */}
      {addEventModal && (
        <AddEventModal
          encounterId={addEventModal}
          onClose={() => setAddEventModal(null)}
          onAdded={() => {
            setAddEventModal(null);
            refresh();
          }}
        />
      )}

      {/* Add NPC Modal */}
      {addNpcModal && (
        <AddNpcModal
          encounterId={addNpcModal}
          onClose={() => setAddNpcModal(null)}
          onAdded={() => {
            setAddNpcModal(null);
            refresh();
          }}
        />
      )}

      {/* Request Tags Modal */}
      {tagModal && (
        <RequestTagsModal
          encounterId={tagModal}
          encounters={encounters}
          onClose={() => setTagModal(null)}
          onCreated={() => {
            setTagModal(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function CreateEncounterForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/gm/encounters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    setSaving(false);
    if (res.ok) onCreated();
    else alert("Failed to create encounter");
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-800 rounded-lg border border-gray-700 space-y-3">
      <div>
        <label className="block text-xs text-gray-400 mb-1">Encounter Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
        />
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
        disabled={saving || !name}
        className="px-4 py-2 rounded-lg bg-green-700 text-white text-sm font-medium hover:bg-green-600 disabled:opacity-50"
      >
        {saving ? "Creating..." : "Create Encounter"}
      </button>
    </form>
  );
}

function EditEncounterInline({ encounter, onSaved }: { encounter: Encounter; onSaved: () => void }) {
  const [name, setName] = useState(encounter.name);
  const [description, setDescription] = useState(encounter.description || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch(`/api/admin/gm/encounters/${encounter.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    setSaving(false);
    if (res.ok) onSaved();
  };

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm"
      />
      <button
        onClick={handleSave}
        disabled={saving || !name}
        className="px-3 py-1 rounded text-xs bg-amber-700 text-white hover:bg-amber-600 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}

function AddCharacterModal({
  encounterId,
  onClose,
  onAdded,
}: {
  encounterId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Array<{ id: string; name: string; userName: string }>>([]);
  const [searching, setSearching] = useState(false);

  const doSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    const res = await fetch(`/api/admin/characters?search=${encodeURIComponent(search)}`);
    if (res.ok) {
      const data = await res.json();
      const chars = (Array.isArray(data) ? data : []).map(
        (c: { id: string; name: string; userName: string }) => ({
          id: c.id,
          name: c.name,
          userName: c.userName,
        })
      );
      setResults(chars);
    }
    setSearching(false);
  };

  const addChar = async (characterId: string) => {
    const res = await fetch(`/api/admin/gm/encounters/${encounterId}/characters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ characterId }),
    });
    if (res.ok) onAdded();
    else {
      const err = await res.json().catch(() => null);
      alert(err?.error || "Failed to add character");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 max-w-md w-full">
        <h3 className="text-lg font-bold text-white mb-4">Add Character</h3>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), doSearch())}
            placeholder="Search characters..."
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
          />
          <button
            onClick={doSearch}
            disabled={searching}
            className="px-3 py-2 rounded bg-amber-700 text-white text-sm hover:bg-amber-600 disabled:opacity-50"
          >
            Search
          </button>
        </div>
        <div className="max-h-60 overflow-y-auto space-y-1">
          {results.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-800">
              <div>
                <span className="text-white text-sm">{c.name}</span>
                <span className="text-gray-500 text-xs ml-2">({c.userName})</span>
              </div>
              <button
                onClick={() => addChar(c.id)}
                className="px-2 py-1 rounded text-xs bg-green-800 text-green-300 hover:bg-green-700"
              >
                Add
              </button>
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function AddEventModal({
  encounterId,
  onClose,
  onAdded,
}: {
  encounterId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/events")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const evts = (Array.isArray(data) ? data : []).map((e: { id: string; name: string }) => ({
          id: e.id,
          name: e.name,
        }));
        setEvents(evts);
      })
      .finally(() => setLoading(false));
  }, []);

  const assignEvent = async (eventId: string) => {
    const res = await fetch(`/api/admin/gm/encounters/${encounterId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId }),
    });
    if (res.ok) onAdded();
    else {
      const err = await res.json().catch(() => null);
      alert(err?.error || "Failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 max-w-md w-full">
        <h3 className="text-lg font-bold text-white mb-4">Assign Event</h3>
        {loading ? (
          <div className="text-gray-500 text-sm">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-gray-500 text-sm">No events available.</div>
        ) : (
          <div className="max-h-60 overflow-y-auto space-y-1">
            {events.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-800">
                <span className="text-white text-sm">{ev.name}</span>
                <button
                  onClick={() => assignEvent(ev.id)}
                  className="px-2 py-1 rounded text-xs bg-blue-800 text-blue-300 hover:bg-blue-700"
                >
                  Assign
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function AddNpcModal({
  encounterId,
  onClose,
  onAdded,
}: {
  encounterId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [monsters, setMonsters] = useState<MonsterOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [customName, setCustomName] = useState("");
  const [customNotes, setCustomNotes] = useState("");

  useEffect(() => {
    fetch("/api/admin/gm/monster-book")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setMonsters(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const addFromBook = async (monsterBookId: string) => {
    const res = await fetch(`/api/admin/gm/encounters/${encounterId}/npcs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monsterBookId }),
    });
    if (res.ok) onAdded();
    else {
      const err = await res.json().catch(() => null);
      alert(err?.error || "Failed");
    }
  };

  const addCustom = async () => {
    if (!customName.trim()) return;
    const res = await fetch(`/api/admin/gm/encounters/${encounterId}/npcs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customName, notes: customNotes }),
    });
    if (res.ok) onAdded();
    else {
      const err = await res.json().catch(() => null);
      alert(err?.error || "Failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-white mb-4">Add NPC</h3>

        {/* Custom NPC */}
        <div className="mb-4 p-3 bg-gray-800 rounded border border-gray-700">
          <h4 className="text-sm font-bold text-gray-300 mb-2">Custom NPC</h4>
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="NPC Name"
            className="w-full px-3 py-1.5 bg-gray-900 border border-gray-700 rounded text-white text-sm mb-2"
          />
          <input
            type="text"
            value={customNotes}
            onChange={(e) => setCustomNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="w-full px-3 py-1.5 bg-gray-900 border border-gray-700 rounded text-white text-sm mb-2"
          />
          <button
            onClick={addCustom}
            disabled={!customName.trim()}
            className="px-3 py-1 rounded text-xs bg-purple-800 text-purple-300 hover:bg-purple-700 disabled:opacity-50"
          >
            Add Custom
          </button>
        </div>

        {/* From Monster Book */}
        <h4 className="text-sm font-bold text-gray-300 mb-2">From Monster Book</h4>
        {loading ? (
          <div className="text-gray-500 text-sm">Loading...</div>
        ) : monsters.length === 0 ? (
          <div className="text-gray-500 text-sm">
            No monsters in book. Add them in the Monster Book tab.
          </div>
        ) : (
          <div className="max-h-48 overflow-y-auto space-y-1">
            {monsters.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-800">
                <div>
                  <span className="text-white text-sm">{m.name}</span>
                  {m.category && (
                    <span className="text-gray-500 text-xs ml-2">({m.category})</span>
                  )}
                </div>
                <button
                  onClick={() => addFromBook(m.id)}
                  className="px-2 py-1 rounded text-xs bg-purple-800 text-purple-300 hover:bg-purple-700"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function RequestTagsModal({
  encounterId,
  encounters,
  onClose,
  onCreated,
}: {
  encounterId: string;
  encounters: Encounter[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const encounter = encounters.find((e) => e.id === encounterId);
  const [items, setItems] = useState<
    Array<{
      characterId: string;
      itemType: string;
      itemName: string;
      itemDescription: string;
      craftingSkill: string;
      craftingLevel: number;
    }>
  >([]);
  const [saving, setSaving] = useState(false);

  const addItem = () => {
    setItems([
      ...items,
      {
        characterId: encounter?.characters[0]?.characterId || "",
        itemType: "magic_item",
        itemName: "",
        itemDescription: "",
        craftingSkill: "GM Award",
        craftingLevel: 1,
      },
    ]);
  };

  const updateItem = (idx: number, field: string, value: string | number) => {
    setItems(items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (items.length === 0) return;
    const invalid = items.find((i) => !i.itemName.trim() || !i.characterId);
    if (invalid) {
      alert("All items need a name and character");
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/admin/gm/encounters/${encounterId}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      alert(`${data.created} tag request(s) sent to Economy for approval.`);
      onCreated();
    } else {
      const err = await res.json().catch(() => null);
      alert(err?.error || "Failed");
    }
  };

  if (!encounter) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-white mb-1">Request Tags</h3>
        <p className="text-gray-400 text-sm mb-4">
          Create item submissions for Economy Marshal approval.
        </p>

        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="p-3 bg-gray-800 rounded border border-gray-700 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">Item #{idx + 1}</span>
                <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-300 text-xs">
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Character</label>
                  <select
                    value={item.characterId}
                    onChange={(e) => updateItem(idx, "characterId", e.target.value)}
                    className="w-full px-2 py-1.5 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                  >
                    <option value="">Select...</option>
                    {encounter.characters.map((c) => (
                      <option key={c.characterId} value={c.characterId}>
                        {c.characterName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Item Name *</label>
                  <input
                    type="text"
                    value={item.itemName}
                    onChange={(e) => updateItem(idx, "itemName", e.target.value)}
                    className="w-full px-2 py-1.5 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Type</label>
                  <select
                    value={item.itemType}
                    onChange={(e) => updateItem(idx, "itemType", e.target.value)}
                    className="w-full px-2 py-1.5 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                  >
                    <option value="magic_item">Magic Item</option>
                    <option value="weapons">Weapons</option>
                    <option value="armor">Armor</option>
                    <option value="potions">Potions</option>
                    <option value="scrolls">Scrolls</option>
                    <option value="alchemy">Alchemy</option>
                    <option value="misc_craft">Misc Craft</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Description</label>
                  <input
                    type="text"
                    value={item.itemDescription}
                    onChange={(e) => updateItem(idx, "itemDescription", e.target.value)}
                    className="w-full px-2 py-1.5 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addItem}
          className="mt-3 px-3 py-1.5 rounded text-xs bg-gray-700 text-gray-300 hover:bg-gray-600"
        >
          + Add Item
        </button>

        <div className="flex gap-3 justify-end mt-4">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || items.length === 0}
            className="px-4 py-2 rounded bg-green-700 text-white hover:bg-green-600 disabled:opacity-50"
          >
            {saving ? "Submitting..." : `Submit ${items.length} Tag Request(s)`}
          </button>
        </div>
      </div>
    </div>
  );
}
