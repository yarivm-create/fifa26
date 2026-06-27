# Load & concurrency test — fifa26

A free, local real-browser harness for stress-testing the World Cup 2026
dashboard. It launches **real Chromium sessions** (real JS execution +
rendering), not just HTTP requests, so it exercises the actual app the way
users do.

## Local harness — `local-concurrency.mjs`

Launches real Chromium pages in parallel against a local **prod preview** build,
each in an isolated context (a distinct "user"), loads the app, clicks through
every tab, and reports load time / failures / console errors.

```powershell
npm run build
# start a prod preview in another shell:
node_modules\.bin\vite.cmd preview --port 4173
# then:
npm run loadtest:local
# tune concurrency: $env:PARALLEL=10; $env:WAVES=4; npm run loadtest:local
```

Env knobs: `TARGET_URL` (default `http://localhost:4173/fifa26/`), `PARALLEL`
(concurrent real pages per wave, default 15), `WAVES` (default 8).

## Scale limits — read this

Each real Chromium needs ~50–150 MB RAM, so a single machine can only run
~10–20 truly-concurrent real pages before thrashing. **"1000 real browsers on
one PC" is physically impossible** (it would need 50–150 GB RAM); genuine
large-scale real-browser tests fan out across a paid cloud device farm
(BrowserStack, Sauce Labs, LambdaTest).

You usually don't need that, because:

- **Static delivery auto-scales.** In production the app is served by GitHub
  Pages → Fastly CDN. Static HTML/JS/CSS are cached at edge PoPs with
  effectively unlimited concurrency — there's no origin server of yours to
  overload.
- **Render cost is per-browser.** Each user renders on their own device, so one
  user's experience is independent of how many others are online.
- **Only shared dependency is `api.fifa.com`** (public, client-side, already has
  graceful fallbacks).

### Free ways to push further (no paid account)

- **Wired into the E2E gate:** `npm run test:e2e` already runs an isolated
  concurrency pass (`tests/concurrency.spec.ts`) before every push.

- **HTTP-level load** (thousands of req/s, not real browsers): point
  [`autocannon`](https://github.com/mcollina/autocannon),
  [`k6`](https://k6.io), or [`Artillery`](https://www.artillery.io) at the local
  preview — e.g. `npx autocannon -c 100 -d 20 http://localhost:4173/fifa26/`.
  This measures static-serving throughput but does **not** run the app's JS.
- **More real browsers on CI**: run `local-concurrency.mjs` as a matrix job
  across several free CI runners to multiply total concurrency for free.
