import React from 'react';
import { Match } from '../api/types';
import { Flag } from '../utils/flags';
import { formatLocalTime, formatLocalDate, LocalTimeFlag } from '../utils/localTime';
import { useI18n, TFunc } from '../i18n';

interface Props {
  match: Match;
}

function getStatusLabel(status: string, t: TFunc, time?: string): { label: string; isLive: boolean } {
  switch (status) {
    case 'in_progress':
      return { label: time || t('status.live'), isLive: true };
    case 'half_time':
      return { label: t('status.halfTime'), isLive: true };
    case 'completed':
      return { label: t('status.fullTime'), isLive: false };
    default:
      return { label: t('status.upcoming'), isLive: false };
  }
}

export const MatchCard: React.FC<Props> = ({ match }) => {
  const { t } = useI18n();
  const { label, isLive } = getStatusLabel(match.status, t, match.time);

  const hg = match.home_team.goals;
  const ag = match.away_team.goals;
  const hasScore = hg !== null && ag !== null;
  const finished = match.status === 'completed' && hasScore;
  const homeWon = finished && (hg as number) > (ag as number);
  const awayWon = finished && (ag as number) > (hg as number);

  return (
    <div className="card">
      <div className="match-card">
        <div className={`team home${homeWon ? ' team-winner' : ''}`}>
          <span className="team-name">
            <Flag code={match.home_team.code} name={match.home_team.name} />
            {'\u00A0'}{match.home_team.name}
          </span>
        </div>

        <div className="score-box">
          {hasScore ? (
            <>
              <span className={`score${homeWon ? ' score-winner' : ''}`}>{hg}</span>
              <span className="score-divider">-</span>
              <span className={`score${awayWon ? ' score-winner' : ''}`}>{ag}</span>
            </>
          ) : (
            <span className="score" style={{ fontSize: '1rem' }}>
              {formatLocalTime(match.datetime)}
            </span>
          )}
        </div>

        <div className={`team away${awayWon ? ' team-winner' : ''}`}>
          <span className="team-name">
            {match.away_team.name}{'\u00A0'}
            <Flag code={match.away_team.code} name={match.away_team.name} />
          </span>
        </div>
      </div>

      <div className={`match-status ${isLive ? 'live' : ''}`}>
        {isLive && <span className="live-dot" />}
        {label}
      </div>

      <div className="match-meta">
        <div className="meta-line">{match.venue} • {match.stage_name}</div>
        <div className="meta-line">
          <span style={{ unicodeBidi: 'isolate', whiteSpace: 'nowrap' }}>
            {formatLocalDate(match.datetime)} {formatLocalTime(match.datetime)}{' '}
            <LocalTimeFlag size={18} />
          </span>
        </div>
        {(isLive || match.status === 'completed') && (
          <a
            className="meta-link"
            href="https://www.kan.org.il/lobby/worldcup2026/"
            target="_blank"
            rel="noopener noreferrer"
          >
            {isLive ? t('match.liveCenter') : t('match.recap')}
          </a>
        )}
      </div>
    </div>
  );
};
