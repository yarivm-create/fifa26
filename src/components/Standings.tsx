import React, { useCallback } from 'react';
import { useLiveData } from '../hooks/useLiveData';
import { fetchGroups, fetchForm } from '../api/worldcup';
import { GroupTable } from './GroupTable';
import { Group } from '../api/types';
import { FormResult } from '../api/mockData';

export const Standings: React.FC = () => {
  const fetcher = useCallback(() => fetchGroups(), []);
  const formFetcher = useCallback(() => fetchForm(), []);
  const { data: groups, loading, error } = useLiveData<Group[]>(fetcher, 120000);
  const { data: form } = useLiveData<Record<string, FormResult[]>>(formFetcher, 120000);

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
      <h2 style={{ marginBottom: 20 }}>🏆 Group Standings</h2>
      <div className="groups-grid">
        {groups.map((group) => (
          <GroupTable key={group.letter} group={group} form={form || {}} />
        ))}
      </div>
    </div>
  );
};
