import { test, expect, type Page } from '@playwright/test';
import { selectTab } from './tab-helpers';

// The reported inconsistency: ET/penalty cards had a "who won" line but plain
// wins did not. This guards that EVERY finished match card (any result kind)
// carries the result note, so no card is left with a different design.
async function assertEveryFinishedCardHasNote(page: Page, opts: { requireFinished?: boolean } = {}) {
  const { requireFinished = false } = opts;
  // Read every card's status + result-note in ONE atomic DOM pass and retry the
  // whole invariant until it holds. This avoids two flake sources the earlier
  // per-card loop had: (a) dozens of sequential locator round-trips (plus 5s
  // toHaveCount retries) that could blow the 60s test timeout on CI when many
  // cards are finished, and (b) racing the live overlay, which flips a card to
  // FULL TIME and fills its result note together, but a moment after the first
  // cards paint. A completed match with no note is a real bug, so it still fails.
  await expect(async () => {
    const rows = await page.locator('#tab-panel .card').evaluateAll((els) =>
      els.map((el) => ({
        // A completed match shows the FULL TIME label (live cards never do).
        finished: /FULL TIME/i.test(el.querySelector('.match-status')?.textContent || ''),
        note: (el.querySelector('.match-decided')?.textContent || '').trim(),
      })),
    );
    const finished = rows.filter((r) => r.finished);
    if (requireFinished) {
      // The schedule lists the whole tournament, so at least one finished tie
      // exists once the overlay applies — proving the note actually renders.
      expect(finished.length, 'shows at least one finished match').toBeGreaterThan(0);
    }
    finished.forEach((r, i) => {
      expect(r.note.length, `finished card #${i} carries a non-empty result note`).toBeGreaterThan(0);
    });
  }).toPass({ timeout: 20000 });
}

test('every finished card on the Today/Live tab shows a who-won/result line', async ({ page }) => {
  await page.goto('');
  // Once the tournament is over the Live/Today tab is retired in favour of the
  // end-of-tournament recap, which has no match cards — the who-won invariant is
  // still enforced on the Schedule tab below. The champion banner is the
  // definitive end-of-tournament signal from the live feed (it renders only when
  // the Final is complete), so key off it rather than a transient card count.
  const tournamentOver = await page
    .locator('.champion-banner')
    .waitFor({ state: 'visible', timeout: 10000 })
    .then(() => true)
    .catch(() => false);
  if (tournamentOver) {
    await expect(page.locator('.tournament-summary')).toBeVisible();
    return;
  }
  await expect(page.locator('#tab-panel .card').first()).toBeVisible({ timeout: 15000 });
  await assertEveryFinishedCardHasNote(page);
});

test('every finished card on the Schedule tab shows a who-won/result line', async ({ page }) => {
  await page.goto('');
  await selectTab(page, 'schedule');
  await expect(page.locator('#tab-panel .card').first()).toBeVisible({ timeout: 15000 });
  await assertEveryFinishedCardHasNote(page, { requireFinished: true });
});
