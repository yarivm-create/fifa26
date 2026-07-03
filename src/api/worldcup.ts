import { Match, Group, GroupStanding } from './types';
import * as mock from './mockData';
import * as live from './liveData';
import { computeQualification, QualChance } from './qualification';
import { resolveFeederWinners } from '../utils/bracketOrder';

// Live scores are overlaid on the curated schedule from TheSportsDB (CORS-enabled, free).
// Every call falls back to mock data if the live fetch fails.

function getLocalDateString(date: Date): string {
  return date.toLocaleDateString('en-CA');
}

export async function fetchAllMatches(): Promise<Match[]> {
  try {
    const merged = await live.getMergedMatches();
    return resolveFeederWinners(merged).sort(
      (a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
    );
  } catch {
    return resolveFeederWinners(await mock.fetchAllMatches());
  }
}

// Synchronous, network-free view of the curated schedule (feeder slots resolved
// from bundled results), shaped exactly like fetchAllMatches' output. Used to
// seed the Live screen on a genuinely first-ever visit so it paints the fixture
// list instantly instead of a blocking spinner while the ~260KB FIFA calendar
// loads; live scores/status overlay a moment later when that fetch resolves.
export function getBaseSchedule(): Match[] {
  return resolveFeederWinners(mock.getBaseMatches());
}

export async function fetchCurrentMatches(): Promise<Match[]> {
  try {
    const merged = await live.getMergedMatches();
    return merged.filter((m) => m.status === 'in_progress' || m.status === 'half_time');
  } catch {
    return mock.fetchCurrentMatches();
  }
}

export async function fetchTodayMatches(): Promise<Match[]> {
  try {
    const merged = await live.getMergedMatches();
    const todayISR = getLocalDateString(new Date());
    return merged.filter(
      (m) => getLocalDateString(new Date(m.datetime)) === todayISR && m.status === 'completed'
    );
  } catch {
    return mock.fetchTodayMatches();
  }
}

export async function fetchYesterdayMatches(): Promise<Match[]> {
  try {
    const merged = await live.getMergedMatches();
    const yesterdayISR = getLocalDateString(new Date(Date.now() - 86400000));
    return merged.filter(
      (m) => getLocalDateString(new Date(m.datetime)) === yesterdayISR && m.status === 'completed'
    );
  } catch {
    return mock.fetchYesterdayMatches();
  }
}

export async function fetchGroups(): Promise<Group[]> {
  try {
    return await live.getMergedGroups();
  } catch {
    return mock.fetchGroups();
  }
}

export async function fetchForm(): Promise<Record<string, mock.FormResult[]>> {
  try {
    return await live.getMergedForm();
  } catch {
    return mock.computeForm();
  }
}

export async function fetchTopScorers(limit = 10): Promise<live.Scorer[]> {
  try {
    return await live.getTopScorers(limit);
  } catch {
    return [];
  }
}

export async function fetchPlayerStats(): Promise<live.PlayerAgg[]> {
  try {
    return await live.getPlayerStats();
  } catch {
    return [];
  }
}

export async function fetchQualification(): Promise<Record<string, QualChance>> {
  try {
    const [groups, matches] = await Promise.all([fetchGroups(), fetchAllMatches()]);
    return computeQualification(groups, matches);
  } catch {
    return {};
  }
}

export interface FavTeamInfo {
  code: string;
  name: string;
  group: string;
  position: number; // 0-based
  standing: GroupStanding;
}

export interface FavTeamsCore {
  teams: Record<string, FavTeamInfo>;
  matches: Match[];
  qual: Record<string, QualChance>;
  form: Record<string, mock.FormResult[]>;
}

// Composes everything the Favorites team grid needs to paint its cards from
// data that's already warmed on idle (groups/matches/qualification/form), so
// exposing it lets the app prime the 'favTeamsCore' cache key too — otherwise a
// genuinely first-ever Favorites open flashes a "Loading team details…" spinner
// even though all its inputs are cached. Shared with FavoriteTeams to avoid drift.
export async function fetchFavTeamsCore(): Promise<FavTeamsCore> {
  const [groups, matches, qual, form] = await Promise.all([
    fetchGroups(),
    fetchAllMatches(),
    fetchQualification(),
    fetchForm(),
  ]);
  const teams: Record<string, FavTeamInfo> = {};
  for (const g of groups) {
    g.teams.forEach((standing, position) => {
      teams[standing.team.code] = {
        code: standing.team.code,
        name: standing.team.name,
        group: g.letter,
        position,
        standing,
      };
    });
  }
  return { teams, matches, qual, form };
}
