import React from 'react';

// Original stylized gold World Cup trophy (a globe held aloft over a tapered
// body and plinth). Intentionally a simplified, original mark — not a copy of
// FIFA's protected sculpture — used wherever the app shows "the cup".
export const Trophy: React.FC<{ size?: number; className?: string; title?: string }> = ({
  size = 20,
  className,
  title = 'World Cup trophy',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    role="img"
    aria-label={title}
    className={className}
    style={{ display: 'inline-block', verticalAlign: '-0.15em', flexShrink: 0 }}
  >
    <defs>
      <linearGradient id="wcTrophyGold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f7e08a" />
        <stop offset="0.45" stopColor="#e2bd4e" />
        <stop offset="1" stopColor="#b07d18" />
      </linearGradient>
      <linearGradient id="wcTrophyGlobe" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fbeea6" />
        <stop offset="1" stopColor="#c9971f" />
      </linearGradient>
    </defs>
    <circle cx="32" cy="15" r="9" fill="url(#wcTrophyGlobe)" stroke="#8a5e10" strokeWidth="1" />
    <path
      d="M23.4 13.2h17.2M24.6 18.6h14.8M32 6v18"
      fill="none"
      stroke="#8a5e10"
      strokeWidth="1"
      opacity="0.55"
    />
    <path
      d="M24 22 C24 33 28 40 32 44 C36 40 40 33 40 22 C37 25 35 27 32 27 C29 27 27 25 24 22 Z"
      fill="url(#wcTrophyGold)"
      stroke="#8a5e10"
      strokeWidth="1"
    />
    <rect x="29.5" y="43" width="5" height="6" rx="1" fill="url(#wcTrophyGold)" stroke="#8a5e10" strokeWidth="0.8" />
    <path d="M22 49h20l-2 5H24z" fill="url(#wcTrophyGold)" stroke="#8a5e10" strokeWidth="1" />
    <rect x="20" y="54" width="24" height="5" rx="1.5" fill="url(#wcTrophyGold)" stroke="#8a5e10" strokeWidth="1" />
  </svg>
);
