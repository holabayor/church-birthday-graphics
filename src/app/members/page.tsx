"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Member } from "@/lib/types";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, X, ChevronLeft, ChevronRight, Upload, User, Users, Phone, Mail, CalendarDays } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
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
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
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

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => setPage(1), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

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
    });
    setPhotoFile(null);
    setPhotoPreview(null);
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
    });
    setPhotoFile(null);
    setPhotoPreview(m.photo_url || null);
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
        ...(photoUrl !== undefined ? { photo_url: photoUrl } : {}),
      };

      if (editing) {
        const res = await fetch(`/api/members/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        toast.success("Member updated");
      } else {
        const res = await fetch("/api/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        toast.success("Member added");
      }
      setShowForm(false);
      fetchMembers();
    } catch {
      toast.error("Failed to save member");
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
        <Button onClick={openAdd} className="shadow-sm w-full sm:w-auto" size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
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
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[300px]">Member</TableHead>
                  <TableHead>Contact</TableHead>
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
                        <span className="text-foreground">{m.phone_number || "—"}</span>
                        <span className="text-xs">{m.email || ""}</span>
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
                        <span className="text-muted-foreground text-sm">—</span>
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
          )}
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/20">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{(page - 1) * limit + 1}</span> to <span className="font-medium text-foreground">{Math.min(page * limit, total)}</span> of <span className="font-medium text-foreground">{total}</span> members
            </p>
            <div className="flex items-center space-x-2">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowForm(false)}
          />
          <Card className="w-full max-w-lg z-50 shadow-2xl animate-in fade-in zoom-in-95 duration-200 border-border">
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
                      Position/Role
                    </label>
                    <Input
                      placeholder="e.g. Choir Leader, Deacon, Member"
                      value={form.position}
                      onChange={e => setForm({ ...form, position: e.target.value })}
                    />
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
