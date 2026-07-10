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

test('a goal in a live match counts toward the team leaderboards immediately', () => {
  const matches: Match[] = [
    // ESP finished a group game 0-0, then scores in a game happening right now.
    match({ stage_name: 'Group H', home_team: team('ESP', 0), away_team: team('CPV', 0) }),
    match({ stage_name: 'Group H', status: 'in_progress', home_team: team('ESP', 1), away_team: team('KSA', 0) }),
  ];
  const stats = computeStats(matches);
  // Group-only (finished) would leave ESP on 0; the live goal must push them to 1.
  expect(stats.topScoringTeams.find((t) => t.code === 'ESP')?.value).toBe(1);
  // The opponent's live goal-against shows on the "goals conceded" board too.
  expect(stats.bestDefenses.find((t) => t.code === 'KSA')?.value).toBe(1);
});

test('live matches do NOT distort completion-defined stats', () => {
  const matches: Match[] = [
    match({ stage_name: 'Group A', home_team: team('FRA', 2), away_team: team('SEN', 1) }),
    // In-progress 4-0: a big live scoreline must not be counted as a played
    // match, a clean sheet, the biggest win, or fold into the goal totals.
    match({ stage_name: 'Group A', status: 'in_progress', home_team: team('ESP', 4), away_team: team('CPV', 0) }),
  ];
  const stats = computeStats(matches);
  expect(stats.playedMatches).toBe(1);
  expect(stats.liveMatches).toBe(1);
  expect(stats.totalGoals).toBe(3); // only the finished 2-1, not the live 4-0
  expect(stats.avgGoalsPerMatch).toBeCloseTo(3);
  expect(stats.cleanSheets).toBe(0); // the live 4-0 is not a finished clean sheet
  expect(stats.biggestWin?.value).toBe(1); // FRA's 2-1 margin, not the live 4-0
  // But the live goals still reach the team leaderboard.
  expect(stats.topScoringTeams.find((t) => t.code === 'ESP')?.value).toBe(4);
});
