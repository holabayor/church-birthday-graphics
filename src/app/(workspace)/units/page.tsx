"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Building2, Plus, Search, SquarePen, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { UnitFormModal } from "@/components/units/unit-form-modal";
import { UnitLeadershipStack } from "@/components/units/unit-leadership-summary";
import type { ManagedUnit } from "@/components/units/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type SortMode = "name-asc" | "name-desc" | "members-desc" | "members-asc";

export default function UnitsPage() {
  const [units, setUnits] = useState<ManagedUnit[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortMode>("name-asc");
  const [formOpen, setFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<ManagedUnit | null>(null);

  const canManageUnits = permissions.includes("units.manage") || units.some(unit => unit.access.can_manage_details);

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const [unitsRes, authRes] = await Promise.all([fetch("/api/units/management"), fetch("/api/auth")]);
      const unitsData = await unitsRes.json();
      const authData = authRes.ok ? await authRes.json() : {};

      if (!unitsRes.ok) throw new Error(unitsData.error || "Failed to load units");
      setUnits(Array.isArray(unitsData.data) ? unitsData.data : []);
      setPermissions(authData.permissions || authData.user?.permissions || authData.member?.permissions || []);
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
    const next = units.filter(
      unit => !query || unit.name.toLowerCase().includes(query) || unit.description?.toLowerCase().includes(query),
    );

    next.sort((a, b) => {
      if (sort === "name-desc") return b.name.localeCompare(a.name);
      if (sort === "members-desc") return b.stats.total_members - a.stats.total_members;
      if (sort === "members-asc") return a.stats.total_members - b.stats.total_members;
      return a.name.localeCompare(b.name);
    });

    return next;
  }, [search, sort, units]);

  const openCreate = () => {
    setEditingUnit(null);
    setFormOpen(true);
  };

  const openEdit = (unit: ManagedUnit) => {
    setEditingUnit(unit);
    setFormOpen(true);
  };

  const saveUnit = async (payload: { name: string; description: string }) => {
    setSaving(true);
    try {
      const res = await fetch(editingUnit ? `/api/units/${editingUnit.id}` : "/api/units", {
        method: editingUnit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to save unit");

      toast.success(editingUnit ? "Unit updated" : "Unit created");
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
        eyebrow="Operational view"
        title="Unit Management"
        description="Find, create, and manage church units from one focused workspace."
        actions={
          canManageUnits ? (
            <Button onClick={openCreate} variant="secondary">
              <Plus className="mr-2 h-4 w-4" />
              Create Unit
            </Button>
          ) : null
        }
      />

      <div className="space-y-6 p-4 md:p-8">
        <Card className="overflow-hidden border-[var(--outline-variant)] bg-white shadow-sm">
          <CardHeader className="gap-5 border-b border-[var(--outline-variant)] bg-white pb-5">
            <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
              <div>
                <CardTitle className="font-[var(--font-manrope)] text-xl text-[#0B1C30]">All Units</CardTitle>
                <CardDescription>
                  {filteredUnits.length} of {units.length} units visible to you
                </CardDescription>
              </div>
              <p className="font-mono text-[12px] font-medium uppercase leading-4 tracking-[0.05em] text-[var(--outline)]">
                Unit index
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(260px,1fr)_220px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--outline)]" />
                <Input
                  type="search"
                  placeholder="Search units"
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  className="h-11 border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] pl-10"
                />
              </div>
              <Select value={sort} onValueChange={value => setSort(value as SortMode)}>
                <SelectTrigger className="h-11 w-full border-[var(--outline-variant)] bg-white">
                  <SelectValue placeholder="Sort units" />
                </SelectTrigger>
                <SelectContent className="border-[var(--outline-variant)]">
                  <SelectItem value="name-asc">Name, A-Z</SelectItem>
                  <SelectItem value="name-desc">Name, Z-A</SelectItem>
                  <SelectItem value="members-desc">Most members</SelectItem>
                  <SelectItem value="members-asc">Fewest members</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredUnits.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface-container-low)]">
                  <Building2 className="h-8 w-8 text-[var(--on-surface-variant)]" />
                </div>
                <h3 className="font-semibold text-[#0B1C30]">No units found</h3>
                <p className="mt-1 max-w-md text-sm text-[var(--on-surface-variant)]">
                  {search ? "Try a different search term." : "Create a unit to start assigning leaders and members."}
                </p>
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <Table className="min-w-[760px]">
                    <TableHeader className="bg-[var(--surface-container-low)]">
                      <TableRow className="border-[var(--outline-variant)]">
                        <TableHead className="px-5 py-3 font-medium text-[#0B1C30]">Unit</TableHead>
                        <TableHead className="px-5 py-3 font-medium text-[#0B1C30]">Members</TableHead>
                        <TableHead className="px-5 py-3 font-medium text-[#0B1C30]">Leadership</TableHead>
                        <TableHead className="px-5 py-3 text-right font-medium text-[#0B1C30]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUnits.map(unit => (
                        <TableRow
                          key={unit.id}
                          className="border-[var(--outline-variant)] hover:bg-[var(--surface-container-low)]"
                        >
                          <TableCell className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Building2 className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <Link
                                  href={`/units/${unit.id}`}
                                  className="font-semibold text-foreground hover:text-primary"
                                >
                                  {unit.name}
                                </Link>
                                <p className="line-clamp-1 text-xs text-[var(--on-surface-variant)]">
                                  {unit.description || "No description"}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-5 py-4">
                            <Badge className="rounded-full bg-[var(--surface-container)] font-normal text-[#0B1C30] hover:bg-[var(--surface-container)]">
                              <Users className="mr-1.5 h-3.5 w-3.5" />
                              {unit.stats.total_members}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-5 py-4">
                            <UnitLeadershipStack members={unit.members} />
                          </TableCell>
                          <TableCell className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="h-9 border-[var(--outline-variant)] bg-white text-primary hover:bg-[var(--surface-container)] hover:text-primary/90"
                              >
                                <Link href={`/units/${unit.id}`}>View</Link>
                              </Button>
                              {unit.access.can_manage_details ? (
                                <>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    // size="icon"
                                    onClick={() => openEdit(unit)}
                                    className="h-9"
                                  >
                                    Edit
                                    <span className="sr-only"></span>
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => deleteUnit(unit)}
                                    disabled={saving}
                                    className="h-9 hover:bg-destructive/10 hover:text-destructive"
                                  >
                                    Delete
                                  </Button>
                                </>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="divide-y divide-[var(--outline-variant)] md:hidden">
                  {filteredUnits.map(unit => (
                    <div key={unit.id} className="space-y-4 px-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/units/${unit.id}`}
                            className="font-semibold text-foreground hover:text-primary"
                          >
                            {unit.name}
                          </Link>
                          <p className="mt-1 line-clamp-2 text-xs text-[var(--on-surface-variant)]">
                            {unit.description || "No description"}
                          </p>
                        </div>
                        <Badge className="shrink-0 rounded-full bg-[var(--surface-container)] font-normal text-[#0B1C30] hover:bg-[var(--surface-container)]">
                          <Users className="mr-1.5 h-3.5 w-3.5" />
                          {unit.stats.total_members}
                        </Badge>
                      </div>

                      <div className="rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] px-3 py-3">
                        <UnitLeadershipStack members={unit.members} />
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-9 border-[var(--outline-variant)] bg-white text-primary hover:bg-[var(--surface-container)] hover:text-primary/90"
                        >
                          <Link href={`/units/${unit.id}`}>View</Link>
                        </Button>
                        {unit.access.can_manage_details ? (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(unit)}
                              className="h-9 w-9 text-[var(--on-surface-variant)] hover:bg-[var(--surface-container)] hover:text-primary"
                            >
                              <SquarePen className="h-4 w-4" />
                              <span className="sr-only">Edit unit</span>
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteUnit(unit)}
                              disabled={saving}
                              className="h-9 w-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete unit</span>
                            </Button>
                          </>
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
