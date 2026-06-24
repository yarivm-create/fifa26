import { Match, Group } from './types';
import * as mock from './mockData';

// FIFA's official public API (CORS-enabled: Access-Control-Allow-Origin: *).
// FIFA World Cup 2026: competition 17, season 285023. Returns all 104 matches
// with live scores, status, and the exact match minute (MatchTime, e.g. "72'").
const FIFA_COMPETITION = 17;
const FIFA_SEASON = 285023;
const FIFA_URL =
  `https://api.fifa.com/api/v3/calendar/matches?idCompetition=${FIFA_COMPETITION}&idSeason=${FIFA_SEASON}&count=200&language=en`;

interface FifaTeam {
  IdTeam?: string | null;
  IdCountry: string | null;
  TeamName?: { Description: string }[];
}

interface FifaMatch {
  IdCompetition?: string;
  IdSeason?: string;
  IdStage?: string;
  IdMatch?: string;
  Home: FifaTeam | null;
  Away: FifaTeam | null;
  HomeTeamScore: number | null;
  AwayTeamScore: number | null;
  MatchStatus: number; // 0 = finished, 1 = upcoming, 3 = live
  MatchTime: string | null; // e.g. "72'", "45'+2", "HT"
}

type LiveStatus = { status: Match['status']; time?: string };

// FIFA MatchStatus: 0 finished, 1 not started, 3 live. Anything else (postponed,
// abandoned, etc.) leaves the mock scheduled state untouched.
function mapStatus(ev: FifaMatch): LiveStatus | null {
  switch (ev.MatchStatus) {
    case 0:
      return { status: 'completed' }; // no live minute for finished games
    case 3: {
      const mt = (ev.MatchTime || '').trim();
      const upper = mt.toUpperCase();
      if (upper === 'HT' || upper.includes('HALF')) {
        return { status: 'half_time', time: 'HT' };
      }
      // FIFA already formats the minute (e.g. "72'"); show it verbatim.
      return { status: 'in_progress', time: mt || undefined };
    }
    default:
      return null; // upcoming / unknown -> keep verified mock schedule
  }
}

async function fetchFifaMatches(): Promise<FifaMatch[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(FIFA_URL, { signal: controller.signal });
    if (!res.ok) return [];
    const json = await res.json();
    return (json?.Results as FifaMatch[]) || [];
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

// Builds a lookup of FIFA matches keyed by "HOMECODE_AWAYCODE" (skips knockout
// fixtures whose teams are not yet known).
async function fetchLiveMap(): Promise<Record<string, FifaMatch>> {
  const matches = await fetchFifaMatches();
  const map: Record<string, FifaMatch> = {};
  for (const ev of matches) {
    const hc = ev.Home?.IdCountry;
    const ac = ev.Away?.IdCountry;
    if (!hc || !ac) continue;
    map[`${hc}_${ac}`] = ev;
  }
  return map;
}

let cache: { at: number; map: Record<string, FifaMatch> } | null = null;
const CACHE_TTL_MS = 25000;

async function getLiveMap(): Promise<Record<string, FifaMatch>> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) return cache.map;
  const map = await fetchLiveMap();
  // Only replace cache if we actually got data; otherwise keep prior cache.
  if (Object.keys(map).length > 0 || !cache) {
    cache = { at: now, map };
  }
  return cache.map;
}

function applyOverlay(base: Match, ev: FifaMatch, swap: boolean): Match {
  const mapped = mapStatus(ev);
  if (!mapped) return base;

  const rawHome = ev.HomeTeamScore;
  const rawAway = ev.AwayTeamScore;
  const homeGoals = swap ? rawAway : rawHome;
  const awayGoals = swap ? rawHome : rawAway;

  return {
    ...base,
    status: mapped.status,
    time: mapped.time,
    home_team: { ...base.home_team, goals: homeGoals ?? base.home_team.goals },
    away_team: { ...base.away_team, goals: awayGoals ?? base.away_team.goals },
  };
}

// Returns the full mock schedule with live scores/status overlaid from FIFA.
export async function getMergedMatches(): Promise<Match[]> {
  const base = await mock.fetchAllMatches();
  const liveMap = await getLiveMap();
  if (Object.keys(liveMap).length === 0) return base;

  return base.map((m) => {
    const hc = m.home_team.code;
    const ac = m.away_team.code;
    let ev = liveMap[`${hc}_${ac}`];
    let swap = false;
    if (!ev) {
      ev = liveMap[`${ac}_${hc}`];
      swap = true;
    }
    return ev ? applyOverlay(m, ev, swap) : m;
  });
}

// Recomputes group standings from the merged (live) completed group-stage matches.
export async function getMergedGroups(): Promise<Group[]> {
  const [groups, merged] = await Promise.all([mock.fetchGroups(), getMergedMatches()]);
  const byCode: Record<string, Match[]> = {};
  for (const m of merged) {
    if (!m.stage_name.startsWith('Group')) continue;
    if (m.status !== 'completed') continue;
    if (m.home_team.goals === null || m.away_team.goals === null) continue;
    (byCode[m.home_team.code] ||= []).push(m);
    (byCode[m.away_team.code] ||= []).push(m);
  }

  return groups.map((g) => {
    const codes = new Set(g.teams.map((t) => t.team.code));
    const teams = g.teams.map((standing) => {
      const code = standing.team.code;
      let played = 0, won = 0, drawn = 0, lost = 0, gf = 0, ga = 0;
      for (const m of byCode[code] || []) {
        const isHome = m.home_team.code === code;
        const opp = isHome ? m.away_team.code : m.home_team.code;
        if (!codes.has(opp)) continue; // only intra-group matches
        const my = isHome ? m.home_team.goals! : m.away_team.goals!;
        const their = isHome ? m.away_team.goals! : m.home_team.goals!;
        played++;
        gf += my;
        ga += their;
        if (my > their) won++;
        else if (my < their) lost++;
        else drawn++;
      }
      return {
        ...standing,
        played,
        won,
        drawn,
        lost,
        goals_for: gf,
        goals_against: ga,
        goal_difference: gf - ga,
        points: won * 3 + drawn,
      };
    });

    teams.sort((a, b) =>
      b.points - a.points ||
      b.goal_difference - a.goal_difference ||
      b.goals_for - a.goals_for ||
      a.team.name.localeCompare(b.team.name)
    );
    return { ...g, teams };
  });
}

// Recomputes each team's last-5 form from merged completed matches.
export async function getMergedForm(): Promise<Record<string, mock.FormResult[]>> {
  const merged = await getMergedMatches();
  const completed = merged
    .filter((m) => m.status === 'completed' && m.home_team.goals !== null && m.away_team.goals !== null)
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

  const form: Record<string, mock.FormResult[]> = {};
  const push = (code: string, r: mock.FormResult) => {
    (form[code] ||= []).push(r);
  };
  for (const m of completed) {
    const hg = m.home_team.goals!;
    const ag = m.away_team.goals!;
    if (hg > ag) {
      push(m.home_team.code, 'W');
      push(m.away_team.code, 'L');
    } else if (hg < ag) {
      push(m.home_team.code, 'L');
      push(m.away_team.code, 'W');
    } else {
      push(m.home_team.code, 'D');
      push(m.away_team.code, 'D');
    }
  }
  for (const code of Object.keys(form)) form[code] = form[code].slice(-5);
  return form;
}

// ============================================================
//  Top Scorers — aggregated from FIFA per-match goal timelines.
//  The /timelines endpoint is CORS-open and exposes each goal
//  (Type 0 = "Goal!") with the scorer's IdPlayer + name. Finished
//  matches never change, so their goal lists are cached permanently;
//  only live matches are re-fetched on each call.
// ============================================================

// Goals (Type 0 "Goal!") and assists (Type 1 "Assist") both carry IdPlayer +
// a name in EventDescription, so a single timeline fetch yields both.
export interface Scorer {
  id: string;
  name: string;
  code: string;
  goals: number;
}

// Per-player tournament aggregate (goals + assists), used by the Stats
// leaderboards and the Followed-players screen.
export interface PlayerAgg {
  id: string;
  name: string;
  code: string;
  goals: number;
  assists: number;
}

interface FifaTimelineEvent {
  Type: number;
  IdPlayer: string | null;
  IdTeam: string | null;
  EventDescription?: { Locale: string; Description: string }[];
}

interface EventRec {
  id: string;
  name: string;
  code: string;
}

interface MatchStats {
  goals: EventRec[];
  assists: EventRec[];
}

const FIFA_GOAL_EVENT_TYPE = 0;
const FIFA_ASSIST_EVENT_TYPE = 1;
const finishedStatsCache = new Map<string, MatchStats>();

function timelineUrl(m: FifaMatch): string {
  return `https://api.fifa.com/api/v3/timelines/${m.IdCompetition}/${m.IdSeason}/${m.IdStage}/${m.IdMatch}?language=en`;
}

// "Julian QUINONES (Mexico) scores!!" -> "Julian QUINONES"
function parseScorerName(desc: string): string {
  const idx = desc.indexOf(' (');
  return (idx > 0 ? desc.slice(0, idx) : desc).trim();
}

// "Assisted by Erik LIRA." -> "Erik LIRA"
function parseAssistName(desc: string): string {
  return desc.replace(/^Assisted by\s*/i, '').replace(/\.\s*$/, '').trim();
}

function teamCodeFor(ev: FifaTimelineEvent, m: FifaMatch): string {
  return ev.IdTeam && m.Home?.IdTeam && ev.IdTeam === m.Home.IdTeam
    ? m.Home?.IdCountry || ''
    : m.Away?.IdCountry || '';
}

async function fetchMatchStats(m: FifaMatch): Promise<MatchStats> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(timelineUrl(m), { signal: controller.signal });
    if (!res.ok) return { goals: [], assists: [] };
    const json = await res.json();
    const events = (json?.Event as FifaTimelineEvent[]) || [];
    const goals: EventRec[] = [];
    const assists: EventRec[] = [];
    for (const e of events) {
      if (!e.IdPlayer) continue;
      const desc = e.EventDescription?.[0]?.Description || '';
      if (e.Type === FIFA_GOAL_EVENT_TYPE) {
        if (/own goal/i.test(desc)) continue; // own goals aren't credited to a scorer
        goals.push({ id: e.IdPlayer, name: parseScorerName(desc), code: teamCodeFor(e, m) });
      } else if (e.Type === FIFA_ASSIST_EVENT_TYPE) {
        assists.push({ id: e.IdPlayer, name: parseAssistName(desc), code: teamCodeFor(e, m) });
      }
    }
    return { goals, assists };
  } catch {
    return { goals: [], assists: [] };
  } finally {
    clearTimeout(timeout);
  }
}

async function inBatches<T>(items: T[], size: number, fn: (t: T) => Promise<void>): Promise<void> {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(fn));
  }
}

// Aggregates goals + assists per player across all finished/live matches.
// Finished-match timelines never change, so they are cached permanently;
// only live matches are re-fetched on each call.
export async function getPlayerStats(): Promise<PlayerAgg[]> {
  const matches = await fetchFifaMatches();
  const relevant = matches.filter(
    (m) =>
      (m.MatchStatus === 0 || m.MatchStatus === 3) &&
      m.Home?.IdTeam &&
      m.Away?.IdTeam &&
      m.IdMatch
  );

  const needFinished = relevant.filter(
    (m) => m.MatchStatus === 0 && !finishedStatsCache.has(m.IdMatch!)
  );
  await inBatches(needFinished, 8, async (m) => {
    finishedStatsCache.set(m.IdMatch!, await fetchMatchStats(m));
  });

  const liveStats = new Map<string, MatchStats>();
  const liveMatches = relevant.filter((m) => m.MatchStatus === 3);
  await inBatches(liveMatches, 8, async (m) => {
    liveStats.set(m.IdMatch!, await fetchMatchStats(m));
  });

  const byPlayer = new Map<string, PlayerAgg>();
  const ensure = (rec: EventRec): PlayerAgg => {
    let p = byPlayer.get(rec.id);
    if (!p) {
      p = { id: rec.id, name: rec.name, code: rec.code, goals: 0, assists: 0 };
      byPlayer.set(rec.id, p);
    }
    if (!p.code && rec.code) p.code = rec.code;
    if (!p.name && rec.name) p.name = rec.name;
    return p;
  };

  for (const m of relevant) {
    const s = m.MatchStatus === 0 ? finishedStatsCache.get(m.IdMatch!) : liveStats.get(m.IdMatch!);
    if (!s) continue;
    for (const g of s.goals) ensure(g).goals += 1;
    for (const a of s.assists) ensure(a).assists += 1;
  }

  return [...byPlayer.values()];
}

export async function getTopScorers(limit = 10): Promise<Scorer[]> {
  const players = await getPlayerStats();
  return players
    .filter((p) => p.goals > 0)
    .sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map((p) => ({ id: p.id, name: p.name, code: p.code, goals: p.goals }));
}
