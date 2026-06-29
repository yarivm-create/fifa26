import React, { useCallback } from 'react';
import { useLiveData } from '../hooks/useLiveData';
import { fetchStats, TournamentStats, MatchHighlight, TeamStat } from '../api/stats';
import { Flag } from '../utils/flags';
import { useFollowedPlayers } from '../hooks/useFollowedPlayers';
import { useI18n } from '../i18n';

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
  const { t } = useI18n();
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
              title={followed ? t('stats.unfollowPlayer') : t('stats.followPlayer')}
              aria-label={followed ? t('stats.unfollowPlayer') : t('stats.followPlayer')}
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
  const { t } = useI18n();
  const fetcher = useCallback(() => fetchStats(), []);
  const { data: stats, loading, error } = useLiveData<TournamentStats>(fetcher, 60000);
  const follow = useFollowedPlayers();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>{t('loading.stats')}</p>
      </div>
    );
  }

  if (error) {
    return <div className="error">⚠️ {error}</div>;
  }

  if (!stats || stats.playedMatches === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 40 }}>
        <p style={{ color: 'var(--wc-text-muted)' }}>{t('stats.willAppear')}</p>
      </div>
    );
  }

  const progressPct = (stats.playedMatches / stats.totalMatches) * 100;

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>{t('stats.title')}</h2>

      <div className="stat-progress">
        <div className="stat-progress-head">
          <span>{t('stats.progress')}</span>
          <span>{t('stats.matchesOf', { played: stats.playedMatches, total: stats.totalMatches })}</span>
        </div>
        <div className="stat-progress-bar">
          <span className="stat-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="stat-grid">
        <StatTile value={String(stats.totalGoals)} label={t('stats.totalGoals')} accent="var(--wc-gold)" />
        <StatTile value={stats.avgGoalsPerMatch.toFixed(2)} label={t('stats.goalsPerMatch')} accent="var(--wc-secondary)" />
        <StatTile value={String(stats.playedMatches)} label={t('stats.matchesPlayed')} />
        <StatTile value={String(stats.upcomingMatches)} label={t('stats.upcoming')} />
        <StatTile value={String(stats.cleanSheets)} label={t('stats.cleanSheets')} accent="var(--wc-blue)" />
        <StatTile value={`${stats.bttsPct.toFixed(0)}%`} label={t('stats.btts')} accent="var(--wc-green)" />
      </div>

      <PlayerBoard
        title={t('stats.goldenBoot')}
        icon="⚽"
        rows={stats.topScorers.map((s) => ({ id: s.id, name: s.name, code: s.code, value: s.goals }))}
        follow={follow}
      />

      <PlayerBoard
        title={t('stats.playmakers')}
        icon="🅰️"
        rows={stats.topAssists.map((a) => ({ id: a.id, name: a.name, code: a.code, value: a.assists }))}
        follow={follow}
      />

      <p className="follow-hint">{t('stats.followHint')}</p>

      <div className="stat-highlights">
        <HighlightCard title={t('stats.biggestWin')} highlight={stats.biggestWin} suffix={t('stats.goalMargin')} />
        <HighlightCard title={t('stats.highestScoring')} highlight={stats.highestScoring} suffix={t('stats.goals')} />
      </div>

      <div className="stat-boards">
        <Leaderboard title={t('stats.topScoringTeams')} rows={stats.topScoringTeams} suffix="GF" />
        <Leaderboard title={t('stats.bestDefenses')} rows={stats.bestDefenses} suffix="GA" />
      </div>

      {stats.goalsByStage.length > 0 && (
        <div className="stat-board" style={{ marginTop: 20 }}>
          <h3 className="stat-board-title">{t('stats.goalsByStage')}</h3>
          {stats.goalsByStage.map((s) => (
            <div className="stat-board-row" key={s.stage}>
              <span className="stat-board-team">{s.stage}</span>
              <span className="stat-board-value">
                {s.matches > 0 ? (
                  <>{s.goals}<span className="stat-board-suffix"> {t('stats.stageSuffix', { matches: `${s.matches}/${s.scheduled}`, avg: (s.goals / s.matches).toFixed(1) })}</span></>
                ) : (
                  <span className="stat-board-suffix">{t('stats.stageUpcoming', { matches: s.scheduled })}</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
