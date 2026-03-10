"use client";

import { useEffect, useState } from "react";
import { ITEM_TYPES, CRAFTING_SKILLS, ALL_MATERIALS } from "@/lib/economy";

interface Tag {
  id: string;
  tagCode: number | null;
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
  source: string; // econ_created, gm_encounter, player_signout
  characterId: string;
  characterName: string;
  playerName: string;
  tagUrl: string | null;
  printedAt: string | null;
  createdAt: string;
}

type SourceFilter = "all" | "player_signout" | "gm_encounter" | "econ_created";

const SOURCE_LABELS: Record<string, string> = {
  player_signout: "Player",
  gm_encounter: "GM",
  econ_created: "Econ",
};

const SOURCE_COLORS: Record<string, string> = {
  player_signout: "bg-blue-900 text-blue-300",
  gm_encounter: "bg-purple-900 text-purple-300",
  econ_created: "bg-green-900 text-green-300",
};

interface CharacterOption {
  id: string;
  name: string;
  playerName: string;
  status: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  processedBy: string | null;
  createdAt: string;
}

interface PlayerBank {
  id: string;
  characterId: string;
  characterName: string;
  playerName: string;
  balance: number;
  balanceFormatted: string;
  updatedAt: string;
}

type SubTab = "tags" | "banks";

function formatSilver(copper: number): string {
  const silver = copper / 100;
  if (Number.isInteger(silver)) return `${silver} silver`;
  return `${silver.toFixed(1)} silver`;
}

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  profession_earning: "Profession Earning",
  starting_equipment: "Starting Equipment",
  skill_training: "Skill Training",
  admin_adjustment: "Adjustment",
};

const ITEM_TYPE_OPTIONS = Object.entries(ITEM_TYPES).filter(
  ([key]) => key !== "coin_earning" && key !== "coin_award"
);

export default function EconomyDepartment() {
  const [subTab, setSubTab] = useState<SubTab>("tags");
  const [tags, setTags] = useState<Tag[]>([]);
  const [banks, setBanks] = useState<PlayerBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBank, setExpandedBank] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTxns, setLoadingTxns] = useState(false);

  // Bank transaction form
  const [txnForm, setTxnForm] = useState<{ characterId: string } | null>(null);
  const [txnType, setTxnType] = useState("deposit");
  const [txnAmount, setTxnAmount] = useState("");
  const [txnDesc, setTxnDesc] = useState("");
  const [txnSaving, setTxnSaving] = useState(false);

  // Tag creation form
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [characters, setCharacters] = useState<CharacterOption[]>([]);
  const [charSearch, setCharSearch] = useState("");
  const [tagForm, setTagForm] = useState({
    characterId: "",
    itemType: "",
    itemName: "",
    itemDescription: "",
    craftingSkill: "",
    craftingLevel: 1,
    quantity: 1,
    primaryMaterial: "",
    secondaryMaterial: "",
    masterCrafted: false,
  });
  const [tagSaving, setTagSaving] = useState(false);
  const [tagError, setTagError] = useState("");

  // Transfer form
  const [transferTag, setTransferTag] = useState<Tag | null>(null);
  const [transferTargetId, setTransferTargetId] = useState("");
  const [transferSaving, setTransferSaving] = useState(false);

  // Remove confirmation
  const [removeTag, setRemoveTag] = useState<Tag | null>(null);
  const [removeReason, setRemoveReason] = useState("");
  const [removeSaving, setRemoveSaving] = useState(false);

  // Batch print selection
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    if (subTab === "tags") {
      fetch("/api/admin/economy/tags")
        .then((r) => (r.ok ? r.json() : { tags: [] }))
        .then((data) => setTags(data.tags ?? []))
        .catch(() => setTags([]))
        .finally(() => setLoading(false));
    } else if (subTab === "banks") {
      fetch("/api/admin/economy/banks")
        .then((r) => (r.ok ? r.json() : { banks: [] }))
        .then((data) => setBanks(data.banks ?? []))
        .catch(() => setBanks([]))
        .finally(() => setLoading(false));
    }
  }, [subTab]);

  // Load characters when create/transfer forms open
  useEffect(() => {
    if (showCreateTag || transferTag) {
      fetch("/api/admin/characters")
        .then((r) => (r.ok ? r.json() : []))
        .then((data: { id: string; name: string; userName: string; status: string }[]) => {
          const chars = (Array.isArray(data) ? data : []).map((c) => ({
            id: c.id,
            name: c.name,
            playerName: c.userName,
            status: c.status,
          }));
          setCharacters(chars);
        })
        .catch(() => setCharacters([]));
    }
  }, [showCreateTag, transferTag]);

  const filteredCharacters = characters.filter(
    (c) =>
      c.name.toLowerCase().includes(charSearch.toLowerCase()) ||
      c.playerName.toLowerCase().includes(charSearch.toLowerCase())
  );

  const createTag = async () => {
    if (!tagForm.characterId || !tagForm.itemType || !tagForm.itemName || !tagForm.craftingSkill) {
      setTagError("Character, item type, item name, and crafting skill are required");
      return;
    }
    setTagSaving(true);
    setTagError("");
    try {
      const r = await fetch("/api/admin/economy/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: tagForm.characterId,
          itemType: tagForm.itemType,
          itemName: tagForm.itemName,
          itemDescription: tagForm.itemDescription || undefined,
          craftingSkill: tagForm.craftingSkill,
          craftingLevel: tagForm.craftingLevel,
          quantity: tagForm.quantity,
          primaryMaterial: tagForm.primaryMaterial || undefined,
          secondaryMaterial: tagForm.secondaryMaterial || undefined,
          masterCrafted: tagForm.masterCrafted,
        }),
      });
      if (!r.ok) {
        const data = await r.json();
        throw new Error(data.error || "Failed to create tag");
      }
      // Refresh tags list
      const refreshed = await fetch("/api/admin/economy/tags").then((r) =>
        r.ok ? r.json() : { tags: [] }
      );
      setTags(refreshed.tags ?? []);
      setShowCreateTag(false);
      setTagForm({
        characterId: "",
        itemType: "",
        itemName: "",
        itemDescription: "",
        craftingSkill: "",
        craftingLevel: 1,
        quantity: 1,
        primaryMaterial: "",
        secondaryMaterial: "",
        masterCrafted: false,
      });
      setCharSearch("");
    } catch (err) {
      setTagError(err instanceof Error ? err.message : "Failed to create tag");
    } finally {
      setTagSaving(false);
    }
  };

  const doTransfer = async () => {
    if (!transferTag || !transferTargetId) return;
    setTransferSaving(true);
    try {
      const r = await fetch(`/api/admin/economy/tags/${transferTag.id}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetCharacterId: transferTargetId }),
      });
      if (!r.ok) {
        const data = await r.json();
        throw new Error(data.error || "Transfer failed");
      }
      // Refresh
      const refreshed = await fetch("/api/admin/economy/tags").then((r) =>
        r.ok ? r.json() : { tags: [] }
      );
      setTags(refreshed.tags ?? []);
      setTransferTag(null);
      setTransferTargetId("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Transfer failed");
    } finally {
      setTransferSaving(false);
    }
  };

  const doRemove = async () => {
    if (!removeTag) return;
    setRemoveSaving(true);
    try {
      const r = await fetch(`/api/admin/economy/tags/${removeTag.id}/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: removeReason }),
      });
      if (!r.ok) {
        const data = await r.json();
        throw new Error(data.error || "Remove failed");
      }
      // Refresh
      const refreshed = await fetch("/api/admin/economy/tags").then((r) =>
        r.ok ? r.json() : { tags: [] }
      );
      setTags(refreshed.tags ?? []);
      setRemoveTag(null);
      setRemoveReason("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setRemoveSaving(false);
    }
  };

  const approveTag = async (tag: Tag) => {
    try {
      const r = await fetch(`/api/admin/economy/items/${tag.id}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (!r.ok) {
        const data = await r.json();
        throw new Error(data.error || "Approve failed");
      }
      const refreshed = await fetch("/api/admin/economy/tags").then((r) =>
        r.ok ? r.json() : { tags: [] }
      );
      setTags(refreshed.tags ?? []);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Approve failed");
    }
  };

  const denyTag = async (tag: Tag) => {
    try {
      const r = await fetch(`/api/admin/economy/items/${tag.id}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deny" }),
      });
      if (!r.ok) {
        const data = await r.json();
        throw new Error(data.error || "Deny failed");
      }
      const refreshed = await fetch("/api/admin/economy/tags").then((r) =>
        r.ok ? r.json() : { tags: [] }
      );
      setTags(refreshed.tags ?? []);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Deny failed");
    }
  };

  // Bank functions
  const loadTransactions = async (characterId: string) => {
    if (expandedBank === characterId) {
      setExpandedBank(null);
      return;
    }
    setExpandedBank(characterId);
    setLoadingTxns(true);
    try {
      const r = await fetch(`/api/admin/economy/banks/${characterId}`);
      if (r.ok) {
        const data = await r.json();
        setTransactions(data.bank?.transactions ?? []);
      } else {
        setTransactions([]);
      }
    } catch {
      setTransactions([]);
    } finally {
      setLoadingTxns(false);
    }
  };

  const submitTransaction = async (characterId: string) => {
    const amountCopper = Math.round(parseFloat(txnAmount) * 100);
    if (!txnAmount || isNaN(amountCopper) || !txnDesc.trim()) return;

    const signedAmount = ["withdrawal", "skill_training", "starting_equipment"].includes(txnType)
      ? -Math.abs(amountCopper)
      : Math.abs(amountCopper);

    setTxnSaving(true);
    try {
      const r = await fetch(`/api/admin/economy/banks/${characterId}/transaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: txnType, amount: signedAmount, description: txnDesc.trim() }),
      });
      if (r.ok) {
        const result = await r.json();
        setBanks((prev) =>
          prev.map((b) =>
            b.characterId === characterId
              ? { ...b, balance: result.newBalance, balanceFormatted: result.newBalanceFormatted }
              : b
          )
        );
        await loadTransactions(characterId);
        if (expandedBank !== characterId) {
          setExpandedBank(characterId);
        }
        setTxnForm(null);
        setTxnAmount("");
        setTxnDesc("");
        setTxnType("deposit");
      }
    } finally {
      setTxnSaving(false);
    }
  };

  const banksByPlayer = banks.reduce<Record<string, PlayerBank[]>>((acc, bank) => {
    if (!acc[bank.playerName]) acc[bank.playerName] = [];
    acc[bank.playerName].push(bank);
    return acc;
  }, {});

  const toggleTagSelection = (id: string) => {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllVisible = (visibleTags: Tag[]) => {
    const printableVisible = visibleTags.filter((t) => t.status === "approved" && t.tagCode);
    const allSelected = printableVisible.every((t) => selectedTagIds.has(t.id));
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        printableVisible.forEach((t) => next.delete(t.id));
      } else {
        printableVisible.forEach((t) => next.add(t.id));
      }
      return next;
    });
  };

  const openBatchPrint = () => {
    if (selectedTagIds.size === 0) return;
    const ids = Array.from(selectedTagIds).join(",");
    window.open(`/admin/print-tags?ids=${ids}`, "_blank");
  };

  const typeLabel = (type: string) =>
    (ITEM_TYPES as Record<string, string>)[type] ?? type;

  const inputClass =
    "bg-gray-800 text-white text-xs rounded px-2 py-1.5 border border-gray-700 w-full";

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {(["tags", "banks"] as SubTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              subTab === tab
                ? "bg-amber-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {tab === "tags" ? "Tags" : "Player Banks"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-gray-500 text-center py-8">Loading...</div>
      ) : subTab === "tags" ? (
        <div className="space-y-4">
          {/* Source filter tabs + Create tag button */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {(
                [
                  ["all", "All"],
                  ["player_signout", "Player Requests"],
                  ["gm_encounter", "GM Requests"],
                  ["econ_created", "Econ Created"],
                ] as [SourceFilter, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSourceFilter(key)}
                  className={`px-2.5 py-1 rounded text-xs font-medium ${
                    sourceFilter === key
                      ? "bg-amber-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {label}
                  {key !== "all" && (
                    <span className="ml-1 opacity-70">
                      ({tags.filter((t) => t.source === key).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {selectedTagIds.size > 0 && (
                <button
                  onClick={openBatchPrint}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-700 text-white hover:bg-green-600"
                >
                  Print {selectedTagIds.size} Tag{selectedTagIds.size !== 1 ? "s" : ""}
                </button>
              )}
              <button
                onClick={() => setShowCreateTag(!showCreateTag)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-600 text-white hover:bg-amber-500"
              >
                {showCreateTag ? "Cancel" : "+ Create Tag"}
              </button>
            </div>
          </div>

          {/* Create tag form */}
          {showCreateTag && (
            <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-4 space-y-3">
              <h3 className="text-white font-medium text-sm">Create New Tag</h3>

              {tagError && (
                <div className="bg-red-900/30 border border-red-700 rounded p-2 text-red-300 text-xs">
                  {tagError}
                </div>
              )}

              {/* Character search */}
              <div>
                <label className="text-gray-400 text-xs block mb-1">Assign to Character *</label>
                <input
                  type="text"
                  placeholder="Search by character or player name..."
                  value={charSearch}
                  onChange={(e) => setCharSearch(e.target.value)}
                  className={inputClass}
                />
                {charSearch && (
                  <div className="mt-1 max-h-32 overflow-y-auto bg-gray-800 border border-gray-700 rounded">
                    {filteredCharacters.length === 0 ? (
                      <div className="px-2 py-1.5 text-gray-500 text-xs">No matches</div>
                    ) : (
                      filteredCharacters.slice(0, 10).map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setTagForm((prev) => ({ ...prev, characterId: c.id }));
                            setCharSearch(`${c.name} (${c.playerName})`);
                          }}
                          className={`w-full text-left px-2 py-1.5 text-xs hover:bg-gray-700 ${
                            tagForm.characterId === c.id
                              ? "bg-amber-900/30 text-amber-300"
                              : "text-gray-300"
                          }`}
                        >
                          {c.name}{" "}
                          <span className="text-gray-500">— {c.playerName}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
                {tagForm.characterId && !charSearch.includes("(") && (
                  <div className="text-amber-400 text-xs mt-1">
                    Selected: {characters.find((c) => c.id === tagForm.characterId)?.name}
                  </div>
                )}
              </div>

              {/* Item details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs block mb-1">Item Type *</label>
                  <select
                    value={tagForm.itemType}
                    onChange={(e) => setTagForm((prev) => ({ ...prev, itemType: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="">Select type...</option>
                    {ITEM_TYPE_OPTIONS.map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs block mb-1">Item Name *</label>
                  <input
                    type="text"
                    value={tagForm.itemName}
                    onChange={(e) => setTagForm((prev) => ({ ...prev, itemName: e.target.value }))}
                    className={inputClass}
                    placeholder="Name of the item"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-gray-400 text-xs block mb-1">Crafting Skill *</label>
                  <select
                    value={tagForm.craftingSkill}
                    onChange={(e) =>
                      setTagForm((prev) => ({ ...prev, craftingSkill: e.target.value }))
                    }
                    className={inputClass}
                  >
                    <option value="">Select skill...</option>
                    {CRAFTING_SKILLS.map((skill) => (
                      <option key={skill} value={skill}>
                        {skill}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs block mb-1">Level</label>
                  <input
                    type="number"
                    min="1"
                    max="9"
                    value={tagForm.craftingLevel}
                    onChange={(e) =>
                      setTagForm((prev) => ({
                        ...prev,
                        craftingLevel: parseInt(e.target.value) || 1,
                      }))
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs block mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={tagForm.quantity}
                    onChange={(e) =>
                      setTagForm((prev) => ({
                        ...prev,
                        quantity: parseInt(e.target.value) || 1,
                      }))
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs block mb-1">Primary Material</label>
                  <select
                    value={tagForm.primaryMaterial}
                    onChange={(e) =>
                      setTagForm((prev) => ({ ...prev, primaryMaterial: e.target.value }))
                    }
                    className={inputClass}
                  >
                    <option value="">None</option>
                    {ALL_MATERIALS.map((mat) => (
                      <option key={mat} value={mat}>{mat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs block mb-1">Secondary Material</label>
                  <select
                    value={tagForm.secondaryMaterial}
                    onChange={(e) =>
                      setTagForm((prev) => ({ ...prev, secondaryMaterial: e.target.value }))
                    }
                    className={inputClass}
                  >
                    <option value="">None</option>
                    {ALL_MATERIALS.map((mat) => (
                      <option key={mat} value={mat}>{mat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-xs block mb-1">Description</label>
                <input
                  type="text"
                  value={tagForm.itemDescription}
                  onChange={(e) =>
                    setTagForm((prev) => ({ ...prev, itemDescription: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="Optional description"
                />
              </div>

              <label className="flex items-center gap-2 text-gray-300 text-xs">
                <input
                  type="checkbox"
                  checked={tagForm.masterCrafted}
                  onChange={(e) =>
                    setTagForm((prev) => ({ ...prev, masterCrafted: e.target.checked }))
                  }
                />
                Master Crafted
              </label>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowCreateTag(false)}
                  className="px-3 py-1.5 rounded text-xs bg-gray-700 text-gray-300 hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={createTag}
                  disabled={tagSaving}
                  className="px-3 py-1.5 rounded text-xs bg-amber-600 text-white hover:bg-amber-500 disabled:opacity-50"
                >
                  {tagSaving ? "Creating..." : "Create Tag"}
                </button>
              </div>
            </div>
          )}

          {/* Transfer modal */}
          {transferTag && (
            <div className="bg-blue-900/20 rounded-lg border border-blue-800 p-4 space-y-3">
              <h3 className="text-white font-medium text-sm">
                Transfer Tag #{transferTag.tagCode} — {transferTag.itemName}
              </h3>
              <p className="text-gray-400 text-xs">
                Currently held by: {transferTag.characterName} ({transferTag.playerName})
              </p>
              <div>
                <label className="text-gray-400 text-xs block mb-1">Transfer to:</label>
                <select
                  value={transferTargetId}
                  onChange={(e) => setTransferTargetId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select character...</option>
                  {characters
                    .filter((c) => c.id !== transferTag.characterId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {c.playerName}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setTransferTag(null); setTransferTargetId(""); }}
                  className="px-3 py-1.5 rounded text-xs bg-gray-700 text-gray-300 hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={doTransfer}
                  disabled={transferSaving || !transferTargetId}
                  className="px-3 py-1.5 rounded text-xs bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {transferSaving ? "Transferring..." : "Transfer"}
                </button>
              </div>
            </div>
          )}

          {/* Remove confirmation */}
          {removeTag && (
            <div className="bg-red-900/20 rounded-lg border border-red-800 p-4 space-y-3">
              <h3 className="text-white font-medium text-sm">
                Remove Tag #{removeTag.tagCode} — {removeTag.itemName}
              </h3>
              <p className="text-gray-400 text-xs">
                This will remove the tag from {removeTag.characterName}. This action is logged.
              </p>
              <div>
                <label className="text-gray-400 text-xs block mb-1">Reason (optional):</label>
                <input
                  type="text"
                  value={removeReason}
                  onChange={(e) => setRemoveReason(e.target.value)}
                  className={inputClass}
                  placeholder="Why is this tag being removed?"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setRemoveTag(null); setRemoveReason(""); }}
                  className="px-3 py-1.5 rounded text-xs bg-gray-700 text-gray-300 hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={doRemove}
                  disabled={removeSaving}
                  className="px-3 py-1.5 rounded text-xs bg-red-600 text-white hover:bg-red-500 disabled:opacity-50"
                >
                  {removeSaving ? "Removing..." : "Remove Tag"}
                </button>
              </div>
            </div>
          )}

          {/* Tags list */}
          {(() => {
            const filteredTags = sourceFilter === "all"
              ? tags
              : tags.filter((t) => t.source === sourceFilter);
            return filteredTags.length === 0 ? (
            <div className="text-center py-12 bg-gray-900/30 rounded-lg border border-gray-800">
              <p className="text-gray-500">No tags created yet.</p>
              <p className="text-gray-600 text-xs mt-2">
                Use &ldquo;Create Tag&rdquo; to create and assign tags to characters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-700">
                    <th className="py-2 px-2 w-8">
                      <input
                        type="checkbox"
                        checked={
                          filteredTags.filter((t) => t.status === "approved" && t.tagCode).length > 0 &&
                          filteredTags.filter((t) => t.status === "approved" && t.tagCode).every((t) => selectedTagIds.has(t.id))
                        }
                        onChange={() => toggleSelectAllVisible(filteredTags)}
                        className="accent-amber-600"
                        title="Select all approved tags"
                      />
                    </th>
                    <th className="text-left py-2 px-3">Tag #</th>
                    <th className="text-left py-2 px-3">Source</th>
                    <th className="text-left py-2 px-3">Type</th>
                    <th className="text-left py-2 px-3">Name</th>
                    <th className="text-left py-2 px-3">Character</th>
                    <th className="text-left py-2 px-3">Player</th>
                    <th className="text-center py-2 px-3">Status</th>
                    <th className="text-right py-2 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTags.map((tag) => (
                    <tr key={tag.id} className={`border-b border-gray-800 ${selectedTagIds.has(tag.id) ? "bg-amber-900/10" : ""}`}>
                      <td className="py-2 px-2">
                        {tag.status === "approved" && tag.tagCode ? (
                          <input
                            type="checkbox"
                            checked={selectedTagIds.has(tag.id)}
                            onChange={() => toggleTagSelection(tag.id)}
                            className="accent-amber-600"
                          />
                        ) : (
                          <span />
                        )}
                      </td>
                      <td className="py-2 px-3 text-amber-400 font-mono text-xs">
                        {tag.tagCode ? (
                          <a
                            href={`/t/${tag.tagCode}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            #{tag.tagCode}
                          </a>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            SOURCE_COLORS[tag.source] ?? "bg-gray-800 text-gray-400"
                          }`}
                        >
                          {SOURCE_LABELS[tag.source] ?? tag.source}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-400 text-xs">
                        {tag.itemType === "coin_award" ? (
                          <span className="text-amber-400 font-medium">Coin Award</span>
                        ) : typeLabel(tag.itemType)}
                      </td>
                      <td className="py-2 px-3 text-white">
                        {tag.itemType === "coin_award" ? (
                          <>
                            <span className="text-amber-300 font-medium">{tag.quantity / 100} silver</span>
                            {tag.itemDescription && (
                              <span className="text-gray-500 text-xs ml-2">— {tag.itemDescription}</span>
                            )}
                          </>
                        ) : tag.itemName}
                        {tag.masterCrafted && (
                          <span className="ml-1 px-1 py-0.5 rounded text-[10px] font-bold bg-purple-900 text-purple-300">
                            MC
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-gray-300">{tag.characterName}</td>
                      <td className="py-2 px-3 text-gray-400">{tag.playerName}</td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            tag.status === "approved"
                              ? "bg-green-900 text-green-300"
                              : tag.status === "removed"
                                ? "bg-red-900 text-red-300"
                                : "bg-yellow-900 text-yellow-300"
                          }`}
                        >
                          {tag.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        {tag.status === "pending" && (
                          <div className="flex gap-1 justify-end">
                            <button
                              onClick={() => approveTag(tag)}
                              className="px-2 py-0.5 rounded text-xs bg-green-800 text-green-300 hover:bg-green-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => denyTag(tag)}
                              className="px-2 py-0.5 rounded text-xs bg-red-800 text-red-300 hover:bg-red-700"
                            >
                              Deny
                            </button>
                          </div>
                        )}
                        {tag.status === "approved" && (
                          <div className="flex gap-1 justify-end">
                            {tag.itemType !== "coin_award" && (
                              <button
                                onClick={() => setTransferTag(tag)}
                                className="px-2 py-0.5 rounded text-xs bg-blue-800 text-blue-300 hover:bg-blue-700"
                              >
                                Transfer
                              </button>
                            )}
                            <button
                              onClick={() => setRemoveTag(tag)}
                              className="px-2 py-0.5 rounded text-xs bg-red-800 text-red-300 hover:bg-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          })()}
        </div>
      ) : subTab === "banks" ? (
        <BanksView
          banksByPlayer={banksByPlayer}
          expandedBank={expandedBank}
          loadTransactions={loadTransactions}
          loadingTxns={loadingTxns}
          transactions={transactions}
          txnForm={txnForm}
          setTxnForm={setTxnForm}
          txnType={txnType}
          setTxnType={setTxnType}
          txnAmount={txnAmount}
          setTxnAmount={setTxnAmount}
          txnDesc={txnDesc}
          setTxnDesc={setTxnDesc}
          txnSaving={txnSaving}
          submitTransaction={submitTransaction}
        />
      ) : null}
    </div>
  );
}

function BanksView({
  banksByPlayer,
  expandedBank,
  loadTransactions,
  loadingTxns,
  transactions,
  txnForm,
  setTxnForm,
  txnType,
  setTxnType,
  txnAmount,
  setTxnAmount,
  txnDesc,
  setTxnDesc,
  txnSaving,
  submitTransaction,
}: {
  banksByPlayer: Record<string, PlayerBank[]>;
  expandedBank: string | null;
  loadTransactions: (id: string) => Promise<void>;
  loadingTxns: boolean;
  transactions: Transaction[];
  txnForm: { characterId: string } | null;
  setTxnForm: (v: { characterId: string } | null) => void;
  txnType: string;
  setTxnType: (v: string) => void;
  txnAmount: string;
  setTxnAmount: (v: string) => void;
  txnDesc: string;
  setTxnDesc: (v: string) => void;
  txnSaving: boolean;
  submitTransaction: (id: string) => Promise<void>;
}) {
  if (Object.keys(banksByPlayer).length === 0) {
    return (
      <div className="text-center py-12 bg-gray-900/30 rounded-lg border border-gray-800">
        <p className="text-gray-500">No player banks found.</p>
        <p className="text-gray-600 text-xs mt-2">
          Banks are created when a character is approved.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(banksByPlayer)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([playerName, playerBanks]) => (
          <div key={playerName} className="bg-gray-900/50 rounded-lg border border-gray-800">
            <div className="px-4 py-3 border-b border-gray-800">
              <h3 className="text-white font-medium text-sm">{playerName}</h3>
              <p className="text-gray-500 text-xs">
                {playerBanks.length} character{playerBanks.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="divide-y divide-gray-800">
              {playerBanks.map((bank) => (
                <div key={bank.id}>
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-800/50"
                    onClick={() => loadTransactions(bank.characterId)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-gray-300">{bank.characterName}</span>
                      <span
                        className={`font-bold text-sm ${
                          bank.balance < 0 ? "text-red-400" : "text-amber-400"
                        }`}
                      >
                        {bank.balanceFormatted || formatSilver(bank.balance)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTxnForm(
                            txnForm?.characterId === bank.characterId
                              ? null
                              : { characterId: bank.characterId }
                          );
                        }}
                        className="px-2 py-1 rounded text-xs bg-amber-800 text-amber-200 hover:bg-amber-700"
                      >
                        + Transaction
                      </button>
                      <span className="text-gray-600 text-xs">
                        {expandedBank === bank.characterId ? "▲" : "▼"}
                      </span>
                    </div>
                  </div>

                  {txnForm?.characterId === bank.characterId && (
                    <div className="px-4 py-3 bg-gray-800/30 border-t border-gray-800">
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <select
                          value={txnType}
                          onChange={(e) => setTxnType(e.target.value)}
                          className="bg-gray-800 text-white text-xs rounded px-2 py-1.5 border border-gray-700"
                        >
                          <option value="deposit">Deposit</option>
                          <option value="withdrawal">Withdrawal</option>
                          <option value="profession_earning">Profession Earning</option>
                          <option value="skill_training">Skill Training</option>
                          <option value="admin_adjustment">Adjustment</option>
                        </select>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Amount (silver)"
                          value={txnAmount}
                          onChange={(e) => setTxnAmount(e.target.value)}
                          className="bg-gray-800 text-white text-xs rounded px-2 py-1.5 border border-gray-700"
                        />
                        <input
                          type="text"
                          placeholder="Reason"
                          value={txnDesc}
                          onChange={(e) => setTxnDesc(e.target.value)}
                          className="bg-gray-800 text-white text-xs rounded px-2 py-1.5 border border-gray-700"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setTxnForm(null)}
                          className="px-3 py-1 rounded text-xs bg-gray-700 text-gray-300 hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => submitTransaction(bank.characterId)}
                          disabled={txnSaving || !txnAmount || !txnDesc.trim()}
                          className="px-3 py-1 rounded text-xs bg-amber-600 text-white hover:bg-amber-500 disabled:opacity-50"
                        >
                          {txnSaving ? "Saving..." : "Add"}
                        </button>
                      </div>
                    </div>
                  )}

                  {expandedBank === bank.characterId && (
                    <div className="px-4 py-3 bg-gray-950/50 border-t border-gray-800">
                      {loadingTxns ? (
                        <div className="text-gray-500 text-xs text-center py-2">
                          Loading transactions...
                        </div>
                      ) : transactions.length === 0 ? (
                        <div className="text-gray-600 text-xs text-center py-2">
                          No transactions yet.
                        </div>
                      ) : (
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-gray-500 border-b border-gray-800">
                              <th className="text-left py-1.5 pr-2">Date</th>
                              <th className="text-left py-1.5 pr-2">Type</th>
                              <th className="text-left py-1.5 pr-2">Description</th>
                              <th className="text-right py-1.5">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {transactions.map((txn) => (
                              <tr key={txn.id} className="border-b border-gray-800/50">
                                <td className="py-1.5 pr-2 text-gray-500">
                                  {new Date(txn.createdAt).toLocaleDateString()}
                                </td>
                                <td className="py-1.5 pr-2 text-gray-400">
                                  {TRANSACTION_TYPE_LABELS[txn.type] ?? txn.type}
                                </td>
                                <td className="py-1.5 pr-2 text-gray-300">{txn.description}</td>
                                <td
                                  className={`py-1.5 text-right font-medium ${
                                    txn.amount >= 0 ? "text-green-400" : "text-red-400"
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
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
