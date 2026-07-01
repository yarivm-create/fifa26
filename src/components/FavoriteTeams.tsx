import React, { useCallback } from 'react';
import { useLiveData } from '../hooks/useLiveData';
import { fetchPlayerStats, fetchFavTeamsCore } from '../api/worldcup';
import { GroupStanding, Match } from '../api/types';
import { QualChance } from '../api/qualification';
import { FormResult } from '../api/mockData';
import { PlayerAgg } from '../api/liveData';
import { Flag } from '../utils/flags';
import { Trophy } from './Trophy';
import { formatLocalDate, formatLocalTime } from '../utils/localTime';
import { useFollowedTeams } from '../hooks/useFollowedTeams';
import { useFollowedPlayers } from '../hooks/useFollowedPlayers';
import { getMatchResult } from '../utils/matchResult';
import { knockoutState, KnockoutState } from '../utils/knockoutState';
import { useI18n } from '../i18n';

function formatKickoff(datetime: string): string {
  return `${formatLocalDate(datetime, { weekday: 'short', day: 'numeric', month: 'numeric' })} ${formatLocalTime(datetime)}`;
}

const ORDINAL = ['1st', '2nd', '3rd', '4th'];

// Live knockout progress for a favorite team is computed by the shared
// knockoutState helper (penalty-aware), so the Favorites card shows the CURRENT
// state (Round of 16 / Eliminated / 🏆) while the group tables stay group tables.
const KO_LABEL = ['stage.r32', 'stage.r16', 'stage.qf', 'stage.sf', 'stage.final'];


interface TeamInfo {
  code: string;
  name: string;
  group: string;
  position: number; // 0-based
  standing: GroupStanding;
}

// Core data drives the whole team-card grid and comes entirely from cheap,
// already-cached sources (groups/matches/qual/form). Player aggregates are
// fetched separately so the (expensive) per-match timeline aggregation never
// blocks the 30+ team cards from rendering — the "Top Players" sub-section just
// fills in progressively once the aggregation resolves.
interface CoreData {
  teams: Record<string, TeamInfo>;
  matches: Match[];
  qual: Record<string, QualChance>;
  form: Record<string, FormResult[]>;
}

function QualLine({ chance, ko }: { chance?: QualChance; ko?: KnockoutState | null }) {
  const { t } = useI18n();
  // Once a team reaches the knockouts, show its live state instead of the
  // group-stage chance: eliminated, the round it's in, or champion.
  if (ko) {
    if (ko.champion) return <span className="qual-badge qual-q">🏆 {t('stage.final')}</span>;
    if (ko.eliminated)
      return <span className="qual-badge qual-out">{t('group.eliminated')} · {t(KO_LABEL[ko.reached])}</span>;
    return <span className="qual-badge qual-q">{t(KO_LABEL[ko.reached])}</span>;
  }
  if (!chance) return null;
  if (chance.status === 'Qualified') {
    return <span className="qual-badge qual-q">{t('group.qualified')}</span>;
  }
  if (chance.status === 'Eliminated') {
    return <span className="qual-badge qual-out">{t('group.eliminated')}</span>;
  }
  const pct = chance.pAdvance <= 0 ? '<1%' : chance.pAdvance >= 100 ? '>99%' : `${chance.pAdvance}%`;
  return <span className="qual-badge qual-pct">{t('group.toAdvance', { pct })}</span>;
}

function FormDots({ results }: { results?: FormResult[] }) {
  if (!results || results.length === 0) return <span className="form-empty">—</span>;
  return (
    <span className="form-dots">
      {results.map((r, i) => (
        <span key={i} className={`form-dot form-${r}`} title={r}>{r}</span>
      ))}
    </span>
  );
}

function TeamCard({
  info,
  core,
  players,
  onRemove,
}: {
  info: TeamInfo;
  core: CoreData;
  players: PlayerAgg[];
  onRemove: () => void;
}) {
  const { t, lang } = useI18n();
  const playerFollow = useFollowedPlayers();
  const { code, name, group, position, standing } = info;
  const teamMatches = core.matches.filter(
    (m) => m.home_team.code === code || m.away_team.code === code
  );
  const allFixtures = [...teamMatches].sort(
    (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
  );

  const topPlayers = players
    .filter((p) => p.code === code && (p.goals > 0 || p.assists > 0))
    .sort((a, b) => b.goals * 2 + b.assists - (a.goals * 2 + a.assists))
    .slice(0, 3);

  return (
    <div className="card follow-card team-card">
      <div className="follow-card-head">
        <div className="follow-card-id">
          <Flag code={code} name={name} />
          <div>
            <div className="follow-card-name">{name}</div>
            <div className="follow-card-team">
              {t('group.label', { letter: group })} · {lang === 'he' ? `מקום ${position + 1}` : (ORDINAL[position] || `${position + 1}th`)}
            </div>
          </div>
        </div>
        <button className="follow-btn following" onClick={onRemove} title={t('card.removeFav')} aria-label={t('card.removeFav')}>
          ★
        </button>
      </div>

      <div className="team-card-qual">
        <QualLine chance={core.qual[code]} ko={knockoutState(code, core.matches)} />
      </div>

      <div className="team-stat-caption">{t('card.groupStageRecord')}</div>
      <div className="team-stat-grid">
        <div className="team-stat"><span className="team-stat-value">{standing.points}</span><span className="team-stat-label">{t('card.pts')}</span></div>
        <div className="team-stat"><span className="team-stat-value">{standing.played}</span><span className="team-stat-label">{t('card.played')}</span></div>
        <div className="team-stat"><span className="team-stat-value">{standing.won}-{standing.drawn}-{standing.lost}</span><span className="team-stat-label">{t('card.wdl')}</span></div>
        <div className="team-stat"><span className="team-stat-value">{standing.goals_for}:{standing.goals_against}</span><span className="team-stat-label">{t('card.gfga')}</span></div>
        <div className="team-stat"><span className="team-stat-value">{standing.goal_difference > 0 ? '+' : ''}{standing.goal_difference}</span><span className="team-stat-label">{t('card.gd')}</span></div>
        <div className="team-stat team-stat-form"><FormDots results={core.form[code]} /><span className="team-stat-label">{t('card.form')}</span></div>
      </div>

      {topPlayers.length > 0 && (
        <div className="team-card-section">
          <div className="follow-fixtures-title">{t('card.topPlayers')}</div>
          {topPlayers.map((p) => {
            const followed = playerFollow.isFollowed(p.id);
            return (
              <div className="team-player-row" key={p.id}>
                <button
                  className={`follow-btn team-fav-btn${followed ? ' following' : ''}`}
                  onClick={() => playerFollow.toggle(p.id)}
                  title={followed ? t('stats.unfollowPlayer') : t('stats.followPlayer')}
                  aria-label={followed ? t('stats.unfollowPlayer') : t('stats.followPlayer')}
                >
                  {followed ? '★' : '☆'}
                </button>
                <span className="team-player-name">{p.name}</span>
                <span className="team-player-stats">
                  {p.goals > 0 && <span>{p.goals} ⚽</span>}
                  {p.assists > 0 && <span>{p.assists} 🅰️</span>}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="team-card-section">
        <div className="follow-fixtures-title">{t('card.fixtures')}</div>
        {(() => {
          let lastStage = '';
          return allFixtures.map((m) => {
            const opp = m.home_team.code === code ? m.away_team : m.home_team;
            const us = m.home_team.code === code ? m.home_team : m.away_team;
            const isLive = m.status === 'in_progress' || m.status === 'half_time';
            const isCompleted = m.status === 'completed' && us.goals !== null && opp.goals !== null;
            const isReal = !!core.teams[opp.code];
            const stage = m.stage_name ? m.stage_name.split(' - ')[0] : '';
            const header = stage && stage !== lastStage;
            lastStage = stage;
            // Penalty-aware result so a 1-1 (won/lost on penalties) knockout shows
            // the right ✓/✕ and the shootout score, matching every other tab.
            const r = getMatchResult(m);
            const usWon = m.home_team.code === code ? r.homeWon : r.awayWon;
            const usLost = m.home_team.code === code ? r.awayWon : r.homeWon;
            const usPen = us.penalties;
            const oppPen = opp.penalties;
            const hasPens = usPen != null && oppPen != null;
            const resultSuffix = hasPens
              ? ` (${usPen}-${oppPen} ${t('status.pens')})`
              : m.decidedBy === 'extra_time'
                ? ` (${t('status.aet')})`
                : '';
            return (
              <React.Fragment key={`f-${m.id}`}>
                {header && <div className="fixture-stage-head">{stage}</div>}
                <div className={`follow-fixture${isLive ? ' team-fixture-live' : ''}`}>
                  <span className="follow-fixture-opp">
                    {isLive && '🔴 '}
                    {isReal ? (
                      <>{t('card.vs')} <Flag code={opp.code} name={opp.name} /> {opp.name}</>
                    ) : (
                      <>{t('card.vs')} <Trophy size={14} /> {t('card.tbd')}</>
                    )}
                  </span>
                  {isLive ? (
                    <span className="follow-fixture-time">
                      {us.goals}-{opp.goals}{hasPens ? ` (${usPen}-${oppPen})` : ''} {m.time || t('status.live')}
                    </span>
                  ) : isCompleted ? (
                    <span className={`follow-fixture-time team-result fx-${usWon ? 'w' : usLost ? 'l' : 'd'}`}>
                      {usWon ? '✓ ' : usLost ? '✕ ' : ''}{us.goals}-{opp.goals}{resultSuffix}
                    </span>
                  ) : (
                    <span className="follow-fixture-time">{formatKickoff(m.datetime)}</span>
                  )}
                </div>
              </React.Fragment>
            );
          });
        })()}
        {allFixtures.length === 0 && (
          <div className="follow-fixture-empty">{t('card.noFixtures')}</div>
        )}
      </div>
    </div>
  );
}

export const FavoriteTeams: React.FC = () => {
  const { t } = useI18n();
  const { codes, toggle } = useFollowedTeams();
  const coreFetcher = useCallback((): Promise<CoreData> => fetchFavTeamsCore(), []);
  // Core (cheap/cached) renders the cards immediately; player aggregates load
  // separately under the shared 'playerAggs' key so the (expensive) timeline
  // aggregation fills the Top Players sub-section without blocking the grid.
  const { data: core, loading } = useLiveData<CoreData>(coreFetcher, 60000, 'favTeamsCore');
  const playersFetcher = useCallback(() => fetchPlayerStats(), []);
  const { data: players } = useLiveData<PlayerAgg[]>(playersFetcher, 60000, 'playerAggs');

  if (codes.size === 0) return null;

  const favTeams = core
    ? [...codes]
        .map((c) => core.teams[c])
        .filter((t): t is TeamInfo => !!t)
        .sort((a, b) => a.group.localeCompare(b.group) || a.position - b.position)
    : [];

  return (
    <section className="favorites-section">
      <h2 className="favorites-heading">{t('fav.teams')} <span className="favorites-count">{codes.size}</span></h2>
      {loading && !core ? (
        <div className="favorites-loading"><div className="spinner" /><span>{t('loading.teamDetails')}</span></div>
      ) : favTeams.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 30 }}>
          <p style={{ color: 'var(--wc-text-muted)' }}>{t('fav.teamsNotInData')}</p>
        </div>
      ) : (
        <div className="follow-grid">
          {favTeams.map((tm) => (
            <TeamCard key={tm.code} info={tm} core={core!} players={players ?? []} onRemove={() => toggle(tm.code)} />
          ))}
        </div>
      )}
    </section>
  );
};
