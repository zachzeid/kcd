"use client";

import { useEffect, useState } from "react";

interface Monster {
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
  loot: unknown;
  tags: string[];
  createdAt: string;
}

const CATEGORIES = [
  "beast",
  "undead",
  "humanoid",
  "fey",
  "demon",
  "elemental",
  "construct",
  "aberration",
  "dragon",
  "plant",
  "ooze",
  "other",
];

export default function MonsterBookTab() {
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/gm/monster-book")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setMonsters(Array.isArray(data) ? data : []))
      .catch(() => setMonsters([]))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const filtered = monsters.filter(
    (m) =>
      !filter ||
      m.name.toLowerCase().includes(filter.toLowerCase()) ||
      m.category?.toLowerCase().includes(filter.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this monster?")) return;
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
        <h2 className="text-lg font-bold text-white">Monster Book</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-500"
        >
          {showCreate ? "Cancel" : "+ New Monster"}
        </button>
      </div>

      {showCreate && (
        <MonsterForm
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
        placeholder="Filter by name or category..."
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
      />

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-gray-900/30 rounded-lg border border-gray-800">
          <p className="text-gray-500">
            {monsters.length === 0 ? "No monsters yet." : "No matches."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => (
            <div key={m.id} className="p-4 bg-gray-900 rounded-lg border border-gray-800">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{m.name}</span>
                    {m.category && (
                      <span className="px-2 py-0.5 rounded text-xs bg-purple-900/50 text-purple-300">
                        {m.category}
                      </span>
                    )}
                    {m.race && (
                      <span className="text-gray-500 text-xs">{m.race}</span>
                    )}
                  </div>
                  <div className="text-gray-400 text-sm mt-1">
                    Lv.{m.level} &middot; {m.bodyPoints} BP
                    {m.abilities.length > 0 && (
                      <span className="text-gray-500">
                        {" "}&middot; {m.abilities.length} abilities
                      </span>
                    )}
                  </div>
                  {m.description && (
                    <p className="text-gray-500 text-xs mt-1">{m.description}</p>
                  )}
                  {m.tags.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {m.tags.map((t) => (
                        <span key={t} className="px-1.5 py-0.5 rounded text-xs bg-gray-800 text-gray-400">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditId(editId === m.id ? null : m.id)}
                    className="px-2 py-1 rounded text-xs bg-gray-700 text-gray-300 hover:bg-gray-600"
                  >
                    {editId === m.id ? "Close" : "Edit"}
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="px-2 py-1 rounded text-xs bg-red-900 text-red-300 hover:bg-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {editId === m.id && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <MonsterForm
                    monster={m}
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

function MonsterForm({
  monster,
  onSaved,
}: {
  monster?: Monster;
  onSaved: () => void;
}) {
  const [name, setName] = useState(monster?.name || "");
  const [category, setCategory] = useState(monster?.category || "");
  const [race, setRace] = useState(monster?.race || "");
  const [level, setLevel] = useState(String(monster?.level || 1));
  const [bodyPoints, setBodyPoints] = useState(String(monster?.bodyPoints || 1));
  const [description, setDescription] = useState(monster?.description || "");
  const [abilities, setAbilities] = useState(monster?.abilities?.join(", ") || "");
  const [resistances, setResistances] = useState(monster?.resistances?.join(", ") || "");
  const [weaknesses, setWeaknesses] = useState(monster?.weaknesses?.join(", ") || "");
  const [tags, setTags] = useState(monster?.tags?.join(", ") || "");
  const [saving, setSaving] = useState(false);

  const parseCSV = (s: string) =>
    s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name,
      category: category || null,
      race: race || null,
      level: parseInt(level) || 1,
      bodyPoints: parseInt(bodyPoints) || 1,
      description: description || null,
      abilities: parseCSV(abilities),
      resistances: parseCSV(resistances),
      weaknesses: parseCSV(weaknesses),
      tags: parseCSV(tags),
    };

    const url = monster
      ? `/api/admin/gm/monster-book/${monster.id}`
      : "/api/admin/gm/monster-book";
    const method = monster ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) onSaved();
    else alert("Failed to save monster");
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
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
          >
            <option value="">None</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Race</label>
          <input
            type="text"
            value={race}
            onChange={(e) => setRace(e.target.value)}
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
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
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
            placeholder="e.g. Fire Breath, Claw Attack"
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
        <div>
          <label className="block text-xs text-gray-400 mb-1">Tags (comma-separated)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. boss, elite, minion"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={saving || !name}
        className="px-4 py-2 rounded-lg bg-green-700 text-white text-sm font-medium hover:bg-green-600 disabled:opacity-50"
      >
        {saving ? "Saving..." : monster ? "Update Monster" : "Create Monster"}
      </button>
    </form>
  );
}
