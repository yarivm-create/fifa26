import { test, expect } from '@playwright/test';
import { buildEndEvent, isBackgroundResync, shouldRebaseline } from '../src/hooks/useMatchAlerts';
import { Match } from '../src/api/types';

// Pins the full-time celebration toast, the reported bug where a knockout
// decided on penalties was announced as a "draw" instead of naming the winner.
function ended(g: number, og: number, opts: { pen?: number; openPen?: number; decidedBy?: Match['decidedBy'] } = {}): Match {
  const { pen = null, openPen = null, decidedBy } = opts as never;
  return {
    id: 74, venue: 'V', location: 'L', datetime: '2026-06-29T19:00:00Z',
    status: 'completed', stage_name: 'Round of 32', decidedBy,
    home_team: { country: 'GER', name: 'Germany', code: 'GER', goals: g, penalties: pen },
    away_team: { country: 'PAR', name: 'Paraguay', code: 'PAR', goals: og, penalties: openPen },
  };
}

test('a penalty shootout names the shootout winner, not a draw', () => {
  const e = buildEndEvent(ended(1, 1, { pen: 3, openPen: 4, decidedBy: 'penalties' }), 1);
  expect(e.winner).toBe('away');
  expect(e.decidedBy).toBe('penalties');
  expect(e.homePen).toBe(3);
  expect(e.awayPen).toBe(4);
  expect(e.homeGoals).toBe(1);
  expect(e.awayGoals).toBe(1);
});

test('a home shootout win is credited to home', () => {
  const e = buildEndEvent(ended(2, 2, { pen: 5, openPen: 4, decidedBy: 'penalties' }), 2);
  expect(e.winner).toBe('home');
});

test('an extra-time win names the goal winner with the AET flag', () => {
  const e = buildEndEvent(ended(2, 1, { decidedBy: 'extra_time' }), 3);
  expect(e.winner).toBe('home');
  expect(e.decidedBy).toBe('extra_time');
  expect(e.homePen).toBeNull();
  expect(e.awayPen).toBeNull();
});

test('a real group-stage draw is still announced as a draw', () => {
  const e = buildEndEvent(ended(1, 1), 4);
  expect(e.winner).toBe('draw');
  expect(e.decidedBy).toBeUndefined();
});

// Pins the fix for the reported bug: returning to the foreground replayed a
// "GOAL!" for a goal scored minutes earlier while the tab was backgrounded. A
// resume must RE-BASELINE (isBackgroundResync -> true) instead of diffing the
// pre-background scores against fresh ones, whether the resume was flagged by a
// visibility/pageshow event OR only betrayed by a long gap between polls (the
// case the old flag-only logic lost to an in-flight fetch resolving on resume).
test('a normal 15s poll gap is NOT treated as a resume resync', () => {
  expect(isBackgroundResync(15000, false)).toBe(false);
  expect(isBackgroundResync(30000, false)).toBe(false);
});

test('a long gap (frozen background) forces a resync even with no flag', () => {
  expect(isBackgroundResync(60000, false)).toBe(true);
  expect(isBackgroundResync(10 * 60 * 1000, false)).toBe(true);
});

test('an explicit resume flag forces a resync even on a short gap', () => {
  // Covers the race where the resume event fires before the next poll gap grows.
  expect(isBackgroundResync(2000, true)).toBe(true);
});

// Pins the SECOND report of the same class of bug: a goal that arrives while the
// tab is HIDDEN (a mobile background tab that keeps polling at a throttled rate)
// must be re-baselined, never emitted — otherwise the overlay it queues fires
// stale when the user returns to the foreground. A hidden tab forces a rebaseline
// regardless of the gap or the resume flag.
test('a hidden tab always re-baselines, even on a fresh short-gap poll', () => {
  expect(shouldRebaseline(true, 15000, false)).toBe(true);
  expect(shouldRebaseline(true, 0, false)).toBe(true);
});

test('a visible tab replays events normally on a healthy poll gap', () => {
  // Visible + normal cadence + no resume flag = diff & emit (do NOT re-baseline).
  expect(shouldRebaseline(false, 15000, false)).toBe(false);
  expect(shouldRebaseline(false, 30000, false)).toBe(false);
});

test('a visible tab still re-baselines on a resume flag or a long frozen gap', () => {
  expect(shouldRebaseline(false, 2000, true)).toBe(true);
  expect(shouldRebaseline(false, 60000, false)).toBe(true);
});
