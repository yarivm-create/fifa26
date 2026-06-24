import { useEffect, useRef, useState } from 'react';
import { Match } from '../api/types';

// Detects two live events from polled match data:
//  - a goal: a live match's total score increases between polls
//  - a match end: a match transitions from live -> completed
// Each returns an incrementing key the UI can use to (re)trigger an overlay.

export function useMatchAlerts(liveMatches: Match[] | null, allMatches: Match[] | null) {
  const prevScores = useRef<Map<number, number> | null>(null);
  const prevStatus = useRef<Map<number, string> | null>(null);
  const [goalKey, setGoalKey] = useState(0);
  const [whistleKey, setWhistleKey] = useState(0);

  useEffect(() => {
    if (!liveMatches) return;
    const cur = new Map<number, number>(
      liveMatches.map((m) => [m.id, (m.home_team.goals ?? 0) + (m.away_team.goals ?? 0)])
    );
    if (prevScores.current) {
      for (const [id, total] of cur) {
        const prev = prevScores.current.get(id);
        if (prev !== undefined && total > prev) {
          setGoalKey((k) => k + 1);
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
      for (const [id, status] of cur) {
        const prev = prevStatus.current.get(id);
        if (prev && (prev === 'in_progress' || prev === 'half_time') && status === 'completed') {
          setWhistleKey((k) => k + 1);
          break;
        }
      }
    }
    prevStatus.current = cur;
  }, [allMatches]);

  return { goalKey, whistleKey };
}
