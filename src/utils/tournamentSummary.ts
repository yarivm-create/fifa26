import { Match, TeamResult } from '../api/types';
import { getChampion, Champion } from './champion';
import { getMatchResult } from './matchResult';

// Knockout placeholder codes (2A, W73, RU101, 3ABCDF) are bracket slots not yet
// filled with a real country — mirrors the guard in champion.ts / Bracket.tsx.
const PLACEHOLDER_CODE = /^(\d|W\d|RU\d|3[A-L]{2,})/;
const isRealTeam = (code: string): boolean => !PLACEHOLDER_CODE.test(code);

// The five knockout rounds, used to trace the champion's road to the title.
const KNOCKOUT_STAGES = new Set([
  'Round of 32',
  'Round of 16',
  'Quarter-final',
  'Semi-final',
  'Final',
]);

function isPlayed(m: Match): boolean {
  return m.status === 'completed' && m.home_team.goals !== null && m.away_team.goals !== null;
}

// One leg of the champion's knockout run, framed from the winner's perspective
// (goals ordered champion-first) so the recap reads as a victory march.
export interface RoadMatch {
  match: Match;
  opponent: TeamResult;
  championGoals: number;
  opponentGoals: number;
  championPens?: number;
  opponentPens?: number;
  decidedBy?: Match['decidedBy'];
}

export interface TournamentSummary {
  champion: Champion;
  // Bronze medallists: the third-place play-off winner (null until it's decided).
  thirdPlace: TeamResult | null;
  final: Match;
  playedMatches: number;
  totalGoals: number;
  avgGoalsPerMatch: number;
  teamsCount: number;
  // The champion's knockout run, earliest round first (ends with the Final).
  road: RoadMatch[];
}

// Single source of truth for the end-of-tournament recap that replaces the Live
// tab once the trophy is lifted. Returns a full summary only when getChampion()
// resolves a decided Final — otherwise null, so the recap surfaces exactly when
// the tournament is over and never a moment before.
export function getTournamentSummary(
  matches: Match[] | null | undefined
): TournamentSummary | null {
  const champion = getChampion(matches);
  if (!champion || !matches) return null;

  // getChampion() guarantees a finished Final between two real teams.
  const final = matches.find((m) => m.stage_name === 'Final') as Match;

  // Bronze: the third-place play-off winner, if that match has been decided.
  let thirdPlace: TeamResult | null = null;
  const playoff = matches.find((m) => m.stage_name === 'Third place play-off');
  if (playoff) {
    const r = getMatchResult(playoff);
    if (r.finished && (r.homeWon || r.awayWon)) {
      const winner = r.homeWon ? playoff.home_team : playoff.away_team;
      if (isRealTeam(winner.code)) thirdPlace = winner;
    }
  }

  // Tournament-wide tallies over every finished match.
  const played = matches.filter(isPlayed);
  let totalGoals = 0;
  const teams = new Set<string>();
  for (const m of played) {
    totalGoals += (m.home_team.goals ?? 0) + (m.away_team.goals ?? 0);
    if (isRealTeam(m.home_team.code)) teams.add(m.home_team.code);
    if (isRealTeam(m.away_team.code)) teams.add(m.away_team.code);
  }
  const playedMatches = played.length;

  // The champion's knockout run: every KO match they featured in, in date order.
  const champCode = champion.team.code;
  const road: RoadMatch[] = played
    .filter(
      (m) =>
        KNOCKOUT_STAGES.has(m.stage_name) &&
        (m.home_team.code === champCode || m.away_team.code === champCode)
    )
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
    .map((m) => {
      const champIsHome = m.home_team.code === champCode;
      const opponent = champIsHome ? m.away_team : m.home_team;
      return {
        match: m,
        opponent,
        championGoals: (champIsHome ? m.home_team.goals : m.away_team.goals) as number,
        opponentGoals: (champIsHome ? m.away_team.goals : m.home_team.goals) as number,
        championPens: (champIsHome ? m.home_team.penalties : m.away_team.penalties) ?? undefined,
        opponentPens: (champIsHome ? m.away_team.penalties : m.home_team.penalties) ?? undefined,
        decidedBy: m.decidedBy,
      };
    });

  return {
    champion,
    thirdPlace,
    final,
    playedMatches,
    totalGoals,
    avgGoalsPerMatch: playedMatches ? totalGoals / playedMatches : 0,
    teamsCount: teams.size,
    road,
  };
}
