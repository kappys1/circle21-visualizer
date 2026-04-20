"use client";

import { Check, ExternalLink, Sparkles } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

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
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  findFirstText,
  formatCountryWithFlag,
  formatPoints,
  formatTimeWithMilliseconds,
  parsePoints,
  rankPoints,
} from "@/features/leaderboard/utils";
import { cn } from "@/lib/utils";

type DashboardLanguage = "es" | "en";

interface TeamDetailCardProps {
  language?: DashboardLanguage;
  mode: DivisionMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  teamsCount: number;
  selectedTeamGlobalRank: number | null;
  selectedTeamId: string | null;
  selectedTeamPreview: LeaderboardTeamRow | null;
  selectedTeamDetail: TeamEntity | null;
  isSelectedTeamFollowed: boolean;
  onFollowSelectedTeamChange: (followed: boolean) => void;
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
  language = "es",
  mode,
  open,
  onOpenChange,
  loading,
  teamsCount,
  selectedTeamGlobalRank,
  selectedTeamId,
  selectedTeamPreview,
  selectedTeamDetail,
  isSelectedTeamFollowed,
  onFollowSelectedTeamChange,
  teamMembers,
  teamAthleteResults,
  teamAthleteResultsLoading,
  wodColumns,
}: Readonly<TeamDetailCardProps>) {
  const [isCoverExpanded, setIsCoverExpanded] = useState(false);

  if (mode !== "team") {
    return null;
  }

  const copy =
    language === "en"
      ? {
          selectTeam: "Select a team",
          athleteFallback: "Athlete",
          teamsLabel: "Teams",
          drawerDescription: "Members, results and team videos in one panel.",
          expandCoverAria: (name: string) => `Expand cover of ${name}`,
          coverAria: (name: string) => `Cover of ${name}`,
          clickToExpandImage: "Click the image to view it larger",
          country: "Country",
          club: "Club",
          globalRank: "Global rank",
          loadingTeamDetail: "Loading team detail...",
          selectTeamHint: "Select a team from the table to open this drawer.",
          followTeam: "Follow this team",
          followTeamHint:
            "Highlight this team row and keep it synced in your browser.",
          membersLoadFailed: "Could not load team members for this entry.",
          resultsPerWorkout: "Results per workout",
          resultsPerWorkoutHint: "Team rank and points for each WOD.",
          rank: "Rank",
          workout: "Workout",
          score: "Score",
          points: "Points",
          teamMembersAndScores: "Team members and scores",
          teamMembersHint:
            "Each member displays workouts with score, tie break, reps and video.",
          uploaded: "Uploaded",
          memberWithoutAthleteId: "Member without available athlete_id.",
          loadingMemberWorkouts: "Loading member workouts...",
          noMemberResults: "No published results for this member.",
          statusError: "Error",
          statusUploaded: "Uploaded",
          statusPending: "Pending",
          tieBreak: "Tie break",
          repsIfNotFinished: "Reps (if not finished)",
          openVideo: "Open video",
          noVideoSubmitted: "No video submitted",
          error: "Error",
          syncingResults: "Syncing member results and videos...",
          expandedImageOf: (name: string) => `Expanded image of ${name}`,
        }
      : {
          selectTeam: "Selecciona un equipo",
          athleteFallback: "Atleta",
          teamsLabel: "Equipos",
          drawerDescription:
            "Integrantes, resultados y videos del equipo en un solo panel.",
          expandCoverAria: (name: string) => `Ampliar cover de ${name}`,
          coverAria: (name: string) => `Cover de ${name}`,
          clickToExpandImage: "Click en la imagen para verla en grande",
          country: "Pais",
          club: "Club",
          globalRank: "Posicion global",
          loadingTeamDetail: "Cargando detalle de equipo...",
          selectTeamHint:
            "Selecciona un equipo en la tabla para abrir este drawer.",
          followTeam: "Seguir este equipo",
          followTeamHint: "Resalta esta fila y lo guarda en tu navegador.",
          membersLoadFailed:
            "No se pudieron cargar integrantes del equipo para este registro.",
          resultsPerWorkout: "Resultados por workout",
          resultsPerWorkoutHint: "Posicion y puntos del equipo en cada WOD.",
          rank: "Rank",
          workout: "Workout",
          score: "Score",
          points: "Points",
          teamMembersAndScores: "Integrantes y resultados",
          teamMembersHint:
            "Cada integrante muestra sus workouts con score, tie break, reps y video.",
          uploaded: "Subidos",
          memberWithoutAthleteId: "Miembro sin athlete_id disponible.",
          loadingMemberWorkouts: "Cargando workouts del integrante...",
          noMemberResults: "No hay resultados publicados para este integrante.",
          statusError: "Error",
          statusUploaded: "Subido",
          statusPending: "Pendiente",
          tieBreak: "Tie break",
          repsIfNotFinished: "Reps (si no termino)",
          openVideo: "Abrir video",
          noVideoSubmitted: "Sin video enviado",
          error: "Error",
          syncingResults:
            "Sincronizando resultados y videos de los integrantes...",
          expandedImageOf: (name: string) => `Imagen ampliada de ${name}`,
        };

  const teamName =
    findFirstText(selectedTeamDetail?.name, selectedTeamPreview?.name) ??
    copy.selectTeam;
  const teamCountry =
    findFirstText(selectedTeamDetail?.country, selectedTeamPreview?.country) ??
    "-";
  const teamCountryLabel = formatCountryWithFlag(teamCountry);
  const teamClub =
    findFirstText(
      selectedTeamDetail?.club_name,
      selectedTeamPreview?.club_name,
    ) ?? "-";
  const teamGlobalRankLabel =
    typeof selectedTeamGlobalRank === "number" && selectedTeamGlobalRank > 0
      ? `#${Math.trunc(selectedTeamGlobalRank)}`
      : "-";

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
      return `${copy.athleteFallback} ${member.athlete_id.slice(0, 8)}`;
    }

    return `${copy.athleteFallback} ${index + 1}`;
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

      const sortedRows = Object.values(lookup).toSorted(
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

      let rank = "-";

      if (directRank !== null && directRank > 0) {
        rank = String(Math.trunc(directRank));
      } else if (fallbackRank > 0) {
        rank = String(fallbackRank);
      }

      const formattedScore =
        scoreAsTime === "-" ? formatPoints(scoreSource ?? null) : scoreAsTime;
      const formattedTieBreak =
        tieBreakAsTime === "-"
          ? formatPoints(tieBreakSource ?? null)
          : tieBreakAsTime;

      return {
        key: teamWorkout.key,
        workout: teamWorkout.label,
        rank,
        score: formattedScore,
        tieBreak: formattedTieBreak,
        points: formatPoints(selectedWodRow?.points ?? null),
      };
    });
  });

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent side="right" className="overflow-y-auto sm:max-w-160">
        <DrawerHeader>
          <div className="flex items-center justify-between gap-2 pr-8">
            <DrawerTitle>{teamName}</DrawerTitle>
            <Badge variant="outline">
              {copy.teamsLabel}: {teamsCount}
            </Badge>
          </div>
          <DrawerDescription>{copy.drawerDescription}</DrawerDescription>

          {selectedTeamId && (
            <div className="relative overflow-hidden rounded-xl border border-emerald-400/30 bg-linear-to-r from-emerald-500/18 via-cyan-500/12 to-slate-950">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-8 top-1/2 h-20 w-24 -translate-y-1/2 rounded-full bg-emerald-300/20 blur-2xl"
              />

              <label className="relative flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={isSelectedTeamFollowed}
                  onChange={(event) =>
                    onFollowSelectedTeamChange(event.target.checked)
                  }
                  className="peer sr-only"
                  aria-label={copy.followTeam}
                />

                <span className="space-y-0.5">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-emerald-100">
                    {isSelectedTeamFollowed ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    {copy.followTeam}
                  </span>

                  <span className="block text-[11px] text-slate-200">
                    {copy.followTeamHint}
                  </span>
                </span>

                <span
                  className={cn(
                    "inline-flex h-7 w-12 items-center rounded-full border p-1 transition-colors",
                    isSelectedTeamFollowed
                      ? "border-emerald-300/60 bg-emerald-400/30"
                      : "border-slate-600/80 bg-slate-900/70",
                  )}
                >
                  <span
                    className={cn(
                      "h-5 w-5 rounded-full shadow transition-transform duration-200",
                      isSelectedTeamFollowed
                        ? "translate-x-5 bg-emerald-100"
                        : "translate-x-0 bg-slate-300",
                    )}
                  />
                </span>
              </label>
            </div>
          )}
        </DrawerHeader>

        <CardContent className="space-y-4 px-0 pb-0">
          {teamCover && (
            <button
              type="button"
              className="w-full overflow-hidden rounded-lg border border-slate-800 bg-slate-900/40 text-left transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              onClick={() => setIsCoverExpanded(true)}
              aria-label={copy.expandCoverAria(teamName)}
            >
              <div
                className="h-44 w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${teamCover})` }}
                aria-label={copy.coverAria(teamName)}
              />

              <p className="px-3 py-2 text-xs text-slate-400">
                {copy.clickToExpandImage}
              </p>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="col-span-2 rounded-md border border-cyan-500/35 bg-linear-to-r from-cyan-500/12 via-slate-950/80 to-slate-950/80 p-2">
              <p className="text-xs uppercase tracking-wide text-cyan-300/90">
                {copy.globalRank}
              </p>
              <p className="mt-1 text-lg font-semibold text-cyan-100">
                {teamGlobalRankLabel}
              </p>
            </div>
            <div className="rounded-md border border-slate-800 bg-slate-950/40 p-2">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                {copy.country}
              </p>
              <p className="mt-1 font-medium text-slate-100">
                {teamCountryLabel}
              </p>
            </div>

            <div className="rounded-md border border-slate-800 bg-slate-950/40 p-2">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                {copy.club}
              </p>
              <p className="mt-1 font-medium text-slate-100">{teamClub}</p>
            </div>
          </div>

          {loading && (
            <p className="text-sm text-slate-400">{copy.loadingTeamDetail}</p>
          )}

          {!loading && !hasSelectedTeam && (
            <p className="text-sm text-slate-400">{copy.selectTeamHint}</p>
          )}

          {!loading && hasSelectedTeam && teamMembers.length === 0 && (
            <p className="text-sm text-slate-400">{copy.membersLoadFailed}</p>
          )}

          {!loading && hasSelectedTeam && workoutRows.length > 0 && (
            <div className="space-y-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  {copy.resultsPerWorkout}
                </h3>
                <p className="text-xs text-slate-400">
                  {copy.resultsPerWorkoutHint}
                </p>
              </div>

              <div className="overflow-hidden rounded-md border border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-900/60 text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-2 py-2 text-left">{copy.rank}</th>
                      <th className="px-2 py-2 text-left">{copy.workout}</th>
                      <th className="px-2 py-2 text-left">{copy.score}</th>
                      <th className="px-2 py-2 text-left">{copy.points}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workoutRows.map((row) => (
                      <tr key={row.key} className="border-t border-slate-800">
                        <td className="px-2 py-2 text-slate-300">{row.rank}</td>
                        <td className="wrap-break-word px-2 py-2 font-medium text-slate-100">
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
                  {copy.teamMembersAndScores}
                </h3>
                <p className="text-xs text-slate-400">{copy.teamMembersHint}</p>
              </div>

              <Accordion type="multiple" className="space-y-2">
                {teamMembers.map((member, index) => {
                  const athleteId = findFirstText(asText(member.athlete_id));
                  const memberName = resolveMemberName(member, index);
                  const memberAvatar = resolveMemberAvatar(member);
                  const memberCountry = resolveMemberCountry(member);
                  const memberCountryLabel =
                    formatCountryWithFlag(memberCountry);
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
                  let progressClassName =
                    "border-slate-500/60 bg-slate-500/10 text-slate-300";

                  if (!isAthleteLoading && totalWorkouts > 0) {
                    if (uploadedCount === 0) {
                      progressClassName =
                        "border-rose-500/60 bg-rose-500/10 text-rose-300";
                    } else if (uploadedCount === totalWorkouts) {
                      progressClassName =
                        "border-emerald-500/60 bg-emerald-500/10 text-emerald-300";
                    } else {
                      progressClassName =
                        "border-amber-500/60 bg-amber-500/10 text-amber-300";
                    }
                  }
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
                                {memberCountryLabel}
                              </p>
                            </div>
                          </div>

                          <Badge
                            variant="outline"
                            className={progressClassName}
                          >
                            {copy.uploaded}: {uploadedCount}/{totalWorkouts}
                          </Badge>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="px-3 pb-3">
                        {!athleteId && (
                          <p className="text-xs text-slate-500">
                            {copy.memberWithoutAthleteId}
                          </p>
                        )}

                        {athleteId && isAthleteLoading && (
                          <p className="text-xs text-slate-400">
                            {copy.loadingMemberWorkouts}
                          </p>
                        )}

                        {athleteId &&
                          !isAthleteLoading &&
                          athleteResults.length === 0 && (
                            <p className="text-xs text-slate-500">
                              {copy.noMemberResults}
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
                                let statusLabel = entry.error
                                  ? copy.statusError
                                  : copy.statusPending;
                                let statusClassName = entry.error
                                  ? "border-rose-500/60 bg-rose-500/10 text-rose-300"
                                  : "border-amber-500/60 bg-amber-500/10 text-amber-300";

                                if (!entry.error && hasUploaded) {
                                  statusLabel = copy.statusUploaded;
                                  statusClassName =
                                    "border-emerald-500/60 bg-emerald-500/10 text-emerald-300";
                                }

                                const scoreText =
                                  scoreAsTime === "-"
                                    ? formatPoints(scoreSource)
                                    : scoreAsTime;
                                const tieBreakText =
                                  tieBreakAsTime === "-"
                                    ? formatPoints(tieBreakSource)
                                    : tieBreakAsTime;
                                const repsText =
                                  reps === null ? "-" : formatPoints(reps);

                                return (
                                  <AccordionItem
                                    key={workoutKey}
                                    value={`workout-${workoutKey}`}
                                    className="overflow-hidden rounded-md border border-slate-800/90 bg-slate-950/60"
                                  >
                                    <AccordionTrigger className="px-3 py-2 hover:no-underline">
                                      <div className="flex min-w-0 flex-1 items-start justify-between gap-2 pr-2">
                                        <div className="text-left">
                                          <p className="wrap-break-word text-sm font-medium text-slate-100">
                                            {entry.workoutName}
                                          </p>

                                          {showParentWodName && (
                                            <p className="wrap-break-word text-xs text-slate-400">
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
                                            {scoreText}
                                          </p>
                                        </div>

                                        <div>
                                          <p className="text-xs uppercase tracking-wide text-slate-400">
                                            {copy.tieBreak}
                                          </p>
                                          <p className="font-medium text-slate-100">
                                            {tieBreakText}
                                          </p>
                                        </div>

                                        <div>
                                          <p className="text-xs uppercase tracking-wide text-slate-400">
                                            {copy.repsIfNotFinished}
                                          </p>
                                          <p className="font-medium text-slate-100">
                                            {repsText}
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
                                          {copy.openVideo}{" "}
                                          <ExternalLink className="h-3.5 w-3.5" />
                                        </a>
                                      ) : (
                                        <p className="mt-2 text-xs text-slate-500">
                                          {copy.noVideoSubmitted}
                                        </p>
                                      )}

                                      {entry.error && (
                                        <p className="mt-2 text-xs text-rose-300">
                                          {copy.error}: {entry.error}
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
            <p className="text-xs text-slate-400">{copy.syncingResults}</p>
          )}
        </CardContent>
      </DrawerContent>

      {teamCover && (
        <Dialog open={isCoverExpanded} onOpenChange={setIsCoverExpanded}>
          <DialogContent className="w-[min(96vw,1200px)] max-w-none border-slate-700 bg-slate-950/95 p-3 sm:p-4">
            <DialogTitle className="sr-only">
              {copy.expandedImageOf(teamName)}
            </DialogTitle>

            <Image
              src={teamCover}
              alt={copy.coverAria(teamName)}
              width={1600}
              height={900}
              unoptimized
              className="max-h-[88dvh] w-full rounded-lg border border-slate-700 object-contain shadow-2xl"
            />
          </DialogContent>
        </Dialog>
      )}
    </Drawer>
  );
}
