import React, { useEffect, useState } from 'react';
import { useI18n } from '../i18n';

// Live "people watching now" counter.
//
// GitHub Pages is static, so it can't count concurrent visitors itself. We use
// whos.amung.us purely as a data source — but NOT its heavy s.js widget, which
// uses eval() and injects a third-party tracker (t.dtscout.com); both are
// blocked by our CSP and were spamming the console while the count never
// worked. Instead we hit its lightweight JSONP "pingjs" heartbeat directly:
// each call registers our presence and responds with a single function call,
//   WAU_r_s('<count>', '<pile>', -1);
// which invokes the global callback we define below. No eval, no tracker, no
// CSP violation. If the service is blocked or unavailable, the chip simply
// doesn't show (no fake numbers).

const PILE = 'fifa26yarivm';
const PING_URL = `https://whos.amung.us/pingjs/?k=${PILE}&c=s`;
const HEARTBEAT_MS = 18000;

declare global {
  interface Window {
    WAU_r_s?: (count: string, pile: string, x: number) => void;
  }
}

export const OnlineCounter: React.FC = () => {
  const { t } = useI18n();
  const [count, setCount] = useState<number | null>(null);
  // 'loading' reserves the chip's space with a skeleton so it doesn't pop in
  // and reflow the header. We collapse to 'unavailable' only if no count ever
  // arrives (service blocked/unavailable).
  const [phase, setPhase] = useState<'loading' | 'ready' | 'unavailable'>('loading');

  useEffect(() => {
    let cancelled = false;

    // The pingjs response body is `WAU_r_s('<n>', '<pile>', -1);` — a direct call
    // to this global, so loading the script just hands us the live count.
    window.WAU_r_s = (raw: string) => {
      if (cancelled) return;
      const n = Math.round(Number(raw));
      if (Number.isFinite(n) && n > 0) setCount(n);
    };

    // One heartbeat = one short-lived JSONP <script>. Loading it both registers
    // our presence with the service and reports the current concurrent count.
    const ping = () => {
      const s = document.createElement('script');
      s.async = true;
      s.src = `${PING_URL}&r=${Date.now()}`;
      s.onload = s.onerror = () => s.remove();
      document.body.appendChild(s);
    };

    // Defer the first ping to idle time so it stays off the critical path; the
    // live count is non-essential to first paint.
    const ric = (
      window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }
    ).requestIdleCallback;
    if (typeof ric === 'function') ric(ping, { timeout: 3000 });
    else window.setTimeout(ping, 1200);

    const id = window.setInterval(ping, HEARTBEAT_MS);

    // If no count has arrived after a grace period, collapse the skeleton so we
    // don't show a permanent shell.
    const grace = window.setTimeout(() => {
      setPhase((p) => (p === 'loading' ? 'unavailable' : p));
    }, 8000);

    // Re-ping the moment the tab is focused again so throttled/background tabs
    // converge on the true number as soon as they're looked at.
    const refresh = () => ping();
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.clearTimeout(grace);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
      // Swap to a no-op (not delete) so any in-flight ping that resolves after
      // unmount can't throw a ReferenceError.
      window.WAU_r_s = () => {};
    };
  }, []);

  // Promote to 'ready' as soon as we have a real count.
  useEffect(() => {
    if (count != null) setPhase('ready');
  }, [count]);

  if (phase === 'unavailable') return null;

  if (phase === 'loading') {
    // Reserved-space skeleton: same shape as the real chip so the header
    // doesn't shift when the live number arrives.
    return (
      <div
        className="online-counter online-counter--loading"
        role="status"
        aria-live="polite"
        aria-label="Loading live viewer count"
      >
        <span className="online-counter-dot" aria-hidden="true" />
        <span className="online-counter-skeleton" aria-hidden="true" />
        <span className="online-counter-label">{t('app.watchingNow')}</span>
      </div>
    );
  }

  return (
    <div className="online-counter" role="status" aria-live="polite" title={`${count!.toLocaleString()} ${t('app.watchingNow')}`}>
      <span className="online-counter-dot" aria-hidden="true" />
      <span className="online-counter-num">{count!.toLocaleString()}</span>
      <span className="online-counter-label">{t('app.watchingNow')}</span>
    </div>
  );
};
