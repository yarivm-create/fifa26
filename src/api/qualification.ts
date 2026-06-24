import { Group, Match } from './types';

// Qualification probabilities for the WC2026 group stage.
// Format: 12 groups of 4. Top 2 of each group (24) plus the 8 best
// third-placed teams advance to the Round of 32 (32 teams).
//
// We run a Monte Carlo simulation of all remaining group matches. Each
// remaining match is simulated with a Poisson scoreline whose rate is
// derived from the teams' current points-per-game and goal record, then
// every group is ranked (points, goal difference, goals for) and the
// best-third tiebreak is resolved across all groups. Advancement is
// tallied across many runs to produce a probability per team.

export type QualStatus = 'Qualified' | 'Eliminated' | 'Contention';

export interface QualChance {
  code: string;
  pAdvance: number; // 0..100, chance of reaching the Round of 32
  pTop2: number; // 0..100, chance of finishing in the top 2
  status: QualStatus;
}

interface TeamState {
  code: string;
  group: string;
  pts: number;
  gd: number;
  gf: number;
  played: number;
}

const SIMS = 4000;
const THIRD_PLACE_SLOTS = 8;

function poisson(lambda: number): number {
  // Knuth's algorithm; fine for the small lambdas used here.
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

function strength(t: TeamState): number {
  const ppg = t.played > 0 ? t.pts / t.played : 1.0; // 0..3
  const gdpg = t.played > 0 ? t.gd / t.played : 0; // goal diff per game
  return Math.max(0.3, 0.4 + ppg + 0.12 * gdpg);
}

function simulateMatch(a: TeamState, b: TeamState): void {
  const sa = strength(a);
  const sb = strength(b);
  const lambdaA = Math.min(4, Math.max(0.3, 1.35 * (sa / sb)));
  const lambdaB = Math.min(4, Math.max(0.3, 1.35 * (sb / sa)));
  const ga = poisson(lambdaA);
  const gb = poisson(lambdaB);
  a.gf += ga;
  b.gf += gb;
  a.gd += ga - gb;
  b.gd += gb - ga;
  a.played += 1;
  b.played += 1;
  if (ga > gb) a.pts += 3;
  else if (gb > ga) b.pts += 3;
  else {
    a.pts += 1;
    b.pts += 1;
  }
}

function rankKey(t: TeamState): number {
  // Composite sortable score with a tiny random tiebreak.
  return t.pts * 1e6 + (t.gd + 100) * 1e3 + t.gf + Math.random() * 0.5;
}

export function computeQualification(groups: Group[], matches: Match[]): Record<string, QualChance> {
  // Map each team code to its group letter.
  const codeToGroup: Record<string, string> = {};
  const baseStates: TeamState[] = [];
  for (const g of groups) {
    for (const s of g.teams) {
      codeToGroup[s.team.code] = g.letter;
      baseStates.push({
        code: s.team.code,
        group: g.letter,
        pts: s.points,
        gd: s.goal_difference,
        gf: s.goals_for,
        played: s.played,
      });
    }
  }

  // Remaining intra-group matches (not yet completed).
  const remaining: { home: string; away: string }[] = [];
  for (const m of matches) {
    if (!m.stage_name.startsWith('Group')) continue;
    if (m.status === 'completed') continue;
    const hc = m.home_team.code;
    const ac = m.away_team.code;
    if (codeToGroup[hc] && codeToGroup[hc] === codeToGroup[ac]) {
      remaining.push({ home: hc, away: ac });
    }
  }

  // Remaining games per team (used for mathematical bounds).
  const gamesLeft: Record<string, number> = {};
  for (const t of baseStates) gamesLeft[t.code] = 0;
  for (const r of remaining) {
    gamesLeft[r.home] = (gamesLeft[r.home] || 0) + 1;
    gamesLeft[r.away] = (gamesLeft[r.away] || 0) + 1;
  }

  const advanceCount: Record<string, number> = {};
  const top2Count: Record<string, number> = {};
  for (const t of baseStates) {
    advanceCount[t.code] = 0;
    top2Count[t.code] = 0;
  }

  const groupLetters = [...new Set(baseStates.map((t) => t.group))];

  for (let sim = 0; sim < SIMS; sim++) {
    // Clone base states.
    const states: Record<string, TeamState> = {};
    for (const t of baseStates) states[t.code] = { ...t };

    // Play out remaining matches.
    for (const r of remaining) simulateMatch(states[r.home], states[r.away]);

    // Rank each group; collect advancers + third-placed teams.
    const thirds: TeamState[] = [];
    for (const letter of groupLetters) {
      const teams = groupLetters.length
        ? Object.values(states).filter((t) => t.group === letter)
        : [];
      teams.sort((a, b) => rankKey(b) - rankKey(a));
      if (teams[0]) top2Count[teams[0].code]++;
      if (teams[1]) top2Count[teams[1].code]++;
      if (teams[0]) advanceCount[teams[0].code]++;
      if (teams[1]) advanceCount[teams[1].code]++;
      if (teams[2]) thirds.push(teams[2]);
    }

    // Best third-placed teams fill the remaining slots.
    thirds.sort((a, b) => rankKey(b) - rankKey(a));
    for (let i = 0; i < Math.min(THIRD_PLACE_SLOTS, thirds.length); i++) {
      advanceCount[thirds[i].code]++;
    }
  }

  const out: Record<string, QualChance> = {};
  for (const t of baseStates) {
    const pAdvance = (advanceCount[t.code] / SIMS) * 100;
    const pTop2 = (top2Count[t.code] / SIMS) * 100;

    // Mathematically rigorous status from point bounds — a team is only
    // marked Qualified/Eliminated when it is GUARANTEED, regardless of the
    // simulated probability. Everyone else shows a live percentage.
    const rivals = baseStates.filter((r) => r.group === t.group && r.code !== t.code);
    const myMin = t.pts; // worst case: lose all remaining games
    const myMax = t.pts + 3 * (gamesLeft[t.code] || 0); // best case: win all
    // Rivals that could still finish at or above us (tie => tiebreak unknown).
    const couldBeAbove = rivals.filter((r) => r.pts + 3 * (gamesLeft[r.code] || 0) >= myMin).length;
    // Rivals already certain to finish strictly above us.
    const certainlyAbove = rivals.filter((r) => r.pts > myMax).length;

    let status: QualStatus = 'Contention';
    if (couldBeAbove <= 1) {
      status = 'Qualified'; // guaranteed top 2 of the group
    } else if (certainlyAbove >= 3) {
      status = 'Eliminated'; // cannot even finish 3rd
    }

    out[t.code] = {
      code: t.code,
      pAdvance: Math.round(pAdvance),
      pTop2: Math.round(pTop2),
      status,
    };
  }
  return out;
}
