import { Match, Group } from './types';
import { fetchAllMatches, fetchGroups, fetchPlayerStats } from './worldcup';
import { Scorer, PlayerAgg } from './liveData';

export interface MatchHighlight {
  match: Match;
  value: number;
}

export interface TeamStat {
  code: string;
  name: string;
  value: number;
}

export interface TournamentStats {
  totalMatches: number;
  playedMatches: number;
  liveMatches: number;
  upcomingMatches: number;
  totalGoals: number;
  avgGoalsPerMatch: number;
  cleanSheets: number;
  bothTeamsScored: number;
  bttsPct: number;
  biggestWin: MatchHighlight | null;
  highestScoring: MatchHighlight | null;
  topScoringTeams: TeamStat[];
  bestDefenses: TeamStat[];
  topScorers: Scorer[];
  topAssists: PlayerAgg[];
  goalsByStage: { stage: string; goals: number; matches: number; scheduled: number }[];
}

function isPlayed(m: Match): boolean {
  return m.status === 'completed' && m.home_team.goals !== null && m.away_team.goals !== null;
}

function isLive(m: Match): boolean {
  return m.status === 'in_progress' || m.status === 'half_time';
}

function coarseStage(stageName: string): string {
  const s = (stageName || '').toLowerCase();
  if (s.includes('group')) return 'Group Stage';
  if (s.includes('round of 32') || s.includes('r32')) return 'Round of 32';
  if (s.includes('round of 16') || s.includes('r16')) return 'Round of 16';
  if (s.includes('quarter')) return 'Quarter-finals';
  if (s.includes('semi')) return 'Semi-finals';
  if (s.includes('third') || s.includes('3rd')) return 'Third Place';
  if (s.includes('final')) return 'Final';
  return stageName || 'Group Stage';
}

const STAGE_ORDER = [
  'Group Stage', 'Round of 32', 'Round of 16', 'Quarter-finals',
  'Semi-finals', 'Third Place', 'Final',
];

export function computeStats(
  matches: Match[],
  groups: Group[],
  topScorers: Scorer[] = [],
  topAssists: PlayerAgg[] = []
): TournamentStats {
  const played = matches.filter(isPlayed);
  const live = matches.filter(isLive);

  let totalGoals = 0;
  let cleanSheets = 0;
  let bothTeamsScored = 0;
  let biggestWin: MatchHighlight | null = null;
  let highestScoring: MatchHighlight | null = null;
  const stageMap = new Map<string, { goals: number; matches: number; scheduled: number }>();

  // Seed every round that exists in the schedule (even fully upcoming ones) so
  // the breakdown lists ALL rounds, not only those already played.
  for (const m of matches) {
    const stage = coarseStage(m.stage_name);
    const e = stageMap.get(stage) || { goals: 0, matches: 0, scheduled: 0 };
    e.scheduled += 1;
    stageMap.set(stage, e);
  }

  for (const m of played) {
    const hg = m.home_team.goals ?? 0;
    const ag = m.away_team.goals ?? 0;
    const total = hg + ag;
    const margin = Math.abs(hg - ag);
    totalGoals += total;

    if (hg === 0 || ag === 0) cleanSheets += 1;
    if (hg > 0 && ag > 0) bothTeamsScored += 1;

    if (!biggestWin || margin > biggestWin.value) biggestWin = { match: m, value: margin };
    if (!highestScoring || total > highestScoring.value) highestScoring = { match: m, value: total };

    const stage = coarseStage(m.stage_name);
    const entry = stageMap.get(stage) || { goals: 0, matches: 0, scheduled: 0 };
    entry.goals += total;
    entry.matches += 1;
    stageMap.set(stage, entry);
  }

  // Team leaderboards from group standings (already aggregated GF/GA).
  const teams: { code: string; name: string; gf: number; ga: number; played: number }[] = [];
  for (const g of groups) {
    for (const s of g.teams) {
      if (s.played > 0) {
        teams.push({
          code: s.team.code,
          name: s.team.name,
          gf: s.goals_for,
          ga: s.goals_against,
          played: s.played,
        });
      }
    }
  }

  const topScoringTeams: TeamStat[] = [...teams]
    .sort((a, b) => b.gf - a.gf || a.ga - b.ga)
    .slice(0, 5)
    .map((t) => ({ code: t.code, name: t.name, value: t.gf }));

  const bestDefenses: TeamStat[] = [...teams]
    .sort((a, b) => a.ga - b.ga || b.gf - a.gf)
    .slice(0, 5)
    .map((t) => ({ code: t.code, name: t.name, value: t.ga }));

  const goalsByStage = [...stageMap.entries()]
    .map(([stage, v]) => ({ stage, goals: v.goals, matches: v.matches, scheduled: v.scheduled }))
    .sort((a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage));

  return {
    totalMatches: matches.length,
    playedMatches: played.length,
    liveMatches: live.length,
    upcomingMatches: matches.length - played.length - live.length,
    totalGoals,
    avgGoalsPerMatch: played.length ? totalGoals / played.length : 0,
    cleanSheets,
    bothTeamsScored,
    bttsPct: played.length ? (bothTeamsScored / played.length) * 100 : 0,
    biggestWin,
    highestScoring,
    topScoringTeams,
    bestDefenses,
    topScorers,
    topAssists,
    goalsByStage,
  };
}

export async function fetchStats(): Promise<TournamentStats> {
  const [core, players] = await Promise.all([fetchStatsCore(), fetchTopPlayers()]);
  return { ...core, topScorers: players.topScorers, topAssists: players.topAssists };
}

export interface TopPlayers {
  topScorers: Scorer[];
  topAssists: PlayerAgg[];
}

// Fast half of the Stats tab: everything derivable from the calendar feed and
// group standings (both already cached), so it costs ≈0 extra network and can
// render instantly. The scorer/assist leaderboards are left empty here and
// filled in separately by fetchTopPlayers, which is the slow part.
export async function fetchStatsCore(): Promise<TournamentStats> {
  const [matches, groups] = await Promise.all([fetchAllMatches(), fetchGroups()]);
  return computeStats(matches, groups);
}

// Pure ranking used by both the Stats leaderboards and its tests. Ordering:
// primary metric desc, then FEWER team games (so the more efficient player — who
// needed fewer matches for the same tally — outranks one whose team played more),
// then fewer games scored/assisted in, then name for a stable final tiebreak.
export function buildTopPlayers(players: PlayerAgg[]): TopPlayers {
  const topScorers: Scorer[] = players
    .filter((p) => p.goals > 0)
    .sort((a, b) => b.goals - a.goals || a.teamGames - b.teamGames || a.goalGames - b.goalGames || a.name.localeCompare(b.name))
    .slice(0, 10)
    .map((p) => ({ id: p.id, name: p.name, code: p.code, goals: p.goals }));
  const topAssists: PlayerAgg[] = players
    .filter((p) => p.assists > 0)
    .sort((a, b) => b.assists - a.assists || a.teamGames - b.teamGames || a.assistGames - b.assistGames || a.name.localeCompare(b.name))
    .slice(0, 10);
  return { topScorers, topAssists };
}

// Slow half of the Stats tab: goals + assists aggregated from per-match FIFA
// timelines (no aggregate endpoint exists for this season). Finished-match
// timelines persist to localStorage, so this is only expensive on first visit.
export async function fetchTopPlayers(): Promise<TopPlayers> {
  return buildTopPlayers(await fetchPlayerStats());
}
