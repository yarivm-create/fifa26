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
//
// Measurement is BATCHED across all TeamName instances. A schedule with 100+
// match cards renders 200+ names; if each one read+wrote layout in its own rAF,
// every scrollWidth read after a style write would force a full-document
// reflow (200+ reflows/frame => the "Forced reflow" violations). Instead we
// collect every pending measurement into one shared rAF and strictly separate
// the read and write phases so the browser reflows only once per frame.
interface MeasureJob {
  team: HTMLElement;
  el: HTMLElement;
  apply: (multi: boolean) => void;
}

const pendingJobs = new Set<MeasureJob>();
let measureRaf = 0;

function flushMeasurements() {
  measureRaf = 0;
  const jobs = Array.from(pendingJobs);
  pendingJobs.clear();
  if (jobs.length === 0) return;

  // Phase 1 — READ: available width per element (layout is clean from last frame).
  const avail = jobs.map((j) => {
    const flag = j.team.querySelector('.flag-img, .flag-placeholder') as HTMLElement | null;
    return j.team.clientWidth - (flag ? flag.offsetWidth : 0) - 10;
  });

  // Phase 2 — WRITE: force single-line measuring styles on every element.
  const prev = jobs.map((j) => ({ w: j.el.style.width, ws: j.el.style.whiteSpace }));
  jobs.forEach((j) => {
    j.el.style.width = 'max-content';
    j.el.style.whiteSpace = 'nowrap';
  });

  // Phase 3 — READ: a single reflow for the whole batch, then read all widths.
  const oneLine = jobs.map((j) => j.el.scrollWidth);

  // Phase 4 — WRITE: restore styles and apply results.
  jobs.forEach((j, i) => {
    j.el.style.width = prev[i].w;
    j.el.style.whiteSpace = prev[i].ws;
    j.apply(oneLine[i] > avail[i] + 4);
  });
}

function scheduleMeasurement(job: MeasureJob) {
  pendingJobs.add(job);
  if (!measureRaf) measureRaf = requestAnimationFrame(flushMeasurements);
}

const TeamName: React.FC<{ name: string }> = ({ name }) => {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [multi, setMulti] = React.useState(false);

  React.useLayoutEffect(() => {
    const el = ref.current;
    const team = el?.closest('.team') as HTMLElement | null;
    if (!el || !team) return;

    const job: MeasureJob = {
      team,
      el,
      apply: (next) => setMulti((prev) => (prev === next ? prev : next)),
    };

    // Defer measurement into the shared batched scheduler so DOM reads/writes
    // never happen synchronously inside the ResizeObserver callback (which would
    // raise the benign "ResizeObserver loop" warning our smoke test treats as an
    // error) and never thrash layout one element at a time.
    const schedule = () => scheduleMeasurement(job);

    schedule();
    const ro = new ResizeObserver(schedule);
    ro.observe(team);
    return () => {
      pendingJobs.delete(job);
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
    <div className="card" data-stage={match.stage_name}>
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
