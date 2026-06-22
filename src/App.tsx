import React, { useState } from 'react';
import { LiveMatches } from './components/LiveMatches';
import { Standings } from './components/Standings';
import { Schedule } from './components/Schedule';

type Tab = 'live' | 'standings' | 'schedule';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('live');

  return (
    <div className="app">
      <header className="header">
        <h1>⚽ FIFA World Cup 2026</h1>
        <p className="subtitle">
          United States • Mexico • Canada
        </p>
        <div className="live-indicator">
          <span className="live-dot" />
          LIVE DASHBOARD
        </div>
      </header>

      <nav className="nav">
        <button
          className={activeTab === 'live' ? 'active' : ''}
          onClick={() => setActiveTab('live')}
        >
          🔴 Live & Today
        </button>
        <button
          className={activeTab === 'standings' ? 'active' : ''}
          onClick={() => setActiveTab('standings')}
        >
          🏆 Standings
        </button>
        <button
          className={activeTab === 'schedule' ? 'active' : ''}
          onClick={() => setActiveTab('schedule')}
        >
          📅 Schedule
        </button>
      </nav>

      <main>
        {activeTab === 'live' && <LiveMatches />}
        {activeTab === 'standings' && <Standings />}
        {activeTab === 'schedule' && <Schedule />}
      </main>
    </div>
  );
};

export default App;
