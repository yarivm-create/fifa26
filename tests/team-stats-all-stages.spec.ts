import { test, expect } from '@playwright/test';
import { computeStats } from '../src/api/stats';
import { Match, TeamResult } from '../src/api/types';

// Team leaderboards (top scoring / best defences) must aggregate goals across
// EVERY stage, not just the group phase, so a knockout goal counts too.
function team(code: string, goals: number | null, penalties?: number): TeamResult {
  return { country: code, name: code, code, goals, penalties: penalties ?? null };
}

function match(over: Partial<Match> & { home_team: TeamResult; away_team: TeamResult }): Match {
  return {
    id: 1,
    venue: 'V',
    location: 'L',
    datetime: '2026-07-01T00:00:00Z',
    status: 'completed',
    stage_name: 'Group A',
    ...over,
  };
}

test('top scoring teams include knockout goals, not just the group stage', () => {
  const matches: Match[] = [
    match({ stage_name: 'Group A', home_team: team('FRA', 3), away_team: team('SEN', 1) }),
    match({ stage_name: 'Round of 16', home_team: team('FRA', 1), away_team: team('PAR', 0) }),
  ];
  const stats = computeStats(matches);
  // 3 group goals + 1 knockout goal = 4 (group-only would report 3).
  expect(stats.topScoringTeams.find((t) => t.code === 'FRA')?.value).toBe(4);
});

test('best defenses aggregate goals conceded across all stages', () => {
  const matches: Match[] = [
    match({ stage_name: 'Group A', home_team: team('FRA', 3), away_team: team('SEN', 1) }),
    match({ stage_name: 'Round of 16', home_team: team('FRA', 1), away_team: team('PAR', 0) }),
  ];
  const stats = computeStats(matches);
  // FRA conceded 1 (SEN) + 0 (PAR) across both stages.
  expect(stats.bestDefenses.find((t) => t.code === 'FRA')?.value).toBe(1);
});

test('a team that only played a knockout match still appears', () => {
  const matches: Match[] = [
    match({ stage_name: 'Round of 16', home_team: team('POR', 2), away_team: team('BEL', 3) }),
  ];
  const stats = computeStats(matches);
  expect(stats.topScoringTeams.find((t) => t.code === 'BEL')?.value).toBe(3);
  expect(stats.topScoringTeams.find((t) => t.code === 'POR')?.value).toBe(2);
});

test('penalty shootouts are excluded — only regulation+ET goals count', () => {
  const matches: Match[] = [
    match({
      stage_name: 'Quarter-finals',
      decidedBy: 'penalties',
      home_team: team('ARG', 1, 4),
      away_team: team('NED', 1, 3),
    }),
  ];
  const stats = computeStats(matches);
  expect(stats.topScoringTeams.find((t) => t.code === 'ARG')?.value).toBe(1);
});
