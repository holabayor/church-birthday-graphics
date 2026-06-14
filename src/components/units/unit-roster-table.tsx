"use client";

import { Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UnitRoleMenu } from "./unit-role-menu";
import type { UnitMember, UnitRole } from "./types";
import { getLifeStageLabel } from "@/lib/memberLifecycle";
import { unitRoleLabels } from "./types";

interface UnitRosterTableProps {
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

export function UnitRosterTable({
  roster,
  canManageMembers,
  saving,
  onViewDetails,
  onChangeRole,
}: UnitRosterTableProps) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <Table className="min-w-[820px]">
        <TableHeader className="bg-[var(--surface-container-low)]">
          <TableRow className="border-[var(--outline-variant)]">
            <TableHead className="px-5 py-3 font-semibold text-[#0B1C30]">Name</TableHead>
            <TableHead className="px-5 py-3 font-semibold text-[#0B1C30]">Contact</TableHead>
            <TableHead className="px-5 py-3 font-semibold text-[#0B1C30]">Type</TableHead>
            <TableHead className="px-5 py-3 font-semibold text-[#0B1C30]">Role</TableHead>
            <TableHead className="px-5 py-3 text-right font-semibold text-[#0B1C30]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roster.map((member) => (
            <TableRow
              key={member.id}
              className="border-[var(--outline-variant)] hover:bg-[var(--surface-container-low)] transition-colors"
            >
              <TableCell className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-[var(--outline-variant)] bg-[var(--surface-container-low)]">
                    <AvatarImage src={member.photo_url || ""} />
                    <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                      {getInitials(member)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-[#0B1C30]">{getMemberName(member)}</p>
                    <p className="text-xs text-[var(--on-surface-variant)]">{member.email || "No email"}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-5 py-4 text-sm text-[#0B1C30] font-medium">
                {member.phone_number || "Not provided"}
              </TableCell>
              <TableCell className="px-5 py-4">
                <Badge className="rounded-full bg-[var(--surface-container)] font-normal capitalize text-[#0B1C30] hover:bg-[var(--surface-container)]">
                  {getLifeStageLabel(member.life_stage)}
                </Badge>
              </TableCell>
              <TableCell className="px-5 py-4">
                <Badge className="rounded-full border border-[var(--outline-variant)] bg-white font-normal text-[var(--on-surface-variant)] hover:bg-white">
                  {unitRoleLabels[member.unit_role]}
                </Badge>
              </TableCell>
              <TableCell className="px-5 py-4 text-right">
                <div className="flex justify-end gap-2">
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
                      onChange={(role) => onChangeRole(member, role)}
                    />
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
