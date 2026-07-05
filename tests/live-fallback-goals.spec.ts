import { test, expect } from '@playwright/test';
import { parseLiveGoals, FifaLiveTeam } from '../src/api/liveData';

// parseLiveGoals is the scorer fallback used when a freshly finished match's
// timeline is still empty: it reads goals from the live/match-detail payload,
// resolves names from the squad rosters, skips own goals (scorer on the OTHER
// team) and ignores penalty-shootout kicks (Period 11).
function player(id: string, name: string) {
  return { IdPlayer: id, PlayerName: [{ Description: name }] };
}

test('credits a normal goal to the scorer with the roster name', () => {
  const home: FifaLiveTeam = { Goals: [], Players: [player('1', 'Home One')] };
  const away: FifaLiveTeam = {
    Goals: [{ IdPlayer: '389867', Period: 5 }],
    Players: [player('389867', 'Kylian MBAPPE')],
  };
  const { goals } = parseLiveGoals(home, away, 'HOM', 'FRA');
  expect(goals).toEqual([{ id: '389867', name: 'Kylian MBAPPE', code: 'FRA' }]);
});

test('credits an assist only when the assister is on the scoring team', () => {
  const home: FifaLiveTeam = {
    Goals: [{ IdPlayer: '1', IdAssistPlayer: '3', Period: 3 }],
    Players: [player('1', 'Scorer'), player('3', 'Assister')],
  };
  const away: FifaLiveTeam = { Goals: [], Players: [] };
  const { goals, assists } = parseLiveGoals(home, away, 'HOM', 'AWY');
  expect(goals.map((g) => g.id)).toEqual(['1']);
  expect(assists).toEqual([{ id: '3', name: 'Assister', code: 'HOM' }]);
});

test('skips own goals (scorer belongs to the opponent roster)', () => {
  // Own goal credited to HOME, but scored by an AWAY player.
  const home: FifaLiveTeam = { Goals: [{ IdPlayer: '9', Period: 5 }], Players: [player('1', 'Home One')] };
  const away: FifaLiveTeam = { Goals: [], Players: [player('9', 'Own Goaler')] };
  const { goals } = parseLiveGoals(home, away, 'HOM', 'AWY');
  expect(goals).toEqual([]);
});

test('ignores penalty-shootout kicks (Period 11)', () => {
  const home: FifaLiveTeam = {
    Goals: [
      { IdPlayer: '1', Period: 5 },
      { IdPlayer: '1', Period: 11 },
    ],
    Players: [player('1', 'Taker')],
  };
  const away: FifaLiveTeam = { Goals: [], Players: [] };
  const { goals } = parseLiveGoals(home, away, 'HOM', 'AWY');
  expect(goals).toHaveLength(1); // only the open-play goal, not the shootout kick
});
