import { test, expect } from '@playwright/test';
import { selectTab } from './tab-helpers';

// Regression for the reported "yellow on 1:1" bug: on a shootout-decided tie the
// regulation goals are level, so NEITHER goal may be gold-highlighted — only the
// deciding penalty score is. This guards every rendered bracket card at once.
test('bracket never golds a level goal on a shootout tie (only the penalty)', async ({ page }) => {
  await page.goto('');
  await selectTab(page, 'bracket');
  await expect(page.locator('.bracket-column').first()).toBeVisible({ timeout: 15000 });

  // Any score cell that shows a penalty "(n)" is a shootout tie.
  const penScores = page.locator('.bracket-score:has(.bracket-pen)');
  const count = await penScores.count();
  for (let i = 0; i < count; i++) {
    const cell = penScores.nth(i);
    // The goal must NOT carry the winner-gold class on a shootout tie...
    await expect(cell).not.toHaveClass(/bracket-score-winner/);
  }
  // ...and the winning side's penalty IS the highlighted score.
  if (count > 0) {
    expect(await page.locator('.bracket-pen-winner').count()).toBeGreaterThan(0);
  }
});
