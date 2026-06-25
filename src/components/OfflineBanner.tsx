import React, { useEffect, useState } from 'react';
import { useI18n } from '../i18n';

// Lightweight connectivity indicator. Shows a banner only when the browser
// goes offline, so users understand why live data has stopped updating.
export const OfflineBanner: React.FC = () => {
  const { t } = useI18n();
  const [offline, setOffline] = useState(
    typeof navigator !== 'undefined' && navigator.onLine === false
  );

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="offline-banner" role="status" aria-live="assertive">
      <span className="offline-banner-dot" aria-hidden="true" />
      {t('offline.message')}
    </div>
  );
};
