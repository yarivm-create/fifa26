import { test, expect } from '@playwright/test';
import { knockoutState } from '../src/utils/knockoutState';
import { Match } from '../src/api/types';

// Pins the Favorites knockout state, the reported "Germany / Netherlands still
// shown as progressed after losing on penalties" bug: a penalty loss must read
// as eliminated, and the final-score winner must come from the shootout.
let id = 0;
function ko(stage: string, code: string, opponent: string, g: number, og: number, opts: {
  pen?: number; openPen?: number; status?: Match['status']; decidedBy?: Match['decidedBy'];
} = {}): Match {
  const { pen = null, openPen = null, status = 'completed', decidedBy } = opts as never;
  return {
    id: ++id, venue: 'V', location: 'L', datetime: '2026-06-29T19:00:00Z',
    status, stage_name: stage, decidedBy,
    home_team: { country: code, name: code, code, goals: g, penalties: pen },
    away_team: { country: opponent, name: opponent, code: opponent, goals: og, penalties: openPen },
  };
}

test('a penalty loss in Round of 32 reads as eliminated (Germany 1-1, pens 3-4)', () => {
  const matches = [ko('Round of 32', 'GER', 'PAR', 1, 1, { pen: 3, openPen: 4, decidedBy: 'penalties' })];
  const st = knockoutState('GER', matches)!;
  expect(st.reached).toBe(0); // Round of 32
  expect(st.eliminated).toBe(true);
  expect(st.champion).toBe(false);
});

test('a penalty loss for the AWAY side also reads as eliminated (Netherlands)', () => {
  // FIFA card stored as MAR(home) 1 (3) - 1 (2) NED(away): Netherlands out.
  const m = ko('Round of 32', 'MAR', 'NED', 1, 1, { pen: 3, openPen: 2, decidedBy: 'penalties' });
  const st = knockoutState('NED', [m])!;
  expect(st.eliminated).toBe(true);
});

test('a penalty WIN advances the team (not eliminated)', () => {
  const st = knockoutState('PAR', [ko('Round of 32', 'GER', 'PAR', 1, 1, { pen: 3, openPen: 4, decidedBy: 'penalties' })])!;
  // PAR is the away team here (opponent slot); won the shootout 4-3.
  const m2 = ko('Round of 32', 'GER', 'PAR', 1, 1, { pen: 3, openPen: 4, decidedBy: 'penalties' });
  const stPar = knockoutState('PAR', [m2])!;
  expect(stPar.eliminated).toBe(false);
  expect(st.eliminated).toBe(false);
});

test('reached reflects the furthest round entered', () => {
  const matches = [
    ko('Round of 32', 'BRA', 'JPN', 2, 1),
    ko('Round of 16', 'BRA', 'CAN', 1, 0),
    ko('Quarter-final', 'BRA', 'ESP', 0, 0, { pen: 5, openPen: 4, decidedBy: 'penalties' }),
  ];
  const st = knockoutState('BRA', matches)!;
  expect(st.reached).toBe(2); // Quarter-final
  expect(st.eliminated).toBe(false);
});

test('winning the Final makes the team champion', () => {
  const st = knockoutState('ARG', [ko('Final', 'ARG', 'FRA', 3, 2, { decidedBy: 'extra_time' })])!;
  expect(st.champion).toBe(true);
  expect(st.eliminated).toBe(false);
  expect(st.reached).toBe(4);
});

test('an unfinished knockout is neither a win nor an elimination yet', () => {
  const st = knockoutState('BRA', [ko('Round of 16', 'BRA', 'CAN', 1, 1, { status: 'in_progress' })])!;
  expect(st.reached).toBe(1);
  expect(st.eliminated).toBe(false);
  expect(st.champion).toBe(false);
});

test('a team not in any knockout match has no knockout state', () => {
  expect(knockoutState('USA', [ko('Round of 32', 'GER', 'PAR', 1, 0)])).toBeNull();
});
