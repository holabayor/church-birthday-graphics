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

// Dynamically categorize units for filters
const getUnitCategory = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.includes("choir") || lower.includes("music") || lower.includes("worship")) {
    return "worship";
  }
  if (lower.includes("media") || lower.includes("tech") || lower.includes("sound")) {
    return "technical";
  }
  if (lower.includes("usher") || lower.includes("protocol") || lower.includes("hospitality")) {
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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const canManageUnits =
    permissions.includes(PERMISSION.UNITS_MANAGE) || units.some(unit => unit.access.can_manage_details);

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const [unitsRes, authRes] = await Promise.all([fetch("/api/units/management"), fetch("/api/auth")]);
      const unitsData = await unitsRes.json();
      const authData = authRes.ok ? await authRes.json() : {};

      if (!unitsRes.ok) throw new Error(unitsData.error || "Failed to load units");
      setUnits(Array.isArray(unitsData.data) ? unitsData.data : []);
      setPermissions(
        (authData.permissions || authData.user?.permissions || authData.member?.permissions || []) as Permission[],
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

  // Filter and Sort units
  const filteredUnits = useMemo(() => {
    const query = search.trim().toLowerCase();
    let next = units.filter(
      unit => !query || unit.name.toLowerCase().includes(query) || unit.description?.toLowerCase().includes(query),
    );

    // Apply category filter
    if (selectedCategory !== "all") {
      next = next.filter(unit => getUnitCategory(unit.name) === selectedCategory);
    }

    // Apply status filter (mocked - active if has members or has HOD, inactive otherwise)
    if (selectedStatus !== "all") {
      next = next.filter(unit => {
        const isActive = unit.stats.total_members > 0 || unit.members.some(m => m.unit_role === UNIT_ROLE.HEAD);
        return selectedStatus === "active" ? isActive : !isActive;
      });
    }

    // Sort name
    next.sort((a, b) => {
      return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    });

    return next;
  }, [search, selectedCategory, selectedStatus, sortAsc, units]);

  // Paginated units
  const paginatedUnits = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUnits.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUnits, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredUnits.length / itemsPerPage));

  // Reset page on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, selectedStatus]);

  // Statistics calculation
  const totalUnitsCount = units.length;
  const activeMembersSum = units.reduce((sum, u) => sum + u.stats.total_members, 0);
  const leadershipFilledPercent = useMemo(() => {
    if (units.length === 0) return 0;
    const filledHods = units.filter(u => u.members.some(m => m.unit_role === UNIT_ROLE.HEAD)).length;
    return Math.round((filledHods / units.length) * 100);
  }, [units]);

  const vacantLeadershipPositions = useMemo(() => {
    return units.reduce((acc, u) => {
      const hasHod = u.members.some(m => m.unit_role === UNIT_ROLE.HEAD);
      const hasAsst = u.members.some(m => m.unit_role === UNIT_ROLE.ASSISTANT);
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
    prevLeader?: UnitMember | null,
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

      const prevHod = editingUnit ? editingUnit.members.find(m => m.unit_role === UNIT_ROLE.HEAD) : null;
      const prevAsst = editingUnit ? editingUnit.members.find(m => m.unit_role === UNIT_ROLE.ASSISTANT) : null;

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
    toast.success("Exporting unit records to CSV...");
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="flex-1 w-full">
      <PageHeader
        eyebrow="People operations"
        title="Unit Management"
        description="Manage and organize the various functional units within the community."
        actions={
          <>
            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="hidden h-10 border-(--outline-variant) bg-white text-primary hover:bg-(--surface-container) hover:text-primary/90"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            {canManageUnits && (
              <Button onClick={openCreate} variant="secondary">
                <Plus className="w-4 h-4 mr-2" />
                Create Unit
              </Button>
            )}
          </>
        }
      />

      {/* Main Content Area */}
      <main className="space-y-8 p-4 md:p-8">
        {/* Table & Filters Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Desktop Filter Bar */}
          <div className="hidden md:flex p-6 border-b border-slate-100 items-center space-x-4 bg-slate-50/50">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by unit name..."
                className="pl-9 bg-white w-full border-slate-200"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Filter By:</span>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px] bg-white border-slate-200 text-sm">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent className="border-slate-200">
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="worship">Worship</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[140px] bg-white border-slate-200 text-sm">
                  <SelectValue placeholder="Status: All" />
                </SelectTrigger>
                <SelectContent className="border-slate-200">
                  <SelectItem value="all">Status: All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <button
              type="button"
              onClick={() => setSortAsc(prev => !prev)}
              className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 transition-colors bg-white"
              title="Toggle Sort Direction"
            >
              <ArrowUpDown className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Filter Bar */}
          <div className="md:hidden space-y-3 p-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                placeholder="Search units..."
                value={search}
                onChange={event => setSearch(event.target.value)}
                className="h-11 border-slate-200 bg-white rounded-xl pl-10 shadow-sm"
              />
            </div>

            {/* Mobile Chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === "all"
                    ? "bg-[#0052CC] text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedCategory("worship")}
                className={`px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === "worship"
                    ? "bg-[#0052CC] text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Departmental
              </button>
              <button
                onClick={() => setSelectedCategory("technical")}
                className={`px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === "technical"
                    ? "bg-[#0052CC] text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Fellowships
              </button>
              <button
                onClick={() => setSelectedCategory("service")}
                className={`px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === "service"
                    ? "bg-[#0052CC] text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Committees
              </button>
            </div>
          </div>

          {/* Desktop Table View */}
          {filteredUnits.length > 0 ? (
            <UnitDirectoryTable
              units={paginatedUnits}
              canManageUnits={canManageUnits}
              saving={saving}
              onEdit={openEdit}
              onDelete={deleteUnit}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center border-t border-slate-100 bg-white">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                <Building2 className="h-8 w-8" />
              </div>
              <h3 className="font-headline text-lg font-bold text-slate-900">No units found</h3>
              <p className="mt-1 max-w-sm text-sm text-slate-400">
                Try a different search query or change filter selections.
              </p>
            </div>
          )}

          {/* Mobile Card Layout */}
          <div className="md:hidden space-y-3 px-1 mt-2">
            {filteredUnits.map(unit => (
              <MobileUnitCard key={unit.id} unit={unit} />
            ))}
          </div>

          {/* Desktop Pagination */}
          {filteredUnits.length > 0 && (
            <div className="hidden md:flex px-6 py-4 bg-white border-t border-slate-100 items-center justify-between">
              <div className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-medium text-slate-900">
                  {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredUnits.length)}
                </span>{" "}
                of <span className="font-medium text-slate-900">{filteredUnits.length}</span> units
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-slate-200 rounded text-slate-400 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="w-8 h-8 flex items-center justify-center rounded bg-[#0052CC] text-white text-sm font-medium">
                  {currentPage}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-slate-200 rounded text-slate-400 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Bottom Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {/* Card 1: Total Units */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[120px]">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-blue-50 text-[#0052CC] rounded-lg">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-3">Total Units</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{totalUnitsCount}</p>
            </div>
          </div>

          {/* Card 2: Active Members */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[120px]">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-3">Active Members</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{activeMembersSum}</p>
            </div>
          </div>

          {/* Card 3: Leadership Filled */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[120px]">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Shield className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-3">Leadership Filled</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{leadershipFilledPercent}%</p>
            </div>
          </div>

          {/* Card 4: Vacant Positions */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[120px]">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <HelpCircle className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-3">Vacant Positions</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{vacantLeadershipPositions}</p>
            </div>
          </div>
        </div>
      </main>

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
