import React from 'react';
import { FavoriteTeams } from './FavoriteTeams';
import { Following } from './Following';
import { useFollowedTeams } from '../hooks/useFollowedTeams';
import { useFollowedPlayers } from '../hooks/useFollowedPlayers';
import { useI18n } from '../i18n';
import { Trophy } from './Trophy';

// Compact discovery prompt shown for whichever section is still empty, so a
// user who has only teams (or only players) still learns how to add the other.
const SectionPrompt: React.FC<{ heading: string; icon: React.ReactNode; children: React.ReactNode }> = ({
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
  const { t } = useI18n();
  const { codes } = useFollowedTeams();
  const { ids } = useFollowedPlayers();
  const hasTeams = codes.size > 0;
  const hasPlayers = ids.size > 0;

  if (!hasTeams && !hasPlayers) {
    return (
      <div>
        <h2 style={{ marginBottom: 20 }}>{t('fav.title')}</h2>
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '2.4rem', marginBottom: 8 }}>⭐</div>
          <p style={{ color: 'var(--wc-text)', fontWeight: 600 }}>{t('fav.nothing')}</p>
          <p style={{ color: 'var(--wc-text-muted)', fontSize: '0.85rem', marginTop: 6 }}>
            {t('fav.emptyHint')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-tab">
      <h2 className="favorites-tab-title">{t('fav.title')}</h2>
      {hasPlayers ? (
        <Following />
      ) : (
        <SectionPrompt heading={t('fav.players')} icon="⚽">
          {t('fav.playersPrompt')}
        </SectionPrompt>
      )}
      {hasTeams ? (
        <FavoriteTeams />
      ) : (
        <SectionPrompt heading={t('fav.teams')} icon={<Trophy size={28} />}>
          {t('fav.teamsPrompt')}
        </SectionPrompt>
      )}
    </div>
  );
};

