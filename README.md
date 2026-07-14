# ⚽ FIFA World Cup 2026 — Live Dashboard

A stunning real-time World Cup 2026 dashboard with all 104 matches, live scores, and automatic local-timezone support.

🔗 **Live Site:** [https://yarivm-create.github.io/fifa26/](https://yarivm-create.github.io/fifa26/)  
📺 **Kan Coverage:** [https://www.kan.org.il/lobby/worldcup2026/](https://www.kan.org.il/lobby/worldcup2026/)

![Live Dashboard](https://img.shields.io/badge/Status-Live-red?style=flat-square)
![Matches](https://img.shields.io/badge/Matches-104-gold?style=flat-square)
![React 19](https://img.shields.io/badge/React-19-blue?style=flat-square)

## Features

- 🕐 **Live Local Time Clock** — Real-time clock updating every second in the visitor's own timezone, shown with their country flag
- 🔴 **Live Scores** — Auto-refreshing every 15 seconds during live matches with pulsing indicators, plus an instant refresh when you return to the tab (bfcache `pageshow`) so scores are never stale. Returning from the background never replays a stale goal/full-time alert — the first post-resume refresh re-baselines silently
- 📺 **Kan 11 Broadcast Links** — Live and completed match cards link out to Kan's World Cup hub ("Live Match Center" while live, "Match Recap & Highlights" once finished)
- ⏭️ **Next Up** — The two soonest upcoming fixtures highlighted above Today (they also stay listed in their normal day sections)
- 📋 **Yesterday / Today / Tomorrow / Day After** — All matches organized by the visitor's local date
- 🎉 **Full-Time Celebrations** — When matches finish, a toast per game shows the winner (or draw) with the final score, plus a whistle sound (first game); multiple simultaneous finishes each get their own toast. Knockouts decided after 90' name the shootout winner and show the penalty score / "after extra time"
- 🥅 **Knockout Decisions** — Tied knockouts resolve correctly and identically on **every** tab (Live, Schedule, Bracket, Favorites, celebrations): cards show the shootout score next to the goals (e.g. `1 (4) - 1 (3)`), label the result `AET` / "won x-y on penalties", and highlight the real winner even at level goals. A live shootout shows a **PENALTIES** status
- 🏆 **Group Standings** — Real-time group tables with all stats. During the group stage each team shows a live "✓ qualified / % chance / ✕ out" prediction; once a group is mathematically decided the predictions drop and qualifiers (top 2 + best thirds) are simply highlighted
- 🌳 **Knockout Bracket** — Round-by-round columns where each round's cards are listed in kick-off order (the earliest Round-of-32 tie shows first). Match ids are aligned to the official FIFA MatchNumbers so every `W##` winner placeholder resolves to the right team, date and venue per the real draw
- ⭐ **Favorites** — Follow players and teams (star toggle on standings, stats leaderboards, and each team card's Top Players list); favorite team cards show live knockout state (Round of 16 → Final / Eliminated / 🏆) — a penalty loss correctly reads as eliminated — and every fixture listed in play order grouped under one stage header (Group / Round of 32 / Round of 16…) with ✓ win / ✕ loss results and the shootout score for tied knockouts; followed players appear first with their next fixture labelled by stage
- 📈 **Player & Team Stats** — Top scorers and assists, plus top-scoring-teams and best-defenses leaderboards aggregated across **all** stages (group through knockouts, not just the group stage), and goals broken down by every round (with upcoming counts)
- 📅 **Full Schedule** — All 104 matches from FIFA.com across 16 venues, split into accurate stage sections (each match sits under its true stage header even when a single day spans two stages)
- ⏰ **Everything in Your Local Timezone** — Every time on the site (header clock, match kickoffs, dates, schedule, live ticks) auto-converts to the visitor's own browser timezone, with their country flag shown next to the clock — no manual setting needed
- 📱 **Mobile-Friendly Responsive Design** — Single column, large touch targets, big scores
- ⚡ **Auto-Updating Sections** — Live + Today/Tomorrow=15s (so full-time results & celebrations appear right when a game ends), Schedule=5min
- 🌙 **Dark Theme** — Rich maroon, gold, and navy with FIFA 2026 branding
- 🌐 **Bilingual (English / Hebrew)** — One-tap EN ⇄ HE language toggle with full right-to-left (RTL) layout for Hebrew; choice persists across reloads
- 📤 **Share** — On mobile, a Share button opens the native share sheet with the site link
- 📴 **Offline Aware** — A banner appears when the device goes offline so users know why live data paused
- 👀 **Live Viewer Count** — "Watching now" counter via the whos.amung.us JSONP presence ping (no third-party tracker, CSP-safe)

## Quick Start

### Prerequisites

- Node.js 18+ and npm

### Run Locally

```bash
cd worldcup2026-app
npm install
npm run dev
```

Open http://localhost:3000/fifa26/ in your browser (the app is served under the `/fifa26/` base path).

### Build for Production

```bash
npm run build
```

### Lint

```bash
npm run lint
```

ESLint (flat config: TypeScript + React Hooks rules) also runs in CI on every push.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Data**: 104 matches sourced from FIFA.com (UTC timestamps)
- **Timezone**: Every displayed time across the site auto-converts to the visitor's own browser timezone (Intl-detected), with their country flag shown by the clock
- **Styling**: Custom CSS with FIFA 2026 theming — dark mode, gradient borders, animations, and an original generic gold champion's cup mark (header, favicon, standings, knockout placeholders)
- **Deployment**: GitHub Pages at `/fifa26/`

## Data Source

All 104 matches of the FIFA World Cup 2026™ with real scores and schedules.
Live data is pulled from the public FIFA API, with the bundled 104-match dataset as an automatic fallback when the API is unavailable. Three FIFA endpoints are used:

- **`calendar/matches`** — every match's score, status and schedule (the primary source for all tabs).
- **`live/football/<match>`** — per-match live detail, used to enrich an in-progress match with its real period and clock (so the status reads half-time / extra-time / penalties correctly), and as a scorer fallback when a just-finished match's timeline hasn't published its goals yet.
- **`timelines/<match>`** — per-match goal & assist events that build the scorer/assist leaderboards and per-player tallies.

Finished-match scorer stats are cached in the browser (localStorage) so repeat visits load instantly; the cache is version-stamped, so a match that was cached before its goals were published is automatically re-fetched. Times are stored in UTC and every time shown on the site is displayed in each visitor's local timezone (auto-detected from the browser).

| Section | Data | Refresh Rate |
|---------|------|-------------|
| Live Now | Matches in progress (score + live period/clock) | 15s |
| Today/Tomorrow/Day After | Scheduled + completed | 15s |
| Stats | Scorers, assists, team & defense boards | 1min |
| Favorites | Followed teams & players | 1min |
| Standings | Group tables | 2min |
| Bracket | Knockout rounds | 2min |
| Full Schedule | All 104 matches | 5min |

## Project Structure

```
worldcup2026-app/
├── src/
│   ├── api/                    # Data layer
│   │   ├── liveData.ts         # Live FIFA data fetch + player stats
│   │   ├── mockData.ts         # 104-match fallback dataset (UTC)
│   │   ├── worldcup.ts         # fetchGroups/Matches/Qualification/Form/Stats
│   │   ├── qualification.ts    # Top-2 + best-third advance %/decided logic
│   │   ├── stats.ts            # Scorers/assists + all-stages team leaderboards
│   │   └── types.ts            # Shared types
│   ├── components/             # React UI components
│   │   ├── LiveMatches.tsx     # Live & Today tab (Next Up + day sections)
│   │   ├── Schedule.tsx        # Full 104-match schedule
│   │   ├── Standings.tsx       # Group standings (+ GroupTable.tsx)
│   │   ├── Stats.tsx           # Scorers, assists, team/defense boards, goals by stage
│   │   ├── Bracket.tsx         # Knockout bracket (rounds in kick-off order)
│   │   ├── Favorites.tsx       # Favorites tab (Following + FavoriteTeams)
│   │   ├── Following.tsx       # Followed players
│   │   ├── FavoriteTeams.tsx   # Favorite teams
│   │   ├── MatchCard.tsx       # Individual match display
│   │   ├── Celebrations.tsx    # Full-time toasts (winner/score/whistle)
│   │   ├── LanguageToggle.tsx  # EN/HE toggle
│   │   ├── ShareButton.tsx     # Mobile native share
│   │   ├── OnlineCounter.tsx   # "Watching now" presence
│   │   ├── OfflineBanner.tsx   # Offline indicator
│   │   └── ErrorBoundary.tsx   # Per-tab error boundary
│   ├── hooks/                  # useLiveData, useMatchAlerts, useFollowedTeams/Players
│   ├── i18n/                   # English + Hebrew strings (RTL)
│   ├── utils/                  # localTime (visitor TZ + flag), flags, sound
│   ├── styles/                 # CSS with WC2026 dark theme
│   └── App.tsx                 # Tabs, header clock, full-time toast stack
├── tests/                      # Playwright E2E smoke tests
├── index.html
├── vite.config.ts
└── package.json
```

## Testing

End-to-end smoke tests run with Playwright across desktop (Chromium, Firefox, WebKit) and mobile (Pixel 7, iPhone 14) projects, including an automated accessibility gate (`tests/a11y.spec.ts`, axe-core WCAG 2.0/2.1 A & AA scan on every tab), a knockout-bracket draw gate (`tests/bracket-data.spec.ts`, which pins each card's two feeder matches to the official FIFA draw and asserts each round renders in kick-off order so a wrong bracket order can't regress), a result-interpretation gate (`tests/match-result.spec.ts`, which pins the shared penalty/extra-time winner logic so a tied knockout is never shown as a draw), and a live-overlay gate (`tests/live-overlay.spec.ts`, which pins how a FIFA score is mapped to extra-time / penalty results — including a reversed FIFA key that must swap each team's goals **and** penalties together):

```bash
npm run test:e2e
```

This runs in two passes: the fully-parallel smoke suite, then an isolated
concurrency gate (`tests/concurrency.spec.ts`, tagged `@load`) that opens
multiple real browser sessions at once and asserts they all render with zero app
errors. The gate runs with a single worker so it doesn't starve the other tests.
Tune the simulated user count with `CONCURRENCY_USERS` (default 10). For a
heavier ad-hoc load test see [`loadtest/`](loadtest/README.md).

CI runs the same suite on every push to `main` (`.github/workflows/e2e.yml`), alongside the GitHub Pages deploy (`deploy.yml`).

## License

ISC
