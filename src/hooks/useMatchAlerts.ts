import { useEffect, useRef, useState } from 'react';
import { Match } from '../api/types';

// Detects two live events from polled match data:
//  - a goal: a live match's total score increases between polls
//  - a match end: a match transitions from live -> completed
// A goal returns an incrementing key the UI uses to (re)trigger an overlay.
// Match ends return a batch of rich events (one per game) so the UI can show a
// distinct full-time celebration for EVERY game that just ended in the same
// poll — not only the first — including who won and the final score.

export interface GoalEvent {
  key: number; // incrementing, used to (re)trigger the overlay
  matchId: number;
  scorerName: string; // team that just scored
  scorerCode: string;
  homeName: string;
  homeCode: string;
  homeGoals: number;
  awayName: string;
  awayCode: string;
  awayGoals: number;
}

export interface MatchEndEvent {
  key: number; // globally unique, stable per detected end
  matchId: number;
  stage: string;
  homeName: string;
  homeCode: string;
  homeGoals: number;
  awayName: string;
  awayCode: string;
  awayGoals: number;
  winner: 'home' | 'away' | 'draw';
}

function buildEndEvent(m: Match, key: number): MatchEndEvent {
  const homeGoals = m.home_team.goals ?? 0;
  const awayGoals = m.away_team.goals ?? 0;
  const winner = homeGoals > awayGoals ? 'home' : awayGoals > homeGoals ? 'away' : 'draw';
  return {
    key,
    matchId: m.id,
    stage: m.stage_name,
    homeName: m.home_team.name,
    homeCode: m.home_team.code,
    homeGoals,
    awayName: m.away_team.name,
    awayCode: m.away_team.code,
    awayGoals,
    winner,
  };
}

export function useMatchAlerts(liveMatches: Match[] | null, allMatches: Match[] | null) {
  // Track each live match's per-team goals so we can tell WHICH side scored,
  // not just that the total changed.
  const prevScores = useRef<Map<number, { home: number; away: number }> | null>(null);
  const prevStatus = useRef<Map<number, string> | null>(null);
  const goalCounter = useRef(0);
  const endCounter = useRef(0);
  const [goalEvent, setGoalEvent] = useState<GoalEvent | null>(null);
  const [endEvents, setEndEvents] = useState<MatchEndEvent[]>([]);

  useEffect(() => {
    if (!liveMatches) return;
    const cur = new Map<number, { home: number; away: number }>(
      liveMatches.map((m) => [
        m.id,
        { home: m.home_team.goals ?? 0, away: m.away_team.goals ?? 0 },
      ])
    );
    if (prevScores.current) {
      for (const m of liveMatches) {
        const prev = prevScores.current.get(m.id);
        if (!prev) continue;
        const homeGoals = m.home_team.goals ?? 0;
        const awayGoals = m.away_team.goals ?? 0;
        const homeScored = homeGoals > prev.home;
        const awayScored = awayGoals > prev.away;
        if (homeScored || awayScored) {
          // If both somehow changed in one poll, credit the bigger jump.
          const scorerIsHome =
            homeScored && (!awayScored || homeGoals - prev.home >= awayGoals - prev.away);
          setGoalEvent({
            key: ++goalCounter.current,
            matchId: m.id,
            scorerName: scorerIsHome ? m.home_team.name : m.away_team.name,
            scorerCode: scorerIsHome ? m.home_team.code : m.away_team.code,
            homeName: m.home_team.name,
            homeCode: m.home_team.code,
            homeGoals,
            awayName: m.away_team.name,
            awayCode: m.away_team.code,
            awayGoals,
          });
          break;
        }
      }
    }
    prevScores.current = cur;
  }, [liveMatches]);

  useEffect(() => {
    if (!allMatches) return;
    const cur = new Map<number, string>(allMatches.map((m) => [m.id, m.status]));
    if (prevStatus.current) {
      // Collect EVERY match that just finished this poll, not only the first.
      const newlyEnded: MatchEndEvent[] = [];
      for (const m of allMatches) {
        const prev = prevStatus.current.get(m.id);
        if (prev && (prev === 'in_progress' || prev === 'half_time') && m.status === 'completed') {
          newlyEnded.push(buildEndEvent(m, ++endCounter.current));
        }
      }
      if (newlyEnded.length > 0) setEndEvents(newlyEnded);
    }
    prevStatus.current = cur;
  }, [allMatches]);

  return { goalEvent, endEvents };
}
