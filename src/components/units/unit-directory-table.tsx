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
    <div className="hidden overflow-x-auto md:block bg-white rounded-xl border border-[var(--outline-variant)] shadow-sm">
      <Table className="w-full text-left border-collapse">
        <TableHeader className="bg-slate-50">
          <TableRow className="border-b border-[var(--outline-variant)]">
            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Unit Name</th>
            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Member Count</th>
            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Leadership (HOD / Assistant)</th>
            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
            <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-widest">Actions</th>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-slate-100">
          {units.map((unit, index) => {
            const hod = getUnitLeader(unit.members, UNIT_ROLE.HEAD);
            const assistant = getUnitLeader(unit.members, UNIT_ROLE.ASSISTANT);
            
            return (
              <TableRow
                key={unit.id}
                className="hover:bg-slate-50 transition-colors group border-b border-slate-100"
              >
                {/* Unit Name & Description */}
                <TableCell className="px-6 py-5">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 shrink-0 ${getIconBgClass(index)}`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/units/${unit.id}`}
                        className="text-sm font-semibold text-slate-900 hover:text-primary transition-colors block truncate"
                      >
                        {unit.name}
                      </Link>
                      <p className="text-xs text-slate-400 truncate max-w-[280px]">
                        {unit.description || "No description provided"}
                      </p>
                    </div>
                  </div>
                </TableCell>

                {/* Member Count */}
                <TableCell className="px-6 py-5">
                  <div className="flex items-center text-sm text-slate-600 font-medium">
                    <Users className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
                    {unit.stats.total_members} {unit.stats.total_members === 1 ? "Member" : "Members"}
                  </div>
                </TableCell>

                {/* Leadership (HOD / AST) */}
                <TableCell className="px-6 py-5">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-slate-700 truncate max-w-[150px]">
                        {hod ? getUnitMemberName(hod) : "No HOD assigned"}
                      </span>
                      <span className="px-1.5 py-0.5 bg-blue-100 text-[9px] font-bold text-blue-700 rounded uppercase tracking-wider shrink-0">
                        HOD
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-slate-500 truncate max-w-[150px]">
                        {assistant ? getUnitMemberName(assistant) : "No Assistant assigned"}
                      </span>
                      <span className="px-1.5 py-0.5 bg-slate-100 text-[9px] font-bold text-slate-500 rounded uppercase tracking-wider shrink-0">
                        AST
                      </span>
                    </div>
                  </div>
                </TableCell>

                {/* Status */}
                <TableCell className="px-6 py-5">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>
                    Active
                  </span>
                </TableCell>

                {/* Actions */}
                <TableCell className="px-6 py-5 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs font-semibold text-blue-600 bg-blue-50 border-transparent hover:bg-blue-100 hover:text-blue-700 transition-colors"
                    >
                      <Link href={`/units/${unit.id}`}>View</Link>
                    </Button>
                    
                    {canManageUnits && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(unit)}
                          className="h-8 px-3 text-xs font-semibold text-slate-600 bg-slate-50 border-transparent hover:bg-slate-100 hover:text-slate-700 transition-colors"
                        >
                          Edit
                        </Button>
                        <button
                          type="button"
                          onClick={() => onDelete(unit)}
                          disabled={saving}
                          className="p-1.5 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 disabled:opacity-50"
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
