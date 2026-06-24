import React, { useCallback } from 'react';
import { useLiveData } from '../hooks/useLiveData';
import { fetchGroups, fetchForm, fetchQualification } from '../api/worldcup';
import { GroupTable } from './GroupTable';
import { Group } from '../api/types';
import { FormResult } from '../api/mockData';
import { QualChance } from '../api/qualification';

export const Standings: React.FC = () => {
  const fetcher = useCallback(() => fetchGroups(), []);
  const formFetcher = useCallback(() => fetchForm(), []);
  const qualFetcher = useCallback(() => fetchQualification(), []);
  const { data: groups, loading, error } = useLiveData<Group[]>(fetcher, 120000);
  const { data: form } = useLiveData<Record<string, FormResult[]>>(formFetcher, 120000);
  const { data: qual } = useLiveData<Record<string, QualChance>>(qualFetcher, 120000);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>Loading group standings...</p>
      </div>
    );
  }

  if (error) {
    return <div className="error">⚠️ {error}</div>;
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 40 }}>
        <p style={{ color: '#a0aec0' }}>Group standings not yet available.</p>
        <p style={{ color: '#a0aec0', fontSize: '0.85rem', marginTop: 8 }}>
          Standings will appear once the group stage begins.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: 8 }}>🏆 Group Standings</h2>
      <p className="qual-legend">
        Top 2 of each group + 8 best third-placed teams reach the Round of 32.
        <span className="qual-badge qual-q">✓ Through</span>
        <span className="qual-badge qual-pct">% chance</span>
        <span className="qual-badge qual-out">✕ Out</span>
      </p>
      <div className="groups-grid">
        {groups.map((group) => (
          <GroupTable key={group.letter} group={group} form={form || {}} qual={qual || {}} />
        ))}
      </div>
    </div>
  );
};
