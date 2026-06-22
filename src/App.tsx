import React, { useState, useEffect } from 'react';
import { LiveMatches } from './components/LiveMatches';
import { Standings } from './components/Standings';
import { Schedule } from './components/Schedule';
import { Bracket } from './components/Bracket';

type Tab = 'live' | 'standings' | 'bracket' | 'schedule';

const HEBREW_DAYS = ['יום א׳', 'יום ב׳', 'יום ג׳', 'יום ד׳', 'יום ה׳', 'יום ו׳', 'שבת'];
const HEBREW_MONTHS = [
  'בינואר', 'בפברואר', 'במרץ', 'באפריל', 'במאי', 'ביוני',
  'ביולי', 'באוגוסט', 'בספטמבר', 'באוקטובר', 'בנובמבר', 'בדצמבר',
];

function getIsraelClock(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) => parts.find(p => p.type === type)?.value || '';
  const month = parseInt(get('month'), 10);
  const day = parseInt(get('day'), 10);
  const year = get('year');
  const hour = get('hour');
  const minute = get('minute');
  const second = get('second');

  const israelDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
  const dayOfWeek = israelDate.getDay();
  const hebrewDay = HEBREW_DAYS[dayOfWeek];
  const hebrewMonth = HEBREW_MONTHS[month - 1];

  return `🕐 ${hebrewDay}, ${day} ${hebrewMonth} ${year} • ${hour}:${minute}:${second}`;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('live');
  const [clock, setClock] = useState(getIsraelClock);

  useEffect(() => {
    const interval = setInterval(() => setClock(getIsraelClock()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1>⚽ FIFA World Cup 2026</h1>
        <p className="subtitle">
          United States • Mexico • Canada
        </p>
        <div className="header-clock">{clock}</div>
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
          className={activeTab === 'bracket' ? 'active' : ''}
          onClick={() => setActiveTab('bracket')}
        >
          🗺️ Bracket
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
        {activeTab === 'bracket' && <Bracket />}
        {activeTab === 'schedule' && <Schedule />}
      </main>
    </div>
  );
};

export default App;
