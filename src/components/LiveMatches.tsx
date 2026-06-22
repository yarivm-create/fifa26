import React, { useCallback, useState, useEffect } from 'react';
import { useLiveData } from '../hooks/useLiveData';
import { fetchCurrentMatches, fetchAllMatches } from '../api/worldcup';
import { MatchCard } from './MatchCard';
import { Match } from '../api/types';

const HEBREW_DAYS = ['יום א׳', 'יום ב׳', 'יום ג׳', 'יום ד׳', 'יום ה׳', 'יום ו׳', 'שבת'];

function getIsraelDate(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });
}

function getIsraelClock(): string {
  const now = new Date();
  const israelDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
  const dayName = HEBREW_DAYS[israelDate.getDay()];
  const day = israelDate.getDate();
  const month = israelDate.getMonth() + 1;
  const year = israelDate.getFullYear();
  const hours = israelDate.getHours().toString().padStart(2, '0');
  const minutes = israelDate.getMinutes().toString().padStart(2, '0');
  return `${dayName} ${day}.${month}.${year} • ${hours}:${minutes}`;
}

export const LiveMatches: React.FC = () => {
  const [clock, setClock] = useState(getIsraelClock);

  useEffect(() => {
    const interval = setInterval(() => setClock(getIsraelClock()), 1000);
    return () => clearInterval(interval);
  }, []);

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
  const todayISR = getIsraelDate(now);
  const yesterdayISR = getIsraelDate(new Date(now.getTime() - 86400000));
  const tomorrowISR = getIsraelDate(new Date(now.getTime() + 86400000));
  const dayAfterISR = getIsraelDate(new Date(now.getTime() + 172800000));

  // Categorize all matches by Israel date
  const matchesByDate: Record<string, Match[]> = {};
  if (allMatches) {
    for (const m of allMatches) {
      const dateKey = getIsraelDate(new Date(m.datetime));
      if (!matchesByDate[dateKey]) matchesByDate[dateKey] = [];
      matchesByDate[dateKey].push(m);
    }
  }

  const sortMatches = (arr: Match[]) =>
    [...arr].sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

  const hasLive = liveMatches && liveMatches.length > 0;
  const yesterdayMatches = matchesByDate[yesterdayISR]?.filter(m => m.status === 'completed') || [];
  const todayMatches = sortMatches(matchesByDate[todayISR] || []);
  const tomorrowMatches = sortMatches(matchesByDate[tomorrowISR] || []);
  const dayAfterMatches = sortMatches(matchesByDate[dayAfterISR] || []);

  return (
    <div>
      {/* Israel Time Clock */}
      <div className="israel-clock-section">
        <span className="israel-clock-label">🕐 שעון ישראל</span>
        <span className="israel-clock-time">{clock}</span>
      </div>

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

      {lastUpdated && (
        <div className="last-updated">
          עדכון אחרון: {lastUpdated.toLocaleTimeString('he-IL', { timeZone: 'Asia/Jerusalem' })} (שעון ישראל) • מתעדכן אוטומטית
        </div>
      )}
    </div>
  );
};
