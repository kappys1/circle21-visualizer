"use client";

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
import { TeamDetailCard } from "@/features/leaderboard/components/team-detail-card";
import { useLeaderboardDashboard } from "@/features/leaderboard/hooks/use-leaderboard-dashboard";

export default function Home() {
  const dashboard = useLeaderboardDashboard();
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

  const onSubmit: React.ComponentProps<"form">["onSubmit"] = (event) => {
    event.preventDefault();
    dashboard.applySlug();
  };

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 py-4 md:px-6 md:py-6">
        <Card>
          <CardHeader className="gap-3 pb-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">
                  Circle 21 Visualizer
                </p>
                <CardTitle className="font-(--font-syne) text-2xl md:text-3xl pt-3">
                  Clasificación y detalle live
                </CardTitle>
              </div>

              <div className="flex items-center gap-2">
                {/* <Badge variant="outline">
                  {dashboard.divisionMode === "team"
                    ? "Modo equipos"
                    : "Modo individual"}
                </Badge> */}
                {dashboard.bootLoading && (
                  <Badge variant="secondary">Cargando evento</Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="grid grid-cols-2 gap-2 md:grid-cols-3">
            <Card className="bg-slate-950/40">
              <CardHeader className="gap-2 p-3">
                <CardDescription>Competición</CardDescription>
                <CardTitle className="text-sm leading-tight">
                  {dashboard.competition?.name ??
                    (dashboard.bootLoading ? "Cargando..." : "-")}
                </CardTitle>

                <div className="space-y-2 pt-1">
                  <p className="text-xs text-slate-400">
                    Evento:{" "}
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
                      ¿Cambiar evento?
                    </Button>
                  )}
                </div>
              </CardHeader>
            </Card>

            <Card className="bg-slate-950/40">
              <CardHeader className="p-3">
                <CardDescription>Categoría</CardDescription>
                <CardTitle className="text-sm leading-tight">
                  {dashboard.selectedDivision?.name ?? "-"}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-slate-950/40">
              <CardHeader className="p-3">
                <CardDescription>Participantes</CardDescription>
                <CardTitle className="text-xl">
                  {dashboard.totalEntries}
                </CardTitle>
              </CardHeader>
            </Card>
          </CardContent>

          {dashboard.isSlugEditorOpen && (
            <CardContent className="pt-0">
              <div className="rounded-lg border border-slate-800/70 bg-slate-950/40 p-3">
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
                    aria-label="Slug del evento"
                    autoFocus
                    className="sm:max-w-xl"
                  />

                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" disabled={dashboard.bootLoading}>
                      Cargar evento
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={dashboard.closeSlugEditor}
                    >
                      Cancelar
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

        <section className="grid gap-4">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-2 pb-6">
              <div>
                <CardTitle className="text-2xl">Clasificación</CardTitle>
                <CardDescription></CardDescription>
              </div>
              {dashboard.boardLoading && (
                <Badge variant="secondary">Actualizando</Badge>
              )}
            </CardHeader>

            <CardContent className="gap-4">
              <CategorySelector
                className="mb-6"
                divisions={dashboard.divisions}
                selectedDivisionId={dashboard.selectedDivisionId}
                onDivisionChange={dashboard.setSelectedDivisionId}
              />
              <LeaderboardTable
                mode={dashboard.divisionMode}
                rows={dashboard.leaderboardRows}
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
