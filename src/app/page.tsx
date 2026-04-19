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

  const onSubmit: React.ComponentProps<"form">["onSubmit"] = (event) => {
    event.preventDefault();
    dashboard.applySlug();
  };

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <div className="pointer-events-none fixed -left-24 -top-32 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none fixed -right-20 bottom-0 h-80 w-80 rounded-full bg-sky-400/10 blur-3xl" />

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 py-4 md:px-6 md:py-6">
        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">
                  Circle 21 Visualizer
                </p>
                <CardTitle className="font-(--font-syne) text-2xl md:text-3xl">
                  Clasificación y detalle live
                </CardTitle>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {dashboard.divisionMode === "team"
                    ? "Modo equipos"
                    : "Modo individual"}
                </Badge>
                {dashboard.bootLoading && (
                  <Badge variant="secondary">Cargando evento</Badge>
                )}
              </div>
            </div>

            <form
              onSubmit={onSubmit}
              className="flex w-full flex-col gap-2 sm:flex-row"
            >
              <Input
                value={dashboard.slugInput}
                onChange={(event) => dashboard.setSlugInput(event.target.value)}
                placeholder="wodcelona-online-qualifier-2026"
                aria-label="Slug del evento"
                className="sm:max-w-xl"
              />
              <Button
                type="submit"
                className="sm:w-auto"
                disabled={dashboard.bootLoading}
              >
                Cargar evento
              </Button>
            </form>
          </CardHeader>

          <CardContent className="grid grid-cols-2 gap-2 md:grid-cols-3">
            <Card className="bg-slate-950/40">
              <CardHeader className="p-3">
                <CardDescription>Competición</CardDescription>
                <CardTitle className="text-sm leading-tight">
                  {dashboard.competition?.name ??
                    (dashboard.bootLoading ? "Cargando..." : "-")}
                </CardTitle>
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
        </Card>

        {dashboard.error && (
          <Card className="border-rose-400/40 bg-rose-500/10 text-rose-100">
            <CardContent className="p-3 text-sm">{dashboard.error}</CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Selector de categoría</CardTitle>
            <CardDescription>
              Usa un selector único para cambiar de división sin romper flujo
              individual/equipos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CategorySelector
              divisions={dashboard.divisions}
              selectedDivisionId={dashboard.selectedDivisionId}
              onDivisionChange={dashboard.setSelectedDivisionId}
            />
          </CardContent>
        </Card>

        <section className="grid gap-4">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div>
                <CardTitle className="text-lg">Clasificación</CardTitle>
                <CardDescription>
                  Ordenada por puntos ascendentes (los mejores arriba). En modo
                  equipos, haz click en una fila para abrir su drawer.
                </CardDescription>
              </div>
              {dashboard.boardLoading && (
                <Badge variant="secondary">Actualizando</Badge>
              )}
            </CardHeader>

            <CardContent>
              <LeaderboardTable
                mode={dashboard.divisionMode}
                rows={dashboard.leaderboardRows}
                wodColumns={dashboard.wodColumns}
                loading={dashboard.boardLoading}
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
