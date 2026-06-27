#!/usr/bin/env node
// Local real-browser concurrency test (no cloud account needed).
//
// Launches REAL Chromium pages in parallel against a LOCAL prod preview build,
// each in an isolated context (a distinct "user"), loads the app, clicks every
// tab, and reports load time / failures / console errors.
//
// NOTE: bounded by your machine's RAM (each real page ~50-150 MB). For
// large-scale (1000+) real-browser tests, fan out across a cloud device farm.
//
// Usage (PowerShell), after `npm run build` and starting `vite preview --port 4173`:
//   node loadtest/local-concurrency.mjs
//
// Env vars:
//   TARGET_URL  default http://localhost:4173/fifa26/
//   PARALLEL    concurrent real pages per wave (default 15 — keep low on <8GB RAM)
//   WAVES       number of waves                (default 8)

import { chromium } from 'playwright';

const TARGET_URL = process.env.TARGET_URL || 'http://localhost:4173/fifa26/';
const PARALLEL = parseInt(process.env.PARALLEL || '15', 10);
const WAVES = parseInt(process.env.WAVES || '8', 10);
const TABS = ['live', 'standings', 'stats', 'bracket', 'schedule', 'favorites'];

async function main() {
  console.log('=== local real-browser concurrency test ===');
  console.log('target   :', TARGET_URL);
  console.log('parallel :', PARALLEL, ' waves:', WAVES, ` => ${PARALLEL * WAVES} sessions`);

  const browser = await chromium.launch();
  const times = [];
  let appErrors = 0, otherErrors = 0, fails = 0;
  const t0 = Date.now();

  for (let w = 0; w < WAVES; w++) {
    const jobs = Array.from({ length: PARALLEL }).map(async () => {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      const page = await ctx.newPage();
      page.on('console', (m) => {
        if (m.type() !== 'error') return;
        const t = m.text();
        if (/message channel closed|chrome-extension/i.test(t)) otherErrors++;
        else appErrors++;
      });
      const s = Date.now();
      try {
        await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.locator('header').first().waitFor({ timeout: 15000 });
        for (const tab of TABS) {
          await page.locator('#tab-' + tab).click({ force: true }).catch(() => {});
          await page.waitForTimeout(120);
        }
        times.push(Date.now() - s);
      } catch {
        fails++;
      }
      await ctx.close();
    });
    await Promise.all(jobs);
    console.log(`wave ${w + 1}/${WAVES} done (${times.length} ok, ${fails} failed)`);
  }

  const total = Date.now() - t0;
  await browser.close();
  times.sort((a, b) => a - b);
  const pct = (q) => (times.length ? times[Math.min(times.length - 1, Math.floor(times.length * q))] : 0);
  const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;

  console.log('\n--- RESULT ---');
  console.log('sessions OK / failed :', times.length, '/', fails);
  console.log('wall-clock total     :', (total / 1000).toFixed(1) + 's');
  console.log('load+6-tab avg       :', avg + 'ms', ' p50', pct(0.5) + 'ms', ' p95', pct(0.95) + 'ms', ' max', (times[times.length - 1] || 0) + 'ms');
  console.log('app console errors   :', appErrors);
  console.log('extension/other errs :', otherErrors);
  process.exit(fails || appErrors ? 1 : 0);
}

main().catch((e) => {
  console.error('fatal:', e);
  process.exit(1);
});
