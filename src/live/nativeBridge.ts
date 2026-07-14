// Native "Live Activity" bridge.
//
// A browser CANNOT create an Apple Live Activity / Dynamic Island update or an
// Android Live Update notification — those are native OS APIs. This module is
// the typed seam a future native wrapper (Capacitor, a WKWebView/Android
// WebView host, or a Trusted Web Activity companion) plugs into. In a plain
// browser every call is a safe no-op that returns `false`, so the web UI works
// unchanged; inside a wrapper the same calls forward a normalized payload to
// whichever native host is present.
//
// See docs/native-live-activities.md for the exact iOS (ActivityKit / WidgetKit
// / APNs) and Android (FCM promoted ongoing notification) implementation steps.

export interface LiveActivityState {
  matchId: number;
  homeName: string;
  homeCode: string;
  homeGoals: number;
  awayName: string;
  awayCode: string;
  awayGoals: number;
  // Short status/minute string already localized for display (e.g. "72'", "HT").
  status: string;
  // Optional headline for the most recent important event, if any.
  event?: string;
  // Epoch ms of the underlying data, so a native layer can drop stale updates.
  updatedAt: number;
}

// Minimal shapes for the possible native hosts. All optional — detected at call
// time so the bundle never assumes a wrapper exists.
interface CapacitorLiveActivityPlugin {
  start?: (state: LiveActivityState) => void;
  update?: (state: LiveActivityState) => void;
  end?: (id: { matchId: number }) => void;
}

interface NativeBridgeWindow {
  Capacitor?: { Plugins?: { LiveActivity?: CapacitorLiveActivityPlugin } };
  webkit?: { messageHandlers?: { liveActivity?: { postMessage: (msg: unknown) => void } } };
  AndroidLiveUpdate?: { start?: (json: string) => void; update?: (json: string) => void; end?: (json: string) => void };
}

type Phase = 'start' | 'update' | 'end';

function host(): NativeBridgeWindow | null {
  if (typeof window === 'undefined') return null;
  return window as unknown as NativeBridgeWindow;
}

// Returns true when a native wrapper capable of Live Activities is detected.
export function hasNativeLiveActivitySupport(): boolean {
  const w = host();
  if (!w) return false;
  return Boolean(
    w.Capacitor?.Plugins?.LiveActivity ||
      w.webkit?.messageHandlers?.liveActivity ||
      w.AndroidLiveUpdate
  );
}

function forward(phase: Phase, state: LiveActivityState): boolean {
  const w = host();
  if (!w) return false;
  try {
    const cap = w.Capacitor?.Plugins?.LiveActivity;
    if (cap) {
      if (phase === 'start') cap.start?.(state);
      else if (phase === 'update') cap.update?.(state);
      else cap.end?.({ matchId: state.matchId });
      return true;
    }
    if (w.webkit?.messageHandlers?.liveActivity) {
      w.webkit.messageHandlers.liveActivity.postMessage({ phase, state });
      return true;
    }
    if (w.AndroidLiveUpdate) {
      const json = JSON.stringify({ phase, state });
      if (phase === 'start') w.AndroidLiveUpdate.start?.(json);
      else if (phase === 'update') w.AndroidLiveUpdate.update?.(json);
      else w.AndroidLiveUpdate.end?.(json);
      return true;
    }
  } catch {
    /* a broken native host must never take down the web experience */
  }
  return false;
}

export const nativeLiveActivity = {
  supported: hasNativeLiveActivitySupport,
  start: (state: LiveActivityState) => forward('start', state),
  update: (state: LiveActivityState) => forward('update', state),
  end: (state: LiveActivityState) => forward('end', state),
};
