"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Search, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";

import { PERMISSION, fullMemberDetailRoles, type AdminRole, type Permission } from "@/lib/adminRoles";
import type { Member } from "@/lib/types";
import { MemberDetailDialog } from "@/components/members/member-detail-dialog";
import { PageHeader } from "@/components/page-header";
import { UnitAddMemberModal } from "@/components/units/unit-add-member-modal";
import { UnitWorkspaceStats } from "@/components/units/unit-workspace-stats";
import { UnitRosterTable } from "@/components/units/unit-roster-table";
import { MobileRosterList } from "@/components/units/mobile-roster-list";
import type { ManagedUnit, UnitMember, UnitRole } from "@/components/units/types";
import { unitRoleLabels } from "@/components/units/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

type SortMode = "name-asc" | "name-desc" | "role";

function getMemberName(member: UnitMember) {
  return [member.first_name, member.middle_name, member.last_name].filter(Boolean).join(" ");
}

export default function UnitDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const unitId = params.id;

  const [unit, setUnit] = useState<ManagedUnit | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortMode>("name-asc");
  const [addOpen, setAddOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<(UnitMember & Partial<Member>) | null>(null);
  const [viewer, setViewer] = useState<{ role: AdminRole | null; permissions: Permission[] }>({
    role: null,
    permissions: [],
  });

  const fetchUnit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/units/${unitId}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load unit");
      setUnit(data.data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load unit");
      if (err.message === "Unit not found") router.push("/units");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnit();
  }, [unitId]);

  useEffect(() => {
    fetch("/api/auth")
      .then(res => res.json())
      .then(data => {
        const role = (data.user?.role || data.member?.role || null) as AdminRole | null;
        const permissions = (data.permissions ||
          data.user?.permissions ||
          data.member?.permissions ||
          []) as Permission[];
        setViewer({ role, permissions });
      })
      .catch(() => setViewer({ role: null, permissions: [] }));
  }, []);

  const roster = useMemo(() => {
    const query = search.trim().toLowerCase();
    const members = [...(unit?.members || [])].filter(member => {
      if (!query) return true;
      const haystack = [
        getMemberName(member),
        member.phone_number,
        member.email,
        member.life_stage,
        unitRoleLabels[member.unit_role],
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });

    members.sort((a, b) => {
      if (sort === "name-desc") return getMemberName(b).localeCompare(getMemberName(a));
      if (sort === "role") {
        const rank: Record<string, number> = { head: 0, assistant: 1, member: 2 };
        return (rank[a.unit_role] ?? 2) - (rank[b.unit_role] ?? 2) || getMemberName(a).localeCompare(getMemberName(b));
      }
      return getMemberName(a).localeCompare(getMemberName(b));
    });

    return members;
  }, [search, sort, unit]);

  const addMember = async (payload: { phone_number: string; role: UnitRole }) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/units/${unitId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to add member");

      toast.success("Member added to unit");
      setAddOpen(false);
      fetchUnit();
    } catch (err: any) {
      toast.error(err.message || "Failed to add member");
    } finally {
      setSaving(false);
    }
  };

  const changeRole = async (member: UnitMember, role: UnitRole) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/units/${unitId}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: member.id, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to update unit role");

      toast.success("Unit role updated");
      fetchUnit();
    } catch (err: any) {
      toast.error(err.message || "Failed to update unit role");
    } finally {
      setSaving(false);
    }
  };

  const canLoadFullMemberProfile =
    fullMemberDetailRoles.includes(viewer.role as any) ||
    viewer.permissions.includes(PERMISSION.MEMBERS_MANAGE) ||
    viewer.permissions.includes(PERMISSION.ADMINS_MANAGE);

  const openMemberDetail = async (member: UnitMember) => {
    setSelectedMember(member);
    if (!canLoadFullMemberProfile) return;

    try {
      const res = await fetch(`/api/members/${member.id}`);
      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        setSelectedMember({ ...data, unit_role: member.unit_role });
      }
    } catch {
      // Keep the roster-level profile visible if the full profile cannot be loaded.
    }
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

  if (!unit) {
    return (
      <div className="flex-1 p-4 md:p-8">
        <Card className="border-[var(--outline-variant)] bg-white">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <h2 className="font-headline text-2xl font-semibold text-[#0B1C30]">Unit unavailable</h2>
            <p className="mt-2 max-w-md text-sm text-[var(--on-surface-variant)]">
              This unit could not be loaded or you do not have access to it.
            </p>
            <Button asChild variant="secondary" className="mt-5">
              <Link href="/units">Back to Units</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full bg-[var(--background)] min-h-screen">
      {/* Desktop Header */}
      <div className="hidden md:block">
        <PageHeader
          eyebrow="Unit workspace"
          title={unit.name}
          description={unit.description || "Manage this unit's members and leadership responsibilities."}
          actions={
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" className="h-10 border-[var(--outline-variant)] bg-white font-semibold">
                <Link href="/units">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  All Units
                </Link>
              </Button>
              {unit.access.can_manage_members && (
                <Button
                  onClick={() => setAddOpen(true)}
                  className="h-10 bg-amber-500 text-white font-semibold hover:bg-amber-600 border border-transparent shadow-sm shadow-amber-200"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
              )}
            </div>
          }
        />
      </div>

      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-[var(--outline-variant)] sticky top-0 z-40 px-4 py-4 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-widest text-primary font-bold">Unit Workspace</span>
          <h1 className="text-2xl font-bold text-slate-900">{unit.name}</h1>
        </div>
        <div className="flex gap-2">
          <Button
            asChild
            variant="outline"
            className="h-10 border-[var(--outline-variant)] bg-white font-semibold"
            size="icon"
          >
            <Link href="/units">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          {unit.access.can_manage_members && (
            <Button
              onClick={() => setAddOpen(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white p-2 h-10 w-10 rounded-lg shadow-sm"
              size="icon"
            >
              <UserPlus className="h-5 w-5" />
            </Button>
          )}
        </div>
      </header>

      <main className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Workspace Key Stats */}
        <UnitWorkspaceStats unit={unit} />

        {/* Roster Listing Card */}
        <div className="overflow-hidden rounded-2xl md:rounded-xl border border-[var(--outline-variant)] bg-white shadow-sm">
          {/* Card Header Toolbar */}
          <div className="p-5 md:p-6 border-b border-[var(--outline-variant)] bg-white gap-5 flex flex-col">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-1">
              <div>
                <h2 className="font-headline text-xl font-bold text-[#0B1C30]">Unit Roster</h2>
                <p className="text-xs text-[var(--on-surface-variant)] mt-0.5">
                  {roster.length} of {unit.members.length} members shown
                </p>
              </div>
              <p className="font-mono text-[10px] font-bold uppercase leading-4 tracking-widest text-[var(--outline)]">
                Operational roster
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(260px,1fr)_220px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--outline)]" />
                <Input
                  type="search"
                  placeholder="Search members by name..."
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  className="h-11 border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] pl-10"
                />
              </div>
              <Select value={sort} onValueChange={value => setSort(value as SortMode)}>
                <SelectTrigger className="h-11 w-full border-[var(--outline-variant)] bg-white font-medium text-[#0B1C30]">
                  <SelectValue placeholder="Sort roster" />
                </SelectTrigger>
                <SelectContent className="border-[var(--outline-variant)]">
                  <SelectItem value="name-asc">Name, A-Z</SelectItem>
                  <SelectItem value="name-desc">Name, Z-A</SelectItem>
                  <SelectItem value="role">Leadership first</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Roster Content */}
          <CardContent className="p-0">
            {roster.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface-container-low)] text-[var(--on-surface-variant)]">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="font-headline font-bold text-[#0B1C30]">No members found</h3>
                <p className="mt-1 max-w-md text-sm text-[var(--on-surface-variant)]">
                  {search ? "Try another search term." : "Add members to build this unit roster."}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop View */}
                <UnitRosterTable
                  roster={roster}
                  canManageMembers={unit.access.can_manage_members}
                  saving={saving}
                  onViewDetails={openMemberDetail}
                  onChangeRole={changeRole}
                />

                {/* Mobile View */}
                <MobileRosterList
                  roster={roster}
                  canManageMembers={unit.access.can_manage_members}
                  saving={saving}
                  onViewDetails={openMemberDetail}
                  onChangeRole={changeRole}
                />
              </>
            )}
          </CardContent>
        </div>
      </main>

      {/* Mobile Floating Action Button (FAB) for adding member */}
      {unit.access.can_manage_members && (
        <button
          onClick={() => setAddOpen(true)}
          aria-label="Add Member"
          className="md:hidden fixed right-6 bottom-24 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/30 z-40 active:scale-95 transition-transform"
        >
          <Plus className="h-8 w-8 font-black" />
        </button>
      )}

      {/* Add Member dialog */}
      <UnitAddMemberModal open={addOpen} saving={saving} onOpenChange={setAddOpen} onSubmit={addMember} />

      {/* Member Details Drawer */}
      <MemberDetailDialog
        member={selectedMember}
        viewer={viewer}
        unitName={unit.name}
        onOpenChange={open => {
          if (!open) setSelectedMember(null);
        }}
      />
    </div>
  );
}
