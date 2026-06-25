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
    all.filter((m) => m.stage_name === key).sort((a, b) => a.id - b.id);

  const thirdPlace = all.filter((m) => m.stage_name === 'Third place play-off');

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>{t('bracket.title')}</h2>
      <div className="bracket-scroll">
        <div className="bracket-grid">
          {ROUNDS.map((round) => {
            const roundMatches = byRound(round.key);
            if (roundMatches.length === 0) return null;
            return (
              <div className="bracket-column" key={round.key}>
                <h3 className="bracket-round-title">{t(round.tkey)}</h3>
                {roundMatches.map((m) => (
                  <BracketMatch key={m.id} match={m} />
                ))}
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
