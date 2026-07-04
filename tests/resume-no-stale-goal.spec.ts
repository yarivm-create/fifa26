import { test, expect, Page } from '@playwright/test';

// End-to-end regression guard for the RECURRING "stale GOAL! on resume" bug.
//
// The failure mode, reproduced faithfully here: a live match is at 0-0 when the
// user backgrounds the app. A goal is scored while they're away (0-1). On iOS
// Safari the backgrounded tab is discarded and RELOADS on return, so the SWR
// cache first replays the pre-background 0-0 (the "seed" render) and only then
// does the network deliver the fresh 0-1. The old alert logic diffed those two
// updates and fired a "GOAL!" overlay for a goal the user never saw live.
//
// This test drives the REAL app (real hooks, real SWR cache, real reload) with a
// mocked FIFA calendar, then asserts the goal overlay NEVER appears even though
// the score genuinely advances 0-0 -> 0-1 across the reload. It is engine-
// independent, so — like the concurrency gate — it runs on chromium only to stay
// fast and deterministic; the decision logic is additionally unit-tested in
// celebration.spec.ts.

test.use({ timezoneId: 'Asia/Jerusalem', locale: 'en-US' });

const CACHE_KEY = 'wc2026:swr:currentMatches';

// One live match overlaid onto a real curated fixture (Germany vs Curaçao, id 9),
// matched by country code. Omitting IdStage/IdMatch keeps the app from calling
// the per-match live endpoint. `awayGoals` is what changes 0 -> 1.
function calendar(awayGoals: number) {
  return {
    Results: [
      {
        IdCompetition: '17',
        IdSeason: '285023',
        Home: { IdCountry: 'GER', TeamName: [{ Description: 'Germany' }] },
        Away: { IdCountry: 'CUW', TeamName: [{ Description: 'Curaçao' }] },
        HomeTeamScore: 0,
        AwayTeamScore: awayGoals,
        MatchStatus: 3, // live
        MatchTime: "50'",
        Period: 5, // second half -> unambiguously in-progress
      },
    ],
  };
}

// The Away (Curaçao) goals currently recorded in the SWR cache, or null. Reading
// localStorage directly makes this independent of which tab is on screen.
function cachedAwayGoals(page: Page): Promise<number | null> {
  return page.evaluate((key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { v: Array<{ home_team: { code: string }; away_team: { goals: number | null } }> };
      const m = parsed.v?.find((x) => x.home_team?.code === 'GER');
      return m ? m.away_team.goals : null;
    } catch {
      return null;
    }
  }, CACHE_KEY);
}

test('a goal scored while backgrounded never replays as a live celebration on resume', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'engine-independent; runs on chromium only');

  let awayGoals = 0;
  await page.route(/api\.fifa\.com/, (route) => {
    const url = route.request().url();
    if (url.includes('/calendar/matches')) {
      route.fulfill({ json: calendar(awayGoals) });
    } else {
      route.fulfill({ json: {} });
    }
  });

  // Detector: flag if a GOAL overlay (Fireworks with a scorer, i.e. `.fx-goal-team`)
  // ever mounts — even transiently. Re-installed on every navigation, so it also
  // watches the post-reload page. `.fx-goal-team` is goal-specific: the full-time
  // Fireworks renders only `.fx-goal-banner`, never `.fx-goal-team`.
  await page.addInitScript(() => {
    (window as unknown as Record<string, unknown>).__goalOverlaySeen = false;
    const flag = (n: Node) => {
      const el = n as Element;
      if (el && el.nodeType === 1 && (el.matches?.('.fx-goal-team') || el.querySelector?.('.fx-goal-team'))) {
        (window as unknown as Record<string, unknown>).__goalOverlaySeen = true;
      }
    };
    const obs = new MutationObserver((muts) => {
      for (const m of muts) m.addedNodes.forEach(flag);
    });
    const start = () => obs.observe(document.documentElement, { childList: true, subtree: true });
    if (document.documentElement) start();
    else document.addEventListener('DOMContentLoaded', start);
  });

  const seen = () => page.evaluate(() => (window as unknown as Record<string, unknown>).__goalOverlaySeen === true);

  // 1) Load with the match at 0-0. This establishes the baseline the user "saw"
  //    and persists it to the SWR cache (the seed a reload will replay first).
  await page.goto('');
  await expect(page.getByRole('heading', { name: /FIFA World Cup 2026/i })).toBeVisible();
  await expect.poll(() => cachedAwayGoals(page), { timeout: 15_000 }).toBe(0);
  expect(await seen(), 'no goal overlay should fire on the initial 0-0 load').toBe(false);

  // 2) A goal is scored while the app is "backgrounded".
  awayGoals = 1;

  // 3) Return to a DISCARDED tab: a full reload. The SWR cache seeds 0-0 first,
  //    then the network delivers the fresh 0-1 — the exact double-update race.
  await page.reload();
  await expect(page.getByRole('heading', { name: /FIFA World Cup 2026/i })).toBeVisible();

  // The fresh 0-1 really is delivered post-reload (proves the data flowed)...
  await expect.poll(() => cachedAwayGoals(page), { timeout: 15_000 }).toBe(1);
  // ...and settle a moment to let any (buggy) overlay mount before we assert.
  await page.waitForTimeout(2000);

  // The regression: NO goal celebration for the off-screen goal.
  expect(await seen(), 'a goal scored while backgrounded must NOT replay as a live "GOAL!" on resume').toBe(false);
});
