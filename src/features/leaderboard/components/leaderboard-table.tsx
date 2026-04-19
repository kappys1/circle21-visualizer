"use client";

import type {
  DivisionMode,
  LeaderboardAthleteRow,
  LeaderboardTeamRow,
} from "@/lib/types";

import { Button } from "@/components/ui/button";
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
import { formatPoints } from "@/features/leaderboard/utils";

interface LeaderboardTableProps {
  mode: DivisionMode;
  rows: LeaderboardRow[];
  wodColumns: WodColumnView[];
  loading: boolean;
  selectedTeamId: string | null;
  onSelectTeam: (team: LeaderboardTeamRow) => void;
  onSelectAthlete: (
    athleteId: string,
    name: string,
    userId?: string | null,
  ) => void;
}

export function LeaderboardTable({
  mode,
  rows,
  wodColumns,
  loading,
  selectedTeamId,
  onSelectTeam,
  onSelectAthlete,
}: Readonly<LeaderboardTableProps>) {
  const colSpan = 3 + wodColumns.length;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-800/80">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-950/70">
            <TableHead className="w-14">#</TableHead>
            <TableHead>{mode === "team" ? "Equipo" : "Atleta"}</TableHead>
            <TableHead className="w-28">Puntos</TableHead>
            {wodColumns.map((wod) => (
              <TableHead key={wod.key} className="w-24" title={wod.fullLabel}>
                {wod.shortLabel}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {loading && (
            <TableRow>
              <TableCell
                colSpan={colSpan}
                className="py-8 text-center text-slate-400"
              >
                Actualizando clasificación...
              </TableCell>
            </TableRow>
          )}

          {!loading && rows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={colSpan}
                className="py-8 text-center text-slate-400"
              >
                No hay participantes para esta categoría.
              </TableCell>
            </TableRow>
          )}

          {!loading &&
            rows.map((row, index) => {
              const userId =
                "user_id" in row && typeof row.user_id === "string"
                  ? row.user_id
                  : null;
              const isSelectedTeam =
                mode === "team" && selectedTeamId === row.id;

              return (
                <TableRow
                  key={row.id}
                  data-state={isSelectedTeam ? "selected" : undefined}
                >
                  <TableCell className="font-mono text-slate-400">
                    {index + 1}
                  </TableCell>

                  <TableCell>
                    {mode === "team" ? (
                      <Button
                        variant="ghost"
                        className="h-auto px-0 py-0 font-semibold text-slate-100 hover:text-sky-300"
                        onClick={() => onSelectTeam(row as LeaderboardTeamRow)}
                      >
                        {row.name}
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        className="h-auto px-0 py-0 font-semibold text-slate-100 hover:text-sky-300"
                        onClick={() =>
                          onSelectAthlete(
                            (row as LeaderboardAthleteRow).id,
                            row.name,
                            userId,
                          )
                        }
                      >
                        {row.name}
                      </Button>
                    )}

                    <p className="mt-1 text-xs text-slate-400">
                      {(row.country ?? "-") +
                        " / " +
                        (row.club_name ?? "Sin club")}
                    </p>
                  </TableCell>

                  <TableCell className="font-semibold text-sky-300">
                    {formatPoints(row.points)}
                  </TableCell>

                  {wodColumns.map((wod) => {
                    const cell = wod.lookup[row.id];

                    return (
                      <TableCell
                        key={`${row.id}-${wod.key}`}
                        className="text-slate-300"
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
  );
}
