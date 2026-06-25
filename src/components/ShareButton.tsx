import React, { useState } from 'react';

// One-tap sharing. On mobile (and any browser with the Web Share API) this
// opens the native share sheet — WhatsApp, Telegram, X, Messenger, email, etc.
// On desktop it falls back to copying the link with a brief confirmation.
// Turning visitors into sharers is the cheapest, most credible traffic source.
const SHARE_URL = 'https://yarivm-create.github.io/fifa26/';
const SHARE_TITLE = 'FIFA World Cup 2026 — Live Dashboard';
const SHARE_TEXT =
  'Live World Cup 2026 scores, standings, bracket & stats — in your local time. Check it out:';

// True only on phones/tablets: a coarse (touch) primary pointer combined with
// a mobile user-agent. This deliberately excludes desktop browsers, which now
// expose navigator.share too, so the Share button appears on mobile only.
function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    return false;
  }
  const ua = navigator.userAgent || '';
  const mobileUA = /Android|iPhone|iPad|iPod|Mobile|Windows Phone|webOS|BlackBerry/i.test(ua);
  const coarsePointer =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches;
  return mobileUA && coarsePointer;
}

export const ShareButton: React.FC = () => {
  const [copied, setCopied] = useState(false);

  // Mobile-only. Desktop Chrome/Edge also expose navigator.share, so that
  // alone isn't enough — we additionally require a touch device: a coarse
  // primary pointer plus a phone/tablet user-agent. Desktop never shows it.
  if (!isMobileDevice()) return null;

  const onShare = async () => {
    const nav = navigator as Navigator & {
      share?: (data: ShareData) => Promise<void>;
    };
    if (typeof nav.share === 'function') {
      try {
        await nav.share({ title: SHARE_TITLE, text: SHARE_TEXT, url: SHARE_URL });
        return;
      } catch {
        // User dismissed the sheet or share failed — fall through to copy.
      }
    }
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (e.g. insecure context) — last resort prompt.
      window.prompt('Copy this link to share:', SHARE_URL);
    }
  };

  return (
    <button
      type="button"
      className="share-btn"
      onClick={onShare}
      aria-label="Share this World Cup dashboard"
    >
      <span aria-hidden="true">{copied ? '✓' : '🔗'}</span>
      {copied ? 'Link copied!' : 'Share'}
    </button>
  );
};
