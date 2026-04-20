"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { CompetitionDivision } from "@/lib/types";
import { cn } from "@/lib/utils";

type DashboardLanguage = "es" | "en";

interface CategorySelectorProps {
  language?: DashboardLanguage;
  divisions: CompetitionDivision[];
  selectedDivisionId: string;
  className?: string;
  onDivisionChange: (value: string) => void;
}

export function CategorySelector({
  language = "es",
  divisions,
  selectedDivisionId,
  className,
  onDivisionChange,
}: Readonly<CategorySelectorProps>) {
  const [open, setOpen] = useState(false);

  const selectedDivision = useMemo(
    () =>
      divisions.find((division) => division.id === selectedDivisionId) ?? null,
    [divisions, selectedDivisionId],
  );

  const individualDivisions = useMemo(
    () => divisions.filter((division) => Number(division.team_size ?? 0) === 0),
    [divisions],
  );

  const teamDivisions = useMemo(
    () => divisions.filter((division) => Number(division.team_size ?? 0) > 0),
    [divisions],
  );

  const handleDivisionChange = (divisionId: string) => {
    onDivisionChange(divisionId);
    setOpen(false);
  };

  const copy =
    language === "en"
      ? {
          title: "Category",
          emptySelection: "Select a category",
          searchPlaceholder: "Search category...",
          emptyResult: "No matching categories.",
          individualHeading: "Individual",
          teamsHeading: "Teams",
        }
      : {
          title: "Categoria",
          emptySelection: "Selecciona una categoria",
          searchPlaceholder: "Buscar categoria...",
          emptyResult: "No hay categorias que coincidan.",
          individualHeading: "Individual",
          teamsHeading: "Equipos",
        };

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs uppercase tracking-wide text-slate-400">
        {copy.title}
      </p>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between border-slate-700 bg-slate-950/70 text-sm font-normal text-slate-100 hover:bg-slate-900 lg:max-w-xl"
          >
            {selectedDivision?.name ?? copy.emptySelection}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-70" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="w-(--radix-popover-trigger-width) p-0"
        >
          <Command>
            <CommandInput placeholder={copy.searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{copy.emptyResult}</CommandEmpty>

              {individualDivisions.length > 0 && (
                <CommandGroup heading={copy.individualHeading}>
                  {individualDivisions.map((division) => (
                    <CommandItem
                      key={division.id}
                      value={`${division.name} ${division.id}`}
                      onSelect={() => handleDivisionChange(division.id)}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4",
                          selectedDivisionId === division.id
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      <span>{division.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {individualDivisions.length > 0 && teamDivisions.length > 0 && (
                <CommandSeparator />
              )}

              {teamDivisions.length > 0 && (
                <CommandGroup heading={copy.teamsHeading}>
                  {teamDivisions.map((division) => (
                    <CommandItem
                      key={division.id}
                      value={`${division.name} ${division.id}`}
                      onSelect={() => handleDivisionChange(division.id)}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4",
                          selectedDivisionId === division.id
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      <span>{division.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
