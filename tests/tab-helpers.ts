import { expect, type Page } from '@playwright/test';

// Activating a tab is racy on WebKit: once the tournament is over the champion
// banner mounts after the live feed resolves and shifts the nav down, so a
// single force-click can land on stale coordinates and be dropped. Retry the
// click until the tab reports selected, which is stable once the layout settles.
export async function selectTab(page: Page, key: string): Promise<void> {
  const tab = page.locator(`#tab-${key}`);
  await expect(async () => {
    await tab.click({ force: true });
    await expect(tab).toHaveAttribute('aria-selected', 'true', { timeout: 2000 });
  }).toPass({ timeout: 15000 });
}
