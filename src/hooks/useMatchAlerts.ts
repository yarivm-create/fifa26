import { useEffect, useRef, useState } from 'react';
import { Match } from '../api/types';
import { getMatchResult } from '../utils/matchResult';

// Detects two live events from polled match data:
//  - a goal: a live match's total score increases between polls
//  - a match end: a match transitions from live -> completed
// A goal returns an incrementing key the UI uses to (re)trigger an overlay.
// Match ends return a batch of rich events (one per game) so the UI can show a
// distinct full-time celebration for EVERY game that just ended in the same
// poll — not only the first — including who won and the final score.

export interface GoalEvent {
  key: number; // incrementing, used to (re)trigger the overlay
  matchId: number;
  scorerName: string; // team that just scored
  scorerCode: string;
  homeName: string;
  homeCode: string;
  homeGoals: number;
  awayName: string;
  awayCode: string;
  awayGoals: number;
}

export interface MatchEndEvent {
  key: number; // globally unique, stable per detected end
  matchId: number;
  stage: string;
  homeName: string;
  homeCode: string;
  homeGoals: number;
  awayName: string;
  awayCode: string;
  awayGoals: number;
  winner: 'home' | 'away' | 'draw';
  // Knockout shootout / extra-time context so the full-time toast names the real
  // winner (a penalty win is level on goals) and shows the shootout score.
  homePen: number | null;
  awayPen: number | null;
  decidedBy?: Match['decidedBy'];
}

export function buildEndEvent(m: Match, key: number): MatchEndEvent {
  const homeGoals = m.home_team.goals ?? 0;
  const awayGoals = m.away_team.goals ?? 0;
  // Use the shared penalty-aware result so a 1-1 (won on penalties) knockout
  // names the shootout winner instead of being reported as a draw.
  const r = getMatchResult(m);
  const winner = r.homeWon ? 'home' : r.awayWon ? 'away' : 'draw';
  return {
    key,
    matchId: m.id,
    stage: m.stage_name,
    homeName: m.home_team.name,
    homeCode: m.home_team.code,
    homeGoals,
    awayName: m.away_team.name,
    awayCode: m.away_team.code,
    awayGoals,
    winner,
    homePen: m.home_team.penalties ?? null,
    awayPen: m.away_team.penalties ?? null,
    decidedBy: m.decidedBy,
  };
}

// Poll cadence is 15s (see App.tsx). A gap appreciably longer than a couple of
// polls means the tab was backgrounded and its timers frozen/throttled (mobile
// browsers suspend or heavily throttle hidden tabs); the next update is then a
// RESYNC that can jump a goal or full-time that really happened minutes ago. It
// is an extra backstop to the armed gate below.
const RESYNC_GAP_MS = 45000;

// A stream update is a "resume resync" (re-baseline, don't replay events) when
// either a resume was explicitly flagged, or the wall-clock gap since the last
// update is long enough that the tab was frozen/throttled while hidden.
export function isBackgroundResync(gapSinceLastUpdateMs: number, resumeFlagged: boolean): boolean {
  return resumeFlagged || gapSinceLastUpdateMs > RESYNC_GAP_MS;
}

// The single authoritative rule for whether a live stream update may EMIT an
// event (goal / full-time) or must instead silently re-baseline. It may emit
// ONLY when:
//  - the tab is visible — a goal detected while hidden would fire STALE the
//    moment the user returns to the foreground;
//  - we already hold a baseline to diff against;
//  - the poll cadence is normal — not a long gap betraying a frozen background
//    tab catching up; and
//  - the stream is ARMED — we've already absorbed the first network-fresh
//    snapshot since the last resume/mount.
// The armed gate is what finally kills the recurring "stale GOAL! on resume"
// bug: both live streams are stale-while-revalidate cached, so on a resume or
// reload the effect sees the CACHED pre-background score first and the fresh
// network score (which changed while we were away) second. Diffing those two
// replays the off-screen goal. Staying disarmed until a genuine network refresh
// has re-set the baseline makes that impossible — no matter how slow the refresh
// is, or how many cached renders precede it.
export function canEmitAlert(opts: {
  hidden: boolean;
  gapMs: number;
  armed: boolean;
  hasBaseline: boolean;
}): boolean {
  return (
    opts.armed &&
    opts.hasBaseline &&
    !opts.hidden &&
    !isBackgroundResync(opts.gapMs, false)
  );
}

// The arming transition: a stream becomes armed only after it has absorbed a
// genuine network-fresh snapshot while visible. A cached seed render (not fresh)
// or a fresh snapshot that lands while hidden does NOT arm it — so the first real
// network result after any resume/mount is always re-baselined, never replayed.
export function nextArmed(prevArmed: boolean, fresh: boolean, hidden: boolean): boolean {
  return prevArmed || (fresh && !hidden);
}

// Whether the document is currently hidden (backgrounded tab), guarded for the
// non-DOM test environment where `document` may be undefined.
function docHidden(): boolean {
  return typeof document !== 'undefined' && document.hidden;
}

export function useMatchAlerts(
  liveMatches: Match[] | null,
  allMatches: Match[] | null,
  // The wall-clock (ms) of each stream's last SUCCESSFUL network fetch, from
  // useLiveData's `lastUpdated`. It is what lets us tell a genuine network
  // refresh apart from a stale-while-revalidate CACHE seed render — the exact
  // distinction the "armed" gate needs to avoid replaying a goal scored while we
  // were away. Optional so non-App callers/tests still type-check; when omitted a
  // stream never arms (fails safe: no false celebrations).
  liveUpdatedAt?: number | null,
  allUpdatedAt?: number | null,
) {
  // Track each live match's per-team goals so we can tell WHICH side scored,
  // not just that the total changed.
  const prevScores = useRef<Map<number, { home: number; away: number }> | null>(null);
  const prevStatus = useRef<Map<number, string> | null>(null);
  const goalCounter = useRef(0);
  const endCounter = useRef(0);
  const [goalEvent, setGoalEvent] = useState<GoalEvent | null>(null);
  const [endEvents, setEndEvents] = useState<MatchEndEvent[]>([]);

  // Wall-clock of the last processed update per stream, to detect the long gap
  // that betrays a return from a frozen/throttled background tab.
  const lastGoalUpdateAt = useRef(0);
  const lastEndUpdateAt = useRef(0);

  // Per-stream "armed" gate. A stream is armed only once it has absorbed the
  // first network-fresh snapshot since the last resume/mount; until then every
  // update just re-baselines. This is what kills the "stale GOAL! on resume" bug:
  // both live streams are stale-while-revalidate cached, so on a resume/reload
  // the effect sees the CACHED pre-background score first and only then the fresh
  // network score that changed while we were away — and diffing those two replays
  // the off-screen goal. We disarm on every resume signal and only re-arm after a
  // real network refresh has re-set the baseline.
  const armedGoals = useRef(false);
  const armedEnds = useRef(false);
  // The last fetch timestamp already folded into each stream's baseline, so a
  // repeated render of the same cached data isn't mistaken for a fresh fetch.
  const lastGoalFetchAt = useRef<number | null>(null);
  const lastEndFetchAt = useRef<number | null>(null);

  useEffect(() => {
    // Any return-to-foreground / restore disarms both streams so the cache→network
    // catch-up that follows is re-baselined, never replayed. Mirrors useLiveData's
    // own refetch triggers (visibility, focus, online, pageshow) so no refetch can
    // deliver a jumped score without first disarming.
    const disarmOnResume = () => {
      if (document.visibilityState === 'hidden') return;
      armedGoals.current = false;
      armedEnds.current = false;
    };
    const disarmOnPageShow = () => {
      armedGoals.current = false;
      armedEnds.current = false;
    };
    document.addEventListener('visibilitychange', disarmOnResume);
    window.addEventListener('focus', disarmOnResume);
    window.addEventListener('online', disarmOnResume);
    window.addEventListener('pageshow', disarmOnPageShow);
    return () => {
      document.removeEventListener('visibilitychange', disarmOnResume);
      window.removeEventListener('focus', disarmOnResume);
      window.removeEventListener('online', disarmOnResume);
      window.removeEventListener('pageshow', disarmOnPageShow);
    };
  }, []);

  useEffect(() => {
    if (!liveMatches) return;
    const now = Date.now();
    const gap = now - lastGoalUpdateAt.current;
    lastGoalUpdateAt.current = now;
    // A genuine network refresh advances useLiveData's lastUpdated; a cached seed
    // render carries the old (or null) timestamp.
    const fresh = liveUpdatedAt != null && liveUpdatedAt !== lastGoalFetchAt.current;
    if (liveUpdatedAt != null) lastGoalFetchAt.current = liveUpdatedAt;
    const hidden = docHidden();
    const cur = new Map<number, { home: number; away: number }>(
      liveMatches.map((m) => [
        m.id,
        { home: m.home_team.goals ?? 0, away: m.away_team.goals ?? 0 },
      ])
    );
    // Silently re-baseline unless we're truly clear to alert (visible, armed,
    // normal cadence, baseline in hand). Arm only after a network-fresh snapshot
    // that lands while visible, so the NEXT real change alerts — the first fresh
    // result after any resume/mount (which may carry an off-screen goal) is thus
    // always absorbed, never replayed.
    if (!canEmitAlert({ hidden, gapMs: gap, armed: armedGoals.current, hasBaseline: prevScores.current !== null })) {
      armedGoals.current = nextArmed(armedGoals.current, fresh, hidden);
      prevScores.current = cur;
      return;
    }
    if (prevScores.current) {
      for (const m of liveMatches) {
        const prev = prevScores.current.get(m.id);
        if (!prev) continue;
        const homeGoals = m.home_team.goals ?? 0;
        const awayGoals = m.away_team.goals ?? 0;
        const homeScored = homeGoals > prev.home;
        const awayScored = awayGoals > prev.away;
        if (homeScored || awayScored) {
          // If both somehow changed in one poll, credit the bigger jump.
          const scorerIsHome =
            homeScored && (!awayScored || homeGoals - prev.home >= awayGoals - prev.away);
          setGoalEvent({
            key: ++goalCounter.current,
            matchId: m.id,
            scorerName: scorerIsHome ? m.home_team.name : m.away_team.name,
            scorerCode: scorerIsHome ? m.home_team.code : m.away_team.code,
            homeName: m.home_team.name,
            homeCode: m.home_team.code,
            homeGoals,
            awayName: m.away_team.name,
            awayCode: m.away_team.code,
            awayGoals,
          });
          break;
        }
      }
    }
    prevScores.current = cur;
  }, [liveMatches, liveUpdatedAt]);

  useEffect(() => {
    if (!allMatches) return;
    const now = Date.now();
    const gap = now - lastEndUpdateAt.current;
    lastEndUpdateAt.current = now;
    const fresh = allUpdatedAt != null && allUpdatedAt !== lastEndFetchAt.current;
    if (allUpdatedAt != null) lastEndFetchAt.current = allUpdatedAt;
    const hidden = docHidden();
    const cur = new Map<number, string>(allMatches.map((m) => [m.id, m.status]));
    // Same gate as goals: a full-time that lands while hidden or during the
    // cache→network resume catch-up would otherwise surface a stale celebration.
    if (!canEmitAlert({ hidden, gapMs: gap, armed: armedEnds.current, hasBaseline: prevStatus.current !== null })) {
      armedEnds.current = nextArmed(armedEnds.current, fresh, hidden);
      prevStatus.current = cur;
      return;
    }
    if (prevStatus.current) {
      // Collect EVERY match that just finished this poll, not only the first.
      const newlyEnded: MatchEndEvent[] = [];
      for (const m of allMatches) {
        const prev = prevStatus.current.get(m.id);
        if (prev && (prev === 'in_progress' || prev === 'half_time') && m.status === 'completed') {
          newlyEnded.push(buildEndEvent(m, ++endCounter.current));
        }
      }
      if (newlyEnded.length > 0) setEndEvents(newlyEnded);
    }
    prevStatus.current = cur;
  }, [allMatches, allUpdatedAt]);

  return { goalEvent, endEvents };
}
