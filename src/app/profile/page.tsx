"use client";

import { useEffect, useState, useRef } from "react";
import { ChurchUnit, Member } from "@/lib/types";
import { designs, defaultMessages } from "@/lib/designs";
import { toast } from "sonner";
import {
  User,
  CalendarDays,
  Phone,
  Mail,
  Loader2,
  Save,
  Camera,
  Plus,
  X,
  GraduationCap,
  MapPin,
  BookOpen,
  Users,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type UnitAssignmentChoice = "none" | "member" | "assistant" | "head";

export default function ProfilePage() {
  const [memberId, setMemberId] = useState<string | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [units, setUnits] = useState<ChurchUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    phone_number: "",
    email: "",
    date_of_birth: "",
    member_type: "member",
    institution: "",
    department: "",
    academic_level: "",
    residence: "",
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

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [unitAssignments, setUnitAssignments] = useState<Record<string, UnitAssignmentChoice>>({});
  const [selectedUnitId, setSelectedUnitId] = useState("");

  const photoInputRef = useRef<HTMLInputElement>(null);
  const profileType = form.member_type || member?.member_type || "member";
  const showStudentFields = profileType === "student" || profileType === "alumnus";
  const showNyscFields = profileType === "nysc";
  const showWorkFields = profileType === "worker" || profileType === "alumnus";
  const showGuardianFields = profileType === "student" || profileType === "visitor";
  const showChurchGroupFields = profileType !== "visitor";
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

  // Fetch session and member profile
  useEffect(() => {
    async function loadProfile() {
      try {
        const sessionRes = await fetch("/api/auth");
        if (!sessionRes.ok) throw new Error("Failed to load session");
        const sessionData = await sessionRes.json();

        if (!sessionData.memberId) {
          toast.error("Please sign in as a congregation member to access this page");
          return;
        }

        setMemberId(sessionData.memberId);

        // Run profile fetch and messages fetch concurrently
        const [profileRes, messagesRes, unitsRes] = await Promise.all([
          fetch(`/api/members/${sessionData.memberId}`),
          fetch("/api/birthday-messages").catch(() => null),
          fetch("/api/units").catch(() => null),
        ]);

        if (!profileRes.ok) throw new Error("Failed to load profile details");
        const profileData = await profileRes.json();

        setMember(profileData);
        setUnitAssignments(
          Object.fromEntries((profileData.units || []).map((unit: any) => [unit.id, unit.role || "member"]))
        );
        setForm({
          first_name: profileData.first_name || "",
          middle_name: profileData.middle_name || "",
          last_name: profileData.last_name || "",
          phone_number: profileData.phone_number || "",
          email: profileData.email || "",
          date_of_birth: profileData.date_of_birth || "",
          member_type: profileData.member_type || "member",
          institution: profileData.institution || "",
          department: profileData.department || "",
          academic_level: profileData.academic_level || "",
          residence: profileData.residence || "",
          nysc_state: profileData.nysc_state || "",
          nysc_ppa: profileData.nysc_ppa || "",
          employer: profileData.employer || "",
          job_title: profileData.job_title || "",
          work_location: profileData.work_location || "",
          graduation_year: profileData.graduation_year || "",
          guardian_name: profileData.guardian_name || "",
          guardian_phone: profileData.guardian_phone || "",
          skills_interests: profileData.skills_interests || "",
        });
        setPhotoPreview(profileData.photo_url || null);

        if (messagesRes && messagesRes.ok) {
          const msgsData = await messagesRes.json();
          const loadedMsgs = msgsData?.data?.map((m: any) => m.message) || [];
          setMessages(loadedMsgs.length > 0 ? loadedMsgs : defaultMessages);
        } else {
          setMessages(defaultMessages);
        }

        if (unitsRes && unitsRes.ok) {
          const unitsData = await unitsRes.json();
          setUnits(Array.isArray(unitsData.data) ? unitsData.data : []);
        } else {
          setUnits([]);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
        toast.error("Failed to load your profile details");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  // Generate Birthday Graphic Preview
  const generatePreview = () => {
    if (!member) return;
    setGenerating(true);

    const activeMessages = messages.length > 0 ? messages : defaultMessages;
    const designIndex = Math.floor(Math.random() * designs.length);
    const selectedMessage = activeMessages[0] || defaultMessages[0];
    const params = new URLSearchParams({
      design: designIndex.toString(),
      first_name: form.first_name || member.first_name,
      middle_name: form.middle_name || member.middle_name || "",
      last_name: form.last_name || member.last_name,
      position: member.position || "",
      photo_url: photoPreview || "",
      date_of_birth: form.date_of_birth || member.date_of_birth,
      message: selectedMessage,
    });
    setPreviewUrl(`/api/generate?${params.toString()}`);
  };

  // Generate initial preview once member and messages are loaded
  useEffect(() => {
    if (member && messages.length > 0) {
      generatePreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member, messages]);

  // Upload photo
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "church-assets");
    formData.append("folder", "members");

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();

      if (data.url) {
        setPhotoPreview(data.url);
        toast.success("Photo uploaded! Remember to save changes.");
      }
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  // Submit Profile Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId) return;

    setSaving(true);
    try {
      const payload = {
        ...form,
        position: member?.position,
        photo_url: photoPreview,
        member_type: form.member_type || "member",
        ...(showChurchGroupFields
          ? {
              units: Object.entries(unitAssignments)
                .filter(([, role]) => role !== "none")
                .map(([unit_id, role]) => ({ unit_id, role })),
            }
          : {}),
        student_status: member?.student_status, // Retain admin-managed student status
        cell_group: member?.cell_group, // Retain admin-managed cell assignment
        is_active: member?.is_active, // Retain read-only active status
      };

      const res = await fetch(`/api/members/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Update failed");
      const updatedMember = await res.json();

      setMember(updatedMember);
      setUnitAssignments(
        Object.fromEntries((updatedMember.units || []).map((unit: any) => [unit.id, unit.role || "member"]))
      );
      toast.success("Profile saved successfully");
      generatePreview(); // Refresh the birthday graphic with new details!
    } catch {
      toast.error("Failed to update profile details");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-4 md:p-8 space-y-6 max-w-6xl mx-auto w-full">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-96 md:col-span-1" />
          <Skeleton className="h-96 md:col-span-2" />
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[50vh]">
        <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <User className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-xl font-bold">Failed to load profile</h3>
        <p className="text-muted-foreground text-sm max-w-sm mt-1">
          Please check your connection and try logging in again.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">My Profile</h1>
          <p className="text-muted-foreground font-medium">Manage your personal congregation record.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Member Card & Card Preview */}
        <div className="lg:col-span-5 space-y-6">
          {/* Visual Member Badge Card */}
          <Card className="shadow-md overflow-hidden relative border-zinc-200">
            {/* Elegant Header Accent */}
            <div className="h-40 bg-gradient-to-r from-zinc-800 to-zinc-950 w-full relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-zinc-700/30 via-transparent to-transparent" />
            </div>

            <CardContent className="pt-0 relative flex flex-col items-center pb-8">
              {/* Avatar block */}
              <div className="relative -mt-24 group">
                <Avatar className="h-44 w-44 border-8 border-white shadow-xl bg-white relative">
                  <AvatarImage src={photoPreview || ""} className="object-cover" />
                  <AvatarFallback className="text-5xl bg-zinc-100 text-zinc-800 font-medium">
                    {form.first_name?.[0]}
                    {form.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>

                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />

                <Button
                  onClick={() => photoInputRef.current?.click()}
                  variant="secondary"
                  size="icon"
                  disabled={uploading}
                  className="absolute bottom-3 right-3 h-11 w-11 rounded-full shadow-md border hover:scale-105 transition-all bg-white hover:bg-zinc-50"
                  type="button"
                >
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-zinc-700" />
                  ) : (
                    <Camera className="h-5 w-5 text-zinc-700" />
                  )}
                </Button>
              </div>

              {/* Name & Member Type */}
              <div className="text-center mt-5 space-y-2">
                <h3 className="text-2xl font-bold tracking-tight text-zinc-900">
                  {form.first_name} {form.middle_name ? form.middle_name + " " : ""}
                  {form.last_name}
                </h3>
                <Badge variant="outline" className="capitalize">
                  {profileType.replace(/_/g, " ")}
                </Badge>
              </div>

              {/* Contact mini logs */}
              <div className="w-full mt-6 space-y-3 pt-6 border-t text-sm border-zinc-100">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-zinc-600 truncate">{form.phone_number || "-"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-zinc-600 truncate">{form.email || "-"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-zinc-600 truncate">
                    {form.date_of_birth
                      ? new Date(form.date_of_birth).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "-"}
                  </span>
                </div>
                {profileType !== "member" && profileType !== "visitor" && (
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-zinc-600 truncate">
                      {profileType === "nysc"
                        ? form.nysc_state || "-"
                        : profileType === "worker"
                          ? form.employer || "-"
                          : form.institution || "-"}
                    </span>
                  </div>
                )}
                {showChurchGroupFields && (
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-zinc-600 truncate">{member.cell_group || "No cell assigned"}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Editable Profile Details */}
        <div className="lg:col-span-7">
          <Card className="shadow-md border-zinc-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Profile Details</CardTitle>
              <CardDescription>Keep your details updated. Fields marked with * are required.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      required
                      value={form.first_name}
                      onChange={e => setForm({ ...form, first_name: e.target.value })}
                      placeholder="John"
                    />
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      required
                      value={form.last_name}
                      onChange={e => setForm({ ...form, last_name: e.target.value })}
                      placeholder="Doe"
                    />
                  </div>

                  {/* Middle Name */}
                  <div className="space-y-2">
                    <Label htmlFor="middle_name">Middle Name</Label>
                    <Input
                      id="middle_name"
                      value={form.middle_name}
                      onChange={e => setForm({ ...form, middle_name: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth *</Label>
                    <Input
                      id="dob"
                      required
                      type="date"
                      value={form.date_of_birth}
                      onChange={e => setForm({ ...form, date_of_birth: e.target.value })}
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2">
                    <Label htmlFor="phone_number">Phone Number</Label>
                    <Input
                      id="phone_number"
                      type="tel"
                      value={form.phone_number}
                      onChange={e => setForm({ ...form, phone_number: e.target.value })}
                      placeholder="+1 234 567 8900"
                    />
                  </div>

                  {/* Email Address */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="john.doe@example.com"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="member_type">Member Type</Label>
                    <Select
                      value={profileType}
                      onValueChange={value => setForm({ ...form, member_type: value })}
                    >
                      <SelectTrigger id="member_type">
                        <SelectValue placeholder="Member type" />
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

                  {showStudentFields && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="institution">Institution</Label>
                        <div className="relative">
                          <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="institution"
                            value={form.institution}
                            onChange={e => setForm({ ...form, institution: e.target.value })}
                            placeholder="University, polytechnic, or college"
                            className="pl-9"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="department">Department / Course</Label>
                        <div className="relative">
                          <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="department"
                            value={form.department}
                            onChange={e => setForm({ ...form, department: e.target.value })}
                            placeholder="Computer Science"
                            className="pl-9"
                          />
                        </div>
                      </div>

                      {profileType === "student" && (
                        <div className="space-y-2">
                          <Label htmlFor="academic_level">Academic Level</Label>
                          <Input
                            id="academic_level"
                            value={form.academic_level}
                            onChange={e => setForm({ ...form, academic_level: e.target.value })}
                            placeholder="200L, Final Year"
                          />
                        </div>
                      )}

                      {profileType === "alumnus" && (
                        <div className="space-y-2">
                          <Label htmlFor="graduation_year">Graduation Year</Label>
                          <Input
                            id="graduation_year"
                            value={form.graduation_year}
                            onChange={e => setForm({ ...form, graduation_year: e.target.value })}
                            placeholder="2026"
                          />
                        </div>
                      )}
                    </>
                  )}

                  {(profileType === "student" || profileType === "nysc" || profileType === "visitor") && (
                    <div className="space-y-2">
                      <Label htmlFor="residence">Residence / Hostel</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="residence"
                          value={form.residence}
                          onChange={e => setForm({ ...form, residence: e.target.value })}
                          placeholder="Hostel, lodge, or area"
                          className="pl-9"
                        />
                      </div>
                    </div>
                  )}

                  {showNyscFields && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="nysc_state">NYSC State</Label>
                        <Input
                          id="nysc_state"
                          value={form.nysc_state}
                          onChange={e => setForm({ ...form, nysc_state: e.target.value })}
                          placeholder="Lagos"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nysc_ppa">Place of Primary Assignment</Label>
                        <Input
                          id="nysc_ppa"
                          value={form.nysc_ppa}
                          onChange={e => setForm({ ...form, nysc_ppa: e.target.value })}
                          placeholder="Government College"
                        />
                      </div>
                    </>
                  )}

                  {showWorkFields && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="employer">Employer</Label>
                        <Input
                          id="employer"
                          value={form.employer}
                          onChange={e => setForm({ ...form, employer: e.target.value })}
                          placeholder="Company or organization"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="job_title">Job Title</Label>
                        <Input
                          id="job_title"
                          value={form.job_title}
                          onChange={e => setForm({ ...form, job_title: e.target.value })}
                          placeholder="Product Designer"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="work_location">Work Location</Label>
                        <Input
                          id="work_location"
                          value={form.work_location}
                          onChange={e => setForm({ ...form, work_location: e.target.value })}
                          placeholder="Yaba, Lagos"
                        />
                      </div>
                    </>
                  )}

                  {showGuardianFields && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="guardian_name">Guardian Name</Label>
                        <Input
                          id="guardian_name"
                          value={form.guardian_name}
                          onChange={e => setForm({ ...form, guardian_name: e.target.value })}
                          placeholder="Optional"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="guardian_phone">Guardian Phone</Label>
                        <Input
                          id="guardian_phone"
                          type="tel"
                          value={form.guardian_phone}
                          onChange={e => setForm({ ...form, guardian_phone: e.target.value })}
                          placeholder="Optional"
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="skills_interests">Skills / Interests</Label>
                    <Input
                      id="skills_interests"
                      value={form.skills_interests}
                      onChange={e => setForm({ ...form, skills_interests: e.target.value })}
                      placeholder="media, music, ushering, teaching"
                    />
                  </div>

                  {profileType === "student" && (
                    <div className="space-y-2">
                      <Label htmlFor="student_status" className="text-zinc-500">
                        Student Status (Read-only)
                      </Label>
                      <Input
                        id="student_status"
                        disabled
                        value={member.student_status ? member.student_status.replace(/_/g, " ") : "Active Student"}
                        className="bg-zinc-50 text-zinc-700 border-zinc-200 cursor-not-allowed capitalize"
                      />
                    </div>
                  )}

                  {showChurchGroupFields && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="cell_group" className="text-zinc-500">
                          Cell / Small Group (Read-only)
                        </Label>
                        <Input
                          id="cell_group"
                          disabled
                          value={member.cell_group || "Not assigned"}
                          className="bg-zinc-50 text-zinc-700 border-zinc-200 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-3 md:col-span-2 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4">
                        <div>
                          <Label>Church Units</Label>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Select the units you serve in and your current responsibility.
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
                    </>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t mt-6">
                  <Button type="submit" disabled={saving || uploading} className="px-6">
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving Profile...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
