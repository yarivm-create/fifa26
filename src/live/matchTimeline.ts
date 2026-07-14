import { Match } from '../api/types';

// Derives a live "event feed" for a match purely from what the polled Match
// object already tells us between two snapshots — no extra network calls.
//
// What is reliably derivable from a Match today: score changes (which side
// scored), penalty-shootout tally changes, and status/period transitions
// (kickoff, half-time, second half, extra time, shootout, full-time).
//
// What is NOT available from the app's Match model yet: goal-scorer NAMES and
// yellow/red cards, substitutions and VAR decisions. Those live only in the
// FIFA per-match timeline, which is keyed by the FIFA IdMatch (not the app's
// numeric Match.id). This module is the single extension point: once that
// timeline is plumbed through, map its rows to `LiveEvent`s and merge them into
// the same feed. The UI and notifications already consume `LiveEvent`, so no
// downstream change is needed. See docs/live-match-bar.md.

export type LiveEventType =
  | 'kickoff'
  | 'goal'
  | 'penaltyScore'
  | 'penaltyMiss'
  | 'yellowCard'
  | 'redCard'
  | 'substitution'
  | 'var'
  | 'halfTime'
  | 'secondHalf'
  | 'extraTime'
  | 'penaltyShootout'
  | 'fullTime';

export interface LiveEvent {
  // Deterministic id derived from the change it represents, so re-observing the
  // same snapshot never produces a duplicate feed entry.
  id: string;
  matchId: number;
  type: LiveEventType;
  teamCode?: string;
  teamName?: string;
  // The match minute / phase label at the time (e.g. "72'", "HT", "ET 95'").
  minute?: string;
  // Optional extra detail (e.g. a scorer name once the FIFA timeline is wired).
  detail?: string;
}

function goals(t: Match['home_team']): number {
  return t.goals ?? 0;
}

// Compares two snapshots of the SAME match and returns any events implied by the
// change. `prev` undefined means this is the first observation (baseline only).
export function diffMatchEvents(prev: Match | undefined, next: Match): LiveEvent[] {
  const events: LiveEvent[] = [];
  const minute = next.time || '';
  const mk = (type: LiveEventType, extra?: Partial<LiveEvent>): LiveEvent => ({
    id: `${next.id}:${type}:${extra?.teamCode ?? ''}:${goals(next.home_team)}-${goals(next.away_team)}:${next.status}:${minute}`,
    matchId: next.id,
    type,
    minute,
    ...extra,
  });

  if (!prev) return events;

  // Score changes → a goal for whichever side increased.
  if (goals(next.home_team) > goals(prev.home_team)) {
    events.push(mk('goal', { teamCode: next.home_team.code, teamName: next.home_team.name }));
  }
  if (goals(next.away_team) > goals(prev.away_team)) {
    events.push(mk('goal', { teamCode: next.away_team.code, teamName: next.away_team.name }));
  }

  // Penalty-shootout tally changes (only meaningful during PEN).
  const prevPenTotal = (prev.home_team.penalties ?? 0) + (prev.away_team.penalties ?? 0);
  const nextPenTotal = (next.home_team.penalties ?? 0) + (next.away_team.penalties ?? 0);
  if (next.time === 'PEN' && nextPenTotal > prevPenTotal) {
    const homeUp = (next.home_team.penalties ?? 0) > (prev.home_team.penalties ?? 0);
    const team = homeUp ? next.home_team : next.away_team;
    events.push(mk('penaltyScore', { teamCode: team.code, teamName: team.name }));
  }

  // Status / period transitions.
  const wasLive = prev.status === 'in_progress' || prev.status === 'half_time';
  if (prev.status === 'future_scheduled' && next.status === 'in_progress') {
    events.push(mk('kickoff'));
  } else if (prev.status === 'in_progress' && next.status === 'half_time') {
    events.push(mk(next.time === 'ET HT' ? 'extraTime' : 'halfTime'));
  } else if (prev.status === 'half_time' && next.status === 'in_progress') {
    events.push(mk(next.time && next.time.startsWith('ET') ? 'extraTime' : 'secondHalf'));
  } else if (wasLive && next.status === 'completed') {
    events.push(mk('fullTime'));
  }

  // Entering the shootout (independent of the HT→live edge above).
  if (prev.time !== 'PEN' && next.time === 'PEN') {
    events.push(mk('penaltyShootout'));
  }

  return events;
}

// Appends new events to a bounded feed, de-duplicating by id (guards against
// duplicated / out-of-order poll deliveries) and keeping only the latest `cap`.
export function appendEvents(feed: LiveEvent[], incoming: LiveEvent[], cap = 20): LiveEvent[] {
  if (incoming.length === 0) return feed;
  const seen = new Set(feed.map((e) => e.id));
  const added = incoming.filter((e) => !seen.has(e.id));
  if (added.length === 0) return feed;
  return [...feed, ...added].slice(-cap);
}
