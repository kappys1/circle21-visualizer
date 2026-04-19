"use client";

import type { CompetitionDivision } from "@/lib/types";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CategorySelectorProps {
  divisions: CompetitionDivision[];
  selectedDivisionId: string;
  onDivisionChange: (value: string) => void;
}

export function CategorySelector({
  divisions,
  selectedDivisionId,
  onDivisionChange,
}: Readonly<CategorySelectorProps>) {
  const individualDivisions = divisions.filter(
    (division) => Number(division.team_size ?? 0) === 0,
  );

  const teamDivisions = divisions.filter(
    (division) => Number(division.team_size ?? 0) > 0,
  );

  return (
    <div className="w-full space-y-2">
      <p className="text-xs uppercase tracking-wide text-slate-400">
        Categoría
      </p>

      <Select
        value={selectedDivisionId || undefined}
        onValueChange={onDivisionChange}
      >
        <SelectTrigger className="w-full lg:max-w-xl">
          <SelectValue placeholder="Selecciona una categoría" />
        </SelectTrigger>

        <SelectContent>
          {individualDivisions.length > 0 && (
            <SelectGroup>
              <SelectLabel>Individual</SelectLabel>
              {individualDivisions.map((division) => (
                <SelectItem key={division.id} value={division.id}>
                  {division.name}
                </SelectItem>
              ))}
            </SelectGroup>
          )}

          {teamDivisions.length > 0 && (
            <SelectGroup>
              <SelectLabel>Equipos</SelectLabel>
              {teamDivisions.map((division) => (
                <SelectItem key={division.id} value={division.id}>
                  {division.name}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
