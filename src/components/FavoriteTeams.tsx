import React, { useCallback } from 'react';
import { useLiveData } from '../hooks/useLiveData';
import { fetchGroups, fetchAllMatches, fetchQualification, fetchForm, fetchPlayerStats } from '../api/worldcup';
import { Group, GroupStanding, Match } from '../api/types';
import { QualChance } from '../api/qualification';
import { FormResult } from '../api/mockData';
import { PlayerAgg } from '../api/liveData';
import { Flag } from '../utils/flags';
import { useFollowedTeams } from '../hooks/useFollowedTeams';

const ISRAEL_TZ = 'Asia/Jerusalem';

function formatKickoff(datetime: string): string {
  const d = new Date(datetime);
  const date = d.toLocaleDateString('he-IL', { timeZone: ISRAEL_TZ, day: 'numeric', month: 'numeric' });
  const time = d.toLocaleTimeString('he-IL', { timeZone: ISRAEL_TZ, hour: '2-digit', minute: '2-digit', hour12: false });
  return `${date} ${time}`;
}

const ORDINAL = ['1st', '2nd', '3rd', '4th'];

interface TeamInfo {
  code: string;
  name: string;
  group: string;
  position: number; // 0-based
  standing: GroupStanding;
}

interface Data {
  teams: Record<string, TeamInfo>;
  matches: Match[];
  qual: Record<string, QualChance>;
  form: Record<string, FormResult[]>;
  players: PlayerAgg[];
}

function QualLine({ chance }: { chance?: QualChance }) {
  if (!chance) return null;
  if (chance.status === 'Qualified') {
    return <span className="qual-badge qual-q">✓ Qualified for Round of 32</span>;
  }
  if (chance.status === 'Eliminated') {
    return <span className="qual-badge qual-out">✕ Eliminated</span>;
  }
  const pct = chance.pAdvance <= 0 ? '<1%' : chance.pAdvance >= 100 ? '>99%' : `${chance.pAdvance}%`;
  return <span className="qual-badge qual-pct">{pct} to advance</span>;
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
  data,
  onRemove,
}: {
  info: TeamInfo;
  data: Data;
  onRemove: () => void;
}) {
  const { code, name, group, position, standing } = info;
  const teamMatches = data.matches.filter(
    (m) => m.home_team.code === code || m.away_team.code === code
  );
  const upcoming = teamMatches
    .filter((m) => m.status === 'future_scheduled')
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
    .slice(0, 2);
  const recent = teamMatches
    .filter((m) => m.status === 'completed')
    .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())
    .slice(0, 2);
  const live = teamMatches.find((m) => m.status === 'in_progress' || m.status === 'half_time');

  const topPlayers = data.players
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
              Group {group} · {ORDINAL[position] || `${position + 1}th`}
            </div>
          </div>
        </div>
        <button className="follow-btn following" onClick={onRemove} title="Remove from favorites" aria-label="Remove from favorites">
          ★
        </button>
      </div>

      <div className="team-card-qual">
        <QualLine chance={data.qual[code]} />
      </div>

      <div className="team-stat-grid">
        <div className="team-stat"><span className="team-stat-value">{standing.points}</span><span className="team-stat-label">Pts</span></div>
        <div className="team-stat"><span className="team-stat-value">{standing.played}</span><span className="team-stat-label">Played</span></div>
        <div className="team-stat"><span className="team-stat-value">{standing.won}-{standing.drawn}-{standing.lost}</span><span className="team-stat-label">W-D-L</span></div>
        <div className="team-stat"><span className="team-stat-value">{standing.goals_for}:{standing.goals_against}</span><span className="team-stat-label">GF:GA</span></div>
        <div className="team-stat"><span className="team-stat-value">{standing.goal_difference > 0 ? '+' : ''}{standing.goal_difference}</span><span className="team-stat-label">GD</span></div>
        <div className="team-stat team-stat-form"><FormDots results={data.form[code]} /><span className="team-stat-label">Form</span></div>
      </div>

      {topPlayers.length > 0 && (
        <div className="team-card-section">
          <div className="follow-fixtures-title">Top players</div>
          {topPlayers.map((p) => (
            <div className="team-player-row" key={p.id}>
              <span className="team-player-name">{p.name}</span>
              <span className="team-player-stats">
                {p.goals > 0 && <span>{p.goals} ⚽</span>}
                {p.assists > 0 && <span>{p.assists} 🅰️</span>}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="team-card-section">
        <div className="follow-fixtures-title">Fixtures</div>
        {live && (
          <div className="follow-fixture team-fixture-live">
            <span className="follow-fixture-opp">
              🔴 vs <Flag code={live.home_team.code === code ? live.away_team.code : live.home_team.code} name="" />{' '}
              {live.home_team.code === code ? live.away_team.name : live.home_team.name}
            </span>
            <span className="follow-fixture-time">{live.home_team.goals}-{live.away_team.goals} {live.time || 'LIVE'}</span>
          </div>
        )}
        {recent.map((m) => {
          const opp = m.home_team.code === code ? m.away_team : m.home_team;
          const us = m.home_team.code === code ? m.home_team : m.away_team;
          return (
            <div className="follow-fixture" key={`r-${m.id}`}>
              <span className="follow-fixture-opp">
                vs <Flag code={opp.code} name={opp.name} /> {opp.name}
              </span>
              <span className="follow-fixture-time team-result">{us.goals}-{opp.goals}</span>
            </div>
          );
        })}
        {upcoming.map((m) => {
          const opp = m.home_team.code === code ? m.away_team : m.home_team;
          const isReal = !!data.teams[opp.code];
          return (
            <div className="follow-fixture" key={`u-${m.id}`}>
              <span className="follow-fixture-opp">
                {isReal ? (
                  <>vs <Flag code={opp.code} name={opp.name} /> {opp.name}</>
                ) : (
                  <>🏆 {m.stage_name || 'Knockout'} · TBD</>
                )}
              </span>
              <span className="follow-fixture-time">{formatKickoff(m.datetime)}</span>
            </div>
          );
        })}
        {!live && recent.length === 0 && upcoming.length === 0 && (
          <div className="follow-fixture-empty">No fixtures available.</div>
        )}
      </div>
    </div>
  );
}

export const FavoriteTeams: React.FC = () => {
  const { codes, toggle } = useFollowedTeams();
  const fetcher = useCallback(async (): Promise<Data> => {
    const [groups, matches, qual, form, players] = await Promise.all([
      fetchGroups(),
      fetchAllMatches(),
      fetchQualification(),
      fetchForm(),
      fetchPlayerStats(),
    ]);
    const teams: Record<string, TeamInfo> = {};
    for (const g of groups as Group[]) {
      g.teams.forEach((standing, position) => {
        teams[standing.team.code] = {
          code: standing.team.code,
          name: standing.team.name,
          group: g.letter,
          position,
          standing,
        };
      });
    }
    return { teams, matches, qual, form, players };
  }, []);
  const { data, loading } = useLiveData<Data>(fetcher, 60000);

  if (codes.size === 0) return null;

  const favTeams = data
    ? [...codes]
        .map((c) => data.teams[c])
        .filter((t): t is TeamInfo => !!t)
        .sort((a, b) => a.group.localeCompare(b.group) || a.position - b.position)
    : [];

  return (
    <section className="favorites-section">
      <h2 className="favorites-heading">⭐ Favorite Teams <span className="favorites-count">{codes.size}</span></h2>
      {loading && !data ? (
        <div className="favorites-loading"><div className="spinner" /><span>Loading team details…</span></div>
      ) : favTeams.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 30 }}>
          <p style={{ color: 'var(--wc-text-muted)' }}>Your favorite teams aren't in the group stage data yet.</p>
        </div>
      ) : (
        <div className="follow-grid">
          {favTeams.map((t) => (
            <TeamCard key={t.code} info={t} data={data!} onRemove={() => toggle(t.code)} />
          ))}
        </div>
      )}
    </section>
  );
};
