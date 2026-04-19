"use client";

import { ExternalLink } from "lucide-react";

import type { AthletePanelState } from "@/features/leaderboard/types";
import type { AthleteWorkoutResultView } from "@/lib/types";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  formatPoints,
  formatTimeWithMilliseconds,
  parsePoints,
} from "@/features/leaderboard/utils";

interface AthleteResultsDialogProps {
  open: boolean;
  athlete: AthletePanelState | null;
  loading: boolean;
  results: AthleteWorkoutResultView[];
  onOpenChange: (open: boolean) => void;
}

export function AthleteResultsDialog({
  open,
  athlete,
  loading,
  results,
  onOpenChange,
}: Readonly<AthleteResultsDialogProps>) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent side="right" className="overflow-y-auto sm:max-w-[520px]">
        <DrawerHeader>
          <div className="flex items-center justify-between gap-2 pr-8">
            <DrawerTitle>{athlete?.name ?? "Detalle de atleta"}</DrawerTitle>
            <Badge variant="outline">WODs: {results.length}</Badge>
          </div>
          <DrawerDescription>
            ID atleta: {athlete?.athleteId ?? "-"}
          </DrawerDescription>
        </DrawerHeader>

        <CardContent className="space-y-3 px-0 pb-0">
          {loading && (
            <p className="text-sm text-slate-400">Cargando resultados...</p>
          )}

          {!loading && results.length === 0 && (
            <p className="text-sm text-slate-400">
              No se encontraron resultados para este atleta.
            </p>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-3">
              {results.map((entry) => {
                const scoreRaw =
                  entry.result?.score ?? entry.result?.time ?? null;
                const points = entry.result?.points ?? "-";
                const tieBreak = entry.result?.tie_break ?? "-";
                const video = entry.result?.video;
                const repsRaw =
                  entry.result?.reps ?? entry.result?.how_many ?? null;
                const reps = parsePoints(repsRaw);
                const scoreLabel = formatTimeWithMilliseconds(scoreRaw);
                const tieBreakLabel = formatTimeWithMilliseconds(tieBreak);

                return (
                  <Card
                    key={`${entry.workoutId}-${entry.order}`}
                    className="border-slate-800 bg-slate-900/55"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base leading-tight">
                            {entry.wodName}
                          </CardTitle>
                          <CardDescription>{entry.workoutName}</CardDescription>
                        </div>
                        {points !== "-" && (
                          <Badge variant="secondary">
                            {formatPoints(points)} pts
                          </Badge>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-md border border-slate-800 bg-slate-950/40 p-2">
                          <p className="text-xs text-slate-400">Score</p>
                          <p className="font-medium text-slate-100">
                            {scoreLabel}
                          </p>
                        </div>

                        <div className="rounded-md border border-slate-800 bg-slate-950/40 p-2">
                          <p className="text-xs text-slate-400">Tie break</p>
                          <p className="font-medium text-slate-100">
                            {tieBreakLabel}
                          </p>
                        </div>
                      </div>

                      {reps !== null && (
                        <div className="rounded-md border border-slate-800 bg-slate-950/40 p-2">
                          <p className="text-xs text-slate-400">
                            Reps (si no termino)
                          </p>
                          <p className="font-medium text-slate-100">
                            {formatPoints(reps)}
                          </p>
                        </div>
                      )}

                      {video ? (
                        <a
                          href={video}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-medium text-sky-300 hover:text-sky-200"
                        >
                          Abrir video <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <p className="text-xs text-slate-500">
                          Sin video enviado
                        </p>
                      )}

                      {entry.error && (
                        <p className="text-xs text-rose-300">
                          Error: {entry.error}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </DrawerContent>
    </Drawer>
  );
}
