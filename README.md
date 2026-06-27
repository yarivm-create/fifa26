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
- ⏭️ **Next Up** — The two soonest upcoming fixtures highlighted above Today (they also stay listed in their normal day sections)
- 📋 **Yesterday / Today / Tomorrow / Day After** — All matches organized by the visitor's local date
- 🎉 **Full-Time Celebrations** — When matches finish, a toast per game shows the winner (or draw) with the final score; multiple simultaneous finishes each get their own toast
- 🏆 **Group Standings** — Real-time group tables with all stats
- 🥇 **Qualification Tracking** — Group/3rd-place teams that reach the Round of 32 show a "✓ Through" badge instead of a probability %
- 🌳 **Knockout Bracket** — Tree view where each Round-of-16 card sits centered between its two feeding Round-of-32 games, with connector lines (RTL-aware)
- ⭐ **Favorites** — Follow players and teams; followed players are listed before favorite teams
- 📈 **Player Stats** — Top scorers and assists
- 📅 **Full Schedule** — All 104 matches from FIFA.com across 16 venues, grouped by stage
- ⏰ **Times in Your Local Timezone** — Kickoff times auto-convert to the visitor's browser timezone (with a short label like GMT+3), no manual setting needed
- 📱 **Mobile-Friendly Responsive Design** — Single column, large touch targets, big scores
- ⚡ **Auto-Updating Sections** — Live=15s, Today/Tomorrow=60s, Schedule=5min
- 🌙 **Dark Theme** — Rich maroon, gold, and navy with FIFA 2026 branding

## Quick Start

### Prerequisites

- Node.js 18+ and npm

### Run Locally

```bash
cd worldcup2026-app
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

### Build for Production

```bash
npm run build
```

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Data**: 104 matches sourced from FIFA.com (UTC timestamps)
- **Timezone**: All display times auto-convert to the visitor's own browser timezone (Intl-detected), shown with their country flag
- **Styling**: Custom CSS with FIFA 2026 theming — dark mode, gradient borders, animations
- **Deployment**: GitHub Pages at `/fifa26/`

## Data Source

All 104 matches of the FIFA World Cup 2026™ with real scores and schedules.
Times are stored in UTC and displayed in each visitor's local timezone (auto-detected from the browser).

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
│   ├── api/            # API client, types, match data (104 matches)
│   ├── components/     # React UI components
│   │   ├── LiveMatches.tsx   # Live & Today tab with clock
│   │   ├── Schedule.tsx      # Full 104-match schedule
│   │   ├── MatchCard.tsx     # Individual match display
│   │   ├── Standings.tsx     # Group standings
│   │   └── GroupTable.tsx    # Group table component
│   ├── hooks/          # useLiveData auto-refresh hook
│   ├── styles/         # CSS with WC2026 dark theme
│   └── App.tsx         # Main app with header clock
├── index.html
├── vite.config.ts
└── package.json
```

## License

ISC
