"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ChurchUnit, Member } from "@/lib/types";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, X, ChevronLeft, ChevronRight, Upload, User, Users, Phone, Mail, CalendarDays, GraduationCap, MapPin, BookOpen, Download, FileUp, Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

type UnitAssignmentChoice = "none" | "member" | "assistant" | "head";

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
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [viewing, setViewing] = useState<Member | null>(null);
  const [form, setForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    phone_number: "",
    email: "",
    date_of_birth: "",
    position: "",
    member_type: "member",
    institution: "",
    department: "",
    academic_level: "",
    student_status: "active_student",
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
    if (month && month !== "all") params.set("month", month);
    const res = await fetch(`/api/members?${params.toString()}`);
    const data = await res.json();
    setMembers(Array.isArray(data.data) ? data.data : []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, search, sort, order, month]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    fetch("/api/units")
      .then(res => res.json())
      .then(data => setUnits(Array.isArray(data.data) ? data.data : []))
      .catch(() => setUnits([]));
  }, []);

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => setPage(1), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const showStudentFields = form.member_type === "student" || form.member_type === "alumnus";
  const showNyscFields = form.member_type === "nysc";
  const showWorkFields = form.member_type === "worker" || form.member_type === "alumnus";
  const showGuardianFields = form.member_type === "student" || form.member_type === "visitor";
  const assignedUnits = units.filter(unit => {
    const role = unitAssignments[unit.id];
    return role && role !== "none";
  });
  const availableUnits = units.filter(unit => !unitAssignments[unit.id] || unitAssignments[unit.id] === "none");

  const handleAddUnit = () => {
    if (!selectedUnitId) return;
    setUnitAssignments(assignments => ({
      ...assignments,
      [selectedUnitId]: "member",
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
      member_type: "member",
      institution: "",
      department: "",
      academic_level: "",
      student_status: "active_student",
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
      member_type: m.member_type || "member",
      institution: m.institution || "",
      department: m.department || "",
      academic_level: m.academic_level || "",
      student_status: m.student_status || "active_student",
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
    setUnitAssignments(
      Object.fromEntries((m.units || []).map(unit => [unit.id, unit.role || "member"]))
    );
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
    const formData = new FormData();
    formData.append("file", file);
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
          .filter(([, role]) => role !== "none")
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
    } catch(error: any) {
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
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 w-full">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Member Directory</h1>
          <p className="text-muted-foreground font-medium">
            Manage your congregation and view member details.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
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
            className="shadow-sm"
            size="lg"
          >
            {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
            Import CSV
          </Button>
          <Button type="button" variant="outline" onClick={handleExport} className="shadow-sm" size="lg">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={openAdd} className="shadow-sm" size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4">
          <div className="space-y-1">
            <CardTitle>All Members</CardTitle>
            <CardDescription>
              {total} members total in your directory
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Select value={month} onValueChange={(val) => { setMonth(val); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[140px] bg-background">
                <SelectValue placeholder="Birth Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                <SelectItem value="1">January</SelectItem>
                <SelectItem value="2">February</SelectItem>
                <SelectItem value="3">March</SelectItem>
                <SelectItem value="4">April</SelectItem>
                <SelectItem value="5">May</SelectItem>
                <SelectItem value="6">June</SelectItem>
                <SelectItem value="7">July</SelectItem>
                <SelectItem value="8">August</SelectItem>
                <SelectItem value="9">September</SelectItem>
                <SelectItem value="10">October</SelectItem>
                <SelectItem value="11">November</SelectItem>
                <SelectItem value="12">December</SelectItem>
              </SelectContent>
            </Select>

            <Select value={`${sort}-${order}`} onValueChange={(val) => {
              const [s, o] = val.split("-");
              setSort(s);
              setOrder(o);
              setPage(1);
            }}>
              <SelectTrigger className="w-full sm:w-[180px] bg-background">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="first_name-asc">First Name (A-Z)</SelectItem>
                <SelectItem value="first_name-desc">First Name (Z-A)</SelectItem>
                <SelectItem value="last_name-asc">Last Name (A-Z)</SelectItem>
                <SelectItem value="last_name-desc">Last Name (Z-A)</SelectItem>
                <SelectItem value="date_of_birth-asc">Birth Date (Oldest)</SelectItem>
                <SelectItem value="date_of_birth-desc">Birth Date (Youngest)</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search members..."
                className="pl-9 bg-background w-full"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-4 border-b pb-4 last:border-0 last:pb-0">
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
                {search ? "No members match your search criteria." : "Get started by adding your first member to the directory."}
              </p>
              {!search && (
                <Button onClick={openAdd} variant="outline" className="mt-6">
                  Add First Member
                </Button>
              )}
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
            <Table className="min-w-[980px]">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[300px]">Member</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Lifecycle Info</TableHead>
                  <TableHead>Date of Birth</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map(m => (
                  <TableRow key={m.id} className="group hover:bg-muted/50 cursor-pointer" onClick={() => setViewing(m)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-muted shadow-sm">
                          <AvatarImage src={m.photo_url || ""} />
                          <AvatarFallback className="bg-primary/5 text-primary">
                            {m.first_name[0]}{m.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">
                            {m.last_name}, {m.first_name} {m.middle_name}
                          </span>
                          <span className="text-xs text-muted-foreground hidden sm:block">
                            ID: {m.id.substring(0, 8)}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-1 text-sm text-muted-foreground">
                        <span className="text-foreground">{m.phone_number || "-"}</span>
                        <span className="text-xs">{m.email || ""}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-1 text-sm">
                        <span className="font-medium text-foreground capitalize">
                          {(m.member_type || "member").replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {m.member_type === "nysc"
                            ? [m.nysc_state, m.nysc_ppa].filter(Boolean).join(" - ") || "No NYSC details"
                            : m.member_type === "worker"
                              ? [m.job_title, m.employer].filter(Boolean).join(" - ") || "No work details"
                              : m.member_type === "student" || m.member_type === "alumnus"
                                ? [m.institution, m.department, m.academic_level || m.graduation_year].filter(Boolean).join(" - ") || "No academic details"
                                : m.member_type === "visitor"
                                  ? "Visitor profile"
                                  : "General member"}
                        </span>
                        {m.cell_group && (
                          <span className="text-xs text-muted-foreground">{m.cell_group}</span>
                        )}
                        {(m.units || []).length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {(m.units || []).map(unit => unit.name).join(", ")}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(m.date_of_birth).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </TableCell>
                    <TableCell>
                      {m.position ? (
                        <Badge variant="secondary" className="font-normal">
                          {m.position}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); openEdit(m); }}
                          className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col gap-3 px-4 py-4 border-t bg-muted/20 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm text-muted-foreground text-center sm:text-left">
              Showing <span className="font-medium text-foreground">{(page - 1) * limit + 1}</span> to <span className="font-medium text-foreground">{Math.min(page * limit, total)}</span> of <span className="font-medium text-foreground">{total}</span> members
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
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowForm(false)}
          />
          <Card className="my-4 w-full max-w-lg z-50 max-h-[calc(100dvh-2rem)] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200 border-border">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div>
                <CardTitle>{editing ? "Edit Member Details" : "Add New Member"}</CardTitle>
                <CardDescription>
                  {editing ? "Update the information for this directory member." : "Enter the details to add a new member to the directory."}
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowForm(false)}
                className="h-8 w-8 rounded-full -mt-2 -mr-2"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Photo Upload */}
                <div className="flex items-center gap-5">
                  <Avatar className="h-20 w-20 border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                    {photoPreview ? (
                      <AvatarImage src={photoPreview} className="object-cover" />
                    ) : (
                      <AvatarFallback className="bg-transparent">
                        <User className="h-8 w-8 text-muted-foreground/50" />
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => photoInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {photoPreview ? "Change Photo" : "Upload Photo"}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG or WEBP up to 5MB.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      First Name *
                    </label>
                    <Input
                      required
                      value={form.first_name}
                      onChange={e => setForm({ ...form, first_name: e.target.value })}
                      placeholder="e.g. John"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Last Name *
                    </label>
                    <Input
                      required
                      value={form.last_name}
                      onChange={e => setForm({ ...form, last_name: e.target.value })}
                      placeholder="e.g. Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Middle Name
                    </label>
                    <Input
                      value={form.middle_name}
                      onChange={e => setForm({ ...form, middle_name: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Date of Birth *
                    </label>
                    <Input
                      required
                      type="date"
                      value={form.date_of_birth}
                      onChange={e => setForm({ ...form, date_of_birth: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Phone Number
                    </label>
                    <Input
                      type="tel"
                      placeholder="+1 234 567 8900"
                      value={form.phone_number}
                      onChange={e => setForm({ ...form, phone_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      placeholder="member@example.com"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Member Type
                    </label>
                    <Select
                      value={form.member_type}
                      onValueChange={value => setForm({ ...form, member_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select member type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="nysc">NYSC / Service</SelectItem>
                        <SelectItem value="worker">Worker</SelectItem>
                        <SelectItem value="alumnus">Alumnus</SelectItem>
                        <SelectItem value="visitor">Visitor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Position/Role
                    </label>
                    <Input
                      placeholder="e.g. Choir Leader, Deacon, Member"
                      value={form.position}
                      onChange={e => setForm({ ...form, position: e.target.value })}
                    />
                  </div>
                  {showStudentFields && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Institution
                        </label>
                        <Input
                          placeholder="e.g. University of Lagos"
                          value={form.institution}
                          onChange={e => setForm({ ...form, institution: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Department / Course
                        </label>
                        <Input
                          placeholder="e.g. Computer Science"
                          value={form.department}
                          onChange={e => setForm({ ...form, department: e.target.value })}
                        />
                      </div>
                      {form.member_type === "student" && (
                        <>
                          <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              Academic Level
                            </label>
                            <Input
                              placeholder="e.g. 200L, Final Year"
                              value={form.academic_level}
                              onChange={e => setForm({ ...form, academic_level: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              Student Status
                            </label>
                            <Select
                              value={form.student_status}
                              onValueChange={value => setForm({ ...form, student_status: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active_student">Active Student</SelectItem>
                                <SelectItem value="fresher">Fresher</SelectItem>
                                <SelectItem value="final_year">Final Year</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                      {form.member_type === "alumnus" && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Graduation Year
                          </label>
                          <Input
                            placeholder="e.g. 2026"
                            value={form.graduation_year}
                            onChange={e => setForm({ ...form, graduation_year: e.target.value })}
                          />
                        </div>
                      )}
                    </>
                  )}
                  {(form.member_type === "student" || form.member_type === "nysc" || form.member_type === "visitor") && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Residence / Hostel
                      </label>
                      <Input
                        placeholder="e.g. Moremi Hall, off-campus lodge"
                        value={form.residence}
                        onChange={e => setForm({ ...form, residence: e.target.value })}
                      />
                    </div>
                  )}
                  {showNyscFields && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          NYSC State
                        </label>
                        <Input
                          placeholder="e.g. Lagos"
                          value={form.nysc_state}
                          onChange={e => setForm({ ...form, nysc_state: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Place of Primary Assignment
                        </label>
                        <Input
                          placeholder="e.g. Government College"
                          value={form.nysc_ppa}
                          onChange={e => setForm({ ...form, nysc_ppa: e.target.value })}
                        />
                      </div>
                    </>
                  )}
                  {showWorkFields && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Employer
                        </label>
                        <Input
                          placeholder="e.g. Acme Ltd"
                          value={form.employer}
                          onChange={e => setForm({ ...form, employer: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Job Title
                        </label>
                        <Input
                          placeholder="e.g. Product Designer"
                          value={form.job_title}
                          onChange={e => setForm({ ...form, job_title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Work Location
                        </label>
                        <Input
                          placeholder="e.g. Yaba, Lagos"
                          value={form.work_location}
                          onChange={e => setForm({ ...form, work_location: e.target.value })}
                        />
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Cell / Small Group
                    </label>
                    <Input
                      placeholder="e.g. Akoka Cell"
                      value={form.cell_group}
                      onChange={e => setForm({ ...form, cell_group: e.target.value })}
                    />
                  </div>
                  {showGuardianFields && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Guardian Name
                        </label>
                        <Input
                          placeholder="Optional"
                          value={form.guardian_name}
                          onChange={e => setForm({ ...form, guardian_name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Guardian Phone
                        </label>
                        <Input
                          type="tel"
                          placeholder="Optional"
                          value={form.guardian_phone}
                          onChange={e => setForm({ ...form, guardian_phone: e.target.value })}
                        />
                      </div>
                    </>
                  )}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Skills / Interests
                    </label>
                    <Input
                      placeholder="e.g. media, music, ushering, teaching"
                      value={form.skills_interests}
                      onChange={e => setForm({ ...form, skills_interests: e.target.value })}
                    />
                  </div>
                  <div className="space-y-3 md:col-span-2 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4">
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-900">Church Units</h4>
                      <p className="text-xs text-muted-foreground">
                        Assign this member to ministry/service units and set their responsibility.
                      </p>
                    </div>
                    {units.length > 0 ? (
                      <div className="space-y-4">
                        {availableUnits.length > 0 ? (
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Select value={selectedUnitId || undefined} onValueChange={setSelectedUnitId}>
                              <SelectTrigger className="bg-white sm:flex-1">
                                <SelectValue placeholder="Choose a unit to add" />
                              </SelectTrigger>
                              <SelectContent>
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
                              className="sm:w-auto"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add Unit
                            </Button>
                          </div>
                        ) : (
                          <div className="rounded-md border border-dashed border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700">
                            All available units have been selected.
                          </div>
                        )}

                        {assignedUnits.length > 0 ? (
                          <div className="space-y-2">
                            {assignedUnits.map(unit => (
                              <div
                                key={unit.id}
                                className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-white p-3 sm:flex-row sm:items-center"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-zinc-900">{unit.name}</p>
                                  {unit.description && (
                                    <p className="truncate text-xs text-muted-foreground">{unit.description}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Select
                                    value={unitAssignments[unit.id] || "member"}
                                    onValueChange={value =>
                                      setUnitAssignments(assignments => ({
                                        ...assignments,
                                        [unit.id]: value as UnitAssignmentChoice,
                                      }))
                                    }
                                  >
                                    <SelectTrigger className="w-[150px] bg-white">
                                      <SelectValue placeholder="Role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="member">Member</SelectItem>
                                      <SelectItem value="assistant">Assistant</SelectItem>
                                      <SelectItem value="head">Head</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="shrink-0 text-muted-foreground hover:text-destructive"
                                    onClick={() =>
                                      setUnitAssignments(assignments => ({
                                        ...assignments,
                                        [unit.id]: "none",
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
                          <div className="rounded-md border border-dashed border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700">
                            No units selected yet.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-md border border-dashed border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700">
                        No church units have been created yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : editing ? "Save Changes" : "Add Member"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Profile Slide-over */}
      <Sheet open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="text-left pb-4 border-b border-border/50">
            <SheetTitle>Member Profile</SheetTitle>
            <SheetDescription>Detailed view of the member's information.</SheetDescription>
          </SheetHeader>
          {viewing && (
            <div className="py-6 space-y-8">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                  <AvatarImage src={viewing.photo_url || ""} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {viewing.first_name[0]}{viewing.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center space-y-1">
                  <h3 className="text-2xl font-bold tracking-tight">
                    {viewing.first_name} {viewing.middle_name ? viewing.middle_name + " " : ""}{viewing.last_name}
                  </h3>
                  {viewing.position && (
                    <Badge variant="secondary" className="px-3 py-1 font-medium mt-1">
                      {viewing.position}
                    </Badge>
                  )}
                  <Badge variant="outline" className="px-3 py-1 font-medium mt-1 capitalize">
                    {(viewing.member_type || "member").replace(/_/g, " ")}
                  </Badge>
                  {(viewing.member_type || "member") === "student" && viewing.student_status && (
                    <Badge variant="outline" className="px-3 py-1 font-medium mt-1 capitalize">
                      {viewing.student_status.replace(/_/g, " ")}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs font-medium">Phone Number</span>
                      <span className="font-medium text-foreground">{viewing.phone_number || "Not provided"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs font-medium">Email Address</span>
                      <span className="font-medium text-foreground">{viewing.email || "Not provided"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <CalendarDays className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs font-medium">Date of Birth</span>
                      <span className="font-medium text-foreground">
                        {new Date(viewing.date_of_birth).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                  {(["student", "alumnus"].includes(viewing.member_type || "member")) && (
                    <>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <GraduationCap className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground text-xs font-medium">Institution</span>
                          <span className="font-medium text-foreground">{viewing.institution || "Not provided"}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground text-xs font-medium">Department / Level</span>
                          <span className="font-medium text-foreground">
                            {[viewing.department, viewing.academic_level || viewing.graduation_year].filter(Boolean).join(" - ") || "Not provided"}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                  {viewing.member_type === "nysc" && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs font-medium">NYSC Details</span>
                        <span className="font-medium text-foreground">
                          {[viewing.nysc_state, viewing.nysc_ppa].filter(Boolean).join(" - ") || "Not provided"}
                        </span>
                      </div>
                    </div>
                  )}
                  {(["worker", "alumnus"].includes(viewing.member_type || "")) && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs font-medium">Work Details</span>
                        <span className="font-medium text-foreground">
                          {[viewing.job_title, viewing.employer, viewing.work_location].filter(Boolean).join(" - ") || "Not provided"}
                        </span>
                      </div>
                    </div>
                  )}
                  {(["student", "nysc", "visitor"].includes(viewing.member_type || "member") || viewing.cell_group) && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs font-medium">Residence / Cell</span>
                        <span className="font-medium text-foreground">
                          {[viewing.residence, viewing.cell_group].filter(Boolean).join(" - ") || "Not provided"}
                        </span>
                      </div>
                    </div>
                  )}
                  {(["student", "visitor"].includes(viewing.member_type || "member")) && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs font-medium">Guardian Contact</span>
                        <span className="font-medium text-foreground">
                          {[viewing.guardian_name, viewing.guardian_phone].filter(Boolean).join(" - ") || "Not provided"}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs font-medium">Skills / Interests</span>
                      <span className="font-medium text-foreground">{viewing.skills_interests || "Not provided"}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-muted-foreground text-xs font-medium">Church Units</span>
                      {(viewing.units || []).length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {(viewing.units || []).map(unit => (
                            <Badge key={unit.id} variant="secondary" className="capitalize">
                              {unit.name} - {unit.role}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="font-medium text-foreground">Not assigned</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 flex justify-center w-full">
                <Button 
                  onClick={() => { setViewing(null); openEdit(viewing); }} 
                  className="w-full max-w-xs shadow-sm"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
