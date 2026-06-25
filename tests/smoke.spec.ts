import { test, expect } from '@playwright/test';

// Force a known timezone so the local-time flag assertion is deterministic.
// `reducedMotion: reduce` disables the app's pulse/celebration animations
// (see global.css) so tab buttons stay stable for clicks across all browsers.
test.use({ timezoneId: 'Asia/Jerusalem', locale: 'en-US', reducedMotion: 'reduce' });

const TABS = ['live', 'standings', 'stats', 'bracket', 'schedule', 'favorites'];

// Collect uncaught page errors, ignoring the one known + accepted third-party
// counter error (whos.amung.us uses eval(), blocked by our CSP on purpose).
function trackAppErrors(page: import('@playwright/test').Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => {
    const msg = String(e);
    if (!/eval/i.test(msg)) errors.push(msg);
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

test('share button is mobile-only and fires the native share sheet', async ({ page }) => {
  // Stub the Web Share API (Playwright engines don't implement it) so we can
  // verify the button only renders where native share exists and that it
  // invokes navigator.share with our canonical URL.
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
  await expect(share).toBeVisible();
  await share.click();

  const shared = await page.evaluate(
    () => (window as unknown as { __shared?: ShareData }).__shared
  );
  expect(shared?.url).toContain('/fifa26/');
});
