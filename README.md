# ⚽ FIFA World Cup 2026 — Live Dashboard

A real-time World Cup 2026 dashboard built as a **Microsoft Fabric App** using the **Rayfin CLI**.

![Live Dashboard](https://img.shields.io/badge/Status-Live-red?style=flat-square)
![Rayfin](https://img.shields.io/badge/Powered%20by-Rayfin%20CLI-blue?style=flat-square)
![Fabric](https://img.shields.io/badge/Platform-Microsoft%20Fabric-purple?style=flat-square)

## Features

- 🔴 **Live Scores** — Auto-refreshing every 15 seconds during live matches
- 🏆 **Group Standings** — Real-time group tables with all stats
- 📅 **Full Schedule** — All 104 matches across 16 venues
- 📱 **Responsive** — Works on desktop and mobile
- ⚡ **Fast** — Vite + React for instant updates

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- (Optional) Microsoft Fabric workspace for cloud deployment

### Run Locally

```bash
cd worldcup2026-app
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

### Deploy to Microsoft Fabric

```bash
# Sign in to Fabric
npx rayfin login

# Deploy the app
npx rayfin up
```

## Data Source

This app uses the free [WorldCupJSON API](https://worldcupjson.net/) for real-time match data.
No API key required.

| Endpoint | Data | Refresh Rate |
|----------|------|-------------|
| `/matches/current` | Live matches in progress | 15s |
| `/matches/today` | Today's schedule | 60s |
| `/matches` | Full tournament schedule | 5min |
| `/teams` | Group standings | 2min |

## Project Structure

```
worldcup2026-app/
├── rayfin/
│   ├── rayfin.yml      # Fabric App config & data model
│   └── .env            # Workspace settings
├── src/
│   ├── api/            # API client & types
│   ├── components/     # React UI components
│   ├── hooks/          # Custom hooks (useLiveData)
│   └── styles/         # CSS with WC2026 theme
├── index.html
├── vite.config.ts
└── package.json
```

## Rayfin Integration

The `rayfin/rayfin.yml` defines the backend data model for caching match data in Fabric:

- **matches** — Match results and scores
- **teams** — Team info and flags
- **standings** — Group table calculations

To push schema changes: `npx rayfin up db apply`

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Microsoft Fabric (via Rayfin CLI)
- **Data**: WorldCupJSON REST API
- **Styling**: Custom CSS with FIFA 2026 theming

## License

ISC
