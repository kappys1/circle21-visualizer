"use client";

import { Check } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";

import type {
  DivisionMode,
  LeaderboardAthleteRow,
  LeaderboardTeamRow,
} from "@/lib/types";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  LeaderboardRow,
  WodColumnView,
} from "@/features/leaderboard/types";
import { formatPoints, rankPoints } from "@/features/leaderboard/utils";
import { cn } from "@/lib/utils";

type SortDirection = "asc" | "desc";
type SortKey = "rank" | "name" | "points" | `wod:${string}`;
type DashboardLanguage = "es" | "en";

interface SortState {
  key: SortKey;
  direction: SortDirection;
}

function toggleDirection(direction: SortDirection): SortDirection {
  return direction === "asc" ? "desc" : "asc";
}

interface LeaderboardTableProps {
  language?: DashboardLanguage;
  mode: DivisionMode;
  rows: LeaderboardRow[];
  rankRows?: LeaderboardRow[];
  wodColumns: WodColumnView[];
  loading: boolean;
  followedTeamIds?: string[];
  finalCount: number | null;
  selectedTeamId: string | null;
  onSelectTeam: (team: LeaderboardTeamRow) => void;
  onSelectAthlete: (
    athleteId: string,
    name: string,
    country?: string | null,
    userId?: string | null,
  ) => void;
}

export function LeaderboardTable({
  language = "es",
  mode,
  rows,
  rankRows,
  wodColumns,
  loading,
  followedTeamIds = [],
  finalCount,
  selectedTeamId,
  onSelectTeam,
  onSelectAthlete,
}: Readonly<LeaderboardTableProps>) {
  const [sortState, setSortState] = useState<SortState>({
    key: "rank",
    direction: "asc",
  });
  const sortLocale = language === "en" ? "en" : "es";
  const copy =
    language === "en"
      ? {
          team: "Team",
          athlete: "Athlete",
          points: "Points",
          updatingLeaderboard: "Updating leaderboard...",
          noParticipants: "No participants for this category.",
          noClub: "No club",
          followedTag: "Following",
          horizontalScrollHint: "Swipe horizontally to see all WODs.",
        }
      : {
          team: "Equipo",
          athlete: "Atleta",
          points: "Puntos",
          updatingLeaderboard: "Actualizando clasificacion...",
          noParticipants: "No hay participantes para esta categoria.",
          noClub: "Sin club",
          followedTag: "Seguido",
          horizontalScrollHint:
            "Desliza horizontalmente para ver todos los WODs.",
        };

  const followedTeamLookup = useMemo(
    () => new Set(followedTeamIds),
    [followedTeamIds],
  );

  const rankLookup = useMemo(() => {
    const rankingSourceRows = rankRows ?? rows;

    return Object.fromEntries(
      rankingSourceRows.map((row, index) => [row.id, index + 1]),
    );
  }, [rankRows, rows]);

  const resolvedSortKey = useMemo<SortKey>(() => {
    if (!sortState.key.startsWith("wod:")) {
      return sortState.key;
    }

    const wodKey = sortState.key.slice(4);
    const exists = wodColumns.some((wodColumn) => wodColumn.key === wodKey);

    return exists ? sortState.key : "rank";
  }, [sortState.key, wodColumns]);

  const sortedRows = useMemo(() => {
    const directionFactor = sortState.direction === "asc" ? 1 : -1;
    const nextRows = [...rows];

    const compareByName = (first: LeaderboardRow, second: LeaderboardRow) =>
      first.name.localeCompare(second.name, sortLocale, {
        sensitivity: "base",
      });

    nextRows.sort((first, second) => {
      if (resolvedSortKey === "name") {
        return directionFactor * compareByName(first, second);
      }

      if (resolvedSortKey === "rank") {
        return (
          directionFactor *
          ((rankLookup[first.id] ?? Number.MAX_SAFE_INTEGER) -
            (rankLookup[second.id] ?? Number.MAX_SAFE_INTEGER))
        );
      }

      if (resolvedSortKey === "points") {
        const firstPoints = rankPoints(first.points);
        const secondPoints = rankPoints(second.points);

        if (firstPoints === secondPoints) {
          return compareByName(first, second);
        }

        return directionFactor * (firstPoints - secondPoints);
      }

      const wodKey = resolvedSortKey.slice(4);
      const wodColumn = wodColumns.find((column) => column.key === wodKey);
      const firstValue = wodColumn?.lookup[first.id]?.points ?? null;
      const secondValue = wodColumn?.lookup[second.id]?.points ?? null;
      const firstPoints = rankPoints(firstValue);
      const secondPoints = rankPoints(secondValue);

      if (firstPoints === secondPoints) {
        return compareByName(first, second);
      }

      return directionFactor * (firstPoints - secondPoints);
    });

    return nextRows;
  }, [
    rows,
    sortState.direction,
    resolvedSortKey,
    rankLookup,
    sortLocale,
    wodColumns,
  ]);

  const cutoffRowId = useMemo(() => {
    if (
      typeof finalCount !== "number" ||
      !Number.isFinite(finalCount) ||
      finalCount <= 0
    ) {
      return null;
    }

    const rankingSourceRows = rankRows ?? rows;
    return rankingSourceRows[finalCount - 1]?.id ?? null;
  }, [rankRows, rows, finalCount]);

  const setSort = (key: SortKey) => {
    setSortState((current) => {
      if (current.key !== key) {
        return { key, direction: "asc" };
      }

      return { key, direction: toggleDirection(current.direction) };
    });
  };

  const sortIndicator = (key: SortKey): string => {
    if (resolvedSortKey !== key) {
      return "";
    }

    return sortState.direction === "asc" ? "ASC" : "DESC";
  };

  const renderSortableHead = ({
    itemKey,
    label,
    sortKey,
    className,
    title,
  }: {
    itemKey?: string;
    label: string;
    sortKey: SortKey;
    className?: string;
    title?: string;
  }): ReactNode => {
    return (
      <TableHead key={itemKey} className={className} title={title}>
        <button
          type="button"
          onClick={() => setSort(sortKey)}
          className="inline-flex items-center gap-2 text-left text-inherit hover:text-slate-200"
        >
          <span>{label}</span>
          <span className="text-[10px] tracking-normal text-slate-500">
            {sortIndicator(sortKey)}
          </span>
        </button>
      </TableHead>
    );
  };

  const colSpan = 3 + wodColumns.length;

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-lg border border-slate-800/80">
      <div className="w-full max-w-full touch-auto overflow-x-auto overflow-y-hidden overscroll-x-contain [-webkit-overflow-scrolling:touch]">
        <Table className="w-full text-sm">
          <TableHeader>
            <TableRow className="bg-slate-950/70">
              {renderSortableHead({
                label: "#",
                sortKey: "rank",
                className: "w-14 whitespace-nowrap",
              })}
              {renderSortableHead({
                label: mode === "team" ? copy.team : copy.athlete,
                sortKey: "name",
                className: "min-w-44",
              })}
              {renderSortableHead({
                label: copy.points,
                sortKey: "points",
                className: "w-24 whitespace-nowrap",
              })}
              {wodColumns.map((wod) =>
                renderSortableHead({
                  itemKey: wod.key,
                  label: wod.shortLabel,
                  sortKey: `wod:${wod.key}`,
                  className: "w-20 whitespace-nowrap",
                  title: wod.fullLabel,
                }),
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading && (
              <TableRow>
                <TableCell
                  colSpan={colSpan}
                  className="py-8 text-center text-slate-400"
                >
                  {copy.updatingLeaderboard}
                </TableCell>
              </TableRow>
            )}

            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={colSpan}
                  className="py-8 text-center text-slate-400"
                >
                  {copy.noParticipants}
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              sortedRows.map((row) => {
                const userId =
                  "user_id" in row && typeof row.user_id === "string"
                    ? row.user_id
                    : null;
                const isSelectedTeam =
                  mode === "team" && selectedTeamId === row.id;
                const isFollowedTeam =
                  mode === "team" && followedTeamLookup.has(row.id);
                const isCutoffRow = cutoffRowId === row.id;
                const rank = rankLookup[row.id] ?? "-";

                const openRowDetail = () => {
                  if (mode === "team") {
                    onSelectTeam(row as LeaderboardTeamRow);
                    return;
                  }

                  onSelectAthlete(
                    (row as LeaderboardAthleteRow).id,
                    row.name,
                    row.country ?? null,
                    userId,
                  );
                };

                return (
                  <TableRow
                    key={row.id}
                    data-state={isSelectedTeam ? "selected" : undefined}
                    className={cn(
                      "group cursor-pointer",
                      isCutoffRow && "border-b-2 border-b-amber-400/90",
                      isFollowedTeam &&
                        "bg-emerald-500/10 ring-1 ring-inset ring-emerald-400/35 hover:bg-emerald-500/15",
                    )}
                    onClick={openRowDetail}
                  >
                    <TableCell className="font-mono text-slate-400">
                      {rank}
                    </TableCell>

                    <TableCell className="min-w-44">
                      <div className="flex items-center gap-2">
                        <p className="whitespace-nowrap font-semibold text-slate-100 group-hover:text-sky-300">
                          {row.name}
                        </p>

                        {isFollowedTeam && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/50 bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-200">
                            <Check className="h-3 w-3" />
                            {copy.followedTag}
                          </span>
                        )}
                      </div>

                      <p className="mt-1 hidden text-xs text-slate-400 md:block">
                        {(row.country ?? "-") +
                          " / " +
                          (row.club_name ?? copy.noClub)}
                      </p>
                    </TableCell>

                    <TableCell className="whitespace-nowrap font-semibold text-sky-300">
                      {formatPoints(row.points)}
                    </TableCell>

                    {wodColumns.map((wod) => {
                      const cell = wod.lookup[row.id];

                      return (
                        <TableCell
                          key={`${row.id}-${wod.key}`}
                          className="whitespace-nowrap text-slate-300"
                        >
                          {cell ? formatPoints(cell.points) : "-"}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>

      <p className="border-t border-slate-800/80 px-3 py-2 text-[11px] text-slate-400 md:hidden">
        {copy.horizontalScrollHint}
      </p>
    </div>
  );
}
