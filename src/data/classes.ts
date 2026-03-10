import { CharacterClass } from "@/types/character";

interface ClassInfo {
  name: CharacterClass;
  description: string;
  bodyPointsByLevel: number[]; // level 1-30
}

// Warrior: 4,7,10,13,16,19,22,25,28,31,34,37,40,43,46,49,52,55,58,61,64,67,70,73,76,79,82,85,88,91
// Rogue: 4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,46,48,50,52,54,56,58,60,62
// Cleric: 4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,46,48,50,52,54,56,58,60,62
// Mage: 4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33

export const classes: ClassInfo[] = [
  {
    name: "Warrior",
    description: "Dedicate most of their time to weapon play and physical training.",
    bodyPointsByLevel: Array.from({ length: 30 }, (_, i) => 4 + i * 3),
  },
  {
    name: "Rogue",
    description: "Thrive in society by means of stealth, subterfuge, and charm.",
    bodyPointsByLevel: Array.from({ length: 30 }, (_, i) => 4 + i * 2),
  },
  {
    name: "Cleric",
    description: "Devote their lives to the study of the Earth and Water spheres of magic.",
    bodyPointsByLevel: Array.from({ length: 30 }, (_, i) => 4 + i * 2),
  },
  {
    name: "Mage",
    description: "Devote their lives to the study of the Fire and Air spheres of magic.",
    bodyPointsByLevel: Array.from({ length: 30 }, (_, i) => 4 + i * 1),
  },
];
