import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Automated accessibility gate. Scans each tab for WCAG 2.0/2.1 A & AA
// violations. Runs on chromium only (engine-agnostic results) so CI stays fast.
test.use({ timezoneId: 'Asia/Jerusalem', locale: 'en-US', reducedMotion: 'reduce' });

const TABS = ['live', 'standings', 'stats', 'bracket', 'schedule', 'favorites'];

test('no critical accessibility violations across tabs', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'axe scan runs on chromium only');
  await page.addInitScript(() => {
    localStorage.setItem('wc2026:followed-teams', JSON.stringify(['CAN']));
    localStorage.setItem('wc2026:followed-players', JSON.stringify(['1']));
  });
  await page.goto('');
  await page.waitForTimeout(7000); // allow live data + favorites to hydrate

  for (const key of TABS) {
    await page.locator(`#tab-${key}`).click({ force: true });
    await expect(page.locator('#tab-panel')).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical'
    );
    expect(serious, `${key}: ${serious.map((v) => v.id).join(', ')}`).toEqual([]);
  }
});
