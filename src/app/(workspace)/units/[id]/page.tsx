"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Eye, Search, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";

import type { AdminRole, Permission } from "@/lib/adminRoles";
import type { Member } from "@/lib/types";
import { MemberDetailDialog } from "@/components/members/member-detail-dialog";
import { PageHeader } from "@/components/page-header";
import { UnitAddMemberModal } from "@/components/units/unit-add-member-modal";
import { UnitLeaderCard } from "@/components/units/unit-leadership-summary";
import { UnitRoleMenu } from "@/components/units/unit-role-menu";
import type { ManagedUnit, UnitMember, UnitRole } from "@/components/units/types";
import { unitRoleLabels } from "@/components/units/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type SortMode = "name-asc" | "name-desc" | "role";

function getMemberName(member: UnitMember) {
  return [member.first_name, member.middle_name, member.last_name].filter(Boolean).join(" ");
}

function getInitials(member: UnitMember) {
  return `${member.first_name?.[0] || ""}${member.last_name?.[0] || ""}` || "M";
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
        const permissions = (data.permissions || data.user?.permissions || data.member?.permissions || []) as Permission[];
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
        member.member_type,
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
        const rank: Record<UnitRole, number> = { head: 0, assistant: 1, member: 2 };
        return rank[a.unit_role] - rank[b.unit_role] || getMemberName(a).localeCompare(getMemberName(b));
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
    ["super_admin", "pastor", "assistant_pastor"].includes(viewer.role || "") ||
    viewer.permissions.includes("members.manage") ||
    viewer.permissions.includes("admins.manage");

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
            <h2 className="font-[var(--font-manrope)] text-2xl font-semibold text-[#0B1C30]">Unit unavailable</h2>
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
    <div className="flex-1 w-full">
      <PageHeader
        eyebrow="Unit workspace"
        title={unit.name}
        description={unit.description || "Manage this unit's members and leadership responsibilities."}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" className="h-10 border-[var(--outline-variant)] bg-white">
              <Link href="/units">
                <ArrowLeft className="mr-2 h-4 w-4" />
                All Units
              </Link>
            </Button>
            {unit.access.can_manage_members ? (
              <Button onClick={() => setAddOpen(true)} variant="secondary">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="space-y-6 p-4 md:p-8">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-[var(--outline-variant)] bg-white shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-[var(--on-surface-variant)]">Total members</p>
                <p className="font-[var(--font-manrope)] text-3xl font-semibold text-[#0B1C30]">
                  {unit.stats.total_members}
                </p>
              </div>
            </CardContent>
          </Card>
          <UnitLeaderCard members={unit.members} role="head" />
          <UnitLeaderCard members={unit.members} role="assistant" />
        </div>

        <Card className="overflow-hidden border-[var(--outline-variant)] bg-white shadow-sm">
          <CardHeader className="gap-5 border-b border-[var(--outline-variant)] bg-white pb-5">
            <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
              <div>
                <CardTitle className="font-[var(--font-manrope)] text-xl text-[#0B1C30]">Unit Roster</CardTitle>
                <CardDescription>
                  {roster.length} of {unit.members.length} members shown
                </CardDescription>
              </div>
              <p className="font-mono text-[12px] font-medium uppercase leading-4 tracking-[0.05em] text-[var(--outline)]">
                Operational roster
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(260px,1fr)_220px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--outline)]" />
                <Input
                  type="search"
                  placeholder="Search members"
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  className="h-11 border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] pl-10"
                />
              </div>
              <Select value={sort} onValueChange={value => setSort(value as SortMode)}>
                <SelectTrigger className="h-11 w-full border-[var(--outline-variant)] bg-white">
                  <SelectValue placeholder="Sort roster" />
                </SelectTrigger>
                <SelectContent className="border-[var(--outline-variant)]">
                  <SelectItem value="name-asc">Name, A-Z</SelectItem>
                  <SelectItem value="name-desc">Name, Z-A</SelectItem>
                  <SelectItem value="role">Leadership first</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {roster.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface-container-low)]">
                  <Users className="h-8 w-8 text-[var(--on-surface-variant)]" />
                </div>
                <h3 className="font-semibold text-[#0B1C30]">No members found</h3>
                <p className="mt-1 max-w-md text-sm text-[var(--on-surface-variant)]">
                  {search ? "Try another search term." : "Add members to build this unit roster."}
                </p>
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <Table className="min-w-[820px]">
                    <TableHeader className="bg-[var(--surface-container-low)]">
                      <TableRow className="border-[var(--outline-variant)]">
                        <TableHead className="px-5 py-3 font-medium text-[#0B1C30]">Name</TableHead>
                        <TableHead className="px-5 py-3 font-medium text-[#0B1C30]">Contact</TableHead>
                        <TableHead className="px-5 py-3 font-medium text-[#0B1C30]">Type</TableHead>
                        <TableHead className="px-5 py-3 font-medium text-[#0B1C30]">Role</TableHead>
                        <TableHead className="px-5 py-3 text-right font-medium text-[#0B1C30]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roster.map(member => (
                        <TableRow key={member.id} className="border-[var(--outline-variant)] hover:bg-[var(--surface-container-low)]">
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
                          <TableCell className="px-5 py-4 text-sm text-[#0B1C30]">
                            {member.phone_number || "Not provided"}
                          </TableCell>
                          <TableCell className="px-5 py-4">
                            <Badge className="rounded-full bg-[var(--surface-container)] font-normal capitalize text-[#0B1C30] hover:bg-[var(--surface-container)]">
                              {(member.member_type || "member").replace(/_/g, " ")}
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
                                onClick={() => openMemberDetail(member)}
                                className="h-9 border-[var(--outline-variant)] bg-white text-primary hover:bg-[var(--surface-container)] hover:text-primary/90"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Button>
                              {unit.access.can_manage_members ? (
                                <UnitRoleMenu
                                  currentRole={member.unit_role}
                                  disabled={saving}
                                  onChange={role => changeRole(member, role)}
                                />
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="divide-y divide-[var(--outline-variant)] md:hidden">
                  {roster.map(member => (
                    <div
                      key={member.id}
                      className="space-y-3 px-4 py-4"
                    >
                      <button
                        type="button"
                        onClick={() => openMemberDetail(member)}
                        className="flex w-full items-center gap-3 text-left"
                      >
                        <Avatar className="h-11 w-11 border border-[var(--outline-variant)] bg-[var(--surface-container-low)]">
                          <AvatarImage src={member.photo_url || ""} />
                          <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                            {getInitials(member)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-[#0B1C30]">{getMemberName(member)}</p>
                          <p className="truncate text-xs text-[var(--on-surface-variant)]">
                            {member.phone_number || member.email || "No contact"}
                          </p>
                        </div>
                        <Badge className="shrink-0 rounded-full border border-[var(--outline-variant)] bg-white font-normal text-[var(--on-surface-variant)] hover:bg-white">
                          {unitRoleLabels[member.unit_role]}
                        </Badge>
                      </button>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openMemberDetail(member)}
                          className="h-9 border-[var(--outline-variant)] bg-white text-primary hover:bg-[var(--surface-container)] hover:text-primary/90"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                        {unit.access.can_manage_members ? (
                          <UnitRoleMenu
                            currentRole={member.unit_role}
                            disabled={saving}
                            onChange={role => changeRole(member, role)}
                          />
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <UnitAddMemberModal
        open={addOpen}
        saving={saving}
        onOpenChange={setAddOpen}
        onSubmit={addMember}
      />
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
