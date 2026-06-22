import { Match, Group } from './types';

// All datetime values are UTC. Israel (IDT) = UTC+3.
// To get UTC from Israel time: subtract 3 hours.

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

// Israel time (IL) = UTC + 3. UTC = IL - 3h.
// Matches stored as UTC. Comments show Israel local time.
const MATCHES: Match[] = [
  // ── June 22 (Mon) Israel ──
  { id: 200, venue: 'Dallas Stadium', location: 'Dallas, USA', datetime: '2026-06-22T17:00:00Z', status: 'future_scheduled', stage_name: 'Group J - MD2', home_team: { country: 'Argentina', name: 'Argentina', code: 'ARG', goals: null }, away_team: { country: 'Austria', name: 'Austria', code: 'AUT', goals: null }, group: 'J' }, // 20:00 IL ✓
  { id: 201, venue: 'Philadelphia Stadium', location: 'Philadelphia, USA', datetime: '2026-06-22T21:00:00Z', status: 'future_scheduled', stage_name: 'Group I - MD2', home_team: { country: 'France', name: 'France', code: 'FRA', goals: null }, away_team: { country: 'Iraq', name: 'Iraq', code: 'IRQ', goals: null }, group: 'I' }, // 00:00 IL Tue
  { id: 202, venue: 'New York/New Jersey Stadium', location: 'New Jersey, USA', datetime: '2026-06-23T00:00:00Z', status: 'future_scheduled', stage_name: 'Group I - MD2', home_team: { country: 'Norway', name: 'Norway', code: 'NOR', goals: null }, away_team: { country: 'Senegal', name: 'Senegal', code: 'SEN', goals: null }, group: 'I' }, // 03:00 IL Tue
  { id: 203, venue: 'San Francisco Bay Area Stadium', location: 'San Francisco, USA', datetime: '2026-06-23T03:00:00Z', status: 'future_scheduled', stage_name: 'Group J - MD2', home_team: { country: 'Jordan', name: 'Jordan', code: 'JOR', goals: null }, away_team: { country: 'Algeria', name: 'Algeria', code: 'ALG', goals: null }, group: 'J' }, // 06:00 IL Tue

  // ── June 21 (Sun) Israel — yesterday ──
  { id: 150, venue: 'Estadio Monterrey', location: 'Monterrey, Mexico', datetime: '2026-06-21T13:00:00Z', status: 'completed', stage_name: 'Group F - MD2', home_team: { country: 'Tunisia', name: 'Tunisia', code: 'TUN', goals: 0 }, away_team: { country: 'Japan', name: 'Japan', code: 'JPN', goals: 4 }, group: 'F' }, // 16:00 IL
  { id: 151, venue: 'Mercedes-Benz Stadium', location: 'Atlanta, USA', datetime: '2026-06-21T16:00:00Z', status: 'completed', stage_name: 'Group H - MD2', home_team: { country: 'Spain', name: 'Spain', code: 'ESP', goals: 4 }, away_team: { country: 'Saudi Arabia', name: 'Saudi Arabia', code: 'KSA', goals: 0 }, group: 'H' }, // 19:00 IL ✓
  { id: 152, venue: 'SoFi Stadium', location: 'Inglewood, USA', datetime: '2026-06-21T19:00:00Z', status: 'completed', stage_name: 'Group G - MD2', home_team: { country: 'Belgium', name: 'Belgium', code: 'BEL', goals: 0 }, away_team: { country: 'Iran', name: 'Iran', code: 'IRN', goals: 0 }, group: 'G' }, // 22:00 IL ✓
  { id: 153, venue: 'NRG Stadium', location: 'Houston, USA', datetime: '2026-06-21T22:00:00Z', status: 'completed', stage_name: 'Group H - MD2', home_team: { country: 'Uruguay', name: 'Uruguay', code: 'URU', goals: 2 }, away_team: { country: 'Cape Verde', name: 'Cape Verde', code: 'CPV', goals: 2 }, group: 'H' }, // 01:00 IL Mon ✓
  { id: 154, venue: 'BC Place', location: 'Vancouver, Canada', datetime: '2026-06-22T01:00:00Z', status: 'completed', stage_name: 'Group G - MD2', home_team: { country: 'Egypt', name: 'Egypt', code: 'EGY', goals: 3 }, away_team: { country: 'New Zealand', name: 'New Zealand', code: 'NZL', goals: 1 }, group: 'G' }, // 04:00 IL Mon ✓

  // ── June 20 (Sat) Israel ──
  { id: 140, venue: 'AT&T Stadium', location: 'Dallas, USA', datetime: '2026-06-20T17:00:00Z', status: 'completed', stage_name: 'Group F - MD2', home_team: { country: 'Netherlands', name: 'Netherlands', code: 'NED', goals: 5 }, away_team: { country: 'Sweden', name: 'Sweden', code: 'SWE', goals: 1 }, group: 'F' }, // 20:00 IL
  { id: 141, venue: 'Lincoln Financial Field', location: 'Philadelphia, USA', datetime: '2026-06-20T20:00:00Z', status: 'completed', stage_name: 'Group E - MD2', home_team: { country: 'Germany', name: 'Germany', code: 'GER', goals: 2 }, away_team: { country: "Côte d'Ivoire", name: "Côte d'Ivoire", code: 'CIV', goals: 1 }, group: 'E' }, // 23:00 IL
  { id: 142, venue: 'MetLife Stadium', location: 'East Rutherford, USA', datetime: '2026-06-20T23:00:00Z', status: 'completed', stage_name: 'Group E - MD2', home_team: { country: 'Ecuador', name: 'Ecuador', code: 'ECU', goals: 0 }, away_team: { country: 'Curaçao', name: 'Curaçao', code: 'CUW', goals: 0 }, group: 'E' }, // 02:00 IL Sun

  // ── June 19 (Fri) Israel ──
  { id: 130, venue: 'Lumen Field', location: 'Seattle, USA', datetime: '2026-06-19T18:00:00Z', status: 'completed', stage_name: 'Group D - MD2', home_team: { country: 'United States', name: 'United States', code: 'USA', goals: 2 }, away_team: { country: 'Australia', name: 'Australia', code: 'AUS', goals: 0 }, group: 'D' }, // 21:00 IL
  { id: 131, venue: 'Gillette Stadium', location: 'Foxborough, USA', datetime: '2026-06-19T21:00:00Z', status: 'completed', stage_name: 'Group C - MD2', home_team: { country: 'Scotland', name: 'Scotland', code: 'SCO', goals: 0 }, away_team: { country: 'Morocco', name: 'Morocco', code: 'MAR', goals: 1 }, group: 'C' }, // 00:00 IL Sat
  { id: 132, venue: 'Hard Rock Stadium', location: 'Miami, USA', datetime: '2026-06-20T00:00:00Z', status: 'completed', stage_name: 'Group C - MD2', home_team: { country: 'Brazil', name: 'Brazil', code: 'BRA', goals: 3 }, away_team: { country: 'Haiti', name: 'Haiti', code: 'HAI', goals: 0 }, group: 'C' }, // 03:00 IL Sat
  { id: 133, venue: "Levi's Stadium", location: 'Santa Clara, USA', datetime: '2026-06-20T03:00:00Z', status: 'completed', stage_name: 'Group D - MD2', home_team: { country: 'Türkiye', name: 'Türkiye', code: 'TUR', goals: 0 }, away_team: { country: 'Paraguay', name: 'Paraguay', code: 'PAR', goals: 1 }, group: 'D' }, // 06:00 IL Sat

  // ── June 18 (Thu) Israel ──
  { id: 120, venue: 'Mercedes-Benz Stadium', location: 'Atlanta, USA', datetime: '2026-06-18T15:00:00Z', status: 'completed', stage_name: 'Group A - MD2', home_team: { country: 'Czechia', name: 'Czechia', code: 'CZE', goals: 1 }, away_team: { country: 'South Africa', name: 'South Africa', code: 'RSA', goals: 1 }, group: 'A' }, // 18:00 IL
  { id: 121, venue: 'SoFi Stadium', location: 'Inglewood, USA', datetime: '2026-06-18T18:00:00Z', status: 'completed', stage_name: 'Group B - MD2', home_team: { country: 'Switzerland', name: 'Switzerland', code: 'SUI', goals: 4 }, away_team: { country: 'Bosnia & Herzegovina', name: 'Bosnia & Herzegovina', code: 'BIH', goals: 1 }, group: 'B' }, // 21:00 IL
  { id: 122, venue: 'BC Place', location: 'Vancouver, Canada', datetime: '2026-06-18T21:00:00Z', status: 'completed', stage_name: 'Group B - MD2', home_team: { country: 'Canada', name: 'Canada', code: 'CAN', goals: 6 }, away_team: { country: 'Qatar', name: 'Qatar', code: 'QAT', goals: 0 }, group: 'B' }, // 00:00 IL Fri
  { id: 123, venue: 'Estadio BBVA', location: 'Guadalupe, Mexico', datetime: '2026-06-19T00:00:00Z', status: 'completed', stage_name: 'Group A - MD2', home_team: { country: 'Mexico', name: 'Mexico', code: 'MEX', goals: 1 }, away_team: { country: 'South Korea', name: 'South Korea', code: 'KOR', goals: 0 }, group: 'A' }, // 03:00 IL Fri

  // ── June 17 (Wed) Israel ──
  { id: 110, venue: 'NRG Stadium', location: 'Houston, USA', datetime: '2026-06-17T16:00:00Z', status: 'completed', stage_name: 'Group K - MD1', home_team: { country: 'Portugal', name: 'Portugal', code: 'POR', goals: 1 }, away_team: { country: 'DR Congo', name: 'DR Congo', code: 'COD', goals: 1 }, group: 'K' }, // 19:00 IL
  { id: 111, venue: 'AT&T Stadium', location: 'Dallas, USA', datetime: '2026-06-17T19:00:00Z', status: 'completed', stage_name: 'Group L - MD1', home_team: { country: 'England', name: 'England', code: 'ENG', goals: 4 }, away_team: { country: 'Croatia', name: 'Croatia', code: 'CRO', goals: 2 }, group: 'L' }, // 22:00 IL
  { id: 112, venue: 'BMO Field', location: 'Toronto, Canada', datetime: '2026-06-17T22:00:00Z', status: 'completed', stage_name: 'Group L - MD1', home_team: { country: 'Ghana', name: 'Ghana', code: 'GHA', goals: 1 }, away_team: { country: 'Panama', name: 'Panama', code: 'PAN', goals: 0 }, group: 'L' }, // 01:00 IL Thu
  { id: 113, venue: 'Estadio Azteca', location: 'Mexico City, Mexico', datetime: '2026-06-18T01:00:00Z', status: 'completed', stage_name: 'Group K - MD1', home_team: { country: 'Uzbekistan', name: 'Uzbekistan', code: 'UZB', goals: 1 }, away_team: { country: 'Colombia', name: 'Colombia', code: 'COL', goals: 3 }, group: 'K' }, // 04:00 IL Thu

  // ── June 16 (Tue) Israel ──
  { id: 100, venue: 'MetLife Stadium', location: 'East Rutherford, USA', datetime: '2026-06-16T19:00:00Z', status: 'completed', stage_name: 'Group I - MD1', home_team: { country: 'France', name: 'France', code: 'FRA', goals: 3 }, away_team: { country: 'Senegal', name: 'Senegal', code: 'SEN', goals: 1 }, group: 'I' }, // 22:00 IL
  { id: 101, venue: 'Gillette Stadium', location: 'Foxborough, USA', datetime: '2026-06-16T22:00:00Z', status: 'completed', stage_name: 'Group I - MD1', home_team: { country: 'Iraq', name: 'Iraq', code: 'IRQ', goals: 1 }, away_team: { country: 'Norway', name: 'Norway', code: 'NOR', goals: 4 }, group: 'I' }, // 01:00 IL Wed
  { id: 102, venue: 'GEHA Field', location: 'Kansas City, USA', datetime: '2026-06-17T01:00:00Z', status: 'completed', stage_name: 'Group J - MD1', home_team: { country: 'Argentina', name: 'Argentina', code: 'ARG', goals: 3 }, away_team: { country: 'Algeria', name: 'Algeria', code: 'ALG', goals: 0 }, group: 'J' }, // 04:00 IL Wed
  { id: 103, venue: "Levi's Stadium", location: 'Santa Clara, USA', datetime: '2026-06-17T04:00:00Z', status: 'completed', stage_name: 'Group J - MD1', home_team: { country: 'Austria', name: 'Austria', code: 'AUT', goals: 3 }, away_team: { country: 'Jordan', name: 'Jordan', code: 'JOR', goals: 1 }, group: 'J' }, // 07:00 IL Wed

  // ── June 11-15 (earlier matchdays) ──
  { id: 1, venue: 'Estadio Azteca', location: 'Mexico City, Mexico', datetime: '2026-06-11T19:00:00Z', status: 'completed', stage_name: 'Group A - MD1', home_team: { country: 'Mexico', name: 'Mexico', code: 'MEX', goals: 2 }, away_team: { country: 'South Africa', name: 'South Africa', code: 'RSA', goals: 0 }, group: 'A' }, // 22:00 IL
  { id: 2, venue: 'Rose Bowl', location: 'Pasadena, USA', datetime: '2026-06-12T19:00:00Z', status: 'completed', stage_name: 'Group D - MD1', home_team: { country: 'United States', name: 'United States', code: 'USA', goals: 4 }, away_team: { country: 'Paraguay', name: 'Paraguay', code: 'PAR', goals: 1 }, group: 'D' }, // 22:00 IL
  { id: 3, venue: 'Hard Rock Stadium', location: 'Miami, USA', datetime: '2026-06-13T19:00:00Z', status: 'completed', stage_name: 'Group C - MD1', home_team: { country: 'Brazil', name: 'Brazil', code: 'BRA', goals: 1 }, away_team: { country: 'Morocco', name: 'Morocco', code: 'MAR', goals: 1 }, group: 'C' }, // 22:00 IL

  // ── Upcoming — June 23 (Tue) Israel ──
  { id: 300, venue: 'Houston Stadium', location: 'Houston, USA', datetime: '2026-06-23T17:00:00Z', status: 'future_scheduled', stage_name: 'Group K - MD2', home_team: { country: 'Portugal', name: 'Portugal', code: 'POR', goals: null }, away_team: { country: 'Uzbekistan', name: 'Uzbekistan', code: 'UZB', goals: null }, group: 'K' }, // 20:00 IL
  { id: 301, venue: 'Boston Stadium', location: 'Boston, USA', datetime: '2026-06-23T20:00:00Z', status: 'future_scheduled', stage_name: 'Group L - MD2', home_team: { country: 'England', name: 'England', code: 'ENG', goals: null }, away_team: { country: 'Ghana', name: 'Ghana', code: 'GHA', goals: null }, group: 'L' }, // 23:00 IL
  { id: 302, venue: 'Toronto Stadium', location: 'Toronto, Canada', datetime: '2026-06-23T23:00:00Z', status: 'future_scheduled', stage_name: 'Group L - MD2', home_team: { country: 'Panama', name: 'Panama', code: 'PAN', goals: null }, away_team: { country: 'Croatia', name: 'Croatia', code: 'CRO', goals: null }, group: 'L' }, // 02:00 IL Wed
  { id: 303, venue: 'Guadalajara Stadium', location: 'Guadalajara, Mexico', datetime: '2026-06-24T02:00:00Z', status: 'future_scheduled', stage_name: 'Group K - MD2', home_team: { country: 'Colombia', name: 'Colombia', code: 'COL', goals: null }, away_team: { country: 'DR Congo', name: 'DR Congo', code: 'COD', goals: null }, group: 'K' }, // 05:00 IL Wed

  // ── Upcoming — June 24 (Wed) Israel ──
  { id: 310, venue: 'BC Place Vancouver', location: 'Vancouver, Canada', datetime: '2026-06-24T19:00:00Z', status: 'future_scheduled', stage_name: 'Group B - MD3', home_team: { country: 'Switzerland', name: 'Switzerland', code: 'SUI', goals: null }, away_team: { country: 'Canada', name: 'Canada', code: 'CAN', goals: null }, group: 'B' }, // 22:00 IL
  { id: 311, venue: 'Seattle Stadium', location: 'Seattle, USA', datetime: '2026-06-24T19:00:00Z', status: 'future_scheduled', stage_name: 'Group B - MD3', home_team: { country: 'Bosnia & Herzegovina', name: 'Bosnia & Herzegovina', code: 'BIH', goals: null }, away_team: { country: 'Qatar', name: 'Qatar', code: 'QAT', goals: null }, group: 'B' }, // 22:00 IL
  { id: 312, venue: 'Miami Stadium', location: 'Miami, USA', datetime: '2026-06-24T22:00:00Z', status: 'future_scheduled', stage_name: 'Group C - MD3', home_team: { country: 'Scotland', name: 'Scotland', code: 'SCO', goals: null }, away_team: { country: 'Brazil', name: 'Brazil', code: 'BRA', goals: null }, group: 'C' }, // 01:00 IL Thu
  { id: 313, venue: 'Atlanta Stadium', location: 'Atlanta, USA', datetime: '2026-06-24T22:00:00Z', status: 'future_scheduled', stage_name: 'Group C - MD3', home_team: { country: 'Morocco', name: 'Morocco', code: 'MAR', goals: null }, away_team: { country: 'Haiti', name: 'Haiti', code: 'HAI', goals: null }, group: 'C' }, // 01:00 IL Thu
  { id: 314, venue: 'Mexico City Stadium', location: 'Mexico City, Mexico', datetime: '2026-06-25T01:00:00Z', status: 'future_scheduled', stage_name: 'Group A - MD3', home_team: { country: 'Czechia', name: 'Czechia', code: 'CZE', goals: null }, away_team: { country: 'Mexico', name: 'Mexico', code: 'MEX', goals: null }, group: 'A' }, // 04:00 IL Thu
  { id: 315, venue: 'Monterrey Stadium', location: 'Monterrey, Mexico', datetime: '2026-06-25T01:00:00Z', status: 'future_scheduled', stage_name: 'Group A - MD3', home_team: { country: 'South Africa', name: 'South Africa', code: 'RSA', goals: null }, away_team: { country: 'South Korea', name: 'South Korea', code: 'KOR', goals: null }, group: 'A' }, // 04:00 IL Thu

  // ── Upcoming — June 25 (Thu) Israel ──
  { id: 320, venue: 'Philadelphia Stadium', location: 'Philadelphia, USA', datetime: '2026-06-25T20:00:00Z', status: 'future_scheduled', stage_name: 'Group E - MD3', home_team: { country: 'Curaçao', name: 'Curaçao', code: 'CUW', goals: null }, away_team: { country: "Côte d'Ivoire", name: "Côte d'Ivoire", code: 'CIV', goals: null }, group: 'E' }, // 23:00 IL
  { id: 321, venue: 'New York/New Jersey Stadium', location: 'New Jersey, USA', datetime: '2026-06-25T20:00:00Z', status: 'future_scheduled', stage_name: 'Group E - MD3', home_team: { country: 'Ecuador', name: 'Ecuador', code: 'ECU', goals: null }, away_team: { country: 'Germany', name: 'Germany', code: 'GER', goals: null }, group: 'E' }, // 23:00 IL
  { id: 322, venue: 'Dallas Stadium', location: 'Dallas, USA', datetime: '2026-06-25T23:00:00Z', status: 'future_scheduled', stage_name: 'Group F - MD3', home_team: { country: 'Japan', name: 'Japan', code: 'JPN', goals: null }, away_team: { country: 'Sweden', name: 'Sweden', code: 'SWE', goals: null }, group: 'F' }, // 02:00 IL Fri
  { id: 323, venue: 'Kansas City Stadium', location: 'Kansas City, USA', datetime: '2026-06-25T23:00:00Z', status: 'future_scheduled', stage_name: 'Group F - MD3', home_team: { country: 'Tunisia', name: 'Tunisia', code: 'TUN', goals: null }, away_team: { country: 'Netherlands', name: 'Netherlands', code: 'NED', goals: null }, group: 'F' }, // 02:00 IL Fri
  { id: 324, venue: 'San Francisco Bay Area Stadium', location: 'San Francisco, USA', datetime: '2026-06-26T02:00:00Z', status: 'future_scheduled', stage_name: 'Group D - MD3', home_team: { country: 'Paraguay', name: 'Paraguay', code: 'PAR', goals: null }, away_team: { country: 'Australia', name: 'Australia', code: 'AUS', goals: null }, group: 'D' }, // 05:00 IL Fri
  { id: 325, venue: 'Los Angeles Stadium', location: 'Los Angeles, USA', datetime: '2026-06-26T02:00:00Z', status: 'future_scheduled', stage_name: 'Group D - MD3', home_team: { country: 'Türkiye', name: 'Türkiye', code: 'TUR', goals: null }, away_team: { country: 'United States', name: 'United States', code: 'USA', goals: null }, group: 'D' }, // 05:00 IL Fri
];

function getIsraelDateString(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });
}

export async function fetchCurrentMatches(): Promise<Match[]> {
  return MATCHES.filter((m) => m.status === 'in_progress');
}

export async function fetchTodayMatches(): Promise<Match[]> {
  const todayISR = getIsraelDateString(new Date());
  return MATCHES.filter((m) => {
    const matchDateISR = getIsraelDateString(new Date(m.datetime));
    return matchDateISR === todayISR && m.status === 'completed';
  });
}

export async function fetchYesterdayMatches(): Promise<Match[]> {
  const yesterday = new Date(Date.now() - 86400000);
  const yesterdayISR = getIsraelDateString(yesterday);
  return MATCHES.filter((m) => {
    const matchDateISR = getIsraelDateString(new Date(m.datetime));
    return matchDateISR === yesterdayISR && m.status === 'completed';
  });
}

export async function fetchAllMatches(): Promise<Match[]> {
  return [...MATCHES].sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
}

export async function fetchGroups(): Promise<Group[]> {
  return GROUPS;
}
