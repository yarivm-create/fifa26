import React, { useCallback } from 'react';
import { useLiveData } from '../hooks/useLiveData';
import { fetchCurrentMatches, fetchTodayMatches, fetchAllMatches, fetchYesterdayMatches } from '../api/worldcup';
import { MatchCard } from './MatchCard';
import { Match } from '../api/types';

// Get date in Israel timezone
function getIsraelDate(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' }); // YYYY-MM-DD
}

function getIsraelDateLabel(date: Date): string {
  return date.toLocaleDateString('he-IL', {
    timeZone: 'Asia/Jerusalem',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export const LiveMatches: React.FC = () => {
  const currentFetcher = useCallback(() => fetchCurrentMatches(), []);
  const todayFetcher = useCallback(() => fetchTodayMatches(), []);
  const yesterdayFetcher = useCallback(() => fetchYesterdayMatches(), []);
  const allFetcher = useCallback(() => fetchAllMatches(), []);

  const { data: liveMatches, loading: liveLoading } = useLiveData<Match[]>(currentFetcher, 15000);
  const { data: todayMatches, loading: todayLoading } = useLiveData<Match[]>(todayFetcher, 60000);
  const { data: yesterdayMatches } = useLiveData<Match[]>(yesterdayFetcher, 300000);
  const { data: allMatches, lastUpdated } = useLiveData<Match[]>(allFetcher, 120000);

  if (liveLoading && todayLoading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>Loading live matches...</p>
      </div>
    );
  }

  const hasLive = liveMatches && liveMatches.length > 0;

  // "Up Next": upcoming matches for today, tomorrow, and day after tomorrow (Israel time)
  const now = new Date();
  const todayISR = getIsraelDate(now);
  const tomorrowISR = getIsraelDate(new Date(now.getTime() + 86400000));
  const dayAfterISR = getIsraelDate(new Date(now.getTime() + 172800000));
  const upNextDays = [todayISR, tomorrowISR, dayAfterISR];

  const upcoming = allMatches
    ?.filter((m) => {
      if (m.status !== 'future_scheduled') return false;
      const matchDateISR = getIsraelDate(new Date(m.datetime));
      return upNextDays.includes(matchDateISR);
    })
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()) || [];

  // Group upcoming by Israel date
  const upcomingByDate: Record<string, Match[]> = {};
  for (const m of upcoming) {
    const dateKey = getIsraelDate(new Date(m.datetime));
    if (!upcomingByDate[dateKey]) upcomingByDate[dateKey] = [];
    upcomingByDate[dateKey].push(m);
  }

  const dateLabels: Record<string, string> = {
    [todayISR]: '🕐 עוד היום (Today)',
    [tomorrowISR]: '📅 מחר (Tomorrow)',
    [dayAfterISR]: '📅 מחרתיים (Day After)',
  };

  return (
    <div>
      {hasLive && (
        <>
          <h2 style={{ marginBottom: 16, color: '#ff4757' }}>🔴 Live Now</h2>
          <div className="matches-grid">
            {liveMatches!.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </>
      )}

      {yesterdayMatches && yesterdayMatches.length > 0 && (
        <>
          <h2 style={{ marginTop: hasLive ? 30 : 0, marginBottom: 16 }}>📋 אתמול (Yesterday)</h2>
          <div className="matches-grid">
            {yesterdayMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </>
      )}

      <h2 style={{ marginTop: 30, marginBottom: 16 }}>📅 Today's Results</h2>
      {todayMatches && todayMatches.length > 0 ? (
        <div className="matches-grid">
          {todayMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: '#a0aec0' }}>No completed matches yet today.</p>
        </div>
      )}

      {upcoming.length > 0 && (
        <>
          <h2 style={{ marginTop: 30, marginBottom: 16 }}>⏭️ Up Next</h2>
          {Object.entries(upcomingByDate).map(([dateKey, matches]) => (
            <div key={dateKey} style={{ marginBottom: 24 }}>
              <h3 style={{ color: '#D4AF37', marginBottom: 12, fontSize: '1rem' }}>
                {dateLabels[dateKey] || getIsraelDateLabel(new Date(matches[0].datetime))}
              </h3>
              <div className="matches-grid">
                {matches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {lastUpdated && (
        <div className="last-updated">
          Last updated: {lastUpdated.toLocaleTimeString('he-IL', { timeZone: 'Asia/Jerusalem' })} (Israel Time) • Auto-refreshes
        </div>
      )}
    </div>
  );
};
