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

// For a knockout decided by a penalty shootout, returns the WINNER's name and
// the shootout score ordered winner-first (e.g. Morocco 3-2). Returns null for
// any other result, so the UI only ever shows "<team> won 3-2 on penalties"
// with the side that actually went through (never the level regulation goals).
export function getPenaltyWinSummary(
  m: Match
): { winnerName: string; winnerPens: number; loserPens: number } | null {
  const r = getMatchResult(m);
  if (!r.finished || !r.hasPens || m.decidedBy !== 'penalties') return null;
  const hp = m.home_team.penalties as number;
  const ap = m.away_team.penalties as number;
  if (r.homeWon) return { winnerName: m.home_team.name, winnerPens: hp, loserPens: ap };
  if (r.awayWon) return { winnerName: m.away_team.name, winnerPens: ap, loserPens: hp };
  return null;
}

export type ResultKind = 'penalties' | 'extra_time' | 'regulation' | 'draw';

export interface ResultSummary {
  kind: ResultKind;
  // Winner / loser names (null on a draw). Goals are ordered winner-first.
  winnerName: string | null;
  loserName: string | null;
  winnerGoals: number;
  loserGoals: number;
  // Shootout score, winner-first, only set when kind === 'penalties'.
  winnerPens?: number;
  loserPens?: number;
}

// Single source of truth for the "who won" result line shown on EVERY finished
// match card (Live, Today, Schedule, ...), so a plain 2-1 win is summarised the
// same way as an extra-time or penalty result — no card is left without a note.
// Returns null while the match is unfinished (no winner yet to announce).
export function getResultSummary(m: Match): ResultSummary | null {
  const r = getMatchResult(m);
  if (!r.finished) return null;
  const hg = m.home_team.goals as number;
  const ag = m.away_team.goals as number;
  if (!r.homeWon && !r.awayWon) {
    return { kind: 'draw', winnerName: null, loserName: null, winnerGoals: hg, loserGoals: ag };
  }
  const homeWins = r.homeWon;
  const winnerName = homeWins ? m.home_team.name : m.away_team.name;
  const loserName = homeWins ? m.away_team.name : m.home_team.name;
  const winnerGoals = homeWins ? hg : ag;
  const loserGoals = homeWins ? ag : hg;
  const kind: ResultKind =
    m.decidedBy === 'penalties' ? 'penalties' : m.decidedBy === 'extra_time' ? 'extra_time' : 'regulation';
  if (kind === 'penalties' && r.hasPens) {
    const hp = m.home_team.penalties as number;
    const ap = m.away_team.penalties as number;
    return {
      kind,
      winnerName,
      loserName,
      winnerGoals,
      loserGoals,
      winnerPens: homeWins ? hp : ap,
      loserPens: homeWins ? ap : hp,
    };
  }
  return { kind, winnerName, loserName, winnerGoals, loserGoals };
}
