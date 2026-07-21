import { test, expect } from '@playwright/test';
import { getTournamentSummary } from '../src/utils/tournamentSummary';
import { Match } from '../src/api/types';

// Unit coverage for the end-of-tournament recap resolver that replaces the Live
// tab once the trophy is lifted. Engine-independent (no browser): asserts the
// podium (incl. bronze), tournament tallies and the champion's knockout road are
// derived correctly, and that nothing surfaces until the Final is decided.

function team(
  code: string,
  name: string,
  goals: number | null = null,
  penalties: number | null = null
) {
  return { country: name, code, name, goals, penalties } as Match['home_team'];
}

let seq = 0;
function match(
  stage: string,
  home: Match['home_team'],
  away: Match['away_team'],
  status: Match['status'] = 'completed',
  datetime = '2026-07-01T00:00:00Z',
  decidedBy?: Match['decidedBy']
): Match {
  return {
    id: ++seq,
    venue: 'MetLife Stadium',
    location: 'New Jersey, USA',
    datetime,
    stage_name: stage,
    status,
    decidedBy,
    home_team: home,
    away_team: away,
  } as Match;
}

// A complete, self-consistent tournament tail: Spain lift the trophy, Argentina
// take bronze. Kept deliberately small so every tally is checkable by hand.
function finishedTournament(): Match[] {
  return [
    match('Group A - MD1', team('MEX', 'Mexico', 2), team('RSA', 'South Africa', 0), 'completed', '2026-06-11T19:00:00Z'),
    match('Group B - MD1', team('ESP', 'Spain', 3), team('CAN', 'Canada', 1), 'completed', '2026-06-12T19:00:00Z'),
    match('Round of 16', team('ESP', 'Spain', 2), team('GER', 'Germany', 1), 'completed', '2026-07-05T19:00:00Z'),
    match('Quarter-final', team('ESP', 'Spain', 1), team('BRA', 'Brazil', 0), 'completed', '2026-07-09T19:00:00Z'),
    match('Semi-final', team('ESP', 'Spain', 3), team('ARG', 'Argentina', 2), 'completed', '2026-07-14T19:00:00Z'),
    match('Semi-final', team('FRA', 'France', 2), team('POR', 'Portugal', 1), 'completed', '2026-07-15T19:00:00Z'),
    match('Third place play-off', team('ARG', 'Argentina', 2), team('POR', 'Portugal', 1), 'completed', '2026-07-18T19:00:00Z'),
    match('Final', team('ESP', 'Spain', 4), team('FRA', 'France', 2), 'completed', '2026-07-19T19:00:00Z'),
  ];
}

test('summarises the podium, tallies and champion road once the Final is decided', () => {
  const s = getTournamentSummary(finishedTournament());
  expect(s).not.toBeNull();

  // Gold + silver come from the Final.
  expect(s!.champion.team.code).toBe('ESP');
  expect(s!.champion.runnerUp.code).toBe('FRA');
  expect(s!.champion.winnerGoals).toBe(4);
  expect(s!.champion.loserGoals).toBe(2);

  // Bronze is the third-place play-off winner.
  expect(s!.thirdPlace?.code).toBe('ARG');

  // Tallies over the eight finished matches.
  expect(s!.playedMatches).toBe(8);
  expect(s!.totalGoals).toBe(27);
  expect(s!.avgGoalsPerMatch).toBeCloseTo(3.375, 3);
  // Distinct real teams: MEX, RSA, ESP, CAN, GER, BRA, ARG, FRA, POR.
  expect(s!.teamsCount).toBe(9);

  // The champion's knockout run, earliest round first, ending with the Final.
  expect(s!.road.map((r) => r.opponent.code)).toEqual(['GER', 'BRA', 'ARG', 'FRA']);
  expect(s!.road.map((r) => r.match.stage_name)).toEqual([
    'Round of 16',
    'Quarter-final',
    'Semi-final',
    'Final',
  ]);
  const finalLeg = s!.road[s!.road.length - 1];
  expect(finalLeg.championGoals).toBe(4);
  expect(finalLeg.opponentGoals).toBe(2);
});

test('records shootout scores winner-first on the champion road and Final', () => {
  const s = getTournamentSummary([
    match('Quarter-final', team('ESP', 'Spain', 0, 5), team('BRA', 'Brazil', 0, 4), 'completed', '2026-07-09T19:00:00Z', 'penalties'),
    match('Semi-final', team('ESP', 'Spain', 2), team('ARG', 'Argentina', 1), 'completed', '2026-07-14T19:00:00Z'),
    match('Final', team('ESP', 'Spain', 1, 4), team('FRA', 'France', 1, 2), 'completed', '2026-07-19T19:00:00Z', 'penalties'),
  ]);
  expect(s).not.toBeNull();
  // Final: level in regulation, Spain through on penalties.
  expect(s!.champion.team.code).toBe('ESP');
  expect(s!.champion.decidedBy).toBe('penalties');
  expect(s!.champion.winnerPens).toBe(4);
  expect(s!.champion.loserPens).toBe(2);

  // The penalty quarter-final carries the shootout score, champion-first.
  const qf = s!.road.find((r) => r.match.stage_name === 'Quarter-final')!;
  expect(qf.decidedBy).toBe('penalties');
  expect(qf.championPens).toBe(5);
  expect(qf.opponentPens).toBe(4);
});

test('no bronze until the third-place play-off is decided', () => {
  const s = getTournamentSummary([
    match('Third place play-off', team('RU101', 'RU101'), team('RU102', 'RU102'), 'future_scheduled', '2026-07-18T19:00:00Z'),
    match('Final', team('ESP', 'Spain', 2), team('FRA', 'France', 1), 'completed', '2026-07-19T19:00:00Z'),
  ]);
  expect(s).not.toBeNull();
  expect(s!.champion.team.code).toBe('ESP');
  expect(s!.thirdPlace).toBeNull();
  // Only the Final is finished, so it is the sole leg of the road.
  expect(s!.road).toHaveLength(1);
  expect(s!.road[0].match.stage_name).toBe('Final');
});

test('no summary while the tournament is still running', () => {
  // A decided Semi-final but no Final → not over yet.
  expect(
    getTournamentSummary([
      match('Semi-final', team('ESP', 'Spain', 2), team('ARG', 'Argentina', 1), 'completed'),
    ])
  ).toBeNull();
  // An unplayed Final holding bracket placeholders → not over.
  expect(
    getTournamentSummary([
      match('Final', team('W101', 'W101'), team('W102', 'W102'), 'future_scheduled'),
    ])
  ).toBeNull();
  expect(getTournamentSummary([])).toBeNull();
  expect(getTournamentSummary(null)).toBeNull();
});
