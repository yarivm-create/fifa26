import { test, expect } from '@playwright/test';

// End-to-end guard for the "freshly finished match drops a scorer" bug.
//
// When a match has just finished, FIFA publishes the final score and the goal to
// the live/match-detail endpoint immediately, but the detailed per-match
// TIMELINE (the app's normal scorer source) lags. It can come back either
// completely empty OR — the subtler case — populated with everything (kickoff,
// cards, subs) EXCEPT the goal events. Both cases are mocked below: the scorer
// board must still show Mbappe with the goal, proving the live fallback fires on
// a goal-count shortfall, not just on an empty timeline.

const finishedFranceMatch = {
  IdCompetition: '17',
  IdSeason: '285023',
  IdStage: '289288',
  IdMatch: '400021533',
  Home: { IdTeam: 'PAR_T', IdCountry: 'PAR', TeamName: [{ Description: 'Paraguay' }] },
  Away: { IdTeam: 'FRA_T', IdCountry: 'FRA', TeamName: [{ Description: 'France' }] },
  HomeTeamScore: 0,
  AwayTeamScore: 1,
  MatchStatus: 0, // finished
};

const liveDetail = {
  HomeTeam: {
    IdCountry: 'PAR',
    Goals: [],
    Players: [{ IdPlayer: 'par1', PlayerName: [{ Description: 'A PLAYER' }] }],
  },
  AwayTeam: {
    IdCountry: 'FRA',
    Goals: [{ IdPlayer: '389867', Period: 5 }], // France's only goal, not in the timeline yet
    Players: [{ IdPlayer: '389867', PlayerName: [{ Description: 'Kylian MBAPPE' }] }],
  },
};

async function expectMbappeScorer(page: import('@playwright/test').Page) {
  await page.goto('');
  await page.locator('#tab-stats').click({ force: true });
  await expect(page.locator('#tab-stats')).toHaveAttribute('aria-selected', 'true');

  const topRow = page.locator('.stat-board-scorers .stat-board-row').first();
  await expect(topRow).toBeVisible({ timeout: 25000 });
  await expect(topRow.locator('.stat-board-team')).toContainText(/MBAPPE/i);
  await expect(topRow.locator('.stat-board-value')).toContainText('1');
}

test('a scorer from a match whose timeline is still empty is picked up from the live endpoint', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'engine-independent; runs on chromium only');

  await page.route(/api\.fifa\.com/, (route) => {
    const url = route.request().url();
    if (url.includes('/calendar/matches')) {
      route.fulfill({ json: { Results: [finishedFranceMatch] } });
    } else if (url.includes('/timelines/')) {
      route.fulfill({ json: { Event: [] } }); // published score but empty timeline
    } else if (url.includes('/live/football/')) {
      route.fulfill({ json: liveDetail });
    } else {
      route.fulfill({ json: {} });
    }
  });

  await expectMbappeScorer(page);
});

test('a scorer missing from a populated-but-goalless timeline is recovered from the live endpoint', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'engine-independent; runs on chromium only');

  // The real bug: the timeline is NOT empty — it has 3 non-goal events (kickoff,
  // a substitution, a card) but no Type-0 goal event, while the final score is
  // 0-1. goalCount (0) < expected (1) must still trigger the live fallback.
  await page.route(/api\.fifa\.com/, (route) => {
    const url = route.request().url();
    if (url.includes('/calendar/matches')) {
      route.fulfill({ json: { Results: [finishedFranceMatch] } });
    } else if (url.includes('/timelines/')) {
      route.fulfill({
        json: {
          Event: [
            { Type: 5, IdPlayer: null, EventDescription: [{ Description: 'Kick-off' }] },
            { Type: 12, IdPlayer: 'fra9', EventDescription: [{ Description: 'Substitution' }] },
            { Type: 6, IdPlayer: 'par7', EventDescription: [{ Description: 'Yellow card' }] },
          ],
        },
      });
    } else if (url.includes('/live/football/')) {
      route.fulfill({ json: liveDetail });
    } else {
      route.fulfill({ json: {} });
    }
  });

  await expectMbappeScorer(page);
});

test('a stale goalless cache entry from before the fix is invalidated so the scorer is recovered', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'engine-independent; runs on chromium only');

  // Simulate a browser that cached the R16 match as goalless under the OLD
  // (unversioned) key while its timeline still lacked goal events. The versioned
  // cache must ignore + remove that legacy entry and re-fetch, so the live
  // fallback restores Mbappe's goal instead of the app trusting the stale 0.
  await page.addInitScript(() => {
    try {
      localStorage.setItem('wc2026:mstats:400021533', JSON.stringify({ goals: [], assists: [] }));
    } catch {
      /* ignore */
    }
  });

  await page.route(/api\.fifa\.com/, (route) => {
    const url = route.request().url();
    if (url.includes('/calendar/matches')) {
      route.fulfill({ json: { Results: [finishedFranceMatch] } });
    } else if (url.includes('/timelines/')) {
      route.fulfill({ json: { Event: [] } });
    } else if (url.includes('/live/football/')) {
      route.fulfill({ json: liveDetail });
    } else {
      route.fulfill({ json: {} });
    }
  });

  await expectMbappeScorer(page);

  // The legacy (unversioned) key must have been cleaned up on hydrate.
  const legacy = await page.evaluate(() => localStorage.getItem('wc2026:mstats:400021533'));
  expect(legacy).toBeNull();
});
