import React from 'react';
import { Trophy } from '../components/Trophy';

// Maps FIFA 3-letter team codes to ISO 3166-1 alpha-2 codes used by flagcdn.com.
// England/Scotland use the special gb-eng / gb-sct subdivision codes.
// Knockout placeholder codes (2A, W73, RU101, 3ABCDF) have no flag.

const FIFA_CODE_TO_ISO: Record<string, string> = {
  ALG: 'dz',
  ARG: 'ar',
  AUS: 'au',
  AUT: 'at',
  BEL: 'be',
  BIH: 'ba',
  BRA: 'br',
  CAN: 'ca',
  CIV: 'ci',
  COD: 'cd',
  COL: 'co',
  CPV: 'cv',
  CRO: 'hr',
  CUW: 'cw',
  CZE: 'cz',
  ECU: 'ec',
  EGY: 'eg',
  ENG: 'gb-eng',
  ESP: 'es',
  FRA: 'fr',
  GER: 'de',
  GHA: 'gh',
  HAI: 'ht',
  IRN: 'ir',
  IRQ: 'iq',
  JOR: 'jo',
  JPN: 'jp',
  KOR: 'kr',
  KSA: 'sa',
  MAR: 'ma',
  MEX: 'mx',
  NED: 'nl',
  NOR: 'no',
  NZL: 'nz',
  PAN: 'pa',
  PAR: 'py',
  POR: 'pt',
  QAT: 'qa',
  RSA: 'za',
  SCO: 'gb-sct',
  SEN: 'sn',
  SUI: 'ch',
  SWE: 'se',
  TUN: 'tn',
  TUR: 'tr',
  URU: 'uy',
  USA: 'us',
  UZB: 'uz',
};

export function getFlagUrl(code: string): string | null {
  const iso = FIFA_CODE_TO_ISO[code];
  return iso ? `https://flagcdn.com/w40/${iso}.png` : null;
}

interface FlagProps {
  code: string;
  name?: string;
  className?: string;
}

// Renders a real flag image; falls back to a trophy for knockout placeholders.
// On image load failure the element collapses to an identically-sized neutral
// box so a single broken flag never knocks its row out of alignment.
const FLAG_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='26' height='18'%3E%3Crect width='26' height='18' fill='%232a3a5c'/%3E%3C/svg%3E";

export const Flag: React.FC<FlagProps> = ({ code, name, className }) => {
  const url = getFlagUrl(code);
  if (!url) {
    return <span className={`team-flag flag-placeholder ${className || ''}`}><Trophy size={16} /></span>;
  }
  return (
    <img
      src={url}
      srcSet={`${url.replace('/w40/', '/w80/')} 2x`}
      alt={name ? `${name} flag` : code}
      width={26}
      height={18}
      loading="lazy"
      className={`team-flag flag-img ${className || ''}`}
      onError={(e) => {
        const img = e.currentTarget;
        if (img.src.startsWith('data:')) return;
        img.srcset = '';
        img.src = FLAG_FALLBACK;
      }}
    />
  );
};
