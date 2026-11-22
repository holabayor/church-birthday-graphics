"use client";

import Link from "next/link";
import { Building2, ChevronRight, SquarePen } from "lucide-react";
import type { ManagedUnit } from "./types";
import { UNIT_ROLE } from "@/lib/unitRoles";
import { getUnitLeader } from "./unit-leadership-summary";
import { Button } from "@/components/ui/button";

interface MobileUnitCardProps {
  unit: ManagedUnit;
  canManage?: boolean;
  onEdit?: (unit: ManagedUnit) => void;
}

export function MobileUnitCard({ unit, canManage, onEdit }: MobileUnitCardProps) {
  const hod = getUnitLeader(unit.members, UNIT_ROLE.HEAD);
  const assistant = getUnitLeader(unit.members, UNIT_ROLE.ASSISTANT);

  return (
    <div className="rounded-2xl border border-[var(--outline-variant)]/60 bg-white p-4 shadow-2xs transition-all hover:border-primary/40">
      <div className="flex items-center justify-between gap-3">
        <Link href={`/units/${unit.id}`} className="flex items-center gap-3.5 min-w-0 flex-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground text-sm truncate">{unit.name}</h3>
              <span className="shrink-0 text-xs text-[var(--on-surface-variant)]">
                · {unit.stats.total_members} {unit.stats.total_members === 1 ? "member" : "members"}
              </span>
            </div>

            <p className="mt-0.5 text-xs text-[var(--on-surface-variant)] truncate">
              {hod ? `HOD: ${hod.first_name} ${hod.last_name}` : "HOD not assigned"}
              {assistant ? ` · Asst: ${assistant.first_name} ${assistant.last_name?.[0] || ""}.` : ""}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-1 shrink-0">
          {canManage && onEdit && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onEdit(unit)}
              className="size-8 rounded-lg text-[var(--outline)] hover:text-primary"
              title="Edit Unit"
            >
              <SquarePen className="size-4" />
            </Button>
          )}
          <Link
            href={`/units/${unit.id}`}
            className="flex size-8 items-center justify-center rounded-lg text-[var(--outline)] hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
