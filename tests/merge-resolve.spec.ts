import { test, expect } from '@playwright/test';
import { mergeMatches, ResolvedTeam, FifaMatch } from '../src/api/liveData';
import { Match } from '../src/api/types';

// Pins how knockout placeholder slots ("W73", "W75", …) are replaced by the real
// qualified teams, the EXACT "Morocco missing on the next stage" bug: once FIFA
// resolves W73 -> Canada and W75 -> Morocco, the Round-of-16 card must read
// "Canada vs Morocco" (not the placeholders, and not dropping Morocco).

function r16(homeCode: string, awayCode: string): Match {
  return {
    id: 90, venue: 'V', location: 'L', datetime: '2026-07-04T19:00:00Z',
    status: 'future_scheduled', stage_name: 'Round of 16',
    home_team: { country: homeCode, name: homeCode, code: homeCode, goals: null, penalties: null },
    away_team: { country: awayCode, name: awayCode, code: awayCode, goals: null, penalties: null },
  };
}

function fifa(ev: Partial<FifaMatch>): FifaMatch {
  return { Home: null, Away: null, HomeTeamScore: null, AwayTeamScore: null, MatchStatus: 0, MatchTime: null, ...ev };
}

const resolve: Record<string, ResolvedTeam> = {
  W73: { code: 'CAN', name: 'Canada' },
  W75: { code: 'MAR', name: 'Morocco' },
};

test('a resolved W## placeholder is replaced by the real team (Morocco not dropped)', () => {
  const [m] = mergeMatches([r16('W73', 'W75')], {}, resolve);
  expect(m.home_team.code).toBe('CAN');
  expect(m.home_team.name).toBe('Canada');
  expect(m.away_team.code).toBe('MAR');
  expect(m.away_team.name).toBe('Morocco');
});

test('resolution then live overlay both apply (real teams keep the live score)', () => {
  // FIFA reports the resolved tie as CAN 1 - 2 MAR, keyed by real codes.
  const liveMap = { CAN_MAR: fifa({ HomeTeamScore: 1, AwayTeamScore: 2, ResultType: 1, MatchStatus: 0 }) };
  const [m] = mergeMatches([r16('W73', 'W75')], liveMap, resolve);
  expect(m.home_team.code).toBe('CAN');
  expect(m.home_team.goals).toBe(1);
  expect(m.away_team.code).toBe('MAR');
  expect(m.away_team.goals).toBe(2);
  expect(m.status).toBe('completed');
});

test('overlay matched on the reversed real-code key still aligns score to each team', () => {
  // FIFA keyed the tie MAR_CAN; merge must find it via swap and keep CAN=1, MAR=2.
  const liveMap = { MAR_CAN: fifa({ HomeTeamScore: 2, AwayTeamScore: 1, ResultType: 1, MatchStatus: 0 }) };
  const [m] = mergeMatches([r16('W73', 'W75')], liveMap, resolve);
  expect(m.home_team.code).toBe('CAN');
  expect(m.home_team.goals).toBe(1);
  expect(m.away_team.code).toBe('MAR');
  expect(m.away_team.goals).toBe(2);
});

test('an unresolved placeholder is left untouched until FIFA fills it', () => {
  const [m] = mergeMatches([r16('W73', 'W75')], {}, { W73: { code: 'CAN', name: 'Canada' } });
  expect(m.home_team.code).toBe('CAN');
  expect(m.away_team.code).toBe('W75'); // still a placeholder
});

test('overlay SETS the score, never adds to it (no 1-1 turning into 2-2)', () => {
  // Guards against the doubling worry: a base with a stale 1-1 and a FIFA 1-1
  // must stay 1-1, not be summed into 2-2.
  const base: Match = { ...r16('CAN', 'MAR') };
  base.home_team = { ...base.home_team, goals: 1 };
  base.away_team = { ...base.away_team, goals: 1 };
  const liveMap = { CAN_MAR: fifa({ HomeTeamScore: 1, AwayTeamScore: 1, HomeTeamPenaltyScore: 4, AwayTeamPenaltyScore: 2, ResultType: 2, MatchStatus: 0 }) };
  const [m] = mergeMatches([base], liveMap, {});
  expect(m.home_team.goals).toBe(1);
  expect(m.away_team.goals).toBe(1);
  expect(m.home_team.penalties).toBe(4);
  expect(m.away_team.penalties).toBe(2);
});
