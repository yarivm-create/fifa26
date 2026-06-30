import { Match } from '../api/types';

// Orders the cards within a single bracket round the way a fan reads them:
//  1. finished ties first (you want to see results), then live, then upcoming;
//  2. within each group, by kick-off date (earliest first).
// So an already-played tie (e.g. Canada's) sits at the TOP, and the remaining
// cards follow in the order they kick off. This is why Canada — the earliest
// completed Round-of-32 tie — comes first, with later/upcoming ties below.
function phase(m: Match): number {
  if (m.status === 'completed') return 0;
  if (m.status === 'in_progress' || m.status === 'half_time') return 1;
  return 2;
}

export function sortBracketRound(matches: Match[]): Match[] {
  return [...matches].sort(
    (a, b) =>
      phase(a) - phase(b) ||
      new Date(a.datetime).getTime() - new Date(b.datetime).getTime() ||
      a.id - b.id
  );
}
