import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Match } from '../api/types';
import { useI18n } from '../i18n';
import { Flag } from '../utils/flags';
import { getStatusLabel } from '../utils/statusLabel';
import { useLiveMatchBar } from '../live/useLiveMatchBar';
import { useFollowedMatches } from '../live/useFollowedMatches';
import { LiveEvent } from '../live/matchTimeline';
import { nativeLiveActivity, LiveActivityState } from '../live/nativeBridge';
import { track } from '../live/analytics';
import {
  useNotifySettings,
  useNotificationPermission,
  shouldNotify,
  buildNotificationContent,
  showLiveNotification,
  NOTIFY_CATEGORIES,
} from '../live/notifications';

interface LiveMatchBarProps {
  liveMatches: Match[] | null;
  lastUpdated: Date | null;
  // Switches the app to the Live tab (the site has no per-match route).
  onOpenMatch: () => void;
}

function eventLabel(e: LiveEvent, t: ReturnType<typeof useI18n>['t']): string {
  const team = e.teamName ?? e.teamCode ?? '';
  const key = `live.ev.${e.type}`;
  return t(key, { team });
}

function toActivityState(m: Match, status: string): LiveActivityState {
  return {
    matchId: m.id,
    homeName: m.home_team.name,
    homeCode: m.home_team.code,
    homeGoals: m.home_team.goals ?? 0,
    awayName: m.away_team.name,
    awayCode: m.away_team.code,
    awayGoals: m.away_team.goals ?? 0,
    status,
    updatedAt: Date.now(),
  };
}

const LiveMatchBar: React.FC<LiveMatchBarProps> = ({ liveMatches, lastUpdated, onOpenMatch }) => {
  const { t } = useI18n();
  const model = useLiveMatchBar(liveMatches, lastUpdated);
  const { isFollowed, toggle: toggleFollow } = useFollowedMatches();
  const { settings, toggle: toggleCategory } = useNotifySettings();
  const { permission, request: requestPermission } = useNotificationPermission();

  const [expanded, setExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const [announce, setAnnounce] = useState('');

  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const displayedRef = useRef(false);
  const nativeIdRef = useRef<number | null>(null);
  const announceRef = useRef('');

  const { shown, visible, isEnded, connection, emitted } = model;

  const status = useMemo(() => {
    if (!shown) return { label: '', isLive: false };
    return getStatusLabel(shown.status, t, shown.time, {
      h: shown.home_team.penalties,
      a: shown.away_team.penalties,
    });
  }, [shown, t]);

  // Fire-once analytics when the bar first becomes visible.
  useEffect(() => {
    if (visible && !displayedRef.current) {
      displayedRef.current = true;
      track('live_bar_displayed', { live: model.live.length });
    }
    if (!visible) displayedRef.current = false;
  }, [visible, model.live.length]);

  // React to the events detected this tick: pulse, notifications, native bridge.
  useEffect(() => {
    if (emitted.length === 0) return;
    let pulsed = false;
    for (const { event, match } of emitted) {
      if (!pulsed && shown && event.matchId === shown.id) {
        setPulseKey((k) => k + 1);
        pulsed = true;
      }
      if (shouldNotify(event, isFollowed(event.matchId), settings, permission)) {
        const { title, body } = buildNotificationContent(event, match, t);
        void showLiveNotification({ title, body, tag: `wc-match-${event.matchId}`, matchId: event.matchId });
      }
      if (event.type === 'fullTime') {
        nativeLiveActivity.end(toActivityState(match, t('live.bar.ended')));
      }
    }
  }, [emitted, shown, isFollowed, settings, permission, t]);

  // Keep a native Live Activity (when a wrapper is present) in step with the
  // shown match — start on a new match, update on every change.
  useEffect(() => {
    if (!shown || isEnded) return;
    const state = toActivityState(shown, status.label);
    if (nativeIdRef.current !== shown.id) {
      nativeIdRef.current = shown.id;
      nativeLiveActivity.start(state);
    } else {
      nativeLiveActivity.update(state);
    }
  }, [shown, isEnded, status.label]);

  // Announce score/status changes politely for screen readers (only on change,
  // so we never interrupt repeatedly).
  useEffect(() => {
    if (!shown) return;
    const msg = t('live.bar.srScore', {
      home: shown.home_team.name,
      hg: shown.home_team.goals ?? 0,
      away: shown.away_team.name,
      ag: shown.away_team.goals ?? 0,
      status: status.label,
    });
    if (msg !== announceRef.current) {
      announceRef.current = msg;
      setAnnounce(msg);
    }
  }, [shown, status.label, t]);

  // Focus the panel when it opens; restore focus to the toggle when it closes.
  const openPanel = useCallback(() => {
    setExpanded(true);
    track('live_bar_expanded', { matchId: shown?.id ?? null });
  }, [shown]);
  const closePanel = useCallback(() => {
    setExpanded(false);
    setShowSettings(false);
    track('live_bar_collapsed');
    toggleRef.current?.focus();
  }, []);

  useEffect(() => {
    if (expanded) panelRef.current?.focus();
  }, [expanded]);

  // Collapse an expanded panel if the shown match disappears entirely.
  useEffect(() => {
    if (!visible) {
      setExpanded(false);
      setShowSettings(false);
    }
  }, [visible]);

  const onOpen = useCallback(() => {
    if (shown) track('live_bar_full_match_opened', { matchId: shown.id });
    onOpenMatch();
    closePanel();
  }, [shown, onOpenMatch, closePanel]);

  const onToggleFollow = useCallback(() => {
    if (!shown) return;
    const nowFollowed = toggleFollow(shown.id);
    track(nowFollowed ? 'live_bar_match_followed' : 'live_bar_match_unfollowed', { matchId: shown.id });
    // Following is only useful with notifications — offer the prompt on opt-in.
    if (nowFollowed && permission === 'default') void requestPermission();
  }, [shown, toggleFollow, permission, requestPermission]);

  const onSwitch = useCallback(() => {
    model.cycleNext();
    track('live_bar_match_switched');
  }, [model]);

  if (!visible || !shown) return null;

  const followed = isFollowed(shown.id);
  const hg = shown.home_team.goals ?? 0;
  const ag = shown.away_team.goals ?? 0;
  const barAria = t('live.bar.aria', {
    home: shown.home_team.name,
    hg,
    away: shown.away_team.name,
    ag,
    status: status.label,
  });

  return (
    <div
      className="live-bar"
      data-expanded={expanded ? 'true' : 'false'}
      data-connection={connection}
      data-ended={isEnded ? 'true' : 'false'}
      role="region"
      aria-label={t('live.bar.regionLabel')}
    >
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {announce}
      </span>

      <button
        ref={toggleRef}
        type="button"
        className="live-bar__toggle"
        aria-expanded={expanded}
        aria-controls="live-bar-panel"
        aria-label={barAria}
        onClick={() => (expanded ? closePanel() : openPanel())}
      >
        <span key={pulseKey} className="live-bar__pulse" aria-hidden="true" />
        {!isEnded && (
          <span className="live-bar__live">
            <span className="live-bar__live-dot" aria-hidden="true" />
            {t('live.bar.live')}
          </span>
        )}
        <span className="live-bar__team">
          <Flag code={shown.home_team.code} name={shown.home_team.name} />
          <span className="live-bar__code">{shown.home_team.code}</span>
        </span>
        <span className="live-bar__score">
          {hg}<span className="live-bar__score-sep">–</span>{ag}
        </span>
        <span className="live-bar__team">
          <span className="live-bar__code">{shown.away_team.code}</span>
          <Flag code={shown.away_team.code} name={shown.away_team.name} />
        </span>
        <span className={`live-bar__status${status.isLive ? ' is-live' : ''}`}>{status.label}</span>
        {model.extraCount > 0 && (
          <span className="live-bar__more" aria-hidden="true">+{model.extraCount}</span>
        )}
      </button>

      {expanded && (
        <div
          id="live-bar-panel"
          ref={panelRef}
          className="live-bar__panel"
          role="group"
          aria-label={t('live.bar.detailsLabel')}
          tabIndex={-1}
          onKeyDown={(e) => {
            if (e.key === 'Escape') closePanel();
          }}
        >
          <div className="live-bar__panel-head">
            <span className="live-bar__conn" data-state={connection}>
              {isEnded
                ? t('live.bar.ended')
                : connection === 'stale'
                  ? t('live.bar.reconnecting')
                  : lastUpdated
                    ? t('live.bar.updated', { time: lastUpdated.toLocaleTimeString() })
                    : ''}
            </span>
            <button type="button" className="live-bar__close" onClick={closePanel} aria-label={t('live.bar.close')}>
              ✕
            </button>
          </div>

          <div className="live-bar__teams">
            <div className="live-bar__teams-row">
              <Flag code={shown.home_team.code} name={shown.home_team.name} />
              <span className="live-bar__teamname">{shown.home_team.name}</span>
              <span className="live-bar__bigscore">{hg}</span>
            </div>
            <div className="live-bar__teams-row">
              <Flag code={shown.away_team.code} name={shown.away_team.name} />
              <span className="live-bar__teamname">{shown.away_team.name}</span>
              <span className="live-bar__bigscore">{ag}</span>
            </div>
            <div className={`live-bar__clock${status.isLive ? ' is-live' : ''}`}>{status.label}</div>
          </div>

          {model.extraCount > 0 && (
            <button type="button" className="live-bar__switch" onClick={onSwitch}>
              {t('live.bar.next')} <span aria-hidden="true">({model.extraCount + 1})</span>
            </button>
          )}

          <div className="live-bar__events" aria-label={t('live.bar.events')}>
            <h3 className="live-bar__events-title">{t('live.bar.events')}</h3>
            {model.feed.length === 0 ? (
              <p className="live-bar__noevents">{t('live.bar.noEvents')}</p>
            ) : (
              <ul className="live-bar__feed">
                {model.feed.map((e) => (
                  <li key={e.id}>
                    {e.minute && <span className="live-bar__min">{e.minute}</span>}
                    <span>{eventLabel(e, t)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="live-bar__actions">
            <button
              type="button"
              className={`live-bar__follow${followed ? ' is-on' : ''}`}
              aria-pressed={followed}
              onClick={onToggleFollow}
            >
              {followed ? t('live.bar.following') : t('live.bar.follow')}
            </button>
            <button
              type="button"
              className="live-bar__notif-toggle"
              aria-expanded={showSettings}
              onClick={() => setShowSettings((s) => !s)}
            >
              {t('live.bar.notifyTitle')}
            </button>
            <button type="button" className="live-bar__open" onClick={onOpen}>
              {t('live.bar.openMatch')} <span aria-hidden="true">→</span>
            </button>
          </div>

          {showSettings && (
            <div className="live-bar__notif" role="group" aria-label={t('live.bar.notifyTitle')}>
              {permission === 'unsupported' ? (
                <p className="live-bar__notif-note">{t('live.bar.notifUnsupported')}</p>
              ) : permission === 'denied' ? (
                <p className="live-bar__notif-note">{t('live.bar.notificationsBlocked')}</p>
              ) : permission === 'default' ? (
                <button type="button" className="live-bar__notif-enable" onClick={() => void requestPermission()}>
                  {t('live.bar.enableNotifications')}
                </button>
              ) : (
                <p className="live-bar__notif-note">{t('live.bar.notifNote')}</p>
              )}
              <ul className="live-bar__notif-list">
                {NOTIFY_CATEGORIES.map((cat) => (
                  <li key={cat}>
                    <label>
                      <input
                        type="checkbox"
                        checked={settings[cat]}
                        disabled={permission !== 'granted'}
                        onChange={() => toggleCategory(cat)}
                      />
                      {t(`notify.cat.${cat}`)}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveMatchBar;
