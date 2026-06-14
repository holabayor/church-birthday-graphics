"use client";

import { Eye, Phone } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UnitRoleMenu } from "./unit-role-menu";
import type { UnitMember, UnitRole } from "./types";
import { getLifeStageLabel } from "@/lib/memberLifecycle";
import { unitRoleLabels } from "./types";

interface MobileRosterListProps {
  roster: UnitMember[];
  canManageMembers: boolean;
  saving: boolean;
  onViewDetails: (member: UnitMember) => void;
  onChangeRole: (member: UnitMember, role: UnitRole) => void;
}

function getMemberName(member: UnitMember) {
  return [member.first_name, member.middle_name, member.last_name].filter(Boolean).join(" ");
}

function getInitials(member: UnitMember) {
  return `${member.first_name?.[0] || ""}${member.last_name?.[0] || ""}` || "M";
}

export function MobileRosterList({
  roster,
  canManageMembers,
  saving,
  onViewDetails,
  onChangeRole,
}: MobileRosterListProps) {
  return (
    <div className="divide-y divide-[var(--outline-variant)] md:hidden">
      {roster.map(member => (
        <div key={member.id} className="space-y-3 px-4 py-4">
          <button
            type="button"
            onClick={() => onViewDetails(member)}
            className="flex w-full items-center gap-3 text-left focus:outline-none"
          >
            <Avatar className="h-11 w-11 border border-[var(--outline-variant)] bg-[var(--surface-container-low)] shrink-0">
              <AvatarImage src={member.photo_url || ""} />
              <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                {getInitials(member)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-semibold text-[#0B1C30]">{getMemberName(member)}</p>
                <Badge className="shrink-0 rounded bg-primary text-[9px] font-bold text-white uppercase tracking-wider px-1.5 py-0.5">
                  {unitRoleLabels[member.unit_role]}
                </Badge>
              </div>
              <p className="truncate text-xs text-[var(--on-surface-variant)] mt-0.5">
                {getLifeStageLabel(member.life_stage)} • {member.phone_number || member.email || "No contact info"}
              </p>
            </div>
          </button>

          <div className="flex items-center justify-end gap-2">
            {member.phone_number && (
              <a
                href={`tel:${member.phone_number}`}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] text-[var(--on-surface-variant)] transition-all hover:bg-[var(--surface-container-low)]"
                title="Call Member"
              >
                <Phone className="h-4 w-4" />
              </a>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(member)}
              className="h-9 border-[var(--outline-variant)] bg-white text-primary hover:bg-[var(--surface-container)] hover:text-primary/90"
            >
              <Eye className="mr-2 h-4 w-4" />
              View
            </Button>
            {canManageMembers && (
              <UnitRoleMenu
                currentRole={member.unit_role}
                disabled={saving}
                onChange={role => onChangeRole(member, role)}
              />
            )}
          </div>
        </div>
      ))}
      {/* {roster.length > 0 && (
        <div className="bg-[var(--surface-container-low)] border-2 border-dashed border-[var(--outline-variant)] rounded-2xl p-6 flex flex-col items-center justify-center text-center mt-3 mx-4">
          <p className="text-[var(--outline)] text-sm italic font-medium">End of roster list</p>
        </div>
      )} */}
    </div>
  );
}
