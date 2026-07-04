import { test, expect } from '@playwright/test';
import { buildEndEvent, isBackgroundResync, canEmitAlert, nextArmed } from '../src/hooks/useMatchAlerts';
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
// stale when the user returns to the foreground.
test('an alert may fire only when visible, armed, baselined and on a healthy gap', () => {
  expect(canEmitAlert({ hidden: false, gapMs: 15000, armed: true, hasBaseline: true })).toBe(true);
  // Hidden tab: a goal detected here would fire stale on resume.
  expect(canEmitAlert({ hidden: true, gapMs: 15000, armed: true, hasBaseline: true })).toBe(false);
  // No baseline yet: nothing to diff against.
  expect(canEmitAlert({ hidden: false, gapMs: 15000, armed: true, hasBaseline: false })).toBe(false);
  // Long gap betrays a frozen background tab catching up.
  expect(canEmitAlert({ hidden: false, gapMs: 60000, armed: true, hasBaseline: true })).toBe(false);
});

test('a disarmed stream never emits, however healthy the update looks', () => {
  // The crux of the resume fix: immediately after a resume/mount the stream is
  // disarmed, so even a visible, baselined, normal-cadence update is absorbed.
  expect(canEmitAlert({ hidden: false, gapMs: 15000, armed: false, hasBaseline: true })).toBe(false);
});

// Pins the ARMING transition that defeats the stale-while-revalidate resume race.
test('only a network-fresh snapshot seen while visible arms a stream', () => {
  // A cached seed render (data present, no fresh network fetch) must NOT arm.
  expect(nextArmed(false, /*fresh*/ false, /*hidden*/ false)).toBe(false);
  // A fresh snapshot that lands while hidden must NOT arm (its goal would then
  // fire on the next visible poll).
  expect(nextArmed(false, /*fresh*/ true, /*hidden*/ true)).toBe(false);
  // A fresh snapshot while visible arms the stream.
  expect(nextArmed(false, /*fresh*/ true, /*hidden*/ false)).toBe(true);
  // Once armed, it stays armed across ordinary cached re-renders.
  expect(nextArmed(true, /*fresh*/ false, /*hidden*/ false)).toBe(true);
});

// The exact recurring regression, at the unit level: on resume/reload the SWR
// cache serves the pre-background score FIRST, then the network delivers the
// score that changed while we were away. Neither may replay a "GOAL!".
test('the cache→network resume burst never replays an off-screen goal', () => {
  let armed = false; // disarmed by the resume/mount signal
  // 1) Cached seed render — same old score, NOT a network refresh.
  expect(
    canEmitAlert({ hidden: false, gapMs: 999999, armed, hasBaseline: false })
  ).toBe(false);
  armed = nextArmed(armed, /*fresh*/ false, /*hidden*/ false);
  expect(armed).toBe(false);
  // 2) First network-fresh snapshot carries the off-screen goal (0-0 → 0-1).
  //    Still disarmed, so it is absorbed, not celebrated.
  expect(
    canEmitAlert({ hidden: false, gapMs: 1500, armed, hasBaseline: true })
  ).toBe(false);
  armed = nextArmed(armed, /*fresh*/ true, /*hidden*/ false);
  expect(armed).toBe(true);
  // 3) A later, genuinely live goal on a normal poll DOES celebrate.
  expect(
    canEmitAlert({ hidden: false, gapMs: 15000, armed, hasBaseline: true })
  ).toBe(true);
});
