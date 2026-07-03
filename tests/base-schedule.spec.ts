import { test, expect } from '@playwright/test';
import { getBaseSchedule } from '../src/api/worldcup';

// Pins the first-ever-visit seed: the Live screen paints this bundled, network-
// free schedule instantly (instead of a blocking spinner) while the ~260KB FIFA
// calendar loads, then overlays live scores. So the seed must be a complete,
// usable, date-ordered fixture list produced synchronously with no fetch.

test('getBaseSchedule returns a complete fixture list synchronously', () => {
  const base = getBaseSchedule();
  expect(Array.isArray(base)).toBe(true);
  // The World Cup has 104 matches; the bundled schedule must cover them all.
  expect(base.length).toBeGreaterThan(100);
  for (const m of base) {
    expect(typeof m.home_team.code).toBe('string');
    expect(m.home_team.code.length).toBeGreaterThan(0);
    expect(typeof m.away_team.code).toBe('string');
    expect(m.away_team.code.length).toBeGreaterThan(0);
    expect(typeof m.datetime).toBe('string');
  }
});

test('the seed is ordered newest-first, exactly like fetchAllMatches', () => {
  const base = getBaseSchedule();
  for (let i = 1; i < base.length; i++) {
    const prev = new Date(base[i - 1].datetime).getTime();
    const cur = new Date(base[i].datetime).getTime();
    expect(prev).toBeGreaterThanOrEqual(cur);
  }
});
