"use client";

import { ExternalLink } from "lucide-react";

import type { WodColumnView } from "@/features/leaderboard/types";
import type {
  AthleteWorkoutResultView,
  DivisionMode,
  LeaderboardTeamRow,
  TeamEntity,
  TeamMember,
} from "@/lib/types";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { CardContent } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  findFirstText,
  formatPoints,
  formatTimeWithMilliseconds,
  parsePoints,
  rankPoints,
} from "@/features/leaderboard/utils";

interface TeamDetailCardProps {
  mode: DivisionMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  teamsCount: number;
  selectedTeamId: string | null;
  selectedTeamPreview: LeaderboardTeamRow | null;
  selectedTeamDetail: TeamEntity | null;
  teamMembers: TeamMember[];
  teamAthleteResults: Record<string, AthleteWorkoutResultView[]>;
  teamAthleteResultsLoading: boolean;
  wodColumns: WodColumnView[];
}

function asText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function hasMeaningfulValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  return true;
}

function hasWorkoutUpload(entry: AthleteWorkoutResultView): boolean {
  if (!entry.result) {
    return false;
  }

  return (
    hasMeaningfulValue(entry.result.id) ||
    hasMeaningfulValue(entry.result.score) ||
    hasMeaningfulValue(entry.result.time) ||
    hasMeaningfulValue(entry.result.tie_break) ||
    hasMeaningfulValue(entry.result.reps) ||
    hasMeaningfulValue(entry.result.how_many) ||
    hasMeaningfulValue(entry.result.video)
  );
}

export function TeamDetailCard({
  mode,
  open,
  onOpenChange,
  loading,
  teamsCount,
  selectedTeamId,
  selectedTeamPreview,
  selectedTeamDetail,
  teamMembers,
  teamAthleteResults,
  teamAthleteResultsLoading,
  wodColumns,
}: Readonly<TeamDetailCardProps>) {
  if (mode !== "team") {
    return null;
  }

  const teamName =
    findFirstText(selectedTeamDetail?.name, selectedTeamPreview?.name) ??
    "Selecciona un equipo";
  const teamCountry =
    findFirstText(selectedTeamDetail?.country, selectedTeamPreview?.country) ??
    "-";
  const teamClub =
    findFirstText(
      selectedTeamDetail?.club_name,
      selectedTeamPreview?.club_name,
    ) ?? "-";

  const teamCover =
    findFirstText(
      asText(selectedTeamDetail?.cover_avatar),
      asText(selectedTeamDetail?.cover),
      asText(selectedTeamDetail?.logo),
      asText(selectedTeamPreview?.cover_avatar),
      asText(selectedTeamPreview?.cover),
      asText(selectedTeamPreview?.logo),
    ) ?? null;

  const resolveMemberName = (member: TeamMember, index: number): string => {
    const nestedAthlete = member.athlete;
    const nestedUser = nestedAthlete?.user;

    const athleteName = findFirstText(
      member.name,
      asText(member.athlete_name),
      asText(member.full_name),
      asText(member.display_name),
      asText(nestedAthlete?.name),
      asText(nestedAthlete?.athlete_name),
      asText(nestedAthlete?.full_name),
      asText(nestedAthlete?.display_name),
      asText(nestedUser?.name),
    );

    if (athleteName) {
      return athleteName;
    }

    if (member.athlete_id) {
      return `Atleta ${member.athlete_id.slice(0, 8)}`;
    }

    return `Atleta ${index + 1}`;
  };

  const resolveMemberAvatar = (member: TeamMember): string | null => {
    return findFirstText(
      asText(member.avatar_url),
      asText(member.athlete?.avatar_url),
      asText(member.athlete?.user?.avatar),
    );
  };

  const resolveMemberCountry = (member: TeamMember): string => {
    return (
      findFirstText(
        asText(member.country),
        asText(member.athlete?.user?.country),
      ) ?? "-"
    );
  };

  const hasSelectedTeam =
    selectedTeamPreview !== null || selectedTeamDetail !== null;

  const workoutRows = wodColumns.flatMap((column) => {
    const teamWorkouts =
      column.teamWorkouts && column.teamWorkouts.length > 0
        ? column.teamWorkouts
        : [
            {
              key: `${column.key}-aggregate`,
              label: column.fullLabel,
              lookup: column.lookup as Record<string, LeaderboardTeamRow>,
            },
          ];

    return teamWorkouts.map((teamWorkout) => {
      const lookup = teamWorkout.lookup;
      const selectedWodRow = selectedTeamId
        ? lookup[selectedTeamId]
        : undefined;
      const selectedRowData = selectedWodRow as
        | Record<string, unknown>
        | undefined;

      const directRank = parsePoints(
        (selectedRowData?.position as number | string | null | undefined) ??
          null,
      );

      const sortedRows = [...Object.values(lookup)].sort(
        (first, second) => rankPoints(first.points) - rankPoints(second.points),
      );

      const fallbackRank = selectedTeamId
        ? sortedRows.findIndex((row) => row.id === selectedTeamId) + 1
        : 0;

      const scoreSource =
        selectedRowData?.score ??
        selectedRowData?.time ??
        selectedWodRow?.points;
      const tieBreakSource =
        selectedRowData?.tie_break ?? selectedRowData?.tieBreak ?? null;

      const scoreAsTime = formatTimeWithMilliseconds(scoreSource);
      const tieBreakAsTime = formatTimeWithMilliseconds(tieBreakSource);

      const rank =
        directRank !== null && directRank > 0
          ? String(Math.trunc(directRank))
          : fallbackRank > 0
            ? String(fallbackRank)
            : "-";

      return {
        key: teamWorkout.key,
        workout: teamWorkout.label,
        rank,
        score:
          scoreAsTime !== "-" ? scoreAsTime : formatPoints(scoreSource ?? null),
        tieBreak:
          tieBreakAsTime !== "-"
            ? tieBreakAsTime
            : formatPoints(tieBreakSource ?? null),
        points: formatPoints(selectedWodRow?.points ?? null),
      };
    });
  });

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent side="right" className="overflow-y-auto sm:max-w-[640px]">
        <DrawerHeader>
          <div className="flex items-center justify-between gap-2 pr-8">
            <DrawerTitle>{teamName}</DrawerTitle>
            <Badge variant="outline">Equipos: {teamsCount}</Badge>
          </div>
          <DrawerDescription>
            Integrantes, resultados y videos del equipo en un solo panel.
          </DrawerDescription>
        </DrawerHeader>

        <CardContent className="space-y-4 px-0 pb-0">
          {teamCover && (
            <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/40">
              <div
                className="h-44 w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${teamCover})` }}
                aria-label={`Cover de ${teamName}`}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-md border border-slate-800 bg-slate-950/40 p-2">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Pais
              </p>
              <p className="mt-1 font-medium text-slate-100">{teamCountry}</p>
            </div>

            <div className="rounded-md border border-slate-800 bg-slate-950/40 p-2">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Club
              </p>
              <p className="mt-1 font-medium text-slate-100">{teamClub}</p>
            </div>
          </div>

          {loading && (
            <p className="text-sm text-slate-400">
              Cargando detalle de equipo...
            </p>
          )}

          {!loading && !hasSelectedTeam && (
            <p className="text-sm text-slate-400">
              Selecciona un equipo en la tabla para abrir este drawer.
            </p>
          )}

          {!loading && hasSelectedTeam && teamMembers.length === 0 && (
            <p className="text-sm text-slate-400">
              No se pudieron cargar integrantes del equipo para este registro.
            </p>
          )}

          {!loading && hasSelectedTeam && workoutRows.length > 0 && (
            <div className="space-y-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  Results per Workout
                </h3>
                <p className="text-xs text-slate-400">
                  Posicion y puntos del equipo en cada WOD.
                </p>
              </div>

              <div className="overflow-hidden rounded-md border border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-900/60 text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-2 py-2 text-left">Rank</th>
                      <th className="px-2 py-2 text-left">Workout</th>
                      <th className="px-2 py-2 text-left">Score</th>
                      <th className="px-2 py-2 text-left">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workoutRows.map((row) => (
                      <tr key={row.key} className="border-t border-slate-800">
                        <td className="px-2 py-2 text-slate-300">{row.rank}</td>
                        <td className="break-words px-2 py-2 font-medium text-slate-100">
                          {row.workout}
                        </td>
                        <td className="px-2 py-2 text-slate-300">
                          {row.score}
                        </td>
                        <td className="px-2 py-2 text-sky-300">{row.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!loading && teamMembers.length > 0 && (
            <div className="space-y-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  Team Members and Scores
                </h3>
                <p className="text-xs text-slate-400">
                  Cada integrante muestra sus workouts con score, tie break,
                  reps y video.
                </p>
              </div>

              <Accordion type="multiple" className="space-y-2">
                {teamMembers.map((member, index) => {
                  const athleteId = findFirstText(asText(member.athlete_id));
                  const memberName = resolveMemberName(member, index);
                  const memberAvatar = resolveMemberAvatar(member);
                  const memberCountry = resolveMemberCountry(member);
                  const athleteResultEntries = athleteId
                    ? teamAthleteResults[athleteId]
                    : undefined;
                  const athleteResults = athleteResultEntries ?? [];
                  const uploadedCount =
                    athleteResults.filter(hasWorkoutUpload).length;
                  const isAthleteLoading =
                    Boolean(athleteId) &&
                    teamAthleteResultsLoading &&
                    !athleteResultEntries;
                  const totalWorkouts = athleteResults.length;
                  const progressClassName = isAthleteLoading
                    ? "border-slate-500/60 bg-slate-500/10 text-slate-300"
                    : totalWorkouts === 0
                      ? "border-slate-500/60 bg-slate-500/10 text-slate-300"
                      : uploadedCount === 0
                        ? "border-rose-500/60 bg-rose-500/10 text-rose-300"
                        : uploadedCount === totalWorkouts
                          ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300"
                          : "border-amber-500/60 bg-amber-500/10 text-amber-300";
                  const memberKey = `${member.id ?? member.athlete_id ?? index}`;

                  return (
                    <AccordionItem
                      key={memberKey}
                      value={`member-${memberKey}`}
                      className="overflow-hidden rounded-md border border-slate-800 bg-slate-950/40"
                    >
                      <AccordionTrigger className="px-3 py-3 hover:no-underline">
                        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-slate-700 bg-slate-800">
                              {memberAvatar ? (
                                <div
                                  className="h-full w-full bg-cover bg-center"
                                  style={{
                                    backgroundImage: `url(${memberAvatar})`,
                                  }}
                                  aria-label={memberName}
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                                  IMG
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 text-left">
                              <p className="truncate text-sm font-medium text-slate-100">
                                {memberName}
                              </p>
                              <p className="truncate text-xs text-slate-400">
                                {memberCountry}
                              </p>
                            </div>
                          </div>

                          <Badge
                            variant="outline"
                            className={progressClassName}
                          >
                            Subidos: {uploadedCount}/{totalWorkouts}
                          </Badge>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="px-3 pb-3">
                        {!athleteId && (
                          <p className="text-xs text-slate-500">
                            Miembro sin athlete_id disponible.
                          </p>
                        )}

                        {athleteId && isAthleteLoading && (
                          <p className="text-xs text-slate-400">
                            Cargando workouts del integrante...
                          </p>
                        )}

                        {athleteId &&
                          !isAthleteLoading &&
                          athleteResults.length === 0 && (
                            <p className="text-xs text-slate-500">
                              No hay resultados publicados para este integrante.
                            </p>
                          )}

                        {athleteId &&
                          !isAthleteLoading &&
                          athleteResults.length > 0 && (
                            <Accordion type="multiple" className="space-y-2">
                              {athleteResults.map((entry) => {
                                const scoreSource =
                                  entry.result?.score ??
                                  entry.result?.time ??
                                  null;
                                const tieBreakSource =
                                  entry.result?.tie_break ?? null;
                                const scoreAsTime =
                                  formatTimeWithMilliseconds(scoreSource);
                                const tieBreakAsTime =
                                  formatTimeWithMilliseconds(tieBreakSource);
                                const reps = parsePoints(
                                  entry.result?.reps ??
                                    entry.result?.how_many ??
                                    null,
                                );
                                const video = entry.result?.video;
                                const workoutKey = `${memberKey}-${entry.workoutId}-${entry.order}`;
                                const hasUploaded = hasWorkoutUpload(entry);
                                const pointsLabel = formatPoints(
                                  entry.result?.points ?? null,
                                );
                                const showParentWodName =
                                  entry.wodName.trim().length > 0 &&
                                  entry.wodName.trim() !==
                                    entry.workoutName.trim() &&
                                  !entry.wodName.includes(",");

                                const statusLabel = entry.error
                                  ? "Error"
                                  : hasUploaded
                                    ? "Subido"
                                    : "Pendiente";

                                const statusClassName = entry.error
                                  ? "border-rose-500/60 bg-rose-500/10 text-rose-300"
                                  : hasUploaded
                                    ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300"
                                    : "border-amber-500/60 bg-amber-500/10 text-amber-300";

                                return (
                                  <AccordionItem
                                    key={workoutKey}
                                    value={`workout-${workoutKey}`}
                                    className="overflow-hidden rounded-md border border-slate-800/90 bg-slate-950/60"
                                  >
                                    <AccordionTrigger className="px-3 py-2 hover:no-underline">
                                      <div className="flex min-w-0 flex-1 items-start justify-between gap-2 pr-2">
                                        <div className="text-left">
                                          <p className="break-words text-sm font-medium text-slate-100">
                                            {entry.workoutName}
                                          </p>

                                          {showParentWodName && (
                                            <p className="break-words text-xs text-slate-400">
                                              {entry.wodName}
                                            </p>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                          {pointsLabel !== "-" && (
                                            <Badge variant="outline">
                                              {pointsLabel} pts
                                            </Badge>
                                          )}

                                          <Badge
                                            variant="outline"
                                            className={statusClassName}
                                          >
                                            {statusLabel}
                                          </Badge>
                                        </div>
                                      </div>
                                    </AccordionTrigger>

                                    <AccordionContent className="px-3 pb-3">
                                      <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                          <p className="text-xs uppercase tracking-wide text-slate-400">
                                            Score
                                          </p>
                                          <p className="font-medium text-slate-100">
                                            {scoreAsTime !== "-"
                                              ? scoreAsTime
                                              : formatPoints(scoreSource)}
                                          </p>
                                        </div>

                                        <div>
                                          <p className="text-xs uppercase tracking-wide text-slate-400">
                                            Tie break
                                          </p>
                                          <p className="font-medium text-slate-100">
                                            {tieBreakAsTime !== "-"
                                              ? tieBreakAsTime
                                              : formatPoints(tieBreakSource)}
                                          </p>
                                        </div>

                                        <div>
                                          <p className="text-xs uppercase tracking-wide text-slate-400">
                                            Reps (si no termino)
                                          </p>
                                          <p className="font-medium text-slate-100">
                                            {reps !== null
                                              ? formatPoints(reps)
                                              : "-"}
                                          </p>
                                        </div>
                                      </div>

                                      {video ? (
                                        <a
                                          href={video}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-sky-300 hover:text-sky-200"
                                        >
                                          Abrir video{" "}
                                          <ExternalLink className="h-3.5 w-3.5" />
                                        </a>
                                      ) : (
                                        <p className="mt-2 text-xs text-slate-500">
                                          Sin video enviado
                                        </p>
                                      )}

                                      {entry.error && (
                                        <p className="mt-2 text-xs text-rose-300">
                                          Error: {entry.error}
                                        </p>
                                      )}
                                    </AccordionContent>
                                  </AccordionItem>
                                );
                              })}
                            </Accordion>
                          )}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          )}

          {teamAthleteResultsLoading && teamMembers.length > 0 && (
            <p className="text-xs text-slate-400">
              Sincronizando resultados y videos de los integrantes...
            </p>
          )}
        </CardContent>
      </DrawerContent>
    </Drawer>
  );
}
