# ⚽ FIFA World Cup 2026 — Live Dashboard

A stunning real-time World Cup 2026 dashboard with all 104 matches, live scores, and automatic local-timezone support.

🔗 **Live Site:** [https://yarivm-create.github.io/fifa26/](https://yarivm-create.github.io/fifa26/)  
📺 **Kan Coverage:** [https://www.kan.org.il/lobby/worldcup2026/](https://www.kan.org.il/lobby/worldcup2026/)

![Live Dashboard](https://img.shields.io/badge/Status-Live-red?style=flat-square)
![Matches](https://img.shields.io/badge/Matches-104-gold?style=flat-square)
![React 19](https://img.shields.io/badge/React-19-blue?style=flat-square)

## Features

- 🕐 **Live Local Time Clock** — Real-time clock updating every second in the visitor's own timezone, shown with their country flag
- 🔴 **Live Scores** — Auto-refreshing every 15 seconds during live matches with pulsing indicators
- 📺 **Kan 11 Broadcast Links** — Live and completed match cards link out to Kan's World Cup hub ("Live Match Center" while live, "Match Recap & Highlights" once finished)
- ⏭️ **Next Up** — The two soonest upcoming fixtures highlighted above Today (they also stay listed in their normal day sections)
- 📋 **Yesterday / Today / Tomorrow / Day After** — All matches organized by the visitor's local date
- 🎉 **Full-Time Celebrations** — When matches finish, a toast per game shows the winner (or draw) with the final score, plus a whistle sound (first game); multiple simultaneous finishes each get their own toast
- 🏆 **Group Standings** — Real-time group tables with all stats
- 🥇 **Qualification Tracking** — Group/3rd-place teams that reach the Round of 32 show a "✓ Through" badge instead of a probability %
- 🌳 **Knockout Bracket** — Tree view where each Round-of-16 card sits centered between its two feeding Round-of-32 games, with connector lines (RTL-aware)
- ⭐ **Favorites** — Follow players and teams (star toggle on the standings table and the stats list too); followed players are listed before favorite teams, each with their next/recent fixtures and key stats
- 📈 **Player Stats** — Top scorers and assists
- 📅 **Full Schedule** — All 104 matches from FIFA.com across 16 venues, grouped by stage
- ⏰ **Everything in Your Local Timezone** — Every time on the site (header clock, match kickoffs, dates, schedule, live ticks) auto-converts to the visitor's own browser timezone, with their country flag shown next to the clock — no manual setting needed
- 📱 **Mobile-Friendly Responsive Design** — Single column, large touch targets, big scores
- ⚡ **Auto-Updating Sections** — Live=15s, Today/Tomorrow=60s, Schedule=5min
- 🌙 **Dark Theme** — Rich maroon, gold, and navy with FIFA 2026 branding
- 🌐 **Bilingual (English / עברית)** — One-tap language toggle with full right-to-left (RTL) layout for Hebrew; choice persists across reloads
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
Live data is pulled from the FIFA API and automatically falls back to a bundled 104-match dataset when the API is unavailable.
Times are stored in UTC and every time shown on the site is displayed in each visitor's local timezone (auto-detected from the browser).

| Section | Data | Refresh Rate |
|---------|------|-------------|
| Live Now | Matches in progress | 15s |
| Today/Tomorrow/Day After | Scheduled + completed | 60s |
| Full Schedule | All 104 matches | 5min |
| Standings | Group tables | 2min |

## Project Structure

```
worldcup2026-app/
├── src/
│   ├── api/                    # Data layer
│   │   ├── liveData.ts         # Live FIFA data fetch + player stats
│   │   ├── mockData.ts         # 104-match fallback dataset (UTC)
│   │   ├── worldcup.ts         # fetchGroups/Matches/Qualification/Form/Stats
│   │   ├── qualification.ts    # Group + 3rd-place "Through" logic
│   │   ├── stats.ts            # Top scorers / assists
│   │   └── types.ts            # Shared types
│   ├── components/             # React UI components
│   │   ├── LiveMatches.tsx     # Live & Today tab (Next Up + day sections)
│   │   ├── Schedule.tsx        # Full 104-match schedule
│   │   ├── Standings.tsx       # Group standings (+ GroupTable.tsx)
│   │   ├── Stats.tsx           # Top scorers / assists
│   │   ├── Bracket.tsx         # Knockout bracket tree (centered feeders)
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

End-to-end smoke tests run with Playwright across desktop (Chromium, Firefox, WebKit) and mobile (Pixel 7, iPhone 14) projects:

```bash
npm run test:e2e
```

CI runs the same suite on every push to `main` (`.github/workflows/e2e.yml`), alongside the GitHub Pages deploy (`deploy.yml`).

## License

ISC
