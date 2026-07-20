import React, { useCallback, useState } from 'react';
import { Champion } from '../utils/champion';
import { Flag } from '../utils/flags';
import { Trophy } from './Trophy';
import { useI18n } from '../i18n';

const DISMISS_KEY = 'wc2026:champion-dismissed';

// A few decorative confetti ribbons scattered along the top of the banner. Pure
// eye-candy (aria-hidden); under prefers-reduced-motion the global CSS reset
// freezes their animation so they simply sit still.
const CONFETTI = [
  { left: '6%', hue: 46, delay: 0 },
  { left: '18%', hue: 0, delay: 260 },
  { left: '31%', hue: 150, delay: 120 },
  { left: '44%', hue: 280, delay: 420 },
  { left: '57%', hue: 200, delay: 200 },
  { left: '69%', hue: 46, delay: 340 },
  { left: '82%', hue: 330, delay: 90 },
  { left: '93%', hue: 90, delay: 500 },
];

// The headline celebration shown on the main page once the World Cup Final is
// decided. Data-driven: it only renders when getChampion() has a real winner.
export const ChampionBanner: React.FC<{ champion: Champion }> = ({ champion }) => {
  const { t } = useI18n();

  // Dismissal is remembered per-champion: if a (different) champion is ever
  // crowned the banner returns, but the same one stays dismissed across reloads.
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === champion.team.code;
    } catch {
      return false;
    }
  });

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, champion.team.code);
    } catch {
      /* private mode / quota — dismissal just won't persist */
    }
  }, [champion.team.code]);

  if (dismissed) return null;

  const loser = champion.runnerUp.name;
  const resultLine =
    champion.decidedBy === 'penalties' && champion.winnerPens != null && champion.loserPens != null
      ? t('champion.beatPens', { loser, pw: champion.winnerPens, pl: champion.loserPens })
      : champion.decidedBy === 'extra_time'
        ? t('champion.beatAet', { loser, w: champion.winnerGoals, l: champion.loserGoals })
        : t('champion.beat', { loser, w: champion.winnerGoals, l: champion.loserGoals });

  return (
    <section
      className="champion-banner"
      role="region"
      aria-label={t('champion.aria', { team: champion.team.name })}
    >
      <div className="champion-confetti" aria-hidden="true">
        {CONFETTI.map((c, i) => (
          <span
            key={i}
            className="champion-confetti-piece"
            style={{
              left: c.left,
              background: `hsl(${c.hue}, 90%, 60%)`,
              animationDelay: `${c.delay}ms`,
            }}
          />
        ))}
      </div>

      <div className="champion-trophy" aria-hidden="true">
        <Trophy size={58} />
      </div>

      <div className="champion-body">
        <span className="champion-eyebrow">{t('champion.title')}</span>
        <div className="champion-team">
          <Flag code={champion.team.code} name={champion.team.name} className="champion-flag" />
          <span className="champion-team-name">{champion.team.name}</span>
        </div>
        <span className="champion-result">{resultLine}</span>
        <span className="champion-subtitle">{t('champion.subtitle')}</span>
      </div>

      <button
        type="button"
        className="champion-dismiss"
        onClick={dismiss}
        aria-label={t('champion.dismiss')}
        title={t('champion.dismiss')}
      >
        ×
      </button>
    </section>
  );
};
