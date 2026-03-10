"use client";

import { useEffect, useState } from "react";

interface NPC {
  id: string;
  name: string;
  category: string | null;
  race: string | null;
  level: number;
  bodyPoints: number;
  description: string | null;
  abilities: string[];
  resistances: string[];
  weaknesses: string[];
  tags: string[];
  createdAt: string;
}

const NPC_ROLES = [
  "guard",
  "merchant",
  "quest",
  "tavern",
  "royal",
  "clergy",
  "scholar",
  "criminal",
  "recurring",
  "other",
];

export default function NPCBookTab() {
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/gm/monster-book?category=npc")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setNpcs(Array.isArray(data) ? data : []))
      .catch(() => setNpcs([]))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const filtered = npcs.filter(
    (n) =>
      !filter ||
      n.name.toLowerCase().includes(filter.toLowerCase()) ||
      n.tags.some((t) => t.toLowerCase().includes(filter.toLowerCase()))
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this NPC?")) return;
    const res = await fetch(`/api/admin/gm/monster-book/${id}`, { method: "DELETE" });
    if (res.ok) refresh();
    else {
      const err = await res.json().catch(() => null);
      alert(err?.error || "Failed to delete");
    }
  };

  if (loading) return <div className="text-gray-500 text-center py-8">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-white">NPC Book</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-500"
        >
          {showCreate ? "Cancel" : "+ New NPC"}
        </button>
      </div>

      {showCreate && (
        <NPCForm
          onSaved={() => {
            setShowCreate(false);
            refresh();
          }}
        />
      )}

      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter by name or role..."
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
      />

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-gray-900/30 rounded-lg border border-gray-800">
          <p className="text-gray-500">
            {npcs.length === 0 ? "No NPCs yet." : "No matches."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => (
            <div key={n.id} className="p-4 bg-gray-900 rounded-lg border border-gray-800">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{n.name}</span>
                    {n.race && (
                      <span className="text-gray-500 text-xs">{n.race}</span>
                    )}
                  </div>
                  <div className="text-gray-400 text-sm mt-1">
                    Lv.{n.level} &middot; {n.bodyPoints} BP
                    {n.abilities.length > 0 && (
                      <span className="text-gray-500">
                        {" "}&middot; {n.abilities.length} abilities
                      </span>
                    )}
                  </div>
                  {n.description && (
                    <p className="text-gray-500 text-xs mt-1">{n.description}</p>
                  )}
                  {n.tags.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {n.tags.filter((t) => t !== "npc").map((t) => (
                        <span key={t} className="px-1.5 py-0.5 rounded text-xs bg-cyan-900/50 text-cyan-300">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditId(editId === n.id ? null : n.id)}
                    className="px-2 py-1 rounded text-xs bg-gray-700 text-gray-300 hover:bg-gray-600"
                  >
                    {editId === n.id ? "Close" : "Edit"}
                  </button>
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="px-2 py-1 rounded text-xs bg-red-900 text-red-300 hover:bg-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {editId === n.id && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <NPCForm
                    npc={n}
                    onSaved={() => {
                      setEditId(null);
                      refresh();
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NPCForm({
  npc,
  onSaved,
}: {
  npc?: NPC;
  onSaved: () => void;
}) {
  const [name, setName] = useState(npc?.name || "");
  const [race, setRace] = useState(npc?.race || "");
  const [level, setLevel] = useState(String(npc?.level || 1));
  const [bodyPoints, setBodyPoints] = useState(String(npc?.bodyPoints || 6));
  const [description, setDescription] = useState(npc?.description || "");
  const [abilities, setAbilities] = useState(npc?.abilities?.join(", ") || "");
  const [resistances, setResistances] = useState(npc?.resistances?.join(", ") || "");
  const [weaknesses, setWeaknesses] = useState(npc?.weaknesses?.join(", ") || "");
  const [tags, setTags] = useState(
    npc?.tags?.filter((t) => t !== "npc").join(", ") || ""
  );
  const [saving, setSaving] = useState(false);

  const parseCSV = (s: string) =>
    s.split(",").map((x) => x.trim()).filter(Boolean);

  // Toggle role tags
  const currentTags = parseCSV(tags);
  const toggleRole = (role: string) => {
    const updated = currentTags.includes(role)
      ? currentTags.filter((t) => t !== role)
      : [...currentTags, role];
    setTags(updated.join(", "));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const allTags = ["npc", ...parseCSV(tags)];

    const payload = {
      name,
      category: "npc",
      race: race || null,
      level: parseInt(level) || 1,
      bodyPoints: parseInt(bodyPoints) || 6,
      description: description || null,
      abilities: parseCSV(abilities),
      resistances: parseCSV(resistances),
      weaknesses: parseCSV(weaknesses),
      tags: allTags,
    };

    const url = npc
      ? `/api/admin/gm/monster-book/${npc.id}`
      : "/api/admin/gm/monster-book";
    const method = npc ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) onSaved();
    else alert("Failed to save NPC");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Town Guard, Innkeeper"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Race</label>
          <input
            type="text"
            value={race}
            onChange={(e) => setRace(e.target.value)}
            placeholder="e.g. Human, Dwarf, Elf"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Level</label>
            <input
              type="number"
              min="1"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Body Points</label>
            <input
              type="number"
              min="1"
              value={bodyPoints}
              onChange={(e) => setBodyPoints(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Roles</label>
          <div className="flex flex-wrap gap-1">
            {NPC_ROLES.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => toggleRole(role)}
                className={`px-2 py-0.5 rounded text-xs ${
                  currentTags.includes(role)
                    ? "bg-cyan-700 text-white"
                    : "bg-gray-800 text-gray-500 hover:bg-gray-700"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="NPC background, personality, role in the world..."
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Abilities (comma-separated)</label>
          <input
            type="text"
            value={abilities}
            onChange={(e) => setAbilities(e.target.value)}
            placeholder="e.g. Lore Knowledge, Barter"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Resistances (comma-separated)</label>
          <input
            type="text"
            value={resistances}
            onChange={(e) => setResistances(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Weaknesses (comma-separated)</label>
          <input
            type="text"
            value={weaknesses}
            onChange={(e) => setWeaknesses(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={saving || !name}
        className="px-4 py-2 rounded-lg bg-green-700 text-white text-sm font-medium hover:bg-green-600 disabled:opacity-50"
      >
        {saving ? "Saving..." : npc ? "Update NPC" : "Create NPC"}
      </button>
    </form>
  );
}
