import React from 'react';
import { Group } from '../api/types';
import { Flag } from '../utils/flags';
import { FormResult } from '../api/mockData';
import { QualChance } from '../api/qualification';
import { useI18n } from '../i18n';

interface TeamFollowApi {
  isFavorite: (code: string) => boolean;
  toggle: (code: string) => void;
}

interface Props {
  group: Group;
  form?: Record<string, FormResult[]>;
  qual?: Record<string, QualChance>;
  teamFollow?: TeamFollowApi;
}

const QualBadge: React.FC<{ chance?: QualChance }> = ({ chance }) => {
  const { t } = useI18n();
  if (!chance) return null;
  if (chance.status === 'Qualified') {
    if (chance.round) {
      return <span className="qual-badge qual-q" title={t('group.qualifiedTitle')}>{chance.round}</span>;
    }
    return <span className="qual-badge qual-q" title={t('group.qualifiedTitle')}>✓</span>;
  }
  if (chance.status === 'Eliminated') {
    return <span className="qual-badge qual-out" title={t('group.eliminatedTitle')}>✕</span>;
  }
  // Still alive but not mathematically decided — never show a bare 0%/100%,
  // which would read as "out"/"through". Clamp to <1% / >99%.
  const pct = chance.pAdvance <= 0 ? '<1%' : chance.pAdvance >= 100 ? '>99%' : `${chance.pAdvance}%`;
  return (
    <span
      className="qual-badge qual-pct"
      title={t('group.advanceTitle', { pct: `${chance.pAdvance}%`, top2: `${chance.pTop2}%` })}
    >
      {pct}
    </span>
  );
};

const FormDots: React.FC<{ results?: FormResult[] }> = ({ results }) => {
  if (!results || results.length === 0) return <span className="form-empty">—</span>;
  return (
    <span className="form-dots">
      {results.map((r, i) => (
        <span key={i} className={`form-dot form-${r}`} title={r}>
          {r}
        </span>
      ))}
    </span>
  );
};

export const GroupTable: React.FC<Props> = ({ group, form, qual, teamFollow }) => {
  const { t } = useI18n();
  return (
    <div className="card group-section">
      <h3>{t('group.label', { letter: group.letter })}</h3>
      <div className="table-scroll">
        <table className="standings-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{t('col.team')}</th>
              <th>P</th>
              <th>W</th>
              <th>D</th>
              <th>L</th>
              <th>GF</th>
              <th>GA</th>
              <th>GD</th>
              <th>Pts</th>
              <th>{t('col.form')}</th>
            </tr>
          </thead>
          <tbody>
            {group.teams.map((standing, idx) => {
              const code = standing.team.code;
              const fav = teamFollow?.isFavorite(code) ?? false;
              return (
                <tr key={code} className={idx < 2 ? 'qualified' : ''}>
                  <td>{idx + 1}</td>
                  <td className="team-name">
                    {teamFollow && (
                      <button
                        className={`follow-btn team-fav-btn${fav ? ' following' : ''}`}
                        onClick={() => teamFollow.toggle(code)}
                        title={fav ? t('fav.remove') : t('fav.add')}
                        aria-label={fav ? t('fav.remove') : t('fav.add')}
                      >
                        {fav ? '★' : '☆'}
                      </button>
                    )}
                    <Flag code={code} name={standing.team.name} /> {standing.team.name}
                    <QualBadge chance={qual?.[code]} />
                  </td>
                  <td>{standing.played}</td>
                  <td>{standing.won}</td>
                  <td>{standing.drawn}</td>
                  <td>{standing.lost}</td>
                  <td>{standing.goals_for}</td>
                  <td>{standing.goals_against}</td>
                  <td>{standing.goal_difference}</td>
                  <td className="points">{standing.points}</td>
                  <td><FormDots results={form?.[code]} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
