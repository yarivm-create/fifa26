import React, { useEffect, useState } from 'react';
import { playWhistle } from '../utils/sound';
import { useI18n } from '../i18n';
import { Flag } from '../utils/flags';
import type { MatchEndEvent } from '../hooks/useMatchAlerts';

// ---- Goal fireworks -------------------------------------------------------
// A brief, non-interactive burst overlay shown right after a goal is confirmed.
// Auto-removes after the animation so it never lingers or blocks the UI.

const BURSTS = [
  { left: '24%', top: '32%', hue: 45, delay: 0 },
  { left: '70%', top: '28%', hue: 0, delay: 180 },
  { left: '48%', top: '46%', hue: 150, delay: 340 },
];
const PARTICLES = 18;

export const Fireworks: React.FC = () => {
  const { t } = useI18n();
  const [show, setShow] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 3200);
    return () => clearTimeout(timer);
  }, []);
  if (!show) return null;

  return (
    <div className="fx-overlay" aria-hidden="true">
      <div className="fx-goal-banner">{t('fx.goal')}</div>
      {BURSTS.map((b, bi) => (
        <div
          key={bi}
          className="fx-burst"
          style={{ left: b.left, top: b.top, animationDelay: `${b.delay}ms` }}
        >
          {Array.from({ length: PARTICLES }).map((_, i) => {
            const angle = (360 / PARTICLES) * i;
            const dist = 70 + (i % 3) * 22;
            const rad = (angle * Math.PI) / 180;
            const tx = Math.cos(rad) * dist;
            const ty = Math.sin(rad) * dist;
            const hue = b.hue + (i % 5) * 12;
            return (
              <span
                key={i}
                className="fx-particle"
                style={
                  {
                    '--tx': `${tx}px`,
                    '--ty': `${ty}px`,
                    background: `hsl(${hue}, 90%, 60%)`,
                    animationDelay: `${b.delay}ms`,
                  } as React.CSSProperties
                }
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

// ---- Full-time whistle ----------------------------------------------------
// Shown ~1s after a match ends, with an optional synthesized whistle sound.
// Each ended game gets its own toast (they stack), naming the result and the
// winner so several games finishing together are all celebrated distinctly.

const WhistleIcon: React.FC = () => (
  <svg viewBox="0 0 64 40" width="56" height="36" aria-hidden="true">
    <path
      d="M40 6 H22 a16 16 0 1 0 0 32 h6 l4 -8 h8 a14 14 0 0 0 14 -14 V12 a6 6 0 0 0 -6 -6 z"
      fill="#f0f0f5"
      stroke="#D4AF37"
      strokeWidth="2"
    />
    <circle cx="20" cy="22" r="7" fill="#56042C" />
    <rect x="40" y="2" width="5" height="8" rx="2" fill="#D4AF37" />
  </svg>
);

interface WhistleToastProps {
  event: MatchEndEvent;
  onDone: (key: number) => void;
  withSound?: boolean;
}

export const WhistleToast: React.FC<WhistleToastProps> = ({ event, onDone, withSound = true }) => {
  const { t } = useI18n();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const appear = setTimeout(() => {
      setShow(true);
      if (withSound) playWhistle();
    }, 600);
    const hide = setTimeout(() => setShow(false), 6500);
    const remove = setTimeout(() => onDone(event.key), 6900);
    return () => {
      clearTimeout(appear);
      clearTimeout(hide);
      clearTimeout(remove);
    };
  }, [event.key, onDone, withSound]);

  const winnerName =
    event.winner === 'home' ? event.homeName : event.winner === 'away' ? event.awayName : '';
  const winnerCode =
    event.winner === 'home' ? event.homeCode : event.winner === 'away' ? event.awayCode : '';
  const resultText =
    event.winner === 'draw' ? t('fx.draw') : t('fx.won', { team: winnerName });

  return (
    <div className={`whistle-toast${show ? ' show' : ''}`} role="status">
      <WhistleIcon />
      <div className="whistle-toast-text">
        <strong>{t('fx.fullTime')}</strong>
        <span className="whistle-score">
          <Flag code={event.homeCode} name={event.homeName} className="whistle-flag" />
          {event.homeName} {event.homeGoals}
          <span className="whistle-dash"> – </span>
          {event.awayGoals} {event.awayName}
          <Flag code={event.awayCode} name={event.awayName} className="whistle-flag" />
        </span>
        <span className="whistle-result">
          {event.winner !== 'draw' && (
            <Flag code={winnerCode} name={winnerName} className="whistle-flag" />
          )}
          {resultText}
        </span>
      </div>
    </div>
  );
};

// Renders one toast per ended game, stacked. The first plays the whistle so
// simultaneous endings don't overlap into noise.
export const WhistleStack: React.FC<{ events: MatchEndEvent[]; onDone: (key: number) => void }> = ({
  events,
  onDone,
}) => {
  if (events.length === 0) return null;
  return (
    <div className="whistle-stack" aria-live="polite">
      {events.map((ev, i) => (
        <WhistleToast key={ev.key} event={ev} onDone={onDone} withSound={i === 0} />
      ))}
    </div>
  );
};
