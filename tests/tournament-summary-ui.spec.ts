import { test, expect } from '@playwright/test';

// Drives the REAL app with a mocked FIFA calendar in which the Final is finished
// (Argentina beat France 3-1). Once a champion is resolved the main "Live &
// Today" tab is retired in favour of the end-of-tournament recap, so this test
// asserts the summary — podium, the Final, the by-the-numbers grid and the
// champion's road — renders on the default tab and the tab is relabelled.

test.use({ timezoneId: 'Asia/Jerusalem', locale: 'en-US', reducedMotion: 'reduce' });

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

test('retires the Live tab for a tournament recap once the Final is decided', async ({ page }) => {
  await mockFinishedFinal(page);
  await page.goto('');

  // The recap takes over the default tab.
  const summary = page.locator('.tournament-summary');
  await expect(summary).toBeVisible({ timeout: 20_000 });

  // The main tab is relabelled from "Live & Today" to "Summary" (its id stays).
  await expect(page.locator('#tab-live')).toContainText(/Summary/i);
  await expect(page.locator('#tab-live')).toHaveAttribute('aria-selected', 'true');

  // Podium: gold = Argentina, silver = France.
  await expect(summary.locator('.podium-1 .podium-team')).toHaveText('Argentina');
  await expect(summary.locator('.podium-2 .podium-team')).toHaveText('France');

  // The Final scoreline names both finalists and shows the champion's goals.
  const final = summary.locator('.summary-final');
  await expect(final).toContainText('Argentina');
  await expect(final).toContainText('France');
  await expect(final.locator('.summary-final-winner')).toHaveText('3');

  // A four-cell "by the numbers" grid, with a positive matches-played tally.
  const stats = summary.locator('.summary-numbers .summary-stat');
  await expect(stats).toHaveCount(4);
  const played = Number(await stats.first().locator('.summary-stat-value').innerText());
  expect(played).toBeGreaterThan(0);

  // The champion's road ends at the Final against France.
  await expect(summary.locator('.summary-road .road-leg').last()).toContainText('France');

  // The retired Live view (upcoming / day sections) is gone from the panel.
  await expect(page.locator('.upcoming-section')).toHaveCount(0);
});
