"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Race, CharacterClass, Character, PurchasedSkill, PurchasedEquipment } from "@/types/character";
import { races } from "@/data/races";
import StepIndicator from "@/components/StepIndicator";
import BasicsStep from "@/components/BasicsStep";
import RaceStep from "@/components/RaceStep";
import ClassStep from "@/components/ClassStep";
import SkillsStep from "@/components/SkillsStep";
import EquipmentStep from "@/components/EquipmentStep";
import SummaryStep from "@/components/SummaryStep";
import Link from "next/link";

const STARTING_SKILL_POINTS = 140;
const STARTING_SILVER = 50;

interface SavedCharEntry {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // UI mode: "list" shows saved characters, "create" shows the wizard
  const [mode, setMode] = useState<"list" | "create">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savedChars, setSavedChars] = useState<SavedCharEntry[]>([]);
  const [loadingChars, setLoadingChars] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const [step, setStep] = useState(0);

  // Character state
  const [name, setName] = useState("");
  const [history, setHistory] = useState("");
  const [freeLanguage, setFreeLanguage] = useState("Common");
  const [race, setRace] = useState<Race | null>(null);
  const [characterClass, setCharacterClass] = useState<CharacterClass | null>(null);
  const [purchasedSkills, setPurchasedSkills] = useState<PurchasedSkill[]>([]);
  const [purchasedEquipment, setPurchasedEquipment] = useState<PurchasedEquipment[]>([]);

  const skillPointsSpent = purchasedSkills.reduce((sum, s) => sum + s.totalCost, 0);
  const skillPointsRemaining = STARTING_SKILL_POINTS - skillPointsSpent;
  const silverSpent = purchasedEquipment.reduce((sum, e) => sum + e.totalCost, 0);
  const silverRemaining = STARTING_SILVER - silverSpent;

  const isAdmin = (session?.user as { role?: string })?.role === "admin";

  const bonusSkillNames = race
    ? (races.find((r) => r.name === race)?.bonusSkills.map((s) => s.name) ?? [])
    : [];

  // Load saved characters list
  const loadCharacterList = useCallback(async () => {
    if (!session?.user) return;
    setLoadingChars(true);
    try {
      const res = await fetch("/api/characters");
      if (res.ok) setSavedChars(await res.json());
    } catch { /* ignore */ }
    setLoadingChars(false);
  }, [session?.user]);

  useEffect(() => {
    if (status === "authenticated") loadCharacterList();
  }, [status, loadCharacterList]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const resetForm = () => {
    setStep(0);
    setName("");
    setHistory("");
    setFreeLanguage("Common");
    setRace(null);
    setCharacterClass(null);
    setPurchasedSkills([]);
    setPurchasedEquipment([]);
    setEditingId(null);
    setSaveMsg("");
  };

  const loadCharacter = async (id: string) => {
    try {
      const res = await fetch(`/api/characters/${id}`);
      if (!res.ok) return;
      const { data } = await res.json();
      const c = data as Character;
      setName(c.name);
      setHistory(c.history);
      setFreeLanguage(c.freeLanguage);
      setRace(c.race);
      setCharacterClass(c.characterClass);
      setPurchasedSkills(c.skills);
      setPurchasedEquipment(c.equipment);
      setEditingId(id);
      setStep(0);
      setMode("create");
    } catch { /* ignore */ }
  };

  const deleteCharacter = async (id: string) => {
    if (!confirm("Delete this character permanently?")) return;
    await fetch(`/api/characters?id=${id}`, { method: "DELETE" });
    loadCharacterList();
  };

  const character: Character = {
    name,
    race: race ?? "Human",
    characterClass: characterClass ?? "Warrior",
    level: 1,
    xp: 0,
    bodyPoints: 0,
    skillPoints: STARTING_SKILL_POINTS,
    skillPointsSpent,
    skills: purchasedSkills,
    startingSilver: STARTING_SILVER,
    silverSpent,
    equipment: purchasedEquipment,
    history,
    freeLanguage,
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          name: character.name,
          data: character,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        setEditingId(result.id);
        setSaveMsg("Character saved!");
        loadCharacterList();
      } else {
        setSaveMsg("Failed to save");
      }
    } catch {
      setSaveMsg("Failed to save");
    }
    setSaving(false);
  };

  const handleExport = () => {
    const json = JSON.stringify(character, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${character.name.replace(/\s+/g, "_")}_character.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
      if (existing.purchaseCount === 1) {
        return prev.filter((s) => s.skillName !== skillName);
      }
      const avgCost = Math.floor(existing.totalCost / existing.purchaseCount);
      return prev.map((s) =>
        s.skillName === skillName
          ? { ...s, purchaseCount: s.purchaseCount - 1, totalCost: s.totalCost - avgCost }
          : s
      );
    });
  }, []);

  const handleAddEquipment = useCallback((itemName: string, cost: number) => {
    setPurchasedEquipment((prev) => {
      const existing = prev.find((e) => e.itemName === itemName);
      if (existing) {
        return prev.map((e) =>
          e.itemName === itemName
            ? { ...e, quantity: e.quantity + 1, totalCost: e.totalCost + cost }
            : e
        );
      }
      return [...prev, { itemName, quantity: 1, totalCost: cost }];
    });
  }, []);

  const handleRemoveEquipment = useCallback((itemName: string, cost: number) => {
    setPurchasedEquipment((prev) => {
      const existing = prev.find((e) => e.itemName === itemName);
      if (!existing || existing.quantity <= 0) return prev;
      if (existing.quantity === 1) {
        return prev.filter((e) => e.itemName !== itemName);
      }
      return prev.map((e) =>
        e.itemName === itemName
          ? { ...e, quantity: e.quantity - 1, totalCost: e.totalCost - cost }
          : e
      );
    });
  }, []);

  const canProceed = () => {
    switch (step) {
      case 0: return name.trim().length > 0;
      case 1: return race !== null;
      case 2: return characterClass !== null;
      case 3: return skillPointsRemaining >= 0;
      case 4: return silverRemaining >= 0;
      default: return true;
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-bold text-amber-500 cursor-pointer"
              onClick={() => { resetForm(); setMode("list"); }}
            >
              Kanar Character Checkout
            </h1>
            <p className="text-gray-500 text-xs">Celebrating 35+ Years of Friendship, Fun, and Fantasy</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm hidden sm:inline">
              {session?.user?.name}
              {isAdmin && (
                <span className="ml-1 px-1.5 py-0.5 bg-red-900 text-red-300 text-xs rounded">
                  admin
                </span>
              )}
            </span>
            {isAdmin && (
              <Link href="/admin" className="text-amber-400 text-sm hover:underline">
                Admin
              </Link>
            )}
            <button
              onClick={() => signOut()}
              className="text-gray-500 text-sm hover:text-white"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {mode === "list" ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Your Characters</h2>
              <button
                onClick={() => { resetForm(); setMode("create"); }}
                className="px-4 py-2 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-500 transition-colors"
              >
                + New Character
              </button>
            </div>

            {loadingChars ? (
              <div className="text-gray-500 text-center py-8">Loading...</div>
            ) : savedChars.length === 0 ? (
              <div className="text-center py-12 bg-gray-900/30 rounded-lg border border-gray-800">
                <p className="text-gray-500">No characters yet. Create your first one!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {savedChars.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors"
                  >
                    <div>
                      <div className="text-white font-medium">{c.name}</div>
                      <div className="text-gray-600 text-xs">
                        Last updated {new Date(c.updatedAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.open(`/print/${c.id}`, "_blank")}
                        className="px-3 py-1.5 rounded text-xs bg-gray-700 text-gray-300 hover:bg-gray-600"
                      >
                        Print
                      </button>
                      <button
                        onClick={() => loadCharacter(c.id)}
                        className="px-3 py-1.5 rounded text-xs bg-amber-700 text-white hover:bg-amber-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteCharacter(c.id)}
                        className="px-3 py-1.5 rounded text-xs bg-red-900/50 text-red-400 hover:bg-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <StepIndicator currentStep={step} />

            <div className="min-h-[60vh]">
              {step === 0 && (
                <BasicsStep
                  name={name}
                  history={history}
                  freeLanguage={freeLanguage}
                  onNameChange={setName}
                  onHistoryChange={setHistory}
                  onLanguageChange={setFreeLanguage}
                />
              )}
              {step === 1 && <RaceStep selectedRace={race} onSelect={setRace} />}
              {step === 2 && <ClassStep selectedClass={characterClass} onSelect={setCharacterClass} />}
              {step === 3 && characterClass && (
                <SkillsStep
                  characterClass={characterClass}
                  purchasedSkills={purchasedSkills}
                  skillPointsRemaining={skillPointsRemaining}
                  bonusSkillNames={bonusSkillNames}
                  onAddSkill={handleAddSkill}
                  onRemoveSkill={handleRemoveSkill}
                />
              )}
              {step === 4 && (
                <EquipmentStep
                  purchasedEquipment={purchasedEquipment}
                  silverRemaining={silverRemaining}
                  onAddItem={handleAddEquipment}
                  onRemoveItem={handleRemoveEquipment}
                />
              )}
              {step === 5 && <SummaryStep character={character} />}
            </div>

            <div className="flex justify-between mt-8 pt-4 border-t border-gray-800">
              <button
                onClick={() => {
                  if (step === 0) {
                    setMode("list");
                  } else {
                    setStep((s) => Math.max(0, s - 1));
                  }
                }}
                className="px-6 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
              >
                {step === 0 ? "Cancel" : "Back"}
              </button>

              <div className="flex items-center gap-3">
                {saveMsg && (
                  <span className="text-sm text-green-400">{saveMsg}</span>
                )}

                {step === 5 && (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-6 py-2 rounded-lg bg-blue-700 text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
                    >
                      {saving ? "Saving..." : editingId ? "Update" : "Save"}
                    </button>
                    {editingId && (
                      <button
                        onClick={() => window.open(`/print/${editingId}`, "_blank")}
                        className="px-6 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                      >
                        Print
                      </button>
                    )}
                    <button
                      onClick={handleExport}
                      className="px-6 py-2 rounded-lg bg-green-700 text-white hover:bg-green-600 transition-colors"
                    >
                      Export JSON
                    </button>
                  </>
                )}

                {step < 5 ? (
                  <button
                    onClick={() => setStep((s) => Math.min(5, s + 1))}
                    disabled={!canProceed()}
                    className="px-6 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={() => { resetForm(); setMode("list"); }}
                    className="px-6 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
