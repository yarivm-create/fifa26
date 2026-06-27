import React from 'react';

// Original "world champion" mark: a gold globe with abstract land shapes
// resting on a cradle/cup and plinth. Intentionally an original design — it
// does NOT use the protected two-figures-holding-Earth form — used wherever
// the app shows "the cup".
export const Trophy: React.FC<{ size?: number; className?: string; title?: string }> = ({
  size = 20,
  className,
  title = 'Champion trophy',
}) => (
  <svg
    width={(size * 48) / 64}
    height={size}
    viewBox="0 0 48 64"
    role="img"
    aria-label={title}
    className={className}
    style={{ display: 'inline-block', verticalAlign: '-0.18em', flexShrink: 0 }}
  >
    <defs>
      <radialGradient id="wcTrophyGlobe" cx="0.38" cy="0.34" r="0.75">
        <stop offset="0" stopColor="#fdf3b8" />
        <stop offset="1" stopColor="#c5941c" />
      </radialGradient>
      <linearGradient id="wcTrophyGold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fbeaa0" />
        <stop offset="0.45" stopColor="#e7c14e" />
        <stop offset="1" stopColor="#a9760f" />
      </linearGradient>
    </defs>
    <circle cx="24" cy="15" r="13" fill="url(#wcTrophyGlobe)" stroke="#7a5310" strokeWidth="1.2" />
    <g fill="#a9760f" opacity="0.55">
      <path d="M14 11 C17 9 20 11 19 14 C18 17 14 17 13 14 Z" />
      <path d="M26 8 C30 8 33 11 31 14 C29 16 27 14 27 12 C25 12 24 10 26 8 Z" />
      <path d="M22 19 C26 18 30 20 29 23 C27 26 21 25 21 22 Z" />
    </g>
    <path d="M13 24 C13 31 18 35 24 35 C30 35 35 31 35 24 C32 28 28 30 24 30 C20 30 16 28 13 24 Z" fill="url(#wcTrophyGold)" stroke="#7a5310" strokeWidth="1" />
    <path d="M21 35 H27 L26 44 H22 Z" fill="url(#wcTrophyGold)" stroke="#7a5310" strokeWidth="1" />
    <ellipse cx="24" cy="45" rx="5" ry="2.3" fill="url(#wcTrophyGold)" stroke="#7a5310" strokeWidth="1" />
    <path d="M17 47 H31 L29 53 H19 Z" fill="url(#wcTrophyGold)" stroke="#7a5310" strokeWidth="1" />
    <rect x="13" y="53" width="22" height="7" rx="2.5" fill="url(#wcTrophyGold)" stroke="#7a5310" strokeWidth="1" />
  </svg>
);
