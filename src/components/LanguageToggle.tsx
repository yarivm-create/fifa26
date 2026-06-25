import React from 'react';
import { useI18n } from '../i18n';

// Header language switch. The site defaults to English; this flips to Hebrew
// (and back), persisting the choice and switching the document to RTL.
export const LanguageToggle: React.FC = () => {
  const { toggle, t, lang } = useI18n();
  return (
    <button
      type="button"
      className="lang-toggle"
      onClick={toggle}
      aria-label={t('lang.toggleAria')}
      lang={lang === 'en' ? 'he' : 'en'}
    >
      <span aria-hidden="true">🌐</span>
      {t('lang.toggle')}
    </button>
  );
};
