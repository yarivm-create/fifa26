/* Service worker for the FIFA World Cup 2026 dashboard.
 *
 * Deliberately conservative so it can't regress the live data flow:
 *   • It only intercepts same-origin NAVIGATION requests (the app shell),
 *     network-first with an offline cache fallback. Assets and the cross-origin
 *     FIFA API pass straight through — nothing else is touched.
 *   • It carries a `notificationclick` handler (focus/open the app) and a
 *     `push` handler. The push handler is the documented seam for REAL server
 *     Web Push: a static host can't send push today (no backend/VAPID), but if
 *     one is added later it can deliver here with no further client changes.
 * See docs/live-match-bar.md and docs/native-live-activities.md.
 */
/* global self, caches, Response */

const CACHE = 'wc2026-shell-v1';
const BASE = '/fifa26/';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.add(BASE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Only the app shell (same-origin navigations). Everything else is left to the
  // browser so normal caching and test network mocks are unaffected.
  if (req.mode === 'navigate' && url.origin === self.location.origin) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(BASE, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(BASE).then((r) => r || Response.error()))
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || BASE;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(BASE) && 'focus' in client) return client.focus();
      }
      return self.clients.openWindow(target);
    })
  );
});

// Seam for future server-initiated Web Push (needs a backend + VAPID keys).
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }
  const title = payload.title || 'FIFA World Cup 2026';
  const options = {
    body: payload.body || '',
    icon: BASE + 'icon-192.png',
    badge: BASE + 'icon-192.png',
    tag: payload.tag,
    data: payload.data || { url: BASE },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
