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
  // GROUP STAGE — MATCHDAY 1
  { id: 1, venue: 'Mexico City Stadium', location: 'Mexico City, Mexico', datetime: '2026-06-11T19:00:00Z', status: 'completed', stage_name: 'Group A - MD1', home_team: { country: 'Mexico', name: 'Mexico', code: 'MEX', goals: 2 }, away_team: { country: 'South Africa', name: 'South Africa', code: 'RSA', goals: 0 }, group: 'A' },
  { id: 2, venue: 'Guadalajara Stadium', location: 'Guadalajara, Mexico', datetime: '2026-06-12T16:00:00Z', status: 'completed', stage_name: 'Group A - MD1', home_team: { country: 'Korea Republic', name: 'Korea Republic', code: 'KOR', goals: 2 }, away_team: { country: 'Czechia', name: 'Czechia', code: 'CZE', goals: 1 }, group: 'A' },
  { id: 3, venue: 'Toronto Stadium', location: 'Toronto, Canada', datetime: '2026-06-12T22:00:00Z', status: 'completed', stage_name: 'Group B - MD1', home_team: { country: 'Canada', name: 'Canada', code: 'CAN', goals: 1 }, away_team: { country: 'Bosnia and Herzegovina', name: 'Bosnia and Herzegovina', code: 'BIH', goals: 1 }, group: 'B' },
  { id: 4, venue: 'Los Angeles Stadium', location: 'Los Angeles, USA', datetime: '2026-06-13T16:00:00Z', status: 'completed', stage_name: 'Group D - MD1', home_team: { country: 'United States', name: 'United States', code: 'USA', goals: 4 }, away_team: { country: 'Paraguay', name: 'Paraguay', code: 'PAR', goals: 1 }, group: 'D' },
  { id: 5, venue: 'San Francisco Bay Area Stadium', location: 'San Francisco, USA', datetime: '2026-06-13T22:00:00Z', status: 'completed', stage_name: 'Group B - MD1', home_team: { country: 'Qatar', name: 'Qatar', code: 'QAT', goals: 1 }, away_team: { country: 'Switzerland', name: 'Switzerland', code: 'SUI', goals: 1 }, group: 'B' },
  { id: 6, venue: 'New York/New Jersey Stadium', location: 'New Jersey, USA', datetime: '2026-06-14T13:00:00Z', status: 'completed', stage_name: 'Group C - MD1', home_team: { country: 'Brazil', name: 'Brazil', code: 'BRA', goals: 1 }, away_team: { country: 'Morocco', name: 'Morocco', code: 'MAR', goals: 1 }, group: 'C' },
  { id: 7, venue: 'Boston Stadium', location: 'Boston, USA', datetime: '2026-06-14T16:00:00Z', status: 'completed', stage_name: 'Group C - MD1', home_team: { country: 'Haiti', name: 'Haiti', code: 'HAI', goals: 0 }, away_team: { country: 'Scotland', name: 'Scotland', code: 'SCO', goals: 1 }, group: 'C' },
  { id: 8, venue: 'BC Place Vancouver', location: 'Vancouver, Canada', datetime: '2026-06-14T19:00:00Z', status: 'completed', stage_name: 'Group D - MD1', home_team: { country: 'Australia', name: 'Australia', code: 'AUS', goals: 2 }, away_team: { country: 'Türkiye', name: 'Türkiye', code: 'TUR', goals: 0 }, group: 'D' },
  { id: 9, venue: 'Houston Stadium', location: 'Houston, USA', datetime: '2026-06-14T22:00:00Z', status: 'completed', stage_name: 'Group E - MD1', home_team: { country: 'Germany', name: 'Germany', code: 'GER', goals: 7 }, away_team: { country: 'Curaçao', name: 'Curaçao', code: 'CUW', goals: 1 }, group: 'E' },
  { id: 10, venue: 'Dallas Stadium', location: 'Dallas, USA', datetime: '2026-06-15T01:00:00Z', status: 'completed', stage_name: 'Group F - MD1', home_team: { country: 'Netherlands', name: 'Netherlands', code: 'NED', goals: 2 }, away_team: { country: 'Japan', name: 'Japan', code: 'JPN', goals: 2 }, group: 'F' },
  { id: 11, venue: 'Philadelphia Stadium', location: 'Philadelphia, USA', datetime: '2026-06-15T13:00:00Z', status: 'completed', stage_name: 'Group E - MD1', home_team: { country: "Côte d'Ivoire", name: "Côte d'Ivoire", code: 'CIV', goals: 1 }, away_team: { country: 'Ecuador', name: 'Ecuador', code: 'ECU', goals: 0 }, group: 'E' },
  { id: 12, venue: 'Monterrey Stadium', location: 'Monterrey, Mexico', datetime: '2026-06-15T16:00:00Z', status: 'completed', stage_name: 'Group F - MD1', home_team: { country: 'Sweden', name: 'Sweden', code: 'SWE', goals: 5 }, away_team: { country: 'Tunisia', name: 'Tunisia', code: 'TUN', goals: 1 }, group: 'F' },
  { id: 13, venue: 'Atlanta Stadium', location: 'Atlanta, USA', datetime: '2026-06-15T19:00:00Z', status: 'completed', stage_name: 'Group H - MD1', home_team: { country: 'Spain', name: 'Spain', code: 'ESP', goals: 0 }, away_team: { country: 'Cabo Verde', name: 'Cabo Verde', code: 'CPV', goals: 0 }, group: 'H' },
  { id: 14, venue: 'Seattle Stadium', location: 'Seattle, USA', datetime: '2026-06-15T22:00:00Z', status: 'completed', stage_name: 'Group G - MD1', home_team: { country: 'Belgium', name: 'Belgium', code: 'BEL', goals: 1 }, away_team: { country: 'Egypt', name: 'Egypt', code: 'EGY', goals: 1 }, group: 'G' },
  { id: 15, venue: 'Miami Stadium', location: 'Miami, USA', datetime: '2026-06-16T13:00:00Z', status: 'completed', stage_name: 'Group H - MD1', home_team: { country: 'Saudi Arabia', name: 'Saudi Arabia', code: 'KSA', goals: 1 }, away_team: { country: 'Uruguay', name: 'Uruguay', code: 'URU', goals: 1 }, group: 'H' },
  { id: 16, venue: 'Los Angeles Stadium', location: 'Los Angeles, USA', datetime: '2026-06-16T16:00:00Z', status: 'completed', stage_name: 'Group G - MD1', home_team: { country: 'IR Iran', name: 'IR Iran', code: 'IRN', goals: 2 }, away_team: { country: 'New Zealand', name: 'New Zealand', code: 'NZL', goals: 2 }, group: 'G' },
  { id: 17, venue: 'New York/New Jersey Stadium', location: 'New Jersey, USA', datetime: '2026-06-16T19:00:00Z', status: 'completed', stage_name: 'Group I - MD1', home_team: { country: 'France', name: 'France', code: 'FRA', goals: 3 }, away_team: { country: 'Senegal', name: 'Senegal', code: 'SEN', goals: 1 }, group: 'I' },
  { id: 18, venue: 'Boston Stadium', location: 'Boston, USA', datetime: '2026-06-17T13:00:00Z', status: 'completed', stage_name: 'Group I - MD1', home_team: { country: 'Iraq', name: 'Iraq', code: 'IRQ', goals: 1 }, away_team: { country: 'Norway', name: 'Norway', code: 'NOR', goals: 4 }, group: 'I' },
  { id: 19, venue: 'Kansas City Stadium', location: 'Kansas City, USA', datetime: '2026-06-17T16:00:00Z', status: 'completed', stage_name: 'Group J - MD1', home_team: { country: 'Argentina', name: 'Argentina', code: 'ARG', goals: 3 }, away_team: { country: 'Algeria', name: 'Algeria', code: 'ALG', goals: 0 }, group: 'J' },
  { id: 20, venue: 'San Francisco Bay Area Stadium', location: 'San Francisco, USA', datetime: '2026-06-17T19:00:00Z', status: 'completed', stage_name: 'Group J - MD1', home_team: { country: 'Austria', name: 'Austria', code: 'AUT', goals: 3 }, away_team: { country: 'Jordan', name: 'Jordan', code: 'JOR', goals: 1 }, group: 'J' },
  { id: 21, venue: 'Houston Stadium', location: 'Houston, USA', datetime: '2026-06-17T22:00:00Z', status: 'completed', stage_name: 'Group K - MD1', home_team: { country: 'Portugal', name: 'Portugal', code: 'POR', goals: 1 }, away_team: { country: 'Congo DR', name: 'Congo DR', code: 'COD', goals: 1 }, group: 'K' },
  { id: 22, venue: 'Dallas Stadium', location: 'Dallas, USA', datetime: '2026-06-18T01:00:00Z', status: 'completed', stage_name: 'Group L - MD1', home_team: { country: 'England', name: 'England', code: 'ENG', goals: 4 }, away_team: { country: 'Croatia', name: 'Croatia', code: 'CRO', goals: 2 }, group: 'L' },
  { id: 23, venue: 'Toronto Stadium', location: 'Toronto, Canada', datetime: '2026-06-18T13:00:00Z', status: 'completed', stage_name: 'Group L - MD1', home_team: { country: 'Ghana', name: 'Ghana', code: 'GHA', goals: 1 }, away_team: { country: 'Panama', name: 'Panama', code: 'PAN', goals: 0 }, group: 'L' },
  { id: 24, venue: 'Mexico City Stadium', location: 'Mexico City, Mexico', datetime: '2026-06-18T16:00:00Z', status: 'completed', stage_name: 'Group K - MD1', home_team: { country: 'Uzbekistan', name: 'Uzbekistan', code: 'UZB', goals: 1 }, away_team: { country: 'Colombia', name: 'Colombia', code: 'COL', goals: 3 }, group: 'K' },
  { id: 25, venue: 'Atlanta Stadium', location: 'Atlanta, USA', datetime: '2026-06-18T19:00:00Z', status: 'completed', stage_name: 'Group A - MD2', home_team: { country: 'Czechia', name: 'Czechia', code: 'CZE', goals: 1 }, away_team: { country: 'South Africa', name: 'South Africa', code: 'RSA', goals: 1 }, group: 'A' },
  { id: 26, venue: 'Los Angeles Stadium', location: 'Los Angeles, USA', datetime: '2026-06-18T22:00:00Z', status: 'completed', stage_name: 'Group B - MD2', home_team: { country: 'Switzerland', name: 'Switzerland', code: 'SUI', goals: 4 }, away_team: { country: 'Bosnia and Herzegovina', name: 'Bosnia and Herzegovina', code: 'BIH', goals: 1 }, group: 'B' },

  // GROUP STAGE — MATCHDAY 2
  { id: 27, venue: 'BC Place Vancouver', location: 'Vancouver, Canada', datetime: '2026-06-19T13:00:00Z', status: 'completed', stage_name: 'Group B - MD2', home_team: { country: 'Canada', name: 'Canada', code: 'CAN', goals: 6 }, away_team: { country: 'Qatar', name: 'Qatar', code: 'QAT', goals: 0 }, group: 'B' },
  { id: 28, venue: 'Guadalajara Stadium', location: 'Guadalajara, Mexico', datetime: '2026-06-19T16:00:00Z', status: 'completed', stage_name: 'Group A - MD2', home_team: { country: 'Mexico', name: 'Mexico', code: 'MEX', goals: 1 }, away_team: { country: 'Korea Republic', name: 'Korea Republic', code: 'KOR', goals: 0 }, group: 'A' },
  { id: 29, venue: 'Seattle Stadium', location: 'Seattle, USA', datetime: '2026-06-19T19:00:00Z', status: 'completed', stage_name: 'Group D - MD2', home_team: { country: 'United States', name: 'United States', code: 'USA', goals: 2 }, away_team: { country: 'Australia', name: 'Australia', code: 'AUS', goals: 0 }, group: 'D' },
  { id: 30, venue: 'Boston Stadium', location: 'Boston, USA', datetime: '2026-06-20T13:00:00Z', status: 'completed', stage_name: 'Group C - MD2', home_team: { country: 'Scotland', name: 'Scotland', code: 'SCO', goals: 0 }, away_team: { country: 'Morocco', name: 'Morocco', code: 'MAR', goals: 1 }, group: 'C' },
  { id: 31, venue: 'Philadelphia Stadium', location: 'Philadelphia, USA', datetime: '2026-06-20T15:00:00Z', status: 'completed', stage_name: 'Group C - MD2', home_team: { country: 'Brazil', name: 'Brazil', code: 'BRA', goals: 3 }, away_team: { country: 'Haiti', name: 'Haiti', code: 'HAI', goals: 0 }, group: 'C' },
  { id: 32, venue: 'San Francisco Bay Area Stadium', location: 'San Francisco, USA', datetime: '2026-06-20T17:00:00Z', status: 'completed', stage_name: 'Group D - MD2', home_team: { country: 'Türkiye', name: 'Türkiye', code: 'TUR', goals: 0 }, away_team: { country: 'Paraguay', name: 'Paraguay', code: 'PAR', goals: 1 }, group: 'D' },
  { id: 33, venue: 'Houston Stadium', location: 'Houston, USA', datetime: '2026-06-20T19:00:00Z', status: 'completed', stage_name: 'Group F - MD2', home_team: { country: 'Netherlands', name: 'Netherlands', code: 'NED', goals: 5 }, away_team: { country: 'Sweden', name: 'Sweden', code: 'SWE', goals: 1 }, group: 'F' },
  { id: 34, venue: 'Toronto Stadium', location: 'Toronto, Canada', datetime: '2026-06-20T22:00:00Z', status: 'completed', stage_name: 'Group E - MD2', home_team: { country: 'Germany', name: 'Germany', code: 'GER', goals: 2 }, away_team: { country: "Côte d'Ivoire", name: "Côte d'Ivoire", code: 'CIV', goals: 1 }, group: 'E' },
  { id: 35, venue: 'Kansas City Stadium', location: 'Kansas City, USA', datetime: '2026-06-21T13:00:00Z', status: 'completed', stage_name: 'Group E - MD2', home_team: { country: 'Ecuador', name: 'Ecuador', code: 'ECU', goals: 0 }, away_team: { country: 'Curaçao', name: 'Curaçao', code: 'CUW', goals: 0 }, group: 'E' },
  { id: 36, venue: 'Monterrey Stadium', location: 'Monterrey, Mexico', datetime: '2026-06-21T16:00:00Z', status: 'completed', stage_name: 'Group F - MD2', home_team: { country: 'Tunisia', name: 'Tunisia', code: 'TUN', goals: 0 }, away_team: { country: 'Japan', name: 'Japan', code: 'JPN', goals: 4 }, group: 'F' },
  { id: 37, venue: 'Atlanta Stadium', location: 'Atlanta, USA', datetime: '2026-06-21T19:00:00Z', status: 'completed', stage_name: 'Group H - MD2', home_team: { country: 'Spain', name: 'Spain', code: 'ESP', goals: 4 }, away_team: { country: 'Saudi Arabia', name: 'Saudi Arabia', code: 'KSA', goals: 0 }, group: 'H' },
  { id: 38, venue: 'Los Angeles Stadium', location: 'Los Angeles, USA', datetime: '2026-06-21T22:00:00Z', status: 'completed', stage_name: 'Group G - MD2', home_team: { country: 'Belgium', name: 'Belgium', code: 'BEL', goals: 0 }, away_team: { country: 'IR Iran', name: 'IR Iran', code: 'IRN', goals: 0 }, group: 'G' },
  { id: 39, venue: 'Miami Stadium', location: 'Miami, USA', datetime: '2026-06-22T13:00:00Z', status: 'completed', stage_name: 'Group H - MD2', home_team: { country: 'Uruguay', name: 'Uruguay', code: 'URU', goals: 2 }, away_team: { country: 'Cabo Verde', name: 'Cabo Verde', code: 'CPV', goals: 2 }, group: 'H' },
  { id: 40, venue: 'BC Place Vancouver', location: 'Vancouver, Canada', datetime: '2026-06-22T16:00:00Z', status: 'completed', stage_name: 'Group G - MD2', home_team: { country: 'New Zealand', name: 'New Zealand', code: 'NZL', goals: 1 }, away_team: { country: 'Egypt', name: 'Egypt', code: 'EGY', goals: 3 }, group: 'G' },

  // GROUP STAGE — MATCHDAY 2 (continued, future)
  { id: 41, venue: 'Dallas Stadium', location: 'Dallas, USA', datetime: '2026-06-22T17:00:00Z', status: 'future_scheduled', stage_name: 'Group J - MD2', home_team: { country: 'Argentina', name: 'Argentina', code: 'ARG', goals: null }, away_team: { country: 'Austria', name: 'Austria', code: 'AUT', goals: null }, group: 'J' },
  { id: 42, venue: 'Philadelphia Stadium', location: 'Philadelphia, USA', datetime: '2026-06-22T21:00:00Z', status: 'future_scheduled', stage_name: 'Group I - MD2', home_team: { country: 'France', name: 'France', code: 'FRA', goals: null }, away_team: { country: 'Iraq', name: 'Iraq', code: 'IRQ', goals: null }, group: 'I' },
  { id: 43, venue: 'New York/New Jersey Stadium', location: 'New Jersey, USA', datetime: '2026-06-23T00:00:00Z', status: 'future_scheduled', stage_name: 'Group I - MD2', home_team: { country: 'Norway', name: 'Norway', code: 'NOR', goals: null }, away_team: { country: 'Senegal', name: 'Senegal', code: 'SEN', goals: null }, group: 'I' },
  { id: 44, venue: 'San Francisco Bay Area Stadium', location: 'San Francisco, USA', datetime: '2026-06-23T03:00:00Z', status: 'future_scheduled', stage_name: 'Group J - MD2', home_team: { country: 'Jordan', name: 'Jordan', code: 'JOR', goals: null }, away_team: { country: 'Algeria', name: 'Algeria', code: 'ALG', goals: null }, group: 'J' },
  { id: 45, venue: 'Houston Stadium', location: 'Houston, USA', datetime: '2026-06-23T17:00:00Z', status: 'future_scheduled', stage_name: 'Group K - MD2', home_team: { country: 'Portugal', name: 'Portugal', code: 'POR', goals: null }, away_team: { country: 'Uzbekistan', name: 'Uzbekistan', code: 'UZB', goals: null }, group: 'K' },
  { id: 46, venue: 'Boston Stadium', location: 'Boston, USA', datetime: '2026-06-23T20:00:00Z', status: 'future_scheduled', stage_name: 'Group L - MD2', home_team: { country: 'England', name: 'England', code: 'ENG', goals: null }, away_team: { country: 'Ghana', name: 'Ghana', code: 'GHA', goals: null }, group: 'L' },
  { id: 47, venue: 'Toronto Stadium', location: 'Toronto, Canada', datetime: '2026-06-23T23:00:00Z', status: 'future_scheduled', stage_name: 'Group L - MD2', home_team: { country: 'Panama', name: 'Panama', code: 'PAN', goals: null }, away_team: { country: 'Croatia', name: 'Croatia', code: 'CRO', goals: null }, group: 'L' },
  { id: 48, venue: 'Guadalajara Stadium', location: 'Guadalajara, Mexico', datetime: '2026-06-24T02:00:00Z', status: 'future_scheduled', stage_name: 'Group K - MD2', home_team: { country: 'Colombia', name: 'Colombia', code: 'COL', goals: null }, away_team: { country: 'Congo DR', name: 'Congo DR', code: 'COD', goals: null }, group: 'K' },

  // GROUP STAGE — MATCHDAY 3
  { id: 49, venue: 'BC Place Vancouver', location: 'Vancouver, Canada', datetime: '2026-06-24T19:00:00Z', status: 'future_scheduled', stage_name: 'Group B - MD3', home_team: { country: 'Switzerland', name: 'Switzerland', code: 'SUI', goals: null }, away_team: { country: 'Canada', name: 'Canada', code: 'CAN', goals: null }, group: 'B' },
  { id: 50, venue: 'Seattle Stadium', location: 'Seattle, USA', datetime: '2026-06-24T19:00:00Z', status: 'future_scheduled', stage_name: 'Group B - MD3', home_team: { country: 'Bosnia and Herzegovina', name: 'Bosnia and Herzegovina', code: 'BIH', goals: null }, away_team: { country: 'Qatar', name: 'Qatar', code: 'QAT', goals: null }, group: 'B' },
  { id: 51, venue: 'Miami Stadium', location: 'Miami, USA', datetime: '2026-06-24T22:00:00Z', status: 'future_scheduled', stage_name: 'Group C - MD3', home_team: { country: 'Scotland', name: 'Scotland', code: 'SCO', goals: null }, away_team: { country: 'Brazil', name: 'Brazil', code: 'BRA', goals: null }, group: 'C' },
  { id: 52, venue: 'Atlanta Stadium', location: 'Atlanta, USA', datetime: '2026-06-24T22:00:00Z', status: 'future_scheduled', stage_name: 'Group C - MD3', home_team: { country: 'Morocco', name: 'Morocco', code: 'MAR', goals: null }, away_team: { country: 'Haiti', name: 'Haiti', code: 'HAI', goals: null }, group: 'C' },
  { id: 53, venue: 'Mexico City Stadium', location: 'Mexico City, Mexico', datetime: '2026-06-25T01:00:00Z', status: 'future_scheduled', stage_name: 'Group A - MD3', home_team: { country: 'Czechia', name: 'Czechia', code: 'CZE', goals: null }, away_team: { country: 'Mexico', name: 'Mexico', code: 'MEX', goals: null }, group: 'A' },
  { id: 54, venue: 'Monterrey Stadium', location: 'Monterrey, Mexico', datetime: '2026-06-25T01:00:00Z', status: 'future_scheduled', stage_name: 'Group A - MD3', home_team: { country: 'South Africa', name: 'South Africa', code: 'RSA', goals: null }, away_team: { country: 'Korea Republic', name: 'Korea Republic', code: 'KOR', goals: null }, group: 'A' },
  { id: 55, venue: 'Philadelphia Stadium', location: 'Philadelphia, USA', datetime: '2026-06-25T20:00:00Z', status: 'future_scheduled', stage_name: 'Group E - MD3', home_team: { country: 'Curaçao', name: 'Curaçao', code: 'CUW', goals: null }, away_team: { country: "Côte d'Ivoire", name: "Côte d'Ivoire", code: 'CIV', goals: null }, group: 'E' },
  { id: 56, venue: 'New York/New Jersey Stadium', location: 'New Jersey, USA', datetime: '2026-06-25T20:00:00Z', status: 'future_scheduled', stage_name: 'Group E - MD3', home_team: { country: 'Ecuador', name: 'Ecuador', code: 'ECU', goals: null }, away_team: { country: 'Germany', name: 'Germany', code: 'GER', goals: null }, group: 'E' },
  { id: 57, venue: 'Dallas Stadium', location: 'Dallas, USA', datetime: '2026-06-25T23:00:00Z', status: 'future_scheduled', stage_name: 'Group F - MD3', home_team: { country: 'Japan', name: 'Japan', code: 'JPN', goals: null }, away_team: { country: 'Sweden', name: 'Sweden', code: 'SWE', goals: null }, group: 'F' },
  { id: 58, venue: 'Kansas City Stadium', location: 'Kansas City, USA', datetime: '2026-06-25T23:00:00Z', status: 'future_scheduled', stage_name: 'Group F - MD3', home_team: { country: 'Tunisia', name: 'Tunisia', code: 'TUN', goals: null }, away_team: { country: 'Netherlands', name: 'Netherlands', code: 'NED', goals: null }, group: 'F' },
  { id: 59, venue: 'Los Angeles Stadium', location: 'Los Angeles, USA', datetime: '2026-06-26T02:00:00Z', status: 'future_scheduled', stage_name: 'Group D - MD3', home_team: { country: 'Türkiye', name: 'Türkiye', code: 'TUR', goals: null }, away_team: { country: 'United States', name: 'United States', code: 'USA', goals: null }, group: 'D' },
  { id: 60, venue: 'San Francisco Bay Area Stadium', location: 'San Francisco, USA', datetime: '2026-06-26T02:00:00Z', status: 'future_scheduled', stage_name: 'Group D - MD3', home_team: { country: 'Paraguay', name: 'Paraguay', code: 'PAR', goals: null }, away_team: { country: 'Australia', name: 'Australia', code: 'AUS', goals: null }, group: 'D' },
  { id: 61, venue: 'Boston Stadium', location: 'Boston, USA', datetime: '2026-06-26T19:00:00Z', status: 'future_scheduled', stage_name: 'Group I - MD3', home_team: { country: 'Norway', name: 'Norway', code: 'NOR', goals: null }, away_team: { country: 'France', name: 'France', code: 'FRA', goals: null }, group: 'I' },
  { id: 62, venue: 'Toronto Stadium', location: 'Toronto, Canada', datetime: '2026-06-26T19:00:00Z', status: 'future_scheduled', stage_name: 'Group I - MD3', home_team: { country: 'Senegal', name: 'Senegal', code: 'SEN', goals: null }, away_team: { country: 'Iraq', name: 'Iraq', code: 'IRQ', goals: null }, group: 'I' },
  { id: 63, venue: 'Houston Stadium', location: 'Houston, USA', datetime: '2026-06-27T00:00:00Z', status: 'future_scheduled', stage_name: 'Group H - MD3', home_team: { country: 'Cabo Verde', name: 'Cabo Verde', code: 'CPV', goals: null }, away_team: { country: 'Saudi Arabia', name: 'Saudi Arabia', code: 'KSA', goals: null }, group: 'H' },
  { id: 64, venue: 'Guadalajara Stadium', location: 'Guadalajara, Mexico', datetime: '2026-06-27T00:00:00Z', status: 'future_scheduled', stage_name: 'Group H - MD3', home_team: { country: 'Uruguay', name: 'Uruguay', code: 'URU', goals: null }, away_team: { country: 'Spain', name: 'Spain', code: 'ESP', goals: null }, group: 'H' },
  { id: 65, venue: 'Seattle Stadium', location: 'Seattle, USA', datetime: '2026-06-27T03:00:00Z', status: 'future_scheduled', stage_name: 'Group G - MD3', home_team: { country: 'Egypt', name: 'Egypt', code: 'EGY', goals: null }, away_team: { country: 'IR Iran', name: 'IR Iran', code: 'IRN', goals: null }, group: 'G' },
  { id: 66, venue: 'BC Place Vancouver', location: 'Vancouver, Canada', datetime: '2026-06-27T03:00:00Z', status: 'future_scheduled', stage_name: 'Group G - MD3', home_team: { country: 'New Zealand', name: 'New Zealand', code: 'NZL', goals: null }, away_team: { country: 'Belgium', name: 'Belgium', code: 'BEL', goals: null }, group: 'G' },
  { id: 67, venue: 'New York/New Jersey Stadium', location: 'New Jersey, USA', datetime: '2026-06-27T21:00:00Z', status: 'future_scheduled', stage_name: 'Group L - MD3', home_team: { country: 'Panama', name: 'Panama', code: 'PAN', goals: null }, away_team: { country: 'England', name: 'England', code: 'ENG', goals: null }, group: 'L' },
  { id: 68, venue: 'Philadelphia Stadium', location: 'Philadelphia, USA', datetime: '2026-06-27T21:00:00Z', status: 'future_scheduled', stage_name: 'Group L - MD3', home_team: { country: 'Croatia', name: 'Croatia', code: 'CRO', goals: null }, away_team: { country: 'Ghana', name: 'Ghana', code: 'GHA', goals: null }, group: 'L' },
  { id: 69, venue: 'Miami Stadium', location: 'Miami, USA', datetime: '2026-06-27T23:30:00Z', status: 'future_scheduled', stage_name: 'Group K - MD3', home_team: { country: 'Colombia', name: 'Colombia', code: 'COL', goals: null }, away_team: { country: 'Portugal', name: 'Portugal', code: 'POR', goals: null }, group: 'K' },
  { id: 70, venue: 'Atlanta Stadium', location: 'Atlanta, USA', datetime: '2026-06-27T23:30:00Z', status: 'future_scheduled', stage_name: 'Group K - MD3', home_team: { country: 'Congo DR', name: 'Congo DR', code: 'COD', goals: null }, away_team: { country: 'Uzbekistan', name: 'Uzbekistan', code: 'UZB', goals: null }, group: 'K' },
  { id: 71, venue: 'Kansas City Stadium', location: 'Kansas City, USA', datetime: '2026-06-28T02:00:00Z', status: 'future_scheduled', stage_name: 'Group J - MD3', home_team: { country: 'Algeria', name: 'Algeria', code: 'ALG', goals: null }, away_team: { country: 'Austria', name: 'Austria', code: 'AUT', goals: null }, group: 'J' },
  { id: 72, venue: 'Dallas Stadium', location: 'Dallas, USA', datetime: '2026-06-28T02:00:00Z', status: 'future_scheduled', stage_name: 'Group J - MD3', home_team: { country: 'Jordan', name: 'Jordan', code: 'JOR', goals: null }, away_team: { country: 'Argentina', name: 'Argentina', code: 'ARG', goals: null }, group: 'J' },

  // ROUND OF 32 — ids match the official FIFA MatchNumber so the W## winner
  // placeholders (e.g. W74) line up with their feeder match id for the bracket.
  { id: 73, venue: 'Los Angeles Stadium', location: 'Los Angeles, USA', datetime: '2026-06-28T19:00:00Z', status: 'future_scheduled', stage_name: 'Round of 32', home_team: { country: '2A', name: '2A', code: '2A', goals: null }, away_team: { country: '2B', name: '2B', code: '2B', goals: null } },
  { id: 74, venue: 'Boston Stadium', location: 'Boston, USA', datetime: '2026-06-29T20:30:00Z', status: 'future_scheduled', stage_name: 'Round of 32', home_team: { country: '1E', name: '1E', code: '1E', goals: null }, away_team: { country: '3ABCDF', name: '3ABCDF', code: '3ABCDF', goals: null } },
  { id: 75, venue: 'Monterrey Stadium', location: 'Monterrey, Mexico', datetime: '2026-06-30T01:00:00Z', status: 'future_scheduled', stage_name: 'Round of 32', home_team: { country: '1F', name: '1F', code: '1F', goals: null }, away_team: { country: '2C', name: '2C', code: '2C', goals: null } },
  { id: 76, venue: 'Houston Stadium', location: 'Houston, USA', datetime: '2026-06-29T17:00:00Z', status: 'future_scheduled', stage_name: 'Round of 32', home_team: { country: '1C', name: '1C', code: '1C', goals: null }, away_team: { country: '2F', name: '2F', code: '2F', goals: null } },
  { id: 77, venue: 'New York/New Jersey Stadium', location: 'New Jersey, USA', datetime: '2026-06-30T21:00:00Z', status: 'future_scheduled', stage_name: 'Round of 32', home_team: { country: '1I', name: '1I', code: '1I', goals: null }, away_team: { country: '3CDFGH', name: '3CDFGH', code: '3CDFGH', goals: null } },
  { id: 78, venue: 'Dallas Stadium', location: 'Dallas, USA', datetime: '2026-06-30T17:00:00Z', status: 'future_scheduled', stage_name: 'Round of 32', home_team: { country: '2E', name: '2E', code: '2E', goals: null }, away_team: { country: '2I', name: '2I', code: '2I', goals: null } },
  { id: 79, venue: 'Mexico City Stadium', location: 'Mexico City, Mexico', datetime: '2026-07-01T01:00:00Z', status: 'future_scheduled', stage_name: 'Round of 32', home_team: { country: '1A', name: '1A', code: '1A', goals: null }, away_team: { country: '3CEFHI', name: '3CEFHI', code: '3CEFHI', goals: null } },
  { id: 80, venue: 'Atlanta Stadium', location: 'Atlanta, USA', datetime: '2026-07-01T16:00:00Z', status: 'future_scheduled', stage_name: 'Round of 32', home_team: { country: '1L', name: '1L', code: '1L', goals: null }, away_team: { country: '3EHIJK', name: '3EHIJK', code: '3EHIJK', goals: null } },
  { id: 81, venue: 'San Francisco Bay Area Stadium', location: 'San Francisco, USA', datetime: '2026-07-02T00:00:00Z', status: 'future_scheduled', stage_name: 'Round of 32', home_team: { country: '1D', name: '1D', code: '1D', goals: null }, away_team: { country: '3BEFIJ', name: '3BEFIJ', code: '3BEFIJ', goals: null } },
  { id: 82, venue: 'Seattle Stadium', location: 'Seattle, USA', datetime: '2026-07-01T20:00:00Z', status: 'future_scheduled', stage_name: 'Round of 32', home_team: { country: '1G', name: '1G', code: '1G', goals: null }, away_team: { country: '3AEHIJ', name: '3AEHIJ', code: '3AEHIJ', goals: null } },
  { id: 83, venue: 'Toronto Stadium', location: 'Toronto, Canada', datetime: '2026-07-02T23:00:00Z', status: 'future_scheduled', stage_name: 'Round of 32', home_team: { country: '2K', name: '2K', code: '2K', goals: null }, away_team: { country: '2L', name: '2L', code: '2L', goals: null } },
  { id: 84, venue: 'Los Angeles Stadium', location: 'Los Angeles, USA', datetime: '2026-07-02T19:00:00Z', status: 'future_scheduled', stage_name: 'Round of 32', home_team: { country: '1H', name: '1H', code: '1H', goals: null }, away_team: { country: '2J', name: '2J', code: '2J', goals: null } },
  { id: 85, venue: 'BC Place Vancouver', location: 'Vancouver, Canada', datetime: '2026-07-03T03:00:00Z', status: 'future_scheduled', stage_name: 'Round of 32', home_team: { country: '1B', name: '1B', code: '1B', goals: null }, away_team: { country: '3EFGIJ', name: '3EFGIJ', code: '3EFGIJ', goals: null } },
  { id: 86, venue: 'Miami Stadium', location: 'Miami, USA', datetime: '2026-07-03T22:00:00Z', status: 'future_scheduled', stage_name: 'Round of 32', home_team: { country: '1J', name: '1J', code: '1J', goals: null }, away_team: { country: '2H', name: '2H', code: '2H', goals: null } },
  { id: 87, venue: 'Kansas City Stadium', location: 'Kansas City, USA', datetime: '2026-07-04T01:30:00Z', status: 'future_scheduled', stage_name: 'Round of 32', home_team: { country: '1K', name: '1K', code: '1K', goals: null }, away_team: { country: '3DEIJL', name: '3DEIJL', code: '3DEIJL', goals: null } },
  { id: 88, venue: 'Dallas Stadium', location: 'Dallas, USA', datetime: '2026-07-03T18:00:00Z', status: 'future_scheduled', stage_name: 'Round of 32', home_team: { country: '2D', name: '2D', code: '2D', goals: null }, away_team: { country: '2G', name: '2G', code: '2G', goals: null } },

  // ROUND OF 16
  { id: 89, venue: 'Philadelphia Stadium', location: 'Philadelphia, USA', datetime: '2026-07-04T21:00:00Z', status: 'future_scheduled', stage_name: 'Round of 16', home_team: { country: 'W74', name: 'W74', code: 'W74', goals: null }, away_team: { country: 'W77', name: 'W77', code: 'W77', goals: null } },
  { id: 90, venue: 'Houston Stadium', location: 'Houston, USA', datetime: '2026-07-04T17:00:00Z', status: 'future_scheduled', stage_name: 'Round of 16', home_team: { country: 'W73', name: 'W73', code: 'W73', goals: null }, away_team: { country: 'W75', name: 'W75', code: 'W75', goals: null } },
  { id: 91, venue: 'New York/New Jersey Stadium', location: 'New Jersey, USA', datetime: '2026-07-05T20:00:00Z', status: 'future_scheduled', stage_name: 'Round of 16', home_team: { country: 'W76', name: 'W76', code: 'W76', goals: null }, away_team: { country: 'W78', name: 'W78', code: 'W78', goals: null } },
  { id: 92, venue: 'Mexico City Stadium', location: 'Mexico City, Mexico', datetime: '2026-07-06T00:00:00Z', status: 'future_scheduled', stage_name: 'Round of 16', home_team: { country: 'W79', name: 'W79', code: 'W79', goals: null }, away_team: { country: 'W80', name: 'W80', code: 'W80', goals: null } },
  { id: 93, venue: 'Dallas Stadium', location: 'Dallas, USA', datetime: '2026-07-06T19:00:00Z', status: 'future_scheduled', stage_name: 'Round of 16', home_team: { country: 'W83', name: 'W83', code: 'W83', goals: null }, away_team: { country: 'W84', name: 'W84', code: 'W84', goals: null } },
  { id: 94, venue: 'Seattle Stadium', location: 'Seattle, USA', datetime: '2026-07-07T00:00:00Z', status: 'future_scheduled', stage_name: 'Round of 16', home_team: { country: 'W81', name: 'W81', code: 'W81', goals: null }, away_team: { country: 'W82', name: 'W82', code: 'W82', goals: null } },
  { id: 95, venue: 'Atlanta Stadium', location: 'Atlanta, USA', datetime: '2026-07-07T16:00:00Z', status: 'future_scheduled', stage_name: 'Round of 16', home_team: { country: 'W86', name: 'W86', code: 'W86', goals: null }, away_team: { country: 'W88', name: 'W88', code: 'W88', goals: null } },
  { id: 96, venue: 'BC Place Vancouver', location: 'Vancouver, Canada', datetime: '2026-07-07T20:00:00Z', status: 'future_scheduled', stage_name: 'Round of 16', home_team: { country: 'W85', name: 'W85', code: 'W85', goals: null }, away_team: { country: 'W87', name: 'W87', code: 'W87', goals: null } },

  // QUARTER-FINALS
  { id: 97, venue: 'Boston Stadium', location: 'Boston, USA', datetime: '2026-07-09T20:00:00Z', status: 'future_scheduled', stage_name: 'Quarter-final', home_team: { country: 'W89', name: 'W89', code: 'W89', goals: null }, away_team: { country: 'W90', name: 'W90', code: 'W90', goals: null } },
  { id: 98, venue: 'Los Angeles Stadium', location: 'Los Angeles, USA', datetime: '2026-07-10T19:00:00Z', status: 'future_scheduled', stage_name: 'Quarter-final', home_team: { country: 'W93', name: 'W93', code: 'W93', goals: null }, away_team: { country: 'W94', name: 'W94', code: 'W94', goals: null } },
  { id: 99, venue: 'Miami Stadium', location: 'Miami, USA', datetime: '2026-07-11T21:00:00Z', status: 'future_scheduled', stage_name: 'Quarter-final', home_team: { country: 'W91', name: 'W91', code: 'W91', goals: null }, away_team: { country: 'W92', name: 'W92', code: 'W92', goals: null } },
  { id: 100, venue: 'Kansas City Stadium', location: 'Kansas City, USA', datetime: '2026-07-12T01:00:00Z', status: 'future_scheduled', stage_name: 'Quarter-final', home_team: { country: 'W95', name: 'W95', code: 'W95', goals: null }, away_team: { country: 'W96', name: 'W96', code: 'W96', goals: null } },

  // SEMI-FINALS
  { id: 101, venue: 'Dallas Stadium', location: 'Dallas, USA', datetime: '2026-07-14T19:00:00Z', status: 'future_scheduled', stage_name: 'Semi-final', home_team: { country: 'W97', name: 'W97', code: 'W97', goals: null }, away_team: { country: 'W98', name: 'W98', code: 'W98', goals: null } },
  { id: 102, venue: 'Atlanta Stadium', location: 'Atlanta, USA', datetime: '2026-07-15T19:00:00Z', status: 'future_scheduled', stage_name: 'Semi-final', home_team: { country: 'W99', name: 'W99', code: 'W99', goals: null }, away_team: { country: 'W100', name: 'W100', code: 'W100', goals: null } },

  // THIRD PLACE + FINAL
  { id: 103, venue: 'Miami Stadium', location: 'Miami, USA', datetime: '2026-07-18T21:00:00Z', status: 'future_scheduled', stage_name: 'Third place play-off', home_team: { country: 'RU101', name: 'RU101', code: 'RU101', goals: null }, away_team: { country: 'RU102', name: 'RU102', code: 'RU102', goals: null } },
  { id: 104, venue: 'New York/New Jersey Stadium', location: 'New Jersey, USA', datetime: '2026-07-19T19:00:00Z', status: 'future_scheduled', stage_name: 'Final', home_team: { country: 'W101', name: 'W101', code: 'W101', goals: null }, away_team: { country: 'W102', name: 'W102', code: 'W102', goals: null } },
];

function getLocalDateString(date: Date): string {
  return date.toLocaleDateString('en-CA');
}

export type FormResult = 'W' | 'D' | 'L';

// Builds each team's last-5 form (chronological) from completed matches.
export function computeForm(): Record<string, FormResult[]> {
  const completed = MATCHES
    .filter((m) => m.status === 'completed' && m.home_team.goals !== null && m.away_team.goals !== null)
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

  const form: Record<string, FormResult[]> = {};
  const push = (code: string, r: FormResult) => {
    (form[code] ||= []).push(r);
  };

  for (const m of completed) {
    const hg = m.home_team.goals!;
    const ag = m.away_team.goals!;
    if (hg > ag) {
      push(m.home_team.code, 'W');
      push(m.away_team.code, 'L');
    } else if (hg < ag) {
      push(m.home_team.code, 'L');
      push(m.away_team.code, 'W');
    } else {
      push(m.home_team.code, 'D');
      push(m.away_team.code, 'D');
    }
  }

  for (const code of Object.keys(form)) {
    form[code] = form[code].slice(-5);
  }
  return form;
}

export async function fetchCurrentMatches(): Promise<Match[]> {
  return MATCHES.filter((m) => m.status === 'in_progress' || m.status === 'half_time');
}

export async function fetchTodayMatches(): Promise<Match[]> {
  const todayISR = getLocalDateString(new Date());
  return MATCHES.filter((m) => {
    const matchDateISR = getLocalDateString(new Date(m.datetime));
    return matchDateISR === todayISR && m.status === 'completed';
  });
}

export async function fetchYesterdayMatches(): Promise<Match[]> {
  const yesterday = new Date(Date.now() - 86400000);
  const yesterdayISR = getLocalDateString(yesterday);
  return MATCHES.filter((m) => {
    const matchDateISR = getLocalDateString(new Date(m.datetime));
    return matchDateISR === yesterdayISR && m.status === 'completed';
  });
}

export async function fetchAllMatches(): Promise<Match[]> {
  return [...MATCHES].sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
}

export async function fetchGroups(): Promise<Group[]> {
  return GROUPS;
}
