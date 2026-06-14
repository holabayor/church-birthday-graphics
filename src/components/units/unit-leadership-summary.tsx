"use client";

import { ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { UnitMember, UnitRole } from "@/components/units/types";
import { UNIT_ROLE, unitLeadershipRoleOptions, type UnitLeadershipRole } from "@/lib/unitRoles";

type LeadershipRole = UnitLeadershipRole;

export function getUnitMemberName(member: UnitMember) {
  return [member.first_name, member.middle_name, member.last_name].filter(Boolean).join(" ");
}

export function getUnitLeader(members: UnitMember[], role: LeadershipRole) {
  return members.find(member => member.unit_role === role) || null;
}

export function UnitLeadershipStack({ members }: { members: UnitMember[] }) {
  return (
    <div className="space-y-2">
      {unitLeadershipRoleOptions.map(({ value: role, label }) => {
        const leader = getUnitLeader(members, role);

        return (
          <div key={role} className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-[#0B1C30]">
              {leader ? getUnitMemberName(leader) : role === UNIT_ROLE.HEAD ? "No HOD assigned" : "No assistant assigned"}
            </span>
            <Badge className="rounded-full border border-[var(--outline-variant)] bg-white px-2.5 py-0.5 text-[11px] font-normal text-[var(--on-surface-variant)] hover:bg-white">
              {label}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}

export function UnitLeaderCard({
  members,
  role,
}: {
  members: UnitMember[];
  role: LeadershipRole;
}) {
  const leader = getUnitLeader(members, role);
  const label = unitLeadershipRoleOptions.find(option => option.value === role)?.label || "Leader";

  return (
    <Card className="border-[var(--outline-variant)] bg-white shadow-sm">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-[var(--on-surface-variant)]">{label}</p>
          <p className="truncate font-[var(--font-manrope)] text-xl font-semibold text-[#0B1C30]">
            {leader ? getUnitMemberName(leader) : "Not assigned"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
