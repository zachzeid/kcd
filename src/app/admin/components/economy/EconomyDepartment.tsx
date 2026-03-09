"use client";

import { useEffect, useState } from "react";

interface ItemSubmission {
  id: string;
  itemType: string;
  itemName: string;
  characterName: string;
  playerName: string;
  status: string;
  submittedAt: string;
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

type SubTab = "items" | "banks" | "earning";

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

export default function EconomyDepartment() {
  const [subTab, setSubTab] = useState<SubTab>("items");
  const [items, setItems] = useState<ItemSubmission[]>([]);
  const [banks, setBanks] = useState<PlayerBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBank, setExpandedBank] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTxns, setLoadingTxns] = useState(false);

  // Add transaction form
  const [txnForm, setTxnForm] = useState<{ characterId: string } | null>(null);
  const [txnType, setTxnType] = useState("deposit");
  const [txnAmount, setTxnAmount] = useState("");
  const [txnDesc, setTxnDesc] = useState("");
  const [txnSaving, setTxnSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    if (subTab === "items") {
      fetch("/api/admin/economy/items")
        .then((r) => (r.ok ? r.json() : { items: [] }))
        .then((data) => setItems(data.items ?? []))
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    } else if (subTab === "banks") {
      fetch("/api/admin/economy/banks")
        .then((r) => (r.ok ? r.json() : { banks: [] }))
        .then((data) => setBanks(data.banks ?? []))
        .catch(() => setBanks([]))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [subTab]);

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

    // Withdrawals and expenses are negative
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
        // Update balance in banks list
        setBanks((prev) =>
          prev.map((b) =>
            b.characterId === characterId
              ? { ...b, balance: result.newBalance, balanceFormatted: result.newBalanceFormatted }
              : b
          )
        );
        // Reload transactions
        await loadTransactions(characterId);
        // Expand again since loadTransactions toggles
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

  // Group banks by player
  const banksByPlayer = banks.reduce<Record<string, PlayerBank[]>>((acc, bank) => {
    if (!acc[bank.playerName]) acc[bank.playerName] = [];
    acc[bank.playerName].push(bank);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {(["items", "banks", "earning"] as SubTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              subTab === tab
                ? "bg-amber-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {tab === "items" ? "Item Submissions" : tab === "banks" ? "Player Banks" : "Coin Earning"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-gray-500 text-center py-8">Loading...</div>
      ) : subTab === "items" ? (
        <ItemsView items={items} />
      ) : subTab === "banks" ? (
        <div className="space-y-4">
          {Object.keys(banksByPlayer).length === 0 ? (
            <div className="text-center py-12 bg-gray-900/30 rounded-lg border border-gray-800">
              <p className="text-gray-500">No player banks found.</p>
              <p className="text-gray-600 text-xs mt-2">
                Banks are created when a character is approved.
              </p>
            </div>
          ) : (
            Object.entries(banksByPlayer)
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

                        {/* Add transaction form */}
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
                                placeholder="Reason (e.g. Carpentry II for the Barony)"
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

                        {/* Transaction history */}
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
                                      <td className="py-1.5 pr-2 text-gray-300">
                                        {txn.description}
                                      </td>
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
              ))
          )}
        </div>
      ) : (
        <CoinEarningView />
      )}
    </div>
  );
}

// === Profession Earning Rate Tables (copper) ===
const PROFESSION_RATES: Record<string, { standard: number; winter: number }> = {
  novice:     { standard: 800,  winter: 4000 },
  trainee:    { standard: 1600, winter: 8000 },
  apprentice: { standard: 2400, winter: 12000 },
  journeyman: { standard: 3200, winter: 16000 },
  master:     { standard: 4000, winter: 20000 },
};

function craftLevelToTier(level: number): string {
  if (level <= 1) return "novice";
  if (level <= 2) return "trainee";
  if (level <= 3) return "apprentice";
  if (level <= 4) return "journeyman";
  return "master";
}

interface TradeSkillInfo {
  skillName: string;
  specialization?: string;
  level: number;
}

interface ProfessionCharacter {
  characterId: string;
  characterName: string;
  playerName: string;
  characterClass: string;
  level: number;
  tradeSkills: TradeSkillInfo[];
}

interface EarningRow {
  characterId: string;
  characterName: string;
  playerName: string;
  skillName: string;
  skillLevel: number;
  tier: string;
  amount: number;
  selected: boolean;
}

interface ProcessResult {
  characterId: string;
  skillName: string;
  tier: string;
  amount: number;
  amountFormatted: string;
  newBalance: number;
  newBalanceFormatted: string;
}

function CoinEarningView() {
  const [characters, setCharacters] = useState<ProfessionCharacter[]>([]);
  const [rows, setRows] = useState<EarningRow[]>([]);
  const [isWinter, setIsWinter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<ProcessResult[] | null>(null);
  const [errors, setErrors] = useState<{ characterId: string; error: string }[]>([]);

  // Load characters with trade skills
  useEffect(() => {
    fetch("/api/admin/economy/profession-earnings")
      .then((r) => (r.ok ? r.json() : { characters: [] }))
      .then((data) => {
        const chars: ProfessionCharacter[] = data.characters ?? [];
        setCharacters(chars);
        buildRows(chars, false);
      })
      .catch(() => setCharacters([]))
      .finally(() => setLoading(false));
  }, []);

  function buildRows(chars: ProfessionCharacter[], winter: boolean) {
    const newRows: EarningRow[] = [];
    for (const char of chars) {
      for (const skill of char.tradeSkills) {
        const tier = craftLevelToTier(skill.level);
        const season = winter ? "winter" : "standard";
        const amount = PROFESSION_RATES[tier][season];
        newRows.push({
          characterId: char.characterId,
          characterName: char.characterName,
          playerName: char.playerName,
          skillName: skill.specialization
            ? `${skill.skillName} (${skill.specialization})`
            : skill.skillName,
          skillLevel: skill.level,
          tier,
          amount,
          selected: true,
        });
      }
    }
    setRows(newRows);
  }

  function toggleWinter(winter: boolean) {
    setIsWinter(winter);
    buildRows(characters, winter);
  }

  function toggleRow(index: number) {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, selected: !r.selected } : r))
    );
  }

  function toggleAll(selected: boolean) {
    setRows((prev) => prev.map((r) => ({ ...r, selected })));
  }

  async function processEarnings() {
    const selected = rows.filter((r) => r.selected);
    if (selected.length === 0) return;

    setProcessing(true);
    setResults(null);
    setErrors([]);

    try {
      const r = await fetch("/api/admin/economy/profession-earnings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          earnings: selected.map((row) => ({
            characterId: row.characterId,
            skillName: row.skillName,
            skillLevel: row.skillLevel,
            isWinter,
          })),
        }),
      });

      if (r.ok) {
        const data = await r.json();
        setResults(data.results ?? []);
        setErrors(data.errors ?? []);
      } else {
        const err = await r.json().catch(() => ({ error: "Failed to process" }));
        setErrors([{ characterId: "", error: err.error ?? "Request failed" }]);
      }
    } catch {
      setErrors([{ characterId: "", error: "Network error" }]);
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return <div className="text-gray-500 text-center py-8">Loading profession data...</div>;
  }

  const selectedCount = rows.filter((r) => r.selected).length;
  const totalEarning = rows.filter((r) => r.selected).reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-4">
      {/* Results banner */}
      {results && (
        <div className="p-4 rounded-lg border border-green-800/50 bg-green-900/20">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-green-400 font-bold text-sm">
              Processed {results.length} earning{results.length !== 1 ? "s" : ""}
            </h3>
            <button
              onClick={() => setResults(null)}
              className="text-gray-400 hover:text-white text-xs"
            >
              Dismiss
            </button>
          </div>
          <div className="space-y-1">
            {results.map((r, i) => (
              <div key={i} className="text-xs flex items-center justify-between">
                <span className="text-gray-300">
                  {r.skillName} ({r.tier})
                </span>
                <span className="text-green-400">+{r.amountFormatted} → {r.newBalanceFormatted}</span>
              </div>
            ))}
          </div>
          {errors.length > 0 && (
            <div className="mt-2 pt-2 border-t border-red-800/30">
              {errors.map((e, i) => (
                <div key={i} className="text-red-400 text-xs">{e.error}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="text-center py-12 bg-gray-900/30 rounded-lg border border-gray-800">
          <p className="text-gray-500">No characters with trade professions found.</p>
          <p className="text-gray-600 text-xs mt-2">
            Approved characters with Craft, Herbalism, Forensics, or Pick Locks skills will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isWinter}
                  onChange={(e) => toggleWinter(e.target.checked)}
                  className="rounded border-gray-600 bg-gray-800 text-amber-500"
                />
                <span className="text-sm text-gray-300">Winter Period</span>
                <span className="text-xs text-gray-500">(5x rates)</span>
              </label>
              <span className="text-xs text-gray-500">
                {selectedCount} of {rows.length} selected
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-amber-400">
                Total: {formatSilver(totalEarning)}
              </span>
              <button
                onClick={processEarnings}
                disabled={processing || selectedCount === 0}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-600 text-white hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? "Processing..." : `Process ${selectedCount} Earning${selectedCount !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-700">
                  <th className="text-left py-2 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={selectedCount === rows.length}
                      onChange={(e) => toggleAll(e.target.checked)}
                      className="rounded border-gray-600 bg-gray-800 text-amber-500"
                    />
                  </th>
                  <th className="text-left py-2 px-3">Character</th>
                  <th className="text-left py-2 px-3">Player</th>
                  <th className="text-left py-2 px-3">Profession</th>
                  <th className="text-center py-2 px-3">Level</th>
                  <th className="text-center py-2 px-3">Tier</th>
                  <th className="text-right py-2 px-3">Earning</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={`${row.characterId}-${row.skillName}`}
                    className={`border-b border-gray-800 ${row.selected ? "" : "opacity-40"}`}
                  >
                    <td className="py-1.5 px-3">
                      <input
                        type="checkbox"
                        checked={row.selected}
                        onChange={() => toggleRow(i)}
                        className="rounded border-gray-600 bg-gray-800 text-amber-500"
                      />
                    </td>
                    <td className="py-1.5 px-3 text-white">{row.characterName}</td>
                    <td className="py-1.5 px-3 text-gray-400">{row.playerName}</td>
                    <td className="py-1.5 px-3 text-gray-300">{row.skillName}</td>
                    <td className="py-1.5 px-3 text-center text-gray-400">{row.skillLevel}</td>
                    <td className="py-1.5 px-3 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        row.tier === "master" ? "bg-purple-900 text-purple-300" :
                        row.tier === "journeyman" ? "bg-blue-900 text-blue-300" :
                        row.tier === "apprentice" ? "bg-green-900 text-green-300" :
                        row.tier === "trainee" ? "bg-yellow-900 text-yellow-300" :
                        "bg-gray-800 text-gray-400"
                      }`}>
                        {row.tier}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-right text-amber-400 font-medium">
                      {formatSilver(row.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function ItemsView({ items }: { items: ItemSubmission[] }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-900/30 rounded-lg border border-gray-800">
        <p className="text-gray-500">No pending item submissions.</p>
        <p className="text-gray-600 text-xs mt-2">
          Item submissions from players will appear here for approval.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 border-b border-gray-700">
            <th className="text-left py-2 px-3">Item Type</th>
            <th className="text-left py-2 px-3">Item Name</th>
            <th className="text-left py-2 px-3">Character</th>
            <th className="text-left py-2 px-3">Player</th>
            <th className="text-center py-2 px-3">Status</th>
            <th className="text-left py-2 px-3">Submitted</th>
            <th className="text-right py-2 px-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-gray-800">
              <td className="py-2 px-3 text-gray-400">{item.itemType}</td>
              <td className="py-2 px-3 text-white">{item.itemName}</td>
              <td className="py-2 px-3 text-gray-300">{item.characterName}</td>
              <td className="py-2 px-3 text-gray-400">{item.playerName}</td>
              <td className="py-2 px-3 text-center">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold ${
                    item.status === "approved"
                      ? "bg-green-900 text-green-300"
                      : item.status === "denied"
                        ? "bg-red-900 text-red-300"
                        : "bg-yellow-900 text-yellow-300"
                  }`}
                >
                  {item.status}
                </span>
              </td>
              <td className="py-2 px-3 text-gray-500 text-xs">
                {new Date(item.submittedAt).toLocaleString()}
              </td>
              <td className="py-2 px-3 text-right">
                {item.status === "pending" && (
                  <div className="flex gap-1 justify-end">
                    <button className="px-2 py-0.5 rounded text-xs bg-green-800 text-green-300 hover:bg-green-700">
                      Approve
                    </button>
                    <button className="px-2 py-0.5 rounded text-xs bg-red-800 text-red-300 hover:bg-red-700">
                      Deny
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
}
