import React, { useCallback, useMemo } from 'react';
import { useLiveData } from '../hooks/useLiveData';
import { fetchAllMatches } from '../api/worldcup';
import { MatchCard } from './MatchCard';
import { Match } from '../api/types';

export const Schedule: React.FC = () => {
  const fetcher = useCallback(() => fetchAllMatches(), []);
  const { data: matches, loading, error } = useLiveData<Match[]>(fetcher, 300000);

  const groupedByDate = useMemo(() => {
    if (!matches) return {};
    const groups: Record<string, Match[]> = {};
    for (const match of matches) {
      const date = new Date(match.datetime).toLocaleDateString('he-IL', {
        timeZone: 'Asia/Jerusalem',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(match);
    }
    return groups;
  }, [matches]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>Loading full schedule...</p>
      </div>
    );
  }

  if (error) {
    return <div className="error">⚠️ {error}</div>;
  }

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>📋 Full Schedule</h2>
      {Object.entries(groupedByDate).map(([date, dateMatches]) => (
        <div key={date} style={{ marginBottom: 30 }}>
          <h3 style={{ color: '#D4AF37', marginBottom: 12, fontSize: '1rem' }}>{date}</h3>
          <div className="matches-grid">
            {dateMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
