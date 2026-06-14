"use client";

import Link from "next/link";
import { Edit2, Trash2, Users } from "lucide-react";
import type { ManagedUnit } from "./types";
import { UNIT_ROLE } from "@/lib/unitRoles";
import { getUnitLeader, getUnitMemberName } from "./unit-leadership-summary";

interface UnitCardProps {
  unit: ManagedUnit;
  onEdit: (unit: ManagedUnit) => void;
  onDelete: (unit: ManagedUnit) => void;
}

export function UnitCard({ unit, onEdit, onDelete }: UnitCardProps) {
  const hod = getUnitLeader(unit.members, UNIT_ROLE.HEAD);
  const assistant = getUnitLeader(unit.members, UNIT_ROLE.ASSISTANT);

  return (
    <div className="group relative flex flex-col gap-4 rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-4 shadow-sm transition-all hover:shadow-md">
      {unit.access.can_manage_details && (
        <div className="absolute top-3 right-3 flex items-center gap-2.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit(unit);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--surface-container-low)] text-[var(--outline)] transition-colors hover:bg-[var(--surface-container-highest)] hover:text-primary"
            title="Edit Unit"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(unit);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--surface-container-low)] text-[var(--outline)] transition-colors hover:bg-red-50 hover:text-red-600"
            title="Delete Unit"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <Link href={`/units/${unit.id}`} className="flex flex-1 flex-col gap-4 text-left">
        <div>
          <h3 className="font-headline text-lg font-bold text-[#0B1C30] leading-tight group-hover:text-primary transition-colors">
            {unit.name}
          </h3>
          <p className="mt-1.5 font-body text-xs text-[var(--on-surface-variant)] line-clamp-2">
            {unit.description || "No description provided."}
          </p>
        </div>

        <div className="mt-auto flex items-center gap-2">
          <div className="flex items-center gap-1 rounded bg-[var(--surface-container)] px-2 py-1 text-primary">
            <Users className="h-3.5 w-3.5" />
            <span className="font-mono text-xs font-semibold">{unit.stats.total_members}</span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--outline)] font-medium">
            Members
          </span>
        </div>

        <div className="border-t border-[var(--outline-variant)] pt-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[var(--outline)] uppercase font-semibold">HOD</span>
            {hod ? (
              <div className="flex items-center gap-1.5 rounded-full bg-[var(--surface-variant)] text-[var(--on-surface-variant)] px-2.5 py-0.5">
                <span className="font-body text-xs font-medium">{getUnitMemberName(hod)}</span>
              </div>
            ) : (
              <span className="font-body text-xs italic text-[var(--outline)]">Unassigned</span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[var(--outline)] uppercase font-semibold">Asst.</span>
            {assistant ? (
              <div className="flex items-center gap-1.5 rounded-full border border-[var(--outline-variant)] bg-[var(--surface-container-low)] text-[var(--on-surface-variant)] px-2.5 py-0.5">
                <span className="font-body text-xs font-medium">{getUnitMemberName(assistant)}</span>
              </div>
            ) : (
              <span className="font-body text-xs italic text-[var(--outline)]">Unassigned</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
