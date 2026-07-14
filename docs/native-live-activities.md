# Native Live Activities & Android Live Updates — integration guide

> **A website cannot create Apple Live Activities / Dynamic Island updates or
> Android Live Update notifications.** Those are native OS APIs. This app ships
> the web experience (the [Live Match Bar](live-match-bar.md)) plus a **typed
> bridge** so that, when the site is wrapped in a native shell, the same live
> data drives a real Live Activity / Live Update with no changes to the web UI.

The bridge is `src/live/nativeBridge.ts`. In a plain browser every call is a safe
no-op returning `false`. Inside a wrapper it forwards a normalized payload to
whichever native host it detects.

## The contract

```ts
interface LiveActivityState {
  matchId: number;
  homeName: string; homeCode: string; homeGoals: number;
  awayName: string; awayCode: string; awayGoals: number;
  status: string;      // localized short status, e.g. "72'", "HT", "FT"
  event?: string;      // optional headline for the latest important event
  updatedAt: number;   // epoch ms of the source data (drop stale updates)
}

nativeLiveActivity.start(state)   // new live match began
nativeLiveActivity.update(state)  // score/clock/status changed
nativeLiveActivity.end(state)     // full-time (tear the activity down)
nativeLiveActivity.supported()    // true when a native host is present
```

`LiveMatchBar.tsx` already calls `start` when a new match is shown, `update` on
every change, and `end` on full-time. So a wrapper only has to expose **one** of
the three host interfaces below and Live Activities light up.

The bridge auto-detects, in order:

| Host | Detected via | Payload |
|------|--------------|---------|
| **Capacitor plugin** | `window.Capacitor.Plugins.LiveActivity` | `start/update(state)`, `end({matchId})` |
| **iOS WKWebView** | `window.webkit.messageHandlers.liveActivity` | `postMessage({ phase, state })` |
| **Android WebView** | `window.AndroidLiveUpdate` | `start/update/end(JSON.stringify({ phase, state }))` |

---

## iOS — ActivityKit / WidgetKit / Dynamic Island

**Prerequisites:** the site wrapped as a native iOS app (Capacitor, or a thin
WKWebView host, or a TWA-equivalent). iOS 16.1+ for Live Activities; 16.2+ for
remote (APNs) updates.

1. **Add a Widget Extension** to the iOS app (`File ▸ New ▸ Target ▸ Widget
   Extension`, "Include Live Activity"). Add `NSSupportsLiveActivities = YES` to
   the app's `Info.plist`.
2. **Define the `ActivityAttributes`** mirroring `LiveActivityState`:
   ```swift
   struct MatchAttributes: ActivityAttributes {
     struct ContentState: Codable, Hashable {
       var homeGoals: Int; var awayGoals: Int
       var status: String; var event: String?
     }
     var matchId: Int
     var homeName: String; var homeCode: String
     var awayName: String; var awayCode: String
   }
   ```
3. **Build the Lock Screen + Dynamic Island UI** in the widget with
   `ActivityConfiguration` / `DynamicIsland` (compact leading = home code + score,
   compact trailing = away code, expanded = full row + latest `event`).
4. **Bridge the web calls.** Expose one of the detected hosts:
   - *Capacitor:* write a small `LiveActivity` plugin whose `start/update/end`
     call `Activity<MatchAttributes>.request / update / end`.
   - *WKWebView:* register a `liveActivity` script message handler; in
     `userContentController(_:didReceive:)` decode `{ phase, state }` and call the
     matching ActivityKit API.
5. **Remote updates (optional, recommended).** Start the activity with
   `pushType: .token`, send the token to your push service, and update it from a
   server via **APNs** with `apns-push-type: liveactivity` targeting
   `.../push/... /<activity-token>`. Without a server, the activity still updates
   live **while the wrapped app is foregrounded/alive** (driven by the web poll).
6. **End on full-time** with a final content state and a short dismissal policy so
   the card clears itself.

Docs: Apple "Displaying live data with Live Activities" (ActivityKit),
"Live Activities" (Human Interface Guidelines), "Sending updates to Live
Activities" (APNs).

---

## Android — Live Updates / promoted ongoing notification

**Prerequisites:** the site wrapped as a native Android app (Capacitor, a
WebView host, or a Trusted Web Activity with a companion service).

1. **Foreground/ongoing notification.** Model the match as an ongoing
   notification with `setOngoing(true)` and a custom or
   `NotificationCompat.DecoratedCustomViewStyle` layout (home/away, score,
   minute). On Android 14+ request **promoted ongoing** treatment
   (`Notification.Builder.setOngoing` + the promoted-ongoing flag) so it appears
   as a status-bar chip / lock-screen Live Update where supported; degrade
   gracefully to a normal ongoing notification elsewhere.
2. **Bridge the web calls.** Add a `@JavascriptInterface` object named
   `AndroidLiveUpdate` to the WebView with `start(json)`, `update(json)`,
   `end(json)`. Parse `{ phase, state }` and build/update/cancel the notification
   (reuse the same notification id keyed by `matchId`).
   ```kotlin
   class AndroidLiveUpdate(private val ctx: Context) {
     @JavascriptInterface fun start(json: String)  { render(json, ongoing = true) }
     @JavascriptInterface fun update(json: String) { render(json, ongoing = true) }
     @JavascriptInterface fun end(json: String)    { cancel(json) }
   }
   webView.addJavascriptInterface(AndroidLiveUpdate(this), "AndroidLiveUpdate")
   ```
3. **Server updates (optional).** For updates when the app is backgrounded, send a
   **FCM** data message; handle it in a `FirebaseMessagingService` and re-render
   the same ongoing notification. Reuse the project's push infra if one is added.
4. **End on full-time:** cancel (or convert to a final non-ongoing summary)
   notification.

Docs: Android "Live Updates" / "Promoted ongoing notifications", Firebase Cloud
Messaging.

---

## Web (Capacitor) quick path

If the site is wrapped with Capacitor, the fastest route is a single custom
plugin `LiveActivity` exposing `start/update/end`; the web layer already targets
`window.Capacitor.Plugins.LiveActivity`. Implement the iOS side with ActivityKit
(above) and the Android side with the ongoing/promoted notification (above), and
both platforms are driven by the existing web poll with zero web changes.

## What is NOT done here (honest)

- No native project is checked in — this repo is the static web app. The bridge
  and this guide are the seam; the native targets above must be added in the
  wrapper project.
- Server-driven updates (APNs / FCM) need a backend + credentials. Without one,
  native activities still update live while the wrapped app is alive, exactly
  like the in-page bar.
