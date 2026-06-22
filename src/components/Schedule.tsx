import React, { useCallback, useMemo } from 'react';
import { useLiveData } from '../hooks/useLiveData';
import { fetchAllMatches } from '../api/worldcup';
import { MatchCard } from './MatchCard';
import { Match } from '../api/types';

function getIsraelDateKey(datetime: string): string {
  return new Date(datetime).toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });
}

function getIsraelDateLabel(datetime: string): string {
  return new Date(datetime).toLocaleDateString('he-IL', {
    timeZone: 'Asia/Jerusalem',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getStageBucket(stageName: string): string {
  if (stageName.startsWith('Group')) return 'Group Stage';
  if (stageName === 'Round of 32') return 'Round of 32';
  if (stageName === 'Round of 16') return 'Round of 16';
  if (stageName === 'Quarter-final') return 'Quarter-finals';
  if (stageName === 'Semi-final') return 'Semi-finals';
  if (stageName === 'Third place play-off') return 'Third Place';
  if (stageName === 'Final') return 'Final';
  return stageName;
}

interface DateGroup {
  dateKey: string;
  dateLabel: string;
  matches: Match[];
  isToday: boolean;
}

export const Schedule: React.FC = () => {
  const fetcher = useCallback(() => fetchAllMatches(), []);
  const { data: matches, loading, error } = useLiveData<Match[]>(fetcher, 300000);

  const todayKey = useMemo(() => getIsraelDateKey(new Date().toISOString()), []);

  const { dateGroups, stageTransitions } = useMemo(() => {
    if (!matches) return { dateGroups: [] as DateGroup[], stageTransitions: {} as Record<string, string> };

    const sorted = [...matches].sort(
      (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
    );

    const groups: Record<string, Match[]> = {};
    const dateOrder: string[] = [];
    for (const m of sorted) {
      const dk = getIsraelDateKey(m.datetime);
      if (!groups[dk]) {
        groups[dk] = [];
        dateOrder.push(dk);
      }
      groups[dk].push(m);
    }

    const dgs: DateGroup[] = dateOrder.map(dk => ({
      dateKey: dk,
      dateLabel: getIsraelDateLabel(groups[dk][0].datetime),
      matches: groups[dk],
      isToday: dk === todayKey,
    }));

    // Determine which dateKeys start a new stage
    const transitions: Record<string, string> = {};
    let lastStage = '';
    for (const dg of dgs) {
      const bucket = getStageBucket(dg.matches[0].stage_name);
      if (bucket !== lastStage) {
        transitions[dg.dateKey] = bucket;
        lastStage = bucket;
      }
    }

    return { dateGroups: dgs, stageTransitions: transitions };
  }, [matches, todayKey]);

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
      <h2 className="section-title" style={{ marginBottom: 20 }}>📋 Full Schedule — 104 Matches</h2>
      {dateGroups.map((dg) => (
        <div key={dg.dateKey}>
          {stageTransitions[dg.dateKey] && (
            <div className="stage-header">
              <span className="stage-header-text">{stageTransitions[dg.dateKey]}</span>
            </div>
          )}
          <div className={`schedule-date-group ${dg.isToday ? 'schedule-today' : ''}`}>
            <h3 className="schedule-date-label">
              {dg.isToday && <span className="today-badge">TODAY</span>}
              {dg.dateLabel}
            </h3>
            <div className="matches-grid">
              {dg.matches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
