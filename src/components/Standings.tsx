import React, { useCallback } from 'react';
import { useLiveData } from '../hooks/useLiveData';
import { fetchGroups, fetchForm, fetchQualification } from '../api/worldcup';
import { GroupTable } from './GroupTable';
import { Group } from '../api/types';
import { FormResult } from '../api/mockData';
import { QualChance } from '../api/qualification';
import { useFollowedTeams } from '../hooks/useFollowedTeams';
import { useI18n } from '../i18n';
import { Trophy } from './Trophy';

export const Standings: React.FC = () => {
  const { t } = useI18n();
  const fetcher = useCallback(() => fetchGroups(), []);
  const formFetcher = useCallback(() => fetchForm(), []);
  const qualFetcher = useCallback(() => fetchQualification(), []);
  const { data: groups, loading, error } = useLiveData<Group[]>(fetcher, 120000);
  const { data: form } = useLiveData<Record<string, FormResult[]>>(formFetcher, 120000);
  const { data: qual } = useLiveData<Record<string, QualChance>>(qualFetcher, 120000);
  const teamFollow = useFollowedTeams();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>{t('loading.standings')}</p>
      </div>
    );
  }

  if (error) {
    return <div className="error">⚠️ {error}</div>;
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 40 }}>
        <p style={{ color: '#a0aec0' }}>{t('standings.notAvailable')}</p>
        <p style={{ color: '#a0aec0', fontSize: '0.85rem', marginTop: 8 }}>
          {t('standings.willAppear')}
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}><Trophy size={22} /> {t('standings.title')}</h2>
      <p className="qual-legend">
        <span className="qual-swatch" /> {t('standings.legend')}
      </p>
      <div className="groups-grid">
        {groups.map((group) => (
          <GroupTable key={group.letter} group={group} form={form || {}} qual={qual || {}} teamFollow={teamFollow} />
        ))}
      </div>
    </div>
  );
};
