"use client";

import { Character } from "@/types/character";
import { races } from "@/data/races";
import { classes } from "@/data/classes";

interface Props {
  character: Character;
}

export default function SummaryStep({ character }: Props) {
  const raceInfo = races.find((r) => r.name === character.race);
  const classInfo = classes.find((c) => c.name === character.characterClass);
  const raceBP = raceInfo?.bodyPointsByLevel[character.level - 1] ?? 0;
  const classBP = classInfo?.bodyPointsByLevel[character.level - 1] ?? 0;
  const totalBP = raceBP + classBP;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-amber-400">Character Summary</h2>

      <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-700 pb-3">
          <div>
            <h3 className="text-xl font-bold text-white">{character.name || "Unnamed Character"}</h3>
            <p className="text-gray-400 text-sm">
              Level {character.level} {character.race} {character.characterClass}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-red-400">{totalBP}</div>
            <div className="text-xs text-gray-500">Body Points</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBlock label="Race BP" value={raceBP} />
          <StatBlock label="Class BP" value={classBP} />
          <StatBlock label="Skill Points Used" value={character.skillPointsSpent} max={140} />
          <StatBlock label="Starting Bank" value={50 - character.silverSpent} max={50} />
        </div>

        <div>
          <h4 className="text-sm font-bold text-gray-300 mb-1">Language</h4>
          <p className="text-gray-400 text-sm">{character.freeLanguage} (free)</p>
        </div>

        {raceInfo && raceInfo.bonusSkills.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-gray-300 mb-1">Race Bonus Skills</h4>
            <div className="flex flex-wrap gap-1">
              {raceInfo.bonusSkills.map((s) => (
                <span
                  key={s.name}
                  className="px-2 py-0.5 bg-green-900/50 text-green-300 text-xs rounded"
                >
                  {s.name} (x{s.count})
                </span>
              ))}
            </div>
          </div>
        )}

        {character.skills.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-gray-300 mb-2">Purchased Skills</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
              {character.skills.map((s) => (
                <div
                  key={s.skillName}
                  className="flex justify-between px-2 py-1 bg-gray-900/50 rounded text-sm"
                >
                  <span className="text-gray-300">
                    {s.skillName}
                    {s.purchaseCount > 1 && (
                      <span className="text-amber-400"> x{s.purchaseCount}</span>
                    )}
                  </span>
                  <span className="text-amber-400 font-mono">{s.totalCost}p</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {character.equipment.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-gray-300 mb-2">Equipment</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
              {character.equipment.map((e) => (
                <div
                  key={e.itemName}
                  className="flex justify-between px-2 py-1 bg-gray-900/50 rounded text-sm"
                >
                  <span className="text-gray-300">
                    {e.itemName}
                    {e.quantity > 1 && <span className="text-amber-400"> x{e.quantity}</span>}
                  </span>
                  <span className="text-amber-400 font-mono">{e.totalCost} Ag</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {character.history && (
          <div>
            <h4 className="text-sm font-bold text-gray-300 mb-1">Character History</h4>
            <p className="text-gray-400 text-sm whitespace-pre-wrap">{character.history}</p>
          </div>
        )}
      </div>

      <div className="bg-amber-950/30 border border-amber-700 rounded-lg p-4">
        <p className="text-amber-300 text-sm">
          Remember to check in at the designated staff area before going on field.
          See the Economy Marshal at your first event for starting equipment, coin, and player bank setup.
        </p>
      </div>
    </div>
  );
}

function StatBlock({ label, value, max }: { label: string; value: number; max?: number }) {
  return (
    <div className="bg-gray-900/50 rounded p-2 text-center">
      <div className="text-lg font-bold text-white">
        {value}
        {max !== undefined && <span className="text-gray-500 text-sm">/{max}</span>}
      </div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
