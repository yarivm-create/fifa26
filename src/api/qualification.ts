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
  round?: string; // furthest knockout round still alive in: 'R16'|'QF'|'SF'|'F'|'🏆'
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

// Deterministic FIFA ranking comparator: points, then goal difference, then
// goals for. Sorts strongest-first.
function fifaCmp(a: TeamState, b: TeamState): number {
  return b.pts !== a.pts ? b.pts - a.pts : b.gd !== a.gd ? b.gd - a.gd : b.gf - a.gf;
}

// Given FINAL group standings, return the 32 advancers: top 2 of every group
// plus the 8 best third-placed teams. Used once the group stage is complete so
// non-advancing teams read "Eliminated" rather than a residual percentage.
function finalGroupAdvancers(states: TeamState[]): Set<string> {
  const byGroup: Record<string, TeamState[]> = {};
  for (const t of states) (byGroup[t.group] ||= []).push(t);
  const advancers = new Set<string>();
  const thirds: TeamState[] = [];
  for (const letter of Object.keys(byGroup)) {
    const teams = byGroup[letter].slice().sort(fifaCmp);
    if (teams[0]) advancers.add(teams[0].code);
    if (teams[1]) advancers.add(teams[1].code);
    if (teams[2]) thirds.push(teams[2]);
  }
  thirds.sort(fifaCmp);
  for (let i = 0; i < Math.min(THIRD_PLACE_SLOTS, thirds.length); i++) {
    advancers.add(thirds[i].code);
  }
  return advancers;
}

// Codes that are still placeholders in the knockout schedule (e.g. "2A", "1C",
// "W73", "3ABCDF"). A real country code in a Round-of-32 slot means the team has
// actually reached the knockouts — including via a best-third-place finish.
const KO_PLACEHOLDER = /^(\d|W\d|RU\d|3[A-L]{2,})/;

export function computeQualification(groups: Group[], matches: Match[]): Record<string, QualChance> {
  // Teams FIFA has already slotted into the Round of 32 have definitively
  // advanced. This captures third-placed qualifiers that the points-only group
  // bounds below can't prove, so they read "Through" instead of a percentage.
  const advancedReal = new Set<string>();
  for (const m of matches) {
    if (m.stage_name !== 'Round of 32') continue;
    for (const code of [m.home_team.code, m.away_team.code]) {
      if (code && !KO_PLACEHOLDER.test(code)) advancedReal.add(code);
    }
  }

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

  // Once the group stage is over, advancement is decided — no team should still
  // show a probability. Prefer FIFA's real Round-of-32 assignments; if those
  // aren't populated yet, derive the 32 advancers from the final standings.
  const groupStageComplete = remaining.length === 0;
  const koFieldFinal = advancedReal.size >= 32;
  const finalAdvancers: Set<string> | null = koFieldFinal
    ? advancedReal
    : groupStageComplete
      ? finalGroupAdvancers(baseStates)
      : null;

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
    const myGamesLeft = gamesLeft[t.code] || 0;

    // True final ranking comparator (FIFA: points, then goal difference, then
    // goals for). Returns true when rival r ranks strictly above team t.
    const rankAbove = (r: TeamState): boolean =>
      r.pts !== t.pts ? r.pts > t.pts : r.gd !== t.gd ? r.gd > t.gd : r.gf > t.gf;

    // Could rival r still finish at or above us? When both our and the rival's
    // points are already final (no remaining games for either), the standings
    // are decided, so resolve the tie by the real tiebreak instead of assuming
    // it is unknown. Otherwise fall back to the conservative points bound.
    const couldBeAbove = rivals.filter((r) => {
      const rMax = r.pts + 3 * (gamesLeft[r.code] || 0);
      if (rMax < myMin) return false; // cannot reach us on points
      if (rMax > myMin) return true; // can exceed us on points
      // Tie on points possible. If both teams are locked, the tiebreak is known.
      if (myGamesLeft === 0 && (gamesLeft[r.code] || 0) === 0) return rankAbove(r);
      return true; // tiebreak still undecided => treat as a threat
    }).length;

    // Rivals certain to finish strictly above us.
    const certainlyAbove = rivals.filter((r) => {
      if (r.pts > myMax) return true; // out of our reach on points
      if (r.pts === myMax && myGamesLeft === 0 && (gamesLeft[r.code] || 0) === 0)
        return rankAbove(r); // locked tie resolved by tiebreak
      return false;
    }).length;

    let status: QualStatus = 'Contention';
    if (finalAdvancers) {
      // Group stage decided: definitively Qualified or Eliminated, never a %.
      status = finalAdvancers.has(t.code) ? 'Qualified' : 'Eliminated';
    } else if (advancedReal.has(t.code)) {
      status = 'Qualified'; // already placed into the Round of 32 (incl. 3rd place)
    } else if (couldBeAbove <= 1) {
      status = 'Qualified'; // guaranteed top 2 of the group
    } else if (certainlyAbove >= 3) {
      status = 'Eliminated'; // cannot even finish 3rd
    }

    // When advancement is settled, reflect it in the numbers too so nothing
    // downstream renders a stale "<1%"/">99%".
    const settled = finalAdvancers != null;
    const finalPAdvance = settled ? (status === 'Qualified' ? 100 : 0) : Math.round(pAdvance);

    out[t.code] = {
      code: t.code,
      pAdvance: finalPAdvance,
      pTop2: Math.round(pTop2),
      status,
    };
  }

  // Group status only tells us who reached the Round of 32. Once knockout games
  // are played, overlay real results: a team that LOST a completed knockout
  // match is out (even if it had qualified), and a team that keeps winning is
  // shown at the furthest round it has reached so it reads "R16/QF/SF/F/🏆"
  // instead of a stale group ✓. Without this, eliminated teams (e.g. a beaten
  // host) keep a green qualified badge and advancers never move past 32.
  applyKnockoutProgress(out, matches);
  return out;
}

// Knockout rounds in order; teams appearing later have advanced further.
const KO_ORDER = ['Round of 32', 'Round of 16', 'Quarter-final', 'Semi-final', 'Final'];
const KO_LABEL: Record<string, string> = {
  'Round of 16': 'R16',
  'Quarter-final': 'QF',
  'Semi-final': 'SF',
  Final: 'F',
};

function applyKnockoutProgress(out: Record<string, QualChance>, matches: Match[]): void {
  const reached: Record<string, number> = {}; // furthest KO round index reached
  const eliminated = new Set<string>();
  let champion: string | null = null;

  for (const m of matches) {
    const idx = KO_ORDER.indexOf(m.stage_name);
    if (idx < 0) continue;
    const home = m.home_team.code;
    const away = m.away_team.code;
    for (const code of [home, away]) {
      if (code && !KO_PLACEHOLDER.test(code)) reached[code] = Math.max(reached[code] ?? -1, idx);
    }
    if (m.status !== 'completed') continue;
    const hg = m.home_team.goals ?? 0;
    const ag = m.away_team.goals ?? 0;
    if (hg === ag) continue; // KO ties resolve on pens; without a decider, leave both alive
    const loser = hg > ag ? away : home;
    const winner = hg > ag ? home : away;
    if (loser && !KO_PLACEHOLDER.test(loser)) eliminated.add(loser);
    if (m.stage_name === 'Final' && winner && !KO_PLACEHOLDER.test(winner)) champion = winner;
  }

  for (const [code, q] of Object.entries(out)) {
    if (eliminated.has(code)) {
      q.status = 'Eliminated';
      q.pAdvance = 0;
      delete q.round;
    } else if (champion === code) {
      q.status = 'Qualified';
      q.round = '🏆';
    } else if (reached[code] >= 1) {
      // Won their R32 game (or beyond) and still alive: show the current round.
      q.status = 'Qualified';
      q.round = KO_LABEL[KO_ORDER[reached[code]]];
    }
  }
}
