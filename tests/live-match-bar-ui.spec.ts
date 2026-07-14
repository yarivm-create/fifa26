import { test, expect, Page } from '@playwright/test';

// Rendered-UI + interaction coverage for the Live Match Bar. It drives the REAL
// app (real hooks, SWR cache, 15s poll) with a mocked FIFA calendar that makes
// curated fixtures live, exactly like live-overlay / goal-celebration tests.
// Engine-independent, so it runs on chromium only to stay fast + deterministic;
// the event logic is unit-tested in live-match-bar.spec.ts.

test.use({ timezoneId: 'Asia/Jerusalem', locale: 'en-US' });

interface LiveEntry {
  hc: string;
  ac: string;
  hs: number;
  as: number;
  min: string;
}

// Overlays each entry onto a curated fixture, matched by team code (IdCountry).
// Codes used here map to real fixtures: GER vs CUW (id 9), FRA vs IRQ (id 42).
function calendar(entries: LiveEntry[]) {
  return {
    Results: entries.map((e) => ({
      IdCompetition: '17',
      IdSeason: '285023',
      Home: { IdCountry: e.hc, TeamName: [{ Description: e.hc }] },
      Away: { IdCountry: e.ac, TeamName: [{ Description: e.ac }] },
      HomeTeamScore: e.hs,
      AwayTeamScore: e.as,
      MatchStatus: 3, // live
      MatchTime: e.min,
      Period: 5, // second half -> unambiguously in-progress
    })),
  };
}

async function mockLive(page: Page, entries: LiveEntry[]) {
  await page.route(/api\.fifa\.com/, (route) => {
    const url = route.request().url();
    if (url.includes('/calendar/matches')) route.fulfill({ json: calendar(entries) });
    else route.fulfill({ json: {} });
  });
}

const onlyChromium = (name: string) =>
  test.skip(name !== 'chromium', 'engine-independent; runs on chromium only');

test('collapsed bar shows the live score, codes and a LIVE indicator', async ({ page }, testInfo) => {
  onlyChromium(testInfo.project.name);
  await mockLive(page, [{ hc: 'GER', ac: 'CUW', hs: 1, as: 0, min: "55'" }]);
  await page.goto('');
  const toggle = page.locator('.live-bar__toggle');
  await expect(toggle).toBeVisible({ timeout: 20_000 });
  await expect(toggle).toContainText('GER');
  await expect(toggle).toContainText('CUW');
  await expect(page.locator('.live-bar__score')).toContainText('1');
  await expect(page.locator('.live-bar__live')).toBeVisible();
});

test('expanding shows full team names and Open full match switches to the Live tab', async ({ page }, testInfo) => {
  onlyChromium(testInfo.project.name);
  await mockLive(page, [{ hc: 'GER', ac: 'CUW', hs: 1, as: 0, min: "55'" }]);
  await page.goto('');
  await expect(page.locator('.live-bar__toggle')).toBeVisible({ timeout: 20_000 });

  // Move off the Live tab first so "Open full match" has a visible effect.
  await page.locator('#tab-standings').click();
  await expect(page.locator('#tab-live')).toHaveAttribute('aria-selected', 'false');

  await page.locator('.live-bar__toggle').click();
  const panel = page.locator('.live-bar__panel');
  await expect(panel).toBeVisible();
  await expect(panel).toContainText('Germany');
  await expect(panel).toContainText('Curaçao');

  await panel.locator('.live-bar__open').click();
  await expect(page.locator('#tab-live')).toHaveAttribute('aria-selected', 'true');
  // Panel closes on open.
  await expect(panel).toBeHidden();
});

test('multiple live matches show a +N badge and can be switched', async ({ page }, testInfo) => {
  onlyChromium(testInfo.project.name);
  await mockLive(page, [
    { hc: 'GER', ac: 'CUW', hs: 1, as: 0, min: "55'" },
    { hc: 'FRA', ac: 'IRQ', hs: 2, as: 1, min: "70'" },
  ]);
  await page.goto('');
  const toggle = page.locator('.live-bar__toggle');
  await expect(toggle).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.live-bar__more')).toHaveText('+1');

  await toggle.click();
  const panel = page.locator('.live-bar__panel');
  await expect(panel).toBeVisible();
  // The bar shows one match at a time (the data-order default); switching must
  // flip it to the OTHER live pair regardless of which one is shown first.
  const franceFirst = (await panel.innerText()).includes('France');
  await panel.locator('.live-bar__switch').click();
  if (franceFirst) {
    await expect(panel).toContainText('Germany');
    await expect(panel).toContainText('Curaçao');
  } else {
    await expect(panel).toContainText('France');
    await expect(panel).toContainText('Iraq');
  }
});

test('desktop floats top-right, mobile pins to the top-centre', async ({ page }, testInfo) => {
  onlyChromium(testInfo.project.name);
  await mockLive(page, [{ hc: 'GER', ac: 'CUW', hs: 1, as: 0, min: "55'" }]);
  await page.goto('');
  const toggle = page.locator('.live-bar__toggle');
  await expect(toggle).toBeVisible({ timeout: 20_000 });

  await page.setViewportSize({ width: 1280, height: 800 });
  let box = (await toggle.boundingBox())!;
  expect(box.y).toBeLessThan(120); // near the top
  expect(box.x + box.width).toBeGreaterThan(1280 - 60); // hugged to the right

  await page.setViewportSize({ width: 390, height: 844 });
  box = (await toggle.boundingBox())!;
  expect(box.y).toBeLessThan(120);
  const centre = box.x + box.width / 2;
  expect(Math.abs(centre - 195)).toBeLessThan(45); // horizontally centred
});

test('renders in RTL (Hebrew) with a localized LIVE label', async ({ page }, testInfo) => {
  onlyChromium(testInfo.project.name);
  await page.addInitScript(() => {
    try {
      localStorage.setItem('wc26-lang', 'he');
    } catch {
      /* ignore */
    }
  });
  await mockLive(page, [{ hc: 'GER', ac: 'CUW', hs: 1, as: 0, min: "55'" }]);
  await page.goto('');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  const toggle = page.locator('.live-bar__toggle');
  await expect(toggle).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.live-bar__live')).toContainText('חי');
});

test('works under reduced-motion (bar still expands)', async ({ page }, testInfo) => {
  onlyChromium(testInfo.project.name);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mockLive(page, [{ hc: 'GER', ac: 'CUW', hs: 1, as: 0, min: "55'" }]);
  await page.goto('');
  const toggle = page.locator('.live-bar__toggle');
  await expect(toggle).toBeVisible({ timeout: 20_000 });
  await toggle.click();
  await expect(page.locator('.live-bar__panel')).toBeVisible();
});

test('notification settings persist once permission is granted', async ({ page }, testInfo) => {
  onlyChromium(testInfo.project.name);
  // Headless Chromium reports Notification.permission as 'denied' and ignores
  // grantPermissions for the Notification getter, so stub a granted Notification
  // to exercise the enabled-settings path deterministically.
  await page.addInitScript(() => {
    class FakeNotification {
      static permission = 'granted';
      static requestPermission() {
        return Promise.resolve('granted');
      }
      close() {
        /* no-op */
      }
    }
    // @ts-expect-error override for test
    window.Notification = FakeNotification;
  });
  await mockLive(page, [{ hc: 'GER', ac: 'CUW', hs: 1, as: 0, min: "55'" }]);
  await page.goto('');
  await expect(page.locator('.live-bar__toggle')).toBeVisible({ timeout: 20_000 });
  await page.locator('.live-bar__toggle').click();
  await page.locator('.live-bar__notif-toggle').click();

  const halfTime = page.locator('.live-bar__notif-list label', { hasText: 'Half-time' }).locator('input');
  await expect(halfTime).not.toBeChecked(); // default off
  await halfTime.check();

  const stored = await page.evaluate(() => localStorage.getItem('wc2026:notify-settings'));
  expect(stored).toBeTruthy();
  expect(JSON.parse(stored as string).halfTime).toBe(true);
});
