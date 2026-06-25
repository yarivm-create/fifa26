import React, { useCallback } from 'react';
import { useLiveData } from '../hooks/useLiveData';
import { fetchCurrentMatches, fetchAllMatches } from '../api/worldcup';
import { MatchCard } from './MatchCard';
import { Match } from '../api/types';
import { localDateKey, formatLocalTime, LOCAL_TZ_LABEL } from '../utils/localTime';

export const LiveMatches: React.FC = () => {
  const currentFetcher = useCallback(() => fetchCurrentMatches(), []);
  const allFetcher = useCallback(() => fetchAllMatches(), []);

  const { data: liveMatches, loading: liveLoading } = useLiveData<Match[]>(currentFetcher, 15000);
  const { data: allMatches, loading: allLoading, lastUpdated } = useLiveData<Match[]>(allFetcher, 60000);

  if (liveLoading && allLoading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>Loading matches...</p>
      </div>
    );
  }

  const now = new Date();
  const todayKey = localDateKey(now);
  const yesterdayKey = localDateKey(new Date(now.getTime() - 86400000));
  const tomorrowKey = localDateKey(new Date(now.getTime() + 86400000));
  const dayAfterKey = localDateKey(new Date(now.getTime() + 172800000));

  // Categorize all matches by the visitor's local date
  const matchesByDate: Record<string, Match[]> = {};
  if (allMatches) {
    for (const m of allMatches) {
      const dateKey = localDateKey(new Date(m.datetime));
      if (!matchesByDate[dateKey]) matchesByDate[dateKey] = [];
      matchesByDate[dateKey].push(m);
    }
  }

  const sortMatches = (arr: Match[]) =>
    [...arr].sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

  const hasLive = liveMatches && liveMatches.length > 0;
  const liveIds = new Set((liveMatches || []).map((m) => m.id));
  const yesterdayMatches = matchesByDate[yesterdayKey]?.filter(m => m.status === 'completed') || [];
  const todayMatches = sortMatches((matchesByDate[todayKey] || []).filter(m => !liveIds.has(m.id)));
  const tomorrowMatches = sortMatches(matchesByDate[tomorrowKey] || []);
  const dayAfterMatches = sortMatches(matchesByDate[dayAfterKey] || []);

  const hasAnything =
    hasLive ||
    todayMatches.length > 0 ||
    yesterdayMatches.length > 0 ||
    tomorrowMatches.length > 0 ||
    dayAfterMatches.length > 0;

  return (
    <div>
      {/* Live Now */}
      {hasLive && (
        <section className="live-section">
          <h2 className="section-title live-title">
            <span className="live-pulse-dot" />
            🔴 Live Now
          </h2>
          <div className="matches-grid">
            {liveMatches!.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      )}

      {/* Today */}
      {todayMatches.length > 0 && (
        <section className="day-section today-section">
          <h2 className="section-title">📅 היום Today</h2>
          <div className="matches-grid">
            {todayMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      )}

      {/* Yesterday */}
      {yesterdayMatches.length > 0 && (
        <section className="day-section">
          <h2 className="section-title">📋 אתמול Yesterday</h2>
          <div className="matches-grid">
            {sortMatches(yesterdayMatches).map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      )}

      {/* Tomorrow */}
      {tomorrowMatches.length > 0 && (
        <section className="day-section">
          <h2 className="section-title">⏭️ מחר Tomorrow</h2>
          <div className="matches-grid">
            {tomorrowMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      )}

      {/* Day After Tomorrow */}
      {dayAfterMatches.length > 0 && (
        <section className="day-section">
          <h2 className="section-title">📅 מחרתיים Day After Tomorrow</h2>
          <div className="matches-grid">
            {dayAfterMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      )}

      {!hasAnything && (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '2.4rem', marginBottom: 8 }}>🌙</div>
          <p style={{ color: 'var(--wc-text)', fontWeight: 600 }}>אין משחקים בסביבת התאריך הזה</p>
          <p style={{ color: 'var(--wc-text-muted)', fontSize: '0.85rem', marginTop: 6 }}>
            No matches around today — check the Schedule tab for upcoming fixtures.
          </p>
        </div>
      )}

      {lastUpdated && (
        <div className="last-updated">
          Last updated: {formatLocalTime(lastUpdated)}{LOCAL_TZ_LABEL ? ` (${LOCAL_TZ_LABEL})` : ''} • auto-refreshing
        </div>
      )}
    </div>
  );
};
