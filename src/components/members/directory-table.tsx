"use client";

import { Eye, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Member } from "@/lib/types";
import {
  LIFE_STAGE,
  getLifeStageLabel,
  getMembershipStatusLabel,
  isAvailableMember,
  normalizeLifeStage,
  usesNyscProfile,
  workingLifeStages,
} from "@/lib/memberLifecycle";
import { unitRoleLabels, type UnitRole } from "@/lib/unitRoles";

type DirectoryTableProps = {
  members: Member[];
  onView: (member: Member) => void;
  onEdit: (member: Member) => void;
  onDelete: (id: string) => void;
  canManageMembers: boolean;
};

function getMemberName(member: Member) {
  return [member.first_name, member.middle_name, member.last_name].filter(Boolean).join(" ");
}

function getRoleAndUnitsLabel(member: Member) {
  const units = member.units || [];
  const parts: string[] = [];
  if (member.position && member.position.trim()) {
    parts.push(member.position.trim());
  }
  if (units.length > 0) {
    const first = units[0];
    const roleLabel = first.role ? (unitRoleLabels[first.role as UnitRole] || first.role) : "Member";
    const unitStr = first.role && first.role !== "member" ? `${first.name} (${roleLabel})` : first.name;
    parts.push(units.length > 1 ? `${unitStr} +${units.length - 1}` : unitStr);
  }
  return parts.length > 0 ? parts.join(" · ") : "—";
}

export function DirectoryTable({ members, onView, onEdit, onDelete, canManageMembers }: DirectoryTableProps) {
  return (
    <div className="hidden md:block w-full overflow-x-auto">
      <Table className="min-w-[800px] w-full text-left border-collapse">
        <TableHeader className="bg-[var(--surface-container-low)]/60">
          <TableRow className="border-b border-[var(--outline-variant)]/60 hover:bg-transparent">
            <TableHead className="px-5 py-3 text-xs font-medium text-[var(--outline)]">
              Name
            </TableHead>
            <TableHead className="px-5 py-3 text-xs font-medium text-[var(--outline)]">
              Phone
            </TableHead>
            <TableHead className="px-5 py-3 text-xs font-medium text-[var(--outline)]">
              Unit & Position
            </TableHead>
            <TableHead className="px-5 py-3 text-xs font-medium text-[var(--outline)]">
              Life Stage
            </TableHead>
            <TableHead className="px-5 py-3 text-xs font-medium text-[var(--outline)]">
              Status
            </TableHead>
            <th className="px-5 py-3 text-xs font-medium text-[var(--outline)] text-right">
              Actions
            </th>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-[var(--outline-variant)]/40 bg-white">
          {members.map((m) => {
            let badgeStyle = "bg-[var(--surface-container-low)] text-foreground";
            const lifeStage = normalizeLifeStage(m.life_stage);
            if (workingLifeStages.includes(lifeStage)) {
              badgeStyle = "bg-emerald-50 text-emerald-700";
            } else if (lifeStage === LIFE_STAGE.STUDENT) {
              badgeStyle = "bg-purple-50 text-purple-700";
            } else if (usesNyscProfile(lifeStage)) {
              badgeStyle = "bg-amber-50 text-amber-800";
            }

            const isActive = isAvailableMember(m.membership_status, m.is_active);

            return (
              <TableRow
                key={m.id}
                onClick={() => onView(m)}
                className="hover:bg-[var(--surface-container-low)]/40 transition-colors cursor-pointer group border-b border-[var(--outline-variant)]/30"
              >
                <TableCell className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-9 h-9 border border-[var(--outline-variant)]/50">
                      <AvatarImage src={m.photo_url || ""} className="object-cover" />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                        {m.first_name?.[0]}
                        {m.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{getMemberName(m)}</p>
                      {m.email && <p className="text-xs text-[var(--outline)] truncate">{m.email}</p>}
                    </div>
                  </div>
                </TableCell>

                <TableCell className="px-5 py-3.5 text-sm text-[var(--on-surface-variant)] font-mono">
                  {m.phone_number || "—"}
                </TableCell>

                <TableCell className="px-5 py-3.5 text-sm text-[var(--on-surface-variant)] truncate max-w-[220px]">
                  {getRoleAndUnitsLabel(m)}
                </TableCell>

                <TableCell className="px-5 py-3.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeStyle}`}>
                    {getLifeStageLabel(lifeStage)}
                  </span>
                </TableCell>

                <TableCell className="px-5 py-3.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--on-surface-variant)]">
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                    {getMembershipStatusLabel(m.membership_status, m.is_active)}
                  </span>
                </TableCell>

                <TableCell className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      onClick={() => onView(m)}
                      className="px-2.5 h-8 text-xs font-semibold text-primary hover:bg-primary/10 hover:text-primary rounded-lg"
                    >
                      View
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[var(--outline)] hover:text-foreground rounded-lg"
                        >
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open options</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="border-[var(--outline-variant)]">
                        <DropdownMenuItem onClick={() => onView(m)} className="gap-2 cursor-pointer text-sm">
                          <Eye className="h-4 w-4 text-[var(--outline)]" />
                          View Profile
                        </DropdownMenuItem>
                        {canManageMembers && (
                          <DropdownMenuItem onClick={() => onEdit(m)} className="gap-2 cursor-pointer text-sm">
                            <Edit2 className="h-4 w-4 text-[var(--outline)]" />
                            Edit Details
                          </DropdownMenuItem>
                        )}
                        {canManageMembers && (
                          <DropdownMenuItem
                            onClick={() => onDelete(m.id)}
                            className="gap-2 cursor-pointer text-sm text-destructive hover:text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Member
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
