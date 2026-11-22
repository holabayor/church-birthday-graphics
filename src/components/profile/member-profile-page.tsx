"use client";

import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Camera,
  ChevronDown,
  Download,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Smartphone,
  Sparkles,
  User,
  Users,
  Vote,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { Member } from "@/lib/types";
import { UNIT_ROLE, unitRoleLabels, type UnitRole } from "@/lib/unitRoles";
import { cn, compressImage } from "@/lib/utils";

type UnitAssignmentChoice = typeof FILTER_VALUE.NONE | UnitRole;

type ProfileForm = {
  first_name: string;
  middle_name: string;
  last_name: string;
  phone_number: string;
  alternate_phone: string;
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

type DashboardUnit = {
  id: string;
  name: string;
  description: string | null;
  member_count: number;
  my_role: string | null;
};

type DashboardData = {
  units: DashboardUnit[];
  activePolls: Array<{
    id: string;
    slug: string | null;
    title: string;
    description: string | null;
    starts_at: string;
    ends_at: string;
  }>;
};

const SCRIPTURES = [
  {
    text: "The Lord bless you and keep you; the Lord make His face shine upon you, and be gracious to you.",
    reference: "Numbers 6:24–25",
  },
  {
    text: "For I know the thoughts that I think toward you, says the Lord, thoughts of peace and not of evil, to give you a future and a hope.",
    reference: "Jeremiah 29:11",
  },
  {
    text: "Trust in the Lord with all your heart, and lean not on your own understanding; in all your ways acknowledge Him, and He shall direct your paths.",
    reference: "Proverbs 3:5–6",
  },
  {
    text: "But those who wait on the Lord shall renew their strength; they shall mount up with wings like eagles, they shall run and not be weary.",
    reference: "Isaiah 40:31",
  },
  {
    text: "Through the Lord's mercies we are not consumed, because His compassions fail not. They are new every morning; great is Your faithfulness.",
    reference: "Lamentations 3:22–23",
  },
  {
    text: "The Lord is my shepherd; I shall not want. He makes me to lie down in green pastures; He leads me beside the still waters.",
    reference: "Psalm 23:1–2",
  },
];

const emptyForm: ProfileForm = {
  first_name: "",
  middle_name: "",
  last_name: "",
  phone_number: "",
  alternate_phone: "",
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
  "h-11 border-[var(--outline-variant)]/70 bg-white text-sm rounded-xl shadow-none focus-visible:border-primary focus-visible:ring-primary/20";

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

function getDaysUntilBirthday(dobString?: string | null): { days: number; label: string; isToday: boolean } | null {
  if (!dobString) return null;
  const parts = dobString.split("-");
  if (parts.length < 3) return null;
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(month) || isNaN(day)) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let nextBday = new Date(today.getFullYear(), month, day);
  if (nextBday < today) {
    nextBday = new Date(today.getFullYear() + 1, month, day);
  }
  const diffDays = Math.round((nextBday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const dateFormatted = nextBday.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (diffDays === 0) {
    return { days: 0, label: "Happy Birthday Today!", isToday: true };
  }
  if (diffDays === 1) {
    return { days: 1, label: `Birthday is tomorrow (${dateFormatted})`, isToday: false };
  }
  return { days: diffDays, label: `Birthday: ${dateFormatted} (in ${diffDays} days)`, isToday: false };
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
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="text-xs font-medium text-[var(--on-surface-variant)]">
          {label}
        </Label>
        {optional ? <span className="text-[11px] text-(--outline)">Optional</span> : null}
      </div>
      <div className="relative">
        {Icon ? (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-(--outline)" />
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
      className="overflow-hidden rounded-2xl border border-(--outline-variant)/60 bg-white shadow-2xs"
    >
      <CollapsibleTrigger className="flex min-h-14 w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition-colors hover:bg-(--surface-container-low)/50 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-4.5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground sm:text-base">{title}</h2>
            <p className="text-xs text-(--on-surface-variant) truncate">{description}</p>
          </div>
        </div>
        <ChevronDown className={cn("size-4.5 shrink-0 text-(--outline) transition-transform", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t border-(--outline-variant)/40">
        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function MemberProfilePage() {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [memberId, setMemberId] = useState<string | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingUnitId, setTogglingUnitId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [messages, setMessages] = useState<string[]>(defaultMessages);
  const [unitAssignments, setUnitAssignments] = useState<Record<string, UnitAssignmentChoice>>({});
  const [scripture] = useState(() => SCRIPTURES[Math.floor(Math.random() * SCRIPTURES.length)]);

  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [cardDesignIdx, setCardDesignIdx] = useState(0);
  const [cardPreviewLoading, setCardPreviewLoading] = useState(false);
  const [pendingUnitAction, setPendingUnitAction] = useState<{
    unitId: string;
    unitName: string;
    join: boolean;
  } | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);

  const switchTab = (nextTab: string) => {
    setActiveTab(nextTab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", nextTab);
      window.history.pushState({}, "", url.toString());
      window.dispatchEvent(new Event("member-tab-change"));
    }
  };

  useEffect(() => {
    const syncTabFromUrl = () => {
      if (typeof window === "undefined") return;
      const tabParam = new URLSearchParams(window.location.search).get("tab");
      if (tabParam && ["overview", "units", "edit"].includes(tabParam)) {
        setActiveTab(tabParam);
      } else {
        setActiveTab("overview");
      }
    };
    syncTabFromUrl();
    window.addEventListener("popstate", syncTabFromUrl);
    window.addEventListener("member-tab-change", syncTabFromUrl);
    return () => {
      window.removeEventListener("popstate", syncTabFromUrl);
      window.removeEventListener("member-tab-change", syncTabFromUrl);
    };
  }, []);

  const profileType = normalizeLifeStage(form.life_stage || member?.life_stage);
  const showStudentFields = usesStudentProfile(profileType);
  const showNyscFields = usesNyscProfile(profileType);
  const showWorkFields = usesWorkProfile(profileType);
  const showResidenceFields = usesResidenceProfile(profileType);
  const showGuardianFields = usesGuardianProfile(profileType);
  const showChurchGroupFields = profileType !== LIFE_STAGE.VISITOR;
  const LifeStageIcon = getLifeStageIcon(profileType);

  const updateField = (field: keyof ProfileForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const loadDashboardData = async () => {
    try {
      const res = await fetch("/api/member-dashboard");
      if (res.ok) {
        const data = await res.json();
        setDashboard(data);
      }
    } catch {
      // Non-fatal
    }
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
        const [profileResponse, messagesResponse] = await Promise.all([
          fetch(`/api/members/${session.memberId}`),
          fetch("/api/birthday-messages").catch(() => null),
          loadDashboardData(),
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
            ])
          )
        );
        setForm({
          first_name: profile.first_name || "",
          middle_name: profile.middle_name || "",
          last_name: profile.last_name || "",
          phone_number: profile.phone_number || "",
          alternate_phone: profile.alternate_phone || "",
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

        if (messagesResponse?.ok) {
          const messageData = await messagesResponse.json();
          const loadedMessages = messageData?.data?.map((item: { message: string }) => item.message) || [];
          setMessages(loadedMessages.length > 0 ? loadedMessages : defaultMessages);
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

  const birthdayCardUrl = useMemo(() => {
    if (!member) return null;
    const primaryUnit = member.units?.[0];
    const params = new URLSearchParams({
      design: cardDesignIdx.toString(),
      first_name: form.first_name || member.first_name,
      middle_name: form.middle_name || member.middle_name || "",
      last_name: form.last_name || member.last_name,
      position: member.position || "",
      photo_url: photoPreview || "",
      date_of_birth: form.date_of_birth || member.date_of_birth,
      message: messages[0] || defaultMessages[0],
      unit_name: primaryUnit?.name || "",
      unit_role: primaryUnit?.role || "",
    });
    return `/api/generate?${params.toString()}`;
  }, [member, cardDesignIdx, form.first_name, form.middle_name, form.last_name, form.date_of_birth, photoPreview, messages]);

  const handlePhotoSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !memberId) return;
    setUploading(true);

    try {
      const compressedFile = await compressImage(file);
      const data = new FormData();
      data.append("file", compressedFile);
      data.append("bucket", "church-assets");
      data.append("folder", "members");

      const response = await fetch("/api/upload", { method: "POST", body: data });
      if (!response.ok) throw new Error("Upload failed");
      const result = await response.json();
      if (result.url) {
        setPhotoPreview(result.url);
        await fetch(`/api/members/${memberId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            photo_url: result.url,
            position: member?.position,
            life_stage: normalizeLifeStage(form.life_stage),
            units: Object.entries(unitAssignments)
              .filter(([, role]) => role !== FILTER_VALUE.NONE)
              .map(([unit_id, role]) => ({ unit_id, role })),
          }),
        });
        toast.success("Profile photo updated");
      }
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handleToggleUnitMembership = async (targetUnitId: string, join: boolean) => {
    if (!memberId) return;
    setTogglingUnitId(targetUnitId);
    const nextAssignments: Record<string, UnitAssignmentChoice> = {
      ...unitAssignments,
      [targetUnitId]: join ? UNIT_ROLE.MEMBER : FILTER_VALUE.NONE,
    };

    try {
      const payload = {
        ...form,
        position: member?.position,
        photo_url: photoPreview,
        life_stage: normalizeLifeStage(form.life_stage),
        units: Object.entries(nextAssignments)
          .filter(([, role]) => role !== FILTER_VALUE.NONE)
          .map(([unit_id, role]) => ({ unit_id, role })),
        student_status: member?.student_status,
        cell_group: member?.cell_group,
        membership_status: member?.membership_status,
      };

      const res = await fetch(`/api/members/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update unit membership");
      const updated = await res.json();
      setMember(updated);
      setUnitAssignments(
        Object.fromEntries(
          (updated.units || []).map((u: { id: string; role?: UnitRole }) => [u.id, u.role || UNIT_ROLE.MEMBER])
        )
      );
      await loadDashboardData();
      setPendingUnitAction(null);
      toast.success(join ? "Joined ministry unit" : "Left ministry unit");
    } catch {
      toast.error("Could not update unit membership");
    } finally {
      setTogglingUnitId(null);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!memberId) return;
    setSaving(true);

    try {
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
          ])
        )
      );
      await loadDashboardData();
      toast.success("Profile saved");
    } catch {
      toast.error("Failed to update profile details");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-5 p-4 md:p-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <User className="size-6" />
        </div>
        <h1 className="mt-4 font-(--font-manrope) text-xl font-bold text-foreground">Profile unavailable</h1>
        <p className="mt-1 max-w-sm text-sm leading-6 text-(--on-surface-variant)">
          We could not load your profile. Check your connection and try again.
        </p>
      </div>
    );
  }

  const membershipStatus = getMembershipStatusLabel(member.membership_status, member.is_active);
  const activeMember = isAvailableMember(member.membership_status, member.is_active);
  const joinedLabel = member.created_at
    ? new Date(member.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "Member";
  const bdayCountdown = getDaysUntilBirthday(form.date_of_birth || member.date_of_birth);

  const myUnits = (dashboard?.units || []).filter((u) => Boolean(u.my_role));
  const otherUnits = (dashboard?.units || []).filter((u) => !u.my_role);
  const activePolls = dashboard?.activePolls || [];

  const pageTitle =
    activeTab === "units"
      ? "My Units"
      : activeTab === "edit"
        ? "My Profile"
        : `Hello, ${form.first_name || member.first_name}`;

  const pageDesc =
    activeTab === "units"
      ? "Manage the church departments you serve in."
      : activeTab === "edit"
        ? "Keep your personal, school, or career information up to date."
        : "Welcome to your church member portal.";

  return (
    <div className="min-h-screen bg-[var(--surface)] pb-24 sm:pb-10">
      <PageHeader
        eyebrow="Member portal"
        title={pageTitle}
        description={pageDesc}
        actions={
          activeTab === "edit" ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => switchTab("overview")}
                className="h-9 bg-white border-[var(--outline-variant)] text-xs font-medium"
              >
                Back
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={saving || uploading}
                onClick={handleSubmit}
                className="h-9 font-semibold"
              >
                {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          ) : activeTab === "units" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => switchTab("overview")}
              className="h-9 bg-white border-[var(--outline-variant)] text-xs font-medium"
            >
              Back to Home
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setCardPreviewLoading(true);
                setCardModalOpen(true);
              }}
              className="h-9 border-[var(--outline-variant)] bg-white text-xs font-semibold"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
              Birthday Card
            </Button>
          )
        }
      />

      <main className="w-full max-w-3xl mx-auto space-y-5 p-4 md:p-8">
        {/* =============================================================== */}
        {/* VIEW 1: MINIMALIST MEMBER HOME                                  */}
        {/* =============================================================== */}
        {activeTab === "overview" && (
          <>
            {/* Conditional Live Poll Banner — ONLY visible when an active poll is open */}
            {activePolls.map((poll) => (
              <div
                key={poll.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                    <Vote className="size-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                      Live Poll Open
                    </p>
                    <p className="font-semibold text-foreground text-sm truncate">
                      {poll.title}
                    </p>
                  </div>
                </div>
                <Button asChild size="sm" className="h-8.5 rounded-xl font-semibold text-xs shrink-0">
                  <Link href={`/polls/${poll.slug || poll.id}`}>
                    Vote Now
                    <ArrowRight className="ml-1.5 size-3.5" />
                  </Link>
                </Button>
              </div>
            ))}

            {/* 1. Minimalist Member Card */}
            <Card className="border-[var(--outline-variant)]/60 bg-white shadow-2xs rounded-2xl">
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="group relative shrink-0 rounded-full focus:outline-none"
                      title="Change profile photo"
                    >
                      <Avatar className="h-16 w-16 border border-[var(--outline-variant)]/70">
                        <AvatarImage src={photoPreview || ""} alt={getFullName(form)} className="object-cover" />
                        <AvatarFallback className="bg-primary/10 text-primary text-base font-bold">
                          {form.first_name?.[0]}
                          {form.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute bottom-0 right-0 flex size-6 items-center justify-center rounded-full border-2 border-white bg-primary text-white">
                        {uploading ? <Loader2 className="size-3 animate-spin" /> : <Camera className="size-3" />}
                      </span>
                    </button>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-bold text-foreground text-base sm:text-lg truncate">
                          {getFullName(form)}
                        </h2>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-medium px-2 py-0",
                            activeMember
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          )}
                        >
                          {membershipStatus}
                        </Badge>
                      </div>

                      <p className="text-xs text-[var(--on-surface-variant)]">
                        {getLifeStageLabel(profileType)}
                        {member.position ? ` · ${member.position}` : ""}
                        {` · Joined ${joinedLabel}`}
                      </p>

                      {bdayCountdown && (
                        <p className="text-xs text-amber-700 font-medium pt-0.5">
                          🎂 {bdayCountdown.label}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => switchTab("edit")}
                    className="h-8.5 rounded-xl border-[var(--outline-variant)]/70 bg-white text-xs font-medium shrink-0"
                  >
                    Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 2. Daily Scripture Card */}
            <Card className="border-[var(--outline-variant)]/60 bg-white shadow-2xs rounded-2xl">
              <CardContent className="p-5 sm:p-6 space-y-2">
                <p className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
                  Scripture for Today
                </p>
                <p className="text-sm sm:text-base text-foreground leading-relaxed italic">
                  &ldquo;{scripture.text}&rdquo;
                </p>
                <p className="text-xs font-semibold text-[var(--on-surface-variant)]">
                  — {scripture.reference}
                </p>
              </CardContent>
            </Card>

            {/* 3. Lightweight My Units Summary Card */}
            <Card className="border-[var(--outline-variant)]/60 bg-white shadow-2xs rounded-2xl">
              <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Building2 className="size-4 text-primary" />
                    Ministry Units
                  </p>
                  {myUnits.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {myUnits.map((unit) => (
                        <span
                          key={unit.id}
                          className="inline-flex items-center rounded-lg bg-[var(--surface-container-low)] px-2.5 py-1 text-xs font-medium text-foreground"
                        >
                          {unit.name} · {unitRoleLabels[(unit.my_role as UnitRole) || UNIT_ROLE.MEMBER]}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--on-surface-variant)]">
                      You are not currently assigned to a ministry department.
                    </p>
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => switchTab("units")}
                  className="h-8.5 rounded-xl border-[var(--outline-variant)]/70 bg-white text-xs font-medium shrink-0"
                >
                  {myUnits.length > 0 ? "Manage Units" : "Join a Unit"}
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* =============================================================== */}
        {/* VIEW 2: MY UNITS (PRIVACY-RESPECTING, LIGHTWEIGHT)              */}
        {/* =============================================================== */}
        {activeTab === "units" && (
          <div className="space-y-6">
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-[var(--on-surface-variant)]">
                Your Active Units ({myUnits.length})
              </h2>

              {myUnits.length === 0 ? (
                <Card className="border-dashed border-[var(--outline-variant)] bg-white rounded-2xl">
                  <CardContent className="py-8 text-center">
                    <p className="text-sm text-[var(--on-surface-variant)]">
                      You haven&apos;t joined a ministry unit yet. Choose a department below to join.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2.5">
                  {myUnits.map((unit) => {
                    const isLeader = unit.my_role === "head" || unit.my_role === "assistant";
                    return (
                      <div
                        key={unit.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--outline-variant)]/60 bg-white p-4 shadow-2xs"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">{unit.name}</p>
                          <p className="text-xs text-[var(--on-surface-variant)] mt-0.5">
                            Role: {unitRoleLabels[(unit.my_role as UnitRole) || UNIT_ROLE.MEMBER]}
                          </p>
                        </div>

                        {isLeader ? (
                          <Button asChild size="sm" variant="outline" className="h-8 text-xs font-semibold shrink-0">
                            <Link href={`/units/${unit.id}`}>Open Roster</Link>
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={togglingUnitId === unit.id}
                            onClick={() =>
                              setPendingUnitAction({ unitId: unit.id, unitName: unit.name, join: false })
                            }
                            className="h-8 text-xs text-[var(--on-surface-variant)] hover:text-red-600 shrink-0"
                          >
                            {togglingUnitId === unit.id ? "Updating..." : "Leave"}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {otherUnits.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[var(--on-surface-variant)]">
                  Available Church Departments
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {otherUnits.map((unit) => (
                    <div
                      key={unit.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--outline-variant)]/60 bg-white p-4 shadow-2xs"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground text-sm truncate">{unit.name}</p>
                        {unit.description && (
                          <p className="text-xs text-[var(--on-surface-variant)] truncate mt-0.5">
                            {unit.description}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={togglingUnitId === unit.id}
                        onClick={() =>
                          setPendingUnitAction({ unitId: unit.id, unitName: unit.name, join: true })
                        }
                        className="h-8 px-3 rounded-lg text-xs font-medium border-[var(--outline-variant)]/70 shrink-0"
                      >
                        {togglingUnitId === unit.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <>
                            <Plus className="size-3.5 mr-1 text-primary" />
                            Join
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* =============================================================== */}
        {/* VIEW 3: MY PROFILE (EDIT PERSONAL RECORD)                       */}
        {/* =============================================================== */}
        {activeTab === "edit" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <ProfileSection
              title="Personal & Contact Details"
              description="Your name, phone number, email, birthday, and life stage."
              icon={User}
              defaultOpen
            >
              <ProfileField id="first_name" label="First name">
                <Input
                  id="first_name"
                  required
                  value={form.first_name}
                  onChange={(event) => updateField("first_name", event.target.value)}
                  className={inputClassName}
                />
              </ProfileField>
              <ProfileField id="last_name" label="Last name">
                <Input
                  id="last_name"
                  required
                  value={form.last_name}
                  onChange={(event) => updateField("last_name", event.target.value)}
                  className={inputClassName}
                />
              </ProfileField>
              <ProfileField id="middle_name" label="Middle name" optional>
                <Input
                  id="middle_name"
                  value={form.middle_name}
                  onChange={(event) => updateField("middle_name", event.target.value)}
                  className={inputClassName}
                />
              </ProfileField>
              <ProfileField id="date_of_birth" label="Date of birth" icon={CalendarDays}>
                <Input
                  id="date_of_birth"
                  required
                  type="date"
                  value={form.date_of_birth}
                  onChange={(event) => updateField("date_of_birth", event.target.value)}
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
                  onChange={(event) => updateField("phone_number", event.target.value)}
                  className={cn(inputClassName, "pl-10")}
                />
              </ProfileField>
              <ProfileField id="alternate_phone" label="Alternate phone" icon={Smartphone} optional>
                <Input
                  id="alternate_phone"
                  type="tel"
                  inputMode="tel"
                  value={form.alternate_phone}
                  onChange={(event) => updateField("alternate_phone", event.target.value)}
                  className={cn(inputClassName, "pl-10")}
                />
              </ProfileField>
              <ProfileField id="email" label="Email address" icon={Mail} optional>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  className={cn(inputClassName, "pl-10")}
                />
              </ProfileField>
              <ProfileField id="life_stage" label="Current life stage">
                <Select value={profileType} onValueChange={(value) => updateField("life_stage", value)}>
                  <SelectTrigger
                    id="life_stage"
                    className="h-11 w-full rounded-xl border-(--outline-variant)/70 bg-white text-sm shadow-none"
                  >
                    <SelectValue placeholder="Select life stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {lifeStageOptions.map((option) => (
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
                title={`${getLifeStageLabel(profileType)} Details`}
                description="School, NYSC, employment, or residence information."
                icon={LifeStageIcon}
                defaultOpen
              >
                {showStudentFields ? (
                  <>
                    <ProfileField id="institution" label="Institution" icon={GraduationCap}>
                      <Input
                        id="institution"
                        value={form.institution}
                        onChange={(event) => updateField("institution", event.target.value)}
                        className={cn(inputClassName, "pl-10")}
                      />
                    </ProfileField>
                    <ProfileField id="department" label="Department or course" icon={BookOpen}>
                      <Input
                        id="department"
                        value={form.department}
                        onChange={(event) => updateField("department", event.target.value)}
                        className={cn(inputClassName, "pl-10")}
                      />
                    </ProfileField>
                    {profileType === LIFE_STAGE.STUDENT ? (
                      <ProfileField id="academic_level" label="Academic level" optional>
                        <Input
                          id="academic_level"
                          value={form.academic_level}
                          onChange={(event) => updateField("academic_level", event.target.value)}
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
                          onChange={(event) => updateField("graduation_year", event.target.value)}
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
                        onChange={(event) => updateField("nysc_state", event.target.value)}
                        className={cn(inputClassName, "pl-10")}
                      />
                    </ProfileField>
                    <ProfileField id="nysc_ppa" label="Place of primary assignment">
                      <Input
                        id="nysc_ppa"
                        value={form.nysc_ppa}
                        onChange={(event) => updateField("nysc_ppa", event.target.value)}
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
                        onChange={(event) => updateField("employer", event.target.value)}
                        className={cn(inputClassName, "pl-10")}
                      />
                    </ProfileField>
                    <ProfileField id="job_title" label="Job title" optional>
                      <Input
                        id="job_title"
                        value={form.job_title}
                        onChange={(event) => updateField("job_title", event.target.value)}
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
                        onChange={(event) => updateField("work_location", event.target.value)}
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
                      onChange={(event) => updateField("residence", event.target.value)}
                      className={cn(inputClassName, "pl-10")}
                    />
                  </ProfileField>
                ) : null}
              </ProfileSection>
            ) : null}

            <ProfileSection
              title="About & Emergency Contact"
              description="Skills, interests, and guardian or emergency contact details."
              icon={Users}
            >
              {showGuardianFields ? (
                <>
                  <ProfileField id="guardian_name" label="Guardian name" optional>
                    <Input
                      id="guardian_name"
                      value={form.guardian_name}
                      onChange={(event) => updateField("guardian_name", event.target.value)}
                      className={inputClassName}
                    />
                  </ProfileField>
                  <ProfileField id="guardian_phone" label="Guardian phone" icon={Phone} optional>
                    <Input
                      id="guardian_phone"
                      type="tel"
                      inputMode="tel"
                      value={form.guardian_phone}
                      onChange={(event) => updateField("guardian_phone", event.target.value)}
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
                  rows={3}
                  value={form.skills_interests}
                  onChange={(event) => updateField("skills_interests", event.target.value)}
                  placeholder="Share the interests, skills, or ministry areas you enjoy."
                  className="min-h-24 resize-y rounded-xl border-(--outline-variant)/70 bg-white text-sm shadow-none focus-visible:border-primary focus-visible:ring-primary/20"
                />
              </ProfileField>
            </ProfileSection>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={saving || uploading} className="h-10 px-5 rounded-xl font-semibold">
                {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </form>
        )}
      </main>

      {/* Join / Leave Unit Confirmation Modal */}
      <Dialog
        open={Boolean(pendingUnitAction)}
        onOpenChange={(open) => {
          if (!open && !togglingUnitId) setPendingUnitAction(null);
        }}
      >
        <DialogContent className="sm:max-w-sm border-[var(--outline-variant)] bg-white p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="px-5 pt-5 pb-2 text-left">
            <DialogTitle className="text-base font-bold text-foreground">
              {pendingUnitAction?.join ? "Join Ministry Unit?" : "Leave Ministry Unit?"}
            </DialogTitle>
            <DialogDescription className="text-xs text-[var(--on-surface-variant)] mt-1">
              {pendingUnitAction?.join
                ? `Are you sure you want to join ${pendingUnitAction.unitName}?`
                : `Are you sure you want to leave ${pendingUnitAction?.unitName}?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="px-5 py-4 flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={Boolean(togglingUnitId)}
              onClick={() => setPendingUnitAction(null)}
              className="h-9 rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={pendingUnitAction?.join ? "default" : "destructive"}
              size="sm"
              disabled={Boolean(togglingUnitId)}
              onClick={() =>
                pendingUnitAction &&
                handleToggleUnitMembership(pendingUnitAction.unitId, pendingUnitAction.join)
              }
              className="h-9 rounded-xl text-xs font-semibold"
            >
              {togglingUnitId ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Updating...
                </>
              ) : pendingUnitAction?.join ? (
                "Yes, Join Unit"
              ) : (
                "Yes, Leave Unit"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Personal Birthday Card Preview & Download Modal */}
      <Dialog open={cardModalOpen} onOpenChange={setCardModalOpen}>
        <DialogContent className="sm:max-w-md border-[var(--outline-variant)] bg-white p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="border-b border-[var(--outline-variant)]/50 px-5 py-4 flex flex-row items-center justify-between">
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Sparkles className="size-4 text-amber-500" />
              My Birthday Card
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-[var(--outline-variant)]/60 bg-slate-900 flex items-center justify-center">
              {cardPreviewLoading && (
                <div className="absolute inset-0 bg-slate-900/75 flex flex-col items-center justify-center text-white z-10">
                  <RefreshCw className="size-6 animate-spin text-amber-400 mb-2" />
                  <span className="text-xs">Rendering your card...</span>
                </div>
              )}
              {birthdayCardUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={birthdayCardUrl}
                  alt="My Birthday Card"
                  className="size-full object-contain"
                  onLoad={() => setCardPreviewLoading(false)}
                  onError={() => setCardPreviewLoading(false)}
                />
              )}
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={cardDesignIdx.toString()}
                onValueChange={(val) => {
                  setCardPreviewLoading(true);
                  setCardDesignIdx(Number(val));
                }}
              >
                <SelectTrigger className="h-10 flex-1 rounded-xl border-[var(--outline-variant)]/70 bg-[var(--surface-container-low)] text-xs font-semibold">
                  <SelectValue placeholder="Choose style" />
                </SelectTrigger>
                <SelectContent>
                  {designs.map((d, idx) => (
                    <SelectItem key={d.name || idx} value={idx.toString()} className="text-xs">
                      {idx + 1}. {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {birthdayCardUrl && (
                <Button asChild className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shrink-0">
                  <a href={birthdayCardUrl} download={`${form.first_name || "My"}-Birthday-Card.png`}>
                    <Download className="mr-1.5 size-4" />
                    Download PNG
                  </a>
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
