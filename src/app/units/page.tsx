"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Loader2, Phone, Plus, RefreshCw, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type UnitRole = "member" | "assistant" | "head";

interface UnitMember {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  phone_number?: string | null;
  email?: string | null;
  member_type?: string | null;
  photo_url?: string | null;
  is_active?: boolean;
  unit_role: UnitRole;
}

interface ManagedUnit {
  id: string;
  name: string;
  description: string | null;
  members: UnitMember[];
  stats: {
    total_members: number;
    heads: number;
    assistants: number;
  };
  access: {
    can_manage_details: boolean;
    can_manage_members: boolean;
    role: "admin" | "head" | "assistant" | null;
  };
}

export default function UnitsPage() {
  const [units, setUnits] = useState<ManagedUnit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newMemberPhone, setNewMemberPhone] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<UnitRole>("member");

  const selectedUnit = useMemo(
    () => units.find(unit => unit.id === selectedUnitId) || units[0] || null,
    [units, selectedUnitId]
  );

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/units/management");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load units");
      setUnits(Array.isArray(data.data) ? data.data : []);
      setSelectedUnitId(current => current || data.data?.[0]?.id || "");
    } catch (err: any) {
      toast.error(err.message || "Failed to load units");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const addMemberToUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit || !newMemberPhone.trim()) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/units/${selectedUnit.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: newMemberPhone, role: newMemberRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add member");
      toast.success("Member added to unit");
      setNewMemberPhone("");
      setNewMemberRole("member");
      fetchUnits();
    } catch (err: any) {
      toast.error(err.message || "Failed to add member");
    } finally {
      setSaving(false);
    }
  };

  const updateMemberRole = async (memberId: string, role: UnitRole) => {
    if (!selectedUnit) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/units/${selectedUnit.id}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: memberId, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update role");
      toast.success("Unit role updated");
      fetchUnits();
    } catch (err: any) {
      toast.error(err.message || "Failed to update role");
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (memberId: string) => {
    if (!selectedUnit || !confirm("Remove this member from the unit?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/units/${selectedUnit.id}/members?member_id=${memberId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to remove member");
      toast.success("Member removed from unit");
      fetchUnits();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove member");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Unit Management</h1>
          <p className="text-muted-foreground font-medium">
            View unit members, leaders, assistants, and operational responsibilities.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={fetchUnits}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {units.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="font-semibold">No unit access yet</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              You will see units here when you are assigned as a unit head, assistant, or granted unit permissions.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {units.map(unit => (
              <button
                key={unit.id}
                type="button"
                onClick={() => setSelectedUnitId(unit.id)}
                className={`rounded-lg border bg-white p-4 text-left shadow-sm transition-colors ${
                  selectedUnit?.id === unit.id ? "border-zinc-900 ring-1 ring-zinc-900" : "border-zinc-200 hover:bg-zinc-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-zinc-950">{unit.name}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {unit.description || "No description"}
                    </p>
                  </div>
                  <Badge variant="outline" className="capitalize">{unit.access.role || "viewer"}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-md bg-zinc-50 p-2">
                    <div className="font-semibold text-zinc-900">{unit.stats.total_members}</div>
                    <div className="text-muted-foreground">Members</div>
                  </div>
                  <div className="rounded-md bg-zinc-50 p-2">
                    <div className="font-semibold text-zinc-900">{unit.stats.heads}</div>
                    <div className="text-muted-foreground">Heads</div>
                  </div>
                  <div className="rounded-md bg-zinc-50 p-2">
                    <div className="font-semibold text-zinc-900">{unit.stats.assistants}</div>
                    <div className="text-muted-foreground">Assistants</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {selectedUnit && (
            <Card className="shadow-sm">
              <CardHeader className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {selectedUnit.name}
                    </CardTitle>
                    <CardDescription>{selectedUnit.description || "Unit member roster and leadership roles."}</CardDescription>
                  </div>
                  <Badge variant={selectedUnit.access.can_manage_members ? "secondary" : "outline"}>
                    {selectedUnit.access.can_manage_members ? "Can manage members" : "View only"}
                  </Badge>
                </div>

                {selectedUnit.access.can_manage_members && (
                  <form onSubmit={addMemberToUnit} className="grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50/60 p-3 md:grid-cols-[1fr_160px_auto]">
                    <div className="space-y-1.5">
                      <Label htmlFor="new_member_phone">Add member by phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="new_member_phone"
                          value={newMemberPhone}
                          onChange={e => setNewMemberPhone(e.target.value)}
                          placeholder="08031234567"
                          className="bg-white pl-9"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Role</Label>
                      <Select value={newMemberRole} onValueChange={value => setNewMemberRole(value as UnitRole)}>
                        <SelectTrigger className="bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="assistant">Assistant</SelectItem>
                          <SelectItem value="head">Head</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" disabled={saving || !newMemberPhone.trim()} className="self-end">
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                      Add
                    </Button>
                  </form>
                )}
              </CardHeader>

              <CardContent className="p-0">
                {selectedUnit.members.length === 0 ? (
                  <div className="px-6 py-12 text-center text-sm text-muted-foreground">No members assigned to this unit yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table className="min-w-[760px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Member</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Unit Role</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedUnit.members.map(member => (
                          <TableRow key={member.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                  <AvatarImage src={member.photo_url || ""} />
                                  <AvatarFallback>{member.first_name?.[0]}{member.last_name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">
                                    {member.first_name} {member.middle_name ? `${member.middle_name} ` : ""}{member.last_name}
                                  </div>
                                  {member.is_active === false && <div className="text-xs text-destructive">Inactive</div>}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{member.phone_number || "-"}</div>
                              <div className="text-xs text-muted-foreground">{member.email || ""}</div>
                            </TableCell>
                            <TableCell className="capitalize">{(member.member_type || "member").replace(/_/g, " ")}</TableCell>
                            <TableCell>
                              {selectedUnit.access.can_manage_members ? (
                                <Select value={member.unit_role} onValueChange={value => updateMemberRole(member.id, value as UnitRole)}>
                                  <SelectTrigger className="w-[150px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="member">Member</SelectItem>
                                    <SelectItem value="assistant">Assistant</SelectItem>
                                    <SelectItem value="head">Head</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Badge variant="outline" className="capitalize">{member.unit_role}</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {selectedUnit.access.can_manage_members && (
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeMember(member.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
