export type DivisionMode = "individual" | "team";

export type MaybeNumberString = number | string | null;

export interface CompetitionDivision {
  id: string;
  name: string;
  team_size: number;
  final_count?: number | string | null;
  gender?: string | null;
  category?: string | null;
  parent_division_id?: string | null;
}

export interface Competition {
  id: string;
  name: string;
  slug: string;
  country?: string | null;
  competition_division: CompetitionDivision[];
  [key: string]: unknown;
}

export interface LeaderboardEntityBase {
  id: string;
  name: string;
  points: MaybeNumberString;
  position?: MaybeNumberString;
  country?: string | null;
  club_name?: string | null;
  age?: number | string | null;
  wildcard?: number | boolean | null;
  avatar_url?: string | null;
  avatar?: string | null;
  invited?: number | boolean | null;
  invited_at?: string | null;
  invited_end_at?: string | null;
  cover_avatar?: string | null;
  cover?: string | null;
  logo?: string | null;
}

export interface LeaderboardAthleteRow extends LeaderboardEntityBase {
  user_id?: string | null;
  club_logo?: string | null;
}

export interface LeaderboardTeamRow extends LeaderboardEntityBase {
  heat_avatar?: string | null;
  heat_avatar_visible?: boolean | null;
}

export interface LeaderboardWodMeta {
  id?: string | null;
  name?: string | null;
  order?: number | null;
  [key: string]: unknown;
}

export interface LeaderboardWodIndividual {
  wod: LeaderboardWodMeta;
  workouts?: WorkoutCatalogEntry[];
  athletes: Record<string, LeaderboardAthleteRow>;
}

export interface LeaderboardWodTeam {
  wod: LeaderboardWodMeta;
  workouts?: TeamLeaderboardWorkout[];
  teams: Record<string, LeaderboardTeamRow>;
}

export interface TeamLeaderboardWorkout {
  workout?: LeaderboardWodMeta | null;
  teams?: LeaderboardTeamRow[] | Record<string, LeaderboardTeamRow>;
  results?: WorkoutResult[];
  [key: string]: unknown;
}

export interface IndividualLeaderboardResponse {
  athletes: LeaderboardAthleteRow[];
  wods: LeaderboardWodIndividual[];
  [key: string]: unknown;
}

export interface TeamLeaderboardResponse {
  teams: LeaderboardTeamRow[];
  wods: LeaderboardWodTeam[];
  [key: string]: unknown;
}

export interface WodCatalogDivisionRef {
  id: string;
  name?: string | null;
}

export interface WorkoutCatalogEntry {
  id: string;
  name?: string | null;
  order?: number | null;
}

export interface WodCatalogItem {
  id: string;
  name: string;
  order?: number | null;
  divisions?: WodCatalogDivisionRef[];
  workouts?: WorkoutCatalogEntry[];
}

export interface TeamEntity {
  id: string;
  name?: string | null;
  division_id?: string | null;
  country?: string | null;
  club_name?: string | null;
  athlete_count?: number | null;
  [key: string]: unknown;
}

export interface TeamMember {
  id?: string;
  name?: string | null;
  athlete_name?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  athlete_id?: string | null;
  user_id?: string | null;
  country?: string | null;
  avatar_url?: string | null;
  gender?: string | null;
  status?: string | null;
  athlete?: {
    name?: string | null;
    athlete_name?: string | null;
    full_name?: string | null;
    display_name?: string | null;
    avatar_url?: string | null;
    user?: {
      name?: string | null;
      avatar?: string | null;
      country?: string | null;
      club_name?: string | null;
      [key: string]: unknown;
    } | null;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
}

export interface WorkoutResult {
  id?: string;
  athlete_id?: string | null;
  workout_id?: string | null;
  score?: MaybeNumberString;
  points?: MaybeNumberString;
  time?: string | null;
  reps?: MaybeNumberString;
  how_many?: MaybeNumberString;
  tie_break?: MaybeNumberString;
  video?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
}

export interface AthleteWorkoutResultView {
  workoutId: string;
  workoutName: string;
  wodName: string;
  order: number;
  result: WorkoutResult | null;
  error?: string;
}
