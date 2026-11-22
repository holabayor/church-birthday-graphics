"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CalendarCheck,
  Check,
  Clock,
  Copy,
  Loader2,
  Phone,
  Plus,
  Search,
  TrendingUp,
  UserCheck,
  UserX,
  Users,
  AlertCircle,
} from "lucide-react";
import { AttendanceSession, Member } from "@/lib/types";
import { getLifeStageLabel } from "@/lib/memberLifecycle";
import {
  ATTENDANCE_STATUS,
  FOLLOW_UP_STATUS,
  SERVICE_TYPE,
  type AttendanceStatus,
  type FollowUpStatus,
  type ServiceType,
  followUpStatusOptions,
  serviceTypeOptions,
} from "@/lib/attendanceStatus";
import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type RosterMember = Pick<
  Member,
  "id" | "first_name" | "middle_name" | "last_name" | "phone_number" | "photo_url" | "life_stage" | "position"
> & {
  attendance: {
    status: AttendanceStatus;
  };
  follow_up: {
    status: FollowUpStatus;
    notes: string | null;
    assigned_to: string | null;
  } | null;
};

type AttendanceReport = AttendanceSession & {
  present: number;
  absent: number;
  excused: number;
  totalMarked: number;
  expectedTotal: number;
  attendanceRate: number;
};

const today = new Date().toISOString().slice(0, 10);

const fullName = (member: Pick<Member, "first_name" | "middle_name" | "last_name">) =>
  [member.first_name, member.middle_name, member.last_name].filter(Boolean).join(" ");

function getWhatsAppHref(phone?: string | null, text?: string) {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return null;
  const international = digits.startsWith("0") ? `234${digits.slice(1)}` : digits;
  const base = `https://wa.me/${international}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export default function AttendancePage() {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [roster, setRoster] = useState<RosterMember[]>([]);
  const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0, excused: 0 });
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [loadingReports, setLoadingReports] = useState(true);
  const [saving, setSaving] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [reports, setReports] = useState<AttendanceReport[]>([]);
  const [reportSummary, setReportSummary] = useState({
    activeMembers: 0,
    averageAttendanceRate: 0,
    averagePresent: 0,
    totalSessions: 0,
  });
  const [followUpDrafts, setFollowUpDrafts] = useState<
    Record<string, { status: FollowUpStatus; notes: string; assigned_to: string }>
  >({});
  const [newSession, setNewSession] = useState<{
    title: string;
    service_type: ServiceType;
    session_date: string;
    notes: string;
  }>({
    title: "Sunday Service",
    service_type: SERVICE_TYPE.SERVICE,
    session_date: today,
    notes: "",
  });

  const selectedSession = sessions.find((session) => session.id === selectedSessionId) || null;

  const filteredRoster = useMemo(() => {
    const query = search.trim().toLowerCase();
    return roster.filter((member) => {
      const matchesQuery =
        !query ||
        fullName(member).toLowerCase().includes(query) ||
        member.phone_number?.toLowerCase().includes(query) ||
        member.life_stage?.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || member.attendance.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [roster, search, statusFilter]);

  const absenteeRoster = useMemo(() => {
    const query = search.trim().toLowerCase();
    return roster.filter((member) => {
      const isAbsent = member.attendance.status === ATTENDANCE_STATUS.ABSENT;
      if (!isAbsent) return false;
      if (!query) return true;
      return (
        fullName(member).toLowerCase().includes(query) ||
        member.phone_number?.toLowerCase().includes(query) ||
        member.life_stage?.toLowerCase().includes(query)
      );
    });
  }, [roster, search]);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await fetch("/api/attendance/sessions");
      const data = await res.json();
      const loadedSessions = Array.isArray(data.data) ? data.data : [];
      setSessions(loadedSessions);
      if (!selectedSessionId && loadedSessions.length > 0) {
        setSelectedSessionId(loadedSessions[0].id);
      }
    } catch {
      toast.error("Failed to load attendance sessions");
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchRoster = async (sessionId: string, silent = false) => {
    if (!sessionId) return;
    if (!silent) setLoadingRoster(true);
    try {
      const res = await fetch(`/api/attendance/sessions/${sessionId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setRoster(data.roster || []);
      setSummary(data.summary || { total: 0, present: 0, absent: 0, excused: 0 });
      setFollowUpDrafts(
        Object.fromEntries(
          (data.roster || []).map((member: RosterMember) => [
            member.id,
            {
              status: member.follow_up?.status || FOLLOW_UP_STATUS.PENDING,
              notes: member.follow_up?.notes || "",
              assigned_to: member.follow_up?.assigned_to || "",
            },
          ])
        )
      );
    } catch {
      if (!silent) toast.error("Failed to load attendance roster");
    } finally {
      if (!silent) setLoadingRoster(false);
    }
  };

  const fetchReports = async (silent = false) => {
    if (!silent) setLoadingReports(true);
    try {
      const res = await fetch("/api/attendance/reports");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setReports(Array.isArray(data.sessions) ? data.sessions : []);
      setReportSummary(
        data.summary || {
          activeMembers: 0,
          averageAttendanceRate: 0,
          averagePresent: 0,
          totalSessions: 0,
        }
      );
    } catch {
      if (!silent) toast.error("Failed to load attendance reports");
    } finally {
      if (!silent) setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedSessionId) fetchRoster(selectedSessionId);
  }, [selectedSessionId]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/attendance/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSession),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Attendance session created");
      setSelectedSessionId(data.id);
      setSessions((current) => [data, ...current]);
      setCreateModalOpen(false);
      fetchReports(true);
    } catch {
      toast.error("Failed to create attendance session");
    } finally {
      setSaving(false);
    }
  };

  const markAttendance = async (memberId: string, status: AttendanceStatus) => {
    if (!selectedSessionId) return;

    const previousRoster = roster;
    const previousSummary = summary;

    // Optimistic update of roster & summary without skeleton flash
    const nextRoster = roster.map((member) =>
      member.id === memberId ? { ...member, attendance: { ...member.attendance, status } } : member
    );
    setRoster(nextRoster);

    const presentCount = nextRoster.filter((m) => m.attendance.status === ATTENDANCE_STATUS.PRESENT).length;
    const absentCount = nextRoster.filter((m) => m.attendance.status === ATTENDANCE_STATUS.ABSENT).length;
    const excusedCount = nextRoster.filter((m) => m.attendance.status === ATTENDANCE_STATUS.EXCUSED).length;
    setSummary({
      total: nextRoster.length,
      present: presentCount,
      absent: absentCount,
      excused: excusedCount,
    });

    try {
      const res = await fetch("/api/attendance/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: selectedSessionId, member_id: memberId, status }),
      });
      if (!res.ok) throw new Error();
      fetchReports(true);
    } catch {
      setRoster(previousRoster);
      setSummary(previousSummary);
      toast.error("Failed to update attendance");
    }
  };

  const saveFollowUp = async (memberId: string) => {
    if (!selectedSessionId) return;
    const draft = followUpDrafts[memberId] || { status: FOLLOW_UP_STATUS.PENDING, notes: "", assigned_to: "" };

    try {
      const res = await fetch("/api/attendance/followups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: selectedSessionId, member_id: memberId, ...draft }),
      });
      if (!res.ok) throw new Error();
      toast.success("Follow-up saved");
      fetchRoster(selectedSessionId, true);
    } catch {
      toast.error("Failed to save follow-up");
    }
  };

  const attendanceRatePct = summary.total > 0 ? Math.round((summary.present / summary.total) * 100) : 0;

  return (
    <div className="flex-1 w-full">
      <PageHeader
        eyebrow="Service operations"
        title="Attendance"
        description={
          selectedSession
            ? `${selectedSession.title} · ${new Date(selectedSession.session_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}`
            : "Mark live service attendance, monitor turnout trends, and care for absentees."
        }
        actions={
          <div className="flex w-full sm:w-auto flex-wrap items-center gap-2">
            {sessions.length > 0 && (
              <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                <SelectTrigger className="h-10 flex-1 sm:w-56 border-[var(--outline-variant)] bg-white text-xs font-medium">
                  <SelectValue placeholder="Switch session..." />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id} className="text-xs">
                      {session.title} ({new Date(session.session_date).toLocaleDateString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button onClick={() => setCreateModalOpen(true)} variant="secondary" size="sm" className="h-10 font-semibold">
              <Plus className="mr-1.5 h-4 w-4" />
              New Session
            </Button>
          </div>
        }
      />

      <div className="space-y-6 p-4 md:space-y-8 md:p-8">
        {/* 4 Calm Interactive KPI / Filter Cards (2x2 on Mobile, 4-Col on Desktop) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`text-left bg-white p-4 sm:p-5 rounded-xl border shadow-2xs transition-all ${
              statusFilter === "all"
                ? "border-primary ring-2 ring-primary/15"
                : "border-[var(--outline-variant)]/70 hover:border-primary/40"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-[var(--on-surface-variant)]">Total Roster</span>
              <Users className="size-4 text-primary" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-foreground mt-2">{summary.total}</p>
            <p className="text-xs text-[var(--outline)] mt-0.5">All members</p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(ATTENDANCE_STATUS.PRESENT)}
            className={`text-left bg-white p-4 sm:p-5 rounded-xl border shadow-2xs transition-all ${
              statusFilter === ATTENDANCE_STATUS.PRESENT
                ? "border-emerald-600 ring-2 ring-emerald-500/15"
                : "border-[var(--outline-variant)]/70 hover:border-emerald-500/40"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-[var(--on-surface-variant)]">Present</span>
              <span className="text-xs font-mono font-semibold text-emerald-700">{attendanceRatePct}%</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-700 mt-2">{summary.present}</p>
            <p className="text-xs text-[var(--outline)] mt-0.5">Checked in</p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(ATTENDANCE_STATUS.ABSENT)}
            className={`text-left bg-white p-4 sm:p-5 rounded-xl border shadow-2xs transition-all ${
              statusFilter === ATTENDANCE_STATUS.ABSENT
                ? "border-rose-600 ring-2 ring-rose-500/15"
                : "border-[var(--outline-variant)]/70 hover:border-rose-500/40"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-[var(--on-surface-variant)]">Absent</span>
              <AlertCircle className="size-4 text-rose-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-rose-700 mt-2">{summary.absent}</p>
            <p className="text-xs text-[var(--outline)] mt-0.5">Needs follow-up</p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(ATTENDANCE_STATUS.EXCUSED)}
            className={`text-left bg-white p-4 sm:p-5 rounded-xl border shadow-2xs transition-all ${
              statusFilter === ATTENDANCE_STATUS.EXCUSED
                ? "border-amber-600 ring-2 ring-amber-500/15"
                : "border-[var(--outline-variant)]/70 hover:border-amber-500/40"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-[var(--on-surface-variant)]">Excused</span>
              <Clock className="size-4 text-amber-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-amber-700 mt-2">{summary.excused}</p>
            <p className="text-xs text-[var(--outline)] mt-0.5">Notified absence</p>
          </button>
        </div>

        {/* Clean 3-Tab View */}
        <Tabs defaultValue="roster" className="w-full space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <TabsList className="grid w-full sm:w-auto grid-cols-3">
              <TabsTrigger value="roster" className="text-xs sm:text-sm px-4">
                Roster
              </TabsTrigger>
              <TabsTrigger value="followup" className="text-xs sm:text-sm px-4">
                Follow-Up ({summary.absent})
              </TabsTrigger>
              <TabsTrigger value="trends" className="text-xs sm:text-sm px-4">
                History
              </TabsTrigger>
            </TabsList>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--outline)]" />
              <Input
                type="search"
                placeholder="Search member name or phone..."
                className="pl-9 h-10 bg-white border-[var(--outline-variant)] rounded-xl text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* TAB 1: MARK ROSTER */}
          <TabsContent value="roster" className="mt-0">
            <Card className="border-[var(--outline-variant)]/70 bg-white">
              <CardContent className="p-0">
                {loadingRoster ? (
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                  </div>
                ) : !selectedSessionId ? (
                  <div className="py-14 text-center text-sm text-[var(--on-surface-variant)]">
                    Select or create a session above to mark attendance.
                  </div>
                ) : filteredRoster.length === 0 ? (
                  <div className="py-14 text-center text-sm text-[var(--on-surface-variant)]">
                    No members match your current search or filter.
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--outline-variant)]/40">
                    {filteredRoster.map((member) => {
                      const isPresent = member.attendance.status === ATTENDANCE_STATUS.PRESENT;
                      const isAbsent = member.attendance.status === ATTENDANCE_STATUS.ABSENT;
                      const isExcused = member.attendance.status === ATTENDANCE_STATUS.EXCUSED;

                      return (
                        <div
                          key={member.id}
                          className="flex flex-col gap-3 px-4 py-3.5 sm:px-5 sm:flex-row sm:items-center sm:justify-between hover:bg-[var(--surface-container-low)]/30 transition-colors"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar className="h-10 w-10 border border-[var(--outline-variant)]/60 shrink-0">
                              <AvatarImage src={member.photo_url || ""} className="object-cover" />
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                                {member.first_name?.[0]}
                                {member.last_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground text-sm truncate">
                                {fullName(member)}
                              </p>
                              <p className="text-xs text-[var(--outline)] truncate mt-0.5">
                                {member.phone_number || "No phone"} · {getLifeStageLabel(member.life_stage)}
                              </p>
                            </div>
                          </div>

                          {/* 1-Tap Segmented Status Buttons */}
                          <div className="grid grid-cols-3 sm:flex items-center gap-1.5 w-full sm:w-auto">
                            <Button
                              size="sm"
                              variant={isPresent ? "default" : "outline"}
                              onClick={() => markAttendance(member.id, ATTENDANCE_STATUS.PRESENT)}
                              className={`h-8.5 text-xs font-semibold ${
                                isPresent
                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
                                  : "bg-white border-[var(--outline-variant)] text-foreground"
                              }`}
                            >
                              Present
                            </Button>
                            <Button
                              size="sm"
                              variant={isAbsent ? "destructive" : "outline"}
                              onClick={() => markAttendance(member.id, ATTENDANCE_STATUS.ABSENT)}
                              className={`h-8.5 text-xs font-semibold ${
                                isAbsent ? "" : "bg-white border-[var(--outline-variant)] text-foreground"
                              }`}
                            >
                              Absent
                            </Button>
                            <Button
                              size="sm"
                              variant={isExcused ? "secondary" : "outline"}
                              onClick={() => markAttendance(member.id, ATTENDANCE_STATUS.EXCUSED)}
                              className={`h-8.5 text-xs font-semibold ${
                                isExcused
                                  ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                                  : "bg-white border-[var(--outline-variant)] text-foreground"
                              }`}
                            >
                              Excused
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: ABSENTEE FOLLOW-UP */}
          <TabsContent value="followup" className="mt-0">
            <Card className="shadow-xs border-[var(--outline-variant)]/70 bg-white rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-[var(--outline-variant)]/50 bg-rose-50/30 p-4 sm:p-5 flex flex-row items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                    Absentee Care & Follow-Up Queue ({absenteeRoster.length})
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Reach out via phone or WhatsApp and log follow-up notes for absent members.
                  </CardDescription>
                </div>
                {absenteeRoster.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const phones = absenteeRoster.map((m) => m.phone_number?.trim()).filter(Boolean);
                      if (phones.length === 0) {
                        toast.info("No phone numbers to copy");
                        return;
                      }
                      await navigator.clipboard.writeText(phones.join("\n"));
                      toast.success(`Copied ${phones.length} absentee phone numbers`);
                    }}
                    className="h-9 bg-white border-[var(--outline-variant)] text-xs font-semibold shrink-0"
                  >
                    <Copy className="mr-1.5 h-3.5 w-3.5 text-primary" />
                    Copy Phones
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-4 sm:p-5">
                {loadingRoster ? (
                  <Skeleton className="h-24 w-full rounded-xl" />
                ) : absenteeRoster.length === 0 ? (
                  <div className="py-12 text-center text-sm text-[var(--on-surface-variant)]">
                    No absentees recorded for this session.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {absenteeRoster.map((member) => {
                      const draft = followUpDrafts[member.id] || {
                        status: FOLLOW_UP_STATUS.PENDING,
                        notes: "",
                        assigned_to: "",
                      };
                      const waHref = getWhatsAppHref(
                        member.phone_number,
                        `Hello ${member.first_name}, we missed you at ${selectedSession?.title || "church service"}! Checking in to make sure you are doing well.`
                      );

                      return (
                        <div
                          key={member.id}
                          className="rounded-2xl border border-[var(--outline-variant)]/80 bg-[var(--surface-container-low)]/25 p-4 space-y-3.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar className="h-10 w-10 border">
                                <AvatarImage src={member.photo_url || ""} />
                                <AvatarFallback className="bg-rose-50 text-rose-700 font-bold text-xs">
                                  {member.first_name?.[0]}
                                  {member.last_name?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-bold text-foreground text-sm truncate">{fullName(member)}</p>
                                <p className="text-xs font-mono text-[var(--outline)]">
                                  {member.phone_number || "No phone number"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {member.phone_number && (
                                <Button
                                  asChild
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2.5 bg-white border-[var(--outline-variant)] text-xs"
                                >
                                  <a href={`tel:${member.phone_number}`}>
                                    <Phone className="h-3.5 w-3.5 mr-1 text-primary" />
                                    Call
                                  </a>
                                </Button>
                              )}
                              {waHref && (
                                <Button
                                  asChild
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2.5 border-emerald-600/30 bg-emerald-50/60 text-[#007D55] hover:bg-emerald-100 text-xs font-semibold"
                                >
                                  <a href={waHref} target="_blank" rel="noreferrer">
                                    WhatsApp
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="grid gap-2.5 sm:grid-cols-2">
                            <Select
                              value={draft.status}
                              onValueChange={(value) =>
                                setFollowUpDrafts((current) => ({
                                  ...current,
                                  [member.id]: { ...draft, status: value as FollowUpStatus },
                                }))
                              }
                            >
                              <SelectTrigger className="h-10 bg-white border-[var(--outline-variant)] text-xs font-semibold">
                                <SelectValue placeholder="Follow-up status" />
                              </SelectTrigger>
                              <SelectContent>
                                {followUpStatusOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value} className="text-xs">
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              placeholder="Assigned care worker..."
                              value={draft.assigned_to}
                              onChange={(e) =>
                                setFollowUpDrafts((current) => ({
                                  ...current,
                                  [member.id]: { ...draft, assigned_to: e.target.value },
                                }))
                              }
                              className="h-10 bg-white border-[var(--outline-variant)] text-xs"
                            />
                          </div>

                          <Textarea
                            placeholder="Add follow-up notes or prayer requests..."
                            value={draft.notes}
                            rows={2}
                            onChange={(e) =>
                              setFollowUpDrafts((current) => ({
                                ...current,
                                [member.id]: { ...draft, notes: e.target.value },
                              }))
                            }
                            className="bg-white border-[var(--outline-variant)] text-xs min-h-[60px]"
                          />

                          <div className="flex justify-end">
                            <Button size="sm" onClick={() => saveFollowUp(member.id)} className="h-9 text-xs font-bold">
                              <Check className="mr-1.5 h-3.5 w-3.5" />
                              Save Follow-Up
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: TRENDS & HISTORY */}
          <TabsContent value="trends" className="mt-0 space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="rounded-2xl border border-[var(--outline-variant)]/70 bg-white p-4 shadow-2xs">
                <p className="text-[11px] font-mono uppercase text-[var(--outline)]">Avg Attendance Rate</p>
                <p className="text-2xl font-extrabold text-primary mt-1">{reportSummary.averageAttendanceRate}%</p>
              </div>
              <div className="rounded-2xl border border-[var(--outline-variant)]/70 bg-white p-4 shadow-2xs">
                <p className="text-[11px] font-mono uppercase text-[var(--outline)]">Avg Present</p>
                <p className="text-2xl font-extrabold text-foreground mt-1">{reportSummary.averagePresent}</p>
              </div>
              <div className="rounded-2xl border border-[var(--outline-variant)]/70 bg-white p-4 shadow-2xs">
                <p className="text-[11px] font-mono uppercase text-[var(--outline)]">Active Members</p>
                <p className="text-2xl font-extrabold text-foreground mt-1">{reportSummary.activeMembers}</p>
              </div>
              <div className="rounded-2xl border border-[var(--outline-variant)]/70 bg-white p-4 shadow-2xs">
                <p className="text-[11px] font-mono uppercase text-[var(--outline)]">Total Sessions</p>
                <p className="text-2xl font-extrabold text-foreground mt-1">{reportSummary.totalSessions}</p>
              </div>
            </div>

            <Card className="shadow-xs border-[var(--outline-variant)]/70 bg-white rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-[var(--outline-variant)]/50 p-4 sm:p-5">
                <CardTitle className="text-base sm:text-lg font-bold">Session History & Turnout</CardTitle>
                <CardDescription className="text-xs">
                  Click any session below to load its roster.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-5">
                {loadingReports ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                  </div>
                ) : reports.length === 0 ? (
                  <p className="text-sm text-[var(--on-surface-variant)] text-center py-8">
                    No attendance trend data yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {reports.map((report) => {
                      const isSelected = report.id === selectedSessionId;
                      return (
                        <button
                          key={report.id}
                          type="button"
                          onClick={() => setSelectedSessionId(report.id)}
                          className={`text-left rounded-xl border p-4 transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                              : "border-[var(--outline-variant)]/70 bg-white hover:border-primary/40"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-foreground">{report.title}</p>
                              <p className="text-xs text-[var(--on-surface-variant)] mt-0.5">
                                {new Date(report.session_date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}{" "}
                                • <span className="capitalize">{report.service_type}</span>
                              </p>
                            </div>
                            <Badge variant="secondary" className="font-mono text-xs">
                              {report.attendanceRate}% ({report.present}/{report.expectedTotal})
                            </Badge>
                          </div>
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-emerald-600"
                              style={{ width: `${Math.min(100, report.attendanceRate)}%` }}
                            />
                          </div>
                          <div className="mt-2 flex gap-3 text-xs font-medium text-[var(--on-surface-variant)]">
                            <span className="text-emerald-700">Present: {report.present}</span>
                            <span className="text-rose-600">Absent: {report.absent}</span>
                            <span className="text-amber-600">Excused: {report.excused}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Session Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-md border-[var(--outline-variant)] bg-white p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="border-b border-[var(--outline-variant)]/60 bg-[var(--surface-container-low)]/40 px-5 py-4 text-left">
            <DialogTitle className="font-[var(--font-manrope)] text-lg font-bold text-foreground">
              Create Attendance Session
            </DialogTitle>
            <DialogDescription className="text-xs text-[var(--on-surface-variant)]">
              Start attendance tracking for a Sunday service, midweek meeting, or special event.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSession} className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--outline)]">Session Title</label>
              <Input
                value={newSession.title}
                onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                placeholder="e.g. Sunday Celebration Service"
                className="h-11 border-[var(--outline-variant)]"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--outline)]">Service Type</label>
                <Select
                  value={newSession.service_type}
                  onValueChange={(value) => setNewSession({ ...newSession, service_type: value as ServiceType })}
                >
                  <SelectTrigger className="h-11 border-[var(--outline-variant)]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--outline)]">Date</label>
                <Input
                  type="date"
                  value={newSession.session_date}
                  onChange={(e) => setNewSession({ ...newSession, session_date: e.target.value })}
                  className="h-11 border-[var(--outline-variant)]"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--outline)]">
                Notes (Optional)
              </label>
              <Textarea
                value={newSession.notes}
                onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
                placeholder="Speaker, sermon theme, or weather notes..."
                className="min-h-20 border-[var(--outline-variant)]"
              />
            </div>
            <DialogFooter className="pt-2 flex-row justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="font-bold">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarCheck className="mr-2 h-4 w-4" />}
                Start Session
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
