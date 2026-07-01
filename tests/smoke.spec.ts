import { test, expect } from '@playwright/test';

// Force a known timezone so the local-time flag assertion is deterministic.
// `reducedMotion: reduce` disables the app's pulse/celebration animations
// (see global.css) so tab buttons stay stable for clicks across all browsers.
test.use({ timezoneId: 'Asia/Jerusalem', locale: 'en-US', reducedMotion: 'reduce' });

const TABS = ['live', 'standings', 'stats', 'bracket', 'schedule', 'favorites'];

// Collect uncaught page errors, ignoring known-benign noise:
//  - the third-party counter's eval() error (whos.amung.us, blocked by our CSP)
//  - "ResizeObserver loop ..." which is a benign browser notification, not a bug
function trackAppErrors(page: import('@playwright/test').Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => {
    const msg = String(e);
    if (!/eval/i.test(msg) && !/ResizeObserver loop/i.test(msg)) errors.push(msg);
  });
  return errors;
}

test('app loads with header, local clock and region flag', async ({ page }) => {
  const errors = trackAppErrors(page);
  await page.goto('');

  await expect(page.getByRole('heading', { name: /FIFA World Cup 2026/i })).toBeVisible();

  // Exactly one header clock, showing the visitor's local time + their flag.
  const clock = page.locator('.header-clock');
  await expect(clock).toHaveCount(1);
  await expect(clock).toContainText(/\d{1,2}:\d{2}/);
  await expect(page.locator('.header-clock img')).toHaveAttribute(
    'src',
    /flagcdn\.com\/.*\/il\.png/
  );

  // No leftover second clock.
  await expect(page.locator('.israel-clock-section')).toHaveCount(0);

  expect(errors, errors.join('\n')).toEqual([]);
});

test('all tabs open and render without crashing', async ({ page }) => {
  const errors = trackAppErrors(page);
  await page.goto('');

  for (const key of TABS) {
    const tab = page.locator(`#tab-${key}`);
    await expect(tab).toBeVisible();
    // force bypasses WebKit's actionability stall from the 1s clock re-render;
    // the aria-selected assertion below still proves the tab really activated.
    await tab.click({ force: true });
    await expect(tab).toHaveAttribute('aria-selected', 'true');
    // The tab panel must render and must NOT fall back to the error boundary.
    await expect(page.locator('#tab-panel')).toBeVisible();
    await expect(page.locator('.error-boundary')).toHaveCount(0);
  }

  expect(errors, errors.join('\n')).toEqual([]);
});

test('keyboard navigation moves between tabs (a11y)', async ({ page }) => {
  await page.goto('');
  await page.locator('#tab-live').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#tab-standings')).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('End');
  await expect(page.locator('#tab-favorites')).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Home');
  await expect(page.locator('#tab-live')).toHaveAttribute('aria-selected', 'true');
});

test('share button is mobile-only and fires the native share sheet', async ({ page }, testInfo) => {
  // Stub the Web Share API (Playwright engines don't implement it) so we can
  // verify the button invokes navigator.share with our canonical URL.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: (data: ShareData) => {
        (window as unknown as { __shared?: ShareData }).__shared = data;
        return Promise.resolve();
      },
    });
  });
  await page.goto('');

  const share = page.getByRole('button', { name: /share/i });
  const isMobileProject = /mobile/i.test(testInfo.project.name);

  if (!isMobileProject) {
    // Desktop browsers must never render the Share button.
    await expect(share).toHaveCount(0);
    return;
  }

  // Mobile (touch + mobile UA emulation): button renders and fires share.
  await expect(share).toBeVisible();
  await share.click();

  const shared = await page.evaluate(
    () => (window as unknown as { __shared?: ShareData }).__shared
  );
  expect(shared?.url).toContain('/fifa26/');
});

test('Live tab shows a Next Up section (max 2 fixtures) before Today', async ({ page }) => {
  const errors = trackAppErrors(page);
  await page.goto('');
  // Live is the default tab.
  const nextUp = page.locator('.upcoming-section');
  await expect(nextUp).toBeVisible();
  await expect(nextUp.locator('.section-title')).toContainText('Next Up');

  // Highlights at most the two soonest fixtures.
  const cards = nextUp.locator('.matches-grid > *');
  const count = await cards.count();
  expect(count).toBeGreaterThan(0);
  expect(count).toBeLessThanOrEqual(2);

  // Next Up must appear above Today in document order.
  const titles = await page.locator('#tab-panel .section-title').allInnerTexts();
  const upIdx = titles.findIndex((t) => /Next Up/.test(t));
  const todayIdx = titles.findIndex((t) => /Today$/.test(t.trim()));
  expect(upIdx).toBeGreaterThanOrEqual(0);
  if (todayIdx >= 0) {
    expect(upIdx).toBeLessThan(todayIdx);
  }

  // Next Up fixtures must NOT be repeated in the day sections below.
  const upTeams = await nextUp.locator('.team-name').allInnerTexts();
  const dayMatchups = await page.locator('.day-section:not(.upcoming-section) .match-card').allInnerTexts();
  for (let p = 0; p + 1 < upTeams.length; p += 2) {
    const dup = dayMatchups.some((m) => m.includes(upTeams[p]) && m.includes(upTeams[p + 1]));
    expect(dup, `Next Up fixture ${upTeams[p]} vs ${upTeams[p + 1]} repeated below`).toBeFalsy();
  }

  expect(errors, errors.join('\n')).toEqual([]);
});

test('Favorites lists followed players before favorite teams', async ({ page }) => {
  // Seed one followed player + one followed team before the app boots.
  await page.addInitScript(() => {
    localStorage.setItem('wc2026:followed-players', JSON.stringify(['1']));
    localStorage.setItem('wc2026:followed-teams', JSON.stringify(['BRA']));
  });
  await page.goto('');
  await page.locator('#tab-favorites').click({ force: true });
  await expect(page.locator('#tab-favorites')).toHaveAttribute('aria-selected', 'true');

  // Both blocks render their heading; players must come first.
  const headings = page.locator('#tab-panel .favorites-heading');
  await expect(headings).toHaveCount(2, { timeout: 15000 });
  await expect(headings.nth(0)).toContainText(/Players/i);
  await expect(headings.nth(1)).toContainText(/Teams/i);
});

test('branding uses the World Cup trophy SVG (favicon + standings title)', async ({ page }) => {
  await page.goto('');

  // Favicon points at the trophy asset, not the old emoji data-URI.
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', /trophy\.svg/);

  // The header hero trophy is a CSS background pointing at the same asset.
  const headerBg = await page.locator('.header').evaluate(
    (el) => getComputedStyle(el, '::before').backgroundImage
  );
  expect(headerBg).toContain('trophy.svg');

  // Standings title renders the inline trophy SVG (no 🏆 emoji fallback).
  await page.locator('#tab-standings').click({ force: true });
  await expect(
    page.locator('#tab-panel h2 svg[aria-label="Champion trophy"]').first()
  ).toBeVisible();

  // The header soccer ball must render as a real emoji, NOT be flattened into a
  // gold disc by the gradient text-clip on the h1.
  const ballFill = await page
    .locator('.header h1 .title-ball')
    .evaluate((el) => getComputedStyle(el).webkitTextFillColor);
  expect(ballFill).not.toBe('rgba(0, 0, 0, 0)');
  expect(ballFill).not.toBe('transparent');
});

test('language toggle switches between English (LTR) and Hebrew (RTL)', async ({ page }) => {
  await page.goto('');

  // Default is English / left-to-right.
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.getByRole('heading', { name: /FIFA World Cup 2026/i })).toBeVisible();

  // Flip to Hebrew: document becomes RTL and the heading switches.
  await page.locator('.lang-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('lang', 'he');
  await expect(page.getByRole('heading', { name: /מונדיאל 2026/ })).toBeVisible();

  // Choice persists across reloads.
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

  // Flip back to English.
  await page.locator('.lang-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
});

// Regression: after the app has been open a moment (idle prefetch warms the
// code-split chunks), switching tabs must NOT flash the generic "Loading…"
// Suspense fallback. Tab switching runs inside a React transition, so the
// previous panel stays on screen until the next tab's chunk is ready.
test('switching tabs after warm-up shows no Suspense loading fallback', async ({ page }) => {
  await page.goto('');
  // Give the idle prefetch time to download the code-split tab chunks.
  await page.waitForTimeout(6000);

  const genericFallback = page.locator('#tab-panel .loading p', { hasText: /^Loading…$/ });
  for (const key of ['standings', 'stats', 'bracket', 'schedule', 'favorites']) {
    await page.locator(`#tab-${key}`).click({ force: true });
    await expect(page.locator(`#tab-${key}`)).toHaveAttribute('aria-selected', 'true');
    // The generic chunk-loading fallback must never be the visible state.
    await expect(genericFallback).toHaveCount(0);
    await expect(page.locator('#tab-panel')).toBeVisible();
  }
});
// Regression: the Stats tab renders its calendar/group-derived core (totals,
// team boards) immediately from cache — it must NOT block behind a full-screen
// spinner while the ~80 per-match timelines that power the scorer/assist boards
// load. Those boards fill in progressively.
test('Stats tab renders core immediately, scorers fill in progressively', async ({ page }) => {
  await page.goto('');
  await page.waitForTimeout(6000); // idle warm-up primes statsCore (free)

  await page.locator('#tab-stats').click({ force: true });
  await expect(page.locator('#tab-stats')).toHaveAttribute('aria-selected', 'true');

  // Core content is visible and there is no full-screen loading fallback.
  await expect(page.locator('#tab-panel .stat-tile').first()).toBeVisible({ timeout: 5000 });
  await expect(page.locator('#tab-panel .loading')).toHaveCount(0);

  // The scorer/assist leaderboards eventually populate from the timelines.
  await expect(page.locator('.stat-board-scorers .stat-board-row').first()).toBeVisible({ timeout: 20000 });
});
test('bracket renders knockout matches with scores', async ({ page }) => {
  const errors = trackAppErrors(page);
  await page.goto('');
  await page.locator('#tab-bracket').click({ force: true });
  await expect(page.locator('#tab-bracket')).toHaveAttribute('aria-selected', 'true');
  const matches = page.locator('#tab-panel .bracket-match');
  await expect(matches.first()).toBeVisible({ timeout: 15000 });
  expect(await matches.count()).toBeGreaterThan(8); // R32+R16+QF+SF+F feeders
  // Completed knockout games expose real scores.
  expect(await page.locator('#tab-panel .bracket-score').count()).toBeGreaterThan(0);
  expect(errors, errors.join('\n')).toEqual([]);
});

// Gap 3: Stats leaderboards render rows from the bundled fallback dataset.
test('stats leaderboards render player rows', async ({ page }) => {
  const errors = trackAppErrors(page);
  await page.goto('');
  await page.locator('#tab-stats').click({ force: true });
  await expect(page.locator('#tab-stats')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#tab-panel .stat-board-row').first()).toBeVisible({ timeout: 15000 });
  expect(await page.locator('#tab-panel .stat-board-row').count()).toBeGreaterThan(0);
  expect(errors, errors.join('\n')).toEqual([]);
});

// Gap 4: once groups are decided, qualifiers are highlighted (no per-team badge),
// and a favorited team's stat grid is labelled a group-stage record.
test('standings highlight qualifiers + favorites label group-stage record', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('wc2026:followed-teams', JSON.stringify(['CAN']));
  });
  await page.goto('');
  await page.locator('#tab-standings').click({ force: true });
  await expect(page.locator('#tab-panel tr.qualified').first()).toBeVisible({ timeout: 15000 });
  expect(await page.locator('#tab-panel tr.qualified').count()).toBeGreaterThanOrEqual(2);
  await page.locator('#tab-favorites').click({ force: true });
  await expect(page.locator('#tab-panel .team-stat-caption').first()).toContainText(/Group stage/i, { timeout: 15000 });
});

// Perf regression: with many favorite teams, the team-card grid must render
// from cheap cached core data (groups/matches/qual/form) and NOT block behind
// the expensive per-match player-stats aggregation. Previously the whole
// Favorites section spun on fetchPlayerStats(); now cards appear immediately and
// the Top Players sub-section fills in progressively.
test('Favorite teams grid renders without blocking on player-stats aggregation', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'wc2026:followed-teams',
      JSON.stringify(['BRA', 'ARG', 'FRA', 'ENG', 'ESP', 'GER', 'POR', 'NED', 'CRO', 'MEX'])
    );
  });
  await page.goto('');
  await page.locator('#tab-favorites').click({ force: true });
  await expect(page.locator('#tab-favorites')).toHaveAttribute('aria-selected', 'true');

  // Multiple team cards render, each with its group-stage stat grid — core data
  // only, no dependency on the timeline aggregation.
  const cards = page.locator('#tab-panel .team-card');
  await expect(cards.first()).toBeVisible({ timeout: 15000 });
  expect(await cards.count()).toBeGreaterThanOrEqual(3);
  await expect(page.locator('#tab-panel .team-stat-caption').first()).toBeVisible();
  // The full-section "loading team details" spinner must be gone once cards show.
  await expect(page.locator('#tab-panel .favorites-loading')).toHaveCount(0);
});

// Regression: every Schedule match must sit under the correct stage header.
// A single calendar day can span two stages (e.g. the final Round of 32 game
// and the first Round of 16 game), so a Round of 16 fixture must never appear
// in the Round of 32 section. Verify per-match stage alignment + monotonic order.
test('schedule groups every match under its correct stage section', async ({ page }) => {
  const errors = trackAppErrors(page);
  await page.goto('');
  await page.locator('#tab-schedule').click({ force: true });
  await expect(page.locator('#tab-schedule')).toHaveAttribute('aria-selected', 'true');

  const bucket = (s: string): string => {
    if (s.startsWith('Group')) return 'group';
    if (s === 'Round of 32') return 'r32';
    if (s === 'Round of 16') return 'r16';
    if (s === 'Quarter-final') return 'qf';
    if (s === 'Semi-final') return 'sf';
    if (s === 'Third place play-off') return 'third';
    if (s === 'Final') return 'final';
    return s;
  };
  const order = ['group', 'r32', 'r16', 'qf', 'sf', 'third', 'final'];

  const groups = page.locator('#tab-panel .schedule-date-group');
  await expect(groups.first()).toBeVisible({ timeout: 15000 });
  const count = await groups.count();
  expect(count).toBeGreaterThan(0);

  let lastIdx = -1;
  for (let i = 0; i < count; i++) {
    const g = groups.nth(i);
    const sectionStage = bucket(String(await g.getAttribute('data-stage')));
    const idx = order.indexOf(sectionStage);
    expect(idx, `unknown/out-of-order section stage at #${i}`).toBeGreaterThanOrEqual(lastIdx);
    lastIdx = idx;
    const cards = g.locator('.card[data-stage]');
    const cc = await cards.count();
    for (let j = 0; j < cc; j++) {
      const matchStage = bucket(String(await cards.nth(j).getAttribute('data-stage')));
      expect(matchStage, `match #${j} mislabeled under ${sectionStage}`).toBe(sectionStage);
    }
  }
  expect(errors, errors.join('\n')).toEqual([]);
});

