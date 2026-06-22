import { Match, Group } from './types';
import * as mock from './mockData';

// Skip live API for now — external APIs are unreliable/down
// When a stable API becomes available, set FORCE_LIVE = true and configure BASE_URL
const FORCE_LIVE = false;
const BASE_URL = '/api';

async function fetchWithFallback<T>(
  liveUrl: string,
  mockFn: () => Promise<T>
): Promise<T> {
  if (!FORCE_LIVE) {
    return mockFn();
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(liveUrl, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) return res.json();
  } catch {
    // API unavailable — use mock data
  }
  return mockFn();
}

export async function fetchCurrentMatches(): Promise<Match[]> {
  return fetchWithFallback(`${BASE_URL}/matches/current`, mock.fetchCurrentMatches);
}

export async function fetchTodayMatches(): Promise<Match[]> {
  return fetchWithFallback(`${BASE_URL}/matches/today`, mock.fetchTodayMatches);
}

export async function fetchAllMatches(): Promise<Match[]> {
  return fetchWithFallback(`${BASE_URL}/matches`, mock.fetchAllMatches);
}

export async function fetchGroups(): Promise<Group[]> {
  return fetchWithFallback(`${BASE_URL}/teams`, mock.fetchGroups);
}

export async function fetchYesterdayMatches(): Promise<Match[]> {
  return mock.fetchYesterdayMatches();
}

export async function fetchForm(): Promise<Record<string, mock.FormResult[]>> {
  return mock.computeForm();
}
