import { useSyncExternalStore, useCallback } from 'react';

// Shared, localStorage-backed store of followed player ids. A tiny external
// store (rather than component state) keeps the Stats leaderboards and the
// Following tab in sync without prop drilling.

const STORAGE_KEY = 'wc2026:followed-players';

function load(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set<string>(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set<string>();
  }
}

let followed: Set<string> = load();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...followed]));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

export function toggleFollow(id: string): void {
  const next = new Set(followed);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  followed = next; // new reference so useSyncExternalStore detects the change
  persist();
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Set<string> {
  return followed;
}

export function useFollowedPlayers() {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const isFollowed = useCallback((id: string) => ids.has(id), [ids]);
  return { ids, toggle: toggleFollow, isFollowed };
}
