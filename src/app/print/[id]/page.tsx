"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Character } from "@/types/character";
import { races } from "@/data/races";
import { classes } from "@/data/classes";
import { xpTable } from "@/data/xp-table";

interface EventHistory {
  eventId: string;
  eventTitle: string;
  startDate: string;
  endDate: string;
  location: string;
  xpEarned: number;
  npcMinutes: number;
  checkedInAt: string | null;
  checkedOutAt: string | null;
}

interface CharacterHistory {
  characterId: string;
  characterName: string;
  currentLevel: number;
  totalXP: number;
  totalNPCMinutes: number;
  eventsAttended: number;
  eventHistory: EventHistory[];
}

export default function PrintPage() {
  const params = useParams();
  const [character, setCharacter] = useState<Character | null>(null);
  const [history, setHistory] = useState<CharacterHistory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/characters/${params.id}`).then((r) => r.json()),
      fetch(`/api/characters/${params.id}/history`).then((r) => r.json()),
    ])
      .then(([charData, historyData]) => {
        setCharacter(charData.data);
        setHistory(historyData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    if (character && !loading) {
      setTimeout(() => window.print(), 500);
    }
  }, [character, loading]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!character) return <div className="p-8 text-center">Character not found.</div>;

  const raceInfo = races.find((r) => r.name === character.race);
  const classInfo = classes.find((c) => c.name === character.characterClass);
  const raceBP = raceInfo?.bodyPointsByLevel[0] ?? 0;
  const classBP = classInfo?.bodyPointsByLevel[0] ?? 0;

  // Calculate XP progression
  const currentLevelXP = xpTable[character.level - 1] ?? 0;
  const nextLevelXP = xpTable[character.level] ?? 999999;
  const totalXP = history?.totalXP ?? 0;
  const xpProgress = totalXP - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;

  return (
    <div className="print-sheet">
      <style jsx global>{`
        @media print {
          body { background: white !important; color: black !important; font-size: 11pt; }
          .print-sheet { max-width: 100%; padding: 0; margin: 0; }
          .no-print { display: none !important; }
          @page { margin: 0.5in; }
        }
        @media screen {
          .print-sheet { max-width: 800px; margin: 0 auto; padding: 2rem; background: white; color: black; min-height: 100vh; }
        }
      `}</style>

      <button
        onClick={() => window.print()}
        className="no-print fixed top-4 right-4 px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-500"
      >
        Print
      </button>
      <button
        onClick={() => window.close()}
        className="no-print fixed top-4 right-24 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
      >
        Close
      </button>

      <div style={{ borderBottom: "3px solid black", paddingBottom: "0.5rem", marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "24pt", fontWeight: "bold", margin: 0 }}>
          {character.name}
        </h1>
        <div style={{ fontSize: "12pt", color: "#555" }}>
          Level {character.level} {character.race} {character.characterClass} | Kanar Gaming Enterprises
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.5rem", marginBottom: "1rem" }}>
        <StatBox label="Body Points" value={raceBP + classBP} />
        <StatBox label="Race BP" value={raceBP} />
        <StatBox label="Class BP" value={classBP} />
        <StatBox label="Silver Banked" value={50 - character.silverSpent} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
        <div>
          <SectionHeader>Character Info</SectionHeader>
          <InfoRow label="Name" value={character.name} />
          <InfoRow label="Race" value={character.race} />
          <InfoRow label="Class" value={character.characterClass} />
          <InfoRow label="Level" value={String(character.level)} />
          <InfoRow label="Language" value={`${character.freeLanguage} (free)`} />
          {raceInfo && raceInfo.bonusSkills.length > 0 && (
            <InfoRow
              label="Race Bonus"
              value={raceInfo.bonusSkills.map((s) => `${s.name} x${s.count}`).join(", ")}
            />
          )}
          <InfoRow label="Skill Points Used" value={`${character.skillPointsSpent} / 140`} />
          <InfoRow label="Silver Spent" value={`${character.silverSpent} / 50`} />
          {raceInfo && (
            <InfoRow label="Costuming" value={raceInfo.costumingRequirements} />
          )}
        </div>

        <div>
          <SectionHeader>Equipment</SectionHeader>
          {character.equipment.length === 0 ? (
            <div style={{ color: "#999", fontSize: "10pt" }}>No equipment purchased</div>
          ) : (
            <table style={{ width: "100%", fontSize: "10pt", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #ccc" }}>
                  <th style={{ textAlign: "left", padding: "2px 4px" }}>Item</th>
                  <th style={{ textAlign: "center", padding: "2px 4px" }}>Qty</th>
                  <th style={{ textAlign: "right", padding: "2px 4px" }}>Cost</th>
                </tr>
              </thead>
              <tbody>
                {character.equipment.map((e) => (
                  <tr key={e.itemName} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "2px 4px" }}>{e.itemName}</td>
                    <td style={{ textAlign: "center", padding: "2px 4px" }}>{e.quantity}</td>
                    <td style={{ textAlign: "right", padding: "2px 4px" }}>{e.totalCost} Ag</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <SectionHeader>Skills</SectionHeader>
      {character.skills.length === 0 ? (
        <div style={{ color: "#999", fontSize: "10pt" }}>No skills purchased</div>
      ) : (
        <table style={{ width: "100%", fontSize: "10pt", borderCollapse: "collapse", marginBottom: "1rem" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #333" }}>
              <th style={{ textAlign: "left", padding: "3px 4px" }}>Skill</th>
              <th style={{ textAlign: "center", padding: "3px 4px" }}>Purchases</th>
              <th style={{ textAlign: "right", padding: "3px 4px" }}>Total Cost</th>
            </tr>
          </thead>
          <tbody>
            {character.skills.map((s) => (
              <tr key={s.skillName} style={{ borderBottom: "1px solid #ddd" }}>
                <td style={{ padding: "2px 4px" }}>{s.skillName}</td>
                <td style={{ textAlign: "center", padding: "2px 4px" }}>{s.purchaseCount}</td>
                <td style={{ textAlign: "right", padding: "2px 4px" }}>{s.totalCost}p</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {history && history.eventsAttended > 0 && (
        <>
          <SectionHeader>Career Progression</SectionHeader>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.5rem", marginBottom: "1rem" }}>
            <StatBox label="Total XP" value={history.totalXP} />
            <StatBox label="Events" value={history.eventsAttended} />
            <StatBox label="NPC Hours" value={Math.floor(history.totalNPCMinutes / 60)} />
            <StatBox label="Next Level XP" value={character.level < 30 ? xpNeeded - xpProgress : 0} />
          </div>

          <SectionHeader>Event History</SectionHeader>
          <table style={{ width: "100%", fontSize: "10pt", borderCollapse: "collapse", marginBottom: "1rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #333" }}>
                <th style={{ textAlign: "left", padding: "3px 4px" }}>Event</th>
                <th style={{ textAlign: "left", padding: "3px 4px" }}>Date</th>
                <th style={{ textAlign: "center", padding: "3px 4px" }}>XP</th>
                <th style={{ textAlign: "center", padding: "3px 4px" }}>NPC Min</th>
              </tr>
            </thead>
            <tbody>
              {history.eventHistory.map((evt) => (
                <tr key={evt.eventId} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "2px 4px" }}>{evt.eventTitle}</td>
                  <td style={{ padding: "2px 4px" }}>
                    {new Date(evt.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td style={{ textAlign: "center", padding: "2px 4px" }}>{evt.xpEarned}</td>
                  <td style={{ textAlign: "center", padding: "2px 4px" }}>{evt.npcMinutes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {character.history && (
        <>
          <SectionHeader>Character History</SectionHeader>
          <p style={{ fontSize: "10pt", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
            {character.history}
          </p>
        </>
      )}

      <div style={{ marginTop: "2rem", borderTop: "1px solid #ccc", paddingTop: "0.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        <div>
          <div style={{ fontSize: "9pt", color: "#999", marginBottom: "2rem" }}>Player Signature</div>
          <div style={{ borderBottom: "1px solid #333", width: "100%" }} />
        </div>
        <div>
          <div style={{ fontSize: "9pt", color: "#999", marginBottom: "2rem" }}>Staff Signature</div>
          <div style={{ borderBottom: "1px solid #333", width: "100%" }} />
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: "13pt", fontWeight: "bold", borderBottom: "2px solid #333", paddingBottom: "3px", marginBottom: "0.5rem", marginTop: "0.5rem" }}>
      {children}
    </h2>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ border: "2px solid #333", borderRadius: "4px", padding: "0.5rem", textAlign: "center" }}>
      <div style={{ fontSize: "20pt", fontWeight: "bold" }}>{value}</div>
      <div style={{ fontSize: "8pt", color: "#666", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10pt", padding: "2px 0", borderBottom: "1px solid #eee" }}>
      <span style={{ fontWeight: "bold", color: "#555" }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
