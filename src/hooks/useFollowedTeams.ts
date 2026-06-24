import { useSyncExternalStore, useCallback } from 'react';

// Shared, localStorage-backed store of favorite team codes. Mirrors
// useFollowedPlayers so the Standings stars and the Favorites tab stay in
// sync without prop drilling.

const STORAGE_KEY = 'wc2026:followed-teams';

function load(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set<string>(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set<string>();
  }
}

let favorites: Set<string> = load();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

export function toggleTeam(code: string): void {
  const next = new Set(favorites);
  if (next.has(code)) next.delete(code);
  else next.add(code);
  favorites = next; // new reference so useSyncExternalStore detects the change
  persist();
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Set<string> {
  return favorites;
}

export function useFollowedTeams() {
  const codes = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const isFavorite = useCallback((code: string) => codes.has(code), [codes]);
  return { codes, toggle: toggleTeam, isFavorite };
}
