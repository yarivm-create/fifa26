import { test, expect } from '@playwright/test';
import { getStatusLabel } from '../src/utils/statusLabel';
import type { TFunc } from '../src/i18n';

// The card status label must read correctly for EVERY match phase the FIFA feed
// can report: first half, half-time, second half, full time, the three extra-
// time phases, and a penalty shootout (including its running score). getStatusLabel
// is the single formatter behind that line, so it is pinned here per phase.

// A t() that mirrors the real i18n interpolation over the actual EN status
// strings, so the assertions below check the exact text a user sees.
const EN: Record<string, string> = {
  'status.live': '⚽ LIVE',
  'status.halfTime': 'HALF TIME',
  'status.fullTime': 'FULL TIME',
  'status.upcoming': 'UPCOMING',
  'status.penalties': 'PENALTIES',
  'status.pensLive': 'PENS {h}-{a}',
  'status.prePenalties': 'PENALTIES NEXT',
  'status.extraTime': 'EXTRA TIME',
  'status.etLive': 'ET {min}',
  'status.etHalfTime': 'ET HALF TIME',
};
const t: TFunc = (key, vars) => {
  const s = EN[key] ?? key;
  return vars ? s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`)) : s;
};

test('regulation phases: first half, half-time, second half show the right label', () => {
  expect(getStatusLabel('in_progress', t, "23'")).toEqual({ label: "23'", isLive: true }); // 1st half
  expect(getStatusLabel('half_time', t, 'HT')).toEqual({ label: 'HALF TIME', isLive: true });
  expect(getStatusLabel('in_progress', t, "67'")).toEqual({ label: "67'", isLive: true }); // 2nd half
  // A live match whose minute has not arrived yet still reads as live.
  expect(getStatusLabel('in_progress', t, undefined)).toEqual({ label: '⚽ LIVE', isLive: true });
});

test('full time and upcoming are not live', () => {
  expect(getStatusLabel('completed', t)).toEqual({ label: 'FULL TIME', isLive: false });
  expect(getStatusLabel('future_scheduled', t)).toEqual({ label: 'UPCOMING', isLive: false });
});

test('extra-time phases: first half, ET half-time break, second half', () => {
  expect(getStatusLabel('in_progress', t, "ET 95'")).toEqual({ label: "ET 95'", isLive: true }); // ET 1st half
  expect(getStatusLabel('half_time', t, 'ET HT')).toEqual({ label: 'ET HALF TIME', isLive: true }); // ET break
  expect(getStatusLabel('in_progress', t, "ET 112'")).toEqual({ label: "ET 112'", isLive: true }); // ET 2nd half
  // Extra time in play before the minute is known.
  expect(getStatusLabel('in_progress', t, 'ET')).toEqual({ label: 'EXTRA TIME', isLive: true });
});

test('penalty shootout shows the running score, ordered home-away', () => {
  // Before the first kick FIFA has no shootout score yet -> plain PENALTIES.
  expect(getStatusLabel('in_progress', t, 'PEN')).toEqual({ label: 'PENALTIES', isLive: true });
  expect(getStatusLabel('in_progress', t, 'PEN', { h: null, a: null })).toEqual({ label: 'PENALTIES', isLive: true });
  // Once kicks are taken, the label carries the tally in home-away order.
  expect(getStatusLabel('in_progress', t, 'PEN', { h: 4, a: 3 })).toEqual({ label: 'PENS 4-3', isLive: true });
  expect(getStatusLabel('in_progress', t, 'PEN', { h: 0, a: 1 })).toEqual({ label: 'PENS 0-1', isLive: true });
});

test('the gap after extra time ends is labelled as penalties coming, not half-time', () => {
  expect(getStatusLabel('half_time', t, 'PRE_PEN')).toEqual({ label: 'PENALTIES NEXT', isLive: true });
});
