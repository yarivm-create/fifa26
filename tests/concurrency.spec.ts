import { test, expect } from '@playwright/test';

// Concurrency / mini load gate: open N real browser contexts in parallel
// (distinct simulated users), load the app, click through every tab, and
// assert every session renders with zero app errors. Runs as part of the E2E
// suite so it gates every push (locally and in CI).
//
// Kept chromium-only and modest in size so it's stable on 2-core CI runners.
// Tagged @load so `npm run test:e2e` runs it in an ISOLATED second pass with a
// single worker (running it alongside the fully-parallel suite starves the
// other tests of CPU and makes them flaky). Override the user count locally
// with CONCURRENCY_USERS (e.g. 20).

test.use({ timezoneId: 'Asia/Jerusalem', locale: 'en-US', reducedMotion: 'reduce' });

const BASE = 'http://localhost:4173/fifa26/';
const TABS = ['live', 'standings', 'stats', 'bracket', 'schedule', 'favorites'];
const USERS = parseInt(process.env.CONCURRENCY_USERS || '10', 10);

test('handles N concurrent users with zero app errors @load', async ({ browser }, testInfo) => {
  // One representative engine is enough; multiplying across all 5 projects would
  // just thrash CI without adding signal.
  test.skip(testInfo.project.name !== 'chromium', 'concurrency gate runs on chromium only');
  test.setTimeout(120_000);

  const sessions = Array.from({ length: USERS }).map(async (_, i) => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    const errors: string[] = [];
    // Ignore known-benign noise (same filter as smoke.spec): the third-party
    // counter's eval() error and the benign "ResizeObserver loop" notice.
    page.on('pageerror', (e) => {
      const msg = String(e);
      if (!/eval/i.test(msg) && !/ResizeObserver loop/i.test(msg)) errors.push(msg);
    });
    page.on('console', (m) => {
      if (m.type() !== 'error') return;
      const t = m.text();
      if (!/eval/i.test(t) && !/message channel closed|chrome-extension/i.test(t)) errors.push(t);
    });

    try {
      await page.goto(BASE, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: /FIFA World Cup 2026/i })).toBeVisible();
      for (const tab of TABS) {
        await page.locator('#tab-' + tab).click({ force: true }).catch(() => {});
        await page.waitForTimeout(100);
      }
      return { user: i + 1, ok: errors.length === 0, errors };
    } catch (e) {
      return { user: i + 1, ok: false, errors: [String(e)] };
    } finally {
      await ctx.close();
    }
  });

  const results = await Promise.all(sessions);
  const failed = results.filter((r) => !r.ok);
  const detail = failed.map((f) => `user #${f.user}: ${f.errors.join('; ')}`).join('\n');
  expect(failed.length, `${failed.length}/${USERS} concurrent sessions failed:\n${detail}`).toBe(0);
});
