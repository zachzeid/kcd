"use client";

import { useState } from "react";
import { CharacterClass, PurchasedSkill } from "@/types/character";
import { skills, skillCategories, skillSpecializations, getBaseSkillName } from "@/data/skills";
import { checkPrerequisites, getEffectiveMaxPurchases } from "@/lib/prerequisites";

interface Props {
  characterClass: CharacterClass;
  purchasedSkills: PurchasedSkill[];
  skillPointsRemaining: number;
  skillPointsTotal: number;
  bonusSkillNames: string[];
  level: number;
  onAddSkill: (skillName: string, cost: number) => void;
  onRemoveSkill: (skillName: string) => void;
}

function getSkillCost(
  _skillName: string,
  category: string,
  baseCost: number,
  currentPurchases: number
): number {
  if (category === "Item Creation") {
    return baseCost * (currentPurchases + 1);
  }
  if (category === "Martial") {
    if (currentPurchases === 0) return baseCost;
    return baseCost + Math.floor(baseCost / 2) * currentPurchases;
  }
  return baseCost;
}

export { getSkillCost };

export default function SkillsStep({
  characterClass,
  purchasedSkills,
  skillPointsRemaining,
  skillPointsTotal,
  bonusSkillNames,
  level,
  onAddSkill,
  onRemoveSkill,
}: Props) {
  const [activeCategory, setActiveCategory] = useState("General");
  const [searchQuery, setSearchQuery] = useState("");

  // Expand skills with known specializations into individual rows
  interface SkillRow {
    name: string;
    baseName: string;
    category: string;
    costs: Record<CharacterClass, number>;
    maxPurchases: number;
    selfTaught: boolean;
    prerequisite?: string;
    description: string;
  }

  const expandedSkills: SkillRow[] = skills.flatMap((s) => {
    const specs = skillSpecializations[s.name];
    if (specs) {
      return specs.map((spec): SkillRow => ({
        name: `${s.name} (${spec})`,
        baseName: s.name,
        category: s.category,
        costs: s.costs,
        maxPurchases: s.maxPurchases,
        selfTaught: s.selfTaught,
        prerequisite: s.prerequisite,
        description: s.description,
      }));
    }
    return [{
      name: s.name,
      baseName: s.name,
      category: s.category,
      costs: s.costs,
      maxPurchases: s.maxPurchases,
      selfTaught: s.selfTaught,
      prerequisite: s.prerequisite,
      description: s.description,
    }];
  });

  const filteredSkills = expandedSkills.filter((s) => {
    const matchesCategory = s.category === activeCategory;
    const matchesSearch =
      searchQuery === "" || s.name.toLowerCase().includes(searchQuery.toLowerCase());
    return searchQuery ? matchesSearch : matchesCategory;
  });

  const getPurchaseCount = (skillName: string) => {
    const found = purchasedSkills.find((ps) => ps.skillName === skillName);
    return found ? found.purchaseCount : 0;
  };

  const isBonusSkill = (skillName: string) => bonusSkillNames.includes(skillName);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-amber-400">Purchase Skills</h2>
        <div className="text-right">
          <div className="text-sm text-gray-400">Skill Points Remaining</div>
          <div
            className={`text-2xl font-bold ${
              skillPointsRemaining < 0 ? "text-red-500" : "text-green-400"
            }`}
          >
            {skillPointsRemaining} / {skillPointsTotal}
          </div>
        </div>
      </div>

      <p className="text-gray-400 text-sm">
        Each character starts with 140 skill points. Consider your character history when buying skills.
        Skills with unmet prerequisites are locked.
      </p>

      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search skills..."
        className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-sm"
      />

      {!searchQuery && (
        <div className="flex flex-wrap gap-1">
          {skillCategories.map((cat) => (
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
      )}

      <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
        {filteredSkills.map((skill) => {
          const currentPurchases = getPurchaseCount(skill.name);
          const baseCost = skill.costs[characterClass];
          const nextCost = getSkillCost(skill.baseName, skill.category, baseCost, currentPurchases);
          const effectiveMax = getEffectiveMaxPurchases(skill.baseName, skill.maxPurchases, level);
          const canBuyMore = currentPurchases < effectiveMax;
          const isBonus = isBonusSkill(skill.name) || isBonusSkill(skill.baseName);

          // Prerequisite checks use the base name (e.g. "Craft" not "Craft (Weapons)")
          const prereqCheck = checkPrerequisites(
            skill.baseName,
            skill.prerequisite,
            purchasedSkills,
            bonusSkillNames
          );
          const prereqMet = prereqCheck.met;
          const prereqBlocked = !prereqMet && currentPurchases === 0;
          const tooExpensive = canBuyMore && !prereqBlocked && nextCost > skillPointsRemaining;
          const unavailable = prereqBlocked || (!canBuyMore && currentPurchases > 0) || tooExpensive;

          return (
            <div
              key={skill.name}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                unavailable && currentPurchases === 0
                  ? "bg-gray-900/30 border-gray-800 opacity-50"
                  : unavailable
                  ? "bg-gray-800/30 border-gray-700/50 opacity-70"
                  : "bg-gray-800/50 border-gray-700"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium text-sm">{skill.name}</span>
                  {isBonus && (
                    <span className="px-1.5 py-0.5 bg-green-900 text-green-300 text-xs rounded">
                      Bonus
                    </span>
                  )}
                  {currentPurchases > 0 && (
                    <span className="px-1.5 py-0.5 bg-amber-900 text-amber-300 text-xs rounded">
                      x{currentPurchases}
                    </span>
                  )}
                  {prereqBlocked && (
                    <span className="px-1.5 py-0.5 bg-red-900/50 text-red-400 text-xs rounded">
                      Locked
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-xs mt-0.5 truncate">{skill.description}</p>
                {prereqBlocked && prereqCheck.reason && (
                  <p className="text-red-500 text-xs mt-0.5">{prereqCheck.reason}</p>
                )}
                {!prereqBlocked && skill.prerequisite && (
                  <p className="text-green-700 text-xs mt-0.5">Req: {skill.prerequisite}</p>
                )}
                {effectiveMax < skill.maxPurchases && effectiveMax > 1 && (
                  <p className="text-blue-400 text-xs mt-0.5">Max {effectiveMax} at level {level}</p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-3">
                <span className="text-amber-400 text-sm font-mono w-10 text-right">
                  {canBuyMore ? `${nextCost}p` : "MAX"}
                </span>
                <button
                  onClick={() => onRemoveSkill(skill.name)}
                  disabled={currentPurchases === 0 || isBonus}
                  className="w-7 h-7 flex items-center justify-center rounded bg-red-900/50 text-red-400 hover:bg-red-800 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold"
                >
                  -
                </button>
                <button
                  onClick={() => onAddSkill(skill.name, nextCost)}
                  disabled={!canBuyMore || nextCost > skillPointsRemaining || prereqBlocked}
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
