import { Match, TeamResult } from '../api/types';
import { getMatchResult } from './matchResult';

// Placeholder codes (e.g. "W101", "2A", "RU101", "3ABCDF") are knockout slots
// that haven't been filled with a real team yet — a champion is only real once
// the Final's slots resolve to an actual country.
const PLACEHOLDER_CODE = /^(\d|W\d|RU\d|3[A-L]{2,})/;

export interface Champion {
  team: TeamResult;
  runnerUp: TeamResult;
  // Goals are ordered winner-first. For a shootout these are the (level)
  // regulation goals; the shootout score is in winnerPens / loserPens.
  winnerGoals: number;
  loserGoals: number;
  winnerPens?: number;
  loserPens?: number;
  decidedBy?: Match['decidedBy'];
  venue: string;
  datetime: string;
}

// Single source of truth for "who won the World Cup". Returns the champion only
// when the Final (stage_name === 'Final') is completed with a decided winner and
// both slots hold real teams — otherwise null (tournament not over yet), so the
// celebration banner appears the moment the trophy is lifted and never before.
export function getChampion(matches: Match[] | null | undefined): Champion | null {
  if (!matches) return null;
  const final = matches.find((m) => m.stage_name === 'Final');
  if (!final) return null;

  const r = getMatchResult(final);
  if (!r.finished || (!r.homeWon && !r.awayWon)) return null;

  const homeWon = r.homeWon;
  const team = homeWon ? final.home_team : final.away_team;
  const runnerUp = homeWon ? final.away_team : final.home_team;

  // Guard against a "completed" Final whose teams are still bracket placeholders.
  if (PLACEHOLDER_CODE.test(team.code) || PLACEHOLDER_CODE.test(runnerUp.code)) return null;

  const winnerGoals = (homeWon ? final.home_team.goals : final.away_team.goals) as number;
  const loserGoals = (homeWon ? final.away_team.goals : final.home_team.goals) as number;

  const hasPens = r.hasPens;
  const winnerPens = hasPens
    ? ((homeWon ? final.home_team.penalties : final.away_team.penalties) as number)
    : undefined;
  const loserPens = hasPens
    ? ((homeWon ? final.away_team.penalties : final.home_team.penalties) as number)
    : undefined;

  return {
    team,
    runnerUp,
    winnerGoals,
    loserGoals,
    winnerPens,
    loserPens,
    decidedBy: final.decidedBy,
    venue: final.venue,
    datetime: final.datetime,
  };
}
