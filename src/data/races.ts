import { RaceInfo } from "@/types/character";

// Body points by level (level 1-30)
// Group 1: Humans, Hybrid Races — 4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,14,14,15,15,16,16,17,17,18,18
// Group 2: Common Elves, Forest Elves, Halflings — same pattern but capped at 13 at level 30
// Group 3: Dwarves, Half-Orcs, Half-Ogres — 4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33

const humanBP = [4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,14,14,15,15,16,16,17,17,18,18];
const elfBP = [4,4,4,5,5,5,6,6,6,7,7,7,8,8,8,9,9,9,10,10,10,11,11,11,12,12,12,13,13,13];
const sturdyBP = [4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33];

export const races: RaceInfo[] = [
  {
    name: "Human",
    description: "The most common and diverse race in the world.",
    society: "Humans are the most common race and the only race that can crossbreed with other races.",
    bonusSkills: [{ name: "Urban Lore", count: 1 }],
    costumingRequirements: "None",
    bodyPointsByLevel: humanBP,
  },
  {
    name: "Common Elf",
    description: "Aloof and civilized people, living in cities and villages.",
    society: "More worldly than their forest-bound cousins, they tend to be more accepting of other races.",
    bonusSkills: [
      { name: "Resist Charm", count: 1 },
      { name: "Resist Sleep", count: 1 },
    ],
    costumingRequirements: "Pointed ear prosthetics",
    bodyPointsByLevel: elfBP,
  },
  {
    name: "Forest Elf",
    description: "Less civilized elves who congregate in villages or tribes deep in secluded forests.",
    society: "Extremely protective of the forest and despise those who defile it.",
    bonusSkills: [
      { name: "Resist Disease", count: 1 },
      { name: "Resist Sleep", count: 1 },
    ],
    costumingRequirements: "Pointed ear prosthetics",
    bodyPointsByLevel: elfBP,
  },
  {
    name: "Dwarf",
    description: "Short, sturdy folk who dwell in small subsurface cities.",
    society: "Dwarves live in clans and their clan's name is a badge of honor. A typical Dwarven city houses one clan.",
    bonusSkills: [
      { name: "Resist Charm", count: 1 },
      { name: "Resist Stun", count: 1 },
    ],
    costumingRequirements: "Grey skin paint, beard (optional)",
    bodyPointsByLevel: sturdyBP,
  },
  {
    name: "Halfling",
    description: "Short folk akin to humans, with thick hair on the back of hands and top of feet.",
    society: "Live in small villages near water. Many young Halflings leave home to find adventure in human societies.",
    bonusSkills: [
      { name: "Resist Charm", count: 1 },
      { name: "Resist Disease", count: 1 },
    ],
    costumingRequirements: "Patch of hair/fur on the back of each hand",
    bodyPointsByLevel: elfBP,
  },
  {
    name: "Half-Ogre",
    description: "Large and intimidating crossbreed between a human and an ogre, standing no shorter than 6'2\".",
    society: "Loners, only marginally accepted. Tend to be aggressive but simple.",
    bonusSkills: [
      { name: "Resist Disease", count: 1 },
      { name: "Resist Stun", count: 1 },
    ],
    costumingRequirements: "Orange skin, tusks (optional)",
    bodyPointsByLevel: sturdyBP,
  },
  {
    name: "Half-Orc",
    description: "At least 5'6\" tall with green skin. Almost all have fangs, sometimes pointed ears.",
    society: "Often hired into mercenary groups or allowed into barbarian tribes. Commonly dwell with Orcish kin.",
    bonusSkills: [
      { name: "Resist Stun", count: 1 },
      { name: "Resist Sleep", count: 1 },
    ],
    costumingRequirements: "Green skin, pointed ears or teeth (optional)",
    bodyPointsByLevel: sturdyBP,
  },
  {
    name: "Hybrid",
    description: "Result of a Human mating with another race such as an Elf, Halfling, or Dwarf.",
    society: "Interbreeding is common between Humans and other races. Take on characteristics of both parent races.",
    bonusSkills: [], // Player chooses one skill from a parent race
    costumingRequirements: "All requirements of the non-Human parent race",
    bodyPointsByLevel: humanBP,
  },
];
