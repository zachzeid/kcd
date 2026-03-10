"use client";

import { PurchasedEquipment, PurchasedSkill } from "@/types/character";
import { startingEquipment, equipmentCategories } from "@/data/equipment";
import { useState } from "react";

interface Props {
  purchasedEquipment: PurchasedEquipment[];
  purchasedSkills: PurchasedSkill[];
  silverRemaining: number;
  onAddItem: (itemName: string, cost: number) => void;
  onRemoveItem: (itemName: string, cost: number) => void;
}

export default function EquipmentStep({
  purchasedEquipment,
  purchasedSkills,
  silverRemaining,
  onAddItem,
  onRemoveItem,
}: Props) {
  // Check if character has a skill, supporting leveled requirements like "Alchemy 3"
  const hasSkill = (requirement: string) => {
    // Parse "SkillName N" format (e.g. "Alchemy 1", "Potions 3")
    const match = requirement.match(/^(.+?)\s+(\d+)$/);
    if (match) {
      const baseName = match[1];
      const requiredLevel = parseInt(match[2]);
      return purchasedSkills.some((s) => s.skillName === baseName && s.purchaseCount >= requiredLevel);
    }
    // Plain skill name
    return purchasedSkills.some((s) => s.skillName === requirement && s.purchaseCount >= 1);
  };
  const [activeCategory, setActiveCategory] = useState("Miscellaneous");

  const getQuantity = (itemName: string) => {
    const found = purchasedEquipment.find((e) => e.itemName === itemName);
    return found ? found.quantity : 0;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-amber-400">Starting Equipment</h2>
        <div className="text-right">
          <div className="text-sm text-gray-400">Silver Remaining</div>
          <div
            className={`text-2xl font-bold ${
              silverRemaining < 0 ? "text-red-500" : "text-green-400"
            }`}
          >
            {silverRemaining} / 50
          </div>
        </div>
      </div>

      <p className="text-gray-400 text-sm">
        Each character starts with 50 silver. Unspent silver goes to your player bank.
        These are creation-only prices. Consumables require the associated crafting skill.
        Max 5 of any consumable sub-category.
      </p>

      <div className="flex flex-wrap gap-1">
        {equipmentCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeCategory === cat
                ? "bg-amber-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {startingEquipment
          .filter((item) => item.category === activeCategory)
          .map((item) => {
            const qty = getQuantity(item.name);
            const maxQty = item.maxAtCreation ?? 99;
            const meetsSkillReq = !item.requiresSkill || hasSkill(item.requiresSkill);
            const canBuyMore = qty < maxQty && silverRemaining >= item.cost && meetsSkillReq;

            return (
              <div
                key={item.name}
                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700"
              >
                <div className="flex-1">
                  <span className="text-white font-medium text-sm">{item.name}</span>
                  {item.requiresSkill && (
                    <span className={`text-xs ml-2 ${meetsSkillReq ? "text-green-700" : "text-red-500"}`}>
                      {meetsSkillReq ? `✓ ${item.requiresSkill}` : `Locked: ${item.requiresSkill}`}
                    </span>
                  )}
                  {qty > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 bg-amber-900 text-amber-300 text-xs rounded">
                      x{qty}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 text-sm font-mono w-12 text-right">
                    {item.cost} Ag
                  </span>
                  <button
                    onClick={() => onRemoveItem(item.name, item.cost)}
                    disabled={qty === 0}
                    className="w-7 h-7 flex items-center justify-center rounded bg-red-900/50 text-red-400 hover:bg-red-800 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold"
                  >
                    -
                  </button>
                  <button
                    onClick={() => onAddItem(item.name, item.cost)}
                    disabled={!canBuyMore}
                    className="w-7 h-7 flex items-center justify-center rounded bg-green-900/50 text-green-400 hover:bg-green-800 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
