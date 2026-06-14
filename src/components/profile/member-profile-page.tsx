"use client";

import {
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  Smartphone,
  User,
  Users,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { designs, defaultMessages } from "@/lib/designs";
import { FILTER_VALUE } from "@/lib/filterOptions";
import {
  LIFE_STAGE,
  getLifeStageLabel,
  getMembershipStatusLabel,
  isAvailableMember,
  lifeStageOptions,
  normalizeLifeStage,
  usesGuardianProfile,
  usesNyscProfile,
  usesResidenceProfile,
  usesStudentProfile,
  usesWorkProfile,
} from "@/lib/memberLifecycle";
import type { ChurchUnit, Member } from "@/lib/types";
import { UNIT_ROLE, unitRoleLabels, unitRoleOptions, type UnitRole } from "@/lib/unitRoles";
import { cn } from "@/lib/utils";

type UnitAssignmentChoice = typeof FILTER_VALUE.NONE | UnitRole;

type ProfileForm = {
  first_name: string;
  middle_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  date_of_birth: string;
  life_stage: string;
  institution: string;
  department: string;
  academic_level: string;
  residence: string;
  nysc_state: string;
  nysc_ppa: string;
  employer: string;
  job_title: string;
  work_location: string;
  graduation_year: string;
  guardian_name: string;
  guardian_phone: string;
  skills_interests: string;
};

const emptyForm: ProfileForm = {
  first_name: "",
  middle_name: "",
  last_name: "",
  phone_number: "",
  email: "",
  date_of_birth: "",
  life_stage: LIFE_STAGE.OTHER,
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
};

const inputClassName =
  "h-12 border-[var(--outline-variant)] bg-white text-base shadow-none focus-visible:border-primary focus-visible:ring-primary/20 md:text-sm";

function getFullName(form: ProfileForm) {
  return [form.first_name, form.middle_name, form.last_name].filter(Boolean).join(" ");
}

function getLifeStageIcon(stage: string): LucideIcon {
  if (stage === LIFE_STAGE.STUDENT || stage === LIFE_STAGE.GRADUATE) return GraduationCap;
  if (stage === LIFE_STAGE.NYSC_CORPER) return MapPin;
  if (stage === LIFE_STAGE.WORKING_CLASS || stage === LIFE_STAGE.SELF_EMPLOYED || stage === LIFE_STAGE.JOB_SEEKING) {
    return BriefcaseBusiness;
  }
  return User;
}

function ProfileField({
  id,
  label,
  icon: Icon,
  optional,
  children,
  className,
}: {
  id: string;
  label: string;
  icon?: LucideIcon;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id} className="text-sm font-semibold text-foreground">
          {label}
        </Label>
        {optional ? <span className="text-xs text-[var(--outline)]">Optional</span> : null}
      </div>
      <div className="relative">
        {Icon ? (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-[var(--outline)]" />
        ) : null}
        {children}
      </div>
    </div>
  );
}

function ProfileSection({
  title,
  description,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="overflow-hidden rounded-lg border border-[var(--outline-variant)]/60 bg-white"
    >
      <CollapsibleTrigger className="flex min-h-16 w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-[var(--surface-container-low)] sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-container)] text-primary">
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-[var(--font-manrope)] text-base font-semibold leading-6 text-foreground sm:text-lg">
              {title}
            </h2>
            <p className="mt-0.5 text-sm leading-5 text-[var(--on-surface-variant)]">{description}</p>
          </div>
        </div>
        <ChevronDown
          className={cn("size-5 shrink-0 text-[var(--outline)] transition-transform", open && "rotate-180")}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t border-[var(--outline-variant)]/50">
        <div className="grid gap-5 p-4 sm:grid-cols-2 sm:p-5">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.05em] text-[var(--outline)]">{label}</p>
        <p className="mt-0.5 break-words text-sm font-semibold leading-5 text-foreground">{value}</p>
      </div>
    </div>
  );
}

export function MemberProfilePage() {
  const [memberId, setMemberId] = useState<string | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [units, setUnits] = useState<ChurchUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [altPhone, setAltPhone] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [unitAssignments, setUnitAssignments] = useState<Record<string, UnitAssignmentChoice>>({});
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);

  const profileType = normalizeLifeStage(form.life_stage || member?.life_stage);
  const showStudentFields = usesStudentProfile(profileType);
  const showNyscFields = usesNyscProfile(profileType);
  const showWorkFields = usesWorkProfile(profileType);
  const showResidenceFields = usesResidenceProfile(profileType);
  const showGuardianFields = usesGuardianProfile(profileType);
  const showChurchGroupFields = profileType !== LIFE_STAGE.VISITOR;
  const LifeStageIcon = getLifeStageIcon(profileType);

  const assignedUnits = units.filter(unit => {
    const role = unitAssignments[unit.id];
    return role && role !== FILTER_VALUE.NONE;
  });
  const availableUnits = units.filter(
    unit => !unitAssignments[unit.id] || unitAssignments[unit.id] === FILTER_VALUE.NONE,
  );

  const updateField = (field: keyof ProfileForm, value: string) => {
    setForm(current => ({ ...current, [field]: value }));
  };

  useEffect(() => {
    async function loadProfile() {
      try {
        const sessionResponse = await fetch("/api/auth");
        if (!sessionResponse.ok) throw new Error("Failed to load session");
        const session = await sessionResponse.json();

        if (!session.memberId) {
          toast.error("Please sign in as a congregation member to access your profile");
          return;
        }

        setMemberId(session.memberId);
        const [profileResponse, messagesResponse, unitsResponse] = await Promise.all([
          fetch(`/api/members/${session.memberId}`),
          fetch("/api/birthday-messages").catch(() => null),
          fetch("/api/units").catch(() => null),
        ]);

        if (!profileResponse.ok) throw new Error("Failed to load profile details");
        const profile = await profileResponse.json();
        setMember(profile);
        setPhotoPreview(profile.photo_url || null);
        setUnitAssignments(
          Object.fromEntries(
            (profile.units || []).map((unit: { id: string; role?: UnitRole }) => [
              unit.id,
              unit.role || UNIT_ROLE.MEMBER,
            ]),
          ),
        );
        setForm({
          first_name: profile.first_name || "",
          middle_name: profile.middle_name || "",
          last_name: profile.last_name || "",
          phone_number: profile.phone_number || "",
          email: profile.email || "",
          date_of_birth: profile.date_of_birth || "",
          life_stage: normalizeLifeStage(profile.life_stage),
          institution: profile.institution || "",
          department: profile.department || "",
          academic_level: profile.academic_level || "",
          residence: profile.residence || "",
          nysc_state: profile.nysc_state || "",
          nysc_ppa: profile.nysc_ppa || "",
          employer: profile.employer || "",
          job_title: profile.job_title || "",
          work_location: profile.work_location || "",
          graduation_year: profile.graduation_year || "",
          guardian_name: profile.guardian_name || "",
          guardian_phone: profile.guardian_phone || "",
          skills_interests: profile.skills_interests || "",
        });

        const storedAltPhone = localStorage.getItem(`alt_phone_${session.memberId}`);
        if (storedAltPhone) setAltPhone(storedAltPhone);

        if (messagesResponse?.ok) {
          const messageData = await messagesResponse.json();
          const loadedMessages = messageData?.data?.map((item: { message: string }) => item.message) || [];
          setMessages(loadedMessages.length > 0 ? loadedMessages : defaultMessages);
        } else {
          setMessages(defaultMessages);
        }

        if (unitsResponse?.ok) {
          const unitData = await unitsResponse.json();
          setUnits(Array.isArray(unitData.data) ? unitData.data : []);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        toast.error("Failed to load your profile details");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const generatePreview = () => {
    if (!member) return;
    setGenerating(true);
    const activeMessages = messages.length > 0 ? messages : defaultMessages;
    const params = new URLSearchParams({
      design: Math.floor(Math.random() * designs.length).toString(),
      first_name: form.first_name || member.first_name,
      middle_name: form.middle_name || member.middle_name || "",
      last_name: form.last_name || member.last_name,
      position: member.position || "",
      photo_url: photoPreview || "",
      date_of_birth: form.date_of_birth || member.date_of_birth,
      message: activeMessages[0] || defaultMessages[0],
    });
    setPreviewUrl(`/api/generate?${params.toString()}`);
  };

  useEffect(() => {
    if (member && messages.length > 0) generatePreview();
    // Preview generation should run when the loaded record and messages become available.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member, messages]);

  const handlePhotoSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const data = new FormData();
    data.append("file", file);
    data.append("bucket", "church-assets");
    data.append("folder", "members");

    try {
      const response = await fetch("/api/upload", { method: "POST", body: data });
      if (!response.ok) throw new Error("Upload failed");
      const result = await response.json();
      if (result.url) {
        setPhotoPreview(result.url);
        toast.success("Photo uploaded. Save your profile to keep the change.");
      }
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const addUnit = () => {
    if (!selectedUnitId) return;
    setUnitAssignments(current => ({ ...current, [selectedUnitId]: UNIT_ROLE.MEMBER }));
    setSelectedUnitId("");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!memberId) return;
    setSaving(true);

    try {
      if (altPhone) localStorage.setItem(`alt_phone_${memberId}`, altPhone);
      else localStorage.removeItem(`alt_phone_${memberId}`);

      const payload = {
        ...form,
        position: member?.position,
        photo_url: photoPreview,
        life_stage: normalizeLifeStage(form.life_stage),
        ...(showChurchGroupFields
          ? {
              units: Object.entries(unitAssignments)
                .filter(([, role]) => role !== FILTER_VALUE.NONE)
                .map(([unit_id, role]) => ({ unit_id, role })),
            }
          : {}),
        student_status: member?.student_status,
        cell_group: member?.cell_group,
        membership_status: member?.membership_status,
      };

      const response = await fetch(`/api/members/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Update failed");

      const updatedMember = await response.json();
      setMember(updatedMember);
      setUnitAssignments(
        Object.fromEntries(
          (updatedMember.units || []).map((unit: { id: string; role?: UnitRole }) => [
            unit.id,
            unit.role || UNIT_ROLE.MEMBER,
          ]),
        ),
      );
      toast.success("Profile saved successfully");
      generatePreview();
    } catch {
      toast.error("Failed to update profile details");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-52" />
        </div>
        <Skeleton className="h-[520px] w-full rounded-lg" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Skeleton className="h-80 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <User className="size-6" />
        </div>
        <h1 className="mt-4 font-[var(--font-manrope)] text-xl font-bold text-foreground">Profile unavailable</h1>
        <p className="mt-1 max-w-sm text-sm leading-6 text-[var(--on-surface-variant)]">
          We could not load your profile. Check your connection and try again.
        </p>
      </div>
    );
  }

  const membershipStatus = getMembershipStatusLabel(member.membership_status, member.is_active);
  const activeMember = isAvailableMember(member.membership_status, member.is_active);
  const joinedLabel = member.created_at
    ? new Date(member.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Not available";

  return (
    <div className="min-h-screen bg-[var(--surface)] pb-24 sm:pb-8">
      <form onSubmit={handleSubmit}>
        <header className="border-b border-[var(--outline-variant)]/60 bg-white">
          <div className="mx-auto flex w-full max-w-7xl items-end justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
            <div>
              <p className="font-mono text-xs font-medium uppercase tracking-[0.05em] text-primary">Personal record</p>
              <h1 className="mt-1 font-[var(--font-manrope)] text-2xl font-bold leading-8 text-foreground sm:text-3xl">
                My profile
              </h1>
              <p className="mt-1 max-w-xl text-sm leading-5 text-[var(--on-surface-variant)] sm:text-base sm:leading-6">
                Keep the details that help your church family know and support you up to date.
              </p>
            </div>
            <Button type="submit" size="lg" disabled={saving || uploading} className="hidden shadow-none sm:flex">
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
          <section className="overflow-hidden rounded-lg border border-[var(--outline-variant)]/60 bg-white">
            <div className="grid md:grid-cols-[minmax(250px,34%)_minmax(0,1fr)] lg:grid-cols-[360px_minmax(0,1fr)]">
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="group relative min-h-[320px] overflow-hidden bg-[var(--surface-container)] text-left focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50 sm:min-h-[400px] md:min-h-[460px]"
                aria-label={photoPreview ? "Change profile photo" : "Add profile photo"}
              >
                {photoPreview ? (
                  <img src={photoPreview} alt={getFullName(form)} className="absolute inset-0 size-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--surface-container-high)] text-primary">
                    <span className="font-[var(--font-manrope)] text-6xl font-bold">
                      {form.first_name.charAt(0)}
                      {form.last_name.charAt(0)}
                    </span>
                    <span className="mt-3 text-sm font-semibold">Add a profile photo</span>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-[#0b1c30]/90 via-[#0b1c30]/45 to-transparent p-4 pt-20 text-white sm:p-5">
                  <span className="text-sm font-semibold">{uploading ? "Uploading photo..." : "Change photo"}</span>
                  <span className="flex size-10 items-center justify-center rounded-full bg-white text-primary shadow-sm transition-transform group-hover:scale-105">
                    {uploading ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
                  </span>
                </div>
              </button>
              <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />

              <div className="flex min-w-0 flex-col justify-between p-5 sm:p-7 lg:p-10">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="rounded-full border-0 bg-primary/10 px-3 py-1 text-primary shadow-none hover:bg-primary/10">
                      <LifeStageIcon className="mr-1 size-3.5" />
                      {getLifeStageLabel(profileType)}
                    </Badge>
                    <Badge
                      className={cn(
                        "rounded-full border-0 px-3 py-1 shadow-none",
                        activeMember
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                          : "bg-red-50 text-red-700 hover:bg-red-50",
                      )}
                    >
                      {activeMember ? (
                        <CheckCircle2 className="mr-1 size-3.5" />
                      ) : (
                        <XCircle className="mr-1 size-3.5" />
                      )}
                      {membershipStatus}
                    </Badge>
                    {member.position ? (
                      <Badge className="rounded-full border border-[var(--outline-variant)]/60 bg-white px-3 py-1 text-[var(--on-surface-variant)] shadow-none hover:bg-white">
                        {member.position}
                      </Badge>
                    ) : null}
                  </div>

                  <h2 className="mt-5 font-[var(--font-manrope)] text-3xl font-bold leading-tight text-foreground sm:text-4xl">
                    {getFullName(form)}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--on-surface-variant)]">Member since {joinedLabel}</p>

                  <div className="mt-7 grid gap-5 sm:grid-cols-2">
                    <DetailItem icon={Phone} label="Phone" value={form.phone_number || "Not provided"} />
                    <DetailItem icon={Mail} label="Email" value={form.email || "Not provided"} />
                    <DetailItem
                      icon={CalendarDays}
                      label="Birthday"
                      value={
                        form.date_of_birth
                          ? new Date(`${form.date_of_birth}T00:00:00`).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                            })
                          : "Not provided"
                      }
                    />
                    <DetailItem icon={MapPin} label="Residence" value={form.residence || "Not provided"} />
                  </div>
                </div>

                {showChurchGroupFields && assignedUnits.length > 0 ? (
                  <div className="mt-8 border-t border-[var(--outline-variant)]/50 pt-5">
                    <p className="font-mono text-[10px] font-medium uppercase tracking-[0.05em] text-[var(--outline)]">
                      Church units
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {assignedUnits.map(unit => (
                        <Badge
                          key={unit.id}
                          variant="outline"
                          className="rounded-full border-[var(--outline-variant)]/70 px-3 py-1 font-medium shadow-none"
                        >
                          {unit.name} · {unitRoleLabels[unitAssignments[unit.id] as UnitRole] || "Member"}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-4">
              <ProfileSection
                title="Personal and contact details"
                description="Your name, contact information, birthday, and current life stage."
                icon={User}
                defaultOpen
              >
                <ProfileField id="first_name" label="First name">
                  <Input
                    id="first_name"
                    required
                    value={form.first_name}
                    onChange={event => updateField("first_name", event.target.value)}
                    className={inputClassName}
                  />
                </ProfileField>
                <ProfileField id="last_name" label="Last name">
                  <Input
                    id="last_name"
                    required
                    value={form.last_name}
                    onChange={event => updateField("last_name", event.target.value)}
                    className={inputClassName}
                  />
                </ProfileField>
                <ProfileField id="middle_name" label="Middle name" optional>
                  <Input
                    id="middle_name"
                    value={form.middle_name}
                    onChange={event => updateField("middle_name", event.target.value)}
                    className={inputClassName}
                  />
                </ProfileField>
                <ProfileField id="date_of_birth" label="Date of birth" icon={CalendarDays}>
                  <Input
                    id="date_of_birth"
                    required
                    type="date"
                    value={form.date_of_birth}
                    onChange={event => updateField("date_of_birth", event.target.value)}
                    className={cn(inputClassName, "pl-10")}
                  />
                </ProfileField>
                <ProfileField id="phone_number" label="Phone number" icon={Phone}>
                  <Input
                    id="phone_number"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={form.phone_number}
                    onChange={event => updateField("phone_number", event.target.value)}
                    className={cn(inputClassName, "pl-10")}
                  />
                </ProfileField>
                <ProfileField id="alt_phone" label="Alternate phone" icon={Smartphone} optional>
                  <Input
                    id="alt_phone"
                    type="tel"
                    inputMode="tel"
                    value={altPhone}
                    onChange={event => setAltPhone(event.target.value)}
                    className={cn(inputClassName, "pl-10")}
                  />
                </ProfileField>
                <ProfileField id="email" label="Email address" icon={Mail} optional className="sm:col-span-2">
                  <Input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={event => updateField("email", event.target.value)}
                    className={cn(inputClassName, "pl-10")}
                  />
                </ProfileField>
                <ProfileField id="life_stage" label="Current life stage" className="sm:col-span-2">
                  <Select value={profileType} onValueChange={value => updateField("life_stage", value)}>
                    <SelectTrigger
                      id="life_stage"
                      className="h-12 w-full border-[var(--outline-variant)] bg-white text-base shadow-none md:text-sm"
                    >
                      <SelectValue placeholder="Select life stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {lifeStageOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </ProfileField>
              </ProfileSection>

              {showStudentFields || showNyscFields || showWorkFields || showResidenceFields ? (
                <ProfileSection
                  title={`${getLifeStageLabel(profileType)} details`}
                  description="Only information relevant to your current stage is shown here."
                  icon={LifeStageIcon}
                  defaultOpen
                >
                  {showStudentFields ? (
                    <>
                      <ProfileField id="institution" label="Institution" icon={GraduationCap}>
                        <Input
                          id="institution"
                          value={form.institution}
                          onChange={event => updateField("institution", event.target.value)}
                          className={cn(inputClassName, "pl-10")}
                        />
                      </ProfileField>
                      <ProfileField id="department" label="Department or course" icon={BookOpen}>
                        <Input
                          id="department"
                          value={form.department}
                          onChange={event => updateField("department", event.target.value)}
                          className={cn(inputClassName, "pl-10")}
                        />
                      </ProfileField>
                      {profileType === LIFE_STAGE.STUDENT ? (
                        <ProfileField id="academic_level" label="Academic level" optional>
                          <Input
                            id="academic_level"
                            value={form.academic_level}
                            onChange={event => updateField("academic_level", event.target.value)}
                            placeholder="200L, Final year"
                            className={inputClassName}
                          />
                        </ProfileField>
                      ) : null}
                      {profileType === LIFE_STAGE.GRADUATE ? (
                        <ProfileField id="graduation_year" label="Graduation year" optional>
                          <Input
                            id="graduation_year"
                            inputMode="numeric"
                            value={form.graduation_year}
                            onChange={event => updateField("graduation_year", event.target.value)}
                            className={inputClassName}
                          />
                        </ProfileField>
                      ) : null}
                    </>
                  ) : null}

                  {showNyscFields ? (
                    <>
                      <ProfileField id="nysc_state" label="NYSC state" icon={MapPin}>
                        <Input
                          id="nysc_state"
                          value={form.nysc_state}
                          onChange={event => updateField("nysc_state", event.target.value)}
                          className={cn(inputClassName, "pl-10")}
                        />
                      </ProfileField>
                      <ProfileField id="nysc_ppa" label="Place of primary assignment">
                        <Input
                          id="nysc_ppa"
                          value={form.nysc_ppa}
                          onChange={event => updateField("nysc_ppa", event.target.value)}
                          className={inputClassName}
                        />
                      </ProfileField>
                    </>
                  ) : null}

                  {showWorkFields ? (
                    <>
                      <ProfileField id="employer" label="Employer" icon={BriefcaseBusiness} optional>
                        <Input
                          id="employer"
                          value={form.employer}
                          onChange={event => updateField("employer", event.target.value)}
                          className={cn(inputClassName, "pl-10")}
                        />
                      </ProfileField>
                      <ProfileField id="job_title" label="Job title" optional>
                        <Input
                          id="job_title"
                          value={form.job_title}
                          onChange={event => updateField("job_title", event.target.value)}
                          className={inputClassName}
                        />
                      </ProfileField>
                      <ProfileField
                        id="work_location"
                        label="Work location"
                        icon={MapPin}
                        optional
                        className={showStudentFields ? "sm:col-span-2" : undefined}
                      >
                        <Input
                          id="work_location"
                          value={form.work_location}
                          onChange={event => updateField("work_location", event.target.value)}
                          className={cn(inputClassName, "pl-10")}
                        />
                      </ProfileField>
                    </>
                  ) : null}

                  {showResidenceFields ? (
                    <ProfileField
                      id="residence"
                      label="Residence or hostel"
                      icon={MapPin}
                      optional
                      className="sm:col-span-2"
                    >
                      <Input
                        id="residence"
                        value={form.residence}
                        onChange={event => updateField("residence", event.target.value)}
                        className={cn(inputClassName, "pl-10")}
                      />
                    </ProfileField>
                  ) : null}
                </ProfileSection>
              ) : null}

              <ProfileSection
                title="About and emergency contact"
                description="A little more context to help church leadership support you when needed."
                icon={Users}
              >
                {showGuardianFields ? (
                  <>
                    <ProfileField id="guardian_name" label="Guardian name" optional>
                      <Input
                        id="guardian_name"
                        value={form.guardian_name}
                        onChange={event => updateField("guardian_name", event.target.value)}
                        className={inputClassName}
                      />
                    </ProfileField>
                    <ProfileField id="guardian_phone" label="Guardian phone" icon={Phone} optional>
                      <Input
                        id="guardian_phone"
                        type="tel"
                        inputMode="tel"
                        value={form.guardian_phone}
                        onChange={event => updateField("guardian_phone", event.target.value)}
                        className={cn(inputClassName, "pl-10")}
                      />
                    </ProfileField>
                  </>
                ) : null}
                <ProfileField
                  id="skills_interests"
                  label="Skills, interests, or a short bio"
                  optional
                  className="sm:col-span-2"
                >
                  <Textarea
                    id="skills_interests"
                    rows={4}
                    value={form.skills_interests}
                    onChange={event => updateField("skills_interests", event.target.value)}
                    placeholder="Share the interests, skills, or ministry areas you enjoy."
                    className="min-h-28 resize-y border-[var(--outline-variant)] bg-white text-base shadow-none focus-visible:border-primary focus-visible:ring-primary/20 md:text-sm"
                  />
                </ProfileField>
              </ProfileSection>
            </div>

            <aside className="space-y-6 lg:sticky lg:top-20">
              {showChurchGroupFields ? (
                <section className="rounded-lg border border-[var(--outline-variant)]/60 bg-white p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Building2 className="size-5" />
                    </div>
                    <div>
                      <h2 className="font-[var(--font-manrope)] text-lg font-semibold text-foreground">
                        Church involvement
                      </h2>
                      <p className="mt-0.5 text-sm leading-5 text-[var(--on-surface-variant)]">
                        Your cell, position, and service units.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 border-y border-[var(--outline-variant)]/50 py-5 sm:grid-cols-2 lg:grid-cols-1">
                    <DetailItem icon={Users} label="Cell group" value={member.cell_group || "Not assigned"} />
                    <DetailItem icon={User} label="Church position" value={member.position || "Member"} />
                  </div>

                  <div className="mt-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Service units</h3>
                        <p className="mt-0.5 text-xs leading-5 text-[var(--outline)]">
                          Add the units you currently serve in.
                        </p>
                      </div>
                      <Badge variant="outline" className="rounded-full shadow-none">
                        {assignedUnits.length}
                      </Badge>
                    </div>

                    {availableUnits.length > 0 ? (
                      <div className="mt-4 flex gap-2">
                        <Select value={selectedUnitId || undefined} onValueChange={setSelectedUnitId}>
                          <SelectTrigger className="h-11 min-w-0 flex-1 border-[var(--outline-variant)] bg-white shadow-none">
                            <SelectValue placeholder="Choose a unit" />
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
                          size="icon"
                          variant="outline"
                          onClick={addUnit}
                          disabled={!selectedUnitId}
                          className="size-11 shrink-0 border-[var(--outline-variant)] shadow-none"
                          aria-label="Add selected unit"
                        >
                          <Plus />
                        </Button>
                      </div>
                    ) : null}

                    <div className="mt-4 space-y-3">
                      {assignedUnits.length > 0 ? (
                        assignedUnits.map(unit => (
                          <div key={unit.id} className="rounded-lg bg-[var(--surface-container-low)] p-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="min-w-0 truncate text-sm font-semibold text-foreground">{unit.name}</p>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() =>
                                  setUnitAssignments(current => ({ ...current, [unit.id]: FILTER_VALUE.NONE }))
                                }
                                className="shrink-0 text-[var(--outline)] shadow-none hover:bg-red-50 hover:text-destructive"
                                aria-label={`Remove ${unit.name}`}
                              >
                                <X />
                              </Button>
                            </div>
                            <Select
                              value={unitAssignments[unit.id] || UNIT_ROLE.MEMBER}
                              onValueChange={value =>
                                setUnitAssignments(current => ({ ...current, [unit.id]: value as UnitRole }))
                              }
                            >
                              <SelectTrigger className="mt-2 h-10 w-full border-[var(--outline-variant)] bg-white shadow-none">
                                <SelectValue placeholder="Unit role" />
                              </SelectTrigger>
                              <SelectContent>
                                {unitRoleOptions.map(option => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-lg border border-dashed border-[var(--outline-variant)] p-4 text-center text-sm text-[var(--on-surface-variant)]">
                          No units selected yet.
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              ) : null}

              {/* <section className="overflow-hidden rounded-lg border border-[var(--outline-variant)]/60 bg-white">
                <div className="flex items-center justify-between gap-3 p-5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-[#fff1dc] text-[#855300]">
                      <Sparkles className="size-5" />
                    </div>
                    <div>
                      <h2 className="font-[var(--font-manrope)] text-lg font-semibold text-foreground">Birthday preview</h2>
                      <p className="text-xs text-[var(--outline)]">A preview using your current profile.</p>
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={generatePreview} disabled={generating} className="shadow-none" aria-label="Generate another birthday preview">
                    <RefreshCw className={cn(generating && "animate-spin")} />
                  </Button>
                </div>
                <div className="aspect-video bg-[var(--surface-container-low)]">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Birthday graphic preview" onLoad={() => setGenerating(false)} onError={() => setGenerating(false)} className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center text-sm text-[var(--outline)]">
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Preparing preview
                    </div>
                  )}
                </div>
                <p className="p-4 text-center text-xs leading-5 text-[var(--on-surface-variant)]">
                  Your celebration graphic will use the saved photo and profile details.
                </p>
              </section> */}
            </aside>
          </div>
        </main>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--outline-variant)] bg-white/95 p-3 backdrop-blur sm:hidden">
          <Button type="submit" size="lg" disabled={saving || uploading} className="w-full shadow-none">
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            {saving ? "Saving changes..." : "Save profile"}
          </Button>
        </div>
      </form>
    </div>
  );
}
