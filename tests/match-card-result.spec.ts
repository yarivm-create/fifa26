import { test, expect } from '@playwright/test';

// The reported inconsistency: ET/penalty cards had a "who won" line but plain
// wins did not. This guards that EVERY finished match card (any result kind)
// carries the result note, so no card is left with a different design.
async function assertEveryFinishedCardHasNote(page) {
  const cards = page.locator('#tab-panel .card');
  const n = await cards.count();
  let finished = 0;
  for (let i = 0; i < n; i++) {
    const card = cards.nth(i);
    const status = (await card.locator('.match-status').innerText().catch(() => '')).trim();
    // A completed match shows the FULL TIME label (live cards never do).
    if (/FULL TIME/i.test(status)) {
      finished++;
      await expect(card.locator('.match-decided'), `finished card #${i} has a result note`).toHaveCount(1);
      const note = (await card.locator('.match-decided').innerText()).trim();
      expect(note.length, `finished card #${i} note is non-empty`).toBeGreaterThan(0);
    }
  }
  return finished;
}

test('every finished card on the Today/Live tab shows a who-won/result line', async ({ page }) => {
  await page.goto('');
  await expect(page.locator('#tab-panel .card').first()).toBeVisible({ timeout: 15000 });
  await assertEveryFinishedCardHasNote(page);
});

test('every finished card on the Schedule tab shows a who-won/result line', async ({ page }) => {
  await page.goto('');
  await page.locator('#tab-schedule').click({ force: true });
  await expect(page.locator('#tab-panel .card').first()).toBeVisible({ timeout: 15000 });
  const finished = await assertEveryFinishedCardHasNote(page);
  // The schedule lists the whole tournament, so at least one finished tie exists
  // — proving the note actually renders (not a vacuous pass).
  expect(finished, 'schedule shows at least one finished match').toBeGreaterThan(0);
});
