"use client";

import { ShieldCheck, Users } from "lucide-react";
import type { ManagedUnit } from "./types";
import { UNIT_ROLE } from "@/lib/unitRoles";
import { getUnitLeader, getUnitMemberName } from "./unit-leadership-summary";

interface UnitWorkspaceStatsProps {
  unit: ManagedUnit;
}

export function UnitWorkspaceStats({ unit }: UnitWorkspaceStatsProps) {
  const hod = getUnitLeader(unit.members, UNIT_ROLE.HEAD);
  const assistant = getUnitLeader(unit.members, UNIT_ROLE.ASSISTANT);

  return (
    <section className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:gap-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* Total Members Card */}
      <div className="flex-shrink-0 w-44 md:w-auto bg-white p-5 md:p-6 rounded-2xl md:rounded-xl border border-[var(--outline-variant)] shadow-sm flex items-start gap-4">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Users className="w-5 h-5 md:w-6 md:h-6" />
        </div>
        <div>
          <div className="text-xs font-medium text-[var(--on-surface-variant)] uppercase tracking-wide">
            Total members
          </div>
          <div className="text-xl md:text-2xl font-bold text-slate-900 mt-0.5 md:mt-1">
            {unit.stats.total_members}
          </div>
        </div>
      </div>

      {/* HOD Card */}
      <div className="flex-shrink-0 w-64 md:w-auto bg-white p-5 md:p-6 rounded-2xl md:rounded-xl border border-[var(--outline-variant)] shadow-sm flex items-start gap-4">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5 md:w-6 md:h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-[var(--on-surface-variant)] uppercase tracking-wide">
            HOD / Head
          </div>
          <div className="text-xl md:text-2xl font-bold text-slate-900 mt-0.5 md:mt-1 truncate">
            {hod ? getUnitMemberName(hod) : "Not assigned"}
          </div>
        </div>
      </div>

      {/* Assistant Card */}
      <div className={`flex-shrink-0 w-64 md:w-auto bg-white p-5 md:p-6 rounded-2xl md:rounded-xl border border-[var(--outline-variant)] shadow-sm flex items-start gap-4 ${!assistant ? "opacity-75" : ""}`}>
        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 ${assistant ? "bg-primary/10 text-primary" : "bg-slate-100 text-[var(--outline)]"}`}>
          <ShieldCheck className="w-5 h-5 md:w-6 md:h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-[var(--on-surface-variant)] uppercase tracking-wide">
            Assistant
          </div>
          <div className={`text-xl md:text-2xl font-bold mt-0.5 md:mt-1 truncate ${assistant ? "text-slate-900" : "text-[var(--outline)] font-normal"}`}>
            {assistant ? getUnitMemberName(assistant) : "Not assigned"}
          </div>
        </div>
      </div>
    </section>
  );
}
