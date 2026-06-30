import { test, expect } from '@playwright/test';
import { fetchAllMatches } from '../src/api/mockData';
import { sortBracketRound } from '../src/utils/bracketOrder';
import { Match } from '../src/api/types';

// These tests pin the knockout bracket DRAW so a wrong feeder/order regression
// (e.g. a Round-of-16 card showing the wrong two Round-of-32 winners, or a card
// rendered out of bracket order) is caught without needing live FIFA data.
//
// The expectations below are the OFFICIAL FIFA World Cup 2026 knockout feeder
// map, where each match id equals its FIFA MatchNumber, so a "W##" winner
// placeholder references the feeder match whose id is ##.
const R16_FEEDERS: Record<number, [number, number]> = {
  89: [74, 77], 90: [73, 75], 91: [76, 78], 92: [79, 80],
  93: [83, 84], 94: [81, 82], 95: [86, 88], 96: [85, 87],
};
const QF_FEEDERS: Record<number, [number, number]> = {
  97: [89, 90], 98: [93, 94], 99: [91, 92], 100: [95, 96],
};
const SF_FEEDERS: Record<number, [number, number]> = {
  101: [97, 98], 102: [99, 100],
};
const FINAL_FEEDERS: Record<number, [number, number]> = { 104: [101, 102] };
const ALL_FEEDERS = { ...R16_FEEDERS, ...QF_FEEDERS, ...SF_FEEDERS, ...FINAL_FEEDERS };

let byId: Map<number, Match>;

test.beforeAll(async () => {
  const all = await fetchAllMatches();
  byId = new Map(all.map((m) => [m.id, m]));
});

test('knockout match ids are contiguous 73-104 (aligned to FIFA MatchNumbers)', () => {
  for (let id = 73; id <= 104; id++) {
    expect(byId.has(id), `KO match ${id} should exist`).toBe(true);
  }
});

test('each KO card is fed by the correct two earlier matches (FIFA draw)', () => {
  for (const [idStr, [fa, fb]] of Object.entries(ALL_FEEDERS)) {
    const id = Number(idStr);
    const m = byId.get(id)!;
    // The two team slots must be the winner placeholders of the feeder matches.
    expect(m.home_team.code, `match ${id} home feeder`).toBe(`W${fa}`);
    expect(m.away_team.code, `match ${id} away feeder`).toBe(`W${fb}`);
    // Feeders must be kicked off before the match they feed.
    const ta = new Date(byId.get(fa)!.datetime).getTime();
    const tb = new Date(byId.get(fb)!.datetime).getTime();
    const tm = new Date(m.datetime).getTime();
    expect(ta, `feeder ${fa} before match ${id}`).toBeLessThan(tm);
    expect(tb, `feeder ${fb} before match ${id}`).toBeLessThan(tm);
  }
});

test('Round of 16 draw matches the official pairings (regression: wrong card order)', () => {
  // The exact bug reported: an R16 card showed the wrong R32 winners. Pin the
  // two corner cards whose feeders were previously swapped.
  expect(byId.get(89)!.home_team.code).toBe('W74');
  expect(byId.get(89)!.away_team.code).toBe('W77');
  expect(byId.get(90)!.home_team.code).toBe('W73');
  expect(byId.get(90)!.away_team.code).toBe('W75');
});

test('every knockout match sits in the expected round/stage', () => {
  const stageOf = (id: number) => byId.get(id)!.stage_name;
  for (let id = 73; id <= 88; id++) expect(stageOf(id)).toBe('Round of 32');
  for (let id = 89; id <= 96; id++) expect(stageOf(id)).toBe('Round of 16');
  for (let id = 97; id <= 100; id++) expect(stageOf(id)).toBe('Quarter-final');
  for (let id = 101; id <= 102; id++) expect(stageOf(id)).toBe('Semi-final');
  expect(stageOf(103)).toBe('Third place play-off');
  expect(stageOf(104)).toBe('Final');
});

// Mirrors the EXACT comparator the Bracket component uses to order cards inside
// a round, so the reported "wrong card order" regression is caught here.
function byDate(round: string, all: Match[]): Match[] {
  return sortBracketRound(all.filter((m) => m.stage_name === round));
}

test('each round renders chronologically; the earliest Round-of-32 tie is first', async () => {
  const all = Array.from(byId.values());
  for (const round of ['Round of 32', 'Round of 16', 'Quarter-final', 'Semi-final']) {
    const ordered = byDate(round, all);
    for (let i = 1; i < ordered.length; i++) {
      const prev = new Date(ordered[i - 1].datetime).getTime();
      const cur = new Date(ordered[i].datetime).getTime();
      expect(prev, `${round} card ${i} not before card ${i + 1}`).toBeLessThanOrEqual(cur);
    }
  }
  // The reported bug: a later tie showed before the first Round-of-32 game.
  // Match #73 (South Africa's tie in the live draw) is the earliest R32 kick-off,
  // so date ordering must place it first.
  const r32 = byDate('Round of 32', all);
  expect(r32[0].id).toBe(73);
  const minTime = Math.min(...all.filter((m) => m.stage_name === 'Round of 32').map((m) => new Date(m.datetime).getTime()));
  expect(new Date(r32[0].datetime).getTime()).toBe(minTime);
});
