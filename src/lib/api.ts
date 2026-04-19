import type {
  Competition,
  IndividualLeaderboardResponse,
  TeamEntity,
  TeamLeaderboardResponse,
  TeamMember,
  WodCatalogItem,
  WorkoutResult,
} from "@/lib/types";

const API_BASE =
  process.env.NEXT_PUBLIC_CIRCLE21_API_BASE ??
  "https://api.circle21.events/api";

const API_AUTH_TOKEN = process.env.NEXT_PUBLIC_CIRCLE21_AUTH_TOKEN?.trim();

class Circle21Error extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "Circle21Error";
    this.status = status;
  }
}

function parseErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected API error";
}

function buildQuery(
  params: Record<string, string | number | null | undefined>,
): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      searchParams.set(key, String(value));
    }
  });

  return searchParams.toString();
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);

  if (!headers.has("accept")) {
    headers.set("accept", "application/json, text/plain, */*");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    ...init,
    headers,
  });

  if (!response.ok) {
    throw new Circle21Error(
      `Circle21 request failed (${response.status}) for ${path}`,
      response.status,
    );
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new Circle21Error(
      `Invalid JSON from Circle21 for ${path}: ${parseErrorMessage(error)}`,
    );
  }
}

function unwrapData<T>(value: unknown): T {
  if (
    value &&
    typeof value === "object" &&
    "data" in value &&
    (value as { data?: unknown }).data !== undefined
  ) {
    return (value as { data: T }).data;
  }

  return value as T;
}

function unwrapList<T>(value: unknown): T[] {
  const unwrapped = unwrapData<unknown>(value);

  if (Array.isArray(unwrapped)) {
    return unwrapped as T[];
  }

  return [];
}

export function getCircle21ApiBase(): string {
  return API_BASE;
}

export async function fetchCompetitionBySlug(
  slug: string,
): Promise<Competition> {
  return requestJson<Competition>(
    `/competition/slug/${encodeURIComponent(slug)}`,
  );
}

export async function fetchWods(
  competitionId: string,
  perPage = 200,
): Promise<WodCatalogItem[]> {
  const query = buildQuery({
    competition_id: competitionId,
    per_page: perPage,
  });

  const payload = await requestJson<unknown>(`/wods?${query}`);
  return unwrapList<WodCatalogItem>(payload);
}

export async function fetchIndividualLeaderboard(
  competitionId: string,
  divisionId: string,
): Promise<IndividualLeaderboardResponse> {
  const query = buildQuery({
    competition_id: competitionId,
    division_id: divisionId,
  });

  return requestJson<IndividualLeaderboardResponse>(`/leaderboard?${query}`);
}

export async function fetchTeamLeaderboard(
  competitionId: string,
  divisionId: string,
): Promise<TeamLeaderboardResponse> {
  const query = buildQuery({
    competition_id: competitionId,
    division_id: divisionId,
  });

  return requestJson<TeamLeaderboardResponse>(`/leaderboard/team?${query}`);
}

export async function fetchTeams(
  competitionId: string,
  divisionId: string,
  page = 1,
  perPage = 50,
): Promise<TeamEntity[]> {
  const query = buildQuery({
    competition_id: competitionId,
    division_id: divisionId,
    page,
    per_page: perPage,
  });

  const payload = await requestJson<unknown>(`/teams?${query}`);
  return unwrapList<TeamEntity>(payload);
}

export async function fetchTeamDetail(teamId: string): Promise<TeamEntity> {
  const payload = await requestJson<unknown>(`/teams/${teamId}`);
  const maybeObject = unwrapData<unknown>(payload);

  if (Array.isArray(maybeObject)) {
    return (maybeObject[0] ?? { id: teamId }) as TeamEntity;
  }

  if (maybeObject && typeof maybeObject === "object") {
    const entity = maybeObject as TeamEntity;

    return {
      ...entity,
      id: entity.id ?? teamId,
    };
  }

  return { id: teamId };
}

export async function fetchTeamMembers(teamId: string): Promise<TeamMember[]> {
  const endpoint = `/teams/${teamId}/member`;
  const attempts: Array<() => Promise<TeamMember[]>> = [];

  if (API_AUTH_TOKEN) {
    attempts.push(async () => {
      const payload = await requestJson<unknown>(endpoint, {
        headers: {
          authorization: `Bearer ${API_AUTH_TOKEN}`,
        },
      });

      return unwrapList<TeamMember>(payload);
    });
  }

  attempts.push(async () => {
    const payload = await requestJson<unknown>(endpoint);
    return unwrapList<TeamMember>(payload);
  });

  attempts.push(async () => {
    const payload = await requestJson<unknown>(endpoint, {
      credentials: "include",
    });

    return unwrapList<TeamMember>(payload);
  });

  let lastError: unknown = null;

  for (const attempt of attempts) {
    try {
      const members = await attempt();

      if (members.length > 0) {
        return members;
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) {
    throw lastError;
  }

  return [];
}

export async function fetchWorkoutResults(
  workoutId: string,
  athleteId: string,
): Promise<WorkoutResult[]> {
  const query = buildQuery({ athlete_id: athleteId });
  const payload = await requestJson<unknown>(
    `/workouts/${workoutId}/results?${query}`,
  );
  return unwrapList<WorkoutResult>(payload);
}
