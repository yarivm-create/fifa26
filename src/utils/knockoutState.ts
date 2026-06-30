import { Match } from '../api/types';
import { getMatchResult } from './matchResult';

// The knockout rounds in order; the index is how far a team has progressed.
export const KO_ORDER = ['Round of 32', 'Round of 16', 'Quarter-final', 'Semi-final', 'Final'];

export interface KnockoutState {
  reached: number; // index into KO_ORDER
  eliminated: boolean;
  champion: boolean;
}

// Live knockout progress for a team, computed from the schedule so the Favorites
// card shows the CURRENT state (Round of 16 / Eliminated / 🏆). A knockout
// decided on penalties is level on goals but still has a winner, so this uses
// the shared penalty-aware result (NOT a raw goals comparison) to tell whether a
// team went through or was eliminated.
export function knockoutState(code: string, matches: Match[]): KnockoutState | null {
  let reached = -1;
  let eliminated = false;
  let champion = false;
  for (const m of matches) {
    const idx = KO_ORDER.indexOf(m.stage_name);
    if (idx < 0) continue;
    const isHome = m.home_team.code === code;
    const isAway = m.away_team.code === code;
    if (!isHome && !isAway) continue;
    reached = Math.max(reached, idx);
    const r = getMatchResult(m);
    if (!r.finished) continue;
    const won = isHome ? r.homeWon : r.awayWon;
    const lost = isHome ? r.awayWon : r.homeWon;
    if (lost) eliminated = true;
    else if (won && m.stage_name === 'Final') champion = true;
  }
  return reached < 0 ? null : { reached, eliminated, champion };
}
