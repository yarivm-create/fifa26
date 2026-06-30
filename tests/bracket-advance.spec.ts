import { test, expect } from '@playwright/test';
import { resolveFeederWinners } from '../src/utils/bracketOrder';
import { Match } from '../src/api/types';

// Regression for "a finished game isn't carried to the next stage": once a
// feeder match is completed we already know who advances, so the next round's
// "Winner M##" slot must be filled with the real team locally (not left as a
// placeholder waiting on the upstream feed). The reported case: Norway clearly
// won M78 but the next card still showed "Winner M78".

function team(code: string, name: string, goals: number | null = null, penalties: number | null = null) {
  return { code, name, goals, penalties } as Match['home_team'];
}

function match(id: number, stage: string, home: Match['home_team'], away: Match['away_team'], status: Match['status']): Match {
  return {
    id,
    stage_name: stage,
    datetime: '2026-06-30T20:00:00Z',
    venue: 'Test',
    status,
    home_team: home,
    away_team: away,
  } as Match;
}

test('finished feeder fills the next round slot with the actual winner', () => {
  const matches: Match[] = [
    // M78 finished: Norway beat Cote d'Ivoire 2-1.
    match(78, 'Round of 32', team('CIV', "Cote d'Ivoire", 1), team('NOR', 'Norway', 2), 'completed'),
    // M76 finished: Brazil beat Japan 2-1.
    match(76, 'Round of 32', team('BRA', 'Brazil', 2), team('JPN', 'Japan', 1), 'completed'),
    // R16 card fed by W76 vs W78 (FIFA match 91), not yet played.
    match(91, 'Round of 16', team('W76', 'Winner M76'), team('W78', 'Winner M78'), 'future_scheduled'),
  ];
  const out = resolveFeederWinners(matches);
  const r16 = out.find((m) => m.id === 91)!;
  expect(r16.home_team.code).toBe('BRA');
  expect(r16.home_team.name).toBe('Brazil');
  expect(r16.away_team.code).toBe('NOR');
  expect(r16.away_team.name).toBe('Norway');
});

test('a penalty-shootout feeder advances the shootout winner, not the level goals', () => {
  const matches: Match[] = [
    // M74 level after 90 (1-1), Morocco win the shootout 3-2.
    match(74, 'Round of 32', team('NED', 'Netherlands', 1, 2), team('MAR', 'Morocco', 1, 3), 'completed'),
    match(89, 'Round of 16', team('W74', 'Winner M74'), team('W77', 'Winner M77'), 'future_scheduled'),
  ];
  const out = resolveFeederWinners(matches);
  const r16 = out.find((m) => m.id === 89)!;
  expect(r16.home_team.code).toBe('MAR');
  // Unplayed feeder M77 stays a placeholder.
  expect(r16.away_team.code).toBe('W77');
});

test('an unfinished feeder leaves the next slot as a placeholder', () => {
  const matches: Match[] = [
    match(80, 'Round of 32', team('ESP', 'Spain'), team('AUT', 'Austria'), 'future_scheduled'),
    match(92, 'Round of 16', team('W79', 'Winner M79'), team('W80', 'Winner M80'), 'future_scheduled'),
  ];
  const out = resolveFeederWinners(matches);
  const r16 = out.find((m) => m.id === 92)!;
  expect(r16.away_team.code).toBe('W80');
});
