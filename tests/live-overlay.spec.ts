import { test, expect } from '@playwright/test';
import { applyOverlay, mapStatus, FifaMatch } from '../src/api/liveData';
import { getMatchResult } from '../src/utils/matchResult';
import { Match } from '../src/api/types';

// Pins how a knockout score is built from FIFA's calendar feed and then read by
// the shared result helper, so the EXACT bugs reported today can never regress:
//  - a 1-1 knockout must surface as decided by penalties (not a draw),
//  - extra-time wins must be labelled AET,
//  - a reversed FIFA key (swap=true) must move each team's GOALS *and*
//    PENALTIES together (the Germany / Netherlands "wrong winner" bug),
//  - a live shootout must show the PENALTIES status.

function baseKO(homeCode: string, awayCode: string): Match {
  return {
    id: 74, venue: 'V', location: 'L', datetime: '2026-06-29T19:00:00Z',
    status: 'future_scheduled', stage_name: 'Round of 32',
    home_team: { country: homeCode, name: homeCode, code: homeCode, goals: null, penalties: null },
    away_team: { country: awayCode, name: awayCode, code: awayCode, goals: null, penalties: null },
  };
}

function fifa(ev: Partial<FifaMatch>): FifaMatch {
  return { Home: null, Away: null, HomeTeamScore: null, AwayTeamScore: null, MatchStatus: 0, MatchTime: null, ...ev };
}

test('finished 1-1 shootout is decided by penalties with the right winner', () => {
  // FIFA keyed home=GER away=PAR: GER 1 (3) - 1 (4) PAR -> PAR through.
  const m = applyOverlay(
    baseKO('GER', 'PAR'),
    fifa({ HomeTeamScore: 1, AwayTeamScore: 1, HomeTeamPenaltyScore: 3, AwayTeamPenaltyScore: 4, ResultType: 2, MatchStatus: 0 }),
    false,
  );
  expect(m.status).toBe('completed');
  expect(m.decidedBy).toBe('penalties');
  expect(m.home_team.goals).toBe(1);
  expect(m.away_team.goals).toBe(1);
  expect(m.home_team.penalties).toBe(3);
  expect(m.away_team.penalties).toBe(4);

  const r = getMatchResult(m);
  expect(r.hasPens).toBe(true);
  expect(r.awayWon).toBe(true);
  expect(r.homeWon).toBe(false);
});

test('a REVERSED FIFA key swaps goals AND penalties together (no wrong winner)', () => {
  // Our schedule has home=GER away=PAR, but FIFA returns the tie keyed the other
  // way (home=PAR away=GER): PAR 1 (4) - 1 (3) GER. With swap=true each team
  // must keep its OWN goals with its OWN penalties, so GER=1(3), PAR=1(4) and
  // PAR is still the winner. (Swapping goals but not penalties would wrongly
  // hand GER the 4 and flip the winner — that was the reported bug.)
  const m = applyOverlay(
    baseKO('GER', 'PAR'),
    fifa({ HomeTeamScore: 1, AwayTeamScore: 1, HomeTeamPenaltyScore: 4, AwayTeamPenaltyScore: 3, ResultType: 2, MatchStatus: 0 }),
    true,
  );
  expect(m.home_team.code).toBe('GER');
  expect(m.home_team.goals).toBe(1);
  expect(m.home_team.penalties).toBe(3);
  expect(m.away_team.code).toBe('PAR');
  expect(m.away_team.goals).toBe(1);
  expect(m.away_team.penalties).toBe(4);
  expect(m.decidedBy).toBe('penalties');

  const r = getMatchResult(m);
  expect(r.awayWon).toBe(true);
  expect(r.homeWon).toBe(false);
});

test('a reversed key also swaps an uneven goal score correctly', () => {
  // FIFA keyed home=JPN away=BRA: JPN 1 - 2 BRA, regulation. Our schedule has
  // home=BRA away=JPN, so swap must give BRA 2 - 1 JPN.
  const m = applyOverlay(
    baseKO('BRA', 'JPN'),
    fifa({ HomeTeamScore: 1, AwayTeamScore: 2, ResultType: 1, MatchStatus: 0 }),
    true,
  );
  expect(m.home_team.code).toBe('BRA');
  expect(m.home_team.goals).toBe(2);
  expect(m.away_team.code).toBe('JPN');
  expect(m.away_team.goals).toBe(1);
  expect(m.decidedBy).toBeUndefined();
  expect(getMatchResult(m).homeWon).toBe(true);
});

test('extra-time win (ResultType 3, no shootout) is labelled extra_time', () => {
  // Real 2026 case: Belgium 3-2 Senegal, Round of 32, decided in extra time —
  // FIFA reports ResultType 3 (not 2) and no penalty score.
  const m = applyOverlay(
    baseKO('BEL', 'SEN'),
    fifa({ HomeTeamScore: 3, AwayTeamScore: 2, ResultType: 3, MatchStatus: 0 }),
    false,
  );
  expect(m.decidedBy).toBe('extra_time');
  expect(m.home_team.penalties).toBeNull();
  expect(m.away_team.penalties).toBeNull();
  expect(getMatchResult(m).homeWon).toBe(true);
});

test('a shootout is penalties via ResultType 2 even before the score arrives', () => {
  const m = applyOverlay(
    baseKO('ESP', 'CRO'),
    fifa({ HomeTeamScore: 1, AwayTeamScore: 1, ResultType: 2, MatchStatus: 0 }),
    false,
  );
  expect(m.decidedBy).toBe('penalties');
});

test('a regulation result (ResultType 1) is decided by neither ET nor penalties', () => {
  const m = applyOverlay(
    baseKO('ARG', 'MEX'),
    fifa({ HomeTeamScore: 2, AwayTeamScore: 0, ResultType: 1, MatchStatus: 0 }),
    false,
  );
  expect(m.decidedBy).toBeUndefined();
  expect(m.home_team.penalties).toBeNull();
});

test('a live shootout shows the PENALTIES status via Period 11', () => {
  const s = mapStatus(fifa({ MatchStatus: 3, Period: 11, MatchTime: null }));
  expect(s).toEqual({ status: 'in_progress', time: 'PEN' });
});

test('a live shootout is detected from the penalty score even if Period lags', () => {
  const s = mapStatus(fifa({ MatchStatus: 3, HomeTeamPenaltyScore: 2, AwayTeamPenaltyScore: 1, MatchTime: null }));
  expect(s).toEqual({ status: 'in_progress', time: 'PEN' });
});

test('every live match phase maps to the right status + minute sentinel', () => {
  // Regulation first half (Period 3) and second half (Period 5) show the FIFA
  // minute verbatim; the phase itself is carried by the minute, not a sentinel.
  expect(mapStatus(fifa({ MatchStatus: 3, Period: 3, MatchTime: "23'" }))).toEqual({ status: 'in_progress', time: "23'" });
  expect(mapStatus(fifa({ MatchStatus: 3, Period: 5, MatchTime: "67'" }))).toEqual({ status: 'in_progress', time: "67'" });
  // Regulation half-time break (Period 4).
  expect(mapStatus(fifa({ MatchStatus: 3, Period: 4, MatchTime: null }))).toEqual({ status: 'half_time', time: 'HT' });
  // A live minute with no Period yet (calendar interval) still shows as-is.
  expect(mapStatus(fifa({ MatchStatus: 3, MatchTime: "72'" }))).toEqual({ status: 'in_progress', time: "72'" });
  // Full time — a finished match carries no live minute.
  expect(mapStatus(fifa({ MatchStatus: 0 }))).toEqual({ status: 'completed' });
});

test('extra-time first half (Period 7) shows the running ET minute, not half-time', () => {
  // Real 2026 case: Australia 1-1 Egypt, Round of 32 — the FIFA live endpoint
  // returned Period 7 + MatchTime "95'" while extra time was being PLAYED.
  // The card must read "ET 95'", never "HALF TIME".
  const s = mapStatus(fifa({ MatchStatus: 3, Period: 7, MatchTime: "95'" }));
  expect(s).toEqual({ status: 'in_progress', time: "ET 95'" });
});

test('extra-time second half (Period 9) also surfaces the ET minute in play', () => {
  const s = mapStatus(fifa({ MatchStatus: 3, Period: 9, MatchTime: "112'" }));
  expect(s).toEqual({ status: 'in_progress', time: "ET 112'" });
});

test('extra-time half-time break (Period 8) reads as extra time, not a plain half-time', () => {
  const s = mapStatus(fifa({ MatchStatus: 3, Period: 8, MatchTime: null }));
  expect(s).toEqual({ status: 'half_time', time: 'ET HT' });
});

test('after extra time ends level (Period 16) the card signals penalties are next', () => {
  // Real 2026 case: Australia 1-1 Egypt — the live endpoint reported Period 16
  // once extra time ended, before the shootout scored. This must read as
  // "penalties next", not a bare live minute.
  const s = mapStatus(fifa({ MatchStatus: 3, Period: 16, MatchTime: null }));
  expect(s).toEqual({ status: 'half_time', time: 'PRE_PEN' });
});

test('a clean minute past 90 is flagged as extra time even when the Period lookup lags', () => {
  // The calendar feed can report "94'" with an empty Period before the live
  // endpoint enrichment lands; a clean minute > 90 only occurs in extra time.
  expect(mapStatus(fifa({ MatchStatus: 3, MatchTime: "94'" }))).toEqual({ status: 'in_progress', time: "ET 94'" });
  // Extra-time stoppage ("120'+2'") still reads as extra time via the leading
  // minute even when the live Period lookup has not landed yet.
  expect(mapStatus(fifa({ MatchStatus: 3, MatchTime: "120'+2'" }))).toEqual({ status: 'in_progress', time: "ET 120'+2'" });
  // Extra time in play with FIFA's authoritative Period keeps its stoppage too.
  expect(mapStatus(fifa({ MatchStatus: 3, Period: 9, MatchTime: "105'+1'" }))).toEqual({ status: 'in_progress', time: "ET 105'+1'" });
  // Regulation stoppage time ("90'+3") must NOT be mistaken for extra time.
  expect(mapStatus(fifa({ MatchStatus: 3, MatchTime: "90'+3" }))).toEqual({ status: 'in_progress', time: "90'+3" });
  expect(mapStatus(fifa({ MatchStatus: 3, MatchTime: "45'+2" }))).toEqual({ status: 'in_progress', time: "45'+2" });
});

test('an upcoming match leaves the verified mock schedule untouched', () => {
  expect(mapStatus(fifa({ MatchStatus: 1 }))).toBeNull();
  const base = baseKO('W73', 'W75');
  const m = applyOverlay(base, fifa({ MatchStatus: 1 }), false);
  // Unmapped status -> the base match is returned unchanged (still placeholders).
  expect(m).toBe(base);
});
