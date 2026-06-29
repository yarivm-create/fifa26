import React, { useCallback } from 'react';
import { useLiveData } from '../hooks/useLiveData';
import { fetchCurrentMatches, fetchAllMatches } from '../api/worldcup';
import { MatchCard } from './MatchCard';
import { Match } from '../api/types';
import { localDateKey, formatLocalTime, LOCAL_TZ_LABEL } from '../utils/localTime';
import { useI18n } from '../i18n';

export const LiveMatches: React.FC = () => {
  const { t } = useI18n();
  const currentFetcher = useCallback(() => fetchCurrentMatches(), []);
  const allFetcher = useCallback(() => fetchAllMatches(), []);

  const { data: liveMatches, loading: liveLoading } = useLiveData<Match[]>(currentFetcher, 15000);
  const { data: allMatches, loading: allLoading, lastUpdated } = useLiveData<Match[]>(allFetcher, 15000);

  if (liveLoading && allLoading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>{t('loading.matches')}</p>
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

  // The next two fixtures still to be played (soonest kickoff), highlighted as
  // their own "Next Up" cards above Today. They are excluded from their normal
  // day sections below so matches are never listed twice.
  const upcomingMatches = sortMatches(
    (allMatches || []).filter((m) => m.status === 'future_scheduled')
  ).slice(0, 2);
  const upcomingIds = new Set(upcomingMatches.map((m) => m.id));

  const yesterdayMatches = matchesByDate[yesterdayKey]?.filter(m => m.status === 'completed') || [];
  const todayMatches = sortMatches((matchesByDate[todayKey] || []).filter(m => !liveIds.has(m.id) && !upcomingIds.has(m.id)));
  const tomorrowMatches = sortMatches((matchesByDate[tomorrowKey] || []).filter(m => !upcomingIds.has(m.id)));
  const dayAfterMatches = sortMatches((matchesByDate[dayAfterKey] || []).filter(m => !upcomingIds.has(m.id)));

  const hasAnything =
    hasLive ||
    upcomingMatches.length > 0 ||
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
            {t('live.now')}
          </h2>
          <div className="matches-grid">
            {liveMatches!.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      )}

      {/* Next Up — the two soonest upcoming fixtures, shown before Today */}
      {upcomingMatches.length > 0 && (
        <section className="day-section upcoming-section">
          <h2 className="section-title">{t('live.upcoming')}</h2>
          <div className="matches-grid">
            {upcomingMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      )}

      {/* Today */}
      {todayMatches.length > 0 && (
        <section className="day-section today-section">
          <h2 className="section-title">
            <span className="today-badge" style={{ marginRight: 8 }}>{t('schedule.today')}</span>
            {t('live.today')}
          </h2>
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
          <h2 className="section-title">{t('live.yesterday')}</h2>
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
          <h2 className="section-title">{t('live.tomorrow')}</h2>
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
          <h2 className="section-title">{t('live.dayAfter')}</h2>
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
          <p style={{ color: 'var(--wc-text)', fontWeight: 600 }}>{t('live.noneTitle')}</p>
          <p style={{ color: 'var(--wc-text-muted)', fontSize: '0.85rem', marginTop: 6 }}>
            {t('live.noneSub')}
          </p>
        </div>
      )}

      {lastUpdated && (
        <div className="last-updated">
          {LOCAL_TZ_LABEL
            ? t('live.lastUpdatedTz', { time: formatLocalTime(lastUpdated), tz: LOCAL_TZ_LABEL })
            : t('live.lastUpdated', { time: formatLocalTime(lastUpdated) })}
        </div>
      )}
    </div>
  );
};
