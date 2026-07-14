// Registers the service worker in production builds only.
//
// The dev server (vite dev) is skipped so hot-module-reload isn't shadowed by a
// cached shell; `vite preview` and the deployed site are production builds, so
// PWA install + offline + notifications work there (and in the E2E suite, which
// runs against the preview build). Registration is a progressive enhancement:
// any failure is swallowed and the app keeps working exactly as before.

export function registerServiceWorker(): void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  if (!import.meta.env.PROD) return;
  const base = import.meta.env.BASE_URL || '/';
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${base}sw.js`).catch(() => {
      /* PWA is optional — the app runs fine without it */
    });
  });
}
