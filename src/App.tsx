import React, { useState, useEffect, useCallback, useDeferredValue, Suspense, lazy } from 'react';
import { LiveMatches } from './components/LiveMatches';
import { OnlineCounter } from './components/OnlineCounter';
import { OfflineBanner } from './components/OfflineBanner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Fireworks, WhistleStack } from './components/Celebrations';
import { LocalClock } from './utils/localTime';
import { ShareButton } from './components/ShareButton';
import { LanguageToggle } from './components/LanguageToggle';
import { Trophy } from './components/Trophy';
import { useI18n } from './i18n';
import { useLiveData, primeLiveData } from './hooks/useLiveData';
import { useMatchAlerts, MatchEndEvent } from './hooks/useMatchAlerts';
import { fetchCurrentMatches, fetchAllMatches, fetchGroups, fetchForm, fetchQualification } from './api/worldcup';
import { Match } from './api/types';

// Secondary tabs are code-split so the initial load only ships the Live screen.
const Standings = lazy(() => import('./components/Standings').then(m => ({ default: m.Standings })));
const Stats = lazy(() => import('./components/Stats').then(m => ({ default: m.Stats })));
const Bracket = lazy(() => import('./components/Bracket').then(m => ({ default: m.Bracket })));
const Schedule = lazy(() => import('./components/Schedule').then(m => ({ default: m.Schedule })));
const Favorites = lazy(() => import('./components/Favorites').then(m => ({ default: m.Favorites })));

type Tab = 'live' | 'standings' | 'stats' | 'bracket' | 'schedule' | 'favorites';

const TABS: { key: Tab; tkey: string }[] = [
  { key: 'live', tkey: 'tab.live' },
  { key: 'standings', tkey: 'tab.standings' },
  { key: 'stats', tkey: 'tab.stats' },
  { key: 'bracket', tkey: 'tab.bracket' },
  { key: 'schedule', tkey: 'tab.schedule' },
  { key: 'favorites', tkey: 'tab.favorites' },
];

const TabFallback: React.FC = () => {
  const { t } = useI18n();
  return (
    <div className="loading">
      <div className="spinner" />
      <p>{t('loading.generic')}</p>
    </div>
  );
};

const App: React.FC = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<Tab>('live');
  // The nav highlight (activeTab) updates urgently for instant feedback, but the
  // heavy code-split panel renders from a deferred copy. When the target tab's
  // chunk isn't ready yet React keeps showing the previous panel instead of the
  // Suspense "Loading…" fallback, so first visits don't flash a spinner.
  const deferredTab = useDeferredValue(activeTab);
  const selectTab = useCallback((key: Tab) => setActiveTab(key), []);

  // Reset scroll to the top whenever the user switches tabs so each panel
  // starts at the beginning rather than inheriting the previous scroll offset.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  // Tournament-wide live detection for goal / match-end celebrations (any tab).
  const liveFetcher = useCallback(() => fetchCurrentMatches(), []);
  const allFetcher = useCallback(() => fetchAllMatches(), []);
  const { data: liveMatches } = useLiveData<Match[]>(liveFetcher, 15000, 'currentMatches');
  const { data: allMatches } = useLiveData<Match[]>(allFetcher, 15000, 'matches');
  const { goalEvent, endEvents } = useMatchAlerts(liveMatches, allMatches);

  // After first paint, use idle time to (a) download the code-split tab chunks
  // and (b) warm each tab's data cache, so opening any tab for the first time
  // shows content instantly instead of a "Loading…" spinner.
  useEffect(() => {
    const warm = () => {
      import('./components/Standings');
      import('./components/Stats');
      import('./components/Bracket');
      import('./components/Schedule');
      import('./components/Favorites');
      // Warm the lightweight tabs whose data is derived from the calendar feed
      // we already fetch (≈0 extra network), so they open instantly. Stats is
      // deliberately excluded: it pulls ~80 per-match timelines (~3MB), so we
      // let it load on demand when the tab is opened (timelines then persist to
      // localStorage) instead of paying that cost on every page load.
      primeLiveData('groups', fetchGroups);
      primeLiveData('form', fetchForm);
      primeLiveData('qualification', fetchQualification);
    };
    const ric = (window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    }).requestIdleCallback;
    if (ric) {
      const id = ric(warm, { timeout: 3000 });
      return () => (window as unknown as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(id);
    }
    const timer = window.setTimeout(warm, 1500);
    return () => window.clearTimeout(timer);
  }, []);

  // Keep a live list of full-time toasts so several games ending together each
  // get their own celebration; each toast removes itself when it finishes.
  const [endToasts, setEndToasts] = useState<MatchEndEvent[]>([]);
  // A centered, unmissable full-time burst (like a goal) accompanies the
  // detailed bottom toasts so the end of a match isn't easy to miss.
  const [endBurstKey, setEndBurstKey] = useState(0);
  useEffect(() => {
    if (endEvents.length > 0) {
      setEndToasts((prev) => [...prev, ...endEvents]);
      setEndBurstKey((k) => k + 1);
    }
  }, [endEvents]);
  const dismissToast = useCallback(
    (key: number) => setEndToasts((prev) => prev.filter((e) => e.key !== key)),
    []
  );

  // Roving-tabindex keyboard support for the WAI-ARIA tab list.
  const onTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    let next: number;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % TABS.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (index - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    else return;
    e.preventDefault();
    selectTab(TABS[next].key);
    document.getElementById(`tab-${TABS[next].key}`)?.focus();
  };

  const renderTab = () => {
    switch (deferredTab) {
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
        <h1>
          <span className="title-ball" aria-hidden="true">⚽</span>{' '}
          <span className="title-grad">{t('app.title')}</span>
        </h1>
        <p className="subtitle">
          {t('app.subtitle')}
        </p>
        <div className="live-indicator">
          <span className="live-dot" aria-hidden="true" />
          {t('app.liveDashboard')}
        </div>
        <div className="header-clock-wrap">
          <LocalClock />
        </div>
        <div className="header-actions">
          <OnlineCounter />
          <ShareButton />
          <LanguageToggle />
        </div>
      </header>

      <nav className="nav" role="tablist" aria-label={t('nav.aria')}>
        {TABS.map((tab, i) => (
          <button
            key={tab.key}
            id={`tab-${tab.key}`}
            role="tab"
            type="button"
            aria-selected={activeTab === tab.key}
            aria-controls="tab-panel"
            tabIndex={activeTab === tab.key ? 0 : -1}
            className={activeTab === tab.key ? 'active' : ''}
            onClick={() => selectTab(tab.key)}
            onKeyDown={(e) => onTabKeyDown(e, i)}
          >
            {tab.key === 'standings' ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Trophy size={15} /> {t(tab.tkey)}
              </span>
            ) : (
              t(tab.tkey)
            )}
          </button>
        ))}
      </nav>

      <main>
        <div id="tab-panel" role="tabpanel" aria-labelledby={`tab-${activeTab}`} tabIndex={-1}>
          <ErrorBoundary label={t(TABS.find(tab => tab.key === activeTab)?.tkey ?? 'tab.live').replace(/^\S+\s/, '')}>
            <Suspense fallback={<TabFallback />}>
              {renderTab()}
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>

      {goalEvent && <Fireworks key={`goal-${goalEvent.key}`} goal={goalEvent} />}
      {endBurstKey > 0 && <Fireworks key={`end-${endBurstKey}`} label={t('fx.fullTime')} />}
      <WhistleStack events={endToasts} onDone={dismissToast} />
    </div>
  );
};

export default App;
