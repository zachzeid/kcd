"use client";

import { useEffect, useState } from "react";

interface LocationRow {
  id: string;
  name: string;
  type: string;
  region: string | null;
  description: string | null;
}

const LOCATION_TYPES = ["town", "city", "ruins", "region", "landmark"] as const;

const TYPE_COLORS: Record<string, string> = {
  town: "bg-green-900 text-green-300",
  city: "bg-amber-900 text-amber-300",
  ruins: "bg-red-900 text-red-300",
  region: "bg-blue-900 text-blue-300",
  landmark: "bg-purple-900 text-purple-300",
};

export default function LocationsTab() {
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    fetch("/api/locations")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setLocations(Array.isArray(data) ? data : []))
      .catch(() => setLocations([]))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const filtered =
    filterType === "all"
      ? locations
      : locations.filter((l) => l.type === filterType);

  const regions = [...new Set(locations.filter((l) => l.type === "region").map((l) => l.name))];

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete location "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/locations/${id}`, { method: "DELETE" });
    if (res.ok) refresh();
    else alert("Failed to delete location");
  };

  if (loading) {
    return <div className="text-gray-500 text-center py-8">Loading locations...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-white">Locations</h2>
          <span className="text-gray-500 text-sm">{filtered.length} entries</span>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-xs"
          >
            <option value="all">All Types</option>
            {LOCATION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-500"
          >
            {showCreate ? "Cancel" : "+ New Location"}
          </button>
        </div>
      </div>

      {showCreate && (
        <LocationForm
          regions={regions}
          onSaved={() => {
            setShowCreate(false);
            refresh();
          }}
        />
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No locations found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs uppercase border-b border-gray-800">
                <th className="text-left py-2 px-3">Name</th>
                <th className="text-left py-2 px-3">Type</th>
                <th className="text-left py-2 px-3">Region</th>
                <th className="text-left py-2 px-3">Description</th>
                <th className="text-right py-2 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((loc) => (
                <tr key={loc.id} className="border-b border-gray-800 hover:bg-gray-900/50">
                  {editingId === loc.id ? (
                    <td colSpan={5} className="py-2 px-3">
                      <LocationForm
                        existing={loc}
                        regions={regions}
                        onSaved={() => {
                          setEditingId(null);
                          refresh();
                        }}
                        onCancel={() => setEditingId(null)}
                      />
                    </td>
                  ) : (
                    <>
                      <td className="py-2 px-3 text-white font-medium">{loc.name}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            TYPE_COLORS[loc.type] || "bg-gray-700 text-gray-300"
                          }`}
                        >
                          {loc.type}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-400">{loc.region || "—"}</td>
                      <td className="py-2 px-3 text-gray-400 max-w-xs truncate">
                        {loc.description || "—"}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => setEditingId(loc.id)}
                          className="px-2 py-1 rounded text-xs bg-gray-700 text-gray-300 hover:bg-gray-600 mr-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(loc.id, loc.name)}
                          className="px-2 py-1 rounded text-xs bg-red-900 text-red-300 hover:bg-red-800"
                        >
                          Delete
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LocationForm({
  existing,
  regions,
  onSaved,
  onCancel,
}: {
  existing?: LocationRow;
  regions: string[];
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(existing?.name || "");
  const [type, setType] = useState(existing?.type || "town");
  const [region, setRegion] = useState(existing?.region || "");
  const [description, setDescription] = useState(existing?.description || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const url = existing ? `/api/locations/${existing.id}` : "/api/locations";
    const method = existing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        type,
        region: region.trim() || null,
        description: description.trim() || null,
      }),
    });

    setSaving(false);
    if (res.ok) {
      onSaved();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error || "Failed to save location");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 bg-gray-800 rounded-lg border border-gray-700 space-y-3"
    >
      {error && (
        <div className="text-red-400 text-sm bg-red-900/30 border border-red-800 rounded px-3 py-2">
          {error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Nightbourne"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:border-amber-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
          >
            {LOCATION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Region</label>
          <input
            type="text"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            list="region-suggestions"
            placeholder="e.g. The Barony of Bellanmo"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:border-amber-500 outline-none"
          />
          <datalist id="region-suggestions">
            {regions.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description (optional)"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:border-amber-500 outline-none"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="px-4 py-2 rounded-lg bg-green-700 text-white text-sm font-medium hover:bg-green-600 disabled:opacity-50"
        >
          {saving ? "Saving..." : existing ? "Save Changes" : "Create Location"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-gray-700 text-white text-sm hover:bg-gray-600"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
