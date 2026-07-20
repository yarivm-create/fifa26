import { test, expect } from '@playwright/test';
import { selectTab } from './tab-helpers';

// GEOMETRIC regression for the two bracket bugs that the data/DOM tests could
// not catch because they never measured rendered pixels:
//   1. "each 2 card are on each other" — feeder-pair cards overlapping.
//   2. "all the lines are broken" — connector verticals no longer meeting the
//      next-round card because a pair's centre drifted away from it.
// Both are pure layout failures, so we read getBoundingClientRect() of every
// card and assert (a) no two cards in a column overlap and (b) each next-round
// card is centred on the midpoint of its two feeder cards (which is exactly
// where the connector "]" must land).

type Box = { top: number; bottom: number; cy: number };

async function readColumns(page: import('@playwright/test').Page): Promise<Box[][]> {
  return page.evaluate(() => {
    const cols = Array.from(document.querySelectorAll('.bracket-column'));
    return cols.map((col) =>
      Array.from(col.querySelectorAll('.bracket-match')).map((c) => {
        const r = c.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, cy: (r.top + r.bottom) / 2 };
      })
    );
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto('');
  await selectTab(page, 'bracket');
  await expect(page.locator('.bracket-column').first()).toBeVisible({ timeout: 15000 });
  // Let the live bracket data load and lay out.
  await page.waitForTimeout(1200);
});

test('no two bracket cards overlap in any round', async ({ page }) => {
  const cols = await readColumns(page);
  for (let ci = 0; ci < cols.length; ci++) {
    const col = cols[ci];
    for (let i = 1; i < col.length; i++) {
      // A 1px tolerance absorbs sub-pixel rounding; anything more is a real
      // overlap (the venue/PENS line of one card hidden under the next).
      expect(
        col[i].top,
        `column ${ci} card ${i} (top ${col[i].top}) overlaps card ${i - 1} (bottom ${col[i - 1].bottom})`
      ).toBeGreaterThanOrEqual(col[i - 1].bottom - 1);
    }
  }
});

test('each next-round card is centred on its two feeder cards (connectors meet)', async ({ page }) => {
  const cols = await readColumns(page);
  // Walk every round except the last: card k of the next round is fed by cards
  // 2k and 2k+1 of the current round, so its centre must equal their midpoint.
  for (let ci = 0; ci < cols.length - 1; ci++) {
    const cur = cols[ci];
    const next = cols[ci + 1];
    // Only compare while the next round still pairs cleanly (skip a lone
    // third-place/final remnant column with no feeders below it).
    for (let k = 0; k < next.length && 2 * k + 1 < cur.length; k++) {
      const mid = (cur[2 * k].cy + cur[2 * k + 1].cy) / 2;
      expect(
        Math.abs(mid - next[k].cy),
        `round ${ci}->${ci + 1}: card ${k} centre ${Math.round(next[k].cy)} off feeder midpoint ${Math.round(mid)}`
      ).toBeLessThanOrEqual(16);
    }
  }
});
