import React from 'react';
import { Group } from '../api/types';
import { Flag } from '../utils/flags';
import { FormResult } from '../api/mockData';
import { QualChance } from '../api/qualification';

interface Props {
  group: Group;
  form?: Record<string, FormResult[]>;
  qual?: Record<string, QualChance>;
}

const QualBadge: React.FC<{ chance?: QualChance }> = ({ chance }) => {
  if (!chance) return null;
  if (chance.status === 'Qualified') {
    return <span className="qual-badge qual-q" title="Qualified for the Round of 32">✓</span>;
  }
  if (chance.status === 'Eliminated') {
    return <span className="qual-badge qual-out" title="Eliminated">✕</span>;
  }
  return (
    <span
      className="qual-badge qual-pct"
      title={`${chance.pAdvance}% chance to reach the Round of 32 · ${chance.pTop2}% to finish top 2`}
    >
      {chance.pAdvance}%
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

export const GroupTable: React.FC<Props> = ({ group, form, qual }) => {
  return (
    <div className="card group-section">
      <h3>Group {group.letter}</h3>
      <div className="table-scroll">
        <table className="standings-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Team</th>
              <th>P</th>
              <th>W</th>
              <th>D</th>
              <th>L</th>
              <th>GF</th>
              <th>GA</th>
              <th>GD</th>
              <th>Pts</th>
              <th>Form</th>
            </tr>
          </thead>
          <tbody>
            {group.teams.map((standing, idx) => (
              <tr key={standing.team.code} className={idx < 2 ? 'qualified' : ''}>
                <td>{idx + 1}</td>
                <td className="team-name">
                  <Flag code={standing.team.code} name={standing.team.name} /> {standing.team.name}
                  <QualBadge chance={qual?.[standing.team.code]} />
                </td>
                <td>{standing.played}</td>
                <td>{standing.won}</td>
                <td>{standing.drawn}</td>
                <td>{standing.lost}</td>
                <td>{standing.goals_for}</td>
                <td>{standing.goals_against}</td>
                <td>{standing.goal_difference}</td>
                <td className="points">{standing.points}</td>
                <td><FormDots results={form?.[standing.team.code]} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
