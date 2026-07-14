import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { Match } from '../api/types';
import { TFunc } from '../i18n';
import { LiveEvent, LiveEventType } from './matchTimeline';
import { track } from './analytics';

// Client-side match notifications.
//
// IMPORTANT: this is NOT server Web Push. A static site has no backend to run a
// push service or hold VAPID keys, so notifications here fire from the running
// page (foreground, or a still-alive tab) via the Notification API / the
// service worker's showNotification. That covers "notify me while I'm on the
// site". True server-initiated push (closed tab) needs a backend + VAPID — the
// service worker already carries a documented `push` handler as the seam for
// that. See docs/live-match-bar.md. Permission is only ever requested after an
// explicit user action (never on load).

// ---- Per-category settings (which event kinds may notify) ------------------

export interface NotifySettings {
  goals: boolean;
  cards: boolean;
  kickoff: boolean;
  halfTime: boolean;
  fullTime: boolean;
  penaltyShootout: boolean;
}

export type NotifyCategory = keyof NotifySettings;

// Canonical render/order list of notification categories (used by the settings
// UI and by tests to assert every category maps back to an event).
export const NOTIFY_CATEGORIES: NotifyCategory[] = [
  'goals',
  'cards',
  'kickoff',
  'halfTime',
  'fullTime',
  'penaltyShootout',
];

const SETTINGS_KEY = 'wc2026:notify-settings';

// Sensible, low-noise defaults: the big moments on, routine period markers off.
const DEFAULT_SETTINGS: NotifySettings = {
  goals: true,
  cards: true,
  kickoff: false,
  halfTime: false,
  fullTime: true,
  penaltyShootout: true,
};

function loadSettings(): NotifySettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<NotifySettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

let settings: NotifySettings = loadSettings();
const settingsListeners = new Set<() => void>();

export function getNotifySettings(): NotifySettings {
  return settings;
}

export function setNotifyCategory(category: NotifyCategory, enabled: boolean): void {
  settings = { ...settings, [category]: enabled };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* ignore quota / privacy-mode */
  }
  for (const l of settingsListeners) l();
}

function subscribeSettings(listener: () => void): () => void {
  settingsListeners.add(listener);
  return () => settingsListeners.delete(listener);
}

export function useNotifySettings() {
  const value = useSyncExternalStore(subscribeSettings, getNotifySettings, getNotifySettings);
  const toggle = useCallback(
    (category: NotifyCategory) => setNotifyCategory(category, !getNotifySettings()[category]),
    []
  );
  return { settings: value, toggle };
}

// ---- Permission ------------------------------------------------------------

export type PermissionState = NotificationPermission | 'unsupported';

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getPermission(): PermissionState {
  return notificationsSupported() ? Notification.permission : 'unsupported';
}

// Must only be called from a user gesture handler.
export async function requestNotificationPermission(): Promise<PermissionState> {
  if (!notificationsSupported()) return 'unsupported';
  track('live_bar_notifications_requested');
  let result: NotificationPermission;
  try {
    result = await Notification.requestPermission();
  } catch {
    result = Notification.permission;
  }
  track(result === 'granted' ? 'live_bar_notifications_accepted' : 'live_bar_notifications_rejected');
  return result;
}

export function useNotificationPermission() {
  const [permission, setPermission] = useState<PermissionState>(() => getPermission());
  const request = useCallback(async () => {
    const r = await requestNotificationPermission();
    setPermission(r);
    return r;
  }, []);
  useEffect(() => {
    // The user may change the OS/browser permission elsewhere; re-read on return.
    const sync = () => setPermission(getPermission());
    window.addEventListener('focus', sync);
    return () => window.removeEventListener('focus', sync);
  }, []);
  return { permission, request };
}

// ---- Event → notification mapping ------------------------------------------

// Which settings category (if any) governs a given live event. Events that
// return null are shown in the in-app feed but never raise a notification.
export function categoryForEvent(type: LiveEventType): NotifyCategory | null {
  switch (type) {
    case 'goal':
    case 'penaltyScore':
      return 'goals';
    case 'redCard':
      return 'cards';
    case 'kickoff':
      return 'kickoff';
    case 'halfTime':
      return 'halfTime';
    case 'fullTime':
      return 'fullTime';
    case 'penaltyShootout':
      return 'penaltyShootout';
    default:
      return null;
  }
}

export interface NotificationContent {
  title: string;
  body: string;
}

// Builds the localized title/body for an event. Pure — safe to unit-test.
export function buildNotificationContent(event: LiveEvent, match: Match, t: TFunc): NotificationContent {
  const hg = match.home_team.goals ?? 0;
  const ag = match.away_team.goals ?? 0;
  const score = `${match.home_team.name} ${hg}–${ag} ${match.away_team.name}`;
  const team = event.teamName ?? '';
  switch (event.type) {
    case 'goal':
    case 'penaltyScore':
      return { title: t('notify.goal', { team }), body: score };
    case 'redCard':
      return { title: t('notify.redCard', { team }), body: score };
    case 'kickoff':
      return { title: t('notify.kickoff'), body: `${match.home_team.name} ${t('card.vs')} ${match.away_team.name}` };
    case 'halfTime':
      return { title: t('notify.halfTime'), body: score };
    case 'fullTime':
      return { title: t('notify.fullTime'), body: score };
    case 'penaltyShootout':
      return { title: t('notify.penaltyShootout'), body: score };
    default:
      return { title: t('app.title'), body: score };
  }
}

// Decides whether an event should notify given the user's settings + whether the
// match is followed + current permission. Pure — the single gate the UI relies
// on, and directly unit-testable.
export function shouldNotify(
  event: LiveEvent,
  isFollowed: boolean,
  current: NotifySettings,
  permission: PermissionState
): boolean {
  if (!isFollowed || permission !== 'granted') return false;
  const category = categoryForEvent(event.type);
  return category != null && current[category];
}

function assetUrl(path: string): string {
  const base = (import.meta.env?.BASE_URL as string | undefined) ?? '/';
  return `${base}${path}`;
}

// Shows a notification, preferring the service worker (so it survives the tab
// being backgrounded) and falling back to a page Notification.
export async function showLiveNotification(opts: {
  title: string;
  body: string;
  tag: string;
  matchId: number;
}): Promise<void> {
  if (getPermission() !== 'granted') return;
  const options: NotificationOptions = {
    body: opts.body,
    tag: opts.tag, // collapses repeated updates for the same match
    icon: assetUrl('icon-192.png'),
    badge: assetUrl('icon-192.png'),
    data: { matchId: opts.matchId, url: assetUrl('') },
  };
  try {
    const sw = typeof navigator !== 'undefined' ? navigator.serviceWorker : undefined;
    const reg = sw ? await sw.getRegistration() : undefined;
    if (reg && 'showNotification' in reg) {
      await reg.showNotification(opts.title, options);
      return;
    }
    new Notification(opts.title, options);
  } catch {
    /* notification failures must never break the live UI */
  }
}
