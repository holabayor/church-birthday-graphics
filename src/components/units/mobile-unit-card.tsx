"use client";

import Link from "next/link";
import { Building2, ChevronRight } from "lucide-react";
import type { ManagedUnit } from "./types";
import { UNIT_ROLE } from "@/lib/unitRoles";
import { getUnitLeader } from "./unit-leadership-summary";

interface MobileUnitCardProps {
  unit: ManagedUnit;
}

export function MobileUnitCard({ unit }: MobileUnitCardProps) {
  const hod = getUnitLeader(unit.members, UNIT_ROLE.HEAD);

  return (
    <Link
      href={`/units/${unit.id}`}
      className="flex items-center justify-between rounded-2xl border border-[var(--outline-variant)] bg-white p-4 shadow-sm transition-all hover:bg-[var(--surface-container-low)]"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Building2 className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-[#0B1C30] truncate">{unit.name}</h3>
            {hod ? (
              <span className="bg-primary text-[12px] text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider truncate max-w-[150px]">
                HOD: {hod.first_name} {hod.last_name?.[0]}.
              </span>
            ) : (
              <span className="bg-gray-400 text-[12px] text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                No HOD
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--on-surface-variant)] mt-0.5">
            {unit.stats.total_members} {unit.stats.total_members === 1 ? "Member" : "Members"}
          </p>
        </div>
      </div>
      <div className="text-[var(--outline)] shrink-0">
        <ChevronRight className="h-5 w-5" />
      </div>
    </Link>
  );
}
