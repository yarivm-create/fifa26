import { Match, Group } from './types';
import * as mock from './mockData';

// TheSportsDB free, CORS-enabled API. League 4429 = FIFA World Cup.
const API_KEY = '3';
const LEAGUE_ID = 4429;
const SEASON = '2026';
const BASE = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;

const ENDPOINTS = [
  `${BASE}/eventspastleague.php?id=${LEAGUE_ID}`, // recent + currently-live
  `${BASE}/eventsnextleague.php?id=${LEAGUE_ID}`, // upcoming
  `${BASE}/eventsseason.php?id=${LEAGUE_ID}&s=${SEASON}`, // whatever full-season data exists
];

interface SdbEvent {
  idEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strStatus: string | null;
  strProgress: string | null;
}

// Normalizes a team name to a key, then maps to the FIFA 3-letter code used throughout the app.
const NAME_TO_CODE: Record<string, string> = {
  algeria: 'ALG',
  argentina: 'ARG',
  australia: 'AUS',
  austria: 'AUT',
  belgium: 'BEL',
  bosniaherzegovina: 'BIH',
  bosniaandherzegovina: 'BIH',
  brazil: 'BRA',
  canada: 'CAN',
  cotedivoire: 'CIV',
  ivorycoast: 'CIV',
  congodr: 'COD',
  drcongo: 'COD',
  democraticrepublicofcongo: 'COD',
  colombia: 'COL',
  caboverde: 'CPV',
  capeverde: 'CPV',
  croatia: 'CRO',
  curacao: 'CUW',
  czechrepublic: 'CZE',
  czechia: 'CZE',
  ecuador: 'ECU',
  egypt: 'EGY',
  england: 'ENG',
  spain: 'ESP',
  france: 'FRA',
  germany: 'GER',
  ghana: 'GHA',
  haiti: 'HAI',
  iran: 'IRN',
  iriran: 'IRN',
  iraq: 'IRQ',
  jordan: 'JOR',
  japan: 'JPN',
  southkorea: 'KOR',
  korearepublic: 'KOR',
  saudiarabia: 'KSA',
  morocco: 'MAR',
  mexico: 'MEX',
  netherlands: 'NED',
  norway: 'NOR',
  newzealand: 'NZL',
  panama: 'PAN',
  paraguay: 'PAR',
  portugal: 'POR',
  qatar: 'QAT',
  southafrica: 'RSA',
  scotland: 'SCO',
  senegal: 'SEN',
  switzerland: 'SUI',
  sweden: 'SWE',
  tunisia: 'TUN',
  turkiye: 'TUR',
  turkey: 'TUR',
  uruguay: 'URU',
  unitedstates: 'USA',
  usa: 'USA',
  uzbekistan: 'UZB',
};

function codeFromName(name: string): string | null {
  const key = name.toLowerCase().replace(/[^a-z]/g, '');
  return NAME_TO_CODE[key] ?? null;
}

type LiveStatus = { status: Match['status']; time?: string };

function mapStatus(raw: string | null, progress: string | null): LiveStatus | null {
  const s = (raw || '').trim();
  if (!s) return null;
  const upper = s.toUpperCase();

  if (['FT', 'AET', 'AP', 'PEN', 'MATCH FINISHED', 'FINISHED'].includes(upper)) {
    return { status: 'completed' };
  }
  if (['NS', 'NOT STARTED', 'TBD', 'PPD', 'POSTPONED', 'CANC', 'CANCELLED'].includes(upper)) {
    return null; // keep scheduled mock state
  }
  if (upper === 'HT' || upper === 'HALF TIME') {
    return { status: 'half_time', time: 'HT' };
  }
  if (upper === '1H' || upper === '1ST HALF') {
    return { status: 'in_progress', time: progress ? `${progress}'` : '1st Half' };
  }
  if (upper === '2H' || upper === '2ND HALF') {
    return { status: 'in_progress', time: progress ? `${progress}'` : '2nd Half' };
  }
  if (['ET', 'BT', 'P', 'EXTRA TIME', 'BREAK TIME', 'PENALTIES', 'LIVE'].includes(upper)) {
    return { status: 'in_progress', time: s };
  }
  // Numeric minute (e.g. "63") => live.
  if (/^\d{1,3}\+?\d*$/.test(s)) {
    return { status: 'in_progress', time: `${s}'` };
  }
  return null;
}

async function fetchEndpoint(url: string): Promise<SdbEvent[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return [];
    const json = await res.json();
    return (json?.events as SdbEvent[]) || [];
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

// Builds a lookup of live events keyed by "HOMECODE_AWAYCODE".
async function fetchLiveMap(): Promise<Record<string, SdbEvent>> {
  const results = await Promise.allSettled(ENDPOINTS.map(fetchEndpoint));
  const map: Record<string, SdbEvent> = {};
  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    for (const ev of r.value) {
      const hc = codeFromName(ev.strHomeTeam);
      const ac = codeFromName(ev.strAwayTeam);
      if (!hc || !ac) continue;
      map[`${hc}_${ac}`] = ev;
    }
  }
  return map;
}

let cache: { at: number; map: Record<string, SdbEvent> } | null = null;
const CACHE_TTL_MS = 25000;

async function getLiveMap(): Promise<Record<string, SdbEvent>> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) return cache.map;
  const map = await fetchLiveMap();
  // Only replace cache if we actually got data; otherwise keep prior cache.
  if (Object.keys(map).length > 0 || !cache) {
    cache = { at: now, map };
  }
  return cache.map;
}

function applyOverlay(base: Match, ev: SdbEvent, swap: boolean): Match {
  const mapped = mapStatus(ev.strStatus, ev.strProgress);
  if (!mapped) return base;

  const rawHome = ev.intHomeScore !== null ? parseInt(ev.intHomeScore, 10) : null;
  const rawAway = ev.intAwayScore !== null ? parseInt(ev.intAwayScore, 10) : null;
  const homeGoals = swap ? rawAway : rawHome;
  const awayGoals = swap ? rawHome : rawAway;

  return {
    ...base,
    status: mapped.status,
    time: mapped.time,
    home_team: { ...base.home_team, goals: Number.isNaN(homeGoals as number) ? base.home_team.goals : homeGoals },
    away_team: { ...base.away_team, goals: Number.isNaN(awayGoals as number) ? base.away_team.goals : awayGoals },
  };
}

// Returns the full mock schedule with live scores/status overlaid from the API.
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
