import { test, expect } from '@playwright/test';
import { fetchAllMatches } from '../src/api/mockData';
import { bracketRanks, sortBracketRound, FEEDERS } from '../src/utils/bracketOrder';
import { Match } from '../src/api/types';

// Pins the bracket layout: it must be a PLANAR feeder tree so the connector
// lines line up — each next-round card sits between the two feeder cards it
// comes from — AND the earliest / already-played tie bubbles to the top.
const ROUNDS = ['Round of 32', 'Round of 16', 'Quarter-final', 'Semi-final', 'Final'];

let all: Match[];
test.beforeAll(async () => {
  all = await fetchAllMatches();
});

test('the earliest Round-of-32 tie bubbles to the top (Canada first)', () => {
  const ranks = bracketRanks(all);
  const r32 = sortBracketRound(all, 'Round of 32', ranks);
  // #73 (South Africa vs Canada) is the earliest R32 kick-off, so it leads.
  expect(r32[0].id).toBe(73);
});

test('each next-round card lines up between its two feeder cards (connectors align)', () => {
  const ranks = bracketRanks(all);
  for (let r = 1; r < ROUNDS.length; r++) {
    const prev = sortBracketRound(all, ROUNDS[r - 1], ranks);
    const cur = sortBracketRound(all, ROUNDS[r], ranks);
    // The previous round always has exactly twice as many cards.
    expect(prev.length, `${ROUNDS[r - 1]} feeds ${ROUNDS[r]}`).toBe(cur.length * 2);
    cur.forEach((m, k) => {
      const feeders = FEEDERS[m.id];
      expect(feeders, `match ${m.id} has feeders`).toBeTruthy();
      // The two cards at positions 2k and 2k+1 must be exactly this card's two
      // feeders, so the CSS connector (top/bottom by even/odd index) is correct.
      const pair = [prev[2 * k].id, prev[2 * k + 1].id].sort((a, b) => a - b);
      expect(pair, `feeders under match ${m.id}`).toEqual([...feeders].sort((a, b) => a - b));
    });
  }
});

test('within a feeder pair, the earlier-dated tie is on top', () => {
  const ranks = bracketRanks(all);
  const r32 = sortBracketRound(all, 'Round of 32', ranks);
  for (let k = 0; k < r32.length; k += 2) {
    const top = new Date(r32[k].datetime).getTime();
    const bottom = new Date(r32[k + 1].datetime).getTime();
    expect(top, `pair starting at ${k} ordered by date`).toBeLessThanOrEqual(bottom);
  }
});

test('ranks are unique and cover every knockout match (no gaps in the tree)', () => {
  const ranks = bracketRanks(all);
  for (let id = 73; id <= 104; id++) {
    if (id === 103) continue; // third-place play-off is outside the feeder tree
    expect(ranks.has(id), `rank for match ${id}`).toBe(true);
  }
  const values = [...ranks.values()];
  expect(new Set(values).size).toBe(values.length); // all unique
});
