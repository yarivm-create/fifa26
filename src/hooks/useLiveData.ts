import { useState, useEffect, useCallback, useRef } from 'react';

// Process-wide "last good" snapshot per data key, so switching between tabs
// reuses data already fetched by another tab (or warmed on idle) instead of
// showing a loading spinner on every first visit.
//
// It is ALSO persisted to localStorage (stale-while-revalidate): on a page
// reload the in-memory map is empty, so without persistence every tab would
// re-fetch from the network and flash a "Loading…" spinner. Seeding from
// localStorage lets a refresh render the previous session's data instantly
// while a background refresh updates it. Genuinely first-ever visits (no stored
// data) still fetch fresh.
const lastGood = new Map<string, unknown>();
const PERSIST_PREFIX = 'wc2026:swr:';
// Don't seed from snapshots older than this — a live tournament changes, and we
// refresh in the background anyway, so very stale data should never paint.
const PERSIST_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function readCache<T>(key: string): T | null {
  if (lastGood.has(key)) return lastGood.get(key) as T;
  try {
    const raw = localStorage.getItem(PERSIST_PREFIX + key);
    if (raw) {
      const parsed = JSON.parse(raw) as { at: number; v: T };
      if (parsed && typeof parsed.at === 'number' && Date.now() - parsed.at < PERSIST_MAX_AGE_MS) {
        lastGood.set(key, parsed.v);
        return parsed.v;
      }
    }
  } catch {
    /* corrupt/unavailable storage — fall through to a network fetch */
  }
  return null;
}

function writeCache<T>(key: string, value: T): void {
  lastGood.set(key, value);
  try {
    localStorage.setItem(PERSIST_PREFIX + key, JSON.stringify({ at: Date.now(), v: value }));
  } catch {
    /* quota exceeded / private mode — the in-memory cache still works */
  }
}

// Warm a cache key ahead of time (e.g. on idle after first paint) so the tab
// that uses the same key renders instantly the first time it's opened.
export async function primeLiveData<T>(key: string, fetcher: () => Promise<T>): Promise<void> {
  try {
    writeCache(key, await fetcher());
  } catch {
    /* best-effort warm-up; the tab will fetch on mount if this fails */
  }
}

export function useLiveData<T>(
  fetcher: () => Promise<T>,
  intervalMs: number = 30000,
  cacheKey?: string,
  // A network-free, bundled fallback (e.g. the curated base schedule) shown ONLY
  // when there's no cached snapshot yet — i.e. a genuinely first-ever visit — so
  // the screen paints instantly instead of a spinner while the first fetch runs.
  // It is NOT written to the SWR cache (it's build-time data, not fresh), and the
  // first real fetch replaces it; lastUpdated stays null until then.
  fallbackSeed?: T
) {
  const cached = cacheKey ? readCache<T>(cacheKey) : null;
  const seed = cached ?? fallbackSeed ?? null;
  const [data, setData] = useState<T | null>(seed);
  const [loading, setLoading] = useState(seed === null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const lastRunRef = useRef(0);

  const refresh = useCallback(async () => {
    lastRunRef.current = Date.now();
    try {
      const result = await fetcher();
      setData(result);
      if (cacheKey) writeCache(cacheKey, result);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [fetcher, cacheKey]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, intervalMs);

    // Browsers throttle or suspend timers on backgrounded / idle tabs, so when
    // a user returns to the page (or wakes the device) after a while the data
    // can be stale until the next slow tick. Refetch immediately when the tab
    // becomes visible or regains focus, so every screen is up to date the
    // moment it's looked at — no manual pull-to-refresh needed. A short guard
    // avoids hammering the API on rapid focus/blur toggling.
    const refreshOnReturn = () => {
      if (document.visibilityState === 'hidden') return;
      if (Date.now() - lastRunRef.current < 5000) return;
      refresh();
    };
    // Mobile app-switching and back/forward navigation often restore the page
    // from the bfcache (frozen) WITHOUT firing visibilitychange or focus, so a
    // dedicated pageshow handler is what actually catches "returned from
    // background". A persisted restore is always stale, so refresh regardless
    // of the short guard.
    const refreshOnPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        refresh();
      } else {
        refreshOnReturn();
      }
    };
    document.addEventListener('visibilitychange', refreshOnReturn);
    window.addEventListener('focus', refreshOnReturn);
    window.addEventListener('online', refreshOnReturn);
    window.addEventListener('pageshow', refreshOnPageShow);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshOnReturn);
      window.removeEventListener('focus', refreshOnReturn);
      window.removeEventListener('online', refreshOnReturn);
      window.removeEventListener('pageshow', refreshOnPageShow);
    };
  }, [refresh, intervalMs]);

  return { data, loading, error, lastUpdated, refresh };
}
