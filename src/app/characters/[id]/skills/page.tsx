"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { CharacterClass, Race, PurchasedSkill } from "@/types/character";
import { races } from "@/data/races";
import SkillsStep from "@/components/SkillsStep";
import { getSkillCost } from "@/components/SkillsStep";
import { skills as allSkills } from "@/data/skills";

interface CharSkillData {
  characterClass: CharacterClass;
  race: Race;
  level: number;
  skills: PurchasedSkill[];
  skillPointsAvailable: number;
  skillPointsSpent: number;
  name: string;
  status: string;
}

export default function SkillsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const isLevelUp = searchParams.get("levelUp") === "true";
  const gained = parseInt(searchParams.get("gained") || "0");
  const newLevel = parseInt(searchParams.get("newLevel") || "0");

  const [charData, setCharData] = useState<CharSkillData | null>(null);
  const [purchasedSkills, setPurchasedSkills] = useState<PurchasedSkill[]>([]);
  const [baselineSkills, setBaselineSkills] = useState<PurchasedSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch(`/api/characters/${id}/skills`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then((data: CharSkillData) => {
        setCharData(data);
        setPurchasedSkills(data.skills);
        setBaselineSkills(data.skills);
      })
      .catch(() => router.push("/"))
      .finally(() => setLoading(false));
  }, [id, status, router]);

  const bonusSkillNames = charData
    ? (races.find((r) => r.name === charData.race)?.bonusSkills.map((s) => s.name) ?? [])
    : [];

  // Calculate points: baseline spent + new purchases from available pool
  const baselineSpent = charData?.skillPointsSpent || 0;
  const currentSpent = purchasedSkills.reduce((sum, s) => sum + s.totalCost, 0);
  const newPointsUsed = currentSpent - baselineSpent;
  const available = charData?.skillPointsAvailable || 0;
  const pointsRemaining = available - newPointsUsed;

  const handleAddSkill = useCallback((skillName: string, cost: number) => {
    setPurchasedSkills((prev) => {
      const existing = prev.find((s) => s.skillName === skillName);
      if (existing) {
        return prev.map((s) =>
          s.skillName === skillName
            ? { ...s, purchaseCount: s.purchaseCount + 1, totalCost: s.totalCost + cost }
            : s
        );
      }
      return [...prev, { skillName, purchaseCount: 1, totalCost: cost }];
    });
  }, []);

  const handleRemoveSkill = useCallback((skillName: string) => {
    setPurchasedSkills((prev) => {
      const existing = prev.find((s) => s.skillName === skillName);
      if (!existing || existing.purchaseCount <= 0) return prev;

      // Don't allow removing below baseline
      const baseline = baselineSkills.find((s) => s.skillName === skillName);
      const minCount = baseline?.purchaseCount || 0;
      if (existing.purchaseCount <= minCount) return prev;

      // Calculate the cost of the last purchase to subtract
      const skillDef = allSkills.find((s) => s.name === skillName);
      if (!skillDef || !charData) return prev;

      const baseCost = skillDef.costs[charData.characterClass];
      const removeCost = getSkillCost(
        skillName,
        skillDef.category,
        baseCost,
        existing.purchaseCount - 1
      );

      if (existing.purchaseCount === 1) {
        return prev.filter((s) => s.skillName !== skillName);
      }
      return prev.map((s) =>
        s.skillName === skillName
          ? { ...s, purchaseCount: s.purchaseCount - 1, totalCost: s.totalCost - removeCost }
          : s
      );
    });
  }, [baselineSkills, charData]);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg("");
    const res = await fetch(`/api/characters/${id}/skills`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        skills: purchasedSkills,
        skillPointsSpent: currentSpent,
      }),
    });
    if (res.ok) {
      setSaveMsg("Skills saved!");
      // Update baseline after saving
      setBaselineSkills(purchasedSkills);
      if (charData) {
        setCharData({ ...charData, skillPointsSpent: currentSpent, skillPointsAvailable: available - newPointsUsed });
      }
    } else {
      const err = await res.json().catch(() => null);
      setSaveMsg(err?.error ?? "Failed to save");
    }
    setSaving(false);
  };

  const hasChanges = currentSpent !== baselineSpent;

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!charData) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => router.push("/")}
              className="text-gray-400 hover:text-white text-sm mb-2 inline-block"
            >
              &larr; Back to Characters
            </button>
            <h1 className="text-2xl font-bold text-amber-400">{charData.name}</h1>
            <div className="text-gray-400 text-sm">
              Level {charData.level} {charData.race} {charData.characterClass}
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-3">
              {saveMsg && (
                <span className={`text-sm ${saveMsg.includes("saved") ? "text-green-400" : "text-red-400"}`}>
                  {saveMsg}
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="px-5 py-2 rounded-lg bg-green-700 text-white font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Skills"}
              </button>
            </div>
          </div>
        </div>

        {/* Level-up banner */}
        {isLevelUp && gained > 0 && (
          <div className="mb-6 p-4 bg-purple-900/30 border border-purple-700 rounded-lg">
            <div className="text-purple-300 font-bold text-lg">
              Congratulations! Leveled up to Level {newLevel}!
            </div>
            <div className="text-purple-400 text-sm mt-1">
              You gained <span className="font-bold text-amber-400">{gained} skill points</span> to spend on new skills below.
            </div>
          </div>
        )}

        {/* Available points info */}
        <div className="mb-4 p-3 bg-gray-900 rounded-lg border border-gray-800 flex items-center justify-between">
          <div className="text-gray-400 text-sm">
            Available Skill Points from Level-Up
          </div>
          <div className={`text-xl font-bold ${pointsRemaining < 0 ? "text-red-500" : pointsRemaining === 0 ? "text-gray-500" : "text-amber-400"}`}>
            {pointsRemaining} remaining
          </div>
        </div>

        {/* Skills component */}
        <SkillsStep
          characterClass={charData.characterClass}
          purchasedSkills={purchasedSkills}
          skillPointsRemaining={pointsRemaining}
          skillPointsTotal={available}
          bonusSkillNames={bonusSkillNames}
          onAddSkill={handleAddSkill}
          onRemoveSkill={handleRemoveSkill}
        />

        {/* Bottom save bar */}
        {hasChanges && (
          <div className="sticky bottom-0 mt-6 p-4 bg-gray-900/95 backdrop-blur border border-gray-700 rounded-lg flex items-center justify-between">
            <div className="text-gray-400 text-sm">
              {newPointsUsed} point{newPointsUsed !== 1 ? "s" : ""} spent on new skills
            </div>
            <div className="flex items-center gap-3">
              {saveMsg && (
                <span className={`text-sm ${saveMsg.includes("saved") ? "text-green-400" : "text-red-400"}`}>
                  {saveMsg}
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-green-700 text-white font-medium hover:bg-green-600 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Skills"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
