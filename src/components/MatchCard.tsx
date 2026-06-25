import React from 'react';
import { Match } from '../api/types';
import { Flag } from '../utils/flags';
import { formatLocalTime, formatLocalDate, LocalTimeFlag } from '../utils/localTime';
import { useI18n, TFunc } from '../i18n';

interface Props {
  match: Match;
}

// Keeps the team name on a single line when it fits the available column space,
// and only switches to a compact min-content wrap (e.g. "Bosnia and" /
// "Herzegovina") when a single line would overflow. This avoids needlessly
// splitting shorter names like "Korea Republic" onto two lines.
const TeamName: React.FC<{ name: string }> = ({ name }) => {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [multi, setMulti] = React.useState(false);

  React.useLayoutEffect(() => {
    const el = ref.current;
    const team = el?.closest('.team') as HTMLElement | null;
    if (!el || !team) return;

    let raf = 0;
    const measure = () => {
      const flag = team.querySelector('.flag-img, .flag-placeholder') as HTMLElement | null;
      const avail = team.clientWidth - (flag ? flag.offsetWidth : 0) - 10;
      const prevW = el.style.width;
      const prevWS = el.style.whiteSpace;
      el.style.width = 'max-content';
      el.style.whiteSpace = 'nowrap';
      const oneLine = el.scrollWidth;
      el.style.width = prevW;
      el.style.whiteSpace = prevWS;
      const next = oneLine > avail + 4;
      setMulti((prev) => (prev === next ? prev : next));
    };

    // Defer measurement with rAF so DOM reads/writes never happen synchronously
    // inside the ResizeObserver callback (which would raise the benign
    // "ResizeObserver loop" warning that our smoke test treats as an error).
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };

    schedule();
    const ro = new ResizeObserver(schedule);
    ro.observe(team);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [name]);

  return (
    <span ref={ref} className={`team-name ${multi ? 'name-multi' : 'name-single'}`}>
      {name}
    </span>
  );
};

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
          <span className="team-inner">
            <Flag code={match.home_team.code} name={match.home_team.name} />
            <TeamName name={match.home_team.name} />
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
          <span className="team-inner">
            <TeamName name={match.away_team.name} />
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
