"use client";

import { CharacterClass } from "@/types/character";
import { classes } from "@/data/classes";

interface Props {
  selectedClass: CharacterClass | null;
  onSelect: (cls: CharacterClass) => void;
}

const classColors: Record<CharacterClass, string> = {
  Warrior: "text-red-400",
  Rogue: "text-purple-400",
  Cleric: "text-blue-400",
  Mage: "text-cyan-400",
};

const classIcons: Record<CharacterClass, string> = {
  Warrior: "⚔️",
  Rogue: "🗡️",
  Cleric: "🛡️",
  Mage: "🔮",
};

export default function ClassStep({ selectedClass, onSelect }: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-amber-400">Choose Your Class</h2>
      <p className="text-gray-400 text-sm">
        Your class affects how much each skill costs to purchase, but any class may purchase any skill.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {classes.map((cls) => (
          <button
            key={cls.name}
            onClick={() => onSelect(cls.name)}
            className={`text-left p-5 rounded-lg border-2 transition-all ${
              selectedClass === cls.name
                ? "border-amber-500 bg-amber-950/30"
                : "border-gray-700 bg-gray-800/50 hover:border-gray-500"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{classIcons[cls.name]}</span>
              <h3 className={`text-xl font-bold ${classColors[cls.name]}`}>{cls.name}</h3>
            </div>
            <p className="text-gray-400 text-sm mt-2">{cls.description}</p>
            <div className="mt-3 text-xs text-gray-500">
              <span>Level 1 Class BP: </span>
              <span className="text-blue-400 font-bold">{cls.bodyPointsByLevel[0]}</span>
              <span className="mx-2">|</span>
              <span>Level 5 Class BP: </span>
              <span className="text-blue-400 font-bold">{cls.bodyPointsByLevel[4]}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
