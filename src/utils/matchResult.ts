import { Match } from '../api/types';

// Single source of truth for how a match's result is interpreted, so every tab
// (Live, Schedule, Bracket, Favorites) shows the SAME outcome — including
// knockouts decided after 90 minutes by extra time or a penalty shootout.
export interface MatchResult {
  hasScore: boolean;
  finished: boolean;
  hasPens: boolean;
  // Winner accounts for the shootout: on level regulation goals (e.g. 1-1) the
  // side with more penalties is the winner.
  homeWon: boolean;
  awayWon: boolean;
  decidedBy?: Match['decidedBy'];
}

export function getMatchResult(m: Match): MatchResult {
  const hg = m.home_team.goals;
  const ag = m.away_team.goals;
  const hp = m.home_team.penalties;
  const ap = m.away_team.penalties;
  const hasScore = hg !== null && ag !== null;
  const hasPens = hp != null && ap != null;
  const finished = m.status === 'completed' && hasScore;
  const homeWon =
    finished && (hasPens ? (hp as number) > (ap as number) : (hg as number) > (ag as number));
  const awayWon =
    finished && (hasPens ? (ap as number) > (hp as number) : (ag as number) > (hg as number));
  return { hasScore, finished, hasPens, homeWon, awayWon, decidedBy: m.decidedBy };
}
