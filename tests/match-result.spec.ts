import { test, expect } from '@playwright/test';
import { getMatchResult, getPenaltyWinSummary } from '../src/utils/matchResult';
import { Match } from '../src/api/types';

// Pins the SINGLE source of truth every tab (Live, Schedule, Bracket, Favorites,
// celebrations) uses to interpret a result, so a knockout decided by penalties
// or extra time can never again be shown as a draw or with the wrong winner.
function ko(home: number | null, away: number | null, opts: Partial<Match> & {
  hp?: number | null; ap?: number | null;
} = {}): Match {
  const { hp = null, ap = null, status = 'completed', decidedBy, ...rest } = opts;
  return {
    id: 1, venue: 'V', location: 'L', datetime: '2026-07-01T00:00:00Z',
    status, stage_name: 'Round of 32', decidedBy,
    home_team: { country: 'H', name: 'H', code: 'H', goals: home, penalties: hp },
    away_team: { country: 'A', name: 'A', code: 'A', goals: away, penalties: ap },
    ...rest,
  } as Match;
}

test('normal completed win picks the higher-scoring side', () => {
  const r = getMatchResult(ko(2, 1));
  expect(r.finished).toBe(true);
  expect(r.homeWon).toBe(true);
  expect(r.awayWon).toBe(false);
  expect(r.hasPens).toBe(false);
});

test('penalty win on level goals names the shootout winner (not a draw)', () => {
  // Germany 1-1 Paraguay, pens 3-4 -> away (Paraguay) win.
  const r = getMatchResult(ko(1, 1, { hp: 3, ap: 4, decidedBy: 'penalties' }));
  expect(r.hasPens).toBe(true);
  expect(r.homeWon).toBe(false);
  expect(r.awayWon).toBe(true);
});

test('home penalty win on level goals', () => {
  const r = getMatchResult(ko(1, 1, { hp: 5, ap: 4, decidedBy: 'penalties' }));
  expect(r.homeWon).toBe(true);
  expect(r.awayWon).toBe(false);
});

test('extra-time decided match still uses goals for the winner', () => {
  const r = getMatchResult(ko(2, 1, { decidedBy: 'extra_time' }));
  expect(r.decidedBy).toBe('extra_time');
  expect(r.homeWon).toBe(true);
  expect(r.awayWon).toBe(false);
  expect(r.hasPens).toBe(false);
});

test('away wins in extra time (3-2 AET) is read correctly', () => {
  const r = getMatchResult(ko(2, 3, { decidedBy: 'extra_time' }));
  expect(r.decidedBy).toBe('extra_time');
  expect(r.awayWon).toBe(true);
  expect(r.homeWon).toBe(false);
});

test('a goals-decided knockout (2-0) has no penalties and a clear winner', () => {
  const r = getMatchResult(ko(2, 0));
  expect(r.hasPens).toBe(false);
  expect(r.homeWon).toBe(true);
  expect(r.awayWon).toBe(false);
});

test('level goals with NO shootout score is not yet a decided result', () => {
  // A knockout can never END level on goals with no penalties; until the
  // shootout score arrives we must NOT pick a winner from the level goals.
  const r = getMatchResult(ko(1, 1));
  expect(r.finished).toBe(true);
  expect(r.hasPens).toBe(false);
  expect(r.homeWon).toBe(false);
  expect(r.awayWon).toBe(false);
});

test('only one penalty value present is treated as no shootout (avoids half data)', () => {
  const r = getMatchResult(ko(1, 1, { hp: 4, ap: null }));
  expect(r.hasPens).toBe(false);
  expect(r.homeWon).toBe(false);
  expect(r.awayWon).toBe(false);
});

test('a live match is never treated as finished', () => {
  const r = getMatchResult(ko(1, 1, { status: 'in_progress', hp: 2, ap: 1 }));
  expect(r.finished).toBe(false);
  expect(r.homeWon).toBe(false);
  expect(r.awayWon).toBe(false);
});

test('an unplayed knockout (no score) is neither finished nor won', () => {
  const r = getMatchResult(ko(null, null, { status: 'future_scheduled' }));
  expect(r.hasScore).toBe(false);
  expect(r.finished).toBe(false);
  expect(r.homeWon).toBe(false);
  expect(r.awayWon).toBe(false);
});

test('penalty win summary names the winner with the shootout score winner-first', () => {
  // Netherlands 1 (2) - 1 (3) Morocco -> "Morocco won 3-2 on penalties".
  const m = ko(1, 1, { hp: 2, ap: 3, decidedBy: 'penalties' });
  m.home_team.name = 'Netherlands';
  m.away_team.name = 'Morocco';
  expect(getPenaltyWinSummary(m)).toEqual({ winnerName: 'Morocco', winnerPens: 3, loserPens: 2 });
});

test('penalty win summary for a home win orders the winner score first', () => {
  const m = ko(1, 1, { hp: 5, ap: 4, decidedBy: 'penalties' });
  m.home_team.name = 'Spain';
  expect(getPenaltyWinSummary(m)).toEqual({ winnerName: 'Spain', winnerPens: 5, loserPens: 4 });
});

test('penalty win summary is null for non-shootout results (no false text)', () => {
  expect(getPenaltyWinSummary(ko(2, 1))).toBeNull(); // regulation
  expect(getPenaltyWinSummary(ko(2, 1, { decidedBy: 'extra_time' }))).toBeNull(); // AET, no pens
  expect(getPenaltyWinSummary(ko(1, 1, { status: 'in_progress', hp: 2, ap: 1 }))).toBeNull(); // live
});
