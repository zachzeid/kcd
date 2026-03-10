"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Race, CharacterClass, Character, PurchasedSkill, PurchasedEquipment } from "@/types/character";
import { races } from "@/data/races";
import { classes } from "@/data/classes";
import { CHARACTER_STATUSES, INACTIVE_LABEL, type CharacterStatus, canPlayerEdit, canSubmitForReview } from "@/lib/character-status";
import { isStaff, canEditOwnCharacters } from "@/lib/roles";
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

interface AuditLogEntry {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}

interface SavedCharEntry {
  id: string;
  name: string;
  status: CharacterStatus;
  inactive: boolean;
  reviewNotes: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  auditLogs: AuditLogEntry[];
}

function formatAuditAction(action: string, details: Record<string, unknown> | null): string {
  switch (action) {
    case "created": return "created this character.";
    case "updated": return "updated this character.";
    case "submitted": return "submitted this character for review.";
    case "approved": return "approved this character.";
    case "rejected": return "rejected this character.";
    case "checked_in": return "checked in to an event.";
    case "checked_out": return "checked out of an event.";
    case "signout_submitted": return "submitted a sign-out request.";
    case "signout_processed": return "processed the sign-out.";
    case "reactivated": return "reactivated this character.";
    case "inactive": return "marked this character as inactive.";
    case "deleted": return "deleted this character.";
    case "level_up": {
      const newLevel = details?.newLevel;
      return newLevel ? `leveled up to level ${newLevel}.` : "leveled up.";
    }
    case "registered": return "registered for an event.";
    case "status_change": {
      const to = details?.to;
      return to ? `changed status to ${String(to).replace(/_/g, " ")}.` : "changed the status.";
    }
    case "tag_created": return "created a tag.";
    case "tag_transferred": return "transferred a tag.";
    case "tag_removed": return "removed a tag.";
    case "tag_approved": return "approved a tag.";
    case "tag_denied": return "denied a tag.";
    case "life_credit_lost": {
      const lost = details?.creditsLost;
      const after = details?.creditsAfter;
      return lost ? `lost ${lost} life credit${Number(lost) > 1 ? "s" : ""} (${after} remaining).` : "lost a life credit.";
    }
    case "character_died": return "has permanently died (0 life credits).";
    default: return `${action.replace(/_/g, " ")}.`;
  }
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

  const userRole = (session?.user as { role?: string })?.role ?? "user";
  const userIsStaff = isStaff(userRole);
  const userCanEditOwn = canEditOwnCharacters(userRole);

  const bonusSkillNames = race
    ? (races.find((r) => r.name === race)?.bonusSkills.map((s) => s.name) ?? [])
    : [];

  // When race changes, sync racial bonus skills into purchasedSkills
  useEffect(() => {
    const raceData = race ? races.find((r) => r.name === race) : null;
    const newBonusSkills = raceData?.bonusSkills ?? [];

    setPurchasedSkills((prev) => {
      // Remove any existing racial bonus entries
      const withoutBonus = prev.filter((s) => s.reason !== "Racial bonus");
      // Add new racial bonus skills
      const bonusEntries: PurchasedSkill[] = newBonusSkills.map((bs) => ({
        skillName: bs.name,
        purchaseCount: bs.count,
        totalCost: 0,
        acquiredAt: new Date().toISOString(),
        reason: "Racial bonus",
      }));
      return [...bonusEntries, ...withoutBonus];
    });
  }, [race]);

  // Refresh key to trigger character list reload
  const [charListKey, setCharListKey] = useState(0);
  const refreshCharList = () => setCharListKey((k) => k + 1);

  // Load saved characters list
  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/characters");
        if (res.ok && !cancelled) setSavedChars(await res.json());
      } catch { /* ignore */ }
      if (!cancelled) setLoadingChars(false);
    })();
    return () => { cancelled = true; };
  }, [status, session?.user, charListKey]);

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
    refreshCharList();
  };

  const submitForReview = async (id: string) => {
    if (!confirm("Submit this character for staff review? You won't be able to edit it until review is complete.")) return;
    const res = await fetch(`/api/characters/${id}/submit`, { method: "POST" });
    if (res.ok) {
      refreshCharList();
    }
  };


  // Body points calculation
  const curRaceInfo = race ? races.find((r) => r.name === race) : null;
  const curClassInfo = characterClass ? classes.find((c) => c.name === characterClass) : null;
  const raceBP = curRaceInfo?.bodyPointsByLevel[0] ?? 0;
  const classBP = curClassInfo?.bodyPointsByLevel[0] ?? 0;

  const character: Character = {
    name,
    race: race ?? "Human",
    characterClass: characterClass ?? "Warrior",
    level: 1,
    xp: 0,
    bodyPoints: raceBP + classBP,
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
        refreshCharList();
      } else {
        const errData = await res.json().catch(() => null);
        setSaveMsg(errData?.error ?? "Failed to save");
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
      return [...prev, { skillName, purchaseCount: 1, totalCost: cost, acquiredAt: new Date().toISOString(), reason: "Character creation" }];
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
      return [...prev, { itemName, quantity: 1, totalCost: cost, acquiredAt: new Date().toISOString(), reason: "Starting equipment" }];
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
              {userIsStaff && (
                <span className="ml-1 px-1.5 py-0.5 bg-red-900 text-red-300 text-xs rounded">
                  {userRole === "admin" ? "admin" : userRole.replace("_", " ")}
                </span>
              )}
            </span>
            <Link href="/compendium" className="text-amber-400 text-sm hover:underline">
              Compendium
            </Link>
            <Link href="/events" className="text-amber-400 text-sm hover:underline">
              Events
            </Link>
            {userIsStaff && (
              <Link href="/admin" className="text-amber-400 text-sm hover:underline">
                Staff Dashboard
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
              {userCanEditOwn ? (
                <button
                  onClick={() => { resetForm(); setMode("create"); }}
                  className="px-4 py-2 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-500 transition-colors"
                >
                  + New Character
                </button>
              ) : (
                <span className="text-gray-500 text-sm italic">
                  Staff with review roles cannot create/edit own characters
                </span>
              )}
            </div>

            {loadingChars ? (
              <div className="text-gray-500 text-center py-8">Loading...</div>
            ) : savedChars.length === 0 ? (
              <div className="text-center py-12 bg-gray-900/30 rounded-lg border border-gray-800">
                <p className="text-gray-500">No characters yet. Create your first one!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {savedChars.map((c) => {
                  const statusInfo = CHARACTER_STATUSES[c.status] ?? CHARACTER_STATUSES.draft;
                  const editable = userCanEditOwn && canPlayerEdit(c.status, c.inactive);
                  const submittable = userCanEditOwn && canSubmitForReview(c.status, c.inactive);
                  const staffLogs = c.auditLogs?.filter((l) => l.actorRole !== "user") ?? [];
                  return (
                    <div
                      key={c.id}
                      className={`p-4 bg-gray-900 rounded-lg border transition-colors ${
                        c.inactive ? "border-orange-800/50" : "border-gray-800 hover:border-gray-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-white font-medium">{c.name}</div>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                          {c.inactive && (
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${INACTIVE_LABEL.color}`}>
                              {INACTIVE_LABEL.label}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {(c.status === "approved" || c.status === "checked_in" || c.status === "checked_out") && (
                            <button
                              onClick={() => window.open(`/print/${c.id}`, "_blank")}
                              className="px-3 py-1.5 rounded text-xs bg-gray-700 text-gray-300 hover:bg-gray-600"
                            >
                              Print
                            </button>
                          )}
                          {submittable && (
                            <button
                              onClick={() => submitForReview(c.id)}
                              className="px-3 py-1.5 rounded text-xs bg-blue-700 text-white hover:bg-blue-600"
                            >
                              Submit for Review
                            </button>
                          )}
                          {editable && (
                            <button
                              onClick={() => loadCharacter(c.id)}
                              className="px-3 py-1.5 rounded text-xs bg-amber-700 text-white hover:bg-amber-600"
                            >
                              Edit
                            </button>
                          )}
                          {!editable && c.status !== "pending_review" && (
                            <Link
                              href={`/characters/${c.id}`}
                              className="px-3 py-1.5 rounded text-xs bg-gray-700 text-gray-300 hover:bg-gray-600"
                            >
                              View
                            </Link>
                          )}
                          {editable && (
                            <button
                              onClick={() => deleteCharacter(c.id)}
                              className="px-3 py-1.5 rounded text-xs bg-red-900/50 text-red-400 hover:bg-red-800"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                      {c.inactive && (
                        <div className="mt-2 p-2 bg-orange-900/20 border border-orange-800 rounded text-orange-300 text-sm">
                          This character has been inactive for over 12 months. Contact CBD staff to reactivate before registering for events.
                        </div>
                      )}
                      {c.status === "rejected" && c.reviewNotes && (
                        <div className="mt-2 p-2 bg-red-900/20 border border-red-800 rounded text-red-300 text-sm">
                          <span className="font-bold">Staff Feedback:</span> {c.reviewNotes}
                        </div>
                      )}
                      <div className="text-gray-600 text-xs mt-1">
                        Last updated {new Date(c.updatedAt).toLocaleString()}
                        {c.submittedAt && ` | Submitted ${new Date(c.submittedAt).toLocaleString()}`}
                      </div>

                      {staffLogs.length > 0 && (
                        <details className="mt-2">
                          <summary className="text-amber-400 text-xs cursor-pointer hover:underline">
                            Activity log ({c.auditLogs.length} entries)
                          </summary>
                          <div className="mt-1 space-y-1">
                            {c.auditLogs.map((log) => (
                              <div key={log.id} className="flex items-start gap-2 text-xs text-gray-400 py-0.5 border-b border-gray-800/50">
                                <span className="text-gray-600 shrink-0">
                                  {new Date(log.createdAt).toLocaleString()}
                                </span>
                                <span>
                                  <span className="text-gray-300 font-medium">{log.actorName}</span>
                                  {log.actorRole !== "user" && (
                                    <span className="ml-1 text-amber-500/70">({log.actorRole})</span>
                                  )}
                                  {" "}
                                  <span className={
                                    log.action === "approved" ? "text-green-400" :
                                    log.action === "rejected" ? "text-red-400" :
                                    log.action === "submitted" ? "text-blue-400" :
                                    log.action === "checked_in" ? "text-blue-300" :
                                    log.action === "checked_out" ? "text-indigo-300" :
                                    log.action === "signout_submitted" ? "text-purple-300" :
                                    log.action === "signout_processed" ? "text-green-300" :
                                    log.action === "reactivated" ? "text-orange-300" :
                                    log.action === "level_up" ? "text-yellow-300" :
                                    "text-gray-400"
                                  }>
                                    {formatAuditAction(log.action, log.details)}
                                  </span>
                                  {log.details && typeof log.details.notes === "string" && (
                                    <span className="ml-1 text-gray-500">— {log.details.notes}</span>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  );
                })}
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
                  skillPointsTotal={STARTING_SKILL_POINTS}
                  bonusSkillNames={bonusSkillNames}
                  level={1}
                  onAddSkill={handleAddSkill}
                  onRemoveSkill={handleRemoveSkill}
                />
              )}
              {step === 4 && (
                <EquipmentStep
                  purchasedEquipment={purchasedEquipment}
                  purchasedSkills={purchasedSkills}
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
