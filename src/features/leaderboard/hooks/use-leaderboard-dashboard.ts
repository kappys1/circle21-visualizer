"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  fetchCompetitionBySlug,
  fetchIndividualLeaderboard,
  fetchTeamDetail,
  fetchTeamLeaderboard,
  fetchTeamMembers,
  fetchTeams,
  fetchWods,
  fetchWorkoutResults,
} from "@/lib/api";
import type {
  AthleteWorkoutResultView,
  Competition,
  CompetitionDivision,
  IndividualLeaderboardResponse,
  LeaderboardTeamRow,
  TeamEntity,
  TeamLeaderboardResponse,
  TeamMember,
  WodCatalogItem,
} from "@/lib/types";

import type {
  AthletePanelState,
  LeaderboardDashboardState,
  LeaderboardRow,
  WodColumnView,
} from "@/features/leaderboard/types";
import {
  parseErrorMessage,
  parseMode,
  rankPoints,
  shortWodLabel,
} from "@/features/leaderboard/utils";

const DEFAULT_SLUG = "wodcelona-online-qualifier-2026";
const SLUG_QUERY_PARAM = "event";
const CATEGORY_QUERY_PARAM = "category";
const SLUG_QUERY_PARAM_ALIASES = [SLUG_QUERY_PARAM, "slug", "competition"];
const CATEGORY_QUERY_PARAM_ALIASES = [
  CATEGORY_QUERY_PARAM,
  "division",
  "division_id",
  "divisionId",
];

function getQueryParamValue(paramNames: string | string[]): string | null {
  if (globalThis.window === undefined) {
    return null;
  }

  const names = Array.isArray(paramNames) ? paramNames : [paramNames];
  const searchParams = new URLSearchParams(globalThis.window.location.search);

  for (const paramName of names) {
    const directValue = searchParams.get(paramName)?.trim();

    if (directValue && directValue.length > 0) {
      return directValue;
    }
  }

  const normalizedNames = new Set(names.map((name) => name.toLowerCase()));

  for (const [paramName, rawValue] of searchParams.entries()) {
    if (!normalizedNames.has(paramName.toLowerCase())) {
      continue;
    }

    const value = rawValue.trim();

    if (value.length > 0) {
      return value;
    }
  }

  return null;
}

function getSlugFromQueryParam(): string {
  const querySlug = getQueryParamValue(SLUG_QUERY_PARAM_ALIASES);

  return querySlug && querySlug.length > 0 ? querySlug : DEFAULT_SLUG;
}

function getCategoryFromQueryParam(): string | null {
  return getQueryParamValue(CATEGORY_QUERY_PARAM_ALIASES);
}

function normalizeCategoryToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+/g, "")
    .replaceAll(/-+$/g, "");
}

function resolveDivisionIdFromQueryCategory(
  divisions: CompetitionDivision[],
  queryCategory: string | null,
): string | null {
  if (!queryCategory) {
    return null;
  }

  const rawQuery = queryCategory.trim().toLowerCase();
  const normalizedQuery = normalizeCategoryToken(queryCategory);

  if (rawQuery.length === 0 && normalizedQuery.length === 0) {
    return null;
  }

  const matchedDivision = divisions.find((division) => {
    const candidateValues = [division.id, division.name, division.category];

    return candidateValues.some((value) => {
      if (typeof value !== "string") {
        return false;
      }

      const rawCandidate = value.trim().toLowerCase();

      if (rawCandidate.length === 0) {
        return false;
      }

      if (rawCandidate === rawQuery) {
        return true;
      }

      return normalizeCategoryToken(value) === normalizedQuery;
    });
  });

  return matchedDivision?.id ?? null;
}

function resolveInitialDivisionId(divisions: CompetitionDivision[]): string {
  const fallbackDivisionId = divisions[0]?.id ?? "";
  const divisionIdFromQuery = resolveDivisionIdFromQueryCategory(
    divisions,
    getCategoryFromQueryParam(),
  );

  return divisionIdFromQuery ?? fallbackDivisionId;
}

function asText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function normalizeSearchValue(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "");
}

function resolveTeamMemberSearchName(
  member: TeamMember,
  index: number,
): string {
  const nestedAthlete = member.athlete;
  const nestedUser = nestedAthlete?.user;

  return (
    asText(member.name) ??
    asText(member.athlete_name) ??
    asText(member.full_name) ??
    asText(member.display_name) ??
    asText(nestedAthlete?.name) ??
    asText(nestedAthlete?.athlete_name) ??
    asText(nestedAthlete?.full_name) ??
    asText(nestedAthlete?.display_name) ??
    asText(nestedUser?.name) ??
    (member.athlete_id
      ? `Atleta ${member.athlete_id.slice(0, 8)}`
      : `Atleta ${index + 1}`)
  );
}

async function mapWithConcurrency<TItem, TResult>(
  items: TItem[],
  concurrency: number,
  mapper: (item: TItem) => Promise<TResult>,
): Promise<TResult[]> {
  if (items.length === 0) {
    return [];
  }

  const results = new Array<TResult>(items.length);
  const workerCount = Math.min(items.length, Math.max(1, concurrency));
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;

      results[currentIndex] = await mapper(items[currentIndex]);
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return results;
}

interface LeaderboardDashboardApi extends LeaderboardDashboardState {
  setSlugInput: (value: string) => void;
  openSlugEditor: () => void;
  closeSlugEditor: () => void;
  applySlug: () => void;
  setSelectedDivisionId: (value: string) => void;
  setTeamSearchQuery: (value: string) => void;
  selectTeam: (team: LeaderboardTeamRow) => void;
  closeTeamPanel: () => void;
  openAthletePanel: (
    athleteId: string,
    name: string,
    country?: string | null,
    userId?: string | null,
  ) => void;
  closeAthletePanel: () => void;
}

export function useLeaderboardDashboard(): LeaderboardDashboardApi {
  const [slugInput, setSlugInput] = useState<string>(getSlugFromQueryParam);
  const [activeSlug, setActiveSlug] = useState<string>(getSlugFromQueryParam);
  const [isSlugEditorOpen, setIsSlugEditorOpen] = useState<boolean>(false);

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [wodCatalog, setWodCatalog] = useState<WodCatalogItem[]>([]);
  const [selectedDivisionId, setSelectedDivisionIdState] = useState<string>("");
  const [teamSearchQuery, setTeamSearchQueryState] = useState<string>("");

  const [individualBoard, setIndividualBoard] =
    useState<IndividualLeaderboardResponse | null>(null);
  const [teamBoard, setTeamBoard] = useState<TeamLeaderboardResponse | null>(
    null,
  );
  const [teamsDirectory, setTeamsDirectory] = useState<TeamEntity[]>([]);
  const [teamSearchMembersByTeamId, setTeamSearchMembersByTeamId] = useState<
    Record<string, TeamMember[]>
  >({});
  const [teamSearchMembersLoading, setTeamSearchMembersLoading] =
    useState<boolean>(false);

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedTeamPreview, setSelectedTeamPreview] =
    useState<LeaderboardTeamRow | null>(null);
  const [selectedTeamDetail, setSelectedTeamDetail] =
    useState<TeamEntity | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamAthleteResults, setTeamAthleteResults] = useState<
    Record<string, AthleteWorkoutResultView[]>
  >({});
  const [teamAthleteResultsLoading, setTeamAthleteResultsLoading] =
    useState<boolean>(false);

  const [selectedAthlete, setSelectedAthlete] =
    useState<AthletePanelState | null>(null);
  const [athleteResults, setAthleteResults] = useState<
    AthleteWorkoutResultView[]
  >([]);

  const [bootLoading, setBootLoading] = useState<boolean>(true);
  const [boardLoading, setBoardLoading] = useState<boolean>(false);
  const [teamLoading, setTeamLoading] = useState<boolean>(false);
  const [athleteLoading, setAthleteLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const divisions = useMemo(
    () => competition?.competition_division ?? [],
    [competition],
  );

  const selectedDivision = useMemo<CompetitionDivision | null>(() => {
    return (
      divisions.find((division) => division.id === selectedDivisionId) ?? null
    );
  }, [divisions, selectedDivisionId]);

  const divisionMode = parseMode(selectedDivision);

  useEffect(() => {
    if (globalThis.window === undefined) {
      return;
    }

    const currentUrl = new URL(globalThis.window.location.href);
    const nextCategory = selectedDivisionId.trim();
    const shouldSyncCategory = nextCategory.length > 0;

    const isCategoryAlreadySynced = shouldSyncCategory
      ? currentUrl.searchParams.get(CATEGORY_QUERY_PARAM) === nextCategory
      : true;

    if (
      currentUrl.searchParams.get(SLUG_QUERY_PARAM) === activeSlug &&
      isCategoryAlreadySynced
    ) {
      return;
    }

    currentUrl.searchParams.set(SLUG_QUERY_PARAM, activeSlug);

    if (shouldSyncCategory) {
      currentUrl.searchParams.set(CATEGORY_QUERY_PARAM, nextCategory);
    }

    globalThis.window.history.replaceState(
      globalThis.window.history.state,
      "",
      `${currentUrl.pathname}?${currentUrl.searchParams.toString()}${currentUrl.hash}`,
    );
  }, [activeSlug, selectedDivisionId]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setBootLoading(true);
      setError(null);

      setCompetition(null);
      setWodCatalog([]);
      setSelectedDivisionIdState("");
      setTeamSearchQueryState("");

      setIndividualBoard(null);
      setTeamBoard(null);
      setTeamsDirectory([]);
      setTeamSearchMembersByTeamId({});
      setTeamSearchMembersLoading(false);
      setSelectedTeamId(null);
      setSelectedTeamPreview(null);
      setSelectedTeamDetail(null);
      setTeamMembers([]);
      setTeamAthleteResults({});
      setTeamAthleteResultsLoading(false);

      setSelectedAthlete(null);
      setAthleteResults([]);

      try {
        const competitionResponse = await fetchCompetitionBySlug(activeSlug);
        const wodsResponse = await fetchWods(competitionResponse.id);

        if (cancelled) {
          return;
        }

        setCompetition(competitionResponse);
        setWodCatalog(wodsResponse);

        const initialDivision = resolveInitialDivisionId(
          competitionResponse.competition_division,
        );
        setSelectedDivisionIdState(initialDivision);
      } catch (requestError) {
        if (!cancelled) {
          setError(parseErrorMessage(requestError));
        }
      } finally {
        if (!cancelled) {
          setBootLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [activeSlug]);

  useEffect(() => {
    if (!competition || !selectedDivisionId) {
      return;
    }

    const competitionId = competition.id;
    let cancelled = false;

    async function loadLeaderboard() {
      setBoardLoading(true);
      setError(null);

      setSelectedTeamId(null);
      setSelectedTeamPreview(null);
      setSelectedTeamDetail(null);
      setTeamMembers([]);
      setTeamSearchMembersByTeamId({});
      setTeamSearchMembersLoading(false);
      setTeamAthleteResults({});
      setTeamAthleteResultsLoading(false);
      setTeamSearchQueryState("");
      setSelectedAthlete(null);
      setAthleteResults([]);

      try {
        if (divisionMode === "team") {
          const [leaderboardResponse, teamListResponse] = await Promise.all([
            fetchTeamLeaderboard(competitionId, selectedDivisionId),
            fetchTeams(competitionId, selectedDivisionId, 1, 50),
          ]);

          if (cancelled) {
            return;
          }

          setTeamBoard(leaderboardResponse);
          setTeamsDirectory(teamListResponse);
          setIndividualBoard(null);
        } else {
          const leaderboardResponse = await fetchIndividualLeaderboard(
            competitionId,
            selectedDivisionId,
          );

          if (cancelled) {
            return;
          }

          setIndividualBoard(leaderboardResponse);
          setTeamBoard(null);
          setTeamsDirectory([]);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(parseErrorMessage(requestError));
        }
      } finally {
        if (!cancelled) {
          setBoardLoading(false);
        }
      }
    }

    void loadLeaderboard();

    return () => {
      cancelled = true;
    };
  }, [competition, selectedDivisionId, divisionMode]);

  useEffect(() => {
    if (divisionMode !== "team") {
      return;
    }

    const searchableTeams = (teamBoard?.teams ?? []).filter(
      (team): team is LeaderboardTeamRow =>
        typeof team.id === "string" && team.id.trim().length > 0,
    );

    if (searchableTeams.length === 0) {
      return;
    }

    let cancelled = false;

    async function loadTeamSearchMembers() {
      setTeamSearchMembersLoading(true);
      setTeamSearchMembersByTeamId({});

      try {
        const entries = await mapWithConcurrency(
          searchableTeams,
          6,
          async (team) => {
            try {
              const members = await fetchTeamMembers(team.id);
              return [team.id, members] as const;
            } catch {
              return [team.id, []] as const;
            }
          },
        );

        if (cancelled) {
          return;
        }

        setTeamSearchMembersByTeamId(Object.fromEntries(entries));
      } finally {
        if (!cancelled) {
          setTeamSearchMembersLoading(false);
        }
      }
    }

    void loadTeamSearchMembers();

    return () => {
      cancelled = true;
    };
  }, [divisionMode, teamBoard]);

  useEffect(() => {
    if (!selectedTeamId || divisionMode !== "team") {
      return;
    }

    const teamId = selectedTeamId;
    let cancelled = false;

    async function loadTeamDetail() {
      setTeamLoading(true);
      setTeamAthleteResults({});
      setTeamAthleteResultsLoading(false);

      try {
        const [teamDetailResponse, membersResponse] = await Promise.all([
          fetchTeamDetail(teamId),
          fetchTeamMembers(teamId),
        ]);

        if (cancelled) {
          return;
        }

        setSelectedTeamDetail(teamDetailResponse);
        setTeamMembers(membersResponse);
      } catch (requestError) {
        if (!cancelled) {
          setError(parseErrorMessage(requestError));
        }
      } finally {
        if (!cancelled) {
          setTeamLoading(false);
        }
      }
    }

    void loadTeamDetail();

    return () => {
      cancelled = true;
    };
  }, [selectedTeamId, divisionMode]);

  const workoutsForDivision = useMemo(() => {
    if (!selectedDivisionId) {
      return [] as Array<{
        workoutId: string;
        workoutName: string;
        wodName: string;
        order: number;
      }>;
    }

    const flattened: Array<{
      workoutId: string;
      workoutName: string;
      wodName: string;
      order: number;
    }> = [];

    wodCatalog
      .filter((wod) =>
        (wod.divisions ?? []).some(
          (division) => division.id === selectedDivisionId,
        ),
      )
      .forEach((wod, wodIndex) => {
        const wodOrder =
          typeof wod.order === "number" ? wod.order : wodIndex + 1;

        (wod.workouts ?? []).forEach((workout, workoutIndex) => {
          if (!workout.id) {
            return;
          }

          const workoutOrder =
            typeof workout.order === "number"
              ? workout.order
              : workoutIndex + 1;

          flattened.push({
            workoutId: workout.id,
            workoutName: workout.name ?? `Workout ${workoutIndex + 1}`,
            wodName: wod.name,
            order: wodOrder * 100 + workoutOrder,
          });
        });
      });

    return flattened.toSorted((first, second) => first.order - second.order);
  }, [selectedDivisionId, wodCatalog]);

  useEffect(() => {
    if (!selectedAthlete || divisionMode === "team") {
      return;
    }

    const athleteId = selectedAthlete.athleteId;
    let cancelled = false;

    async function loadAthleteResults() {
      setAthleteLoading(true);
      setAthleteResults([]);

      try {
        const resultRows = await Promise.all(
          workoutsForDivision.map(async (workout) => {
            try {
              const response = await fetchWorkoutResults(
                workout.workoutId,
                athleteId,
              );

              return {
                workoutId: workout.workoutId,
                workoutName: workout.workoutName,
                wodName: workout.wodName,
                order: workout.order,
                result: response[0] ?? null,
              } satisfies AthleteWorkoutResultView;
            } catch (requestError) {
              return {
                workoutId: workout.workoutId,
                workoutName: workout.workoutName,
                wodName: workout.wodName,
                order: workout.order,
                result: null,
                error: parseErrorMessage(requestError),
              } satisfies AthleteWorkoutResultView;
            }
          }),
        );

        if (cancelled) {
          return;
        }

        setAthleteResults(resultRows);
      } finally {
        if (!cancelled) {
          setAthleteLoading(false);
        }
      }
    }

    void loadAthleteResults();

    return () => {
      cancelled = true;
    };
  }, [selectedAthlete, workoutsForDivision, divisionMode]);

  useEffect(() => {
    if (divisionMode !== "team" || !selectedTeamId) {
      return;
    }

    const athleteIds = teamMembers
      .map((member) => member.athlete_id)
      .filter(
        (athleteId): athleteId is string =>
          typeof athleteId === "string" && athleteId.trim().length > 0,
      );

    if (athleteIds.length === 0 || workoutsForDivision.length === 0) {
      return;
    }

    let cancelled = false;

    async function loadTeamAthleteResults() {
      setTeamAthleteResultsLoading(true);
      setTeamAthleteResults({});

      try {
        const entries = await Promise.all(
          athleteIds.map(async (athleteId) => {
            const resultRows = await Promise.all(
              workoutsForDivision.map(async (workout) => {
                try {
                  const response = await fetchWorkoutResults(
                    workout.workoutId,
                    athleteId,
                  );

                  return {
                    workoutId: workout.workoutId,
                    workoutName: workout.workoutName,
                    wodName: workout.wodName,
                    order: workout.order,
                    result: response[0] ?? null,
                  } satisfies AthleteWorkoutResultView;
                } catch (requestError) {
                  return {
                    workoutId: workout.workoutId,
                    workoutName: workout.workoutName,
                    wodName: workout.wodName,
                    order: workout.order,
                    result: null,
                    error: parseErrorMessage(requestError),
                  } satisfies AthleteWorkoutResultView;
                }
              }),
            );

            return [athleteId, resultRows] as const;
          }),
        );

        if (cancelled) {
          return;
        }

        setTeamAthleteResults(Object.fromEntries(entries));
      } finally {
        if (!cancelled) {
          setTeamAthleteResultsLoading(false);
        }
      }
    }

    void loadTeamAthleteResults();

    return () => {
      cancelled = true;
    };
  }, [divisionMode, selectedTeamId, teamMembers, workoutsForDivision]);

  const leaderboardRows = useMemo<LeaderboardRow[]>(() => {
    const rows =
      divisionMode === "team"
        ? [...(teamBoard?.teams ?? [])]
        : [...(individualBoard?.athletes ?? [])];

    return rows.toSorted(
      (first, second) => rankPoints(first.points) - rankPoints(second.points),
    );
  }, [divisionMode, teamBoard, individualBoard]);

  const filteredLeaderboardRows = useMemo<LeaderboardRow[]>(() => {
    const normalizedQuery = normalizeSearchValue(teamSearchQuery);

    if (divisionMode !== "team" || normalizedQuery.length < 2) {
      return leaderboardRows;
    }

    const searchableTeamIds = new Set<string>();
    const directoryByTeamId = Object.fromEntries(
      teamsDirectory
        .filter(
          (team): team is TeamEntity & { id: string } =>
            typeof team.id === "string" && team.id.trim().length > 0,
        )
        .map((team) => [team.id, team]),
    );

    (teamBoard?.teams ?? []).forEach((team) => {
      if (typeof team.id !== "string" || team.id.trim().length === 0) {
        return;
      }

      const directoryEntry = directoryByTeamId[team.id];
      const teamName = asText(team.name) ?? asText(directoryEntry?.name) ?? "";

      if (normalizeSearchValue(teamName).includes(normalizedQuery)) {
        searchableTeamIds.add(team.id);
        return;
      }

      const members = teamSearchMembersByTeamId[team.id] ?? [];
      const hasAthleteMatch = members.some((member, index) => {
        const memberName = resolveTeamMemberSearchName(member, index);
        return normalizeSearchValue(memberName).includes(normalizedQuery);
      });

      if (hasAthleteMatch) {
        searchableTeamIds.add(team.id);
      }
    });

    return leaderboardRows.filter((row) => searchableTeamIds.has(row.id));
  }, [
    divisionMode,
    leaderboardRows,
    teamBoard,
    teamSearchMembersByTeamId,
    teamSearchQuery,
    teamsDirectory,
  ]);

  const wodColumns = useMemo<WodColumnView[]>(() => {
    if (divisionMode === "team") {
      return (teamBoard?.wods ?? []).map((wodNode, index) => {
        const fallbackLabel = wodNode.wod.name ?? `WOD ${index + 1}`;
        const baseKey = wodNode.wod.id ?? `team-wod-${index}`;
        const catalogWod = wodCatalog.find((wod) => wod.id === wodNode.wod.id);

        const orderedCatalogWorkouts = [...(catalogWod?.workouts ?? [])].sort(
          (first, second) =>
            (first.order ?? Number.MAX_SAFE_INTEGER) -
            (second.order ?? Number.MAX_SAFE_INTEGER),
        );

        const catalogWorkoutNames = orderedCatalogWorkouts
          .map((workout) => workout.name)
          .filter(
            (name): name is string =>
              typeof name === "string" && name.trim().length > 0,
          );

        const teamWorkouts = (wodNode.workouts ?? [])
          .map((workoutNode, workoutIndex) => {
            const workoutId =
              typeof workoutNode.workout?.id === "string" &&
              workoutNode.workout.id.trim().length > 0
                ? workoutNode.workout.id
                : `${baseKey}-workout-${workoutIndex + 1}`;

            const directLabel =
              typeof workoutNode.workout?.name === "string" &&
              workoutNode.workout.name.trim().length > 0
                ? workoutNode.workout.name
                : null;

            const catalogLabelById = orderedCatalogWorkouts.find(
              (workout) => workout.id === workoutNode.workout?.id,
            )?.name;

            const catalogLabelByIndex =
              orderedCatalogWorkouts[workoutIndex]?.name;

            const label =
              directLabel ??
              catalogLabelById ??
              catalogLabelByIndex ??
              `${fallbackLabel} · ${workoutIndex + 1}`;

            const rawTeams = workoutNode.teams;
            const teamRows = Array.isArray(rawTeams)
              ? rawTeams
              : Object.values(rawTeams ?? {});

            const lookup = Object.fromEntries(
              teamRows
                .filter((team): team is LeaderboardTeamRow =>
                  Boolean(
                    team &&
                    typeof team.id === "string" &&
                    team.id.trim().length > 0,
                  ),
                )
                .map((team) => [team.id, team]),
            );

            return {
              key: `${baseKey}-${workoutId}`,
              label,
              lookup,
            };
          })
          .filter((workout) => Object.keys(workout.lookup).length > 0);

        const payloadWorkoutNames = teamWorkouts
          .map((workout) => workout.label)
          .filter(
            (name): name is string =>
              typeof name === "string" && name.trim().length > 0,
          );

        const workoutNames =
          catalogWorkoutNames.length > 0
            ? catalogWorkoutNames
            : payloadWorkoutNames;

        return {
          key: baseKey,
          shortLabel: shortWodLabel(wodNode.wod.name, index),
          fullLabel: fallbackLabel,
          workoutNames,
          teamWorkouts,
          lookup: wodNode.teams ?? {},
        };
      });
    }

    return (individualBoard?.wods ?? []).map((wodNode, index) => ({
      key: wodNode.wod.id ?? `ind-wod-${index}`,
      shortLabel: shortWodLabel(wodNode.wod.name, index),
      fullLabel: wodNode.wod.name ?? `WOD ${index + 1}`,
      lookup: wodNode.athletes ?? {},
    }));
  }, [divisionMode, teamBoard, individualBoard, wodCatalog]);

  const totalEntries = leaderboardRows.length;
  const totalPoints = leaderboardRows.reduce((accumulator, row) => {
    const value = rankPoints(row.points);

    return accumulator + (Number.isFinite(value) ? value : 0);
  }, 0);

  const sortedAthleteResults = useMemo(
    () =>
      athleteResults.toSorted((first, second) => first.order - second.order),
    [athleteResults],
  );

  const applySlug = useCallback(() => {
    const nextSlug = slugInput.trim();

    if (nextSlug.length === 0) {
      setSlugInput(activeSlug);
      setIsSlugEditorOpen(false);
      return;
    }

    if (nextSlug === activeSlug) {
      setIsSlugEditorOpen(false);
      return;
    }

    setSlugInput(nextSlug);
    setActiveSlug(nextSlug);
    setIsSlugEditorOpen(false);
  }, [activeSlug, slugInput]);

  const openSlugEditor = useCallback(() => {
    setSlugInput(activeSlug);
    setIsSlugEditorOpen(true);
  }, [activeSlug]);

  const closeSlugEditor = useCallback(() => {
    setSlugInput(activeSlug);
    setIsSlugEditorOpen(false);
  }, [activeSlug]);

  const setSelectedDivisionId = useCallback((value: string) => {
    setSelectedDivisionIdState(value);
    setTeamSearchQueryState("");
  }, []);

  const setTeamSearchQuery = useCallback((value: string) => {
    setTeamSearchQueryState(value);
  }, []);

  const applyTeamSelection = useCallback((team: LeaderboardTeamRow) => {
    setSelectedTeamId(team.id);
    setSelectedTeamPreview(team);
    setTeamAthleteResults({});
    setTeamAthleteResultsLoading(false);
    setSelectedAthlete(null);
    setAthleteResults([]);
  }, []);

  const selectTeam = useCallback(
    (team: LeaderboardTeamRow) => {
      applyTeamSelection(team);
    },
    [applyTeamSelection],
  );

  const closeTeamPanel = useCallback(() => {
    setSelectedTeamId(null);
    setSelectedTeamPreview(null);
    setSelectedTeamDetail(null);
    setTeamMembers([]);
    setTeamAthleteResults({});
    setTeamAthleteResultsLoading(false);
    setSelectedAthlete(null);
    setAthleteResults([]);
  }, []);

  const openAthletePanel = useCallback(
    (
      athleteId: string,
      name: string,
      country?: string | null,
      userId?: string | null,
    ) => {
      setSelectedAthlete({
        athleteId,
        name,
        country: country ?? null,
        userId: userId ?? null,
      });
    },
    [],
  );

  const closeAthletePanel = useCallback(() => {
    setSelectedAthlete(null);
  }, []);

  return {
    slugInput,
    activeSlug,
    isSlugEditorOpen,
    competition,
    divisions,
    selectedDivisionId,
    selectedDivision,
    divisionMode,
    teamSearchQuery,
    teamRows: teamBoard?.teams ?? [],
    leaderboardRows,
    filteredLeaderboardRows,
    wodColumns,
    teamsDirectory,
    teamSearchMembersByTeamId,
    teamSearchMembersLoading,
    selectedTeamId,
    selectedTeamPreview,
    selectedTeamDetail,
    teamMembers,
    teamAthleteResults,
    teamAthleteResultsLoading,
    selectedAthlete,
    athleteResults,
    sortedAthleteResults,
    bootLoading,
    boardLoading,
    teamLoading,
    athleteLoading,
    error,
    totalEntries,
    totalPoints,
    setSlugInput,
    openSlugEditor,
    closeSlugEditor,
    applySlug,
    setSelectedDivisionId,
    setTeamSearchQuery,
    selectTeam,
    closeTeamPanel,
    openAthletePanel,
    closeAthletePanel,
  };
}
