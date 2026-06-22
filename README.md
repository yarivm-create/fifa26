# ⚽ FIFA World Cup 2026 — Live Dashboard

A stunning real-time World Cup 2026 dashboard with all 104 matches, live scores, and Israel timezone support.

🔗 **Live Site:** [https://yarivm-create.github.io/fifa26/](https://yarivm-create.github.io/fifa26/)  
📺 **Kan Coverage:** [https://www.kan.org.il/lobby/worldcup2026/](https://www.kan.org.il/lobby/worldcup2026/)

![Live Dashboard](https://img.shields.io/badge/Status-Live-red?style=flat-square)
![Matches](https://img.shields.io/badge/Matches-104-gold?style=flat-square)
![React 19](https://img.shields.io/badge/React-19-blue?style=flat-square)

## Features

- 🕐 **Live Israel Time Clock** — Real-time clock updating every second (Asia/Jerusalem timezone)
- 🔴 **Live Scores** — Auto-refreshing every 15 seconds during live matches with pulsing indicators
- 📋 **Yesterday / Today / Tomorrow / Day After** — All matches organized by Israel date
- 🏆 **Group Standings** — Real-time group tables with all stats
- 📅 **Full Schedule** — All 104 matches from FIFA.com across 16 venues, grouped by stage
- ⏰ **All Times in Israel Timezone** — GMT+3 (IDT) for all match kickoff times
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
- **Timezone**: All display times converted to Israel (Asia/Jerusalem, GMT+3)
- **Styling**: Custom CSS with FIFA 2026 theming — dark mode, gradient borders, animations
- **Deployment**: GitHub Pages at `/fifa26/`

## Data Source

All 104 matches of the FIFA World Cup 2026™ with real scores and schedules.
Times are stored in UTC and displayed in Israel time (IDT, GMT+3).

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
