import { Match, Group } from './types';
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
