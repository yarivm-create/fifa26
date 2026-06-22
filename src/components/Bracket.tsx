import React, { useCallback } from 'react';
import { useLiveData } from '../hooks/useLiveData';
import { fetchAllMatches } from '../api/worldcup';
import { Match } from '../api/types';
import { Flag } from '../utils/flags';

const ISRAEL_TZ = 'Asia/Jerusalem';

const ROUNDS: { key: string; label: string }[] = [
  { key: 'Round of 32', label: 'Round of 32' },
  { key: 'Round of 16', label: 'Round of 16' },
  { key: 'Quarter-final', label: 'Quarter-finals' },
  { key: 'Semi-final', label: 'Semi-finals' },
  { key: 'Final', label: 'Final' },
];

// Real teams have a known flag; placeholders (2A, W73, RU101, 3ABCDF) get a readable label.
function isPlaceholder(code: string): boolean {
  return /^(\d|W\d|RU\d|3[A-L]{2,})/.test(code);
}

function teamLabel(code: string, name: string): string {
  if (!isPlaceholder(code)) return name;
  if (/^W\d+$/.test(code)) return `Winner M${code.slice(1)}`;
  if (/^RU\d+$/.test(code)) return `Loser M${code.slice(2)}`;
  if (/^1[A-L]$/.test(code)) return `Winner Grp ${code[1]}`;
  if (/^2[A-L]$/.test(code)) return `Runner-up ${code[1]}`;
  if (/^3/.test(code)) return `3rd ${code.slice(1).split('').join('/')}`;
  return code;
}

function formatKickoff(datetime: string): string {
  const d = new Date(datetime);
  const date = d.toLocaleDateString('he-IL', { timeZone: ISRAEL_TZ, day: 'numeric', month: 'numeric' });
  const time = d.toLocaleTimeString('he-IL', { timeZone: ISRAEL_TZ, hour: '2-digit', minute: '2-digit', hour12: false });
  return `${date} • ${time} 🇮🇱`;
}

const BracketTeam: React.FC<{ code: string; name: string; goals: number | null }> = ({ code, name, goals }) => (
  <div className="bracket-team">
    <Flag code={code} name={name} className="bracket-flag" />
    <span className="bracket-name">{teamLabel(code, name)}</span>
    {goals !== null && <span className="bracket-score">{goals}</span>}
  </div>
);

const BracketMatch: React.FC<{ match: Match }> = ({ match }) => (
  <div className="bracket-match">
    <div className="bracket-match-time">{formatKickoff(match.datetime)}</div>
    <BracketTeam code={match.home_team.code} name={match.home_team.name} goals={match.home_team.goals} />
    <BracketTeam code={match.away_team.code} name={match.away_team.name} goals={match.away_team.goals} />
    <div className="bracket-venue">{match.venue}</div>
  </div>
);

export const Bracket: React.FC = () => {
  const fetcher = useCallback(() => fetchAllMatches(), []);
  const { data: matches, loading } = useLiveData<Match[]>(fetcher, 120000);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>Loading bracket...</p>
      </div>
    );
  }

  const all = matches || [];
  const byRound = (key: string) =>
    all.filter((m) => m.stage_name === key).sort((a, b) => a.id - b.id);

  const thirdPlace = all.filter((m) => m.stage_name === 'Third place play-off');

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>🗺️ Knockout Bracket</h2>
      <div className="bracket-scroll">
        <div className="bracket-grid">
          {ROUNDS.map((round) => {
            const roundMatches = byRound(round.key);
            if (roundMatches.length === 0) return null;
            return (
              <div className="bracket-column" key={round.key}>
                <h3 className="bracket-round-title">{round.label}</h3>
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
          <h3 className="bracket-round-title">🥉 Third Place Play-off</h3>
          {thirdPlace.map((m) => (
            <BracketMatch key={m.id} match={m} />
          ))}
        </div>
      )}
    </div>
  );
};
