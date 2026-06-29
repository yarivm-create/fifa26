import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { setActiveLocale } from '../utils/localTime';

// ---------------------------------------------------------------------------
// Lightweight i18n.
//
// The site ships in English by default; visitors can switch to Hebrew from the
// header toggle. Team, stadium and player names always stay in their original
// (English) form — only the UI chrome is translated. Hebrew also flips the
// document to RTL (handled here via <html dir>).
// ---------------------------------------------------------------------------

export type Lang = 'en' | 'he';

const STORAGE_KEY = 'wc26-lang';

// Locale passed to Intl for date/number formatting. English keeps `undefined`
// so each visitor still sees their own region's clock style (US AM/PM, EU 24h);
// Hebrew formats explicitly in he-IL.
const LOCALE: Record<Lang, string | undefined> = {
  en: undefined,
  he: 'he-IL',
};

type Dict = Record<string, string>;

const en: Dict = {
  // Header
  'app.title': 'FIFA World Cup 2026',
  'app.subtitle': 'United States • Mexico • Canada',
  'app.liveDashboard': 'LIVE DASHBOARD',
  'app.watchingNow': 'watching now',
  // Tabs
  'tab.live': '🔴 Live & Today',
  'tab.standings': 'Standings',
  'tab.stats': '📊 Stats',
  'tab.bracket': '🗺️ Bracket',
  'tab.schedule': '📅 Schedule',
  'tab.favorites': '⭐ My Favorites',
  'nav.aria': 'Dashboard sections',
  // Language toggle
  'lang.toggle': 'HE',
  'lang.toggleAria': 'Switch language to Hebrew',
  // Loading
  'loading.generic': 'Loading…',
  'loading.matches': 'Loading matches...',
  'loading.standings': 'Loading group standings...',
  'loading.stats': 'Loading tournament statistics...',
  'loading.schedule': 'Loading full schedule...',
  'loading.bracket': 'Loading bracket...',
  'loading.teamDetails': 'Loading team details…',
  'loading.playerDetails': 'Loading player details…',
  // Live / day sections
  'live.now': '🔴 Live Now',
  'live.upcoming': '⏭️ Next Up',
  'live.today': '📅 Today',
  'live.yesterday': '📋 Yesterday',
  'live.tomorrow': '⏭️ Tomorrow',
  'live.dayAfter': '📅 Day After Tomorrow',
  'live.noneTitle': 'No matches around this date',
  'live.noneSub': 'No matches around today — check the Schedule tab for upcoming fixtures.',
  'live.lastUpdated': 'Last updated: {time} • auto-refreshing',
  'live.lastUpdatedTz': 'Last updated: {time} ({tz}) • auto-refreshing',
  // Match status + links
  'status.live': '⚽ LIVE',
  'status.halfTime': 'HALF TIME',
  'status.fullTime': 'FULL TIME',
  'status.upcoming': 'UPCOMING',
  'match.liveCenter': 'Live Match Center →',
  'match.recap': 'Match Recap & Highlights →',
  // Standings
  'standings.title': 'Group Standings',
  'standings.legend': 'Highlighted teams have qualified — top 2 of each group + 8 best third-placed teams reach the Round of 32. Tap ☆ to favorite a team.',
  'standings.through': '✓ Through',
  'standings.pctChance': '% chance',
  'standings.out': '✕ Out',
  'standings.notAvailable': 'Group standings not yet available.',
  'standings.willAppear': 'Standings will appear once the group stage begins.',
  'group.label': 'Group {letter}',
  'group.qualified': '✓ Qualified for Round of 32',
  'group.qualifiedTitle': 'Qualified for the Round of 32',
  'group.eliminated': '✕ Eliminated',
  'group.eliminatedTitle': 'Eliminated',
  'group.toAdvance': '{pct} to advance',
  'group.advanceTitle': '{pct} chance to reach the Round of 32 · {top2} to finish top 2',
  'col.team': 'Team',
  'col.form': 'Form',
  'fav.add': 'Add to favorites',
  'fav.remove': 'Remove from favorites',
  // Stats
  'stats.title': '📊 Tournament Statistics',
  'stats.progress': 'Tournament Progress',
  'stats.matchesOf': '{played} / {total} matches',
  'stats.totalGoals': 'Total Goals',
  'stats.goalsPerMatch': 'Goals / Match',
  'stats.matchesPlayed': 'Matches Played',
  'stats.upcoming': 'Upcoming',
  'stats.cleanSheets': 'Clean Sheets',
  'stats.btts': 'Both Teams Scored',
  'stats.goldenBoot': '👟 Golden Boot Race — Top Scorers',
  'stats.playmakers': '🎯 Playmakers — Top Assists',
  'stats.followHint': '⭐ Tap ☆ next to a player to follow them — see them in the “My Favorites” tab.',
  'stats.biggestWin': '🔥 Biggest Win',
  'stats.highestScoring': '⚽ Highest Scoring',
  'stats.goalMargin': 'goal margin',
  'stats.goals': 'goals',
  'stats.topScoringTeams': '🥅 Top Scoring Teams',
  'stats.bestDefenses': '🛡️ Best Defenses',
  'stats.goalsByStage': '⚡ Goals by Stage',
  'stats.willAppear': 'Statistics will appear once matches are played.',
  'stats.stageSuffix': 'goals · {matches} matches · {avg}/match',
  'stats.stageUpcoming': 'upcoming · {matches} matches',
  'stats.followPlayer': 'Follow player',
  'stats.unfollowPlayer': 'Unfollow player',
  // Schedule
  'schedule.title': '📋 Full Schedule — 104 Matches',
  'schedule.today': 'TODAY',
  // Stage buckets (shared by Schedule + Bracket)
  'stage.group': 'Group Stage',
  'stage.r32': 'Round of 32',
  'stage.r16': 'Round of 16',
  'stage.qf': 'Quarter-finals',
  'stage.sf': 'Semi-finals',
  'stage.third': 'Third Place',
  'stage.final': 'Final',
  // Bracket
  'bracket.title': '🗺️ Knockout Bracket',
  'bracket.thirdPlace': '🥉 Third Place Play-off',
  'bracket.winnerMatch': 'Winner M{n}',
  'bracket.loserMatch': 'Loser M{n}',
  'bracket.winnerGroup': 'Winner Grp {letter}',
  'bracket.runnerUp': 'Runner-up {letter}',
  'bracket.third': '3rd {groups}',
  // Favorites
  'fav.title': '⭐ My Favorites',
  'fav.nothing': 'Nothing favorited yet',
  'fav.emptyHint': "Tap ☆ next to a team in the Standings or Stats tab to follow a team, or next to a player in the Stats tab to follow a player. They'll show up here.",
  'fav.teams': '⭐ Favorite Teams',
  'fav.players': '👤 Followed Players',
  'fav.teamsPrompt': 'Tap ☆ next to a team in the Standings or Stats tab to add it here.',
  'fav.playersPrompt': 'Tap ☆ next to a player in the Stats tab to follow them here.',
  'fav.teamsNotInData': "Your favorite teams aren't in the group stage data yet.",
  'fav.playersNoStats': "Your followed players haven't recorded goals or assists yet — check back after their next match.",
  // Team / player cards
  'card.topPlayers': 'Top players',
  'card.fixtures': 'Fixtures',
  'card.noFixtures': 'No fixtures available.',
  'card.vs': 'vs',
  'card.knockout': 'Knockout',
  'card.tbd': 'TBD',
  'card.pts': 'Pts',
  'card.played': 'Played',
  'card.wdl': 'W-D-L',
  'card.gfga': 'GF:GA',
  'card.gd': 'GD',
  'card.form': 'Form',
  'card.goals': '⚽ Goals',
  'card.assists': '🅰️ Assists',
  'card.upcomingMatches': 'Upcoming {team} matches',
  'card.noUpcoming': 'No upcoming matches scheduled.',
  'card.unfollow': 'Unfollow',
  'card.follow': 'Follow',
  'card.removeFav': 'Remove from favorites',
  // Offline / celebrations / errors
  'offline.message': 'You’re offline — showing the last loaded data. Live updates resume when you reconnect.',
  'fx.goal': 'GOAL! ⚽',
  'fx.fullTime': 'Full Time',
  'fx.matchOver': 'Match over',
  'fx.won': '{team} win! 🎉',
  'fx.draw': 'Honours even — it ends level',
  // Share
  'share.label': 'Share',
  'share.copied': 'Link copied!',
  'share.aria': 'Share this World Cup dashboard',
};

const he: Dict = {
  // Header
  'app.title': 'מונדיאל 2026',
  'app.subtitle': 'ארצות הברית • מקסיקו • קנדה',
  'app.liveDashboard': 'לוח חי',
  'app.watchingNow': 'צופים עכשיו',
  // Tabs
  'tab.live': '🔴 חי והיום',
  'tab.standings': 'טבלאות',
  'tab.stats': '📊 סטטיסטיקה',
  'tab.bracket': '🗺️ עץ הנוקאאוט',
  'tab.schedule': '📅 לוח משחקים',
  'tab.favorites': '⭐ המועדפים שלי',
  'nav.aria': 'מדורי הלוח',
  // Language toggle
  'lang.toggle': 'EN',
  'lang.toggleAria': 'החלף שפה לאנגלית',
  // Loading
  'loading.generic': 'טוען…',
  'loading.matches': 'טוען משחקים...',
  'loading.standings': 'טוען טבלאות בתים...',
  'loading.stats': 'טוען סטטיסטיקות טורניר...',
  'loading.schedule': 'טוען לוח משחקים מלא...',
  'loading.bracket': 'טוען עץ נוקאאוט...',
  'loading.teamDetails': 'טוען פרטי קבוצות…',
  'loading.playerDetails': 'טוען פרטי שחקנים…',
  // Live / day sections
  'live.now': '🔴 חי עכשיו',
  'live.upcoming': '⏭️ הבאים בתור',
  'live.today': '📅 היום',
  'live.yesterday': '📋 אתמול',
  'live.tomorrow': '⏭️ מחר',
  'live.dayAfter': '📅 מחרתיים',
  'live.noneTitle': 'אין משחקים בסביבות תאריך זה',
  'live.noneSub': 'אין משחקים בסביבות היום — בדקו את לשונית לוח המשחקים למשחקים הקרובים.',
  'live.lastUpdated': 'עודכן לאחרונה: {time} • מתרענן אוטומטית',
  'live.lastUpdatedTz': 'עודכן לאחרונה: {time} ({tz}) • מתרענן אוטומטית',
  // Match status + links
  'status.live': '⚽ חי',
  'status.halfTime': 'מחצית',
  'status.fullTime': 'סיום',
  'status.upcoming': 'עתידי',
  'match.liveCenter': '← מרכז המשחק החי',
  'match.recap': '← סיכום ותקצירים',
  // Standings
  'standings.title': 'טבלאות הבתים',
  'standings.legend': 'הקבוצות המודגשות העפילו — שתי הראשונות בכל בית + 8 השלישיות הטובות עולות לשלב 32 הקבוצות. הקישו על ☆ כדי להוסיף קבוצה למועדפים.',
  'standings.through': '✓ העפילו',
  'standings.pctChance': '% סיכוי',
  'standings.out': '✕ הודחו',
  'standings.notAvailable': 'טבלאות הבתים עדיין לא זמינות.',
  'standings.willAppear': 'הטבלאות יופיעו עם תחילת שלב הבתים.',
  'group.label': 'בית {letter}',
  'group.qualified': '✓ העפילה לשלב 32 הקבוצות',
  'group.qualifiedTitle': 'העפילה לשלב 32 הקבוצות',
  'group.eliminated': '✕ הודחה',
  'group.eliminatedTitle': 'הודחה',
  'group.toAdvance': '{pct} להעפלה',
  'group.advanceTitle': '{pct} סיכוי להעפיל לשלב 32 הקבוצות · {top2} לסיים בשתי הראשונות',
  'col.team': 'קבוצה',
  'col.form': 'Form',
  'fav.add': 'הוסף למועדפים',
  'fav.remove': 'הסר מהמועדפים',
  // Stats
  'stats.title': '📊 סטטיסטיקת הטורניר',
  'stats.progress': 'התקדמות הטורניר',
  'stats.matchesOf': '{played} / {total} משחקים',
  'stats.totalGoals': 'סך השערים',
  'stats.goalsPerMatch': 'שערים למשחק',
  'stats.matchesPlayed': 'משחקים ששוחקו',
  'stats.upcoming': 'עתידיים',
  'stats.cleanSheets': 'רשתות נקיות',
  'stats.btts': 'שתי הקבוצות כבשו',
  'stats.goldenBoot': '👟 מירוץ נעל הזהב — מלכי השערים',
  'stats.playmakers': '🎯 הבשלנים — מובילי הבישולים',
  'stats.followHint': '⭐ הקישו על ☆ ליד שחקן כדי לעקוב אחריו — הוא יופיע בלשונית "המועדפים שלי".',
  'stats.biggestWin': '🔥 הניצחון הגדול',
  'stats.highestScoring': '⚽ המשחק עתיר השערים',
  'stats.goalMargin': 'הפרש שערים',
  'stats.goals': 'שערים',
  'stats.topScoringTeams': '🥅 הקבוצות הכובשות ביותר',
  'stats.bestDefenses': '🛡️ ההגנות הטובות ביותר',
  'stats.goalsByStage': '⚡ שערים לפי שלב',
  'stats.willAppear': 'הסטטיסטיקות יופיעו לאחר שיתחילו המשחקים.',
  'stats.stageSuffix': 'שערים · {matches} משחקים · {avg}/משחק',
  'stats.stageUpcoming': 'בקרוב · {matches} משחקים',
  'stats.followPlayer': 'עקוב אחר השחקן',
  'stats.unfollowPlayer': 'הפסק לעקוב',
  // Schedule
  'schedule.title': '📋 לוח משחקים מלא — 104 משחקים',
  'schedule.today': 'היום',
  // Stage buckets
  'stage.group': 'שלב הבתים',
  'stage.r32': 'שלב 32 הקבוצות',
  'stage.r16': 'שמינית הגמר',
  'stage.qf': 'רבע הגמר',
  'stage.sf': 'חצי הגמר',
  'stage.third': 'מקום שלישי',
  'stage.final': 'הגמר',
  // Bracket
  'bracket.title': '🗺️ עץ הנוקאאוט',
  'bracket.thirdPlace': '🥉 משחק על המקום השלישי',
  'bracket.winnerMatch': 'מנצחת M{n}',
  'bracket.loserMatch': 'מפסידה M{n}',
  'bracket.winnerGroup': 'מנצחת בית {letter}',
  'bracket.runnerUp': 'סגנית {letter}',
  'bracket.third': 'שלישית {groups}',
  // Favorites
  'fav.title': '⭐ המועדפים שלי',
  'fav.nothing': 'עדיין אין מועדפים',
  'fav.emptyHint': 'הקישו על ☆ ליד קבוצה בלשונית הטבלאות או הסטטיסטיקה כדי לעקוב אחר קבוצה, או ליד שחקן בלשונית הסטטיסטיקה כדי לעקוב אחר שחקן. הם יופיעו כאן.',
  'fav.teams': '⭐ קבוצות מועדפות',
  'fav.players': '👤 שחקנים שאני עוקב אחריהם',
  'fav.teamsPrompt': 'הקישו על ☆ ליד קבוצה בלשונית הטבלאות או הסטטיסטיקה כדי להוסיף אותה לכאן.',
  'fav.playersPrompt': 'הקישו על ☆ ליד שחקן בלשונית הסטטיסטיקה כדי לעקוב אחריו מכאן.',
  'fav.teamsNotInData': 'הקבוצות המועדפות שלך עדיין לא מופיעות בנתוני שלב הבתים.',
  'fav.playersNoStats': 'השחקנים שאתה עוקב אחריהם עדיין לא רשמו שערים או בישולים — בדקו שוב אחרי המשחק הבא שלהם.',
  // Team / player cards
  'card.topPlayers': 'שחקנים מובילים',
  'card.fixtures': 'משחקים',
  'card.noFixtures': 'אין משחקים זמינים.',
  'card.vs': 'נגד',
  'card.knockout': 'נוקאאוט',
  'card.tbd': 'טרם נקבע',
  'card.pts': 'נק׳',
  'card.played': 'שוחקו',
  'card.wdl': 'נ-ת-ה',
  'card.gfga': 'שע+:שע-',
  'card.gd': 'הפרש',
  'card.form': 'כושר',
  'card.goals': '⚽ שערים',
  'card.assists': '🅰️ בישולים',
  'card.upcomingMatches': 'משחקים קרובים של {team}',
  'card.noUpcoming': 'אין משחקים קרובים מתוכננים.',
  'card.unfollow': 'הפסק לעקוב',
  'card.follow': 'עקוב',
  'card.removeFav': 'הסר מהמועדפים',
  // Offline / celebrations / errors
  'offline.message': 'אין חיבור לאינטרנט — מוצגים הנתונים האחרונים שנטענו. העדכונים החיים יתחדשו עם חזרת החיבור.',
  'fx.goal': 'גול! ⚽',
  'fx.fullTime': 'סיום המשחק',
  'fx.matchOver': 'המשחק הסתיים',
  'fx.won': '{team} ניצחה! 🎉',
  'fx.draw': 'המשחק הסתיים בתיקו',
  // Share
  'share.label': 'שיתוף',
  'share.copied': 'הקישור הועתק!',
  'share.aria': 'שתפו את לוח המונדיאל',
};

const DICTS: Record<Lang, Dict> = { en, he };

function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export type TFunc = (key: string, vars?: Record<string, string | number>) => string;

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: TFunc;
}

const I18nContext = createContext<I18nValue | null>(null);

function readInitialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'he' || saved === 'en') return saved;
  } catch {
    /* ignore */
  }
  return 'en';
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(readInitialLang);

  // Keep the Intl locale used by the date/time helpers in sync. Set it during
  // render (before children render) so any date formatted this pass already
  // uses the active language.
  setActiveLocale(LOCALE[lang]);

  // Reflect the language on <html> for accessibility + RTL layout.
  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === 'he' ? 'rtl' : 'ltr';
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const toggle = useCallback(
    () => setLangState((l) => (l === 'en' ? 'he' : 'en')),
    []
  );

  const t = useCallback<TFunc>(
    (key, vars) => {
      const dict = DICTS[lang];
      const fallback = DICTS.en[key];
      const raw = dict[key] ?? fallback ?? key;
      return interpolate(raw, vars);
    },
    [lang]
  );

  const value = useMemo<I18nValue>(
    () => ({ lang, setLang, toggle, t }),
    [lang, setLang, toggle, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Safe fallback so a stray consumer outside the provider still renders in
    // English instead of throwing.
    return {
      lang: 'en',
      setLang: () => {},
      toggle: () => {},
      t: (key, vars) => interpolate(DICTS.en[key] ?? key, vars),
    };
  }
  return ctx;
}
