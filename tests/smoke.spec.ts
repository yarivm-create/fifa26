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
  if (todayIdx >= 0) expect(upIdx).toBeLessThan(todayIdx);

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
