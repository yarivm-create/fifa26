import { useState, useEffect, useCallback, useRef } from 'react';

export function useLiveData<T>(
  fetcher: () => Promise<T>,
  intervalMs: number = 30000
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const lastRunRef = useRef(0);

  const refresh = useCallback(async () => {
    lastRunRef.current = Date.now();
    try {
      const result = await fetcher();
      setData(result);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

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
