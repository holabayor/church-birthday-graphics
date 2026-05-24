"use client";

import { useEffect, useState, useRef } from "react";
import { Member } from "@/lib/types";
import { designs, defaultMessages } from "@/lib/designs";
import { toast } from "sonner";
import { User, CalendarDays, Phone, Mail, Loader2, Save, Camera, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const [memberId, setMemberId] = useState<string | null>(null);
  const [member, setMember] = useState<Member | null>(null);
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
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);

  const photoInputRef = useRef<HTMLInputElement>(null);

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
        const [profileRes, messagesRes] = await Promise.all([
          fetch(`/api/members/${sessionData.memberId}`),
          fetch("/api/birthday-messages").catch(() => null)
        ]);

        if (!profileRes.ok) throw new Error("Failed to load profile details");
        const profileData = await profileRes.json();

        setMember(profileData);
        setForm({
          first_name: profileData.first_name || "",
          middle_name: profileData.middle_name || "",
          last_name: profileData.last_name || "",
          phone_number: profileData.phone_number || "",
          email: profileData.email || "",
          date_of_birth: profileData.date_of_birth || "",
        });
        setPhotoPreview(profileData.photo_url || null);

        if (messagesRes && messagesRes.ok) {
          const msgsData = await messagesRes.json();
          const loadedMsgs = msgsData?.data?.map((m: any) => m.message) || [];
          setMessages(loadedMsgs.length > 0 ? loadedMsgs : defaultMessages);
        } else {
          setMessages(defaultMessages);
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
        photo_url: photoPreview,
        position: member?.position, // Retain read-only position
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
        <div className="lg:col-span-4 space-y-6">
          {/* Visual Member Badge Card */}
          <Card className="shadow-md overflow-hidden relative border-zinc-200">
            {/* Elegant Header Accent */}
            <div className="h-24 bg-gradient-to-r from-zinc-800 to-zinc-950 w-full relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-zinc-700/30 via-transparent to-transparent" />
            </div>

            <CardContent className="pt-0 relative flex flex-col items-center pb-6">
              {/* Avatar block */}
              <div className="relative -mt-12 group">
                <Avatar className="h-24 w-24 border-4 border-white shadow-lg bg-white relative">
                  <AvatarImage src={photoPreview || ""} className="object-cover" />
                  <AvatarFallback className="text-2xl bg-zinc-100 text-zinc-800 font-medium">
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
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md border hover:scale-105 transition-all bg-white hover:bg-zinc-50"
                  type="button"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-700" />
                  ) : (
                    <Camera className="h-4 w-4 text-zinc-700" />
                  )}
                </Button>
              </div>

              {/* Name & Position */}
              <div className="text-center mt-3 space-y-1">
                <h3 className="text-xl font-bold tracking-tight text-zinc-900">
                  {form.first_name} {form.middle_name ? form.middle_name + " " : ""}
                  {form.last_name}
                </h3>
                {member.position ? (
                  <Badge variant="secondary" className="px-3 py-0.5 text-xs font-semibold mt-1">
                    {member.position}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground font-normal mt-1">
                    Congregation Member
                  </Badge>
                )}
              </div>

              {/* Contact mini logs */}
              <div className="w-full mt-6 space-y-3 pt-6 border-t text-sm border-zinc-100">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-zinc-600 truncate">{form.phone_number || "—"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-zinc-600 truncate">{form.email || "—"}</span>
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
                      : "—"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Editable Profile Details */}
        <div className="lg:col-span-8">
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

                  {/* Position/Role (Read Only!) */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="position" className="text-zinc-500">
                      Church Position / Role (Read-only)
                    </Label>
                    <div className="relative">
                      <Input
                        id="position"
                        disabled
                        value={member.position || "Congregation Member"}
                        className="bg-zinc-50 text-zinc-700 border-zinc-200 cursor-not-allowed select-none"
                      />
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your position is designated by church administrators and cannot be modified by members.
                    </p>
                  </div>
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
