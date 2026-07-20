import { test, expect } from '@playwright/test';
import { getChampion } from '../src/utils/champion';
import { Match } from '../src/api/types';

// Unit coverage for the "who won the World Cup" resolver that drives the
// champion banner. Engine-independent (no browser) — asserts a champion is
// surfaced only from a decided Final, with the right winner/margin, and handles
// extra time and shootouts exactly like the rest of the app's result logic.

function team(code: string, name: string, goals: number | null = null, penalties: number | null = null) {
  return { country: name, code, name, goals, penalties } as Match['home_team'];
}

function match(
  stage: string,
  home: Match['home_team'],
  away: Match['away_team'],
  status: Match['status'],
  decidedBy?: Match['decidedBy'],
): Match {
  return {
    id: 999,
    venue: 'New York/New Jersey Stadium',
    location: 'New Jersey, USA',
    datetime: '2026-07-19T19:00:00Z',
    stage_name: stage,
    status,
    decidedBy,
    home_team: home,
    away_team: away,
  } as Match;
}

test('a decided Final in regulation crowns the winner with the right margin', () => {
  const c = getChampion([
    match('Semi-final', team('ARG', 'Argentina', 2), team('ESP', 'Spain', 1), 'completed'),
    match('Final', team('ARG', 'Argentina', 3), team('FRA', 'France', 1), 'completed'),
  ]);
  expect(c).not.toBeNull();
  expect(c!.team.code).toBe('ARG');
  expect(c!.runnerUp.code).toBe('FRA');
  expect(c!.winnerGoals).toBe(3);
  expect(c!.loserGoals).toBe(1);
  expect(c!.decidedBy).toBeUndefined();
});

test('the away side can be champion', () => {
  const c = getChampion([
    match('Final', team('BRA', 'Brazil', 0), team('ENG', 'England', 2), 'completed'),
  ]);
  expect(c!.team.code).toBe('ENG');
  expect(c!.runnerUp.code).toBe('BRA');
  expect(c!.winnerGoals).toBe(2);
  expect(c!.loserGoals).toBe(0);
});

test('a shootout Final crowns the shootout winner, not the level goals', () => {
  const c = getChampion([
    match('Final', team('NED', 'Netherlands', 1, 3), team('MAR', 'Morocco', 1, 5), 'completed', 'penalties'),
  ]);
  expect(c!.team.code).toBe('MAR');
  expect(c!.decidedBy).toBe('penalties');
  expect(c!.winnerPens).toBe(5);
  expect(c!.loserPens).toBe(3);
  // Regulation goals were level.
  expect(c!.winnerGoals).toBe(1);
  expect(c!.loserGoals).toBe(1);
});

test('an extra-time Final is flagged as such', () => {
  const c = getChampion([
    match('Final', team('POR', 'Portugal', 2), team('GER', 'Germany', 1), 'completed', 'extra_time'),
  ]);
  expect(c!.team.code).toBe('POR');
  expect(c!.decidedBy).toBe('extra_time');
});

test('no champion while the Final is still to be played', () => {
  expect(
    getChampion([match('Final', team('W101', 'W101'), team('W102', 'W102'), 'future_scheduled')])
  ).toBeNull();
});

test('a Final that is completed but still holds bracket placeholders yields no champion', () => {
  expect(
    getChampion([match('Final', team('W101', 'W101', 2), team('W102', 'W102', 1), 'completed')])
  ).toBeNull();
});

test('no Final in the fixture list means no champion', () => {
  expect(
    getChampion([match('Semi-final', team('ARG', 'Argentina', 2), team('ESP', 'Spain', 1), 'completed')])
  ).toBeNull();
  expect(getChampion([])).toBeNull();
  expect(getChampion(null)).toBeNull();
});
