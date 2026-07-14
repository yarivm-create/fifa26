import { test, expect } from '@playwright/test';
import { Match, TeamResult } from '../src/api/types';
import { diffMatchEvents, appendEvents, LiveEvent, LiveEventType } from '../src/live/matchTimeline';
import {
  categoryForEvent,
  shouldNotify,
  buildNotificationContent,
  NotifySettings,
  NOTIFY_CATEGORIES,
  setNotifyCategory,
  getNotifySettings,
} from '../src/live/notifications';
import { toggleFollowedMatch } from '../src/live/useFollowedMatches';
import { TFunc } from '../src/i18n';

// Pure-logic coverage for the Live Match Bar's engine. These run in Node (no
// browser) so they're fast and deterministic across every project. The rendered
// UI + interactions are covered separately in live-match-bar-ui.spec.ts.

function team(code: string, goals: number | null, penalties?: number): TeamResult {
  return { country: code, name: code, code, goals, penalties: penalties ?? null };
}

function match(over: Partial<Match> & { home_team: TeamResult; away_team: TeamResult }): Match {
  return {
    id: 1,
    venue: 'V',
    location: 'L',
    datetime: '2026-06-15T18:00:00Z',
    status: 'in_progress',
    stage_name: 'Group A',
    time: "45'",
    ...over,
  };
}

// A minimal interpolating translator so content assertions don't depend on the
// real dictionaries.
const t: TFunc = (key, vars) =>
  vars ? `${key}|${Object.entries(vars).map(([k, v]) => `${k}=${v}`).join(',')}` : key;

test.describe('matchTimeline.diffMatchEvents', () => {
  test('emits nothing on the first observation (baseline only)', () => {
    const next = match({ home_team: team('ESP', 0), away_team: team('GER', 0) });
    expect(diffMatchEvents(undefined, next)).toEqual([]);
  });

  test('detects a goal for the side whose score increased', () => {
    const prev = match({ home_team: team('ESP', 0), away_team: team('GER', 0) });
    const next = match({ home_team: team('ESP', 1), away_team: team('GER', 0), time: "23'" });
    const evs = diffMatchEvents(prev, next);
    expect(evs).toHaveLength(1);
    expect(evs[0].type).toBe('goal');
    expect(evs[0].teamCode).toBe('ESP');
    expect(evs[0].minute).toBe("23'");
  });

  test('credits the away side and carries the minute', () => {
    const prev = match({ home_team: team('ESP', 1), away_team: team('GER', 0) });
    const next = match({ home_team: team('ESP', 1), away_team: team('GER', 1), time: "67'" });
    const evs = diffMatchEvents(prev, next);
    expect(evs.map((e) => e.teamCode)).toEqual(['GER']);
  });

  test('detects kickoff, half-time, second half and full-time transitions', () => {
    const base = { home_team: team('ESP', 0), away_team: team('GER', 0) };
    const kickoff = diffMatchEvents(
      match({ ...base, status: 'future_scheduled' }),
      match({ ...base, status: 'in_progress' })
    );
    expect(kickoff.map((e) => e.type)).toContain('kickoff');

    const ht = diffMatchEvents(
      match({ ...base, status: 'in_progress' }),
      match({ ...base, status: 'half_time', time: 'HT' })
    );
    expect(ht.map((e) => e.type)).toContain('halfTime');

    const second = diffMatchEvents(
      match({ ...base, status: 'half_time', time: 'HT' }),
      match({ ...base, status: 'in_progress', time: "46'" })
    );
    expect(second.map((e) => e.type)).toContain('secondHalf');

    const ft = diffMatchEvents(
      match({ ...base, status: 'in_progress' }),
      match({ ...base, status: 'completed', time: undefined })
    );
    expect(ft.map((e) => e.type)).toContain('fullTime');
  });

  test('detects entering a penalty shootout', () => {
    const prev = match({ home_team: team('ESP', 1), away_team: team('GER', 1), time: "120'" });
    const next = match({ home_team: team('ESP', 1, 1), away_team: team('GER', 1, 0), time: 'PEN' });
    const types = diffMatchEvents(prev, next).map((e) => e.type);
    expect(types).toContain('penaltyShootout');
  });
});

test.describe('matchTimeline.appendEvents (dedupe + cap)', () => {
  const ev = (id: string): LiveEvent => ({ id, matchId: 1, type: 'goal' });

  test('drops duplicate ids (handles duplicated / out-of-order deliveries)', () => {
    const feed = appendEvents([], [ev('a'), ev('b')]);
    const again = appendEvents(feed, [ev('b'), ev('c')]);
    expect(again.map((e) => e.id)).toEqual(['a', 'b', 'c']);
  });

  test('keeps only the latest `cap` events', () => {
    let feed: LiveEvent[] = [];
    for (let i = 0; i < 30; i++) feed = appendEvents(feed, [ev(`e${i}`)], 20);
    expect(feed).toHaveLength(20);
    expect(feed[0].id).toBe('e10');
  });
});

test.describe('notifications gating', () => {
  const granted = 'granted' as const;
  const allOn: NotifySettings = {
    goals: true,
    cards: true,
    kickoff: true,
    halfTime: true,
    fullTime: true,
    penaltyShootout: true,
  };
  const goalEvent: LiveEvent = { id: 'g', matchId: 1, type: 'goal', teamName: 'Spain' };

  test('maps every notifiable event to a category, and non-notifiable to null', () => {
    expect(categoryForEvent('goal')).toBe('goals');
    expect(categoryForEvent('penaltyScore')).toBe('goals');
    expect(categoryForEvent('redCard')).toBe('cards');
    expect(categoryForEvent('kickoff')).toBe('kickoff');
    expect(categoryForEvent('halfTime')).toBe('halfTime');
    expect(categoryForEvent('fullTime')).toBe('fullTime');
    expect(categoryForEvent('penaltyShootout')).toBe('penaltyShootout');
    (['secondHalf', 'extraTime', 'var', 'substitution', 'yellowCard', 'penaltyMiss'] as LiveEventType[]).forEach(
      (type) => expect(categoryForEvent(type)).toBeNull()
    );
  });

  test('every settings category is reachable from some event type', () => {
    const reachable = new Set(
      (
        [
          'goal',
          'penaltyScore',
          'redCard',
          'kickoff',
          'halfTime',
          'fullTime',
          'penaltyShootout',
        ] as LiveEventType[]
      )
        .map(categoryForEvent)
        .filter(Boolean)
    );
    for (const cat of NOTIFY_CATEGORIES) expect(reachable.has(cat)).toBe(true);
  });

  test('requires followed + permission granted + category enabled', () => {
    expect(shouldNotify(goalEvent, true, allOn, granted)).toBe(true);
    expect(shouldNotify(goalEvent, false, allOn, granted)).toBe(false); // not followed
    expect(shouldNotify(goalEvent, true, allOn, 'default')).toBe(false); // no permission
    expect(shouldNotify(goalEvent, true, { ...allOn, goals: false }, granted)).toBe(false); // category off
    // A non-notifiable event never fires even when everything else is on.
    expect(shouldNotify({ id: 'v', matchId: 1, type: 'var' }, true, allOn, granted)).toBe(false);
  });

  test('builds localized goal + full-time content from the match', () => {
    const m = match({ home_team: team('ESP', 1), away_team: team('GER', 0) });
    m.home_team.name = 'Spain';
    m.away_team.name = 'Germany';
    const goal = buildNotificationContent(goalEvent, m, t);
    expect(goal.title).toContain('notify.goal');
    expect(goal.title).toContain('team=Spain');
    expect(goal.body).toContain('Spain');
    expect(goal.body).toContain('1');
    const ft = buildNotificationContent({ id: 'f', matchId: 1, type: 'fullTime' }, m, t);
    expect(ft.title).toContain('notify.fullTime');
    expect(ft.body).toContain('Spain');
  });
});

test.describe('followed + settings stores', () => {
  test('toggleFollowedMatch flips on then off', () => {
    const id = 987654;
    expect(toggleFollowedMatch(id)).toBe(true);
    expect(toggleFollowedMatch(id)).toBe(false);
  });

  test('setNotifyCategory persists into the settings snapshot', () => {
    const before = getNotifySettings().halfTime;
    setNotifyCategory('halfTime', !before);
    expect(getNotifySettings().halfTime).toBe(!before);
    setNotifyCategory('halfTime', before); // restore
  });
});
