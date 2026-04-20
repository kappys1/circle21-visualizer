"use client";

import { Search } from "lucide-react";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { DivisionMode } from "@/lib/types";
import { cn } from "@/lib/utils";

type DashboardLanguage = "es" | "en";

interface TeamAthleteSearchProps {
  language?: DashboardLanguage;
  mode: DivisionMode;
  query: string;
  totalTeamsCount: number;
  visibleTeamsCount: number;
  membersLoading: boolean;
  className?: string;
  onQueryChange: (value: string) => void;
}

function normalizeSearchValue(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "");
}

export function TeamAthleteSearch({
  language = "es",
  mode,
  query,
  totalTeamsCount,
  visibleTeamsCount,
  membersLoading,
  className,
  onQueryChange,
}: Readonly<TeamAthleteSearchProps>) {
  const normalizedQuery = normalizeSearchValue(query);

  const copy = useMemo(
    () =>
      language === "en"
        ? {
            title: "Search team or athlete",
            subtitle: "The table filters by team or athlete name.",
            placeholder: "Example: Rich Froning, Tia-Clair Toomey...",
            inputAriaLabel: "Search team or athlete",
            loadingAthletes: "Indexing athletes...",
            availableForTeamsOnly: "Available only for team categories.",
            showAll: (total: number) => `Showing all teams (${total}).`,
            minLetters: "Type at least 2 letters to filter the table.",
            filtered: (visible: number, total: number) =>
              `Showing ${visible} of ${total} teams in the table.`,
          }
        : {
            title: "Buscar equipo o atleta",
            subtitle: "La tabla se filtra por nombre de equipo o de atleta.",
            placeholder: "Ejemplo: Aniol Ekai, Calum Clements",
            inputAriaLabel: "Buscar equipo o atleta",
            loadingAthletes: "Indexando atletas...",
            availableForTeamsOnly:
              "Disponible cuando la categoria sea de equipos.",
            showAll: (total: number) =>
              `Mostrando todos los equipos (${total}).`,
            minLetters: "Escribe al menos 2 letras para filtrar la tabla.",
            filtered: (visible: number, total: number) =>
              `Mostrando ${visible} de ${total} equipos en la tabla.`,
          },
    [language],
  );

  const statusText = useMemo(() => {
    if (normalizedQuery.length === 0) {
      return copy.showAll(totalTeamsCount);
    }

    if (normalizedQuery.length < 2) {
      return copy.minLetters;
    }

    return copy.filtered(visibleTeamsCount, totalTeamsCount);
  }, [copy, normalizedQuery.length, totalTeamsCount, visibleTeamsCount]);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-slate-400">
          {copy.title}
        </p>
        <p className="text-xs text-slate-500">{copy.subtitle}</p>
      </div>

      {mode === "team" ? (
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={copy.placeholder}
              aria-label={copy.inputAriaLabel}
              className="pl-9"
            />
          </div>

          <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
            <span>{statusText}</span>

            {membersLoading && (
              <Badge variant="secondary" className="h-5 px-2 text-[10px]">
                {copy.loadingAthletes}
              </Badge>
            )}
          </div>
        </>
      ) : (
        <p className="rounded-md border border-slate-800/80 bg-slate-950/45 px-3 py-2 text-xs text-slate-400">
          {copy.availableForTeamsOnly}
        </p>
      )}
    </div>
  );
}
