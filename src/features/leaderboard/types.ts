import type {
  Competition,
  CompetitionDivision,
  DivisionMode,
  LeaderboardAthleteRow,
  LeaderboardTeamRow,
  TeamEntity,
  TeamMember,
} from "@/lib/types";

export type LeaderboardRow = LeaderboardAthleteRow | LeaderboardTeamRow;

export interface TeamWorkoutColumnView {
  key: string;
  label: string;
  lookup: Record<string, LeaderboardTeamRow>;
}

export interface WodColumnView {
  key: string;
  shortLabel: string;
  fullLabel: string;
  workoutNames?: string[];
  teamWorkouts?: TeamWorkoutColumnView[];
  lookup: Record<string, LeaderboardAthleteRow | LeaderboardTeamRow>;
}

export interface AthletePanelState {
  athleteId: string;
  name: string;
  country?: string | null;
  userId?: string | null;
}

export interface LeaderboardDashboardState {
  slugInput: string;
  activeSlug: string;
  isSlugEditorOpen: boolean;
  competition: Competition | null;
  divisions: CompetitionDivision[];
  selectedDivisionId: string;
  selectedDivision: CompetitionDivision | null;
  divisionMode: DivisionMode;
  leaderboardRows: LeaderboardRow[];
  wodColumns: WodColumnView[];
  teamsDirectory: TeamEntity[];
  selectedTeamId: string | null;
  selectedTeamPreview: LeaderboardTeamRow | null;
  selectedTeamDetail: TeamEntity | null;
  teamMembers: TeamMember[];
  teamAthleteResults: Record<
    string,
    import("@/lib/types").AthleteWorkoutResultView[]
  >;
  teamAthleteResultsLoading: boolean;
  selectedAthlete: AthletePanelState | null;
  athleteResults: import("@/lib/types").AthleteWorkoutResultView[];
  sortedAthleteResults: import("@/lib/types").AthleteWorkoutResultView[];
  bootLoading: boolean;
  boardLoading: boolean;
  teamLoading: boolean;
  athleteLoading: boolean;
  error: string | null;
  totalEntries: number;
  totalPoints: number;
}
