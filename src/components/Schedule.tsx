import React, { useCallback, useMemo } from 'react';
import { useLiveData } from '../hooks/useLiveData';
import { fetchAllMatches } from '../api/worldcup';
import { MatchCard } from './MatchCard';
import { Match } from '../api/types';
import { localDateKey, formatLocalDate } from '../utils/localTime';
import { useI18n } from '../i18n';

function getLocalDateLabel(datetime: string): string {
  return formatLocalDate(datetime, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Stage bucket -> translation key (shared with the Bracket round labels).
function getStageBucketKey(stageName: string): string {
  if (stageName.startsWith('Group')) return 'stage.group';
  if (stageName === 'Round of 32') return 'stage.r32';
  if (stageName === 'Round of 16') return 'stage.r16';
  if (stageName === 'Quarter-final') return 'stage.qf';
  if (stageName === 'Semi-final') return 'stage.sf';
  if (stageName === 'Third place play-off') return 'stage.third';
  if (stageName === 'Final') return 'stage.final';
  return stageName;
}

interface DateGroup {
  dateKey: string;
  dateLabel: string;
  matches: Match[];
  isToday: boolean;
}

export const Schedule: React.FC = () => {
  const { t, lang } = useI18n();
  const fetcher = useCallback(() => fetchAllMatches(), []);
  const { data: matches, loading, error } = useLiveData<Match[]>(fetcher, 300000);

  const todayKey = useMemo(() => localDateKey(new Date().toISOString()), []);

  const { dateGroups, stageTransitions } = useMemo(() => {
    if (!matches) return { dateGroups: [] as DateGroup[], stageTransitions: {} as Record<string, string> };

    const sorted = [...matches].sort(
      (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
    );

    const groups: Record<string, Match[]> = {};
    const dateOrder: string[] = [];
    for (const m of sorted) {
      const dk = localDateKey(m.datetime);
      if (!groups[dk]) {
        groups[dk] = [];
        dateOrder.push(dk);
      }
      groups[dk].push(m);
    }

    const dgs: DateGroup[] = dateOrder.map(dk => ({
      dateKey: dk,
      dateLabel: getLocalDateLabel(groups[dk][0].datetime),
      matches: groups[dk],
      isToday: dk === todayKey,
    }));

    // Determine which dateKeys start a new stage (stored as translation keys).
    const transitions: Record<string, string> = {};
    let lastStage = '';
    for (const dg of dgs) {
      const bucket = getStageBucketKey(dg.matches[0].stage_name);
      if (bucket !== lastStage) {
        transitions[dg.dateKey] = bucket;
        lastStage = bucket;
      }
    }

    return { dateGroups: dgs, stageTransitions: transitions };
    // `lang` is included so date labels re-localize when the language changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, todayKey, lang]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>{t('loading.schedule')}</p>
      </div>
    );
  }

  if (error) {
    return <div className="error">⚠️ {error}</div>;
  }

  return (
    <div>
      <h2 className="section-title" style={{ marginBottom: 20 }}>{t('schedule.title')}</h2>
      {dateGroups.map((dg) => (
        <div key={dg.dateKey}>
          {stageTransitions[dg.dateKey] && (
            <div className="stage-header">
              <span className="stage-header-text">{t(stageTransitions[dg.dateKey])}</span>
            </div>
          )}
          <div className={`schedule-date-group ${dg.isToday ? 'schedule-today' : ''}`}>
            <h3 className="schedule-date-label">
              {dg.isToday && <span className="today-badge">{t('schedule.today')}</span>}
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
