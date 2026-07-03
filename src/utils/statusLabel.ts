import { TFunc } from '../i18n';

export interface StatusLabel {
  label: string;
  isLive: boolean;
}

// A live penalty-shootout tally, already orientation-corrected onto the Match by
// applyOverlay (home_team.penalties / away_team.penalties).
export interface PenScore {
  h: number | null | undefined;
  a: number | null | undefined;
}

// Turns a match's status plus the FIFA minute/phase sentinel that mapStatus
// produces into the label shown on the card. The `time` sentinels are:
//   "72'"     regulation minute, shown verbatim (covers 1st & 2nd half)
//   "HT"      regulation half-time break
//   "ET 95'"  extra time in play (1st or 2nd ET half), with the running minute
//   "ET"      extra time in play, minute not yet known
//   "ET HT"   extra-time half-time break (between the two ET periods)
//   "PRE_PEN" extra time has ended level; a penalty shootout is imminent
//   "PEN"     penalty shootout in progress
// Full time (status 'completed') and upcoming fixtures use their own labels.
export function getStatusLabel(
  status: string,
  t: TFunc,
  time?: string,
  pens?: PenScore
): StatusLabel {
  switch (status) {
    case 'in_progress':
      if (time === 'PEN') {
        // During the shootout, surface the running score (e.g. "PENS 4-3") so
        // the phase AND the tally are visible; fall back to a plain label until
        // FIFA reports the first kick.
        if (pens && pens.h != null && pens.a != null) {
          return { label: t('status.pensLive', { h: pens.h, a: pens.a }), isLive: true };
        }
        return { label: t('status.penalties'), isLive: true };
      }
      if (time && time.startsWith('ET')) {
        const min = time.slice(2).trim();
        return { label: min ? t('status.etLive', { min }) : t('status.extraTime'), isLive: true };
      }
      return { label: time || t('status.live'), isLive: true };
    case 'half_time':
      if (time === 'PRE_PEN') return { label: t('status.prePenalties'), isLive: true };
      if (time === 'ET HT') return { label: t('status.etHalfTime'), isLive: true };
      return { label: t('status.halfTime'), isLive: true };
    case 'completed':
      return { label: t('status.fullTime'), isLive: false };
    default:
      return { label: t('status.upcoming'), isLive: false };
  }
}
