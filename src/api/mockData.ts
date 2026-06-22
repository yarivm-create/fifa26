import { Match, Group } from './types';

// Real FIFA World Cup 2026 data as of June 22, 2026
const GROUPS: Group[] = [
  {
    letter: 'A',
    teams: [
      { team: { country: 'Mexico', name: 'Mexico', code: 'MEX' }, played: 2, won: 2, drawn: 0, lost: 0, goals_for: 3, goals_against: 0, goal_difference: 3, points: 6 },
      { team: { country: 'South Korea', name: 'South Korea', code: 'KOR' }, played: 2, won: 1, drawn: 0, lost: 1, goals_for: 2, goals_against: 2, goal_difference: 0, points: 3 },
      { team: { country: 'Czechia', name: 'Czechia', code: 'CZE' }, played: 2, won: 0, drawn: 1, lost: 1, goals_for: 2, goals_against: 3, goal_difference: -1, points: 1 },
      { team: { country: 'South Africa', name: 'South Africa', code: 'RSA' }, played: 2, won: 0, drawn: 1, lost: 1, goals_for: 1, goals_against: 3, goal_difference: -2, points: 1 },
    ],
  },
  {
    letter: 'B',
    teams: [
      { team: { country: 'Canada', name: 'Canada', code: 'CAN' }, played: 2, won: 1, drawn: 1, lost: 0, goals_for: 7, goals_against: 1, goal_difference: 6, points: 4 },
      { team: { country: 'Switzerland', name: 'Switzerland', code: 'SUI' }, played: 2, won: 1, drawn: 1, lost: 0, goals_for: 5, goals_against: 2, goal_difference: 3, points: 4 },
      { team: { country: 'Bosnia & Herzegovina', name: 'Bosnia & Herzegovina', code: 'BIH' }, played: 2, won: 0, drawn: 1, lost: 1, goals_for: 2, goals_against: 5, goal_difference: -3, points: 1 },
      { team: { country: 'Qatar', name: 'Qatar', code: 'QAT' }, played: 2, won: 0, drawn: 1, lost: 1, goals_for: 1, goals_against: 7, goal_difference: -6, points: 1 },
    ],
  },
  {
    letter: 'C',
    teams: [
      { team: { country: 'Brazil', name: 'Brazil', code: 'BRA' }, played: 2, won: 1, drawn: 1, lost: 0, goals_for: 4, goals_against: 1, goal_difference: 3, points: 4 },
      { team: { country: 'Morocco', name: 'Morocco', code: 'MAR' }, played: 2, won: 1, drawn: 1, lost: 0, goals_for: 2, goals_against: 1, goal_difference: 1, points: 4 },
      { team: { country: 'Scotland', name: 'Scotland', code: 'SCO' }, played: 2, won: 1, drawn: 0, lost: 1, goals_for: 1, goals_against: 1, goal_difference: 0, points: 3 },
      { team: { country: 'Haiti', name: 'Haiti', code: 'HAI' }, played: 2, won: 0, drawn: 0, lost: 2, goals_for: 0, goals_against: 4, goal_difference: -4, points: 0 },
    ],
  },
  {
    letter: 'D',
    teams: [
      { team: { country: 'United States', name: 'United States', code: 'USA' }, played: 2, won: 2, drawn: 0, lost: 0, goals_for: 6, goals_against: 1, goal_difference: 5, points: 6 },
      { team: { country: 'Australia', name: 'Australia', code: 'AUS' }, played: 2, won: 1, drawn: 0, lost: 1, goals_for: 2, goals_against: 2, goal_difference: 0, points: 3 },
      { team: { country: 'Paraguay', name: 'Paraguay', code: 'PAR' }, played: 2, won: 1, drawn: 0, lost: 1, goals_for: 2, goals_against: 4, goal_difference: -2, points: 3 },
      { team: { country: 'Türkiye', name: 'Türkiye', code: 'TUR' }, played: 2, won: 0, drawn: 0, lost: 2, goals_for: 0, goals_against: 3, goal_difference: -3, points: 0 },
    ],
  },
  {
    letter: 'E',
    teams: [
      { team: { country: 'Germany', name: 'Germany', code: 'GER' }, played: 2, won: 2, drawn: 0, lost: 0, goals_for: 9, goals_against: 2, goal_difference: 7, points: 6 },
      { team: { country: "Côte d'Ivoire", name: "Côte d'Ivoire", code: 'CIV' }, played: 2, won: 1, drawn: 0, lost: 1, goals_for: 2, goals_against: 2, goal_difference: 0, points: 3 },
      { team: { country: 'Ecuador', name: 'Ecuador', code: 'ECU' }, played: 2, won: 0, drawn: 1, lost: 1, goals_for: 0, goals_against: 1, goal_difference: -1, points: 1 },
      { team: { country: 'Curaçao', name: 'Curaçao', code: 'CUW' }, played: 2, won: 0, drawn: 1, lost: 1, goals_for: 1, goals_against: 7, goal_difference: -6, points: 1 },
    ],
  },
  {
    letter: 'F',
    teams: [
      { team: { country: 'Netherlands', name: 'Netherlands', code: 'NED' }, played: 2, won: 1, drawn: 1, lost: 0, goals_for: 7, goals_against: 3, goal_difference: 4, points: 4 },
      { team: { country: 'Japan', name: 'Japan', code: 'JPN' }, played: 2, won: 1, drawn: 1, lost: 0, goals_for: 6, goals_against: 2, goal_difference: 4, points: 4 },
      { team: { country: 'Sweden', name: 'Sweden', code: 'SWE' }, played: 2, won: 1, drawn: 0, lost: 1, goals_for: 6, goals_against: 6, goal_difference: 0, points: 3 },
      { team: { country: 'Tunisia', name: 'Tunisia', code: 'TUN' }, played: 2, won: 0, drawn: 0, lost: 2, goals_for: 1, goals_against: 9, goal_difference: -8, points: 0 },
    ],
  },
  {
    letter: 'G',
    teams: [
      { team: { country: 'Egypt', name: 'Egypt', code: 'EGY' }, played: 2, won: 1, drawn: 1, lost: 0, goals_for: 4, goals_against: 2, goal_difference: 2, points: 4 },
      { team: { country: 'Iran', name: 'Iran', code: 'IRN' }, played: 2, won: 0, drawn: 2, lost: 0, goals_for: 2, goals_against: 2, goal_difference: 0, points: 2 },
      { team: { country: 'Belgium', name: 'Belgium', code: 'BEL' }, played: 2, won: 0, drawn: 2, lost: 0, goals_for: 1, goals_against: 1, goal_difference: 0, points: 2 },
      { team: { country: 'New Zealand', name: 'New Zealand', code: 'NZL' }, played: 2, won: 0, drawn: 1, lost: 1, goals_for: 3, goals_against: 5, goal_difference: -2, points: 1 },
    ],
  },
  {
    letter: 'H',
    teams: [
      { team: { country: 'Spain', name: 'Spain', code: 'ESP' }, played: 2, won: 1, drawn: 1, lost: 0, goals_for: 4, goals_against: 0, goal_difference: 4, points: 4 },
      { team: { country: 'Uruguay', name: 'Uruguay', code: 'URU' }, played: 2, won: 0, drawn: 2, lost: 0, goals_for: 3, goals_against: 3, goal_difference: 0, points: 2 },
      { team: { country: 'Cape Verde', name: 'Cape Verde', code: 'CPV' }, played: 2, won: 0, drawn: 2, lost: 0, goals_for: 2, goals_against: 2, goal_difference: 0, points: 2 },
      { team: { country: 'Saudi Arabia', name: 'Saudi Arabia', code: 'KSA' }, played: 2, won: 0, drawn: 1, lost: 1, goals_for: 1, goals_against: 5, goal_difference: -4, points: 1 },
    ],
  },
  {
    letter: 'I',
    teams: [
      { team: { country: 'France', name: 'France', code: 'FRA' }, played: 1, won: 1, drawn: 0, lost: 0, goals_for: 3, goals_against: 1, goal_difference: 2, points: 3 },
      { team: { country: 'Norway', name: 'Norway', code: 'NOR' }, played: 1, won: 1, drawn: 0, lost: 0, goals_for: 4, goals_against: 1, goal_difference: 3, points: 3 },
      { team: { country: 'Senegal', name: 'Senegal', code: 'SEN' }, played: 1, won: 0, drawn: 0, lost: 1, goals_for: 1, goals_against: 3, goal_difference: -2, points: 0 },
      { team: { country: 'Iraq', name: 'Iraq', code: 'IRQ' }, played: 1, won: 0, drawn: 0, lost: 1, goals_for: 1, goals_against: 4, goal_difference: -3, points: 0 },
    ],
  },
  {
    letter: 'J',
    teams: [
      { team: { country: 'Argentina', name: 'Argentina', code: 'ARG' }, played: 1, won: 1, drawn: 0, lost: 0, goals_for: 3, goals_against: 0, goal_difference: 3, points: 3 },
      { team: { country: 'Austria', name: 'Austria', code: 'AUT' }, played: 1, won: 1, drawn: 0, lost: 0, goals_for: 3, goals_against: 1, goal_difference: 2, points: 3 },
      { team: { country: 'Jordan', name: 'Jordan', code: 'JOR' }, played: 1, won: 0, drawn: 0, lost: 1, goals_for: 1, goals_against: 3, goal_difference: -2, points: 0 },
      { team: { country: 'Algeria', name: 'Algeria', code: 'ALG' }, played: 1, won: 0, drawn: 0, lost: 1, goals_for: 0, goals_against: 3, goal_difference: -3, points: 0 },
    ],
  },
  {
    letter: 'K',
    teams: [
      { team: { country: 'Colombia', name: 'Colombia', code: 'COL' }, played: 1, won: 1, drawn: 0, lost: 0, goals_for: 3, goals_against: 1, goal_difference: 2, points: 3 },
      { team: { country: 'Portugal', name: 'Portugal', code: 'POR' }, played: 1, won: 0, drawn: 1, lost: 0, goals_for: 1, goals_against: 1, goal_difference: 0, points: 1 },
      { team: { country: 'DR Congo', name: 'DR Congo', code: 'COD' }, played: 1, won: 0, drawn: 1, lost: 0, goals_for: 1, goals_against: 1, goal_difference: 0, points: 1 },
      { team: { country: 'Uzbekistan', name: 'Uzbekistan', code: 'UZB' }, played: 1, won: 0, drawn: 0, lost: 1, goals_for: 1, goals_against: 3, goal_difference: -2, points: 0 },
    ],
  },
  {
    letter: 'L',
    teams: [
      { team: { country: 'England', name: 'England', code: 'ENG' }, played: 1, won: 1, drawn: 0, lost: 0, goals_for: 4, goals_against: 2, goal_difference: 2, points: 3 },
      { team: { country: 'Ghana', name: 'Ghana', code: 'GHA' }, played: 1, won: 1, drawn: 0, lost: 0, goals_for: 1, goals_against: 0, goal_difference: 1, points: 3 },
      { team: { country: 'Panama', name: 'Panama', code: 'PAN' }, played: 1, won: 0, drawn: 0, lost: 1, goals_for: 0, goals_against: 1, goal_difference: -1, points: 0 },
      { team: { country: 'Croatia', name: 'Croatia', code: 'CRO' }, played: 1, won: 0, drawn: 0, lost: 1, goals_for: 2, goals_against: 4, goal_difference: -2, points: 0 },
    ],
  },
];

// Real completed + today's matches (June 22, 2026)
const MATCHES: Match[] = [
  // Today — June 22 (ET times → UTC)
  {
    id: 100,
    venue: 'AT&T Stadium',
    location: 'Dallas, USA',
    datetime: '2026-06-22T14:00:00Z', // 10 AM ET = 17:00 Israel
    status: 'future_scheduled',
    stage_name: 'Group J - Matchday 2',
    home_team: { country: 'Argentina', name: 'Argentina', code: 'ARG', goals: null },
    away_team: { country: 'Austria', name: 'Austria', code: 'AUT', goals: null },
    group: 'J',
  },
  {
    id: 105,
    venue: 'Lincoln Financial Field',
    location: 'Philadelphia, USA',
    datetime: '2026-06-22T18:00:00Z', // 2 PM ET = 21:00 Israel
    status: 'future_scheduled',
    stage_name: 'Group I - Matchday 2',
    home_team: { country: 'France', name: 'France', code: 'FRA', goals: null },
    away_team: { country: 'Iraq', name: 'Iraq', code: 'IRQ', goals: null },
    group: 'I',
  },
  {
    id: 106,
    venue: 'MetLife Stadium',
    location: 'East Rutherford, USA',
    datetime: '2026-06-22T21:00:00Z', // 5 PM ET = 00:00 Israel Jun 23
    status: 'future_scheduled',
    stage_name: 'Group I - Matchday 2',
    home_team: { country: 'Norway', name: 'Norway', code: 'NOR', goals: null },
    away_team: { country: 'Senegal', name: 'Senegal', code: 'SEN', goals: null },
    group: 'I',
  },
  {
    id: 107,
    venue: "Levi's Stadium",
    location: 'Santa Clara, USA',
    datetime: '2026-06-23T00:00:00Z', // 8 PM ET = 03:00 Israel Jun 23
    status: 'future_scheduled',
    stage_name: 'Group J - Matchday 2',
    home_team: { country: 'Jordan', name: 'Jordan', code: 'JOR', goals: null },
    away_team: { country: 'Algeria', name: 'Algeria', code: 'ALG', goals: null },
    group: 'J',
  },
  // June 21 results (yesterday in Israel)
  {
    id: 91,
    venue: 'Estadio Monterrey',
    location: 'Monterrey, Mexico',
    datetime: '2026-06-21T14:00:00Z', // 10 AM ET = 17:00 Israel
    status: 'completed',
    stage_name: 'Group F - Matchday 2',
    home_team: { country: 'Tunisia', name: 'Tunisia', code: 'TUN', goals: 0 },
    away_team: { country: 'Japan', name: 'Japan', code: 'JPN', goals: 4 },
    group: 'F',
  },
  {
    id: 101,
    venue: 'Mercedes-Benz Stadium',
    location: 'Atlanta, USA',
    datetime: '2026-06-21T16:00:00Z', // 12 PM ET = 19:00 Israel
    status: 'completed',
    stage_name: 'Group H - Matchday 2',
    home_team: { country: 'Spain', name: 'Spain', code: 'ESP', goals: 4 },
    away_team: { country: 'Saudi Arabia', name: 'Saudi Arabia', code: 'KSA', goals: 0 },
    group: 'H',
  },
  {
    id: 102,
    venue: 'SoFi Stadium',
    location: 'Inglewood, USA',
    datetime: '2026-06-21T19:00:00Z', // 3 PM ET = 22:00 Israel
    status: 'completed',
    stage_name: 'Group G - Matchday 2',
    home_team: { country: 'Belgium', name: 'Belgium', code: 'BEL', goals: 0 },
    away_team: { country: 'Iran', name: 'Iran', code: 'IRN', goals: 0 },
    group: 'G',
  },
  {
    id: 103,
    venue: 'NRG Stadium',
    location: 'Houston, USA',
    datetime: '2026-06-21T22:00:00Z', // 6 PM ET = 01:00 Israel Mon
    status: 'completed',
    stage_name: 'Group H - Matchday 2',
    home_team: { country: 'Uruguay', name: 'Uruguay', code: 'URU', goals: 2 },
    away_team: { country: 'Cape Verde', name: 'Cape Verde', code: 'CPV', goals: 2 },
    group: 'H',
  },
  {
    id: 104,
    venue: 'BC Place',
    location: 'Vancouver, Canada',
    datetime: '2026-06-22T01:00:00Z', // 9 PM ET = 04:00 Israel Mon
    status: 'completed',
    stage_name: 'Group G - Matchday 2',
    home_team: { country: 'Egypt', name: 'Egypt', code: 'EGY', goals: 3 },
    away_team: { country: 'New Zealand', name: 'New Zealand', code: 'NZL', goals: 1 },
    group: 'G',
  },
  // Upcoming matches — June 23
  {
    id: 110,
    venue: 'NRG Stadium',
    location: 'Houston, USA',
    datetime: '2026-06-23T14:00:00Z',
    status: 'future_scheduled',
    stage_name: 'Group K - Matchday 2',
    home_team: { country: 'Portugal', name: 'Portugal', code: 'POR', goals: null },
    away_team: { country: 'Uzbekistan', name: 'Uzbekistan', code: 'UZB', goals: null },
    group: 'K',
  },
  {
    id: 111,
    venue: 'Gillette Stadium',
    location: 'Foxborough, USA',
    datetime: '2026-06-23T17:00:00Z',
    status: 'future_scheduled',
    stage_name: 'Group L - Matchday 2',
    home_team: { country: 'England', name: 'England', code: 'ENG', goals: null },
    away_team: { country: 'Ghana', name: 'Ghana', code: 'GHA', goals: null },
    group: 'L',
  },
  {
    id: 112,
    venue: 'BMO Field',
    location: 'Toronto, Canada',
    datetime: '2026-06-23T20:00:00Z',
    status: 'future_scheduled',
    stage_name: 'Group L - Matchday 2',
    home_team: { country: 'Panama', name: 'Panama', code: 'PAN', goals: null },
    away_team: { country: 'Croatia', name: 'Croatia', code: 'CRO', goals: null },
    group: 'L',
  },
  {
    id: 113,
    venue: 'Estadio Akron',
    location: 'Guadalajara, Mexico',
    datetime: '2026-06-23T23:00:00Z',
    status: 'future_scheduled',
    stage_name: 'Group K - Matchday 2',
    home_team: { country: 'Colombia', name: 'Colombia', code: 'COL', goals: null },
    away_team: { country: 'DR Congo', name: 'DR Congo', code: 'COD', goals: null },
    group: 'K',
  },
  // Upcoming — June 24
  {
    id: 120,
    venue: 'Lumen Field',
    location: 'Seattle, USA',
    datetime: '2026-06-24T16:00:00Z',
    status: 'future_scheduled',
    stage_name: 'Group B - Matchday 3',
    home_team: { country: 'Bosnia & Herzegovina', name: 'Bosnia & Herzegovina', code: 'BIH', goals: null },
    away_team: { country: 'Qatar', name: 'Qatar', code: 'QAT', goals: null },
    group: 'B',
  },
  {
    id: 121,
    venue: 'BC Place',
    location: 'Vancouver, Canada',
    datetime: '2026-06-24T16:00:00Z',
    status: 'future_scheduled',
    stage_name: 'Group B - Matchday 3',
    home_team: { country: 'Switzerland', name: 'Switzerland', code: 'SUI', goals: null },
    away_team: { country: 'Canada', name: 'Canada', code: 'CAN', goals: null },
    group: 'B',
  },
  {
    id: 122,
    venue: 'Mercedes-Benz Stadium',
    location: 'Atlanta, USA',
    datetime: '2026-06-24T19:00:00Z',
    status: 'future_scheduled',
    stage_name: 'Group C - Matchday 3',
    home_team: { country: 'Morocco', name: 'Morocco', code: 'MAR', goals: null },
    away_team: { country: 'Haiti', name: 'Haiti', code: 'HAI', goals: null },
    group: 'C',
  },
  {
    id: 123,
    venue: 'Hard Rock Stadium',
    location: 'Miami, USA',
    datetime: '2026-06-24T19:00:00Z',
    status: 'future_scheduled',
    stage_name: 'Group C - Matchday 3',
    home_team: { country: 'Scotland', name: 'Scotland', code: 'SCO', goals: null },
    away_team: { country: 'Brazil', name: 'Brazil', code: 'BRA', goals: null },
    group: 'C',
  },
  {
    id: 124,
    venue: 'Estadio Banorte',
    location: 'Monterrey, Mexico',
    datetime: '2026-06-24T22:00:00Z',
    status: 'future_scheduled',
    stage_name: 'Group A - Matchday 3',
    home_team: { country: 'Czechia', name: 'Czechia', code: 'CZE', goals: null },
    away_team: { country: 'Mexico', name: 'Mexico', code: 'MEX', goals: null },
    group: 'A',
  },
  {
    id: 125,
    venue: 'Estadio BBVA',
    location: 'Guadalupe, Mexico',
    datetime: '2026-06-24T22:00:00Z',
    status: 'future_scheduled',
    stage_name: 'Group A - Matchday 3',
    home_team: { country: 'South Africa', name: 'South Africa', code: 'RSA', goals: null },
    away_team: { country: 'South Korea', name: 'South Korea', code: 'KOR', goals: null },
    group: 'A',
  },
  // Upcoming — June 25
  {
    id: 130,
    venue: 'Lincoln Financial Field',
    location: 'Philadelphia, USA',
    datetime: '2026-06-25T17:00:00Z',
    status: 'future_scheduled',
    stage_name: 'Group E - Matchday 3',
    home_team: { country: 'Curaçao', name: 'Curaçao', code: 'CUW', goals: null },
    away_team: { country: "Côte d'Ivoire", name: "Côte d'Ivoire", code: 'CIV', goals: null },
    group: 'E',
  },
  {
    id: 131,
    venue: 'MetLife Stadium',
    location: 'East Rutherford, USA',
    datetime: '2026-06-25T17:00:00Z',
    status: 'future_scheduled',
    stage_name: 'Group E - Matchday 3',
    home_team: { country: 'Ecuador', name: 'Ecuador', code: 'ECU', goals: null },
    away_team: { country: 'Germany', name: 'Germany', code: 'GER', goals: null },
    group: 'E',
  },
  {
    id: 132,
    venue: 'AT&T Stadium',
    location: 'Arlington, USA',
    datetime: '2026-06-25T20:00:00Z',
    status: 'future_scheduled',
    stage_name: 'Group F - Matchday 3',
    home_team: { country: 'Japan', name: 'Japan', code: 'JPN', goals: null },
    away_team: { country: 'Sweden', name: 'Sweden', code: 'SWE', goals: null },
    group: 'F',
  },
  {
    id: 133,
    venue: 'GEHA Field',
    location: 'Kansas City, USA',
    datetime: '2026-06-25T20:00:00Z',
    status: 'future_scheduled',
    stage_name: 'Group F - Matchday 3',
    home_team: { country: 'Tunisia', name: 'Tunisia', code: 'TUN', goals: null },
    away_team: { country: 'Netherlands', name: 'Netherlands', code: 'NED', goals: null },
    group: 'F',
  },
  {
    id: 134,
    venue: "Levi's Stadium",
    location: 'Santa Clara, USA',
    datetime: '2026-06-25T23:00:00Z',
    status: 'future_scheduled',
    stage_name: 'Group D - Matchday 3',
    home_team: { country: 'Paraguay', name: 'Paraguay', code: 'PAR', goals: null },
    away_team: { country: 'Australia', name: 'Australia', code: 'AUS', goals: null },
    group: 'D',
  },
  {
    id: 135,
    venue: 'SoFi Stadium',
    location: 'Inglewood, USA',
    datetime: '2026-06-25T23:00:00Z',
    status: 'future_scheduled',
    stage_name: 'Group D - Matchday 3',
    home_team: { country: 'Türkiye', name: 'Türkiye', code: 'TUR', goals: null },
    away_team: { country: 'United States', name: 'United States', code: 'USA', goals: null },
    group: 'D',
  },
  // June 20 results
  {
    id: 50,
    venue: 'AT&T Stadium',
    location: 'Dallas, USA',
    datetime: '2026-06-20T14:00:00Z', // 10 AM ET = 17:00 Israel
    status: 'completed',
    stage_name: 'Group F - Matchday 2',
    home_team: { country: 'Netherlands', name: 'Netherlands', code: 'NED', goals: 5 },
    away_team: { country: 'Sweden', name: 'Sweden', code: 'SWE', goals: 1 },
    group: 'F',
  },
  {
    id: 51,
    venue: 'Lincoln Financial Field',
    location: 'Philadelphia, USA',
    datetime: '2026-06-20T17:00:00Z', // 1 PM ET = 20:00 Israel
    status: 'completed',
    stage_name: 'Group E - Matchday 2',
    home_team: { country: 'Germany', name: 'Germany', code: 'GER', goals: 2 },
    away_team: { country: "Côte d'Ivoire", name: "Côte d'Ivoire", code: 'CIV', goals: 1 },
    group: 'E',
  },
  {
    id: 52,
    venue: 'MetLife Stadium',
    location: 'East Rutherford, USA',
    datetime: '2026-06-20T20:00:00Z', // 4 PM ET = 23:00 Israel
    status: 'completed',
    stage_name: 'Group E - Matchday 2',
    home_team: { country: 'Ecuador', name: 'Ecuador', code: 'ECU', goals: 0 },
    away_team: { country: 'Curaçao', name: 'Curaçao', code: 'CUW', goals: 0 },
    group: 'E',
  },
  {
    id: 40,
    venue: 'NRG Stadium',
    location: 'Houston, USA',
    datetime: '2026-06-19T19:00:00Z',
    status: 'completed',
    stage_name: 'Group D - Matchday 2',
    home_team: { country: 'United States', name: 'United States', code: 'USA', goals: 2 },
    away_team: { country: 'Australia', name: 'Australia', code: 'AUS', goals: 0 },
    group: 'D',
  },
  {
    id: 41,
    venue: 'Gillette Stadium',
    location: 'Foxborough, USA',
    datetime: '2026-06-19T22:00:00Z',
    status: 'completed',
    stage_name: 'Group C - Matchday 2',
    home_team: { country: 'Brazil', name: 'Brazil', code: 'BRA', goals: 3 },
    away_team: { country: 'Haiti', name: 'Haiti', code: 'HAI', goals: 0 },
    group: 'C',
  },
  {
    id: 30,
    venue: 'BMO Field',
    location: 'Toronto, Canada',
    datetime: '2026-06-18T19:00:00Z',
    status: 'completed',
    stage_name: 'Group B - Matchday 2',
    home_team: { country: 'Canada', name: 'Canada', code: 'CAN', goals: 6 },
    away_team: { country: 'Qatar', name: 'Qatar', code: 'QAT', goals: 0 },
    group: 'B',
  },
  {
    id: 20,
    venue: 'Lumen Field',
    location: 'Seattle, USA',
    datetime: '2026-06-17T19:00:00Z',
    status: 'completed',
    stage_name: 'Group L - Matchday 1',
    home_team: { country: 'England', name: 'England', code: 'ENG', goals: 4 },
    away_team: { country: 'Croatia', name: 'Croatia', code: 'CRO', goals: 2 },
    group: 'L',
  },
  {
    id: 21,
    venue: 'Mercedes-Benz Stadium',
    location: 'Atlanta, USA',
    datetime: '2026-06-17T22:00:00Z',
    status: 'completed',
    stage_name: 'Group K - Matchday 1',
    home_team: { country: 'Uzbekistan', name: 'Uzbekistan', code: 'UZB', goals: 1 },
    away_team: { country: 'Colombia', name: 'Colombia', code: 'COL', goals: 3 },
    group: 'K',
  },
  {
    id: 10,
    venue: 'Estadio Azteca',
    location: 'Mexico City, Mexico',
    datetime: '2026-06-16T19:00:00Z',
    status: 'completed',
    stage_name: 'Group J - Matchday 1',
    home_team: { country: 'Argentina', name: 'Argentina', code: 'ARG', goals: 3 },
    away_team: { country: 'Algeria', name: 'Algeria', code: 'ALG', goals: 0 },
    group: 'J',
  },
  {
    id: 11,
    venue: 'Rose Bowl',
    location: 'Pasadena, USA',
    datetime: '2026-06-16T22:00:00Z',
    status: 'completed',
    stage_name: 'Group I - Matchday 1',
    home_team: { country: 'France', name: 'France', code: 'FRA', goals: 3 },
    away_team: { country: 'Senegal', name: 'Senegal', code: 'SEN', goals: 1 },
    group: 'I',
  },
  {
    id: 1,
    venue: 'Estadio Azteca',
    location: 'Mexico City, Mexico',
    datetime: '2026-06-11T18:00:00Z',
    status: 'completed',
    stage_name: 'Group A - Matchday 1',
    home_team: { country: 'Mexico', name: 'Mexico', code: 'MEX', goals: 2 },
    away_team: { country: 'South Africa', name: 'South Africa', code: 'RSA', goals: 0 },
    group: 'A',
  },
  {
    id: 2,
    venue: 'Rose Bowl',
    location: 'Pasadena, USA',
    datetime: '2026-06-12T18:00:00Z',
    status: 'completed',
    stage_name: 'Group D - Matchday 1',
    home_team: { country: 'United States', name: 'United States', code: 'USA', goals: 4 },
    away_team: { country: 'Paraguay', name: 'Paraguay', code: 'PAR', goals: 1 },
    group: 'D',
  },
];

export async function fetchCurrentMatches(): Promise<Match[]> {
  await new Promise((r) => setTimeout(r, 200));
  return MATCHES.filter((m) => m.status === 'in_progress');
}

function getIsraelDateString(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });
}

export async function fetchTodayMatches(): Promise<Match[]> {
  await new Promise((r) => setTimeout(r, 200));
  const todayISR = getIsraelDateString(new Date());
  return MATCHES.filter((m) => {
    const matchDateISR = getIsraelDateString(new Date(m.datetime));
    return matchDateISR === todayISR && m.status === 'completed';
  });
}

export async function fetchAllMatches(): Promise<Match[]> {
  await new Promise((r) => setTimeout(r, 300));
  return MATCHES.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
}

export async function fetchYesterdayMatches(): Promise<Match[]> {
  await new Promise((r) => setTimeout(r, 200));
  const yesterday = new Date(Date.now() - 86400000);
  const yesterdayISR = getIsraelDateString(yesterday);
  return MATCHES.filter((m) => {
    const matchDateISR = getIsraelDateString(new Date(m.datetime));
    return matchDateISR === yesterdayISR && m.status === 'completed';
  });
}

export async function fetchGroups(): Promise<Group[]> {
  await new Promise((r) => setTimeout(r, 200));
  return GROUPS;
}

