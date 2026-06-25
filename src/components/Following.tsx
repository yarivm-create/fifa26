import React, { useCallback } from 'react';
import { useLiveData } from '../hooks/useLiveData';
import { fetchPlayerStats, fetchAllMatches } from '../api/worldcup';
import { PlayerAgg } from '../api/liveData';
import { Match } from '../api/types';
import { Flag } from '../utils/flags';
import { formatLocalDate, formatLocalTime } from '../utils/localTime';
import { useFollowedPlayers } from '../hooks/useFollowedPlayers';

function formatKickoff(datetime: string): string {
  return `${formatLocalDate(datetime, { day: 'numeric', month: 'numeric' })} ${formatLocalTime(datetime)}`;
}

interface Data {
  players: PlayerAgg[];
  matches: Match[];
}

function PlayerCard({
  player,
  matches,
  teamName,
  onUnfollow,
}: {
  player: PlayerAgg;
  matches: Match[];
  teamName: string;
  onUnfollow: () => void;
}) {
  const upcoming = matches
    .filter(
      (m) =>
        (m.home_team.code === player.code || m.away_team.code === player.code) &&
        m.status !== 'completed' &&
        m.status !== 'in_progress' &&
        m.status !== 'half_time'
    )
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
    .slice(0, 3);

  return (
    <div className="card follow-card">
      <div className="follow-card-head">
        <div className="follow-card-id">
          <Flag code={player.code} name={teamName} />
          <div>
            <div className="follow-card-name">{player.name}</div>
            <div className="follow-card-team">{teamName || player.code}</div>
          </div>
        </div>
        <button className="follow-btn following" onClick={onUnfollow} title="Unfollow" aria-label="Unfollow">
          ★
        </button>
      </div>

      <div className="follow-card-stats">
        <div className="follow-stat">
          <span className="follow-stat-value">{player.goals}</span>
          <span className="follow-stat-label">⚽ Goals</span>
        </div>
        <div className="follow-stat">
          <span className="follow-stat-value">{player.assists}</span>
          <span className="follow-stat-label">🅰️ Assists</span>
        </div>
      </div>

      <div className="follow-card-fixtures">
        <div className="follow-fixtures-title">Upcoming {teamName || ''} matches</div>
        {upcoming.length === 0 ? (
          <div className="follow-fixture-empty">No upcoming matches scheduled.</div>
        ) : (
          upcoming.map((m) => {
            const oppHome = m.home_team.code !== player.code;
            const opp = oppHome ? m.home_team : m.away_team;
            return (
              <div className="follow-fixture" key={m.id}>
                <span className="follow-fixture-opp">
                  vs <Flag code={opp.code} name={opp.name} /> {opp.name}
                </span>
                <span className="follow-fixture-time">{formatKickoff(m.datetime)}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export const Following: React.FC = () => {
  const { ids, toggle } = useFollowedPlayers();
  const fetcher = useCallback(async (): Promise<Data> => {
    const [players, matches] = await Promise.all([fetchPlayerStats(), fetchAllMatches()]);
    return { players, matches };
  }, []);
  const { data, loading } = useLiveData<Data>(fetcher, 60000);

  if (ids.size === 0) {
    return null;
  }

  const codeName: Record<string, string> = {};
  const byId = new Map<string, PlayerAgg>();
  if (data) {
    for (const m of data.matches) {
      codeName[m.home_team.code] = m.home_team.name;
      codeName[m.away_team.code] = m.away_team.name;
    }
    for (const p of data.players) byId.set(p.id, p);
  }
  const followed = [...ids]
    .map((id) => byId.get(id))
    .filter((p): p is PlayerAgg => !!p)
    .sort((a, b) => b.goals + b.assists - (a.goals + a.assists));

  return (
    <section className="favorites-section">
      <h2 className="favorites-heading">👤 Followed Players <span className="favorites-count">{ids.size}</span></h2>
      {loading && !data ? (
        <div className="favorites-loading"><div className="spinner" /><span>Loading player details…</span></div>
      ) : followed.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--wc-text-muted)' }}>
            Your followed players haven't recorded goals or assists yet — check back after their next match.
          </p>
        </div>
      ) : (
        <div className="follow-grid">
          {followed.map((p) => (
            <PlayerCard
              key={p.id}
              player={p}
              matches={data!.matches}
              teamName={codeName[p.code] || p.code}
              onUnfollow={() => toggle(p.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
};
