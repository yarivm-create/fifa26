import { Match } from '../api/types';
import { getMatchResult } from './matchResult';

// Official WC2026 knockout feeder tree: each match id maps to the two earlier
// match ids whose winners feed it (ids equal the FIFA MatchNumbers, e.g. R16
// match 90 = W73 vs W75 is fed by R32 matches 73 & 75). Used both to lay the
// bracket out as a planar tree (so connector lines line up) and to validate the
// draw in tests.
export const FEEDERS: Record<number, [number, number]> = {
  // Round of 16  <- Round of 32
  89: [74, 77], 90: [73, 75], 91: [76, 78], 92: [79, 80],
  93: [83, 84], 94: [81, 82], 95: [86, 88], 96: [85, 87],
  // Quarter-finals <- Round of 16
  97: [89, 90], 98: [93, 94], 99: [91, 92], 100: [95, 96],
  // Semi-finals <- Quarter-finals
  101: [97, 98], 102: [99, 100],
  // Final <- Semi-finals
  104: [101, 102],
};
export const FINAL_ID = 104;

// Once a feeder match is finished we already know who advances, so fill the next
// round's "Winner M##" slot with the real team locally instead of waiting for
// the upstream feed to propagate it. Applied centrally so EVERY tab (Bracket,
// Schedule, Favorites) shows the advanced team consistently. (Bug: a finished
// R32 game left the next card showing "Winner M78" though Norway had won it.)
export function resolveFeederWinners(matches: Match[]): Match[] {
  const winner: Record<string, { code: string; name: string }> = {};
  for (const m of matches) {
    const r = getMatchResult(m);
    if (r.finished && (r.homeWon || r.awayWon)) {
      const w = r.homeWon ? m.home_team : m.away_team;
      winner[`W${m.id}`] = { code: w.code, name: w.name };
    }
  }
  const deref = (code: string, name: string): { code: string; name: string } => {
    let c = code;
    let nm = name;
    let guard = 0;
    while (/^W\d+$/.test(c) && winner[c] && guard++ < 8) {
      nm = winner[c].name;
      c = winner[c].code;
    }
    return { code: c, name: nm };
  };
  return matches.map((m) => {
    const h = deref(m.home_team.code, m.home_team.name);
    const a = deref(m.away_team.code, m.away_team.name);
    if (h.code === m.home_team.code && a.code === m.away_team.code) return m;
    return {
      ...m,
      home_team: { ...m.home_team, code: h.code, name: h.name },
      away_team: { ...m.away_team, code: a.code, name: a.name },
    };
  });
}

// Computes a vertical rank for every knockout match by an IN-ORDER walk of the
// feeder tree (one feeder subtree, the match itself, then the other feeder
// subtree). That keeps the two feeders of any match adjacent and the match
// centered between them, so the connector lines align.
//
// At each branch the subtree containing the EARLIEST-dated match is visited
// first, so an already-played / earliest tie (e.g. Canada's) bubbles to the TOP
// of its column while the tree stays planar — reconciling "Canada first" with
// the connector tree.
export function bracketRanks(matches: Match[]): Map<number, number> {
  const byId = new Map(matches.map((m) => [m.id, m]));
  const time = (id: number) => {
    const m = byId.get(id);
    return m ? new Date(m.datetime).getTime() : Number.POSITIVE_INFINITY;
  };
  const minCache = new Map<number, number>();
  const minDate = (id: number): number => {
    const cached = minCache.get(id);
    if (cached !== undefined) return cached;
    const f = FEEDERS[id];
    const v = f ? Math.min(minDate(f[0]), minDate(f[1])) : time(id);
    minCache.set(id, v);
    return v;
  };

  const rank = new Map<number, number>();
  let n = 0;
  const visit = (id: number) => {
    const f = FEEDERS[id];
    if (!f) {
      rank.set(id, n++);
      return;
    }
    const [a, b] = minDate(f[0]) <= minDate(f[1]) ? [f[0], f[1]] : [f[1], f[0]];
    visit(a);
    rank.set(id, n++);
    visit(b);
  };
  visit(FINAL_ID);
  return rank;
}

// Orders the cards of a single round using the feeder-tree rank, so the two
// feeders of every next-round match stay adjacent (connector lines align) and
// the earliest tie sits first. Falls back to id order for anything outside the
// tree.
export function sortBracketRound(matches: Match[], round: string, ranks: Map<number, number>): Match[] {
  return matches
    .filter((m) => m.stage_name === round)
    .sort((a, b) => {
      const ra = ranks.get(a.id);
      const rb = ranks.get(b.id);
      if (ra !== undefined && rb !== undefined) return ra - rb;
      return a.id - b.id;
    });
}
