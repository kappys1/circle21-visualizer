import type { CompetitionDivision, DivisionMode } from "@/lib/types";

const WOD_SHORT_PATTERN = /(\d{2}\.\d[A-Z]?)/i;

function normalizeMilliseconds(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.round(value));
}

export function parseMilliseconds(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return normalizeMilliseconds(value);
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const normalizedNumeric = trimmed.replace("ms", "").replace(",", ".").trim();
  const numericValue = Number(normalizedNumeric);

  if (Number.isFinite(numericValue)) {
    return normalizeMilliseconds(numericValue);
  }

  const normalizedClock = trimmed.replace(",", ".").trim();
  const parts = normalizedClock.split(":");

  if (parts.length !== 2 && parts.length !== 3) {
    return null;
  }

  const secondChunk = Number(parts[parts.length - 1]);

  if (!Number.isFinite(secondChunk)) {
    return null;
  }

  const minutesChunk = Number(parts[parts.length - 2]);

  if (!Number.isFinite(minutesChunk)) {
    return null;
  }

  const hoursChunk = parts.length === 3 ? Number(parts[0]) : 0;

  if (!Number.isFinite(hoursChunk)) {
    return null;
  }

  const totalSeconds = hoursChunk * 3600 + minutesChunk * 60 + secondChunk;
  return normalizeMilliseconds(totalSeconds * 1000);
}

export function formatMillisecondsAsClock(milliseconds: number): string {
  const totalSeconds = Math.max(
    0,
    Math.round(normalizeMilliseconds(milliseconds) / 1000),
  );

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatTimeWithMilliseconds(value: unknown): string {
  const milliseconds = parseMilliseconds(value);

  if (milliseconds === null) {
    return "-";
  }

  return formatMillisecondsAsClock(milliseconds);
}

export function parsePoints(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.replace(",", ".").trim();
    const parsed = Number(normalized);

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function rankPoints(value: unknown): number {
  return parsePoints(value) ?? Number.POSITIVE_INFINITY;
}

export function formatPoints(value: unknown): string {
  const numeric = parsePoints(value);

  if (numeric === null) {
    return "-";
  }

  return numeric.toLocaleString("es-ES", { maximumFractionDigits: 2 });
}

export function parseErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error";
}

export function parseMode(division: CompetitionDivision | null): DivisionMode {
  if (!division) {
    return "individual";
  }

  return Number(division.team_size ?? 0) > 0 ? "team" : "individual";
}

export function shortWodLabel(
  name: string | null | undefined,
  index: number,
): string {
  if (!name) {
    return `WOD ${index + 1}`;
  }

  const match = WOD_SHORT_PATTERN.exec(name);

  if (match) {
    return match[1].toUpperCase();
  }

  return `WOD ${index + 1}`;
}

export function findFirstText(
  ...values: Array<string | null | undefined>
): string | null {
  for (const value of values) {
    if (value && value.trim().length > 0) {
      return value;
    }
  }

  return null;
}

export function findFirstNumber(
  ...values: Array<number | null | undefined>
): number | null {
  for (const value of values) {
    if (value !== null && value !== undefined && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}
