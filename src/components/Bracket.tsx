import React, { useCallback } from 'react';
import { useLiveData } from '../hooks/useLiveData';
import { fetchAllMatches } from '../api/worldcup';
import { Match } from '../api/types';
import { Flag } from '../utils/flags';
import { formatLocalDate, formatLocalTime, LocalTimeFlag } from '../utils/localTime';
import { getMatchResult } from '../utils/matchResult';
import { bracketRanks, sortBracketRound } from '../utils/bracketOrder';
import { useI18n, TFunc } from '../i18n';

const ROUNDS: { key: string; tkey: string }[] = [
  { key: 'Round of 32', tkey: 'stage.r32' },
  { key: 'Round of 16', tkey: 'stage.r16' },
  { key: 'Quarter-final', tkey: 'stage.qf' },
  { key: 'Semi-final', tkey: 'stage.sf' },
  { key: 'Final', tkey: 'stage.final' },
];

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

const BracketTeam: React.FC<{ code: string; name: string; goals: number | null; penalties?: number | null; won: boolean; hasPens: boolean }> = ({ code, name, goals, penalties, won, hasPens }) => {
  const { t } = useI18n();
  return (
    <div className={`bracket-team${won ? ' bracket-team-winner' : ''}`}>
      <Flag code={code} name={name} className="bracket-flag" />
      <span className="bracket-name">{teamLabel(code, name, t)}</span>
      {goals !== null && (
        <span className={`bracket-score${won && !hasPens ? ' bracket-score-winner' : ''}`}>
          {goals}
          {penalties != null && <span className={`bracket-pen${won ? ' bracket-pen-winner' : ''}`}> ({penalties})</span>}
        </span>
      )}
    </div>
  );
};

const BracketMatch: React.FC<{ match: Match }> = ({ match }) => {
  const hg = match.home_team.goals;
  const ag = match.away_team.goals;
  const hp = match.home_team.penalties;
  const ap = match.away_team.penalties;
  const { homeWon, awayWon, hasPens } = getMatchResult(match);
  return (
    <div className="bracket-match">
      <div className="bracket-match-time">{formatKickoff(match.datetime)} <LocalTimeFlag size={16} /></div>
      <BracketTeam code={match.home_team.code} name={match.home_team.name} goals={hg} penalties={hp} won={homeWon} hasPens={hasPens} />
      <BracketTeam code={match.away_team.code} name={match.away_team.name} goals={ag} penalties={ap} won={awayWon} hasPens={hasPens} />
      <div className="bracket-venue">{match.venue}</div>
    </div>
  );
};

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
  // Lay each round out as a planar feeder tree (so every card lines up with the
  // two feeder cards it comes from, with connector lines between rounds), but
  // order the branches so the earliest / already-played tie bubbles to the top.
  const ranks = bracketRanks(all);
  const byRound = (key: string) => sortBracketRound(all, key, ranks);

  const thirdPlace = all.filter((m) => m.stage_name === 'Third place play-off');

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
                  {roundMatches.map((m, i) => {
                    // Group feeder pairs ONLY in the first (densest) round by
                    // pulling each pair's two cards toward each other (top card
                    // drifts down, bottom card up) so pairs read as groups with
                    // bigger gaps between them. The drift is symmetric, so the
                    // pair CENTRE is unchanged and the connector to the next
                    // round still lines up. Deeper rounds stay in the exact
                    // uniform layout (no drift) so their connectors can never
                    // accumulate offset and break.
                    const paired = ri === 0 && roundMatches.length > 1;
                    const pairClass = paired ? (i % 2 === 0 ? ' pair-top' : ' pair-bottom') : '';
                    return (
                      <div className={`bracket-slot${pairClass}`} key={m.id}>
                        {hasPrev && <span className="bk-conn bk-in" aria-hidden="true" />}
                        {hasNext && <span className="bk-conn bk-out" aria-hidden="true" />}
                        {hasNext && (
                          <span
                            className={`bk-conn bk-vert ${i % 2 === 0 ? 'top' : 'bottom'}`}
                            aria-hidden="true"
                          />
                        )}
                        <div className="bracket-slot-inner">
                          <BracketMatch match={m} />
                        </div>
                      </div>
                    );
                  })}
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
