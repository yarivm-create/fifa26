import { test, expect } from '@playwright/test';
import { buildEndEvent } from '../src/hooks/useMatchAlerts';
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
