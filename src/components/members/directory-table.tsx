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

function getUnitRoleLabel(member: Member) {
  const primaryUnit = member.units?.[0];
  if (!primaryUnit) return "-";
  const roleLabel = primaryUnit.role ? primaryUnit.role.charAt(0).toUpperCase() + primaryUnit.role.slice(1) : "Member";
  return `${primaryUnit.name} / ${roleLabel}`;
}

export function DirectoryTable({ members, onView, onEdit, onDelete, canManageMembers }: DirectoryTableProps) {
  return (
    <div className="hidden md:block w-full overflow-x-auto">
      <Table className="min-w-[800px] w-full text-left border-collapse">
        <TableHeader className="bg-(--surface-container-low)">
          <TableRow className="border-b border-(--outline-variant) hover:bg-(--surface-container-low)">
            <TableHead className="px-6 py-4 text-xs font-mono uppercase tracking-wider text-(--outline) font-medium">
              Name
            </TableHead>
            <TableHead className="px-6 py-4 text-xs font-mono uppercase tracking-wider text-(--outline) font-medium">
              Phone Number
            </TableHead>
            <TableHead className="px-6 py-4 text-xs font-mono uppercase tracking-wider text-(--outline) font-medium">
              Life Stage
            </TableHead>
            <TableHead className="px-6 py-4 text-xs font-mono uppercase tracking-wider text-(--outline) font-medium">
              Unit/Role
            </TableHead>
            <TableHead className="px-6 py-4 text-xs font-mono uppercase tracking-wider text-(--outline) font-medium">
              Status
            </TableHead>
            <th className="px-6 py-4 text-xs font-mono uppercase tracking-wider text-(--outline) text-right font-medium">
              Actions
            </th>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-(--outline-variant)/40 bg-(--surface-container-lowest)">
          {members.map(m => {
            // Life Stage Badge Style Logic
            let badgeStyle = "bg-(--surface-container) text-foreground border border-(--outline-variant)/30";
            const lifeStage = normalizeLifeStage(m.life_stage);
            if (workingLifeStages.includes(lifeStage)) {
              badgeStyle = "bg-primary/10 text-primary border border-primary/20";
            } else if (lifeStage === LIFE_STAGE.STUDENT) {
              badgeStyle = "bg-(--surface-container-highest) text-primary border border-primary/10";
            } else if (usesNyscProfile(lifeStage)) {
              badgeStyle = "bg-secondary/15 text-(--secondary-foreground) border border-secondary/20";
            } else if (lifeStage === LIFE_STAGE.VISITOR) {
              badgeStyle =
                "bg-(--member-emerald)/10 text-(--member-emerald) border border-(--member-emerald)/20";
            }

            const isActive = isAvailableMember(m.membership_status, m.is_active);

            return (
              <TableRow
                key={m.id}
                onClick={() => onView(m)}
                className="hover:bg-(--surface-container-low)/50 transition-colors cursor-pointer group border-b border-(--outline-variant)/30"
              >
                {/* Name */}
                <TableCell className="px-6 py-4" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-3" onClick={() => onView(m)}>
                    <Avatar className="w-9 h-9 border border-(--outline-variant)/40 shadow-xs">
                      <AvatarImage src={m.photo_url || ""} className="object-cover" />
                      <AvatarFallback className="bg-primary/5 text-primary font-bold text-xs font-sans">
                        {m.first_name?.[0]}
                        {m.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{getMemberName(m)}</p>
                      <p className="text-xs text-(--outline) italic truncate">{m.email || "No email"}</p>
                    </div>
                  </div>
                </TableCell>

                {/* Phone */}
                <TableCell className="px-6 py-4 text-sm text-(--on-surface-variant) font-mono">
                  {m.phone_number || "Not provided"}
                </TableCell>

                {/* Type */}
                <TableCell className="px-6 py-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[12px] font-bold uppercase tracking-wider ${badgeStyle}`}
                  >
                    {getLifeStageLabel(lifeStage)}
                  </span>
                </TableCell>

                {/* Unit/Role */}
                <TableCell className="px-6 py-4 text-sm text-(--on-surface-variant) truncate max-w-[180px]">
                  {getUnitRoleLabel(m)}
                </TableCell>

                {/* Status */}
                <TableCell className="px-6 py-4">
                  {isActive ? (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-(--member-emerald)">
                      <span className="w-1.5 h-1.5 rounded-full bg-(--member-emerald) animate-pulse"></span>{" "}
                      {getMembershipStatusLabel(m.membership_status, m.is_active)}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-(--outline)">
                      <span className="w-1.5 h-1.5 rounded-full bg-(--outline)"></span>{" "}
                      {getMembershipStatusLabel(m.membership_status, m.is_active)}
                    </span>
                  )}
                </TableCell>

                {/* Actions */}
                <TableCell className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      onClick={() => onView(m)}
                      className="px-3 h-8 text-xs font-bold text-primary hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"
                    >
                      View Profile
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-(--outline) hover:text-foreground rounded-lg"
                        >
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open options</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="border-(--outline-variant)">
                        <DropdownMenuItem onClick={() => onView(m)} className="gap-2 cursor-pointer text-sm">
                          <Eye className="h-4 w-4 text-(--outline)" />
                          View Profile
                        </DropdownMenuItem>
                        {canManageMembers && (
                          <DropdownMenuItem onClick={() => onEdit(m)} className="gap-2 cursor-pointer text-sm">
                            <Edit2 className="h-4 w-4 text-(--outline)" />
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
