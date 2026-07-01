const { preview } = require('vite');
const { chromium } = require('@playwright/test');
(async () => {
  const server = await preview({ preview: { port: 4199 } });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto('http://localhost:4199/fifa26/');
  await page.waitForTimeout(1500);
  const liveDate = await page.evaluate(() => (document.querySelector('.match-card .match-datetime, .match-card')?.textContent||'').slice(0,80));
  await page.click('#tab-bracket');
  await page.waitForTimeout(1800);
  const brkTime = await page.evaluate(() => [...document.querySelectorAll('.bracket-match-time')].slice(0,3).map(e=>e.textContent.trim()));
  console.log('Bracket times:', JSON.stringify(brkTime));
  await page.screenshot({ path: '_wd.png', clip: {x:0,y:250,width:700,height:500} });
  await browser.close();
  await server.httpServer.close();
})();
