import { test, expect } from '@playwright/test';
import { buildTopPlayers } from '../src/api/stats';
import { PlayerAgg } from '../src/api/liveData';

// Pins the leaderboard tiebreaker: when two players have the same goals (or the
// same assists), the one whose team played FEWER games ranks first (more
// efficient), then fewer games scored/assisted in, then name.
function p(over: Partial<PlayerAgg> & { id: string }): PlayerAgg {
  return { name: over.id, code: 'X', goals: 0, assists: 0, goalGames: 0, assistGames: 0, teamGames: 0, ...over };
}

test('top scorers: equal goals rank fewer TEAM games first (Messi before Mbappe)', () => {
  const { topScorers } = buildTopPlayers([
    p({ id: 'Mbappe', goals: 6, goalGames: 3, teamGames: 4 }),
    p({ id: 'Messi', goals: 6, goalGames: 3, teamGames: 3 }),
    p({ id: 'leader', goals: 8, teamGames: 5 }),
  ]);
  expect(topScorers.map((s) => s.id)).toEqual(['leader', 'Messi', 'Mbappe']);
});

test('top scorers: equal goals and team games fall back to fewer games scored in', () => {
  const { topScorers } = buildTopPlayers([
    p({ id: 'slow', goals: 3, teamGames: 4, goalGames: 3 }),
    p({ id: 'fast', goals: 3, teamGames: 4, goalGames: 1 }),
    p({ id: 'leader', goals: 5, teamGames: 4, goalGames: 4 }),
  ]);
  expect(topScorers.map((s) => s.id)).toEqual(['leader', 'fast', 'slow']);
});

test('top assists: equal assists rank fewer team games first', () => {
  const { topAssists } = buildTopPlayers([
    p({ id: 'slow', assists: 2, teamGames: 3, assistGames: 2 }),
    p({ id: 'fast', assists: 2, teamGames: 2, assistGames: 1 }),
    p({ id: 'leader', assists: 4, teamGames: 3, assistGames: 3 }),
  ]);
  expect(topAssists.map((a) => a.id)).toEqual(['leader', 'fast', 'slow']);
});

test('name breaks a full tie (same metric and same games)', () => {
  const { topScorers } = buildTopPlayers([
    p({ id: 'Zoe', goals: 2, teamGames: 2, goalGames: 2 }),
    p({ id: 'Ada', goals: 2, teamGames: 2, goalGames: 2 }),
  ]);
  expect(topScorers.map((s) => s.id)).toEqual(['Ada', 'Zoe']);
});
