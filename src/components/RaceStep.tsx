"use client";

import { Race } from "@/types/character";
import { races } from "@/data/races";

interface Props {
  selectedRace: Race | null;
  onSelect: (race: Race) => void;
}

export default function RaceStep({ selectedRace, onSelect }: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-amber-400">Choose Your Race</h2>
      <p className="text-gray-400 text-sm">
        Each race has its own benefits and drawbacks. Non-Human races must meet costuming requirements.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {races.map((race) => (
          <button
            key={race.name}
            onClick={() => onSelect(race.name)}
            className={`text-left p-4 rounded-lg border-2 transition-all ${
              selectedRace === race.name
                ? "border-amber-500 bg-amber-950/30"
                : "border-gray-700 bg-gray-800/50 hover:border-gray-500"
            }`}
          >
            <h3 className="text-lg font-bold text-white">{race.name}</h3>
            <p className="text-gray-400 text-sm mt-1">{race.description}</p>
            <div className="mt-2">
              <span className="text-xs text-gray-500">Bonus Skills: </span>
              {race.bonusSkills.length > 0 ? (
                <span className="text-xs text-green-400">
                  {race.bonusSkills.map((s) => `${s.name} (x${s.count})`).join(", ")}
                </span>
              ) : (
                <span className="text-xs text-yellow-400">Choose one from parent race</span>
              )}
            </div>
            <div className="mt-1">
              <span className="text-xs text-gray-500">Costuming: </span>
              <span className="text-xs text-gray-400">{race.costumingRequirements}</span>
            </div>
            <div className="mt-1">
              <span className="text-xs text-gray-500">Level 1 Race BP: </span>
              <span className="text-xs text-blue-400">{race.bodyPointsByLevel[0]}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
