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
        <div className="text-center py-12 bg-gray-900/30 rounded-lg border border-gray-800">
          <p className="text-gray-500">Coin Earning</p>
          <p className="text-gray-600 text-xs mt-2">
            Batch profession earning processing will be available here. This feature allows economy
            marshals to process coin earning for all characters with professions after an event.
          </p>
        </div>
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
