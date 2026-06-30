import { useEffect, useRef, useState } from 'react';
import { Match } from '../api/types';
import { getMatchResult } from '../utils/matchResult';

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
  // Knockout shootout / extra-time context so the full-time toast names the real
  // winner (a penalty win is level on goals) and shows the shootout score.
  homePen: number | null;
  awayPen: number | null;
  decidedBy?: Match['decidedBy'];
}

export function buildEndEvent(m: Match, key: number): MatchEndEvent {
  const homeGoals = m.home_team.goals ?? 0;
  const awayGoals = m.away_team.goals ?? 0;
  // Use the shared penalty-aware result so a 1-1 (won on penalties) knockout
  // names the shootout winner instead of being reported as a draw.
  const r = getMatchResult(m);
  const winner = r.homeWon ? 'home' : r.awayWon ? 'away' : 'draw';
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
    homePen: m.home_team.penalties ?? null,
    awayPen: m.away_team.penalties ?? null,
    decidedBy: m.decidedBy,
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

  // When the tab returns from the background, useLiveData immediately refetches.
  // Any goal/end that happened WHILE we were hidden would otherwise surface as a
  // brand-new live event (a false "GOAL!" overlay on resume). So we suppress the
  // first post-resume diff per stream and only re-baseline the refs — real
  // events that happen after we're visible again still alert normally.
  const suppressGoals = useRef(false);
  const suppressEnds = useRef(false);
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        suppressGoals.current = true;
        suppressEnds.current = true;
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pageshow', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pageshow', onVisible);
    };
  }, []);

  useEffect(() => {
    if (!liveMatches) return;
    const cur = new Map<number, { home: number; away: number }>(
      liveMatches.map((m) => [
        m.id,
        { home: m.home_team.goals ?? 0, away: m.away_team.goals ?? 0 },
      ])
    );
    if (suppressGoals.current) {
      // First update after resume: re-baseline without emitting a stale goal.
      suppressGoals.current = false;
      prevScores.current = cur;
      return;
    }
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
    if (suppressEnds.current) {
      // First update after resume: re-baseline without firing a stale full-time.
      suppressEnds.current = false;
      prevStatus.current = cur;
      return;
    }
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
