import { useSyncExternalStore, useCallback } from 'react';

// localStorage-backed stores for the Live Match Bar:
//   1. which matches the user "follows" (opt-in notifications), and
//   2. which live match is pinned in the main bar when several are live.
// Both mirror useFollowedTeams: a module-level value replaced by a NEW
// reference on every change so useSyncExternalStore re-renders subscribers,
// with all storage access guarded for private-mode / quota failures.

const FOLLOWED_KEY = 'wc2026:followed-matches';
const SELECTED_KEY = 'wc2026:selected-live-match';

// ---- Followed matches (a Set of numeric match ids) ------------------------

function loadFollowed(): Set<number> {
  try {
    const raw = localStorage.getItem(FOLLOWED_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set<number>(Array.isArray(arr) ? arr.filter((n): n is number => typeof n === 'number') : []);
  } catch {
    return new Set<number>();
  }
}

let followed: Set<number> = loadFollowed();
const followedListeners = new Set<() => void>();

function emitFollowed() {
  for (const l of followedListeners) l();
}

function persistFollowed() {
  try {
    localStorage.setItem(FOLLOWED_KEY, JSON.stringify([...followed]));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

export function toggleFollowedMatch(id: number): boolean {
  const next = new Set(followed);
  const nowFollowed = !next.has(id);
  if (nowFollowed) next.add(id);
  else next.delete(id);
  followed = next; // new reference so useSyncExternalStore detects the change
  persistFollowed();
  emitFollowed();
  return nowFollowed;
}

function subscribeFollowed(listener: () => void): () => void {
  followedListeners.add(listener);
  return () => followedListeners.delete(listener);
}

function getFollowedSnapshot(): Set<number> {
  return followed;
}

export function useFollowedMatches() {
  const ids = useSyncExternalStore(subscribeFollowed, getFollowedSnapshot, getFollowedSnapshot);
  const isFollowed = useCallback((id: number) => ids.has(id), [ids]);
  return { ids, toggle: toggleFollowedMatch, isFollowed };
}

// ---- Selected live match (the one pinned in the main bar) ------------------

function loadSelected(): number | null {
  try {
    const raw = localStorage.getItem(SELECTED_KEY);
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

let selected: number | null = loadSelected();
const selectedListeners = new Set<() => void>();

export function setSelectedLiveMatch(id: number | null): void {
  if (selected === id) return;
  selected = id;
  try {
    if (id == null) localStorage.removeItem(SELECTED_KEY);
    else localStorage.setItem(SELECTED_KEY, String(id));
  } catch {
    /* ignore */
  }
  for (const l of selectedListeners) l();
}

function subscribeSelected(listener: () => void): () => void {
  selectedListeners.add(listener);
  return () => selectedListeners.delete(listener);
}

function getSelectedSnapshot(): number | null {
  return selected;
}

export function useSelectedLiveMatch() {
  const id = useSyncExternalStore(subscribeSelected, getSelectedSnapshot, getSelectedSnapshot);
  return { selectedId: id, setSelected: setSelectedLiveMatch };
}
