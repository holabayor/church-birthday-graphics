"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ChurchUnit, Member } from "@/lib/types";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Upload,
  User,
  Users,
  Download,
  FileUp,
  Loader2,
  SquarePen,
} from "lucide-react";

import { ADMIN_ROLE, PERMISSION, type AdminRole, type Permission } from "@/lib/adminRoles";
import { MemberDetailDialog } from "@/components/members/member-detail-dialog";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import { DirectoryFilters } from "@/components/members/directory-filters";
import { DirectoryTable } from "@/components/members/directory-table";
import { DirectoryListMobile } from "@/components/members/directory-list-mobile";
import { DirectoryStats } from "@/components/members/directory-stats";
import { FILTER_VALUE } from "@/lib/filterOptions";
import {
  LIFE_STAGE,
  MEMBERSHIP_STATUS,
  lifeStageOptions,
  membershipStatusOptions,
  normalizeLifeStage,
  normalizeMembershipStatus,
  usesGuardianProfile,
  usesNyscProfile,
  usesResidenceProfile,
  usesStudentProfile,
  usesWorkProfile,
  type LifeStage,
  type MembershipStatus,
} from "@/lib/memberLifecycle";
import { UNIT_ROLE, unitRoleOptions, type UnitRole } from "@/lib/unitRoles";
import { STUDENT_STATUS, studentStatusOptions, type StudentStatus } from "@/lib/studentStatus";
import { compressImage } from "@/lib/utils";

type UnitAssignmentChoice = typeof FILTER_VALUE.NONE | UnitRole;

function getMemberName(member: Member) {
  return [member.first_name, member.middle_name, member.last_name].filter(Boolean).join(" ");
}

function getWhatsAppHref(phone?: string | null) {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return null;
  const international = digits.startsWith("0") ? `234${digits.slice(1)}` : digits;
  return `https://wa.me/${international}`;
}

function getUnitSummary(member: Member) {
  const units = member.units || [];
  if (units.length === 0) return { visible: ["-"], extra: 0 };
  return {
    visible: units.slice(0, 2).map(unit => unit.name),
    extra: Math.max(0, units.length - 2),
  };
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91a9.86 9.86 0 0 0-2.91-7.01ZM12.05 20.15h-.01a8.25 8.25 0 0 1-4.21-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.55 3.7-8.25 8.26-8.25 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.42 5.83c0 4.55-3.7 8.24-8.23 8.24Zm4.52-6.17c-.25-.13-1.47-.73-1.7-.81-.23-.08-.39-.13-.56.13-.16.25-.64.81-.78.98-.14.16-.29.18-.54.06-.25-.13-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.14.16-.25.25-.42.08-.16.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.66.31-.23.25-.86.84-.86 2.05s.88 2.38 1 2.54c.13.16 1.73 2.64 4.19 3.7.59.25 1.04.4 1.4.52.59.19 1.12.16 1.54.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z" />
    </svg>
  );
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [units, setUnits] = useState<ChurchUnit[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("first_name");
  const [order, setOrder] = useState("asc");
  const [month, setMonth] = useState("");
  const [memberType, setMemberType] = useState<string>(FILTER_VALUE.ALL);
  const [unitId, setUnitId] = useState<string>(FILTER_VALUE.ALL);
  const [stats, setStats] = useState({ total: 0, students: 0, working: 0, visitors: 0 });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [viewing, setViewing] = useState<Member | null>(null);
  const [viewer, setViewer] = useState<{ role: AdminRole | null; permissions: Permission[] }>({
    role: null,
    permissions: [],
  });
  const [form, setForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    phone_number: "",
    email: "",
    date_of_birth: "",
    position: "",
    life_stage: LIFE_STAGE.OTHER as LifeStage,
    membership_status: MEMBERSHIP_STATUS.ACTIVE as MembershipStatus,
    institution: "",
    department: "",
    academic_level: "",
    student_status: STUDENT_STATUS.ACTIVE as StudentStatus,
    residence: "",
    cell_group: "",
    nysc_state: "",
    nysc_ppa: "",
    employer: "",
    job_title: "",
    work_location: "",
    graduation_year: "",
    guardian_name: "",
    guardian_phone: "",
    skills_interests: "",
  });
  const [unitAssignments, setUnitAssignments] = useState<Record<string, UnitAssignmentChoice>>({});
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const limit = 20;

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString(), sort, order });
    if (search) params.set("search", search);
    if (month && month !== FILTER_VALUE.ALL) params.set("month", month);
    if (memberType && memberType !== FILTER_VALUE.ALL) params.set("life_stage", memberType);
    if (unitId && unitId !== FILTER_VALUE.ALL) params.set("unit_id", unitId);

    const res = await fetch(`/api/members?${params.toString()}`);
    const data = await res.json();
    setMembers(Array.isArray(data.data) ? data.data : []);
    setTotal(data.total || 0);
    if (data.stats) {
      setStats(data.stats);
    }
    setLoading(false);
  }, [page, search, sort, order, month, memberType, unitId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    fetch("/api/units")
      .then(res => res.json())
      .then(data => setUnits(Array.isArray(data.data) ? data.data : []))
      .catch(() => setUnits([]));
  }, []);

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

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => setPage(1), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const canManage =
    viewer.role === ADMIN_ROLE.SUPER_ADMIN ||
    viewer.permissions.includes(PERMISSION.MEMBERS_MANAGE) ||
    viewer.permissions.includes(PERMISSION.ADMINS_MANAGE);
  const showStudentFields = usesStudentProfile(form.life_stage);
  const showNyscFields = usesNyscProfile(form.life_stage);
  const showWorkFields = usesWorkProfile(form.life_stage);
  const showGuardianFields = usesGuardianProfile(form.life_stage);
  const assignedUnits = units.filter(unit => {
    const role = unitAssignments[unit.id];
    return role && role !== FILTER_VALUE.NONE;
  });
  const availableUnits = units.filter(
    unit => !unitAssignments[unit.id] || unitAssignments[unit.id] === FILTER_VALUE.NONE,
  );

  const handleAddUnit = () => {
    if (!selectedUnitId) return;
    setUnitAssignments(assignments => ({
      ...assignments,
      [selectedUnitId]: UNIT_ROLE.MEMBER,
    }));
    setSelectedUnitId("");
  };

  const openAdd = () => {
    setEditing(null);
    setForm({
      first_name: "",
      middle_name: "",
      last_name: "",
      phone_number: "",
      email: "",
      date_of_birth: "",
      position: "",
      life_stage: LIFE_STAGE.OTHER,
      membership_status: MEMBERSHIP_STATUS.ACTIVE,
      institution: "",
      department: "",
      academic_level: "",
      student_status: STUDENT_STATUS.ACTIVE,
      residence: "",
      cell_group: "",
      nysc_state: "",
      nysc_ppa: "",
      employer: "",
      job_title: "",
      work_location: "",
      graduation_year: "",
      guardian_name: "",
      guardian_phone: "",
      skills_interests: "",
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setUnitAssignments({});
    setSelectedUnitId("");
    setShowForm(true);
  };

  const openEdit = (m: Member) => {
    setEditing(m);
    setForm({
      first_name: m.first_name,
      middle_name: m.middle_name || "",
      last_name: m.last_name,
      phone_number: m.phone_number || "",
      email: m.email || "",
      date_of_birth: m.date_of_birth,
      position: m.position || "",
      life_stage: normalizeLifeStage(m.life_stage),
      membership_status: normalizeMembershipStatus(m.membership_status, m.is_active),
      institution: m.institution || "",
      department: m.department || "",
      academic_level: m.academic_level || "",
      student_status: (m.student_status as StudentStatus) || STUDENT_STATUS.ACTIVE,
      residence: m.residence || "",
      cell_group: m.cell_group || "",
      nysc_state: m.nysc_state || "",
      nysc_ppa: m.nysc_ppa || "",
      employer: m.employer || "",
      job_title: m.job_title || "",
      work_location: m.work_location || "",
      graduation_year: m.graduation_year || "",
      guardian_name: m.guardian_name || "",
      guardian_phone: m.guardian_phone || "",
      skills_interests: m.skills_interests || "",
    });
    setPhotoFile(null);
    setPhotoPreview(m.photo_url || null);
    setUnitAssignments(Object.fromEntries((m.units || []).map(unit => [unit.id, unit.role || UNIT_ROLE.MEMBER])));
    setSelectedUnitId("");
    setShowForm(true);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    const compressedFile = await compressImage(file);
    const formData = new FormData();
    formData.append("file", compressedFile);
    formData.append("bucket", "church-assets");
    formData.append("folder", "members");
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    return data.url || null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let photoUrl: string | null | undefined = undefined;
      if (photoFile) {
        photoUrl = await uploadPhoto(photoFile);
      }

      const payload = {
        ...form,
        units: Object.entries(unitAssignments)
          .filter(([, role]) => role !== FILTER_VALUE.NONE)
          .map(([unit_id, role]) => ({ unit_id, role })),
        ...(photoUrl !== undefined ? { photo_url: photoUrl } : {}),
      };

      if (editing) {
        const res = await fetch(`/api/members/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to update member");
        }
        toast.success("Member updated");
      } else {
        const res = await fetch("/api/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to add member");
        }
        toast.success("Member added");
      }
      setShowForm(false);
      fetchMembers();
    } catch (error: any) {
      toast.error(error.message || "Failed to save member");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this member?")) return;
    const res = await fetch(`/api/members/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Member deleted");
      fetchMembers();
    } else {
      toast.error("Failed to delete member");
    }
  };

  const handleExport = () => {
    window.location.href = "/api/members/export";
  };

  const handleImportSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/members/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Import failed");

      toast.success(`Import complete: ${data.created} created, ${data.skipped} skipped, ${data.failed} failed`);
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        toast.info(data.errors.slice(0, 3).join(" "));
      }
      fetchMembers();
    } catch (err: any) {
      toast.error(err.message || "Failed to import members");
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  return (
    <div className="flex-1 w-full">
      <PageHeader
        eyebrow="People operations"
        title="Member Directory"
        description="Manage your congregation and view member details."
        actions={
          <>
            <input
              ref={importInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleImportSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => importInputRef.current?.click()}
              disabled={importing}
              className="hidden h-10 border-[var(--outline-variant)] bg-white text-primary hover:bg-[var(--surface-container)] hover:text-primary/90"
            >
              {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
              Import CSV
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleExport}
              className="max-md:hidden h-10 border-[var(--outline-variant)] bg-white text-primary hover:bg-[var(--surface-container)] hover:text-primary/90"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={openAdd} variant="secondary">
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </>
        }
      />

      <div className="space-y-8 p-4 md:p-8">
        <DirectoryStats
          total={stats.total}
          students={stats.students}
          working={stats.working}
          visitors={stats.visitors}
        />

        <Card className="overflow-hidden border-[var(--outline-variant)] bg-white shadow-sm">
          <CardHeader className="gap-5 border-b border-[var(--outline-variant)] bg-white pb-5">
            <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
              <div className="space-y-1">
                <CardTitle className="font-[var(--font-manrope)] text-xl text-[#0B1C30]">All Members</CardTitle>
                <CardDescription>Showing basic directory data for {total} members</CardDescription>
              </div>
              <p className="font-mono text-[12px] font-medium uppercase leading-4 tracking-[0.05em] text-[var(--outline)]">
                Directory table
              </p>
            </div>
          </CardHeader>

          <DirectoryFilters
            search={search}
            onSearchChange={val => {
              setSearch(val);
              setPage(1);
            }}
            memberType={memberType}
            onMemberTypeChange={val => {
              setMemberType(val);
              setPage(1);
            }}
            unitId={unitId}
            onUnitIdChange={val => {
              setUnitId(val);
              setPage(1);
            }}
            month={month}
            onMonthChange={val => {
              setMonth(val);
              setPage(1);
            }}
            sort={sort}
            order={order}
            onSortChange={(s, o) => {
              setSort(s);
              setOrder(o);
              setPage(1);
            }}
            units={units}
          />

          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div
                    key={i}
                    className="flex items-center space-x-4 border-b pb-4 last:border-0 last:pb-0 border-[var(--outline-variant)]/30"
                  >
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-3 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : members.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">No members found</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-1">
                  {search
                    ? "No members match your search criteria."
                    : "Get started by adding your first member to the directory."}
                </p>
                {!search && (
                  <Button onClick={openAdd} variant="outline" className="mt-6">
                    Add First Member
                  </Button>
                )}
              </div>
            ) : (
              <>
                <DirectoryTable
                  members={members}
                  onView={setViewing}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  canManageMembers={canManage}
                />
                <DirectoryListMobile members={members} onView={setViewing} />
              </>
            )}
          </CardContent>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col gap-3 px-4 py-4 border-t bg-muted/20 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-sm text-muted-foreground text-center sm:text-left">
                Showing <span className="font-medium text-foreground">{(page - 1) * limit + 1}</span> to{" "}
                <span className="font-medium text-foreground">{Math.min(page * limit, total)}</span> of{" "}
                <span className="font-medium text-foreground">{total}</span> members
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Prev
                </Button>
                <div className="text-sm font-medium px-2">
                  {page} / {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Add/Edit Modal */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-hidden border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-0 sm:max-w-3xl flex flex-col">
            <DialogHeader className="border-b border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] px-8 py-6 text-left">
              <DialogTitle className="font-headline text-2xl font-bold text-[#0B1C30]">
                {editing ? "Edit Member Details" : "Add New Member"}
              </DialogTitle>
              <DialogDescription className="text-sm text-[var(--on-surface-variant)] mt-1">
                {editing
                  ? "Modify this member's contact info, cell affiliation, and lifecycle details."
                  : "Enter details to register a new member in the Kinship community directory."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="flex max-h-[calc(100dvh-10rem)] min-h-0 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-8 py-6">
                {/* Photo Upload Section */}
                <div className="flex items-center gap-5 pb-4 border-b border-[var(--outline-variant)]/60">
                  <Avatar className="h-20 w-20 border-2 border-dashed border-[var(--outline-variant)]/60 flex items-center justify-center bg-white shadow-sm shrink-0">
                    {photoPreview ? (
                      <AvatarImage src={photoPreview} className="object-cover" />
                    ) : (
                      <AvatarFallback className="bg-transparent">
                        <User className="h-8 w-8 text-slate-400" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="space-y-1.5">
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => photoInputRef.current?.click()} className="border-[var(--outline-variant)] bg-white">
                      <Upload className="mr-2 h-4 w-4 text-[var(--outline)]" />
                      {photoPreview ? "Change Photo" : "Upload Photo"}
                    </Button>
                    <p className="text-[10px] text-[var(--outline)] font-medium">PNG, JPG or WEBP (auto-compressed).</p>
                  </div>
                </div>

                {/* Personal Details */}
                <div className="space-y-4">
                  <h4 className="font-mono text-[10px] uppercase tracking-wider text-[var(--secondary)] font-bold">Personal Profile</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="first_name" className="text-xs font-semibold text-slate-700">First Name <span className="text-red-500">*</span></Label>
                      <Input
                        id="first_name"
                        required
                        value={form.first_name}
                        onChange={e => setForm({ ...form, first_name: e.target.value })}
                        placeholder="e.g. John"
                        className="h-11 border-[var(--outline-variant)] bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name" className="text-xs font-semibold text-slate-700">Last Name <span className="text-red-500">*</span></Label>
                      <Input
                        id="last_name"
                        required
                        value={form.last_name}
                        onChange={e => setForm({ ...form, last_name: e.target.value })}
                        placeholder="e.g. Doe"
                        className="h-11 border-[var(--outline-variant)] bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="middle_name" className="text-xs font-semibold text-slate-700">Middle Name</Label>
                      <Input
                        id="middle_name"
                        value={form.middle_name}
                        onChange={e => setForm({ ...form, middle_name: e.target.value })}
                        placeholder="Optional"
                        className="h-11 border-[var(--outline-variant)] bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="date_of_birth" className="text-xs font-semibold text-slate-700">Date of Birth <span className="text-red-500">*</span></Label>
                      <Input
                        id="date_of_birth"
                        required
                        type="date"
                        value={form.date_of_birth}
                        onChange={e => setForm({ ...form, date_of_birth: e.target.value })}
                        className="h-11 border-[var(--outline-variant)] bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone_number" className="text-xs font-semibold text-slate-700">Phone Number</Label>
                      <Input
                        id="phone_number"
                        type="tel"
                        placeholder="e.g. 0803 123 4567"
                        value={form.phone_number}
                        onChange={e => setForm({ ...form, phone_number: e.target.value })}
                        className="h-11 border-[var(--outline-variant)] bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-semibold text-slate-700">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="member@example.com"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        className="h-11 border-[var(--outline-variant)] bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Church life Details */}
                <div className="space-y-4 pt-4 border-t border-[var(--outline-variant)]">
                  <h4 className="font-mono text-[10px] uppercase tracking-wider text-[var(--secondary)] font-bold">Church life & Role</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="life_stage" className="text-xs font-semibold text-slate-700">Life Stage</Label>
                      <Select value={form.life_stage} onValueChange={value => setForm({ ...form, life_stage: value as LifeStage })}>
                        <SelectTrigger id="life_stage" className="h-11 bg-white border-[var(--outline-variant)]">
                          <SelectValue placeholder="Select life stage" />
                        </SelectTrigger>
                        <SelectContent className="border-[var(--outline-variant)]">
                          {lifeStageOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="membership_status" className="text-xs font-semibold text-slate-700">Membership Status</Label>
                      <Select
                        value={form.membership_status}
                        onValueChange={value => setForm({ ...form, membership_status: value as MembershipStatus })}
                      >
                        <SelectTrigger id="membership_status" className="h-11 bg-white border-[var(--outline-variant)]">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="border-[var(--outline-variant)]">
                          {membershipStatusOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="position" className="text-xs font-semibold text-slate-700">Position / Role</Label>
                      <Input
                        id="position"
                        placeholder="e.g. Deacon, Usher, Member"
                        value={form.position}
                        onChange={e => setForm({ ...form, position: e.target.value })}
                        className="h-11 border-[var(--outline-variant)] bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="cell_group" className="text-xs font-semibold text-slate-700">Cell / Small Group</Label>
                      <Input
                        id="cell_group"
                        placeholder="e.g. Akoka Cell"
                        value={form.cell_group}
                        onChange={e => setForm({ ...form, cell_group: e.target.value })}
                        className="h-11 border-[var(--outline-variant)] bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="skills_interests" className="text-xs font-semibold text-slate-700">Skills & Interests</Label>
                      <Input
                        id="skills_interests"
                        placeholder="e.g. media, ushering, teaching"
                        value={form.skills_interests}
                        onChange={e => setForm({ ...form, skills_interests: e.target.value })}
                        className="h-11 border-[var(--outline-variant)] bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Lifecycle-Specific Profiles (Conditional) */}
                {(showStudentFields || showNyscFields || showWorkFields || showGuardianFields || usesResidenceProfile(form.life_stage)) && (
                  <div className="space-y-4 pt-4 border-t border-[var(--outline-variant)]">
                    <h4 className="font-mono text-[10px] uppercase tracking-wider text-[var(--secondary)] font-bold">Lifecycle Specific Profile</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {showStudentFields && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="institution" className="text-xs font-semibold text-slate-700">Institution</Label>
                            <Input
                              id="institution"
                              placeholder="e.g. University of Lagos"
                              value={form.institution}
                              onChange={e => setForm({ ...form, institution: e.target.value })}
                              className="h-11 border-[var(--outline-variant)] bg-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="department" className="text-xs font-semibold text-slate-700">Department / Course</Label>
                            <Input
                              id="department"
                              placeholder="e.g. Computer Science"
                              value={form.department}
                              onChange={e => setForm({ ...form, department: e.target.value })}
                              className="h-11 border-[var(--outline-variant)] bg-white"
                            />
                          </div>
                          {form.life_stage === LIFE_STAGE.STUDENT && (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="academic_level" className="text-xs font-semibold text-slate-700">Academic Level</Label>
                                <Input
                                  id="academic_level"
                                  placeholder="e.g. 300L, Final Year"
                                  value={form.academic_level}
                                  onChange={e => setForm({ ...form, academic_level: e.target.value })}
                                  className="h-11 border-[var(--outline-variant)] bg-white"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="student_status" className="text-xs font-semibold text-slate-700">Student Status</Label>
                                <Select
                                  value={form.student_status}
                                  onValueChange={value => setForm({ ...form, student_status: value as StudentStatus })}
                                >
                                  <SelectTrigger id="student_status" className="h-11 bg-white border-[var(--outline-variant)]">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent className="border-[var(--outline-variant)]">
                                    {studentStatusOptions.map(option => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </>
                          )}
                          {form.life_stage === LIFE_STAGE.GRADUATE && (
                            <div className="space-y-2">
                              <Label htmlFor="graduation_year" className="text-xs font-semibold text-slate-700">Graduation Year</Label>
                              <Input
                                id="graduation_year"
                                placeholder="e.g. 2026"
                                value={form.graduation_year}
                                onChange={e => setForm({ ...form, graduation_year: e.target.value })}
                                className="h-11 border-[var(--outline-variant)] bg-white"
                              />
                            </div>
                          )}
                        </>
                      )}

                      {usesResidenceProfile(form.life_stage) && (
                        <div className="space-y-2">
                          <Label htmlFor="residence" className="text-xs font-semibold text-slate-700">Residence / Hostel</Label>
                          <Input
                            id="residence"
                            placeholder="e.g. off-campus lodge"
                            value={form.residence}
                            onChange={e => setForm({ ...form, residence: e.target.value })}
                            className="h-11 border-[var(--outline-variant)] bg-white"
                          />
                        </div>
                      )}

                      {showNyscFields && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="nysc_state" className="text-xs font-semibold text-slate-700">NYSC State</Label>
                            <Input
                              id="nysc_state"
                              placeholder="e.g. Lagos"
                              value={form.nysc_state}
                              onChange={e => setForm({ ...form, nysc_state: e.target.value })}
                              className="h-11 border-[var(--outline-variant)] bg-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="nysc_ppa" className="text-xs font-semibold text-slate-700">Place of Primary Assignment</Label>
                            <Input
                              id="nysc_ppa"
                              placeholder="e.g. Government Secondary School"
                              value={form.nysc_ppa}
                              onChange={e => setForm({ ...form, nysc_ppa: e.target.value })}
                              className="h-11 border-[var(--outline-variant)] bg-white"
                            />
                          </div>
                        </>
                      )}

                      {showWorkFields && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="employer" className="text-xs font-semibold text-slate-700">Employer</Label>
                            <Input
                              id="employer"
                              placeholder="e.g. Acme Inc."
                              value={form.employer}
                              onChange={e => setForm({ ...form, employer: e.target.value })}
                              className="h-11 border-[var(--outline-variant)] bg-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="job_title" className="text-xs font-semibold text-slate-700">Job Title</Label>
                            <Input
                              id="job_title"
                              placeholder="e.g. Software Engineer"
                              value={form.job_title}
                              onChange={e => setForm({ ...form, job_title: e.target.value })}
                              className="h-11 border-[var(--outline-variant)] bg-white"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="work_location" className="text-xs font-semibold text-slate-700">Work Location</Label>
                            <Input
                              id="work_location"
                              placeholder="e.g. Ikeja, Lagos"
                              value={form.work_location}
                              onChange={e => setForm({ ...form, work_location: e.target.value })}
                              className="h-11 border-[var(--outline-variant)] bg-white"
                            />
                          </div>
                        </>
                      )}

                      {showGuardianFields && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="guardian_name" className="text-xs font-semibold text-slate-700">Guardian Name</Label>
                            <Input
                              id="guardian_name"
                              placeholder="Guardian Full Name"
                              value={form.guardian_name}
                              onChange={e => setForm({ ...form, guardian_name: e.target.value })}
                              className="h-11 border-[var(--outline-variant)] bg-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="guardian_phone" className="text-xs font-semibold text-slate-700">Guardian Phone</Label>
                            <Input
                              id="guardian_phone"
                              type="tel"
                              placeholder="Guardian Contact"
                              value={form.guardian_phone}
                              onChange={e => setForm({ ...form, guardian_phone: e.target.value })}
                              className="h-11 border-[var(--outline-variant)] bg-white"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Church Units Assignments */}
                <div className="space-y-4 pt-4 border-t border-[var(--outline-variant)]">
                  <h4 className="font-mono text-[10px] uppercase tracking-wider text-[var(--secondary)] font-bold">Ministry Unit Assignments</h4>
                  
                  <div className="space-y-4 p-5 border border-[var(--outline-variant)] rounded-xl bg-white/50">
                    {units.length > 0 ? (
                      <div className="space-y-4">
                        {availableUnits.length > 0 ? (
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Select value={selectedUnitId || undefined} onValueChange={setSelectedUnitId}>
                              <SelectTrigger className="bg-white border-[var(--outline-variant)] sm:flex-1 h-11">
                                <SelectValue placeholder="Choose a unit to assign" />
                              </SelectTrigger>
                              <SelectContent className="border-[var(--outline-variant)]">
                                {availableUnits.map(unit => (
                                  <SelectItem key={unit.id} value={unit.id}>
                                    {unit.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleAddUnit}
                              disabled={!selectedUnitId}
                              className="h-11 sm:w-auto border-[var(--outline-variant)] bg-white"
                            >
                              <Plus className="mr-2 h-4 w-4 text-[var(--outline)]" />
                              Add Assignment
                            </Button>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-[var(--outline-variant)] bg-white/80 p-4 text-center text-sm text-[var(--on-surface-variant)]">
                            All available church units have been selected.
                          </div>
                        )}

                        {assignedUnits.length > 0 ? (
                          <div className="grid grid-cols-1 gap-3 max-h-[220px] overflow-y-auto pr-1">
                            {assignedUnits.map(unit => (
                              <div
                                key={unit.id}
                                className="flex flex-col gap-3 rounded-xl border border-[var(--outline-variant)]/60 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-[#0B1C30] truncate">{unit.name}</p>
                                  {unit.description && (
                                    <p className="text-xs text-[var(--on-surface-variant)] truncate mt-0.5">{unit.description}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <Select
                                    value={unitAssignments[unit.id] || UNIT_ROLE.MEMBER}
                                    onValueChange={value =>
                                      setUnitAssignments(assignments => ({
                                        ...assignments,
                                        [unit.id]: value as UnitAssignmentChoice,
                                      }))
                                    }
                                  >
                                    <SelectTrigger className="w-[150px] bg-white border-[var(--outline-variant)] h-9 text-xs">
                                      <SelectValue placeholder="Role" />
                                    </SelectTrigger>
                                    <SelectContent className="border-[var(--outline-variant)]">
                                      {unitRoleOptions.map(option => (
                                        <SelectItem key={option.value} value={option.value} className="text-xs">
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={() =>
                                      setUnitAssignments(assignments => ({
                                        ...assignments,
                                        [unit.id]: FILTER_VALUE.NONE,
                                      }))
                                    }
                                  >
                                    <X className="h-4 w-4" />
                                    <span className="sr-only">Remove {unit.name}</span>
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-[var(--outline-variant)] bg-white/80 p-4 text-center text-sm text-[var(--on-surface-variant)]">
                            No unit assignments yet.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-[var(--outline-variant)] bg-white/80 p-4 text-center text-sm text-[var(--on-surface-variant)]">
                        No units available in this church community.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter className="border-t border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] px-8 py-6">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : editing ? (
                    "Save Changes"
                  ) : (
                    "Add Member"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <MemberDetailDialog
          member={viewing}
          viewer={viewer}
          onOpenChange={open => {
            if (!open) setViewing(null);
          }}
          actions={
            viewing ? (
              <>
                {getWhatsAppHref(viewing.phone_number) ? (
                  <Button
                    asChild
                    variant="outline"
                    aria-label="Open WhatsApp"
                    className="border-[var(--outline-variant)] text-[#007D55] hover:bg-[var(--surface-container)] hover:text-[#006242]"
                  >
                    <a href={getWhatsAppHref(viewing.phone_number) || "#"} target="_blank" rel="noreferrer">
                      <WhatsAppIcon className="h-4 w-4 min-[480px]:mr-2" />
                      <span className="hidden min-[480px]:inline">WhatsApp</span>
                    </a>
                  </Button>
                ) : null}
                <Button
                  aria-label="Edit member"
                  onClick={() => {
                    setViewing(null);
                    openEdit(viewing);
                  }}
                  variant="secondary"
                >
                  <SquarePen className="h-4 w-4 min-[480px]:mr-2" />
                  <span className="hidden min-[480px]:inline">Edit</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  aria-label="Delete member"
                  onClick={() => {
                    const id = viewing.id;
                    setViewing(null);
                    handleDelete(id);
                  }}
                  className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 min-[480px]:mr-2" />
                  <span className="hidden min-[480px]:inline">Delete</span>
                </Button>
              </>
            ) : null
          }
        />
      </div>
    </div>
  );
}
