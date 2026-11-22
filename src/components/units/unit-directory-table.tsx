"use client";

import Link from "next/link";
import { Building2, Users, Trash2 } from "lucide-react";
import type { ManagedUnit } from "./types";
import { UNIT_ROLE } from "@/lib/unitRoles";
import { getUnitLeader, getUnitMemberName } from "./unit-leadership-summary";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface UnitDirectoryTableProps {
  units: ManagedUnit[];
  canManageUnits: boolean;
  saving: boolean;
  onEdit: (unit: ManagedUnit) => void;
  onDelete: (unit: ManagedUnit) => void;
}

// Generate icon background color classes based on index
const getIconBgClass = (index: number) => {
  const bgs = [
    "bg-blue-100 text-blue-600",
    "bg-purple-100 text-purple-600",
    "bg-emerald-100 text-emerald-600",
  ];
  return bgs[index % bgs.length];
};

export function UnitDirectoryTable({
  units,
  canManageUnits,
  saving,
  onEdit,
  onDelete,
}: UnitDirectoryTableProps) {
  return (
    <div className="hidden overflow-x-auto md:block bg-white">
      <Table className="w-full text-left border-collapse">
        <TableHeader className="bg-[var(--surface-container-low)]">
          <TableRow className="border-b border-[var(--outline-variant)]/50">
            <th className="px-6 py-3.5 text-xs font-semibold text-[var(--on-surface-variant)]">Unit Name</th>
            <th className="px-6 py-3.5 text-xs font-semibold text-[var(--on-surface-variant)]">Members</th>
            <th className="px-6 py-3.5 text-xs font-semibold text-[var(--on-surface-variant)]">Unit Head (HOD)</th>
            <th className="px-6 py-3.5 text-xs font-semibold text-[var(--on-surface-variant)]">Assistant</th>
            <th className="px-6 py-3.5 text-right text-xs font-semibold text-[var(--on-surface-variant)]">Actions</th>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-[var(--outline-variant)]/40">
          {units.map((unit) => {
            const hod = getUnitLeader(unit.members, UNIT_ROLE.HEAD);
            const assistant = getUnitLeader(unit.members, UNIT_ROLE.ASSISTANT);
            
            return (
              <TableRow
                key={unit.id}
                className="hover:bg-[var(--surface-container-low)]/60 transition-colors"
              >
                {/* Unit Name & Description */}
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/units/${unit.id}`}
                        className="text-sm font-semibold text-foreground hover:text-primary transition-colors block truncate"
                      >
                        {unit.name}
                      </Link>
                      {unit.description && (
                        <p className="text-xs text-[var(--on-surface-variant)] truncate max-w-[280px]">
                          {unit.description}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Member Count */}
                <TableCell className="px-6 py-4">
                  <div className="flex items-center text-sm text-foreground font-medium">
                    <Users className="w-3.5 h-3.5 mr-1.5 text-[var(--outline)] shrink-0" />
                    {unit.stats.total_members}
                  </div>
                </TableCell>

                {/* HOD */}
                <TableCell className="px-6 py-4">
                  {hod ? (
                    <span className="text-sm font-medium text-foreground">
                      {getUnitMemberName(hod)}
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--outline)]">Unassigned</span>
                  )}
                </TableCell>

                {/* Assistant */}
                <TableCell className="px-6 py-4">
                  {assistant ? (
                    <span className="text-sm text-[var(--on-surface-variant)]">
                      {getUnitMemberName(assistant)}
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--outline)]">—</span>
                  )}
                </TableCell>

                {/* Actions */}
                <TableCell className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs font-semibold border-[var(--outline-variant)]/70"
                    >
                      <Link href={`/units/${unit.id}`}>Open</Link>
                    </Button>
                    
                    {canManageUnits && (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(unit)}
                          className="h-8 px-2.5 text-xs font-medium text-[var(--on-surface-variant)]"
                        >
                          Edit
                        </Button>
                        <button
                          type="button"
                          onClick={() => onDelete(unit)}
                          disabled={saving}
                          className="p-1.5 text-[var(--outline)] hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 disabled:opacity-50"
                          title="Delete Unit"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
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
