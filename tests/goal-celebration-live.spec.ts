import { test, expect, Page } from '@playwright/test';

// End-to-end guard for the POSITIVE half of the celebration contract, the
// counterpart to resume-no-stale-goal.spec.ts.
//
// The resume fix (the "armed" gate in useMatchAlerts) deliberately SUPPRESSES a
// goal that arrives across a background→foreground resume, because on iOS Safari
// the stale-while-revalidate cache replays the pre-background score first. The
// risk of that fix is the opposite regression: over-suppressing so that a
// genuine goal scored while the user is ACTIVELY IN THE APP no longer triggers
// the celebration at all.
//
// This test drives the REAL app (real hooks, real SWR cache, real 15s poll) with
// a mocked FIFA calendar. The tab stays in the FOREGROUND the whole time — no
// reload, no visibility change — the score simply advances 0-0 -> 0-1 across a
// natural live poll, exactly like a goal scored while you watch. It asserts the
// goal overlay DOES fire and names the right scorer and score. Like the resume
// test it is engine-independent, so it runs on chromium only to stay fast and
// deterministic; the decision logic is additionally unit-tested in
// celebration.spec.ts.

test.use({ timezoneId: 'Asia/Jerusalem', locale: 'en-US' });

const CACHE_KEY = 'wc2026:swr:currentMatches';

// One live match overlaid onto a real curated fixture (Germany vs Curaçao, id 9),
// matched by country code. Omitting IdStage/IdMatch keeps the app from calling
// the per-match live endpoint. `awayGoals` is what advances 0 -> 1 (Curaçao
// scores while we watch).
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

test('a goal scored while you are in the app fires the live celebration', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'engine-independent; runs on chromium only');
  // Two module-level TTL caches in liveData.ts (FIFA_MATCHES_TTL_MS=15s,
  // CACHE_TTL_MS=12s) sit under the 15s useLiveData poll, so a mock score change
  // can take up to ~two poll cycles (~30s) to surface. Give the whole flow room.
  test.setTimeout(70_000);

  let awayGoals = 0;
  await page.route(/api\.fifa\.com/, (route) => {
    const url = route.request().url();
    if (url.includes('/calendar/matches')) {
      route.fulfill({ json: calendar(awayGoals) });
    } else {
      route.fulfill({ json: {} });
    }
  });

  // Detector: flag AND capture the text of the GOAL overlay (`.fx-goal-team`,
  // which renders only for a goal — the full-time Fireworks renders only
  // `.fx-goal-banner`, never `.fx-goal-team`) the moment it mounts, even if it
  // later auto-removes. Capturing the text lets us prove the RIGHT scorer/score
  // was celebrated, not just that something popped.
  await page.addInitScript(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__goalOverlaySeen = false;
    w.__goalOverlayText = '';
    const flag = (n: Node) => {
      const el = n as Element;
      if (!el || el.nodeType !== 1) return;
      const team = el.matches?.('.fx-goal-team') ? el : el.querySelector?.('.fx-goal-team');
      if (team) {
        w.__goalOverlaySeen = true;
        w.__goalOverlayText = (team.textContent || '').replace(/\s+/g, ' ').trim();
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
  const overlayText = () => page.evaluate(() => String((window as unknown as Record<string, unknown>).__goalOverlayText || ''));

  // 1) Load with the match at 0-0, in the foreground. The first network-fresh
  //    snapshot (seen while visible) arms the stream and sets the 0-0 baseline —
  //    but must NOT itself celebrate anything.
  await page.goto('');
  await expect(page.getByRole('heading', { name: /FIFA World Cup 2026/i })).toBeVisible();
  await expect.poll(() => cachedAwayGoals(page), { timeout: 15_000 }).toBe(0);
  // Let the arming pass (and any one-off load events: pageshow/focus) settle so
  // the next score change is a clean, armed, foreground live poll.
  await page.waitForTimeout(1500);
  expect(await seen(), 'no goal overlay should fire on the initial 0-0 load').toBe(false);

  // 2) A goal is scored WHILE WE WATCH — no reload, no backgrounding. The next
  //    natural 15s live poll will deliver 0-1.
  awayGoals = 1;

  // 3) The fresh 0-1 arrives on a later poll once the TTL caches expire (proves
  //    the data flowed)...
  await expect.poll(() => cachedAwayGoals(page), { timeout: 35_000 }).toBe(1);
  // ...and give the goal overlay a moment to mount.
  await expect.poll(() => seen(), {
    timeout: 5_000,
    message: 'a goal scored while in the app MUST fire the live "GOAL!" celebration',
  }).toBe(true);

  // 4) It celebrated the RIGHT side: Curaçao (the away team that scored), 0 – 1.
  const text = await overlayText();
  expect(text, `goal overlay named the scorer/score (was: "${text}")`).toMatch(/Cura/);
  expect(text).toMatch(/0.*1/);
});
