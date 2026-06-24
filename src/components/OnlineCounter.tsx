import React, { useEffect, useState } from 'react';

// Live "people watching now" counter.
//
// GitHub Pages is a static host, so it can't count concurrent visitors on its
// own. We use whos.amung.us (free, no account, domain/pile-scoped, presence is
// computed server-side) purely as a data source: its script keeps the live
// count in localStorage under "_waucount:<pile>". We read that value and render
// our own themed chip, hiding the third-party widget itself. If the service is
// blocked or unavailable, the chip simply doesn't show (no fake numbers).

const PILE = 'fifa26yarivm'; // clean alphanumeric, <=12 chars so the service keeps it intact
const SCRIPT_ID = 'wau-presence';
const STORAGE_KEY = `_waucount:${PILE}`;

declare global {
  interface Window {
    _wau?: unknown[][];
  }
}

function readCount(): number | null {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null) {
      // whos.amung.us normalizes the pile id (strips non-alphanumerics and
      // truncates to 12 chars), so the stored key can differ from PILE. We only
      // register one widget, so fall back to any "_waucount:" entry.
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('_waucount:')) {
          raw = localStorage.getItem(k);
          break;
        }
      }
    }
    if (raw == null) return null;
    const n = Math.round(Number(raw));
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

export const OnlineCounter: React.FC = () => {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    // Register the presence widget once, then load the tracker script once.
    window._wau = window._wau || [];
    if (!window._wau.some((w) => w[1] === PILE)) {
      window._wau.push(['small', PILE]);
    }
    if (!document.getElementById(SCRIPT_ID)) {
      const s = document.createElement('script');
      s.id = SCRIPT_ID;
      s.async = true;
      s.src = 'https://waust.at/s.js';
      document.body.appendChild(s);
    }

    setCount(readCount());
    const id = window.setInterval(() => setCount(readCount()), 4000);

    // Mobile and background tabs throttle timers, so the cached count can lag
    // behind the live server value. Re-read the moment the tab is focused again
    // so each device converges to the true number as soon as it's looked at.
    const refresh = () => setCount(readCount());
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  if (count == null) return null;

  return (
    <div className="online-counter" title={`${count} ${count === 1 ? 'person is' : 'people are'} viewing right now`}>
      <span className="online-counter-dot" aria-hidden="true" />
      <span className="online-counter-num">{count.toLocaleString()}</span>
      <span className="online-counter-label">watching now</span>
    </div>
  );
};
