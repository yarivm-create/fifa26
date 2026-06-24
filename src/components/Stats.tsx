import React, { useCallback } from 'react';
import { useLiveData } from '../hooks/useLiveData';
import { fetchStats, TournamentStats, MatchHighlight, TeamStat } from '../api/stats';
import { Flag } from '../utils/flags';
import { useFollowedPlayers } from '../hooks/useFollowedPlayers';

interface PlayerRow {
  id: string;
  name: string;
  code: string;
  value: number;
}

interface FollowApi {
  isFollowed: (id: string) => boolean;
  toggle: (id: string) => void;
}

function StatTile({ value, label, accent }: { value: string; label: string; accent?: string }) {
  return (
    <div className="stat-tile">
      <div className="stat-value" style={accent ? { color: accent } : undefined}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function HighlightCard({ title, highlight, suffix }: { title: string; highlight: MatchHighlight | null; suffix: string }) {
  if (!highlight) return null;
  const { match, value } = highlight;
  return (
    <div className="stat-highlight">
      <div className="stat-highlight-title">{title}</div>
      <div className="stat-highlight-teams">
        <span><Flag code={match.home_team.code} name={match.home_team.name} /> {match.home_team.name}</span>
        <span className="stat-highlight-score">{match.home_team.goals}–{match.away_team.goals}</span>
        <span>{match.away_team.name} <Flag code={match.away_team.code} name={match.away_team.name} /></span>
      </div>
      <div className="stat-highlight-meta">{value} {suffix} • {match.stage_name}</div>
    </div>
  );
}

function Leaderboard({ title, rows, suffix }: { title: string; rows: TeamStat[]; suffix: string }) {
  if (rows.length === 0) return null;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="stat-board">
      <h3 className="stat-board-title">{title}</h3>
      {rows.map((r, i) => (
        <div className="stat-board-row" key={r.code + i}>
          <span className="stat-board-rank">{i + 1}</span>
          <span className="stat-board-team"><Flag code={r.code} name={r.name} /> {r.name}</span>
          <span className="stat-board-bar">
            <span className="stat-board-fill" style={{ width: `${Math.max((r.value / max) * 100, 6)}%` }} />
          </span>
          <span className="stat-board-value">{r.value}<span className="stat-board-suffix"> {suffix}</span></span>
        </div>
      ))}
    </div>
  );
}

function PlayerBoard({
  title,
  icon,
  rows,
  follow,
}: {
  title: string;
  icon: string;
  rows: PlayerRow[];
  follow: FollowApi;
}) {
  if (rows.length === 0) return null;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="stat-board stat-board-scorers">
      <h3 className="stat-board-title">{title}</h3>
      {rows.map((r, i) => {
        const followed = follow.isFollowed(r.id);
        return (
          <div className="stat-board-row" key={r.id}>
            <span className={`stat-board-rank${i === 0 ? ' gold' : ''}`}>{i + 1}</span>
            <button
              className={`follow-btn${followed ? ' following' : ''}`}
              onClick={() => follow.toggle(r.id)}
              title={followed ? 'Unfollow player' : 'Follow player'}
              aria-label={followed ? 'Unfollow player' : 'Follow player'}
            >
              {followed ? '★' : '☆'}
            </button>
            <span className="stat-board-team"><Flag code={r.code} name={r.name} /> {r.name}</span>
            <span className="stat-board-bar">
              <span className="stat-board-fill" style={{ width: `${Math.max((r.value / max) * 100, 8)}%` }} />
            </span>
            <span className="stat-board-value">{r.value}<span className="stat-board-suffix"> {icon}</span></span>
          </div>
        );
      })}
    </div>
  );
}

export const Stats: React.FC = () => {
  const fetcher = useCallback(() => fetchStats(), []);
  const { data: stats, loading, error } = useLiveData<TournamentStats>(fetcher, 60000);
  const follow = useFollowedPlayers();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>Loading tournament statistics...</p>
      </div>
    );
  }

  if (error) {
    return <div className="error">⚠️ {error}</div>;
  }

  if (!stats || stats.playedMatches === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 40 }}>
        <p style={{ color: 'var(--wc-text-muted)' }}>Statistics will appear once matches are played.</p>
      </div>
    );
  }

  const progressPct = (stats.playedMatches / stats.totalMatches) * 100;

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>📊 Tournament Statistics</h2>

      <div className="stat-progress">
        <div className="stat-progress-head">
          <span>Tournament Progress</span>
          <span>{stats.playedMatches} / {stats.totalMatches} matches</span>
        </div>
        <div className="stat-progress-bar">
          <span className="stat-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="stat-grid">
        <StatTile value={String(stats.totalGoals)} label="Total Goals" accent="var(--wc-gold)" />
        <StatTile value={stats.avgGoalsPerMatch.toFixed(2)} label="Goals / Match" accent="var(--wc-secondary)" />
        <StatTile value={String(stats.playedMatches)} label="Matches Played" />
        <StatTile value={String(stats.upcomingMatches)} label="Upcoming" />
        <StatTile value={String(stats.cleanSheets)} label="Clean Sheets" accent="var(--wc-blue)" />
        <StatTile value={`${stats.bttsPct.toFixed(0)}%`} label="Both Teams Scored" accent="var(--wc-green)" />
      </div>

      <PlayerBoard
        title="👟 Golden Boot Race — Top Scorers"
        icon="⚽"
        rows={stats.topScorers.map((s) => ({ id: s.id, name: s.name, code: s.code, value: s.goals }))}
        follow={follow}
      />

      <PlayerBoard
        title="🎯 Playmakers — Top Assists"
        icon="🅰️"
        rows={stats.topAssists.map((a) => ({ id: a.id, name: a.name, code: a.code, value: a.assists }))}
        follow={follow}
      />

      <p className="follow-hint">⭐ Tap ☆ next to a player to follow them — see them in the “My Favorites” tab.</p>

      <div className="stat-highlights">
        <HighlightCard title="🔥 Biggest Win" highlight={stats.biggestWin} suffix="goal margin" />
        <HighlightCard title="⚽ Highest Scoring" highlight={stats.highestScoring} suffix="goals" />
      </div>

      <div className="stat-boards">
        <Leaderboard title="🥅 Top Scoring Teams" rows={stats.topScoringTeams} suffix="GF" />
        <Leaderboard title="🛡️ Best Defenses" rows={stats.bestDefenses} suffix="GA" />
      </div>

      {stats.goalsByStage.length > 0 && (
        <div className="stat-board" style={{ marginTop: 20 }}>
          <h3 className="stat-board-title">⚡ Goals by Stage</h3>
          {stats.goalsByStage.map((s) => (
            <div className="stat-board-row" key={s.stage}>
              <span className="stat-board-team">{s.stage}</span>
              <span className="stat-board-value">
                {s.goals}<span className="stat-board-suffix"> goals · {s.matches} matches · {(s.goals / s.matches).toFixed(1)}/match</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
