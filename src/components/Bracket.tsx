import React, { useCallback } from 'react';
import { useLiveData } from '../hooks/useLiveData';
import { fetchAllMatches } from '../api/worldcup';
import { Match } from '../api/types';
import { Flag } from '../utils/flags';
import { formatLocalDate, formatLocalTime, LocalTimeFlag } from '../utils/localTime';
import { useI18n, TFunc } from '../i18n';

const ROUNDS: { key: string; tkey: string }[] = [
  { key: 'Round of 32', tkey: 'stage.r32' },
  { key: 'Round of 16', tkey: 'stage.r16' },
  { key: 'Quarter-final', tkey: 'stage.qf' },
  { key: 'Semi-final', tkey: 'stage.sf' },
  { key: 'Final', tkey: 'stage.final' },
];

// Knockout feeder tree for WC2026, derived from the schedule's "W##" winner
// placeholders (e.g. R16 match 89 = W73 vs W75 is fed by R32 matches 73 & 75).
// Each match id maps to the two earlier match ids that feed it. This lets us
// lay every round out so a match sits centered between its two feeder games —
// making it clear at a glance which teams could meet in the next round.
const FEEDERS: Record<number, [number, number]> = {
  // Round of 16  <- Round of 32
  89: [73, 75], 90: [74, 77], 91: [76, 78], 92: [79, 80],
  93: [83, 84], 94: [81, 82], 95: [86, 88], 96: [85, 87],
  // Quarter-finals <- Round of 16
  97: [89, 90], 98: [93, 94], 99: [91, 92], 100: [95, 96],
  // Semi-finals <- Quarter-finals
  101: [97, 98], 102: [99, 100],
  // Final <- Semi-finals
  104: [101, 102],
};
const FINAL_ID = 104;

// Pre-order depth-first walk (home feeder before away feeder) assigns every
// knockout match a vertical rank. Sorting each round by this rank keeps the
// tree planar, so feeders of the same next-round match are always adjacent.
const BRACKET_RANK: Map<number, number> = (() => {
  const rank = new Map<number, number>();
  let n = 0;
  const visit = (id: number) => {
    const f = FEEDERS[id];
    if (f) visit(f[0]);
    rank.set(id, n++);
    if (f) visit(f[1]);
  };
  visit(FINAL_ID);
  return rank;
})();

// Real teams have a known flag; placeholders (2A, W73, RU101, 3ABCDF) get a readable label.
function isPlaceholder(code: string): boolean {
  return /^(\d|W\d|RU\d|3[A-L]{2,})/.test(code);
}

function teamLabel(code: string, name: string, t: TFunc): string {
  if (!isPlaceholder(code)) return name;
  if (/^W\d+$/.test(code)) return t('bracket.winnerMatch', { n: code.slice(1) });
  if (/^RU\d+$/.test(code)) return t('bracket.loserMatch', { n: code.slice(2) });
  if (/^1[A-L]$/.test(code)) return t('bracket.winnerGroup', { letter: code[1] });
  if (/^2[A-L]$/.test(code)) return t('bracket.runnerUp', { letter: code[1] });
  if (/^3/.test(code)) return t('bracket.third', { groups: code.slice(1).split('').join('/') });
  return code;
}

function formatKickoff(datetime: string): string {
  return `${formatLocalDate(datetime, { day: 'numeric', month: 'numeric' })} • ${formatLocalTime(datetime)}`;
}

const BracketTeam: React.FC<{ code: string; name: string; goals: number | null }> = ({ code, name, goals }) => {
  const { t } = useI18n();
  return (
    <div className="bracket-team">
      <Flag code={code} name={name} className="bracket-flag" />
      <span className="bracket-name">{teamLabel(code, name, t)}</span>
      {goals !== null && <span className="bracket-score">{goals}</span>}
    </div>
  );
};

const BracketMatch: React.FC<{ match: Match }> = ({ match }) => (
  <div className="bracket-match">
    <div className="bracket-match-time">{formatKickoff(match.datetime)} <LocalTimeFlag size={16} /></div>
    <BracketTeam code={match.home_team.code} name={match.home_team.name} goals={match.home_team.goals} />
    <BracketTeam code={match.away_team.code} name={match.away_team.name} goals={match.away_team.goals} />
    <div className="bracket-venue">{match.venue}</div>
  </div>
);

export const Bracket: React.FC = () => {
  const { t } = useI18n();
  const fetcher = useCallback(() => fetchAllMatches(), []);
  const { data: matches, loading } = useLiveData<Match[]>(fetcher, 120000);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>{t('loading.bracket')}</p>
      </div>
    );
  }

  const all = matches || [];
  const byRound = (key: string) =>
    all
      .filter((m) => m.stage_name === key)
      .sort((a, b) => {
        const ra = BRACKET_RANK.get(a.id);
        const rb = BRACKET_RANK.get(b.id);
        if (ra !== undefined && rb !== undefined) return ra - rb;
        return a.id - b.id;
      });

  const thirdPlace = all.filter((m) => m.stage_name === 'Third place play-off');

  // Only the rounds that actually have matches, so connector edges (has-prev /
  // has-next) are computed against what is really rendered.
  const renderedRounds = ROUNDS.map((round) => ({ round, matches: byRound(round.key) })).filter(
    (r) => r.matches.length > 0
  );

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>{t('bracket.title')}</h2>
      <div className="bracket-scroll">
        <div className="bracket-grid">
          {renderedRounds.map(({ round, matches: roundMatches }, ri) => {
            const hasPrev = ri > 0;
            const hasNext = ri < renderedRounds.length - 1;
            return (
              <div className="bracket-column" key={round.key}>
                <h3 className="bracket-round-title">{t(round.tkey)}</h3>
                <div className="bracket-slots">
                  {roundMatches.map((m, i) => (
                    <div className="bracket-slot" key={m.id}>
                      {hasPrev && <span className="bk-conn bk-in" aria-hidden="true" />}
                      {hasNext && <span className="bk-conn bk-out" aria-hidden="true" />}
                      {hasNext && (
                        <span
                          className={`bk-conn bk-vert ${i % 2 === 0 ? 'top' : 'bottom'}`}
                          aria-hidden="true"
                        />
                      )}
                      <BracketMatch match={m} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {thirdPlace.length > 0 && (
        <div className="bracket-third-place">
          <h3 className="bracket-round-title">{t('bracket.thirdPlace')}</h3>
          {thirdPlace.map((m) => (
            <BracketMatch key={m.id} match={m} />
          ))}
        </div>
      )}
    </div>
  );
};
