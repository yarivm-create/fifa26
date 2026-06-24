import React from 'react';
import { Match } from '../api/types';
import { Flag } from '../utils/flags';

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
            <div><Flag code={match.home_team.code} name={match.home_team.name} /> {match.home_team.name}</div>
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
            <div>{match.away_team.name} <Flag code={match.away_team.code} name={match.away_team.name} /></div>
          </div>
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
            {formatIsraelDate(match.datetime)} {formatIsraelTime(match.datetime)}{' '}
            <img
              src="https://flagcdn.com/w20/il.png"
              srcSet="https://flagcdn.com/w40/il.png 2x"
              alt="Israel time"
              width={18}
              height={12}
              loading="lazy"
              style={{ verticalAlign: 'middle', borderRadius: 2, display: 'inline-block' }}
            />
          </span>
        </div>
        <a
          className="meta-link"
          href="https://www.kan.org.il/lobby/worldcup2026/"
          target="_blank"
          rel="noopener noreferrer"
        >
          פרטים נוספים ←
        </a>
      </div>
    </div>
  );
};
