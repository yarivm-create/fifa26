import { test, expect } from '@playwright/test';

// Drives the REAL app (real hooks, real SWR cache + merge) with a mocked FIFA
// calendar in which the Final is finished. The crafted event carries the
// PlaceHolderA/B labels for the Final's bracket slots (W101 / W102), so the live
// merge resolves those slots to real teams and overlays the completed score —
// exactly the path the app takes when the trophy is lifted. It asserts the
// champion banner appears on the main page, names the winner, and that dismissing
// it sticks across a reload.

test.use({ timezoneId: 'Asia/Jerusalem', locale: 'en-US', reducedMotion: 'reduce' });

// A finished Final: Argentina beat France 3-1. PlaceHolderA/B tie it to the
// curated Final's slots so mergeMatches() slots the real teams into match 104.
const finishedFinalCalendar = {
  Results: [
    {
      IdCompetition: '17',
      IdSeason: '285023',
      Home: { IdCountry: 'ARG', TeamName: [{ Description: 'Argentina' }] },
      Away: { IdCountry: 'FRA', TeamName: [{ Description: 'France' }] },
      PlaceHolderA: 'W101',
      PlaceHolderB: 'W102',
      HomeTeamScore: 3,
      AwayTeamScore: 1,
      ResultType: 1, // decided in regulation
      MatchStatus: 0, // finished
      MatchTime: null,
    },
  ],
};

async function mockFinishedFinal(page: import('@playwright/test').Page) {
  await page.route(/api\.fifa\.com/, (route) => {
    const url = route.request().url();
    if (url.includes('/calendar/matches')) {
      route.fulfill({ json: finishedFinalCalendar });
    } else {
      route.fulfill({ json: {} });
    }
  });
}

test('crowns the champion on the main page once the Final is decided', async ({ page }) => {
  await mockFinishedFinal(page);
  await page.goto('');

  const banner = page.locator('.champion-banner');
  await expect(banner).toBeVisible({ timeout: 20_000 });

  // Headline + winner.
  await expect(banner.locator('.champion-eyebrow')).toContainText(/WORLD CHAMPIONS/i);
  await expect(banner.locator('.champion-team-name')).toHaveText('Argentina');
  // Trophy mark renders.
  await expect(banner.locator('.champion-trophy svg')).toBeVisible();
  // Result line names the beaten finalist and the score.
  const result = banner.locator('.champion-result');
  await expect(result).toContainText(/France/);
  await expect(result).toContainText(/3.*1/);
});

test('dismissing the champion banner persists across reloads', async ({ page }) => {
  await mockFinishedFinal(page);
  await page.goto('');

  const banner = page.locator('.champion-banner');
  await expect(banner).toBeVisible({ timeout: 20_000 });

  await banner.getByRole('button', { name: /dismiss/i }).click();
  await expect(banner).toHaveCount(0);

  await page.reload({ waitUntil: 'domcontentloaded' });
  // Still crowned in the data, but the user dismissed it — stays hidden.
  await expect(page.getByRole('heading', { name: /FIFA World Cup 2026/i })).toBeVisible();
  await expect(page.locator('.champion-banner')).toHaveCount(0);
});
