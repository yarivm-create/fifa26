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

export interface FifaMatch {
  IdCompetition?: string;
  IdSeason?: string;
  IdStage?: string;
  IdMatch?: string;
  Home: FifaTeam | null;
  Away: FifaTeam | null;
  PlaceHolderA?: string | null; // knockout slot label for Home (e.g. "2A", "W73")
  PlaceHolderB?: string | null; // knockout slot label for Away
  HomeTeamScore: number | null;
  AwayTeamScore: number | null;
  HomeTeamPenaltyScore?: number | null; // shootout score for Home (knockouts)
  AwayTeamPenaltyScore?: number | null; // shootout score for Away (knockouts)
  ResultType?: number | null; // 1 = decided in regulation, 2 = penalty shootout, 3 = extra time
  MatchStatus: number; // 0 = finished, 1 = upcoming, 3 = live
  MatchTime: string | null; // e.g. "72'", "45'+2", "HT"
  Period?: number | null; // FIFA period (reverse-engineered from live 2026 data): 3 = 1st half, 4 = half-time, 5 = 2nd half, 7 = ET 1st half, 8 = ET half-time, 9 = ET 2nd half, 10 = ended after ET, 11 = penalty shootout, 16 = ET ended (penalties next). The end-of-regulation gap before ET is still unconfirmed — see recordLivePhaseDiagnostic.
}

// True when FIFA has recorded a penalty-shootout score for the match.
function hasPenalties(ev: FifaMatch): boolean {
  return ev.HomeTeamPenaltyScore != null && ev.AwayTeamPenaltyScore != null;
}

type LiveStatus = { status: Match['status']; time?: string };

// FIFA MatchStatus: 0 finished, 1 not started, 3 live. Anything else (postponed,
// abandoned, etc.) leaves the mock scheduled state untouched.
export function mapStatus(ev: FifaMatch): LiveStatus | null {
  switch (ev.MatchStatus) {
    case 0:
      return { status: 'completed' }; // no live minute for finished games
    case 3: {
      // A live knockout in its penalty shootout: surface "PEN" so the card
      // shows it's gone to spot-kicks (Period 11 is the shootout, but FIFA can
      // lag it, so the presence of a shootout score is the reliable signal).
      if (ev.Period === 11 || hasPenalties(ev)) {
        return { status: 'in_progress', time: 'PEN' };
      }
      // FIFA Period 16 = extra time has ENDED with the score level, so a penalty
      // shootout is imminent. During this gap before the first kick, tell the
      // user penalties are next instead of a bare "LIVE".
      if (ev.Period === 16) {
        return { status: 'half_time', time: 'PRE_PEN' };
      }
      // FIFA's calendar feed leaves MatchTime empty at the interval, so the
      // authoritative half-time signal is the Period. Period 4 is the
      // regulation half-time break.
      if (ev.Period === 4) {
        return { status: 'half_time', time: 'HT' };
      }
      // Period 8 is the half-time break BETWEEN the two extra-time periods —
      // it is a pause, but it happens during extra time, so it must read as
      // extra time, not a plain half-time.
      if (ev.Period === 8) {
        return { status: 'half_time', time: 'ET HT' };
      }
      const mt = (ev.MatchTime || '').trim();
      // Extra time in play: Period 7 (first ET half) or 9 (second ET half).
      // The match is being played past 90', so surface the running minute
      // flagged as extra time (e.g. "ET 95'") rather than a half-time break.
      if (ev.Period === 7 || ev.Period === 9) {
        return { status: 'in_progress', time: mt ? `ET ${mt}` : 'ET' };
      }
      const upper = mt.toUpperCase();
      if (upper === 'HT' || upper.includes('HALF')) {
        return { status: 'half_time', time: 'HT' };
      }
      // Safety net: a minute whose leading number is past 90' only happens in
      // extra time, so flag it as ET even when the live Period lookup lags or
      // reports a transitional value (this also covers ET stoppage like
      // "120'+2'", which carries a "+").
      const etMinute = /^(\d+)/.exec(mt);
      if (etMinute && Number(etMinute[1]) > 90) {
        return { status: 'in_progress', time: `ET ${mt}` };
      }
      // End of regulation (or an ET boundary) with the score level and no
      // running minute: a live match only stays level past the second half in a
      // knockout headed to extra time. Regulation half-time (Period 4) and the
      // ET breaks (8 / 16) are already handled above, and FIFA drops MatchTime
      // at these boundaries while the live Period can lag before ET kicks off,
      // so surface EXTRA TIME instead of a bare LIVE. Requiring the live-endpoint
      // Period >= 5 (at/after the second half) rules out a 0-0 at kickoff, and a
      // failed live fetch leaves Period null so this never fires on stale data.
      const scoreLevel =
        ev.HomeTeamScore != null && ev.HomeTeamScore === ev.AwayTeamScore;
      if (!mt && scoreLevel && ev.Period != null && ev.Period >= 5) {
        return { status: 'in_progress', time: 'ET' };
      }
      // FIFA already formats the minute (e.g. "72'"); show it verbatim.
      return { status: 'in_progress', time: mt || undefined };
    }
    default:
      return null; // upcoming / unknown -> keep verified mock schedule
  }
}

let fifaMatchesCache: { at: number; data: FifaMatch[] } | null = null;
// Coalesces concurrent callers onto one network request. Without this the many
// fetchers that fire on first load (App pollers, Live/Bracket/Schedule tabs, the
// idle warm-up for groups/form/qualification/stats) each miss the still-empty
// time cache and start their own 260KB calendar fetch — a thundering herd.
let fifaMatchesInFlight: Promise<FifaMatch[]> | null = null;
const FIFA_MATCHES_TTL_MS = 15000;

async function fetchFifaMatches(): Promise<FifaMatch[]> {
  const now = Date.now();
  if (fifaMatchesCache && now - fifaMatchesCache.at < FIFA_MATCHES_TTL_MS) {
    return fifaMatchesCache.data;
  }
  if (fifaMatchesInFlight) return fifaMatchesInFlight;
  fifaMatchesInFlight = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const res = await fetch(FIFA_URL, { signal: controller.signal });
      if (!res.ok) return fifaMatchesCache?.data ?? [];
      const json = await res.json();
      const data = (json?.Results as FifaMatch[]) || [];
      if (data.length) fifaMatchesCache = { at: Date.now(), data };
      return data.length ? data : fifaMatchesCache?.data ?? [];
    } catch {
      return fifaMatchesCache?.data ?? [];
    } finally {
      clearTimeout(timeout);
      fifaMatchesInFlight = null;
    }
  })();
  return fifaMatchesInFlight;
}

// A knockout slot that has been filled with a real qualified team.
export interface ResolvedTeam {
  code: string;
  name: string;
}

function fifaTeamName(t: FifaTeam): string {
  return t.TeamName?.[0]?.Description || t.IdCountry || '';
}

// Codes that are still placeholders in the curated schedule (e.g. "2A", "1C",
// "W73", "3ABCDF"). Mirrors the bracket's own placeholder detection.
const PLACEHOLDER_CODE = /^(\d|W\d|RU\d|3[A-L]{2,})/;

interface LiveMaps {
  // FIFA matches keyed by "HOMECODE_AWAYCODE" (real country codes only).
  map: Record<string, FifaMatch>;
  // Knockout placeholder label (e.g. "2B", "W73") -> the real team now in it.
  resolve: Record<string, ResolvedTeam>;
}

// Builds the live lookup plus a resolution map that links knockout placeholder
// labels to the real teams FIFA has slotted in once a group/match is decided.
async function fetchLiveMap(): Promise<LiveMaps> {
  const matches = await fetchFifaMatches();
  const map: Record<string, FifaMatch> = {};
  const resolve: Record<string, ResolvedTeam> = {};
  for (const ev of matches) {
    const hc = ev.Home?.IdCountry;
    const ac = ev.Away?.IdCountry;
    if (hc && ac) map[`${hc}_${ac}`] = ev;
    // Record resolved knockout slots so the bracket can show real teams.
    if (ev.PlaceHolderA && ev.Home?.IdCountry) {
      resolve[ev.PlaceHolderA] = { code: ev.Home.IdCountry, name: fifaTeamName(ev.Home) };
    }
    if (ev.PlaceHolderB && ev.Away?.IdCountry) {
      resolve[ev.PlaceHolderB] = { code: ev.Away.IdCountry, name: fifaTeamName(ev.Away) };
    }
  }
  return { map, resolve };
}

let cache: { at: number; maps: LiveMaps } | null = null;
let liveMapInFlight: Promise<LiveMaps> | null = null;
const CACHE_TTL_MS = 12000;

async function getLiveMap(): Promise<LiveMaps> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) return cache.maps;
  if (liveMapInFlight) return liveMapInFlight;
  liveMapInFlight = (async () => {
    try {
      const maps = await fetchLiveMap();
      // Only replace cache if we actually got data; otherwise keep prior cache.
      if (Object.keys(maps.map).length > 0 || !cache) {
        await enrichLivePeriods(maps.map);
        cache = { at: Date.now(), maps };
      }
      return cache!.maps;
    } finally {
      liveMapInFlight = null;
    }
  })();
  return liveMapInFlight;
}

// The calendar feed omits Period/MatchTime for in-play games, so enrich each
// live (MatchStatus 3) match from FIFA's live endpoint to learn whether it is
// at half-time and the current minute. Only a handful of games are ever live,
// and failures degrade gracefully (the match simply shows "LIVE").
async function enrichLivePeriods(map: Record<string, FifaMatch>): Promise<void> {
  const live = Object.values(map).filter(
    (ev) => ev.MatchStatus === 3 && ev.IdCompetition && ev.IdSeason && ev.IdStage && ev.IdMatch
  );
  if (live.length === 0) return;
  await Promise.all(
    live.map(async (ev) => {
      const url = `https://api.fifa.com/api/v3/live/football/${ev.IdCompetition}/${ev.IdSeason}/${ev.IdStage}/${ev.IdMatch}?language=en`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) return;
        const d = await res.json();
        if (typeof d?.Period === 'number') ev.Period = d.Period;
        const liveTime = (d?.MatchTime || '').trim();
        if (liveTime) ev.MatchTime = liveTime;
      } catch {
        /* ignore — fall back to calendar data */
      } finally {
        clearTimeout(timeout);
      }
    })
  );
}

// ---------------------------------------------------------------------------
// Live-phase diagnostics
//
// FIFA's `Period` enum is undocumented; we reverse-engineered it from live
// matches (see FifaMatch.Period). One value is still unconfirmed: the brief gap
// after regulation ends in a level knockout, before the extra-time clock starts.
// To finally capture it — and to surface any other Period we have not yet named —
// record NOTABLE live states (an unknown Period, or a live match that fell
// through to a bare LIVE / heuristic EXTRA TIME with no authoritative minute) to
// the console and a small localStorage ring buffer. Inspect the buffer later by
// running `wcPhaseLog()` in the browser devtools console.
// ---------------------------------------------------------------------------
const KNOWN_LIVE_PERIODS = new Set([3, 4, 5, 7, 8, 9, 10, 11, 16]);
const PHASE_LOG_KEY = 'wc2026:phaselog';
const PHASE_LOG_MAX = 40;
const lastPhaseSig = new Map<string, string>();

export function recordLivePhaseDiagnostic(ev: FifaMatch, mapped: LiveStatus): void {
  const period = ev.Period ?? null;
  const minute = (ev.MatchTime || '').trim();
  const unknownPeriod = period != null && !KNOWN_LIVE_PERIODS.has(period);
  // A live match with no authoritative minute is a break/transition — this is
  // exactly the ET gap we still cannot name from Period alone, plus any future
  // boundary FIFA emits without a clock.
  const bareLive = mapped.status === 'in_progress' && !minute;
  if (!unknownPeriod && !bareLive) return;

  // De-dupe per match on (period, minute, status, label): a multi-minute gap
  // then logs once per distinct reading instead of on every poll (~every 12s).
  const id = ev.IdMatch ?? '';
  const sig = `${period}|${minute}|${ev.MatchStatus}|${mapped.time ?? ''}`;
  if (lastPhaseSig.get(id) === sig) return;
  lastPhaseSig.set(id, sig);

  const entry = {
    at: new Date().toISOString(),
    match: id,
    period,
    matchTime: ev.MatchTime ?? null,
    matchStatus: ev.MatchStatus,
    resultType: ev.ResultType ?? null,
    score: `${ev.HomeTeamScore ?? '?'}-${ev.AwayTeamScore ?? '?'}`,
    mapped: mapped.time ?? mapped.status,
    reason: unknownPeriod ? 'unknown-period' : 'no-minute',
  };
  console.warn('[fifa-phase] notable live state — capture this Period:', entry);
  try {
    const raw = localStorage.getItem(PHASE_LOG_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown[]) : [];
    arr.push(entry);
    while (arr.length > PHASE_LOG_MAX) arr.shift();
    localStorage.setItem(PHASE_LOG_KEY, JSON.stringify(arr));
  } catch {
    /* storage unavailable / quota / private mode — the console.warn still fired */
  }
}

if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).wcPhaseLog = () => {
    try {
      return JSON.parse(localStorage.getItem(PHASE_LOG_KEY) || '[]');
    } catch {
      return [];
    }
  };
}

export function applyOverlay(base: Match, ev: FifaMatch, swap: boolean): Match {
  const mapped = mapStatus(ev);
  if (!mapped) return base;

  // Live matches only: capture any Period/label we can't yet name (see above).
  if (ev.MatchStatus === 3) recordLivePhaseDiagnostic(ev, mapped);

  const rawHome = ev.HomeTeamScore;
  const rawAway = ev.AwayTeamScore;
  const homeGoals = swap ? rawAway : rawHome;
  const awayGoals = swap ? rawHome : rawAway;

  const rawHomePen = ev.HomeTeamPenaltyScore;
  const rawAwayPen = ev.AwayTeamPenaltyScore;
  const homePen = swap ? rawAwayPen : rawHomePen;
  const awayPen = swap ? rawHomePen : rawAwayPen;

  // How a knockout was decided, per FIFA's ResultType (verified against live 2026
  // data): 1 = regulation, 2 = penalty shootout, 3 = extra time. Penalties always
  // follow extra time, so a shootout is labelled 'penalties'; a shootout score is
  // the most reliable signal and can arrive before ResultType flips to 2.
  const decidedBy: Match['decidedBy'] = hasPenalties(ev) || ev.ResultType === 2
    ? 'penalties'
    : ev.ResultType === 3
      ? 'extra_time'
      : undefined;

  return {
    ...base,
    status: mapped.status,
    time: mapped.time,
    decidedBy,
    home_team: { ...base.home_team, goals: homeGoals ?? base.home_team.goals, penalties: homePen ?? null },
    away_team: { ...base.away_team, goals: awayGoals ?? base.away_team.goals, penalties: awayPen ?? null },
  };
}

// Pure merge: overlays live FIFA scores/status onto the curated schedule and
// replaces knockout placeholder slots ("2A", "W73", …) with the real qualified
// teams once FIFA fills them in. Kept separate from the fetch so the resolution
// (e.g. "W75" -> Morocco) and the live overlay can be tested without network.
export function mergeMatches(
  base: Match[],
  liveMap: Record<string, FifaMatch>,
  resolve: Record<string, ResolvedTeam>,
): Match[] {
  const resolveTeam = (t: Match['home_team']): Match['home_team'] => {
    if (!PLACEHOLDER_CODE.test(t.code)) return t;
    const r = resolve[t.code];
    return r ? { ...t, code: r.code, name: r.name, country: r.name } : t;
  };

  return base.map((m) => {
    const home = resolveTeam(m.home_team);
    const away = resolveTeam(m.away_team);
    const resolved =
      home === m.home_team && away === m.away_team ? m : { ...m, home_team: home, away_team: away };

    const hc = resolved.home_team.code;
    const ac = resolved.away_team.code;
    let ev = liveMap[`${hc}_${ac}`];
    let swap = false;
    if (!ev) {
      ev = liveMap[`${ac}_${hc}`];
      swap = true;
    }
    return ev ? applyOverlay(resolved, ev, swap) : resolved;
  });
}

// Returns the full mock schedule with live scores/status overlaid from FIFA and
// knockout placeholder slots ("2A", "W73", …) replaced by the real qualified
// teams as soon as FIFA fills them in.
export async function getMergedMatches(): Promise<Match[]> {
  const base = await mock.fetchAllMatches();
  const { map: liveMap, resolve } = await getLiveMap();
  if (Object.keys(liveMap).length === 0 && Object.keys(resolve).length === 0) return base;
  return mergeMatches(base, liveMap, resolve);
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
    .filter((m) => m.stage_name.startsWith('Group') && m.status === 'completed' && m.home_team.goals !== null && m.away_team.goals !== null)
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
// leaderboards and the Followed-players screen. teamGames counts how many
// matches the player's team has played, and goalGames / assistGames count the
// DISTINCT matches in which the player scored / assisted, so the leaderboards
// can break ties in favour of the player who needed fewer games.
export interface PlayerAgg {
  id: string;
  name: string;
  code: string;
  goals: number;
  assists: number;
  goalGames: number;
  assistGames: number;
  teamGames: number;
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

// Parsed per-match scorers/assists plus `goalCount`: how many actual goal
// events the source carries (own goals included). The caller compares this
// against the final score to tell a COMPLETE source from one that is still
// missing goals — e.g. a freshly finished match whose timeline has published
// everything (kickoff, cards, subs) EXCEPT the goal events (see fetchMatchStats).
type ParsedStats = MatchStats & { goalCount: number };

// A per-match stats result plus where it came from. `provisional` is true when
// the goals came from a source that may still be incomplete (the live/match
// detail fallback, or a timeline shorter than the final score); such results
// are used for the current aggregation but NOT cached, so they refresh on the
// next pass until the authoritative timeline publishes every goal.
type StatsResult = MatchStats & { provisional: boolean };

const FIFA_GOAL_EVENT_TYPE = 0;
const FIFA_ASSIST_EVENT_TYPE = 1;
const finishedStatsCache = new Map<string, MatchStats>();

// Finished-match timelines never change once complete, so persist them to
// localStorage. This makes repeat visits load Stats/Favorites almost instantly
// instead of re-fetching 70+ timelines, and survives a page reload.
//
// The key is VERSION-STAMPED. Older builds could persist an incomplete result:
// a match that had just finished sometimes had a timeline with no goal events
// yet, which was cached as goalless and then trusted forever — permanently
// under-counting that scorer (e.g. Mbappe's R16 winner stuck at 6 instead of 7).
// Bumping the version invalidates every pre-fix entry so it is re-fetched with
// the goal-count cross-check + live fallback; legacy entries are removed on the
// first load. Results written now are complete by construction, because only
// non-provisional (timeline goalCount >= final score) stats are ever persisted.
const MSTATS_LS_PREFIX = 'wc2026:mstats:v2:';
const MSTATS_LS_LEGACY_PREFIX = 'wc2026:mstats:';
let finishedCacheHydrated = false;

function hydrateFinishedCache(): void {
  if (finishedCacheHydrated || typeof localStorage === 'undefined') return;
  finishedCacheHydrated = true;
  try {
    const legacyKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith(MSTATS_LS_PREFIX)) {
        const id = k.slice(MSTATS_LS_PREFIX.length);
        if (finishedStatsCache.has(id)) continue;
        const v = JSON.parse(localStorage.getItem(k) || 'null');
        if (v && Array.isArray(v.goals) && Array.isArray(v.assists)) {
          finishedStatsCache.set(id, v);
        }
      } else if (k.startsWith(MSTATS_LS_LEGACY_PREFIX)) {
        // Pre-version entry (may be an incomplete goalless cache) — drop it so
        // the match is re-fetched under the fixed logic.
        legacyKeys.push(k);
      }
    }
    for (const k of legacyKeys) localStorage.removeItem(k);
  } catch {
    /* ignore corrupt/unavailable storage */
  }
}

function persistFinished(id: string, s: MatchStats): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(MSTATS_LS_PREFIX + id, JSON.stringify(s));
  } catch {
    /* quota or unavailable — in-memory cache still applies */
  }
}

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

// Reads scorers/assists from the authoritative per-match timeline. Returns null
// when the fetch fails, times out, or the timeline is still empty, so the caller
// can retry (and fall back to the live endpoint) rather than caching a goal-less
// result. `goalCount` reports how many goal events the timeline actually carries
// (own goals included), which the caller compares against the final score to
// detect a timeline that has published everything EXCEPT the goals.
async function fetchTimelineStats(m: FifaMatch): Promise<ParsedStats | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const res = await fetch(timelineUrl(m), { signal: controller.signal });
    if (!res.ok) return null;
    const json = await res.json();
    const events = (json?.Event as FifaTimelineEvent[]) || [];
    // A real finished/live match always has timeline events (kickoff, etc.).
    // An empty array means an incomplete/placeholder response — treat it as a
    // failure so we retry rather than caching a goal-less result.
    if (events.length === 0) return null;
    const goals: EventRec[] = [];
    const assists: EventRec[] = [];
    let goalCount = 0;
    for (const e of events) {
      const desc = e.EventDescription?.[0]?.Description || '';
      if (e.Type === FIFA_GOAL_EVENT_TYPE) {
        goalCount += 1; // counts own goals too — they change the scoreline
        if (!e.IdPlayer) continue;
        if (/own goal/i.test(desc)) continue; // own goals aren't credited to a scorer
        goals.push({ id: e.IdPlayer, name: parseScorerName(desc), code: teamCodeFor(e, m) });
      } else if (e.Type === FIFA_ASSIST_EVENT_TYPE) {
        if (!e.IdPlayer) continue;
        assists.push({ id: e.IdPlayer, name: parseAssistName(desc), code: teamCodeFor(e, m) });
      }
    }
    return { goals, assists, goalCount };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Minimal shape of FIFA's live/match-detail payload we rely on for the scorer
// fallback. Each team carries its match goals and its squad (used to resolve
// player names and to tell a real scorer from an own-goal by roster membership).
export interface FifaLiveGoal {
  IdPlayer?: string | null;
  IdAssistPlayer?: string | null;
  Period?: number | null;
}
export interface FifaLivePlayer {
  IdPlayer?: string | null;
  PlayerName?: { Description: string }[];
  ShortName?: { Description: string }[];
}
export interface FifaLiveTeam {
  Goals?: FifaLiveGoal[] | null;
  Players?: FifaLivePlayer[] | null;
}

function liveDetailUrl(m: FifaMatch): string {
  return `https://api.fifa.com/api/v3/live/football/${m.IdCompetition}/${m.IdSeason}/${m.IdStage}/${m.IdMatch}?language=en`;
}

function rosterName(p: FifaLivePlayer): string {
  return (p.PlayerName?.[0]?.Description || p.ShortName?.[0]?.Description || '').trim();
}

// Pure extraction of scorers/assists from a live/match-detail payload, split out
// from the fetch so it can be unit-tested without the network. Own goals (the
// scorer is in the OPPONENT roster) are skipped and penalty-shootout kicks
// (Period 11) are ignored, mirroring the timeline path; player names are
// resolved from the two squad rosters.
export function parseLiveGoals(
  home: FifaLiveTeam | null,
  away: FifaLiveTeam | null,
  homeCode: string,
  awayCode: string
): ParsedStats {
  const nameById = new Map<string, string>();
  const rosterIds = (t: FifaLiveTeam | null): Set<string> => {
    const ids = new Set<string>();
    for (const p of t?.Players || []) {
      if (!p.IdPlayer) continue;
      ids.add(p.IdPlayer);
      const nm = rosterName(p);
      if (nm) nameById.set(p.IdPlayer, nm);
    }
    return ids;
  };
  const homeIds = rosterIds(home);
  const awayIds = rosterIds(away);

  const goals: EventRec[] = [];
  const assists: EventRec[] = [];
  let goalCount = 0;
  const collect = (team: FifaLiveTeam | null, code: string, ownIds: Set<string>, oppIds: Set<string>) => {
    for (const g of team?.Goals || []) {
      if (!g.IdPlayer) continue;
      if (g.Period === 11) continue; // penalty-shootout kick, not a match goal
      goalCount += 1; // counts own goals too — they change the scoreline
      // Own goal: credited to this team but scored by an opponent — skip the
      // scorer credit, just like the timeline path does.
      if (oppIds.has(g.IdPlayer) && !ownIds.has(g.IdPlayer)) continue;
      goals.push({ id: g.IdPlayer, name: nameById.get(g.IdPlayer) || '', code });
      if (g.IdAssistPlayer && ownIds.has(g.IdAssistPlayer)) {
        assists.push({ id: g.IdAssistPlayer, name: nameById.get(g.IdAssistPlayer) || '', code });
      }
    }
  };
  collect(home, homeCode, homeIds, awayIds);
  collect(away, awayCode, awayIds, homeIds);
  return { goals, assists, goalCount };
}

// Scorer source used when the per-match timeline is missing goals. FIFA
// publishes the final score to the calendar and the goals to this
// live/match-detail endpoint immediately, but the detailed timeline can lag by
// hours for a freshly finished match (the timeline is present but carries no
// goal events yet) — so a player's just-scored goal (e.g. a knockout winner)
// would otherwise be dropped from Stats until the timeline catches up.
async function fetchLiveStats(m: FifaMatch): Promise<ParsedStats | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const res = await fetch(liveDetailUrl(m), { signal: controller.signal });
    if (!res.ok) return null;
    const json = await res.json();
    const home = (json?.HomeTeam as FifaLiveTeam) || null;
    const away = (json?.AwayTeam as FifaLiveTeam) || null;
    if (!home && !away) return null;
    return parseLiveGoals(home, away, m.Home?.IdCountry || '', m.Away?.IdCountry || '');
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Per-match scorers/assists. The authoritative source is the timeline, but a
// freshly finished match often has a timeline that lists everything EXCEPT its
// goal events, which would silently drop a just-scored goal. So we compare the
// timeline's goal count against the match's final score and, when the timeline
// is short (or missing), fall back to the live/match-detail endpoint, which
// carries the goals immediately. Anything not backed by a complete timeline is
// flagged `provisional` so the caller refreshes it (instead of caching it) until
// the timeline publishes every goal.
async function fetchMatchStats(m: FifaMatch): Promise<StatsResult | null> {
  const expectedGoals = (m.HomeTeamScore ?? 0) + (m.AwayTeamScore ?? 0);
  const timeline = await fetchTimelineStats(m);
  if (timeline && timeline.goalCount >= expectedGoals) {
    return { goals: timeline.goals, assists: timeline.assists, provisional: false };
  }
  // Timeline is missing or has fewer goals than the final score — fill the
  // scorers from the live endpoint if it is at least as complete.
  const live = await fetchLiveStats(m);
  if (live && live.goalCount >= (timeline?.goalCount ?? 0)) {
    return { goals: live.goals, assists: live.assists, provisional: true };
  }
  // Live didn't help; use the (still incomplete) timeline if we have one, kept
  // provisional so it is retried rather than cached until it fills in.
  if (timeline) {
    return { goals: timeline.goals, assists: timeline.assists, provisional: true };
  }
  return null;
}

async function inBatches<T>(items: T[], size: number, fn: (t: T) => Promise<void>): Promise<void> {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(fn));
  }
}

// Aggregates goals + assists per player across all finished/live matches.
// Finished-match timelines never change, so they are cached (in memory and in
// localStorage); only live matches are re-fetched on each call. Failed/timed-out
// timeline fetches are NOT cached, so a transient error never permanently drops
// a player's goals — the match is simply retried on the next call.
async function computePlayerStats(): Promise<PlayerAgg[]> {
  hydrateFinishedCache();
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
  // Live-endpoint fallbacks are provisional (the timeline has not published
  // yet), so they are aggregated for this pass but NOT cached — the match stays
  // in needFinished and is retried until its authoritative timeline appears.
  const provisionalFinished = new Map<string, MatchStats>();
  await inBatches(needFinished, 12, async (m) => {
    const s = await fetchMatchStats(m);
    if (!s) return;
    const stats: MatchStats = { goals: s.goals, assists: s.assists };
    if (s.provisional) {
      provisionalFinished.set(m.IdMatch!, stats);
    } else {
      finishedStatsCache.set(m.IdMatch!, stats);
      persistFinished(m.IdMatch!, stats);
    }
  });

  const liveStats = new Map<string, MatchStats>();
  const liveMatches = relevant.filter((m) => m.MatchStatus === 3);
  await inBatches(liveMatches, 12, async (m) => {
    const s = await fetchMatchStats(m);
    if (s) liveStats.set(m.IdMatch!, { goals: s.goals, assists: s.assists });
  });

  const byPlayer = new Map<string, PlayerAgg>();
  // How many matches each team has played (kicked off or finished), keyed by the
  // same country code stored on each player. Used to break scorer/assist ties in
  // favour of the more efficient player — the one whose team played fewer games
  // for the same tally (e.g. Messi ahead of Mbappé on equal goals when Argentina
  // has played fewer matches than France).
  const teamGamesByCode = new Map<string, number>();
  for (const m of relevant) {
    for (const code of [m.Home?.IdCountry, m.Away?.IdCountry]) {
      if (code) teamGamesByCode.set(code, (teamGamesByCode.get(code) || 0) + 1);
    }
  }
  const ensure = (rec: EventRec): PlayerAgg => {
    let p = byPlayer.get(rec.id);
    if (!p) {
      p = { id: rec.id, name: rec.name, code: rec.code, goals: 0, assists: 0, goalGames: 0, assistGames: 0, teamGames: teamGamesByCode.get(rec.code) || 0 };
      byPlayer.set(rec.id, p);
    }
    if (!p.code && rec.code) p.code = rec.code;
    if (!p.name && rec.name) p.name = rec.name;
    if (!p.teamGames && rec.code) p.teamGames = teamGamesByCode.get(rec.code) || 0;
    return p;
  };

  for (const m of relevant) {
    const s = m.MatchStatus === 0
      ? finishedStatsCache.get(m.IdMatch!) ?? provisionalFinished.get(m.IdMatch!)
      : liveStats.get(m.IdMatch!);
    if (!s) continue;
    // Count each match once per player toward their goal/assist "games" so a
    // multi-goal game still counts as a single appearance for the tiebreaker.
    const scoredThisMatch = new Set<string>();
    const assistedThisMatch = new Set<string>();
    for (const g of s.goals) {
      const p = ensure(g);
      p.goals += 1;
      if (!scoredThisMatch.has(p.id)) { scoredThisMatch.add(p.id); p.goalGames += 1; }
    }
    for (const a of s.assists) {
      const p = ensure(a);
      p.assists += 1;
      if (!assistedThisMatch.has(p.id)) { assistedThisMatch.add(p.id); p.assistGames += 1; }
    }
  }

  return [...byPlayer.values()];
}

// Short-lived memo + in-flight dedupe so the Stats tab, the Favorites tab and
// any other consumer share a single aggregation pass instead of each kicking
// off their own batch of timeline fetches.
let playerStatsMemo: { at: number; data: PlayerAgg[] } | null = null;
let playerStatsInflight: Promise<PlayerAgg[]> | null = null;
const PLAYER_STATS_TTL_MS = 20000;

export async function getPlayerStats(): Promise<PlayerAgg[]> {
  const now = Date.now();
  if (playerStatsMemo && now - playerStatsMemo.at < PLAYER_STATS_TTL_MS) {
    return playerStatsMemo.data;
  }
  if (playerStatsInflight) return playerStatsInflight;
  playerStatsInflight = computePlayerStats()
    .then((data) => {
      playerStatsMemo = { at: Date.now(), data };
      return data;
    })
    .finally(() => {
      playerStatsInflight = null;
    });
  return playerStatsInflight;
}

export async function getTopScorers(limit = 10): Promise<Scorer[]> {
  const players = await getPlayerStats();
  return players
    .filter((p) => p.goals > 0)
    // Equal goals → fewer team games (more efficient scorer) ranks higher.
    .sort((a, b) => b.goals - a.goals || a.teamGames - b.teamGames || a.goalGames - b.goalGames || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map((p) => ({ id: p.id, name: p.name, code: p.code, goals: p.goals }));
}
