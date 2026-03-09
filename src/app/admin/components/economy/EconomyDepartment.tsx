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

interface PlayerBank {
  id: string;
  characterName: string;
  playerName: string;
  balance: number;
  lastTransaction: string | null;
}

type SubTab = "items" | "banks" | "earning";

export default function EconomyDepartment() {
  const [subTab, setSubTab] = useState<SubTab>("items");
  const [items, setItems] = useState<ItemSubmission[]>([]);
  const [banks, setBanks] = useState<PlayerBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);

  useEffect(() => {
    if (subTab === "items") {
      fetch("/api/admin/economy/items")
        .then((r) => {
          if (r.ok) return r.json();
          return { items: [] };
        })
        .then((data) => setItems(data.items ?? []))
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    } else if (subTab === "banks") {
      fetch("/api/admin/economy/banks")
        .then((r) => {
          if (r.ok) return r.json();
          return { banks: [] };
        })
        .then((data) => setBanks(data.banks ?? []))
        .catch(() => setBanks([]))
        .finally(() => setLoading(false));
    }
  }, [subTab]);

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSubTab("items")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
            subTab === "items"
              ? "bg-amber-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          Item Submissions
        </button>
        <button
          onClick={() => setSubTab("banks")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
            subTab === "banks"
              ? "bg-amber-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          Player Banks
        </button>
        <button
          onClick={() => setSubTab("earning")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
            subTab === "earning"
              ? "bg-amber-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          Coin Earning
        </button>
      </div>

      {loading ? (
        <div className="text-gray-500 text-center py-8">Loading...</div>
      ) : subTab === "items" ? (
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-12 bg-gray-900/30 rounded-lg border border-gray-800">
              <p className="text-gray-500">No pending item submissions.</p>
              <p className="text-gray-600 text-xs mt-2">
                Item submissions from players will appear here for approval.
              </p>
            </div>
          ) : (
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
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          item.status === "approved" ? "bg-green-900 text-green-300" :
                          item.status === "denied" ? "bg-red-900 text-red-300" :
                          "bg-yellow-900 text-yellow-300"
                        }`}>
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
          )}
        </div>
      ) : subTab === "banks" ? (
        <div className="space-y-3">
          {banks.length === 0 ? (
            <div className="text-center py-12 bg-gray-900/30 rounded-lg border border-gray-800">
              <p className="text-gray-500">No player banks found.</p>
              <p className="text-gray-600 text-xs mt-2">
                Character bank accounts will appear here once economy data is available.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {banks.map((bank) => (
                <div
                  key={bank.id}
                  className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-800 cursor-pointer hover:border-gray-700"
                  onClick={() => setSelectedBank(selectedBank === bank.id ? null : bank.id)}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{bank.characterName}</span>
                      <span className="text-amber-400 font-bold">{bank.balance} coin</span>
                    </div>
                    <div className="text-gray-500 text-sm">Player: {bank.playerName}</div>
                    {bank.lastTransaction && (
                      <div className="text-gray-600 text-xs mt-1">
                        Last transaction: {new Date(bank.lastTransaction).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <span className="text-gray-600 text-xs">
                    {selectedBank === bank.id ? "Hide" : "View"} History
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-900/30 rounded-lg border border-gray-800">
          <p className="text-gray-500">Coin Earning</p>
          <p className="text-gray-600 text-xs mt-2">
            Batch profession earning processing will be available here.
            This feature allows economy marshals to process coin earning for all characters
            with professions after an event.
          </p>
        </div>
      )}
    </div>
  );
}
