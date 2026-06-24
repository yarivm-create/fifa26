import React from 'react';
import { FavoriteTeams } from './FavoriteTeams';
import { Following } from './Following';
import { useFollowedTeams } from '../hooks/useFollowedTeams';
import { useFollowedPlayers } from '../hooks/useFollowedPlayers';

// Combined "My Favorites" tab: favorite teams (from Standings ☆) and followed
// players (from Stats ☆). Each child renders null when it has no entries, so a
// single shared empty-state is shown only when nothing is favorited at all.
export const Favorites: React.FC = () => {
  const { codes } = useFollowedTeams();
  const { ids } = useFollowedPlayers();

  if (codes.size === 0 && ids.size === 0) {
    return (
      <div>
        <h2 style={{ marginBottom: 20 }}>⭐ My Favorites</h2>
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '2.4rem', marginBottom: 8 }}>⭐</div>
          <p style={{ color: 'var(--wc-text)', fontWeight: 600 }}>Nothing favorited yet</p>
          <p style={{ color: 'var(--wc-text-muted)', fontSize: '0.85rem', marginTop: 6 }}>
            Tap ☆ next to a team in <strong>Standings</strong> to follow a team, or next to a player in{' '}
            <strong>Stats</strong> to follow a player. They'll show up here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-tab">
      <FavoriteTeams />
      <Following />
    </div>
  );
};
