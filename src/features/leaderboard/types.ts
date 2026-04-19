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

export interface WodColumnView {
  key: string;
  shortLabel: string;
  fullLabel: string;
  lookup: Record<string, LeaderboardAthleteRow | LeaderboardTeamRow>;
}

export interface AthletePanelState {
  athleteId: string;
  name: string;
  userId?: string | null;
}

export interface LeaderboardDashboardState {
  slugInput: string;
  activeSlug: string;
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
