import React, { useState, useEffect, useLayoutEffect, useCallback, useDeferredValue, Suspense, lazy } from 'react';
import { LiveMatches } from './components/LiveMatches';
import { OnlineCounter } from './components/OnlineCounter';
import { OfflineBanner } from './components/OfflineBanner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Fireworks, WhistleStack } from './components/Celebrations';
import { LocalClock } from './utils/localTime';
import { ShareButton } from './components/ShareButton';
import { LanguageToggle } from './components/LanguageToggle';
import { Trophy } from './components/Trophy';
import { ChampionBanner } from './components/ChampionBanner';
import { getChampion } from './utils/champion';
import { useI18n } from './i18n';
import { useLiveData, primeLiveData } from './hooks/useLiveData';
import { useMatchAlerts, MatchEndEvent } from './hooks/useMatchAlerts';
import { fetchCurrentMatches, fetchAllMatches, fetchGroups, fetchForm, fetchQualification, fetchPlayerStats, fetchFavTeamsCore } from './api/worldcup';
import { fetchStatsCore, fetchTopPlayers } from './api/stats';
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
  // This keys off deferredTab (the tab actually rendered in the panel), NOT
  // activeTab: activeTab flips urgently while the old panel is still mounted, so
  // resetting there races the deferred content swap and can leave the new tab at
  // the previous scroll position. useLayoutEffect runs synchronously after the
  // new content commits but before paint, so there is no visible jump.
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [deferredTab]);

  // Tournament-wide live detection for goal / match-end celebrations (any tab).
  const liveFetcher = useCallback(() => fetchCurrentMatches(), []);
  const allFetcher = useCallback(() => fetchAllMatches(), []);
  const { data: liveMatches, lastUpdated: liveUpdated } = useLiveData<Match[]>(liveFetcher, 15000, 'currentMatches');
  const { data: allMatches, lastUpdated: allUpdated } = useLiveData<Match[]>(allFetcher, 15000, 'matches');
  const { goalEvent, endEvents } = useMatchAlerts(
    liveMatches,
    allMatches,
    liveUpdated?.getTime() ?? null,
    allUpdated?.getTime() ?? null,
  );

  // Once the Final is decided this resolves to the world champion, driving the
  // celebration banner on the main page (null while the tournament is ongoing).
  const champion = getChampion(allMatches);

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
      // we already fetch (≈0 extra network), so they open instantly. This now
      // includes the Stats *core* (totals, team boards, goals-by-stage); the
      // Stats scorer/assist boards still load their ~80 per-match timelines
      // (~3MB) on demand when the tab is opened, not on every page load.
      primeLiveData('groups', fetchGroups);
      primeLiveData('form', fetchForm);
      primeLiveData('qualification', fetchQualification);
      primeLiveData('statsCore', fetchStatsCore);
      // Favorites team grid composes the above already-warm feeds; priming its
      // combined key too means a first-ever Favorites open paints cards with no
      // "Loading team details…" spinner.
      primeLiveData('favTeamsCore', fetchFavTeamsCore);
    };
    // The Stats scorer/assist boards and the Favorites player cards both depend
    // on aggregating ~80 per-match timelines (~3MB) — far too heavy to run in the
    // first warm pass, where it would fight the initial critical fetches on slow
    // links. But it's the one thing that still blocks a *first-ever* visit (Stats
    // leaderboards spin up to ~15s; Favorites "Loading player details…"). So warm
    // it in a SECOND, later idle slot: on a first-ever visit this overlaps with
    // the user browsing Live/Schedule, so Stats/Favorites are ready by the time
    // they're opened; on return visits the timelines + aggregate are already in
    // localStorage, making this pass nearly free. Both tabs funnel through the
    // same memoized aggregation, so priming once fills both cache keys.
    const warmHeavy = () => {
      primeLiveData('playerAggs', fetchPlayerStats);
      primeLiveData('playerStats', fetchTopPlayers);
    };
    const ric = (window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    }).requestIdleCallback;
    if (ric) {
      const id = ric(warm, { timeout: 3000 });
      // Defer the heavy player-stats aggregation to a later idle slot so it never
      // competes with the initial critical fetches or the light warm pass.
      const heavyId = ric(warmHeavy, { timeout: 8000 });
      return () => {
        const cancel = (window as unknown as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback;
        cancel?.(id);
        cancel?.(heavyId);
      };
    }
    const timer = window.setTimeout(warm, 1500);
    const heavyTimer = window.setTimeout(warmHeavy, 4000);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(heavyTimer);
    };
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

      {champion && <ChampionBanner key={champion.team.code} champion={champion} />}

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
