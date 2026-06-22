// World Cup 2026 API Types

export interface Team {
  country: string;
  name: string;
  code: string;
  flag_url?: string;
}

export interface Match {
  id: number;
  venue: string;
  location: string;
  datetime: string;
  status: 'future_scheduled' | 'in_progress' | 'completed' | 'half_time';
  stage_name: string;
  home_team: TeamResult;
  away_team: TeamResult;
  group?: string;
  winner?: string;
  time?: string;
}

export interface TeamResult {
  country: string;
  name: string;
  code: string;
  goals: number | null;
  penalties?: number | null;
}

export interface GroupStanding {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

export interface Group {
  letter: string;
  teams: GroupStanding[];
}
