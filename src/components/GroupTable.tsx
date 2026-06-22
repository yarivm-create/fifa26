import React from 'react';
import { Group } from '../api/types';
import { getFlag } from '../utils/flags';

interface Props {
  group: Group;
}

export const GroupTable: React.FC<Props> = ({ group }) => {
  return (
    <div className="card group-section">
      <h3>Group {group.letter}</h3>
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
          </tr>
        </thead>
        <tbody>
          {group.teams.map((standing, idx) => (
            <tr key={standing.team.code} className={idx < 2 ? 'qualified' : ''}>
              <td>{idx + 1}</td>
              <td className="team-name">
                <span className="team-flag">{getFlag(standing.team.code)}</span> {standing.team.name}
              </td>
              <td>{standing.played}</td>
              <td>{standing.won}</td>
              <td>{standing.drawn}</td>
              <td>{standing.lost}</td>
              <td>{standing.goals_for}</td>
              <td>{standing.goals_against}</td>
              <td>{standing.goal_difference}</td>
              <td className="points">{standing.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
