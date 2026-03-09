"use client";

import { useState, useEffect, useRef, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ROLEPLAY_QUALITY_OPTIONS,
  BETWEEN_EVENT_ACTIONS,
  type BetweenEventAction,
} from "@/lib/economy";
import { skills as allSkills, skillCategories } from "@/data/skills";
import { ITEM_TYPES, craftLevelToTier, PROFESSION_RATES, CRAFTING_SKILLS, ALL_MATERIALS, WEAPON_TYPES } from "@/lib/economy";

const TRADE_SKILL_NAMES = ["Craft", "Forensics", "Herbalism", "Pick Locks"];

function extractTradeSkills(skills: { skillName: string; specialization?: string; purchaseCount: number }[]) {
  return skills.filter((s) => TRADE_SKILL_NAMES.some((t) => s.skillName.startsWith(t)));
}

type ItemType = keyof typeof ITEM_TYPES;

interface EventAttendee {
  characterId: string;
  characterName: string;
  playerName: string;
  playerId: string;
  skills: string[];
}

interface SkillLearned {
  skillName: string;
  count: number;
  teacherName: string;       // character name (display)
  teacherCharacter: string;  // player name (auto-filled)
  teacherCharacterId?: string; // character ID for lookups
}

interface SkillTaught {
  skillName: string;
  studentNames: string; // comma-separated character names
  studentIds?: string[]; // character IDs
}

interface EventData {
  id: string;
  name: string;
  date: string;
  endDate: string | null;
  status: string;
  myRegistration: {
    eventId: string;
    ticketType: string;
    paymentStatus: string;
  } | null;
}

interface RegistrationData {
  id: string;
  eventId: string;
  characterId: string | null;
  checkedInAt: string | null;
  checkedOutAt: string | null;
}

function StudentSearchDropdown({
  attendees,
  onSelect,
}: {
  attendees: EventAttendee[];
  onSelect: (characterId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = search
    ? attendees.filter(
        (a) =>
          a.characterName.toLowerCase().includes(search.toLowerCase()) ||
          a.playerName.toLowerCase().includes(search.toLowerCase())
      )
    : attendees;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search for a student..."
        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-sm"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
          {filtered.map((a) => (
            <button
              key={a.characterId}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-gray-700 text-sm text-white"
              onClick={() => {
                onSelect(a.characterId);
                setSearch("");
                setOpen(false);
              }}
            >
              <span className="font-medium">{a.characterName}</span>
              <span className="text-gray-400 ml-2">({a.playerName})</span>
            </button>
          ))}
        </div>
      )}
      {open && filtered.length === 0 && search && (
        <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-3 text-gray-500 text-sm">
          No matching attendees
        </div>
      )}
    </div>
  );
}

export default function SignOutPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [readOnly, setReadOnly] = useState(false);

  // Event & character info
  const [eventName, setEventName] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [characterId, setCharacterId] = useState("");
  const [signOutStatus, setSignOutStatus] = useState("");

  // Character selection (when not pre-assigned by staff check-in)
  const [availableCharacters, setAvailableCharacters] = useState<{ id: string; name: string }[]>([]);
  const [needsCharacterSelect, setNeedsCharacterSelect] = useState(false);

  // Character's purchased skills (for "skills taught" dropdown and trade skill detection)
  const [characterSkills, setCharacterSkills] = useState<string[]>([]);
  const [characterTradeSkills, setCharacterTradeSkills] = useState<
    { skillName: string; specialization?: string; purchaseCount: number }[]
  >([]);

  // Event attendees for teacher/student selection
  const [eventAttendees, setEventAttendees] = useState<EventAttendee[]>([]);

  // Level-up state
  const [levelUpData, setLevelUpData] = useState<{
    currentLevel: number;
    totalXP: number;
    eligibleLevel: number;
    canLevelUp: boolean;
    skillPointsToGain: number;
    xpNeededForNextLevel: number;
    xpAwarded: number;
  } | null>(null);
  const [levelingUp, setLevelingUp] = useState(false);
  const [levelUpResult, setLevelUpResult] = useState<{
    newLevel: number;
    skillPointsGained: number;
  } | null>(null);

  // Form fields
  const [npcMinutes, setNpcMinutes] = useState(0);
  const [npcDetails, setNpcDetails] = useState("");
  const [staffMinutes, setStaffMinutes] = useState(0);
  const [staffDetails, setStaffDetails] = useState("");
  const [lifeCreditsLost, setLifeCreditsLost] = useState(0);
  const [skillsLearned, setSkillsLearned] = useState<SkillLearned[]>([]);
  const [skillsTaught, setSkillsTaught] = useState<SkillTaught[]>([]);
  const [eventRating, setEventRating] = useState<number | null>(null);
  const [roleplayQuality, setRoleplayQuality] = useState("");
  const [enjoyedEncounters, setEnjoyedEncounters] = useState("");
  const [dislikedEncounters, setDislikedEncounters] = useState("");
  const [notableRoleplay, setNotableRoleplay] = useState("");
  const [atmosphereFeedback, setAtmosphereFeedback] = useState("");
  const [betweenEventAction, setBetweenEventAction] = useState<BetweenEventAction>("nothing");
  const [betweenEventDetails, setBetweenEventDetails] = useState<Record<string, string>>({});

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [sessionStatus, router]);

  // Load event, registration, and existing sign-out data
  useEffect(() => {
    if (sessionStatus !== "authenticated" || !session?.user?.id) return;

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        // Fetch events to find this one
        const eventsRes = await fetch("/api/events");
        if (!eventsRes.ok) throw new Error("Failed to load events");
        const events: EventData[] = await eventsRes.json();
        const event = events.find((e) => e.id === eventId);
        if (!event) {
          setError("Event not found");
          setLoading(false);
          return;
        }
        setEventName(event.name);

        // Fetch event attendees for teacher/student dropdowns
        fetch(`/api/events/${eventId}/attendees`)
          .then((r) => r.ok ? r.json() : [])
          .then((attendees: EventAttendee[]) => setEventAttendees(attendees))
          .catch(() => {});

        // Fetch user's registration for this event
        const regRes = await fetch(`/api/events/${eventId}/register`);
        if (!regRes.ok) {
          setError("You are not registered for this event");
          setLoading(false);
          return;
        }
        const registration: RegistrationData = await regRes.json();

        if (registration.characterId) {
          // Character was assigned during staff check-in
          setCharacterId(registration.characterId);

          // Fetch character name and skills
          const charRes = await fetch(`/api/characters/${registration.characterId}`);
          if (charRes.ok) {
            const charData = await charRes.json();
            setCharacterName(charData.name);
            if (charData.data?.skills) {
              setCharacterSkills(charData.data.skills.map((s: { skillName: string }) => s.skillName));
              setCharacterTradeSkills(extractTradeSkills(charData.data.skills));
            }
          }
        } else {
          // No staff check-in — let player pick a character
          const charsRes = await fetch("/api/characters");
          if (charsRes.ok) {
            const allChars = await charsRes.json();
            const eligible = allChars.filter(
              (c: { status: string }) =>
                c.status === "approved" || c.status === "checked_in" || c.status === "checked_out"
            );
            setAvailableCharacters(eligible.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));

            if (eligible.length === 1) {
              // Auto-select if only one character
              setCharacterId(eligible[0].id);
              setCharacterName(eligible[0].name);
              // Load skills for the auto-selected character
              fetch(`/api/characters/${eligible[0].id}`)
                .then((r) => r.ok ? r.json() : null)
                .then((cd) => {
                  if (cd?.data?.skills) {
                    setCharacterSkills(cd.data.skills.map((s: { skillName: string }) => s.skillName));
                    setCharacterTradeSkills(extractTradeSkills(cd.data.skills));
                  }
                })
                .catch(() => {});
            } else if (eligible.length > 1) {
              setNeedsCharacterSelect(true);
            } else {
              setError("You have no approved characters to sign out with");
              setLoading(false);
              return;
            }
          }
        }

        // Check for existing sign-out (only if we have a characterId)
        const signOutCharId = registration.characterId || characterId;
        const signOutRes = signOutCharId
          ? await fetch(`/api/characters/${signOutCharId}/signout?eventId=${eventId}`)
          : null;
        if (signOutRes?.ok) {
          const signOut = await signOutRes.json();
          // Pre-fill form
          setNpcMinutes(signOut.npcMinutes ?? 0);
          setNpcDetails(signOut.npcDetails ?? "");
          setStaffMinutes(signOut.staffMinutes ?? 0);
          setStaffDetails(signOut.staffDetails ?? "");
          setLifeCreditsLost(signOut.lifeCreditsLost ?? 0);
          setSkillsLearned(signOut.skillsLearned ? JSON.parse(signOut.skillsLearned) : []);
          setSkillsTaught(signOut.skillsTaught ? JSON.parse(signOut.skillsTaught) : []);
          setEventRating(signOut.eventRating ?? null);
          setRoleplayQuality(signOut.roleplayQuality ?? "");
          setEnjoyedEncounters(signOut.enjoyedEncounters ?? "");
          setDislikedEncounters(signOut.dislikedEncounters ?? "");
          setNotableRoleplay(signOut.notableRoleplay ?? "");
          setAtmosphereFeedback(signOut.atmosphereFeedback ?? "");
          setBetweenEventAction((signOut.betweenEventAction as BetweenEventAction) ?? "nothing");
          setBetweenEventDetails(
            signOut.betweenEventDetails ? JSON.parse(signOut.betweenEventDetails) : {}
          );
          setSignOutStatus(signOut.status);
          const hoursSinceCreation = (Date.now() - new Date(signOut.createdAt).getTime()) / (1000 * 60 * 60);
          if (signOut.status !== "pending" || hoursSinceCreation > 24) {
            setReadOnly(true);
          }
          // Fetch level-up data if sign-out was processed
          if (signOut.status === "processed" && (registration.characterId || characterId)) {
            const charIdForLevelUp = registration.characterId || characterId;
            const levelRes = await fetch(`/api/characters/${charIdForLevelUp}/levelup`);
            if (levelRes.ok) {
              const levelData = await levelRes.json();
              setLevelUpData({ ...levelData, xpAwarded: signOut.xpAwarded ?? 0 });
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      }

      setLoading(false);
    }

    loadData();
  }, [sessionStatus, session?.user?.id, eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly || !characterId) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/characters/${characterId}/signout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          npcMinutes,
          npcDetails: npcDetails || undefined,
          staffMinutes,
          staffDetails: staffDetails || undefined,
          lifeCreditsLost,
          skillsLearned: skillsLearned.length > 0 ? skillsLearned : undefined,
          skillsTaught: skillsTaught.length > 0 ? skillsTaught : undefined,
          eventRating,
          roleplayQuality: roleplayQuality || undefined,
          enjoyedEncounters: enjoyedEncounters || undefined,
          dislikedEncounters: dislikedEncounters || undefined,
          notableRoleplay: notableRoleplay || undefined,
          atmosphereFeedback: atmosphereFeedback || undefined,
          betweenEventAction,
          betweenEventDetails:
            betweenEventAction !== "nothing" && Object.keys(betweenEventDetails).length > 0
              ? betweenEventDetails
              : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit sign-out");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    }

    setSubmitting(false);
  };

  // Skill learned helpers
  const addSkillLearned = () => {
    setSkillsLearned([...skillsLearned, { skillName: "", count: 1, teacherName: "", teacherCharacter: "", teacherCharacterId: "" }]);
  };
  const removeSkillLearned = (idx: number) => {
    setSkillsLearned(skillsLearned.filter((_, i) => i !== idx));
  };
  const updateSkillLearned = (idx: number, field: keyof SkillLearned, value: string | number) => {
    setSkillsLearned(skillsLearned.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };
  const selectTeacher = (idx: number, characterId: string) => {
    const attendee = eventAttendees.find((a) => a.characterId === characterId);
    if (attendee) {
      setSkillsLearned(skillsLearned.map((s, i) =>
        i === idx
          ? { ...s, teacherName: attendee.characterName, teacherCharacter: attendee.playerName, teacherCharacterId: attendee.characterId }
          : s
      ));
    } else {
      setSkillsLearned(skillsLearned.map((s, i) =>
        i === idx ? { ...s, teacherName: "", teacherCharacter: "", teacherCharacterId: "" } : s
      ));
    }
  };
  // Get skills the selected teacher can teach (guardrail)
  const getTeacherSkills = (teacherCharacterId?: string) => {
    if (!teacherCharacterId) return [];
    const attendee = eventAttendees.find((a) => a.characterId === teacherCharacterId);
    return attendee?.skills ?? [];
  };

  // Skill taught helpers
  const addSkillTaught = () => {
    setSkillsTaught([...skillsTaught, { skillName: "", studentNames: "", studentIds: [] }]);
  };
  const removeSkillTaught = (idx: number) => {
    setSkillsTaught(skillsTaught.filter((_, i) => i !== idx));
  };
  const updateSkillTaught = (idx: number, field: keyof SkillTaught, value: string) => {
    setSkillsTaught(skillsTaught.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };
  const addStudentToSkillTaught = (idx: number, characterId: string) => {
    const attendee = eventAttendees.find((a) => a.characterId === characterId);
    if (!attendee) return;
    setSkillsTaught(skillsTaught.map((s, i) => {
      if (i !== idx) return s;
      const currentIds = s.studentIds ?? [];
      if (currentIds.includes(characterId)) return s; // already added
      const newIds = [...currentIds, characterId];
      const newNames = newIds
        .map((id) => eventAttendees.find((a) => a.characterId === id)?.characterName ?? id)
        .join(", ");
      return { ...s, studentIds: newIds, studentNames: newNames };
    }));
  };
  const removeStudentFromSkillTaught = (idx: number, characterId: string) => {
    setSkillsTaught(skillsTaught.map((s, i) => {
      if (i !== idx) return s;
      const newIds = (s.studentIds ?? []).filter((id) => id !== characterId);
      const newNames = newIds
        .map((id) => eventAttendees.find((a) => a.characterId === id)?.characterName ?? id)
        .join(", ");
      return { ...s, studentIds: newIds, studentNames: newNames };
    }));
  };

  // Between-event detail helper
  const updateBEDetail = (key: string, value: string) => {
    setBetweenEventDetails((prev) => ({ ...prev, [key]: value }));
  };

  // Level-up handler
  const handleLevelUp = async () => {
    if (!levelUpData?.canLevelUp || !characterId) return;
    setLevelingUp(true);
    setError("");
    try {
      const res = await fetch(`/api/characters/${characterId}/levelup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetLevel: levelUpData.eligibleLevel }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to level up");
      }
      const result = await res.json();
      setLevelUpResult({ newLevel: result.newLevel, skillPointsGained: result.skillPointsGained });
      setLevelUpData((prev) => prev ? { ...prev, canLevelUp: false, currentLevel: result.newLevel } : prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to level up");
    }
    setLevelingUp(false);
  };

  // Pill-based skill picker for between-event actions
  const selectedRelevantSkills = (betweenEventDetails.relevantSkills ?? "").split(",").filter(Boolean);
  const selectedCraftingSkills = (betweenEventDetails.craftingSkills ?? "").split(",").filter(Boolean);

  const toggleSkill = (key: string, skillName: string) => {
    const current = (betweenEventDetails[key] ?? "").split(",").filter(Boolean);
    const updated = current.includes(skillName)
      ? current.filter((s) => s !== skillName)
      : [...current, skillName];
    updateBEDetail(key, updated.join(","));
  };

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (sessionStatus === "unauthenticated") return null;

  if (success) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 max-w-md w-full text-center">
          <div className="text-green-400 text-4xl mb-4">&#10003;</div>
          <h2 className="text-xl font-bold text-white mb-2">Sign-Out Submitted</h2>
          <p className="text-gray-400 mb-6">
            Your sign-out for {eventName} has been submitted and is pending CBD review.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-2 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-500 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const inputClass =
    "w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  const textareaClass = `${inputClass} min-h-[80px] resize-y`;
  const labelClass = "block text-sm text-gray-400 mb-1";
  const sectionClass = "bg-gray-900 rounded-lg border border-gray-800 p-6 space-y-4";

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-amber-500">Character Sign-Out</h1>
            <p className="text-gray-500 text-xs">Post-event form</p>
          </div>
          <Link href="/" className="text-amber-400 text-sm hover:underline">
            Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-300 text-sm">
            {error}
          </div>
        )}

        {readOnly && (
          <div className="mb-6 bg-blue-900/30 border border-blue-700 rounded-lg p-4 text-blue-300 text-sm">
            {signOutStatus !== "pending"
              ? `This sign-out has been ${signOutStatus}. It can no longer be edited.`
              : "This sign-out was submitted over 24 hours ago and can no longer be edited."}
          </div>
        )}

        {/* Level-Up Section — shown after CBD processes the sign-out */}
        {signOutStatus === "processed" && levelUpData && (
          <div className="mb-6 bg-gray-900 rounded-lg border border-gray-800 p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Level Up Character</h2>

            {levelUpResult ? (
              <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 text-center space-y-2">
                <div className="text-green-300 text-3xl font-bold">Level {levelUpResult.newLevel}</div>
                <div className="text-green-400 text-sm">
                  +{levelUpResult.skillPointsGained} skill points gained
                </div>
                <p className="text-gray-400 text-sm mt-2">
                  You can spend your new skill points from the character page.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                    <div className="text-gray-400 text-xs">Current Level</div>
                    <div className="text-white text-2xl font-bold">{levelUpData.currentLevel}</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                    <div className="text-gray-400 text-xs">Total XP</div>
                    <div className="text-amber-400 text-2xl font-bold">{levelUpData.totalXP}</div>
                    {levelUpData.xpAwarded > 0 && (
                      <div className="text-green-400 text-xs mt-1">+{levelUpData.xpAwarded} from this event</div>
                    )}
                  </div>
                </div>

                {levelUpData.canLevelUp ? (
                  <div className="bg-amber-900/20 border border-amber-700 rounded-lg p-4 text-center space-y-3">
                    <div className="text-amber-300 text-sm">
                      You have enough XP to reach <span className="font-bold text-white">Level {levelUpData.eligibleLevel}</span>
                    </div>
                    <div className="text-gray-400 text-xs">
                      +{levelUpData.skillPointsToGain} skill points
                    </div>
                    <button
                      onClick={handleLevelUp}
                      disabled={levelingUp}
                      className="px-6 py-2 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {levelingUp ? "Leveling Up..." : `Level Up to ${levelUpData.eligibleLevel}`}
                    </button>
                  </div>
                ) : (
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center space-y-1">
                    <div className="text-gray-400 text-sm">Not enough XP to level up yet.</div>
                    {levelUpData.xpNeededForNextLevel > 0 && (
                      <div className="text-gray-500 text-sm">
                        Need <span className="text-amber-400 font-bold">{levelUpData.xpNeededForNextLevel} more XP</span> for level {levelUpData.currentLevel + 1}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header Section */}
          <div className={sectionClass}>
            <h2 className="text-lg font-bold text-white">Event Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className={labelClass}>Event</div>
                <div className="text-white font-medium">{eventName || "Loading..."}</div>
              </div>
              <div>
                <div className={labelClass}>Character</div>
                {needsCharacterSelect && !characterId ? (
                  <select
                    value=""
                    onChange={(e) => {
                      const selected = availableCharacters.find((c) => c.id === e.target.value);
                      if (selected) {
                        setCharacterId(selected.id);
                        setCharacterName(selected.name);
                        setNeedsCharacterSelect(false);
                        // Load character skills for taught dropdown and trade skills
                        fetch(`/api/characters/${selected.id}`)
                          .then((r) => r.ok ? r.json() : null)
                          .then((cd) => {
                            if (cd?.data?.skills) {
                              setCharacterSkills(cd.data.skills.map((s: { skillName: string }) => s.skillName));
                              setCharacterTradeSkills(extractTradeSkills(cd.data.skills));
                            }
                          })
                          .catch(() => {});
                        // Check for existing sign-out for this character
                        fetch(`/api/characters/${selected.id}/signout?eventId=${eventId}`)
                          .then((r) => r.ok ? r.json() : null)
                          .then((signOut) => {
                            if (signOut) {
                              setNpcMinutes(signOut.npcMinutes ?? 0);
                              setNpcDetails(signOut.npcDetails ?? "");
                              setStaffMinutes(signOut.staffMinutes ?? 0);
                              setStaffDetails(signOut.staffDetails ?? "");
                              setLifeCreditsLost(signOut.lifeCreditsLost ?? 0);
                              setSkillsLearned(signOut.skillsLearned ? JSON.parse(signOut.skillsLearned) : []);
                              setSkillsTaught(signOut.skillsTaught ? JSON.parse(signOut.skillsTaught) : []);
                              setEventRating(signOut.eventRating ?? null);
                              setRoleplayQuality(signOut.roleplayQuality ?? "");
                              setEnjoyedEncounters(signOut.enjoyedEncounters ?? "");
                              setDislikedEncounters(signOut.dislikedEncounters ?? "");
                              setNotableRoleplay(signOut.notableRoleplay ?? "");
                              setAtmosphereFeedback(signOut.atmosphereFeedback ?? "");
                              setBetweenEventAction((signOut.betweenEventAction) ?? "nothing");
                              setBetweenEventDetails(signOut.betweenEventDetails ? JSON.parse(signOut.betweenEventDetails) : {});
                              setSignOutStatus(signOut.status);
                              const hrs = (Date.now() - new Date(signOut.createdAt).getTime()) / (1000 * 60 * 60);
                              if (signOut.status !== "pending" || hrs > 24) setReadOnly(true);
                              // Fetch level-up data if processed
                              if (signOut.status === "processed") {
                                fetch(`/api/characters/${selected.id}/levelup`)
                                  .then((r) => r.ok ? r.json() : null)
                                  .then((levelData) => {
                                    if (levelData) {
                                      setLevelUpData({ ...levelData, xpAwarded: signOut.xpAwarded ?? 0 });
                                    }
                                  })
                                  .catch(() => {});
                              }
                            }
                          })
                          .catch(() => {});
                      }
                    }}
                    className={inputClass}
                  >
                    <option value="">Select a character...</option>
                    {availableCharacters.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-white font-medium">{characterName || "Loading..."}</div>
                )}
              </div>
            </div>
          </div>

          {/* NPC Service */}
          <div className={sectionClass}>
            <h2 className="text-lg font-bold text-white">NPC Service</h2>
            <p className="text-gray-500 text-sm">
              Record any time you spent playing NPCs during the event.
            </p>
            <div>
              <label className={labelClass}>NPC Minutes</label>
              <input
                type="number"
                min={0}
                value={npcMinutes}
                onChange={(e) => setNpcMinutes(parseInt(e.target.value) || 0)}
                disabled={readOnly}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>NPC Details</label>
              <textarea
                value={npcDetails}
                onChange={(e) => setNpcDetails(e.target.value)}
                disabled={readOnly}
                placeholder="What NPCs did you play? Which encounters?"
                className={textareaClass}
              />
            </div>
          </div>

          {/* Staff Assistance */}
          <div className={sectionClass}>
            <h2 className="text-lg font-bold text-white">Staff Assistance</h2>
            <p className="text-gray-500 text-sm">
              Record any time you spent helping staff (setup, cleanup, logistics, etc.).
            </p>
            <div>
              <label className={labelClass}>Staff Minutes</label>
              <input
                type="number"
                min={0}
                value={staffMinutes}
                onChange={(e) => setStaffMinutes(parseInt(e.target.value) || 0)}
                disabled={readOnly}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Staff Details</label>
              <textarea
                value={staffDetails}
                onChange={(e) => setStaffDetails(e.target.value)}
                disabled={readOnly}
                placeholder="What tasks did you help with?"
                className={textareaClass}
              />
            </div>
          </div>

          {/* Life Credits Lost */}
          <div className={sectionClass}>
            <h2 className="text-lg font-bold text-white">Life Credits Lost</h2>
            <p className="text-gray-500 text-sm">
              How many life credits did your character lose during this event?
            </p>
            <div>
              <label className={labelClass}>Life Credits Lost</label>
              <input
                type="number"
                min={0}
                value={lifeCreditsLost}
                onChange={(e) => setLifeCreditsLost(parseInt(e.target.value) || 0)}
                disabled={readOnly}
                className={inputClass}
              />
            </div>
          </div>

          {/* Skills Learned */}
          <div className={sectionClass}>
            <h2 className="text-lg font-bold text-white">Skills Learned</h2>
            <p className="text-gray-500 text-sm">
              Record any skills you learned at this event from other players.
            </p>
            {skillsLearned.map((skill, idx) => {
              const teacherSkills = getTeacherSkills(skill.teacherCharacterId);
              const hasTeacher = !!skill.teacherCharacterId;
              return (
                <div key={idx} className="space-y-2 border border-gray-700 rounded-lg p-3">
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                    <div>
                      <label className={labelClass}>Teacher (Character)</label>
                      <select
                        value={skill.teacherCharacterId ?? ""}
                        onChange={(e) => selectTeacher(idx, e.target.value)}
                        disabled={readOnly}
                        className={inputClass}
                      >
                        <option value="">Select teacher...</option>
                        {eventAttendees
                          .filter((a) => a.characterId !== characterId) // exclude self
                          .map((a) => (
                            <option key={a.characterId} value={a.characterId}>
                              {a.characterName} ({a.playerName})
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Player Name</label>
                      <input
                        type="text"
                        value={skill.teacherCharacter}
                        readOnly
                        className={`${inputClass} opacity-70`}
                        placeholder="Auto-filled from teacher"
                      />
                    </div>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => removeSkillLearned(idx)}
                        className="px-3 py-2 rounded-lg bg-red-900/50 text-red-400 hover:bg-red-800 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
                    <div>
                      <label className={labelClass}>
                        Skill Name
                        {hasTeacher && teacherSkills.length === 0 && (
                          <span className="text-yellow-500 ml-2 text-xs">(teacher has no skills on record)</span>
                        )}
                      </label>
                      {hasTeacher && teacherSkills.length > 0 ? (
                        <select
                          value={skill.skillName}
                          onChange={(e) => updateSkillLearned(idx, "skillName", e.target.value)}
                          disabled={readOnly}
                          className={inputClass}
                        >
                          <option value="">Select skill teacher knows...</option>
                          {teacherSkills.map((name) => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                      ) : (
                        <select
                          value={skill.skillName}
                          onChange={(e) => updateSkillLearned(idx, "skillName", e.target.value)}
                          disabled={readOnly}
                          className={inputClass}
                        >
                          <option value="">Select skill...</option>
                          {skillCategories.map((cat) => (
                            <optgroup key={cat} label={cat}>
                              {allSkills.filter((s) => s.category === cat).map((s) => (
                                <option key={s.name} value={s.name}>{s.name}</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      )}
                    </div>
                    <div className="w-20">
                      <label className={labelClass}>Count</label>
                      <input
                        type="number"
                        min={1}
                        value={skill.count}
                        onChange={(e) => updateSkillLearned(idx, "count", parseInt(e.target.value) || 1)}
                        disabled={readOnly}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            {!readOnly && (
              <button
                type="button"
                onClick={addSkillLearned}
                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm border border-gray-700"
              >
                + Add Skill Learned
              </button>
            )}
          </div>

          {/* Skills Taught */}
          <div className={sectionClass}>
            <h2 className="text-lg font-bold text-white">Skills Taught</h2>
            <p className="text-gray-500 text-sm">
              Record any skills you taught to other players at this event.
            </p>
            {skillsTaught.map((skill, idx) => (
              <div key={idx} className="space-y-2 border border-gray-700 rounded-lg p-3">
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className={labelClass}>Skill Name</label>
                    <select
                      value={skill.skillName}
                      onChange={(e) => updateSkillTaught(idx, "skillName", e.target.value)}
                      disabled={readOnly}
                      className={inputClass}
                    >
                      <option value="">Select skill...</option>
                      {characterSkills.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => removeSkillTaught(idx)}
                      className="px-3 py-2 rounded-lg bg-red-900/50 text-red-400 hover:bg-red-800 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Students</label>
                  {/* Selected student pills */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(skill.studentIds ?? []).map((sid) => {
                      const student = eventAttendees.find((a) => a.characterId === sid);
                      return (
                        <span
                          key={sid}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-900/50 text-amber-300 text-sm border border-amber-700"
                        >
                          {student?.characterName ?? sid}
                          {!readOnly && (
                            <button
                              type="button"
                              onClick={() => removeStudentFromSkillTaught(idx, sid)}
                              className="text-amber-400 hover:text-red-400 ml-1 font-bold"
                            >
                              &times;
                            </button>
                          )}
                        </span>
                      );
                    })}
                  </div>
                  {/* Student search dropdown */}
                  {!readOnly && (
                    <StudentSearchDropdown
                      attendees={eventAttendees.filter(
                        (a) => a.characterId !== characterId && !(skill.studentIds ?? []).includes(a.characterId)
                      )}
                      onSelect={(charId) => addStudentToSkillTaught(idx, charId)}
                    />
                  )}
                </div>
              </div>
            ))}
            {!readOnly && (
              <button
                type="button"
                onClick={addSkillTaught}
                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm border border-gray-700"
              >
                + Add Skill Taught
              </button>
            )}
          </div>

          {/* Event Feedback */}
          <div className={sectionClass}>
            <h2 className="text-lg font-bold text-white">Event Feedback</h2>
            <p className="text-gray-500 text-sm">
              Help us improve by sharing your experience.
            </p>

            {/* Event Rating 1-10 */}
            <div>
              <label className={labelClass}>Event Rating (1-10)</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <button
                    key={n}
                    type="button"
                    disabled={readOnly}
                    onClick={() => setEventRating(n)}
                    className={`w-10 h-10 rounded-lg text-sm font-bold transition-colors ${
                      eventRating === n
                        ? "bg-amber-600 text-white"
                        : "bg-gray-800 text-gray-400 hover:bg-gray-700 disabled:hover:bg-gray-800"
                    } disabled:cursor-not-allowed`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Roleplay Quality */}
            <div>
              <label className={labelClass}>Roleplay Quality</label>
              <select
                value={roleplayQuality}
                onChange={(e) => setRoleplayQuality(e.target.value)}
                disabled={readOnly}
                className={inputClass}
              >
                <option value="">Select...</option>
                {ROLEPLAY_QUALITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Encounters You Enjoyed</label>
              <textarea
                value={enjoyedEncounters}
                onChange={(e) => setEnjoyedEncounters(e.target.value)}
                disabled={readOnly}
                placeholder="What encounters or moments stood out positively?"
                className={textareaClass}
              />
            </div>

            <div>
              <label className={labelClass}>Encounters You Disliked</label>
              <textarea
                value={dislikedEncounters}
                onChange={(e) => setDislikedEncounters(e.target.value)}
                disabled={readOnly}
                placeholder="Was there anything you didn't enjoy or felt could be improved?"
                className={textareaClass}
              />
            </div>

            <div>
              <label className={labelClass}>Notable Roleplay</label>
              <textarea
                value={notableRoleplay}
                onChange={(e) => setNotableRoleplay(e.target.value)}
                disabled={readOnly}
                placeholder="Any standout roleplay moments? Players who impressed you?"
                className={textareaClass}
              />
            </div>

            <div>
              <label className={labelClass}>Atmosphere Feedback</label>
              <textarea
                value={atmosphereFeedback}
                onChange={(e) => setAtmosphereFeedback(e.target.value)}
                disabled={readOnly}
                placeholder="How was the overall atmosphere, immersion, and setting?"
                className={textareaClass}
              />
            </div>
          </div>

          {/* Between-Event Action — hidden for GM/staff roles */}
          {session?.user?.role !== "gm" && (
          <div className={sectionClass}>
            <h2 className="text-lg font-bold text-white">Between-Event Action</h2>
            <p className="text-gray-500 text-sm">
              What will your character be doing between now and the next event?
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.entries(BETWEEN_EVENT_ACTIONS) as [BetweenEventAction, string][]).map(
                ([key, label]) => (
                  <label
                    key={key}
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                      betweenEventAction === key
                        ? "bg-amber-900/30 border-amber-600 text-amber-300"
                        : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600"
                    } ${readOnly ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    <input
                      type="radio"
                      name="betweenEventAction"
                      value={key}
                      checked={betweenEventAction === key}
                      onChange={() => {
                        setBetweenEventAction(key);
                        setBetweenEventDetails({});
                      }}
                      disabled={readOnly}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium">{label}</span>
                  </label>
                )
              )}
            </div>

            {/* Conditional fields based on action */}
            {betweenEventAction === "adventuring" && (
              <div className="space-y-4 pt-2 border-t border-gray-800">
                <div>
                  <label className={labelClass}>Description of Adventure</label>
                  <textarea
                    value={betweenEventDetails.description ?? ""}
                    onChange={(e) => updateBEDetail("description", e.target.value)}
                    disabled={readOnly}
                    placeholder="What is your character doing?"
                    className={textareaClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Encounter Runner (if any)</label>
                  <input
                    type="text"
                    value={betweenEventDetails.encounterRunner ?? ""}
                    onChange={(e) => updateBEDetail("encounterRunner", e.target.value)}
                    disabled={readOnly}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Companions</label>
                  <input
                    type="text"
                    value={betweenEventDetails.companions ?? ""}
                    onChange={(e) => updateBEDetail("companions", e.target.value)}
                    disabled={readOnly}
                    placeholder="Who is going with you?"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Relevant Skills</label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {characterSkills.length > 0 ? characterSkills.map((name) => (
                      <button
                        key={name}
                        type="button"
                        disabled={readOnly}
                        onClick={() => toggleSkill("relevantSkills", name)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          selectedRelevantSkills.includes(name)
                            ? "bg-amber-600 text-white"
                            : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                        } disabled:cursor-not-allowed`}
                      >
                        {name}
                      </button>
                    )) : (
                      <span className="text-gray-500 text-sm">No skills on character</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {betweenEventAction === "researching" && (
              <div className="space-y-4 pt-2 border-t border-gray-800">
                <div>
                  <label className={labelClass}>Research Topic</label>
                  <textarea
                    value={betweenEventDetails.topic ?? ""}
                    onChange={(e) => updateBEDetail("topic", e.target.value)}
                    disabled={readOnly}
                    placeholder="What are you researching?"
                    className={textareaClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Location</label>
                  <input
                    type="text"
                    value={betweenEventDetails.location ?? ""}
                    onChange={(e) => updateBEDetail("location", e.target.value)}
                    disabled={readOnly}
                    placeholder="Where are you conducting research?"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Relevant Skills</label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {characterSkills.length > 0 ? characterSkills.map((name) => (
                      <button
                        key={name}
                        type="button"
                        disabled={readOnly}
                        onClick={() => toggleSkill("relevantSkills", name)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          selectedRelevantSkills.includes(name)
                            ? "bg-amber-600 text-white"
                            : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                        } disabled:cursor-not-allowed`}
                      >
                        {name}
                      </button>
                    )) : (
                      <span className="text-gray-500 text-sm">No skills on character</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Leads / Contacts</label>
                  <input
                    type="text"
                    value={betweenEventDetails.leadsContacts ?? ""}
                    onChange={(e) => updateBEDetail("leadsContacts", e.target.value)}
                    disabled={readOnly}
                    placeholder="Any leads or people you're reaching out to?"
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {betweenEventAction === "crafting" && (
              <div className="space-y-4 pt-2 border-t border-gray-800">
                {/* Crafting mode: items or coin */}
                <div>
                  <label className={labelClass}>What are you doing?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: "items", label: "Crafting Items (Tag Submission)" },
                      { key: "coin", label: "Crafting for Coin" },
                    ].map(({ key, label }) => (
                      <label
                        key={key}
                        className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                          betweenEventDetails.craftingMode === key
                            ? "bg-amber-900/30 border-amber-600 text-amber-300"
                            : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600"
                        } ${readOnly ? "cursor-not-allowed opacity-50" : ""}`}
                      >
                        <input
                          type="radio"
                          name="craftingMode"
                          value={key}
                          checked={betweenEventDetails.craftingMode === key}
                          onChange={() => updateBEDetail("craftingMode", key)}
                          disabled={readOnly}
                          className="sr-only"
                        />
                        <span className="text-sm font-medium">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Craft for Coin */}
                {betweenEventDetails.craftingMode === "coin" && (
                  <div className="space-y-3">
                    <div>
                      <label className={labelClass}>Trade Skill</label>
                      {characterTradeSkills.length > 0 ? (
                        <select
                          value={betweenEventDetails.coinSkill ?? ""}
                          onChange={(e) => {
                            const skill = characterTradeSkills.find(
                              (s) => `${s.skillName}${s.specialization ? ` (${s.specialization})` : ""}` === e.target.value
                            );
                            updateBEDetail("coinSkill", e.target.value);
                            updateBEDetail("coinSkillLevel", String(skill?.purchaseCount ?? 1));
                          }}
                          disabled={readOnly}
                          className={inputClass}
                        >
                          <option value="">Select trade skill...</option>
                          {characterTradeSkills.map((s) => {
                            const label = s.specialization ? `${s.skillName} (${s.specialization})` : s.skillName;
                            const tier = craftLevelToTier(s.purchaseCount);
                            const rate = PROFESSION_RATES[tier].standard;
                            return (
                              <option key={label} value={label}>
                                {label} Lvl {s.purchaseCount} ({tier}) — {rate / 100} silver
                              </option>
                            );
                          })}
                        </select>
                      ) : (
                        <div className="text-gray-500 text-sm p-3 bg-gray-800 rounded-lg border border-gray-700">
                          No trade skills on this character (Craft, Herbalism, Forensics, or Pick Locks required)
                        </div>
                      )}
                    </div>
                    {betweenEventDetails.coinSkill && (
                      <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-3">
                        <div className="text-sm text-gray-300">
                          Estimated earning:{" "}
                          <span className="text-amber-400 font-bold">
                            {PROFESSION_RATES[craftLevelToTier(parseInt(betweenEventDetails.coinSkillLevel ?? "1"))].standard / 100} silver
                          </span>
                          <span className="text-gray-500 text-xs ml-2">(standard period)</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Craft Items — Item Creation Form */}
                {betweenEventDetails.craftingMode === "items" && (
                  <ItemCreationSection
                    characterId={characterId}
                    eventId={eventId}
                    readOnly={readOnly}
                    inputClass={inputClass}
                    textareaClass={textareaClass}
                    labelClass={labelClass}
                  />
                )}
              </div>
            )}

            {betweenEventAction === "traveling" && (
              <div className="space-y-4 pt-2 border-t border-gray-800">
                <div>
                  <label className={labelClass}>Destination</label>
                  <input
                    type="text"
                    value={betweenEventDetails.destination ?? ""}
                    onChange={(e) => updateBEDetail("destination", e.target.value)}
                    disabled={readOnly}
                    placeholder="Where are you going?"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Method of Travel</label>
                  <input
                    type="text"
                    value={betweenEventDetails.method ?? ""}
                    onChange={(e) => updateBEDetail("method", e.target.value)}
                    disabled={readOnly}
                    placeholder="How are you traveling?"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Companions</label>
                  <input
                    type="text"
                    value={betweenEventDetails.companions ?? ""}
                    onChange={(e) => updateBEDetail("companions", e.target.value)}
                    disabled={readOnly}
                    placeholder="Who is traveling with you?"
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {betweenEventAction === "governing" && (
              <div className="space-y-4 pt-2 border-t border-gray-800">
                <div>
                  <label className={labelClass}>Actions Being Taken</label>
                  <textarea
                    value={betweenEventDetails.actions ?? ""}
                    onChange={(e) => updateBEDetail("actions", e.target.value)}
                    disabled={readOnly}
                    placeholder="What governing actions are you taking?"
                    className={textareaClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Affected Locations / People</label>
                  <input
                    type="text"
                    value={betweenEventDetails.affectedLocations ?? ""}
                    onChange={(e) => updateBEDetail("affectedLocations", e.target.value)}
                    disabled={readOnly}
                    placeholder="Who or what is affected?"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Resources Being Used</label>
                  <input
                    type="text"
                    value={betweenEventDetails.resources ?? ""}
                    onChange={(e) => updateBEDetail("resources", e.target.value)}
                    disabled={readOnly}
                    placeholder="What resources are you committing?"
                    className={inputClass}
                  />
                </div>
              </div>
            )}
          </div>
          )}

          {/* Submit */}
          {!readOnly && (
            <div className="flex justify-end gap-3 pb-8">
              <Link
                href="/"
                className="px-6 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || !characterId}
                className="px-8 py-2 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? "Submitting..." : "Submit Sign-Out"}
              </button>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}

// ─── Item Creation Section ──────────────────────────────────────────────────

const ITEM_TYPE_OPTIONS = Object.entries(ITEM_TYPES).filter(([k]) => k !== "coin_earning");

const ARMOR_TYPES = ["Leather", "Composite", "Chain/Scale", "Plate"] as const;
const TOXIN_TYPES = ["Liquid", "Vapor", "Paste"] as const;
const ELEMENTS = ["Fire", "Air", "Earth", "Water"] as const;
const ENERGIES = ["Positive", "Negative", "Neutral", "Wild"] as const;

interface ItemFormData {
  itemType: string;
  itemName: string;
  craftingSkill: string;
  craftingLevel: number;
  quantity: number;
  craftingTime: string;
  primaryMaterial: string;
  secondaryMaterial: string;
  masterCrafted: boolean;
  hasMaterialUnits: string;
  itemDescription: string;
  // Type-specific
  armorType: string;
  weaponType: string;
  spellName: string;
  spellLevel: number;
  element: string;
  energy: string;
  poisonous: boolean;
  toxinType: string;
  trapType: string;
  notes: string;
}

const EMPTY_ITEM: ItemFormData = {
  itemType: "", itemName: "", craftingSkill: "", craftingLevel: 1, quantity: 1,
  craftingTime: "", primaryMaterial: "", secondaryMaterial: "", masterCrafted: false,
  hasMaterialUnits: "", itemDescription: "", armorType: "", weaponType: "",
  spellName: "", spellLevel: 1, element: "", energy: "", poisonous: false,
  toxinType: "", trapType: "", notes: "",
};

function ItemCreationSection({
  characterId, eventId, readOnly, inputClass, textareaClass, labelClass,
}: {
  characterId: string;
  eventId: string;
  readOnly: boolean;
  inputClass: string;
  textareaClass: string;
  labelClass: string;
}) {
  const [items, setItems] = useState<{ id: string; itemType: string; itemName: string; status: string }[]>([]);
  const [form, setForm] = useState<ItemFormData>({ ...EMPTY_ITEM });
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Load existing item submissions for this event
  useEffect(() => {
    if (!characterId) return;
    fetch(`/api/characters/${characterId}/items?eventId=${eventId}`)
      .then((r) => r.ok ? r.json() : { items: [] })
      .then((data) => setItems(data.items ?? []))
      .catch(() => {});
  }, [characterId, eventId]);

  const updateForm = <K extends keyof ItemFormData>(key: K, value: ItemFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submitItem = async () => {
    if (!form.itemType || !form.itemName || !form.craftingSkill) {
      setError("Item type, name, and crafting skill are required");
      return;
    }
    setSubmitting(true);
    setError("");

    const extraDetails: Record<string, unknown> = {};
    const t = form.itemType;
    if (form.armorType) extraDetails.armorType = form.armorType;
    if (form.weaponType) extraDetails.weaponType = form.weaponType;
    if (form.spellName) extraDetails.spellName = form.spellName;
    if (form.spellLevel > 1) extraDetails.spellLevel = form.spellLevel;
    if (form.element) extraDetails.element = form.element;
    if (form.energy) extraDetails.energy = form.energy;
    if (form.poisonous) extraDetails.poisonous = true;
    if (form.toxinType) extraDetails.toxinType = form.toxinType;
    if (form.trapType) extraDetails.trapType = form.trapType;
    if (form.hasMaterialUnits) extraDetails.hasMaterialUnits = form.hasMaterialUnits;
    if (form.notes) extraDetails.notes = form.notes;
    if (["armor", "weapons", "misc_craft"].includes(t) && form.masterCrafted) {
      extraDetails.masterCrafted = true;
    }

    try {
      const res = await fetch(`/api/characters/${characterId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          itemType: form.itemType,
          itemName: form.itemName,
          itemDescription: form.itemDescription || undefined,
          craftingSkill: form.craftingSkill,
          craftingLevel: form.craftingLevel,
          quantity: form.quantity,
          craftingTime: form.craftingTime || undefined,
          primaryMaterial: form.primaryMaterial || undefined,
          secondaryMaterial: form.secondaryMaterial || undefined,
          masterCrafted: form.masterCrafted,
          extraDetails: Object.keys(extraDetails).length > 0 ? extraDetails : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit item");
      }

      const created = await res.json();
      setItems((prev) => [...prev, { id: created.id, itemType: created.itemType, itemName: created.itemName, status: created.status }]);
      setForm({ ...EMPTY_ITEM });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    }
    setSubmitting(false);
  };

  const t = form.itemType;
  const showMaterials = !!t && t !== "coin_earning";
  const showMastercraft = ["armor", "weapons", "misc_craft"].includes(t);
  const showMaterialUnits = ["armor", "weapons", "misc_craft"].includes(t);
  const showSpell = ["potions", "scrolls", "enchanting"].includes(t);
  const showElement = ["potions", "scrolls"].includes(t);
  const showArmorType = t === "armor";
  const showWeaponType = t === "weapons";
  const showPoisonous = t === "herbs";
  const showToxinType = t === "toxins";
  const showTrapType = t === "traps";

  return (
    <div className="space-y-3">
      {/* Existing submissions */}
      {items.length > 0 && (
        <div className="space-y-1.5">
          <label className={labelClass}>Submitted Items</label>
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-3 py-2 bg-gray-800 rounded-lg border border-gray-700">
              <div>
                <span className="text-white text-sm">{item.itemName}</span>
                <span className="text-gray-500 text-xs ml-2">({ITEM_TYPES[item.itemType as ItemType] ?? item.itemType})</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                item.status === "approved" ? "bg-green-900 text-green-300" :
                item.status === "denied" ? "bg-red-900 text-red-300" :
                "bg-yellow-900 text-yellow-300"
              }`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {!readOnly && !showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-lg bg-amber-800 text-amber-200 hover:bg-amber-700 text-sm border border-amber-700"
        >
          + Add Item Submission
        </button>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-300 text-sm">{error}</div>
      )}

      {showForm && !readOnly && (
        <div className="space-y-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <h4 className="text-white font-medium text-sm">New Item Submission</h4>

          {/* Item Type */}
          <div>
            <label className={labelClass}>Item Type *</label>
            <select value={form.itemType} onChange={(e) => updateForm("itemType", e.target.value)} className={inputClass}>
              <option value="">Select type...</option>
              {ITEM_TYPE_OPTIONS.map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {t && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Item Name *</label>
                  <input type="text" value={form.itemName} onChange={(e) => updateForm("itemName", e.target.value)} className={inputClass} placeholder="Name of the item" />
                </div>
                <div>
                  <label className={labelClass}>Crafting Skill *</label>
                  <select value={form.craftingSkill} onChange={(e) => updateForm("craftingSkill", e.target.value)} className={inputClass}>
                    <option value="">Select skill...</option>
                    {CRAFTING_SKILLS.map((skill) => (
                      <option key={skill} value={skill}>{skill}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Item Description</label>
                <textarea value={form.itemDescription} onChange={(e) => updateForm("itemDescription", e.target.value)} className={textareaClass} placeholder="Description of what the item is/does" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Skill Level</label>
                  <input type="number" min={1} max={9} value={form.craftingLevel} onChange={(e) => updateForm("craftingLevel", parseInt(e.target.value) || 1)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Quantity</label>
                  <input type="number" min={1} value={form.quantity} onChange={(e) => updateForm("quantity", parseInt(e.target.value) || 1)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Crafting Time</label>
                  <input type="text" value={form.craftingTime} onChange={(e) => updateForm("craftingTime", e.target.value)} className={inputClass} placeholder="e.g. 4 of 4 weeks" />
                </div>
              </div>

              {showMaterials && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Primary Material</label>
                    <select value={form.primaryMaterial} onChange={(e) => updateForm("primaryMaterial", e.target.value)} className={inputClass}>
                      <option value="">Select material...</option>
                      {ALL_MATERIALS.map((mat) => (
                        <option key={mat} value={mat}>{mat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Secondary Material</label>
                    <select value={form.secondaryMaterial} onChange={(e) => updateForm("secondaryMaterial", e.target.value)} className={inputClass}>
                      <option value="">None</option>
                      {ALL_MATERIALS.map((mat) => (
                        <option key={mat} value={mat}>{mat}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Type-specific fields */}
              {showArmorType && (
                <div>
                  <label className={labelClass}>Armor Type</label>
                  <div className="flex gap-2">
                    {ARMOR_TYPES.map((at) => (
                      <label key={at} className={`px-3 py-1.5 rounded-lg border cursor-pointer text-sm ${form.armorType === at ? "bg-amber-900/30 border-amber-600 text-amber-300" : "bg-gray-800 border-gray-700 text-gray-400"}`}>
                        <input type="radio" value={at} checked={form.armorType === at} onChange={() => updateForm("armorType", at)} className="sr-only" />
                        {at}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {showWeaponType && (
                <div>
                  <label className={labelClass}>Weapon Type</label>
                  <select value={form.weaponType} onChange={(e) => updateForm("weaponType", e.target.value)} className={inputClass}>
                    <option value="">Select weapon type...</option>
                    {Object.entries(WEAPON_TYPES).map(([group, weapons]) => (
                      <optgroup key={group} label={group}>
                        {weapons.map((w) => (
                          <option key={w} value={w}>{w}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              )}

              {showSpell && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Spell Name</label>
                    <input type="text" value={form.spellName} onChange={(e) => updateForm("spellName", e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Spell Level</label>
                    <input type="number" min={1} max={9} value={form.spellLevel} onChange={(e) => updateForm("spellLevel", parseInt(e.target.value) || 1)} className={inputClass} />
                  </div>
                </div>
              )}

              {showElement && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Element</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {ELEMENTS.map((el) => (
                        <label key={el} className={`px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer ${form.element === el ? "bg-amber-600 text-white" : "bg-gray-800 text-gray-400"}`}>
                          <input type="radio" value={el} checked={form.element === el} onChange={() => updateForm("element", el)} className="sr-only" />
                          {el}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Energy</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {ENERGIES.map((en) => (
                        <label key={en} className={`px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer ${form.energy === en ? "bg-amber-600 text-white" : "bg-gray-800 text-gray-400"}`}>
                          <input type="radio" value={en} checked={form.energy === en} onChange={() => updateForm("energy", en)} className="sr-only" />
                          {en}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {showPoisonous && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.poisonous} onChange={(e) => updateForm("poisonous", e.target.checked)} />
                  <span className="text-sm text-gray-300">Poisonous Herb</span>
                </label>
              )}

              {showToxinType && (
                <div>
                  <label className={labelClass}>Toxin Type</label>
                  <div className="flex gap-2">
                    {TOXIN_TYPES.map((tt) => (
                      <label key={tt} className={`px-3 py-1.5 rounded-lg border cursor-pointer text-sm ${form.toxinType === tt ? "bg-amber-900/30 border-amber-600 text-amber-300" : "bg-gray-800 border-gray-700 text-gray-400"}`}>
                        <input type="radio" value={tt} checked={form.toxinType === tt} onChange={() => updateForm("toxinType", tt)} className="sr-only" />
                        {tt}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {showTrapType && (
                <div>
                  <label className={labelClass}>Trap Type</label>
                  <input type="text" value={form.trapType} onChange={(e) => updateForm("trapType", e.target.value)} className={inputClass} placeholder="Type of trap" />
                </div>
              )}

              {showMastercraft && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.masterCrafted} onChange={(e) => updateForm("masterCrafted", e.target.checked)} />
                  <span className="text-sm text-gray-300">Master Crafted</span>
                </label>
              )}

              {showMaterialUnits && (
                <div>
                  <label className={labelClass}>Do you have Material Units?</label>
                  <div className="flex gap-2">
                    {["Yes", "No", "N/A"].map((opt) => (
                      <label key={opt} className={`px-3 py-1.5 rounded-lg border cursor-pointer text-sm ${form.hasMaterialUnits === opt ? "bg-amber-900/30 border-amber-600 text-amber-300" : "bg-gray-800 border-gray-700 text-gray-400"}`}>
                        <input type="radio" value={opt} checked={form.hasMaterialUnits === opt} onChange={() => updateForm("hasMaterialUnits", opt)} className="sr-only" />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className={labelClass}>Notes for Economy Staff</label>
                <textarea value={form.notes} onChange={(e) => updateForm("notes", e.target.value)} className={textareaClass} placeholder="Any questions or additional details" />
              </div>

              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => { setShowForm(false); setForm({ ...EMPTY_ITEM }); }} className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 text-sm">
                  Cancel
                </button>
                <button type="button" onClick={submitItem} disabled={submitting} className="px-4 py-2 rounded-lg bg-green-700 text-white font-medium hover:bg-green-600 disabled:opacity-50 text-sm">
                  {submitting ? "Submitting..." : "Submit Item"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
