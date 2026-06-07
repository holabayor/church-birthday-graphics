"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarCheck, Check, Clock, Loader2, Phone, Search, UserCheck, UserX } from "lucide-react";
import { AttendanceSession, Member } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

type AttendanceStatus = "present" | "absent" | "excused";
type FollowUpStatus = "pending" | "contacted" | "visited" | "resolved" | "no_response";

type RosterMember = Pick<Member, "id" | "first_name" | "middle_name" | "last_name" | "phone_number" | "photo_url" | "member_type"> & {
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

const fullName = (member: RosterMember) =>
  [member.first_name, member.middle_name, member.last_name].filter(Boolean).join(" ");

export default function AttendancePage() {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [roster, setRoster] = useState<RosterMember[]>([]);
  const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0, excused: 0 });
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [loadingReports, setLoadingReports] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [reports, setReports] = useState<AttendanceReport[]>([]);
  const [reportSummary, setReportSummary] = useState({
    activeMembers: 0,
    averageAttendanceRate: 0,
    averagePresent: 0,
    totalSessions: 0,
  });
  const [followUpDrafts, setFollowUpDrafts] = useState<Record<string, { status: FollowUpStatus; notes: string; assigned_to: string }>>({});
  const [newSession, setNewSession] = useState({
    title: "Sunday Service",
    service_type: "service",
    session_date: today,
    notes: "",
  });

  const selectedSession = sessions.find(session => session.id === selectedSessionId) || null;

  const filteredRoster = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return roster;
    return roster.filter(member =>
      fullName(member).toLowerCase().includes(query) ||
      member.phone_number?.toLowerCase().includes(query) ||
      member.member_type?.toLowerCase().includes(query)
    );
  }, [roster, search]);

  const absenteeRoster = filteredRoster.filter(member => member.attendance.status === "absent");

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

  const fetchRoster = async (sessionId: string) => {
    if (!sessionId) return;
    setLoadingRoster(true);
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
              status: member.follow_up?.status || "pending",
              notes: member.follow_up?.notes || "",
              assigned_to: member.follow_up?.assigned_to || "",
            },
          ])
        )
      );
    } catch {
      toast.error("Failed to load attendance roster");
    } finally {
      setLoadingRoster(false);
    }
  };

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const res = await fetch("/api/attendance/reports");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setReports(Array.isArray(data.sessions) ? data.sessions : []);
      setReportSummary(data.summary || {
        activeMembers: 0,
        averageAttendanceRate: 0,
        averagePresent: 0,
        totalSessions: 0,
      });
    } catch {
      toast.error("Failed to load attendance reports");
    } finally {
      setLoadingReports(false);
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
      setSessions(current => [data, ...current]);
      fetchReports();
    } catch {
      toast.error("Failed to create attendance session");
    } finally {
      setSaving(false);
    }
  };

  const markAttendance = async (memberId: string, status: AttendanceStatus) => {
    if (!selectedSessionId) return;

    const previousRoster = roster;
    setRoster(current =>
      current.map(member =>
        member.id === memberId ? { ...member, attendance: { ...member.attendance, status } } : member
      )
    );

    try {
      const res = await fetch("/api/attendance/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: selectedSessionId, member_id: memberId, status }),
      });
      if (!res.ok) throw new Error();
      fetchRoster(selectedSessionId);
      fetchReports();
    } catch {
      setRoster(previousRoster);
      toast.error("Failed to update attendance");
    }
  };

  const saveFollowUp = async (memberId: string) => {
    if (!selectedSessionId) return;
    const draft = followUpDrafts[memberId] || { status: "pending", notes: "", assigned_to: "" };

    try {
      const res = await fetch("/api/attendance/followups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: selectedSessionId, member_id: memberId, ...draft }),
      });
      if (!res.ok) throw new Error();
      toast.success("Follow-up saved");
      fetchRoster(selectedSessionId);
    } catch {
      toast.error("Failed to save follow-up");
    }
  };

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 w-full">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CalendarCheck className="h-8 w-8 text-primary" />
            Attendance
          </h1>
          <p className="text-muted-foreground font-medium">
            Track service attendance and manage absentee follow-up.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Create Session</CardTitle>
              <CardDescription>Start attendance for a service, meeting, or event.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateSession} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">Title</label>
                  <Input
                    value={newSession.title}
                    onChange={e => setNewSession({ ...newSession, title: e.target.value })}
                    placeholder="Sunday Service"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Type</label>
                    <Select
                      value={newSession.service_type}
                      onValueChange={value => setNewSession({ ...newSession, service_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="service">Service</SelectItem>
                        <SelectItem value="midweek">Midweek</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Date</label>
                    <Input
                      type="date"
                      value={newSession.session_date}
                      onChange={e => setNewSession({ ...newSession, session_date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">Notes</label>
                  <Textarea
                    value={newSession.notes}
                    onChange={e => setNewSession({ ...newSession, notes: e.target.value })}
                    placeholder="Optional"
                    className="min-h-20"
                  />
                </div>
                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarCheck className="mr-2 h-4 w-4" />}
                  Create Session
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Sessions</CardTitle>
              <CardDescription>Select a recent session to mark attendance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingSessions ? (
                <>
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </>
              ) : sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No attendance sessions yet.</p>
              ) : (
                <div className="space-y-2">
                  {sessions.map(session => (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => setSelectedSessionId(session.id)}
                      className={`w-full rounded-lg border px-3 py-3 text-left transition-colors ${
                        selectedSessionId === session.id
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-200 hover:bg-zinc-50"
                      }`}
                    >
                      <span className="block text-sm font-semibold">{session.title}</span>
                      <span className={`block text-xs ${selectedSessionId === session.id ? "text-zinc-300" : "text-muted-foreground"}`}>
                        {new Date(session.session_date).toLocaleDateString()} - {session.service_type}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Attendance Trends</CardTitle>
              <CardDescription>Recent service attendance across the latest sessions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingReports ? (
                <>
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-zinc-200 p-3">
                      <p className="text-xs font-medium uppercase text-muted-foreground">Avg Rate</p>
                      <p className="text-2xl font-bold">{reportSummary.averageAttendanceRate}%</p>
                    </div>
                    <div className="rounded-lg border border-zinc-200 p-3">
                      <p className="text-xs font-medium uppercase text-muted-foreground">Avg Present</p>
                      <p className="text-2xl font-bold">{reportSummary.averagePresent}</p>
                    </div>
                    <div className="rounded-lg border border-zinc-200 p-3">
                      <p className="text-xs font-medium uppercase text-muted-foreground">Active Members</p>
                      <p className="text-2xl font-bold">{reportSummary.activeMembers}</p>
                    </div>
                    <div className="rounded-lg border border-zinc-200 p-3">
                      <p className="text-xs font-medium uppercase text-muted-foreground">Sessions</p>
                      <p className="text-2xl font-bold">{reportSummary.totalSessions}</p>
                    </div>
                  </div>

                  {reports.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No attendance trend data yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {reports.slice(0, 6).map(report => (
                        <div key={report.id} className="rounded-lg border border-zinc-200 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-zinc-900">{report.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(report.session_date).toLocaleDateString()} - {report.attendanceRate}% attendance
                              </p>
                            </div>
                            <Badge variant="secondary">{report.present}/{report.expectedTotal}</Badge>
                          </div>
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100">
                            <div
                              className="h-full rounded-full bg-emerald-600"
                              style={{ width: `${Math.min(100, report.attendanceRate)}%` }}
                            />
                          </div>
                          <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                            <span>Present {report.present}</span>
                            <span>Absent {report.absent}</span>
                            <span>Excused {report.excused}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{summary.total}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase text-muted-foreground">Present</p>
                <p className="text-2xl font-bold text-emerald-700">{summary.present}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase text-muted-foreground">Absent</p>
                <p className="text-2xl font-bold text-rose-700">{summary.absent}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase text-muted-foreground">Excused</p>
                <p className="text-2xl font-bold text-amber-700">{summary.excused}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>{selectedSession ? selectedSession.title : "Attendance Roster"}</CardTitle>
                <CardDescription>
                  {selectedSession
                    ? `${new Date(selectedSession.session_date).toLocaleDateString()} - ${selectedSession.service_type}`
                    : "Create or select a session to begin."}
                </CardDescription>
              </div>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search roster..."
                  className="pl-9"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {loadingRoster ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : !selectedSessionId ? (
                <div className="py-12 text-center text-sm text-muted-foreground">No session selected.</div>
              ) : filteredRoster.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">No members found.</div>
              ) : (
                <div className="space-y-3">
                  {filteredRoster.map(member => (
                    <div key={member.id} className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="h-10 w-10 border">
                          <AvatarImage src={member.photo_url || ""} />
                          <AvatarFallback>{member.first_name[0]}{member.last_name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-900 truncate">{fullName(member)}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {member.phone_number && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {member.phone_number}
                              </span>
                            )}
                            <Badge variant="outline" className="capitalize">{member.member_type || "member"}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant={member.attendance.status === "present" ? "default" : "outline"}
                          onClick={() => markAttendance(member.id, "present")}
                        >
                          <UserCheck className="mr-2 h-4 w-4" />
                          Present
                        </Button>
                        <Button
                          size="sm"
                          variant={member.attendance.status === "absent" ? "destructive" : "outline"}
                          onClick={() => markAttendance(member.id, "absent")}
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          Absent
                        </Button>
                        <Button
                          size="sm"
                          variant={member.attendance.status === "excused" ? "secondary" : "outline"}
                          onClick={() => markAttendance(member.id, "excused")}
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          Excused
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Absentee Follow-Up</CardTitle>
              <CardDescription>Record who has been contacted and what needs attention.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRoster ? (
                <Skeleton className="h-24 w-full" />
              ) : absenteeRoster.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No absentees in the current filter.
                </div>
              ) : (
                <div className="space-y-4">
                  {absenteeRoster.map(member => {
                    const draft = followUpDrafts[member.id] || { status: "pending", notes: "", assigned_to: "" };
                    return (
                      <div key={member.id} className="rounded-lg border border-zinc-200 p-4 space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-zinc-900">{fullName(member)}</p>
                            <p className="text-xs text-muted-foreground">{member.phone_number || "No phone number"}</p>
                          </div>
                          <Badge variant="destructive">Absent</Badge>
                        </div>
                        <div className="grid gap-3 md:grid-cols-[180px_1fr]">
                          <Select
                            value={draft.status}
                            onValueChange={value =>
                              setFollowUpDrafts(current => ({
                                ...current,
                                [member.id]: { ...draft, status: value as FollowUpStatus },
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Follow-up status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="contacted">Contacted</SelectItem>
                              <SelectItem value="visited">Visited</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="no_response">No Response</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Assigned to"
                            value={draft.assigned_to}
                            onChange={e =>
                              setFollowUpDrafts(current => ({
                                ...current,
                                [member.id]: { ...draft, assigned_to: e.target.value },
                              }))
                            }
                          />
                        </div>
                        <Textarea
                          placeholder="Follow-up notes..."
                          value={draft.notes}
                          onChange={e =>
                            setFollowUpDrafts(current => ({
                              ...current,
                              [member.id]: { ...draft, notes: e.target.value },
                            }))
                          }
                        />
                        <div className="flex justify-end">
                          <Button size="sm" onClick={() => saveFollowUp(member.id)}>
                            <Check className="mr-2 h-4 w-4" />
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
        </div>
      </div>
    </div>
  );
}
