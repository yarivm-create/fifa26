import React, { useState } from 'react';

// One-tap sharing. On mobile (and any browser with the Web Share API) this
// opens the native share sheet — WhatsApp, Telegram, X, Messenger, email, etc.
// On desktop it falls back to copying the link with a brief confirmation.
// Turning visitors into sharers is the cheapest, most credible traffic source.
const SHARE_URL = 'https://yarivm-create.github.io/fifa26/';
const SHARE_TITLE = 'FIFA World Cup 2026 — Live Dashboard';
const SHARE_TEXT =
  'Live World Cup 2026 scores, standings, bracket & stats — in your local time. Check it out:';

export const ShareButton: React.FC = () => {
  const [copied, setCopied] = useState(false);

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
