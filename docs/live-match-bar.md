# Live Match Bar

A persistent, real-time **Live Match** experience that follows the visitor while
they browse the site: a compact top bar on mobile (Dynamic-Island / Live-Activity
feel, implemented in the page) and a floating top-right panel on desktop. It
shows the live score, clock and status, expands to a full detail panel, lets the
user switch between simultaneous live matches, follow a match, and opt into
client-side notifications.

It reuses everything the app already has — no new backend, no new data source, no
extra network traffic.

---

## How real-time updates work

The bar does **not** open its own connection. The app already polls
`fetchCurrentMatches()` every 15s via `useLiveData(..., 'currentMatches')` in
`App.tsx`. Those live matches (and the poll's `lastUpdated`) are handed to
`<LiveMatchBar>` as props, so the bar is driven by the **existing** SWR cache and
poll — zero additional requests.

```
FIFA calendar/live/timeline  ──►  useLiveData('currentMatches', 15s)  ──►  App
                                                                    │  liveMatches + lastUpdated (props)
                                                                    ▼
                                             useLiveMatchBar  ──►  <LiveMatchBar>
```

Data flow inside `src/live/`:

| Module | Responsibility |
|--------|----------------|
| `useLiveMatchBar.ts` | Orchestration: which match is shown, the switcher list, connection freshness, the per-match event feed, and the events detected on each tick. |
| `matchTimeline.ts` | **Pure** diff engine. `diffMatchEvents(prev, next)` derives goals, penalty-shootout tally and status transitions (kickoff / half-time / second-half / extra-time / full-time / shootout) from two `Match` snapshots. This is the single extension point for a richer FIFA timeline (named scorers, cards, subs, VAR). |
| `useFollowedMatches.ts` | `localStorage`-backed followed-match ids + the selected live match, mirroring `useFollowedTeams`. |
| `notifications.ts` | Notification settings store, permission flow, and the pure gate/content builders. |
| `analytics.ts` | No-PII `track(event, props?)` shim (CustomEvent + optional `window.dataLayer`). |
| `nativeBridge.ts` | Typed seam to a native wrapper's Live Activity / Live Update (see [native-live-activities.md](native-live-activities.md)). |
| `registerSW.ts` | Registers `public/sw.js` in production. |

### Stale-safe event detection (no replayed goals)

The bar reuses the **exact** armed-gate used by the full-time celebration toasts
(`canEmitAlert` / `nextArmed`, exported from `hooks/useMatchAlerts.ts`). Because
both live streams are SWR-cached, on resume from the background the cached
pre-background score is seen first and then the fresh one; without a gate the diff
would replay off-screen goals. The bar therefore **disarms** on
`visibilitychange` / `focus` / `online` / `pageshow` and only re-arms after a
network-fresh snapshot taken while the page is visible. It also shows a subtle
`reconnecting` state once `lastUpdated` is older than 35s.

### Full-time handling

`fetchCurrentMatches()` only returns `in_progress` / `half_time` matches, so a
finished match **disappears** from the poll rather than arriving as `completed`.
`useLiveMatchBar` detects that disappearance, synthesizes a `fullTime` event from
the last-seen snapshot, and lingers on a FULL-TIME card for
`FULL_TIME_LINGER_MS` (2 min) when nothing else is live, then auto-dismisses.

---

## States supported

Upcoming / starting-soon, live 1st half, half-time, live 2nd half, extra time,
penalty shootout, suspended, delayed, postponed, cancelled, full-time, plus the
transport states **no-connection** and **stale data**. Match status labels come
from the shared `getStatusLabel`, so the bar reads identically to the rest of the
site (including `AET` / penalties).

## Multiple live matches

The most-relevant/selected match shows in the bar; a `+N` badge shows how many
others are live; the expanded panel has a **Next live match** switch. The chosen
match id is remembered in `localStorage` (`wc2026:selected-live-match`).

## Accessibility, RTL, theming, motion

- Semantic `<button>` toggle + `role="group"` panel, full keyboard support,
  `Escape` closes, focus moves into the panel and back to the toggle.
- Score/status changes are announced **once** via a polite `aria-live` region
  (never repeatedly interrupting).
- Works under `dir="rtl"` (Hebrew) and matches the site's dark theme.
- All animation is gated behind `prefers-reduced-motion`.
- The fixed container is `pointer-events:none` with `pointer-events:auto`
  children, so it never blocks navigation, and honours
  `env(safe-area-inset-top)` for notch / Dynamic-Island devices.

## Analytics

`track()` emits (no personal data): `live_bar_displayed`, `live_bar_expanded`,
`live_bar_collapsed`, `live_bar_match_switched`, `live_bar_match_followed` /
`_unfollowed`, `live_bar_notifications_requested` / `_accepted` / `_rejected`,
`live_bar_full_match_opened`. Each is a `CustomEvent('wc-analytics')` on `window`
and, if present, a `window.dataLayer.push` — so an existing GA/GTM setup can
consume them without new code.

---

## PWA & notifications

- **Manifest / icons** already existed (`public/manifest.webmanifest`,
  `icon-192/512`). This feature adds a conservative **service worker**
  (`public/sw.js`) registered only in production. It intercepts **only**
  same-origin navigations (network-first with an offline fallback) and passes
  every asset and the cross-origin FIFA API straight through, so caching and
  Playwright route mocks are unaffected.
- **Notifications are client-side**, fired from the running page / SW
  `showNotification` — **not** server Web Push. Permission is requested **only**
  after a user action (following a match while permission is `default`). Users
  pick per-category events (goals, cards, kickoff, half-time, full-time,
  shootout) in the panel.

> **Why not real Web Push?** A static GitHub Pages site has no backend to run a
> push service or hold VAPID keys. The service worker ships a documented `push`
> handler as the seam: point it at a real push backend later and follow-a-match
> becomes true server push with no UI change.

---

## Environment variables

**None.** The feature adds no env vars, no database, and no build config changes.

## Testing it locally

```bash
npm run build && npm run preview   # http://localhost:4173/fifa26/
```

- **Automated:** `tests/live-match-bar.spec.ts` (pure event/gate/notification
  logic, all projects) and `tests/live-match-bar-ui.spec.ts` (rendered bar,
  expand, switch, RTL, reduced-motion, desktop-vs-mobile layout, settings
  persistence — chromium). Both drive the **real** app with a mocked FIFA
  calendar that makes curated fixtures live (the live-overlay pattern).
- **Manual:** to see the bar without waiting for a real live match, open
  DevTools and mock the FIFA `calendar/matches` response (set `MatchStatus:3`,
  `Period:5` on a fixture), or run the UI spec in headed mode:
  `npx playwright test live-match-bar-ui.spec.ts --project=chromium --headed`.
- **Mobile vs desktop:** resize below/above 768px (or use device emulation).
  Mobile pins a centred bar to the top under the safe-area inset; desktop floats
  a panel in the top-right.

## Limitations (honest)

- **No server push** (needs a backend + VAPID). Client-side notifications only
  fire while a tab is alive. Seam: `sw.js` `push` handler.
- **No native Live Activities / Live Updates** from a browser — that needs a
  native wrapper. The typed bridge + step-by-step guide are ready:
  [native-live-activities.md](native-live-activities.md).
- **Named scorers / cards / subs / VAR** in the feed are the documented
  extension point in `matchTimeline.ts`. Today the feed is derived reliably from
  score/status transitions; wiring the FIFA `timelines/<match>` endpoint (keyed
  by `IdMatch`) into `diffMatchEvents` adds the named detail without touching the
  rest of the bar.
