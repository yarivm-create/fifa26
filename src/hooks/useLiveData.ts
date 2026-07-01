import { useState, useEffect, useCallback, useRef } from 'react';

// Process-wide "last good" snapshot per data key, so switching between tabs
// reuses data already fetched by another tab (or warmed on idle) instead of
// showing a loading spinner on every first visit. It's a plain in-memory cache
// (cleared on reload); each mounted tab still refreshes in the background.
const lastGood = new Map<string, unknown>();

// Warm a cache key ahead of time (e.g. on idle after first paint) so the tab
// that uses the same key renders instantly the first time it's opened.
export async function primeLiveData<T>(key: string, fetcher: () => Promise<T>): Promise<void> {
  try {
    lastGood.set(key, await fetcher());
  } catch {
    /* best-effort warm-up; the tab will fetch on mount if this fails */
  }
}

export function useLiveData<T>(
  fetcher: () => Promise<T>,
  intervalMs: number = 30000,
  cacheKey?: string
) {
  const seed = cacheKey && lastGood.has(cacheKey) ? (lastGood.get(cacheKey) as T) : null;
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
      if (cacheKey) lastGood.set(cacheKey, result);
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
