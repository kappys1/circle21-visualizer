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
      <DrawerContent side="right" className="overflow-y-auto sm:max-w-[640px]">
        <DrawerHeader>
          <DrawerTitle>{athlete?.name ?? "Detalle de atleta"}</DrawerTitle>
          <DrawerDescription>
            ID atleta: {athlete?.athleteId ?? "-"}
          </DrawerDescription>
        </DrawerHeader>

        {loading && (
          <p className="text-sm text-slate-400">Cargando resultados...</p>
        )}

        {!loading && results.length === 0 && (
          <p className="text-sm text-slate-400">
            No se encontraron resultados para este atleta.
          </p>
        )}

        {!loading && results.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2">
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
                  className="bg-slate-900/60"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">
                          {entry.wodName}
                        </CardTitle>
                        <CardDescription>{entry.workoutName}</CardDescription>
                      </div>
                      <Badge variant="secondary">
                        {formatPoints(points)} pts
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Score</span>
                      <span className="font-medium">{scoreLabel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tie break</span>
                      <span className="font-medium">{tieBreakLabel}</span>
                    </div>

                    {reps !== null && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">
                          Reps (si no terminó)
                        </span>
                        <span className="font-medium">
                          {formatPoints(reps)}
                        </span>
                      </div>
                    )}

                    {video ? (
                      <a
                        href={video}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-medium text-sky-300 hover:text-sky-200"
                      >
                        Abrir vídeo <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <p className="text-xs text-slate-500">
                        Sin vídeo enviado
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
      </DrawerContent>
    </Drawer>
  );
}
