// Tiny, dependency-free analytics shim for the Live Match Bar.
//
// The site has no analytics vendor wired in, so rather than pull in a library
// this exposes ONE seam: `track(event, props?)`. It never collects personal
// data — only the interaction name plus small, non-identifying context (e.g. a
// match id, or how many matches were live). Two sinks are used if present:
//   1. window.dataLayer.push(...)  — the GTM / GA convention, if a tag manager
//      is ever added it picks these up with zero further wiring.
//   2. a CustomEvent('wc-analytics') on window — lets tests and any in-page
//      listener observe events without a network call.
// When neither consumer exists the call is an effectively free no-op.

export type LiveBarAnalyticsEvent =
  | 'live_bar_displayed'
  | 'live_bar_expanded'
  | 'live_bar_collapsed'
  | 'live_bar_match_switched'
  | 'live_bar_match_followed'
  | 'live_bar_match_unfollowed'
  | 'live_bar_notifications_requested'
  | 'live_bar_notifications_accepted'
  | 'live_bar_notifications_rejected'
  | 'live_bar_notification_opened'
  | 'live_bar_full_match_opened';

// Only primitive, non-identifying values are ever accepted as context.
export type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

interface DataLayerWindow {
  dataLayer?: Array<Record<string, unknown>>;
}

export function track(event: LiveBarAnalyticsEvent, props?: AnalyticsProps): void {
  const payload = { event, ...props };
  try {
    const w = window as unknown as DataLayerWindow;
    if (Array.isArray(w.dataLayer)) w.dataLayer.push(payload);
    window.dispatchEvent(new CustomEvent('wc-analytics', { detail: payload }));
  } catch {
    /* analytics must never break the UI — swallow anything (SSR, no window). */
  }
}
