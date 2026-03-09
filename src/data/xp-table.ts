// XP earned (above starting 140 SP) required to reach each level.
// Index 0 = level 1, index 1 = level 2, etc.
export const xpTable: number[] = [
  0,    // Level 1
  40,   // Level 2
  100,  // Level 3
  180,  // Level 4
  280,  // Level 5
  400,  // Level 6
  540,  // Level 7
  700,  // Level 8
  880,  // Level 9
  1080, // Level 10
  1300, // Level 11
  1540, // Level 12
  1800, // Level 13
  2080, // Level 14
  2380, // Level 15
  2700, // Level 16
  3040, // Level 17
  3400, // Level 18
  3780, // Level 19
  4180, // Level 20
  4600, // Level 21
  5040, // Level 22
  5500, // Level 23
  5980, // Level 24
  6480, // Level 25
  7000, // Level 26
  7540, // Level 27
  8100, // Level 28
  8680, // Level 29
  9280, // Level 30
];

export const STARTING_SKILL_POINTS = 140;

/** Derive level from total earned XP (not including starting 140 SP). */
export function levelFromXP(totalXP: number): number {
  let level = 1;
  for (let i = 1; i < xpTable.length; i++) {
    if (totalXP >= xpTable[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
}

/** Calculate total skill points: starting 140 + all earned XP. */
export function totalSkillPoints(totalXP: number): number {
  return STARTING_SKILL_POINTS + totalXP;
}
