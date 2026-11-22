"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Plus,
  Search,
  Download,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Shield,
  HelpCircle,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { UnitFormModal } from "@/components/units/unit-form-modal";
import type { ManagedUnit, UnitMember } from "@/components/units/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PERMISSION, type Permission } from "@/lib/adminRoles";
import { UnitDirectoryTable } from "@/components/units/unit-directory-table";
import { MobileUnitCard } from "@/components/units/mobile-unit-card";
import { UNIT_ROLE } from "@/lib/unitRoles";
import { getUnitLeader } from "@/components/units/unit-leadership-summary";

// Dynamically categorize units for filters
const getUnitCategory = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.includes("choir") || lower.includes("music") || lower.includes("worship") || lower.includes("drama")) {
    return "worship";
  }
  if (lower.includes("media") || lower.includes("tech") || lower.includes("sound")) {
    return "technical";
  }
  if (
    lower.includes("usher") ||
    lower.includes("protocol") ||
    lower.includes("hospitality") ||
    lower.includes("welfare") ||
    lower.includes("sanitation") ||
    lower.includes("health")
  ) {
    return "service";
  }
  return "other";
};

export default function UnitsPage() {
  const [units, setUnits] = useState<ManagedUnit[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<ManagedUnit | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const canManageUnits =
    permissions.includes(PERMISSION.UNITS_MANAGE) || units.some((unit) => unit.access.can_manage_details);

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const [unitsRes, authRes] = await Promise.all([fetch("/api/units/management"), fetch("/api/auth")]);
      const unitsData = await unitsRes.json();
      const authData = authRes.ok ? await authRes.json() : {};

      if (!unitsRes.ok) throw new Error(unitsData.error || "Failed to load units");
      setUnits(Array.isArray(unitsData.data) ? unitsData.data : []);
      setPermissions(
        (authData.permissions || authData.user?.permissions || authData.member?.permissions || []) as Permission[]
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to load units");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const filteredUnits = useMemo(() => {
    const query = search.trim().toLowerCase();
    let next = units.filter(
      (unit) => !query || unit.name.toLowerCase().includes(query) || unit.description?.toLowerCase().includes(query)
    );

    if (selectedCategory !== "all") {
      next = next.filter((unit) => getUnitCategory(unit.name) === selectedCategory);
    }

    if (selectedStatus !== "all") {
      next = next.filter((unit) => {
        const isActive = unit.stats.total_members > 0 || unit.members.some((m) => m.unit_role === UNIT_ROLE.HEAD);
        return selectedStatus === "active" ? isActive : !isActive;
      });
    }

    next.sort((a, b) => {
      return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    });

    return next;
  }, [search, selectedCategory, selectedStatus, sortAsc, units]);

  const paginatedUnits = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUnits.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUnits, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredUnits.length / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, selectedStatus]);

  const totalUnitsCount = units.length;
  const activeMembersSum = units.reduce((sum, u) => sum + u.stats.total_members, 0);
  const leadershipFilledPercent = useMemo(() => {
    if (units.length === 0) return 0;
    const filledHods = units.filter((u) => u.members.some((m) => m.unit_role === UNIT_ROLE.HEAD)).length;
    return Math.round((filledHods / units.length) * 100);
  }, [units]);

  const vacantLeadershipPositions = useMemo(() => {
    return units.reduce((acc, u) => {
      const hasHod = u.members.some((m) => m.unit_role === UNIT_ROLE.HEAD);
      const hasAsst = u.members.some((m) => m.unit_role === UNIT_ROLE.ASSISTANT);
      return acc + (hasHod ? 0 : 1) + (hasAsst ? 0 : 1);
    }, 0);
  }, [units]);

  const openCreate = () => {
    setEditingUnit(null);
    setFormOpen(true);
  };

  const openEdit = (unit: ManagedUnit) => {
    setEditingUnit(unit);
    setFormOpen(true);
  };

  const assignLeader = async (
    unitId: string,
    memberId: string | null,
    role: "head" | "assistant",
    prevLeader?: UnitMember | null
  ) => {
    if (prevLeader && prevLeader.id !== memberId) {
      await fetch(`/api/units/${unitId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: prevLeader.id, role: UNIT_ROLE.MEMBER }),
      });
    }

    if (memberId) {
      await fetch(`/api/units/${unitId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: memberId, role }),
      });
    }
  };

  const saveUnit = async (payload: {
    name: string;
    description: string;
    category: string;
    hodId: string | null;
    assistantId: string | null;
    isPublic: boolean;
  }) => {
    setSaving(true);
    try {
      const res = await fetch(editingUnit ? `/api/units/${editingUnit.id}` : "/api/units", {
        method: editingUnit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: payload.name,
          description: payload.description,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to save unit");

      const targetUnitId = editingUnit ? editingUnit.id : data.id;

      const prevHod = editingUnit ? editingUnit.members.find((m) => m.unit_role === UNIT_ROLE.HEAD) : null;
      const prevAsst = editingUnit ? editingUnit.members.find((m) => m.unit_role === UNIT_ROLE.ASSISTANT) : null;

      await Promise.all([
        assignLeader(targetUnitId, payload.hodId, UNIT_ROLE.HEAD, prevHod),
        assignLeader(targetUnitId, payload.assistantId, UNIT_ROLE.ASSISTANT, prevAsst),
      ]);

      toast.success(editingUnit ? "Unit updated successfully" : "Unit created successfully");
      setFormOpen(false);
      setEditingUnit(null);
      fetchUnits();
    } catch (err: any) {
      toast.error(err.message || "Failed to save unit");
    } finally {
      setSaving(false);
    }
  };

  const deleteUnit = async (unit: ManagedUnit) => {
    if (!confirm(`Delete ${unit.name}? This will remove the unit record.`)) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/units/${unit.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to delete unit");

      toast.success("Unit deleted");
      fetchUnits();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete unit");
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = () => {
    const escape = (val: unknown) => {
      const str = val === null || val === undefined ? "" : String(val).trim();
      return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };

    const rows = [
      ["Unit Name", "Category", "HOD", "Assistant HOD", "Total Workers", "Description"].join(","),
      ...filteredUnits.map((u) => {
        const hod = getUnitLeader(u.members, UNIT_ROLE.HEAD);
        const asst = getUnitLeader(u.members, UNIT_ROLE.ASSISTANT);
        const hodName = hod ? `${hod.first_name} ${hod.last_name}` : "Vacant";
        const asstName = asst ? `${asst.first_name} ${asst.last_name}` : "Vacant";
        return [
          escape(u.name),
          escape(getUnitCategory(u.name)),
          escape(hodName),
          escape(asstName),
          escape(u.stats.total_members),
          escape(u.description || ""),
        ].join(",");
      }),
    ].join("\r\n");

    const blob = new Blob([rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ministry-units-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Ministry units exported to CSV");
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  const categoryChips = [
    { label: "All Units", value: "all" },
    { label: "Worship & Arts", value: "worship" },
    { label: "Media & Tech", value: "technical" },
    { label: "Service & Care", value: "service" },
    { label: "Other Units", value: "other" },
  ];

  return (
    <div className="flex-1 w-full">
      <PageHeader
        eyebrow="Workforce & departments"
        title="Ministry Units"
        description="Organize functional departments, unit heads (HODs), and workforce rosters."
        actions={
          <div className="flex w-full sm:w-auto flex-wrap items-center gap-2">
            <Button
              onClick={handleExportCSV}
              variant="outline"
              size="sm"
              className="h-10 border-[var(--outline-variant)] bg-white text-primary hover:bg-[var(--surface-container-low)] font-semibold"
            >
              <Download className="w-4 h-4 mr-1.5" />
              Export Units CSV
            </Button>
            {canManageUnits && (
              <Button onClick={openCreate} variant="secondary" size="sm" className="h-10 font-bold ml-auto sm:ml-0">
                <Plus className="w-4 h-4 mr-1.5" />
                Create Unit
              </Button>
            )}
          </div>
        }
      />

      <div className="space-y-6 p-4 md:space-y-8 md:p-8">
        {/* Top 2x2 / 4-Column KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[var(--outline-variant)]/60 shadow-2xs">
            <div className="flex items-center justify-between text-[var(--on-surface-variant)]">
              <span className="text-xs font-medium">Total Units</span>
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-2">{totalUnitsCount}</p>
            <p className="mt-1 text-xs text-[var(--on-surface-variant)]">Active departments</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[var(--outline-variant)]/60 shadow-2xs">
            <div className="flex items-center justify-between text-[var(--on-surface-variant)]">
              <span className="text-xs font-medium">Assigned Workers</span>
              <Users className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-2">{activeMembersSum}</p>
            <p className="mt-1 text-xs text-[var(--on-surface-variant)]">Across all rosters</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[var(--outline-variant)]/60 shadow-2xs">
            <div className="flex items-center justify-between text-[var(--on-surface-variant)]">
              <span className="text-xs font-medium">HOD Coverage</span>
              <Shield className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-2">{leadershipFilledPercent}%</p>
            <p className="mt-1 text-xs text-[var(--on-surface-variant)]">Units with a head</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[var(--outline-variant)]/60 shadow-2xs">
            <div className="flex items-center justify-between text-[var(--on-surface-variant)]">
              <span className="text-xs font-medium">Open Leadership</span>
              <HelpCircle className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-2">{vacantLeadershipPositions}</p>
            <p className="mt-1 text-xs text-[var(--on-surface-variant)]">HOD or Assistant slots</p>
          </div>
        </div>

        {/* Units Filter & Directory Container */}
        <div className="bg-white rounded-2xl shadow-xs border border-[var(--outline-variant)]/80 overflow-hidden">
          {/* Unified Responsive Filter Bar */}
          <div className="p-4 sm:p-5 border-b border-[var(--outline-variant)]/50 space-y-3.5 bg-white">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--outline)]" />
                <Input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search units by name or description..."
                  className="pl-10 h-10 bg-[var(--surface-container-low)] w-full border-[var(--outline-variant)]/60 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[145px] h-10 bg-[var(--surface-container-low)] border-[var(--outline-variant)]/60 text-xs font-semibold rounded-xl">
                    <SelectValue placeholder="Status: All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Status: All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <button
                  type="button"
                  onClick={() => setSortAsc((prev) => !prev)}
                  className="h-10 px-3 border border-[var(--outline-variant)]/60 rounded-xl text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-low)] transition-colors bg-white flex items-center gap-1.5 text-xs font-semibold"
                  title="Toggle Sort Direction"
                >
                  <ArrowUpDown className="w-4 h-4 text-primary" />
                  <span>{sortAsc ? "A–Z" : "Z–A"}</span>
                </button>
              </div>
            </div>

            {/* Category Filter Chips (Mobile & Desktop) */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
              {categoryChips.map((chip) => {
                const active = selectedCategory === chip.value;
                return (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => setSelectedCategory(chip.value)}
                    className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      active
                        ? "bg-primary text-white shadow-2xs"
                        : "bg-[var(--surface-container-low)] text-[var(--on-surface-variant)] border border-[var(--outline-variant)]/40 hover:bg-[var(--surface-container)]"
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Empty State */}
          {filteredUnits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-white">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--surface-container-low)] text-[var(--outline)]">
                <Building2 className="h-8 w-8" />
              </div>
              <h3 className="font-headline text-base font-bold text-foreground">No units found</h3>
              <p className="mt-1 max-w-xs text-xs text-[var(--on-surface-variant)]">
                Try a different search query or reset your category filter.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <UnitDirectoryTable
                  units={paginatedUnits}
                  canManageUnits={canManageUnits}
                  saving={saving}
                  onEdit={openEdit}
                  onDelete={deleteUnit}
                />
              </div>

              {/* Mobile Card Layout */}
              <div className="md:hidden space-y-3 p-3.5 bg-[var(--surface)]/50">
                {paginatedUnits.map((unit) => (
                  <MobileUnitCard
                    key={unit.id}
                    unit={unit}
                    canManage={canManageUnits}
                    onEdit={openEdit}
                  />
                ))}
              </div>
            </>
          )}

          {/* Responsive Pagination (Mobile & Desktop) */}
          {filteredUnits.length > itemsPerPage && (
            <div className="flex flex-col sm:flex-row px-5 py-4 bg-white border-t border-[var(--outline-variant)]/50 items-center justify-between gap-3">
              <div className="text-xs text-[var(--on-surface-variant)]">
                Showing{" "}
                <span className="font-bold text-foreground">
                  {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredUnits.length)}
                </span>{" "}
                of <span className="font-bold text-foreground">{filteredUnits.length}</span> units
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-2.5 text-xs"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Prev
                </Button>
                <span className="text-xs font-bold px-2">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-2.5 text-xs"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Unit Form Modal */}
      <UnitFormModal
        open={formOpen}
        unit={editingUnit}
        saving={saving}
        onOpenChange={setFormOpen}
        onSubmit={saveUnit}
      />
    </div>
  );
}
