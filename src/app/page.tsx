"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AthleteResultsDialog } from "@/features/leaderboard/components/athlete-results-dialog";
import { CategorySelector } from "@/features/leaderboard/components/category-selector";
import { LeaderboardTable } from "@/features/leaderboard/components/leaderboard-table";
import { TeamAthleteSearch } from "@/features/leaderboard/components/team-athlete-search";
import { TeamDetailCard } from "@/features/leaderboard/components/team-detail-card";
import { useLeaderboardDashboard } from "@/features/leaderboard/hooks/use-leaderboard-dashboard";
import { cn } from "@/lib/utils";

type DashboardLanguage = "es" | "en";

const LANGUAGE_QUERY_PARAM = "lang";
const LANGUAGE_STORAGE_KEY = "wodcelona:language";

function resolveLanguageFromValue(
  value: string | null,
): DashboardLanguage | null {
  if (!value) {
    return null;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue.startsWith("en")) {
    return "en";
  }

  if (normalizedValue.startsWith("es")) {
    return "es";
  }

  return null;
}

export default function Home() {
  const dashboard = useLeaderboardDashboard();
  const [language, setLanguage] = useState<DashboardLanguage>(() => {
    if (globalThis.window === undefined) {
      return "es";
    }

    const searchParams = new URLSearchParams(globalThis.window.location.search);
    const queryLanguage = resolveLanguageFromValue(
      searchParams.get(LANGUAGE_QUERY_PARAM),
    );
    const storageLanguage = resolveLanguageFromValue(
      globalThis.window.localStorage.getItem(LANGUAGE_STORAGE_KEY),
    );

    return queryLanguage ?? storageLanguage ?? "es";
  });
  const finalCountRaw = dashboard.selectedDivision?.final_count;
  let finalCount: number | null = null;

  if (typeof finalCountRaw === "number") {
    finalCount = finalCountRaw;
  } else if (
    typeof finalCountRaw === "string" &&
    finalCountRaw.trim().length > 0
  ) {
    const parsedFinalCount = Number(finalCountRaw);
    finalCount = Number.isFinite(parsedFinalCount) ? parsedFinalCount : null;
  }

  useEffect(() => {
    if (globalThis.window === undefined) {
      return;
    }

    globalThis.document.documentElement.lang = language;

    try {
      globalThis.window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Ignore storage errors (privacy mode, disabled storage, etc.).
    }

    const currentUrl = new URL(globalThis.window.location.href);

    if (currentUrl.searchParams.get(LANGUAGE_QUERY_PARAM) === language) {
      return;
    }

    currentUrl.searchParams.set(LANGUAGE_QUERY_PARAM, language);

    globalThis.window.history.replaceState(
      globalThis.window.history.state,
      "",
      `${currentUrl.pathname}?${currentUrl.searchParams.toString()}${currentUrl.hash}`,
    );
  }, [language]);

  const copy = useMemo(
    () =>
      language === "en"
        ? {
            loadingEvent: "Loading event",
            competition: "Competition",
            category: "Category",
            participants: "Participants",
            loadingValue: "Loading...",
            event: "Event",
            changeEvent: "Change event",
            eventSlugAriaLabel: "Event slug",
            loadEvent: "Load event",
            cancel: "Cancel",
            leaderboard: "Leaderboard",
            updating: "Updating",
            languageGroupAriaLabel: "Language selector",
            languageLabel: "Language",
          }
        : {
            loadingEvent: "Cargando evento",
            competition: "Competicion",
            category: "Categoria",
            participants: "Participantes",
            loadingValue: "Cargando...",
            event: "Evento",
            changeEvent: "Cambiar evento",
            eventSlugAriaLabel: "Slug del evento",
            loadEvent: "Cargar evento",
            cancel: "Cancelar",
            leaderboard: "Clasificacion",
            updating: "Actualizando",
            languageGroupAriaLabel: "Selector de idioma",
            languageLabel: "Idioma",
          },
    [language],
  );

  const onSubmit: React.ComponentProps<"form">["onSubmit"] = (event) => {
    event.preventDefault();
    dashboard.applySlug();
  };

  return (
    <div className="relative min-h-dvh">
      <main className="relative z-10 mx-auto flex min-w-0 w-full max-w-7xl flex-col gap-4 px-3 py-4 md:px-6 md:py-6">
        <Card>
          <CardHeader className="gap-3 pb-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle className="font-(--font-syne) text-2xl md:text-3xl pt-3 uppercase tracking-[0.18em] text-cyan-300">
                  Circle 21 Visualizer
                </CardTitle>
              </div>

              <div className="flex items-center gap-2">
                <fieldset className="flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/70 p-1">
                  <legend className="sr-only">
                    {copy.languageGroupAriaLabel}
                  </legend>
                  <span className="px-2 text-[11px] uppercase tracking-wide text-slate-400">
                    {copy.languageLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => setLanguage("es")}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide transition",
                      language === "es"
                        ? "bg-cyan-500/20 text-cyan-200"
                        : "text-slate-400 hover:text-slate-200",
                    )}
                    aria-pressed={language === "es"}
                  >
                    ES
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage("en")}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide transition",
                      language === "en"
                        ? "bg-cyan-500/20 text-cyan-200"
                        : "text-slate-400 hover:text-slate-200",
                    )}
                    aria-pressed={language === "en"}
                  >
                    EN
                  </button>
                </fieldset>

                {/* <Badge variant="outline">
                  {dashboard.divisionMode === "team"
                    ? "Modo equipos"
                    : "Modo individual"}
                </Badge> */}
                {dashboard.bootLoading && (
                  <Badge variant="secondary">{copy.loadingEvent}</Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
            <Card className="bg-slate-950/85">
              <CardHeader className="gap-2 p-3">
                <CardDescription>{copy.competition}</CardDescription>
                <CardTitle className="text-sm leading-tight">
                  {dashboard.competition?.name ??
                    (dashboard.bootLoading ? copy.loadingValue : "-")}
                </CardTitle>

                <div className="space-y-2 pt-1">
                  <p className="text-xs text-slate-400">
                    {copy.event}:{" "}
                    <span className="font-mono">{dashboard.activeSlug}</span>
                  </p>

                  {!dashboard.isSlugEditorOpen && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={dashboard.openSlugEditor}
                      className="h-7 w-fit px-2 text-cyan-200 hover:bg-cyan-500/10 hover:text-cyan-100"
                    >
                      {copy.changeEvent}
                    </Button>
                  )}
                </div>
              </CardHeader>
            </Card>

            <Card className="bg-slate-950/85">
              <CardHeader className="p-3">
                <CardDescription>{copy.category}</CardDescription>
                <CardTitle className="text-sm leading-tight">
                  {dashboard.selectedDivision?.name ?? "-"}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-slate-950/85 sm:col-span-2 md:col-span-1">
              <CardHeader className="p-3">
                <CardDescription>{copy.participants}</CardDescription>
                <CardTitle className="text-xl">
                  {dashboard.totalEntries}
                </CardTitle>
              </CardHeader>
            </Card>
          </CardContent>

          {dashboard.isSlugEditorOpen && (
            <CardContent className="pt-0">
              <div className="rounded-lg border border-slate-800/70 bg-slate-950/85 p-3">
                <form
                  onSubmit={onSubmit}
                  className="flex flex-col gap-2 sm:flex-row sm:items-center"
                >
                  <Input
                    value={dashboard.slugInput}
                    onChange={(event) =>
                      dashboard.setSlugInput(event.target.value)
                    }
                    placeholder="wodcelona-online-qualifier-2026"
                    aria-label={copy.eventSlugAriaLabel}
                    autoFocus
                    className="sm:max-w-xl"
                  />

                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" disabled={dashboard.bootLoading}>
                      {copy.loadEvent}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={dashboard.closeSlugEditor}
                    >
                      {copy.cancel}
                    </Button>
                  </div>
                </form>
              </div>
            </CardContent>
          )}
        </Card>

        {dashboard.error && (
          <Card className="border-rose-400/40 bg-rose-500/10 text-rose-100">
            <CardContent className="p-3 text-sm">{dashboard.error}</CardContent>
          </Card>
        )}

        <section className="grid min-w-0 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-2 pb-6">
              <div>
                <CardTitle className="text-2xl">{copy.leaderboard}</CardTitle>
                <CardDescription></CardDescription>
              </div>
              {dashboard.boardLoading && (
                <Badge variant="secondary">{copy.updating}</Badge>
              )}
            </CardHeader>

            <CardContent className="min-w-0 gap-4">
              <CategorySelector
                className="mb-4"
                language={language}
                divisions={dashboard.divisions}
                selectedDivisionId={dashboard.selectedDivisionId}
                onDivisionChange={dashboard.setSelectedDivisionId}
              />
              <TeamAthleteSearch
                className="mb-6"
                language={language}
                mode={dashboard.divisionMode}
                membersLoading={dashboard.teamSearchMembersLoading}
                query={dashboard.teamSearchQuery}
                totalTeamsCount={dashboard.teamRows.length}
                visibleTeamsCount={
                  dashboard.divisionMode === "team"
                    ? dashboard.filteredLeaderboardRows.length
                    : 0
                }
                onQueryChange={dashboard.setTeamSearchQuery}
              />
              <LeaderboardTable
                language={language}
                mode={dashboard.divisionMode}
                rows={dashboard.filteredLeaderboardRows}
                rankRows={dashboard.leaderboardRows}
                wodColumns={dashboard.wodColumns}
                loading={dashboard.boardLoading}
                finalCount={
                  typeof finalCount === "number" && Number.isFinite(finalCount)
                    ? finalCount
                    : null
                }
                selectedTeamId={dashboard.selectedTeamId}
                onSelectTeam={dashboard.selectTeam}
                onSelectAthlete={dashboard.openAthletePanel}
              />
            </CardContent>
          </Card>
        </section>
      </main>

      <TeamDetailCard
        language={language}
        mode={dashboard.divisionMode}
        open={
          dashboard.divisionMode === "team" && Boolean(dashboard.selectedTeamId)
        }
        onOpenChange={(open) => {
          if (!open) {
            dashboard.closeTeamPanel();
          }
        }}
        loading={dashboard.teamLoading}
        teamsCount={dashboard.teamsDirectory.length}
        selectedTeamId={dashboard.selectedTeamId}
        selectedTeamPreview={dashboard.selectedTeamPreview}
        selectedTeamDetail={dashboard.selectedTeamDetail}
        teamMembers={dashboard.teamMembers}
        teamAthleteResults={dashboard.teamAthleteResults}
        teamAthleteResultsLoading={dashboard.teamAthleteResultsLoading}
        wodColumns={dashboard.wodColumns}
      />

      {dashboard.divisionMode !== "team" && (
        <AthleteResultsDialog
          language={language}
          open={Boolean(dashboard.selectedAthlete)}
          athlete={dashboard.selectedAthlete}
          loading={dashboard.athleteLoading}
          results={dashboard.sortedAthleteResults}
          onOpenChange={(open) => {
            if (!open) {
              dashboard.closeAthletePanel();
            }
          }}
        />
      )}
    </div>
  );
}
