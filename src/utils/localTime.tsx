import React, { useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// Visitor-local time + location flag.
//
// Every match time is shown in the VISITOR'S own timezone (auto-detected from
// the browser), with a small flag of the country that timezone belongs to. A
// fan in Israel sees Israel time + 🇮🇱, a fan in the US sees US time + 🇺🇸, etc.
// ---------------------------------------------------------------------------

// IANA timezone -> ISO 3166-1 alpha-2 country code (flagcdn uses lowercase).
// Covers the commonly-populated zones worldwide; anything missing falls back to
// the browser locale's region, then to a neutral globe.
const TZ_TO_ISO: Record<string, string> = {
  // North & Central America
  'America/New_York': 'us', 'America/Detroit': 'us', 'America/Chicago': 'us',
  'America/Denver': 'us', 'America/Phoenix': 'us', 'America/Los_Angeles': 'us',
  'America/Anchorage': 'us', 'America/Adak': 'us', 'Pacific/Honolulu': 'us',
  'America/Indiana/Indianapolis': 'us', 'America/Kentucky/Louisville': 'us',
  'America/Boise': 'us', 'America/Toronto': 'ca', 'America/Vancouver': 'ca',
  'America/Edmonton': 'ca', 'America/Winnipeg': 'ca', 'America/Halifax': 'ca',
  'America/St_Johns': 'ca', 'America/Regina': 'ca', 'America/Mexico_City': 'mx',
  'America/Tijuana': 'mx', 'America/Monterrey': 'mx', 'America/Cancun': 'mx',
  'America/Guatemala': 'gt', 'America/Costa_Rica': 'cr', 'America/Panama': 'pa',
  'America/Havana': 'cu', 'America/Santo_Domingo': 'do', 'America/Port-au-Prince': 'ht',
  'America/Jamaica': 'jm', 'America/Puerto_Rico': 'pr', 'America/El_Salvador': 'sv',
  'America/Tegucigalpa': 'hn', 'America/Managua': 'ni',
  // South America
  'America/Sao_Paulo': 'br', 'America/Bahia': 'br', 'America/Fortaleza': 'br',
  'America/Manaus': 'br', 'America/Recife': 'br', 'America/Argentina/Buenos_Aires': 'ar',
  'America/Cordoba': 'ar', 'America/Argentina/Cordoba': 'ar', 'America/Santiago': 'cl',
  'America/Bogota': 'co', 'America/Lima': 'pe', 'America/Caracas': 've',
  'America/La_Paz': 'bo', 'America/Asuncion': 'py', 'America/Montevideo': 'uy',
  'America/Guayaquil': 'ec', 'America/Paramaribo': 'sr', 'America/Cayenne': 'gf',
  // Europe
  'Europe/London': 'gb', 'Europe/Dublin': 'ie', 'Europe/Lisbon': 'pt',
  'Europe/Madrid': 'es', 'Europe/Paris': 'fr', 'Europe/Brussels': 'be',
  'Europe/Amsterdam': 'nl', 'Europe/Berlin': 'de', 'Europe/Zurich': 'ch',
  'Europe/Rome': 'it', 'Europe/Vienna': 'at', 'Europe/Prague': 'cz',
  'Europe/Warsaw': 'pl', 'Europe/Budapest': 'hu', 'Europe/Copenhagen': 'dk',
  'Europe/Oslo': 'no', 'Europe/Stockholm': 'se', 'Europe/Helsinki': 'fi',
  'Europe/Athens': 'gr', 'Europe/Bucharest': 'ro', 'Europe/Sofia': 'bg',
  'Europe/Belgrade': 'rs', 'Europe/Zagreb': 'hr', 'Europe/Sarajevo': 'ba',
  'Europe/Kiev': 'ua', 'Europe/Kyiv': 'ua', 'Europe/Moscow': 'ru',
  'Europe/Istanbul': 'tr', 'Europe/Lisbon ': 'pt',
  // Middle East & Africa
  'Asia/Jerusalem': 'il', 'Asia/Tel_Aviv': 'il', 'Asia/Gaza': 'ps',
  'Asia/Beirut': 'lb', 'Asia/Amman': 'jo', 'Asia/Damascus': 'sy',
  'Asia/Baghdad': 'iq', 'Asia/Riyadh': 'sa', 'Asia/Kuwait': 'kw',
  'Asia/Qatar': 'qa', 'Asia/Dubai': 'ae', 'Asia/Tehran': 'ir',
  'Africa/Cairo': 'eg', 'Africa/Casablanca': 'ma', 'Africa/Algiers': 'dz',
  'Africa/Tunis': 'tn', 'Africa/Lagos': 'ng', 'Africa/Accra': 'gh',
  'Africa/Abidjan': 'ci', 'Africa/Dakar': 'sn', 'Africa/Johannesburg': 'za',
  'Africa/Nairobi': 'ke', 'Africa/Addis_Ababa': 'et', 'Africa/Tripoli': 'ly',
  // Asia & Oceania
  'Asia/Karachi': 'pk', 'Asia/Kolkata': 'in', 'Asia/Calcutta': 'in',
  'Asia/Dhaka': 'bd', 'Asia/Bangkok': 'th', 'Asia/Jakarta': 'id',
  'Asia/Singapore': 'sg', 'Asia/Kuala_Lumpur': 'my', 'Asia/Manila': 'ph',
  'Asia/Hong_Kong': 'hk', 'Asia/Shanghai': 'cn', 'Asia/Taipei': 'tw',
  'Asia/Seoul': 'kr', 'Asia/Tokyo': 'jp', 'Asia/Tashkent': 'uz',
  'Australia/Sydney': 'au', 'Australia/Melbourne': 'au', 'Australia/Brisbane': 'au',
  'Australia/Perth': 'au', 'Australia/Adelaide': 'au', 'Pacific/Auckland': 'nz',
};

function detectTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

function detectCountryIso(tz: string): string | null {
  const direct = TZ_TO_ISO[tz];
  if (direct) return direct;
  // Fallback: region from the browser locale (e.g. en-US -> us).
  try {
    const loc = new Intl.Locale(navigator.language);
    const region = (loc.maximize().region || loc.region || '').toLowerCase();
    if (region) return region;
  } catch {
    /* ignore */
  }
  return null;
}

export const LOCAL_TZ = detectTimeZone();
export const LOCAL_ISO = detectCountryIso(LOCAL_TZ);

// Short timezone abbreviation (e.g. "GMT+3", "EDT") for clarity.
function tzAbbrev(): string {
  try {
    const parts = new Intl.DateTimeFormat(undefined, {
      timeZone: LOCAL_TZ,
      timeZoneName: 'short',
    }).formatToParts(new Date());
    return parts.find(p => p.type === 'timeZoneName')?.value || '';
  } catch {
    return '';
  }
}
export const LOCAL_TZ_LABEL = tzAbbrev();

// Format a UTC/ISO datetime as the visitor's local time (their locale's style).
export function formatLocalTime(datetime: string | number | Date): string {
  return new Date(datetime).toLocaleTimeString(undefined, {
    timeZone: LOCAL_TZ,
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Format a datetime as a short local date (weekday + day + month).
export function formatLocalDate(
  datetime: string | number | Date,
  opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }
): string {
  return new Date(datetime).toLocaleDateString(undefined, { timeZone: LOCAL_TZ, ...opts });
}

// Stable YYYY-MM-DD key in the visitor's local timezone (for day bucketing).
export function localDateKey(date: string | number | Date): string {
  return new Date(date).toLocaleDateString('en-CA', { timeZone: LOCAL_TZ });
}

// Small flag image for the visitor's local timezone country.
export const LocalTimeFlag: React.FC<{ size?: number }> = ({ size = 18 }) => {
  if (!LOCAL_ISO) return <span aria-hidden="true">🌍</span>;
  const w = size >= 18 ? 'w40' : 'w20';
  return (
    <img
      src={`https://flagcdn.com/${w}/${LOCAL_ISO}.png`}
      srcSet={`https://flagcdn.com/w80/${LOCAL_ISO}.png 2x`}
      alt="your local timezone"
      width={size}
      height={Math.round(size * 0.67)}
      loading="lazy"
      style={{ verticalAlign: 'middle', borderRadius: 2, display: 'inline-block' }}
    />
  );
};

function clockString(): string {
  const now = new Date();
  const date = now.toLocaleDateString(undefined, {
    timeZone: LOCAL_TZ, weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
  const time = now.toLocaleTimeString(undefined, {
    timeZone: LOCAL_TZ, hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  return `${date} • ${time}`;
}

// Live-updating header clock: the visitor's local time + their region flag.
export const LocalClock: React.FC = () => {
  const [clock, setClock] = useState(clockString);
  useEffect(() => {
    const id = setInterval(() => setClock(clockString()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="header-clock" role="status" aria-live="off">
      <span aria-hidden="true">🕐</span> {clock}
      {LOCAL_TZ_LABEL && <span className="header-clock-tz"> {LOCAL_TZ_LABEL}</span>}
      {' '}
      <LocalTimeFlag size={18} />
    </div>
  );
};
