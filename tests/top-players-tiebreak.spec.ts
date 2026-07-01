import { test, expect } from '@playwright/test';
import { buildTopPlayers } from '../src/api/stats';
import { PlayerAgg } from '../src/api/liveData';

// Pins the leaderboard tiebreaker: when two players have the same goals (or the
// same assists), the one who reached that tally in FEWER games ranks first.
function p(over: Partial<PlayerAgg> & { id: string }): PlayerAgg {
  return { name: over.id, code: 'X', goals: 0, assists: 0, goalGames: 0, assistGames: 0, ...over };
}

test('top scorers: equal goals rank fewer games first', () => {
  const { topScorers } = buildTopPlayers([
    p({ id: 'slow', goals: 3, goalGames: 3 }),
    p({ id: 'fast', goals: 3, goalGames: 1 }),
    p({ id: 'leader', goals: 5, goalGames: 4 }),
  ]);
  expect(topScorers.map((s) => s.id)).toEqual(['leader', 'fast', 'slow']);
});

test('top assists: equal assists rank fewer games first', () => {
  const { topAssists } = buildTopPlayers([
    p({ id: 'slow', assists: 2, assistGames: 2 }),
    p({ id: 'fast', assists: 2, assistGames: 1 }),
    p({ id: 'leader', assists: 4, assistGames: 3 }),
  ]);
  expect(topAssists.map((a) => a.id)).toEqual(['leader', 'fast', 'slow']);
});

test('name breaks a full tie (same metric and same games)', () => {
  const { topScorers } = buildTopPlayers([
    p({ id: 'Zoe', goals: 2, goalGames: 2 }),
    p({ id: 'Ada', goals: 2, goalGames: 2 }),
  ]);
  expect(topScorers.map((s) => s.id)).toEqual(['Ada', 'Zoe']);
});
