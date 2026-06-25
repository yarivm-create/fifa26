import React, { useState, useCallback, Suspense, lazy } from 'react';
import { LiveMatches } from './components/LiveMatches';
import { OnlineCounter } from './components/OnlineCounter';
import { OfflineBanner } from './components/OfflineBanner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Fireworks, WhistleToast } from './components/Celebrations';
import { LocalClock } from './utils/localTime';
import { ShareButton } from './components/ShareButton';
import { useLiveData } from './hooks/useLiveData';
import { useMatchAlerts } from './hooks/useMatchAlerts';
import { fetchCurrentMatches, fetchAllMatches } from './api/worldcup';
import { Match } from './api/types';

// Secondary tabs are code-split so the initial load only ships the Live screen.
const Standings = lazy(() => import('./components/Standings').then(m => ({ default: m.Standings })));
const Stats = lazy(() => import('./components/Stats').then(m => ({ default: m.Stats })));
const Bracket = lazy(() => import('./components/Bracket').then(m => ({ default: m.Bracket })));
const Schedule = lazy(() => import('./components/Schedule').then(m => ({ default: m.Schedule })));
const Favorites = lazy(() => import('./components/Favorites').then(m => ({ default: m.Favorites })));

type Tab = 'live' | 'standings' | 'stats' | 'bracket' | 'schedule' | 'favorites';

const TABS: { key: Tab; label: string }[] = [
  { key: 'live', label: '🔴 Live & Today' },
  { key: 'standings', label: '🏆 Standings' },
  { key: 'stats', label: '📊 Stats' },
  { key: 'bracket', label: '🗺️ Bracket' },
  { key: 'schedule', label: '📅 Schedule' },
  { key: 'favorites', label: '⭐ My Favorites' },
];

const TabFallback: React.FC = () => (
  <div className="loading">
    <div className="spinner" />
    <p>Loading…</p>
  </div>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('live');

  // Tournament-wide live detection for goal / match-end celebrations (any tab).
  const liveFetcher = useCallback(() => fetchCurrentMatches(), []);
  const allFetcher = useCallback(() => fetchAllMatches(), []);
  const { data: liveMatches } = useLiveData<Match[]>(liveFetcher, 15000);
  const { data: allMatches } = useLiveData<Match[]>(allFetcher, 60000);
  const { goalKey, whistleKey } = useMatchAlerts(liveMatches, allMatches);

  // Roving-tabindex keyboard support for the WAI-ARIA tab list.
  const onTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    let next = index;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % TABS.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (index - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    else return;
    e.preventDefault();
    setActiveTab(TABS[next].key);
    document.getElementById(`tab-${TABS[next].key}`)?.focus();
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'live': return <LiveMatches />;
      case 'standings': return <Standings />;
      case 'stats': return <Stats />;
      case 'bracket': return <Bracket />;
      case 'schedule': return <Schedule />;
      case 'favorites': return <Favorites />;
    }
  };

  return (
    <div className="app">
      <OfflineBanner />
      <header className="header">
        <h1>⚽ FIFA World Cup 2026</h1>
        <p className="subtitle">
          United States • Mexico • Canada
        </p>
        <div className="live-indicator">
          <span className="live-dot" aria-hidden="true" />
          LIVE DASHBOARD
        </div>
        <div className="header-clock-wrap">
          <LocalClock />
        </div>
        <div className="header-actions">
          <OnlineCounter />
          <ShareButton />
        </div>
      </header>

      <nav className="nav" role="tablist" aria-label="Dashboard sections">
        {TABS.map((t, i) => (
          <button
            key={t.key}
            id={`tab-${t.key}`}
            role="tab"
            type="button"
            aria-selected={activeTab === t.key}
            aria-controls="tab-panel"
            tabIndex={activeTab === t.key ? 0 : -1}
            className={activeTab === t.key ? 'active' : ''}
            onClick={() => setActiveTab(t.key)}
            onKeyDown={(e) => onTabKeyDown(e, i)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main>
        <div id="tab-panel" role="tabpanel" aria-labelledby={`tab-${activeTab}`} tabIndex={-1}>
          <ErrorBoundary label={TABS.find(t => t.key === activeTab)?.label.replace(/^\S+\s/, '')}>
            <Suspense fallback={<TabFallback />}>
              {renderTab()}
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>

      {goalKey > 0 && <Fireworks key={`goal-${goalKey}`} />}
      {whistleKey > 0 && <WhistleToast key={`whistle-${whistleKey}`} />}
    </div>
  );
};

export default App;
