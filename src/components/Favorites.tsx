import React from 'react';
import { FavoriteTeams } from './FavoriteTeams';
import { Following } from './Following';
import { useFollowedTeams } from '../hooks/useFollowedTeams';
import { useFollowedPlayers } from '../hooks/useFollowedPlayers';

// Compact discovery prompt shown for whichever section is still empty, so a
// user who has only teams (or only players) still learns how to add the other.
const SectionPrompt: React.FC<{ heading: string; icon: string; children: React.ReactNode }> = ({
  heading,
  icon,
  children,
}) => (
  <section className="favorites-section">
    <h2 className="favorites-heading">{heading}</h2>
    <div className="favorites-prompt">
      <span className="favorites-prompt-icon">{icon}</span>
      <p>{children}</p>
    </div>
  </section>
);

// Combined "My Favorites" tab: favorite teams (from Standings ☆) and followed
// players (from Stats ☆).
export const Favorites: React.FC = () => {
  const { codes } = useFollowedTeams();
  const { ids } = useFollowedPlayers();
  const hasTeams = codes.size > 0;
  const hasPlayers = ids.size > 0;

  if (!hasTeams && !hasPlayers) {
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
      <h2 className="favorites-tab-title">⭐ My Favorites</h2>
      {hasTeams ? (
        <FavoriteTeams />
      ) : (
        <SectionPrompt heading="⭐ Favorite Teams" icon="🏆">
          Tap ☆ next to a team in the <strong>Standings</strong> tab to add it here.
        </SectionPrompt>
      )}
      {hasPlayers ? (
        <Following />
      ) : (
        <SectionPrompt heading="👤 Followed Players" icon="⚽">
          Tap ☆ next to a player in the <strong>Stats</strong> tab to follow them here.
        </SectionPrompt>
      )}
    </div>
  );
};

