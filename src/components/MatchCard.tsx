import React from 'react';
import { Match } from '../api/types';
import { getFlag } from '../utils/flags';

interface Props {
  match: Match;
}

// Israel Daylight Time (IDT) = UTC+3
const ISRAEL_TZ = 'Asia/Jerusalem';

function formatIsraelTime(datetime: string): string {
  return new Date(datetime).toLocaleTimeString('he-IL', {
    timeZone: ISRAEL_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatIsraelDate(datetime: string): string {
  return new Date(datetime).toLocaleDateString('he-IL', {
    timeZone: ISRAEL_TZ,
    weekday: 'short',
    day: 'numeric',
    month: 'numeric',
  });
}

function getStatusLabel(status: string, time?: string): { label: string; isLive: boolean } {
  switch (status) {
    case 'in_progress':
      return { label: time || '⚽ LIVE', isLive: true };
    case 'half_time':
      return { label: 'HALF TIME', isLive: true };
    case 'completed':
      return { label: 'FULL TIME', isLive: false };
    default:
      return { label: 'UPCOMING', isLive: false };
  }
}

export const MatchCard: React.FC<Props> = ({ match }) => {
  const { label, isLive } = getStatusLabel(match.status, match.time);

  return (
    <div className="card">
      <div className="match-card">
        <div className="team home">
          <div>
            <div><span className="team-flag">{getFlag(match.home_team.code)}</span> {match.home_team.name}</div>
            <div className="team-code">{match.home_team.code}</div>
          </div>
        </div>

        <div className="score-box">
          {match.home_team.goals !== null ? (
            <>
              <span className="score">{match.home_team.goals}</span>
              <span className="score-divider">-</span>
              <span className="score">{match.away_team.goals}</span>
            </>
          ) : (
            <span className="score" style={{ fontSize: '1rem' }}>
              {formatIsraelTime(match.datetime)}
            </span>
          )}
        </div>

        <div className="team away">
          <div>
            <div>{match.away_team.name} <span className="team-flag">{getFlag(match.away_team.code)}</span></div>
            <div className="team-code">{match.away_team.code}</div>
          </div>
        </div>
      </div>

      <div className={`match-card match-status ${isLive ? 'live' : ''}`}>
        {isLive && <span className="live-dot" style={{ display: 'inline-block', width: 6, height: 6, background: '#ff4757', borderRadius: '50%', marginRight: 4 }} />}
        {label}
      </div>

      <div className="match-card match-meta">
        {match.venue} • {match.stage_name} • {formatIsraelDate(match.datetime)} {formatIsraelTime(match.datetime)} 🇮🇱
        {' • '}
        <a
          href={`https://www.kan.org.il/lobby/worldcup2026/`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#4299e1', textDecoration: 'none' }}
        >
          פרטים נוספים ←
        </a>
      </div>
    </div>
  );
};
