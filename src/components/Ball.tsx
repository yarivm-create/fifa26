import React from 'react';

// Original modern soccer ball: the universally recognized pentagon-panel ball
// silhouette (a generic, public pattern), recolored in the 2026 host-nation
// palette — navy with red, green and blue panels for USA / Mexico / Canada.
// Not a reproduction of any official, protected match-ball design.
export const Ball: React.FC<{ size?: number; className?: string; title?: string }> = ({
  size = 24,
  className,
  title = 'Soccer ball',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    role="img"
    aria-label={title}
    className={className}
    style={{ display: 'inline-block', verticalAlign: '-0.18em', flexShrink: 0 }}
  >
    <defs>
      <radialGradient id="wcBallBody" cx="0.36" cy="0.30" r="0.9">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.72" stopColor="#eef1f6" />
        <stop offset="1" stopColor="#c4ccd8" />
      </radialGradient>
      <clipPath id="wcBallClip">
        <circle cx="32" cy="32" r="28" />
      </clipPath>
    </defs>
    <circle cx="32" cy="32" r="28" fill="url(#wcBallBody)" stroke="#16203a" strokeWidth="2.5" />
    <g clipPath="url(#wcBallClip)">
      <path d="M37.78 21.92 L33.64 12.70 L41.14 5.91 L49.91 10.94 L47.83 20.84 Z" fill="#16203a" />
      <path d="M42.00 32.98 L48.71 25.42 L57.98 29.47 L56.99 39.53 L47.12 41.70 Z" fill="#e4002b" />
      <path d="M32.00 40.86 L40.18 46.80 L37.05 56.42 L26.95 56.42 L23.82 46.80 Z" fill="#0a7d3f" />
      <path d="M22.00 32.98 L16.88 41.70 L7.01 39.53 L6.02 29.47 L15.29 25.42 Z" fill="#1565d8" />
      <path d="M26.22 21.92 L16.17 20.84 L14.09 10.94 L22.86 5.91 L30.36 12.70 Z" fill="#16203a" />
      <path d="M32.00 21.90 L40.18 27.84 L37.05 37.46 L26.95 37.46 L23.82 27.84 Z" fill="#16203a" />
      <g fill="none" stroke="#16203a" strokeWidth="2" strokeLinecap="round">
      <path d="M32.00 21.90 L32.00 5.00" />
      <path d="M40.18 27.84 L56.07 19.77" />
      <path d="M37.05 37.46 L50.35 51.81" />
      <path d="M26.95 37.46 L13.65 51.81" />
      <path d="M23.82 27.84 L7.93 19.77" />
        <path d="M32.00 21.90 L40.18 27.84 L37.05 37.46 L26.95 37.46 L23.82 27.84 Z" />
      </g>
    </g>
    <ellipse cx="22" cy="20" rx="9" ry="5.5" fill="#ffffff" opacity="0.5" transform="rotate(-30 22 20)" />
  </svg>
);
