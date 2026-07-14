import { useEffect, useMemo, useRef, useState } from 'react';
import { Match } from '../api/types';
import { canEmitAlert, nextArmed } from '../hooks/useMatchAlerts';
import { LiveEvent, appendEvents, diffMatchEvents } from './matchTimeline';
import { useSelectedLiveMatch } from './useFollowedMatches';

// Orchestrates the Live Match Bar's state from data the app ALREADY polls.
//
// It takes the live-match list + lastUpdated straight from App's existing
// useLiveData('currentMatches', 15s) instance (passed down as props), so the bar
// adds ZERO extra network requests. It derives:
//   • the pinned/selected match + the switcher list,
//   • connection freshness (fresh vs. stale/reconnecting) from lastUpdated age,
//   • a per-match live event feed (goals, period transitions, shootout), and
//   • the exact events emitted THIS tick (for notifications / pulse / native).
//
// Event detection reuses useMatchAlerts' battle-tested "armed gate"
// (canEmitAlert / nextArmed) so a score that changed while the tab was
// backgrounded is re-baselined on return, never replayed as a fake live event —
// the same guarantee the goal-celebration overlay relies on.

const STALE_MS = 35000; // ~2 missed 15s polls => show "reconnecting / last updated"
const FEED_CAP = 20;
// How long a just-ended match keeps showing a FULL-TIME bar once nothing else is
// live, before the bar auto-dismisses. Sensible + easily tuned.
export const FULL_TIME_LINGER_MS = 120000;

export type ConnectionState = 'fresh' | 'stale';

export interface EmittedEvent {
  event: LiveEvent;
  match: Match;
}

export interface LiveBarModel {
  visible: boolean;
  live: Match[];
  shown: Match | null;
  extraCount: number;
  connection: ConnectionState;
  lastUpdated: Date | null;
  isEnded: boolean; // shown match is a lingering full-time card
  feed: LiveEvent[]; // newest-first, for the shown match
  emitted: EmittedEvent[]; // events detected on the latest tick
  select: (id: number) => void;
  cycleNext: () => void;
}

function docHidden(): boolean {
  return typeof document !== 'undefined' && document.hidden;
}

interface Lingering {
  match: Match;
  at: number;
}

export function useLiveMatchBar(liveMatches: Match[] | null, lastUpdated: Date | null): LiveBarModel {
  const { selectedId, setSelected } = useSelectedLiveMatch();
  const lastUpdatedMs = lastUpdated?.getTime() ?? null;

  const [feeds, setFeeds] = useState<Map<number, LiveEvent[]>>(() => new Map());
  const [emitted, setEmitted] = useState<EmittedEvent[]>([]);
  const [lingering, setLingering] = useState<Lingering | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const prevMap = useRef<Map<number, Match> | null>(null);
  const armed = useRef(false);
  const lastFetchAt = useRef<number | null>(null);
  const lastUpdateAt = useRef(0);

  // Disarm on any return-to-foreground so the cache→network catch-up that
  // follows is re-baselined, never replayed (mirrors useLiveData's refetch
  // triggers and useMatchAlerts' own disarm).
  useEffect(() => {
    const disarm = () => {
      if (document.visibilityState === 'hidden') return;
      armed.current = false;
    };
    const disarmPageShow = () => {
      armed.current = false;
    };
    document.addEventListener('visibilitychange', disarm);
    window.addEventListener('focus', disarm);
    window.addEventListener('online', disarm);
    window.addEventListener('pageshow', disarmPageShow);
    return () => {
      document.removeEventListener('visibilitychange', disarm);
      window.removeEventListener('focus', disarm);
      window.removeEventListener('online', disarm);
      window.removeEventListener('pageshow', disarmPageShow);
    };
  }, []);

  // A light clock so "last updated" / staleness / linger-expiry recompute
  // without a per-second render.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 5000);
    return () => window.clearInterval(id);
  }, []);

  // Core detection: diff each poll against the previous baseline under the armed
  // gate, feed the per-match event list, and surface this tick's events.
  useEffect(() => {
    const list = liveMatches ?? [];
    const nowMs = Date.now();
    const gap = nowMs - lastUpdateAt.current;
    lastUpdateAt.current = nowMs;
    const fresh = lastUpdatedMs != null && lastUpdatedMs !== lastFetchAt.current;
    if (lastUpdatedMs != null) lastFetchAt.current = lastUpdatedMs;
    const hidden = docHidden();
    const nextMap = new Map(list.map((m) => [m.id, m]));

    const canEmit = canEmitAlert({
      hidden,
      gapMs: gap,
      armed: armed.current,
      hasBaseline: prevMap.current !== null,
    });

    if (!canEmit) {
      armed.current = nextArmed(armed.current, fresh, hidden);
      prevMap.current = nextMap;
      if (list.length > 0) setLingering(null);
      setEmitted((prev) => (prev.length === 0 ? prev : []));
      return;
    }

    const out: EmittedEvent[] = [];
    for (const m of list) {
      for (const ev of diffMatchEvents(prevMap.current?.get(m.id), m)) {
        out.push({ event: ev, match: m });
      }
    }
    // A live match that vanished from the poll has ended (currentMatches only
    // returns in-progress games). Synthesize a full-time event from its last
    // seen snapshot and, if nothing else is live, linger on it briefly.
    let endedSnapshot: Match | null = null;
    if (prevMap.current) {
      for (const [id, prevM] of prevMap.current) {
        if (!nextMap.has(id) && (prevM.status === 'in_progress' || prevM.status === 'half_time')) {
          const ended: Match = { ...prevM, status: 'completed' };
          out.push({
            event: {
              id: `${id}:fullTime:end`,
              matchId: id,
              type: 'fullTime',
              minute: '',
            },
            match: ended,
          });
          if (!endedSnapshot) endedSnapshot = ended;
        }
      }
    }

    if (out.length > 0) {
      setFeeds((prev) => {
        const next = new Map(prev);
        for (const { event } of out) {
          next.set(event.matchId, appendEvents(next.get(event.matchId) ?? [], [event], FEED_CAP));
        }
        return next;
      });
    }
    setEmitted(out);

    if (list.length > 0) {
      setLingering(null);
    } else if (endedSnapshot) {
      setLingering({ match: endedSnapshot, at: nowMs });
    }

    prevMap.current = nextMap;
  }, [liveMatches, lastUpdatedMs]);

  return useMemo<LiveBarModel>(() => {
    const live = liveMatches ?? [];
    const activeLingering = lingering && now - lingering.at < FULL_TIME_LINGER_MS ? lingering : null;
    const shown =
      live.length > 0 ? live.find((m) => m.id === selectedId) ?? live[0] : activeLingering?.match ?? null;
    const isEnded = live.length === 0 && !!activeLingering;
    const connection: ConnectionState =
      isEnded || (lastUpdatedMs != null && now - lastUpdatedMs < STALE_MS) ? 'fresh' : 'stale';
    const feed = shown ? [...(feeds.get(shown.id) ?? [])].reverse() : [];
    return {
      visible: live.length > 0 || isEnded,
      live,
      shown,
      extraCount: Math.max(0, live.length - 1),
      connection,
      lastUpdated,
      isEnded,
      feed,
      emitted,
      select: (id: number) => setSelected(id),
      cycleNext: () => {
        if (live.length < 2 || !shown) return;
        const idx = live.findIndex((m) => m.id === shown.id);
        const next = live[(idx + 1) % live.length];
        setSelected(next.id);
      },
    };
  }, [liveMatches, lingering, now, selectedId, feeds, emitted, lastUpdated, lastUpdatedMs, setSelected]);
}
