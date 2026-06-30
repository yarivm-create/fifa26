import { test, expect } from '@playwright/test';
import { sortBracketRound } from '../src/utils/bracketOrder';
import { Match } from '../src/api/types';

// Pins the reported bracket-order bug: an already-played tie (Brazil, Canada)
// must float to the top of its round, and the played ties must be ordered by
// kick-off date (Canada — the earliest — first), with upcoming ties below.
function card(id: number, datetime: string, status: Match['status'], home = 'A', away = 'B'): Match {
  return {
    id, venue: 'V', location: 'L', datetime, status, stage_name: 'Round of 32',
    home_team: { country: home, name: home, code: home, goals: null, penalties: null },
    away_team: { country: away, name: away, code: away, goals: null, penalties: null },
  };
}

test('finished ties come first, ordered by date (Canada before Brazil)', () => {
  const canada = card(73, '2026-06-28T19:00:00Z', 'completed', 'RSA', 'CAN');
  const brazil = card(76, '2026-06-29T19:00:00Z', 'completed', 'BRA', 'JPN');
  const upcomingEarly = card(80, '2026-06-30T19:00:00Z', 'future_scheduled');
  const upcomingLate = card(88, '2026-07-03T19:00:00Z', 'future_scheduled');
  // Deliberately shuffled input order.
  const out = sortBracketRound([upcomingLate, brazil, upcomingEarly, canada]);
  expect(out.map((m) => m.id)).toEqual([73, 76, 80, 88]);
});

test('a played tie outranks an upcoming tie even if the upcoming one is scheduled earlier', () => {
  // Defensive: results should still be on top regardless of raw schedule order.
  const played = card(76, '2026-06-30T19:00:00Z', 'completed');
  const upcoming = card(73, '2026-06-28T19:00:00Z', 'future_scheduled');
  const out = sortBracketRound([upcoming, played]);
  expect(out.map((m) => m.id)).toEqual([76, 73]);
});

test('a live tie sits above upcoming ties but below finished ones', () => {
  const finished = card(73, '2026-06-28T19:00:00Z', 'completed');
  const live = card(80, '2026-06-30T19:00:00Z', 'in_progress');
  const upcoming = card(76, '2026-06-29T19:00:00Z', 'future_scheduled');
  const out = sortBracketRound([upcoming, live, finished]);
  expect(out.map((m) => m.id)).toEqual([73, 80, 76]);
});

test('within the same phase, ordering falls back to kick-off date then id', () => {
  const a = card(90, '2026-07-04T19:00:00Z', 'future_scheduled');
  const b = card(89, '2026-07-04T16:00:00Z', 'future_scheduled');
  const out = sortBracketRound([a, b]);
  expect(out.map((m) => m.id)).toEqual([89, 90]);
});
