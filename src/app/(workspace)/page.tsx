"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Member, ChurchUnit } from "@/lib/types";
import {
  Gift,
  Users,
  CalendarCheck,
  Building2,
  Phone,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useWorkspace } from "@/components/workspace-provider";
import { MemberDetailDialog } from "@/components/members/member-detail-dialog";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AttendanceSessionReport = {
  id: string;
  title: string;
  service_type: string;
  session_date: string;
  present: number;
  absent: number;
  excused: number;
  expectedTotal: number;
  attendanceRate: number;
};

export default function Dashboard() {
  const { displayName, role, permissions, churchIdentity } = useWorkspace();

  const [todayBirthdays, setTodayBirthdays] = useState<Member[]>([]);
  const [weekBirthdays, setWeekBirthdays] = useState<Member[]>([]);
  const [memberStats, setMemberStats] = useState({
    total: 0,
    workers: 0,
  });
  const [attendanceSummary, setAttendanceSummary] = useState({
    averageAttendanceRate: 0,
    totalSessions: 0,
  });
  const [recentSessions, setRecentSessions] = useState<AttendanceSessionReport[]>([]);
  const [units, setUnits] = useState<ChurchUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingMember, setViewingMember] = useState<Member | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/birthdays/today").then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch("/api/birthdays/week").then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch("/api/members?limit=1").then((r) => (r.ok ? r.json() : {})).catch(() => ({})),
      fetch("/api/attendance/reports").then((r) => (r.ok ? r.json() : {})).catch(() => ({})),
      fetch("/api/units").then((r) => (r.ok ? r.json() : { data: [] })).catch(() => ({ data: [] })),
    ]).then(([birthdays, week, membersData, attendanceData, unitsData]: any[]) => {
      setTodayBirthdays(Array.isArray(birthdays) ? birthdays : []);
      setWeekBirthdays(Array.isArray(week) ? week : []);

      setMemberStats({
        total: membersData?.stats?.total || membersData?.total || 0,
        workers: membersData?.stats?.workers || 0,
      });

      if (attendanceData?.summary) {
        setAttendanceSummary({
          averageAttendanceRate: attendanceData.summary.averageAttendanceRate || 0,
          totalSessions: attendanceData.summary.totalSessions || 0,
        });
      }
      if (Array.isArray(attendanceData?.sessions)) {
        setRecentSessions(attendanceData.sessions.slice(0, 4));
      }

      setUnits(Array.isArray(unitsData?.data) ? unitsData.data : []);
      setLoading(false);
    });
  }, []);

  const latestSession = recentSessions[0] || null;

  return (
    <div className="flex-1 w-full">
      <PageHeader
        eyebrow={churchIdentity.church_name || "Church Portal"}
        title={`Welcome, ${displayName.split(" ")[0]}`}
        description={new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
        actions={
          <Button asChild size="sm" className="h-10 font-semibold">
            <Link href="/attendance">
              <CalendarCheck className="mr-1.5 h-4 w-4" />
              Mark Attendance
            </Link>
          </Button>
        }
      />

      <div className="space-y-6 p-4 md:space-y-8 md:p-8">
        {/* 4 Calm KPI Cards (2x2 on Mobile, 4-Col on Desktop) */}
        <div className="grid grid-cols-2 gap-3.5 sm:gap-5 lg:grid-cols-4">
          <Link
            href="/members"
            className="group flex flex-col justify-between rounded-xl border border-[var(--outline-variant)]/70 bg-white p-4 sm:p-5 shadow-2xs transition-colors hover:border-primary/40"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-[var(--on-surface-variant)]">Total Members</span>
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Users className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {loading ? <Skeleton className="h-8 w-16" /> : memberStats.total.toLocaleString()}
              </div>
              <p className="mt-1 text-xs text-[var(--outline)] truncate">
                {memberStats.workers} serving in units
              </p>
            </div>
          </Link>

          <Link
            href="/attendance"
            className="group flex flex-col justify-between rounded-xl border border-[var(--outline-variant)]/70 bg-white p-4 sm:p-5 shadow-2xs transition-colors hover:border-primary/40"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-[var(--on-surface-variant)]">Last Attendance</span>
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                <TrendingUp className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  `${latestSession ? latestSession.attendanceRate : attendanceSummary.averageAttendanceRate}%`
                )}
              </div>
              <p className="mt-1 text-xs text-[var(--outline)] truncate">
                {latestSession
                  ? `${latestSession.present} present · ${latestSession.title}`
                  : `${attendanceSummary.totalSessions} sessions logged`}
              </p>
            </div>
          </Link>

          <Link
            href="/units"
            className="group flex flex-col justify-between rounded-xl border border-[var(--outline-variant)]/70 bg-white p-4 sm:p-5 shadow-2xs transition-colors hover:border-primary/40"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-[var(--on-surface-variant)]">Ministry Units</span>
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {loading ? <Skeleton className="h-8 w-12" /> : units.length}
              </div>
              <p className="mt-1 text-xs text-[var(--outline)] truncate">
                Active church departments
              </p>
            </div>
          </Link>

          <Link
            href="/designs"
            className="group flex flex-col justify-between rounded-xl border border-[var(--outline-variant)]/70 bg-white p-4 sm:p-5 shadow-2xs transition-colors hover:border-primary/40"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-[var(--on-surface-variant)]">Birthdays Today</span>
              <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600">
                <Gift className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {loading ? <Skeleton className="h-8 w-12" /> : todayBirthdays.length}
              </div>
              <p className="mt-1 text-xs text-[var(--outline)] truncate">
                {weekBirthdays.length} coming up this week
              </p>
            </div>
          </Link>
        </div>

        {/* Focused 2-Column Content */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-12 items-start">
          {/* Left Column (7 cols): Recent Service Attendance */}
          <Card className="lg:col-span-7 border-[var(--outline-variant)]/70 bg-white">
            <CardHeader className="border-b border-[var(--outline-variant)]/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  Recent Service Attendance
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Turnout across your latest recorded services
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs text-primary font-semibold h-8 px-2.5">
                <Link href="/attendance">
                  View All
                  <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                </div>
              ) : recentSessions.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-[var(--on-surface-variant)]">No attendance sessions recorded yet.</p>
                  <Button asChild variant="outline" size="sm" className="mt-3">
                    <Link href="/attendance">Record First Service</Link>
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-[var(--outline-variant)]/40 -my-2">
                  {recentSessions.map((session) => (
                    <Link
                      key={session.id}
                      href="/attendance"
                      className="block py-3.5 first:pt-1 last:pb-1 transition-colors hover:opacity-85"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{session.title}</p>
                          <p className="text-xs text-[var(--outline)] mt-0.5">
                            {new Date(session.session_date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}{" "}
                            · {session.present} of {session.expectedTotal} present
                            {session.absent > 0 ? ` · ${session.absent} absent` : ""}
                          </p>
                        </div>
                        <span className="font-mono text-sm font-bold text-foreground shrink-0">
                          {session.attendanceRate}%
                        </span>
                      </div>
                      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[var(--surface-container-low)]">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${Math.min(100, session.attendanceRate)}%` }}
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Column (5 cols): Birthdays Today & This Week */}
          <Card className="lg:col-span-5 border-[var(--outline-variant)]/70 bg-white">
            <Tabs defaultValue="today" className="flex flex-col">
              <CardHeader className="border-b border-[var(--outline-variant)]/50">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">
                      Birthdays
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Upcoming celebrations
                    </CardDescription>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="text-xs text-primary font-semibold h-8 px-2.5">
                    <Link href="/designs">
                      Card Studio
                      <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
                <TabsList className="mt-3 grid w-full grid-cols-2">
                  <TabsTrigger value="today" className="text-xs">
                    Today ({todayBirthdays.length})
                  </TabsTrigger>
                  <TabsTrigger value="week" className="text-xs">
                    This Week ({weekBirthdays.length})
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 py-2">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1.5 flex-1">
                          <Skeleton className="h-3.5 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <TabsContent value="today" className="mt-0">
                      {todayBirthdays.length === 0 ? (
                        <div className="py-10 text-center">
                          <p className="text-sm font-medium text-foreground">No birthdays today</p>
                          <p className="text-xs text-[var(--outline)] mt-1">
                            Switch to &ldquo;This Week&rdquo; to see upcoming celebrants.
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-[var(--outline-variant)]/40 -my-2">
                          {todayBirthdays.map((member) => (
                            <CelebrantRow
                              key={member.id}
                              member={member}
                              onSelect={setViewingMember}
                            />
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="week" className="mt-0">
                      {weekBirthdays.length === 0 ? (
                        <div className="py-10 text-center">
                          <p className="text-sm font-medium text-foreground">No birthdays this week</p>
                          <p className="text-xs text-[var(--outline)] mt-1">
                            No members are celebrating in the next 7 days.
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-[var(--outline-variant)]/40 -my-2">
                          {weekBirthdays.map((member) => (
                            <CelebrantRow
                              key={member.id}
                              member={member}
                              onSelect={setViewingMember}
                            />
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </>
                )}
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>

      <MemberDetailDialog
        member={viewingMember}
        viewer={{ role, permissions }}
        onOpenChange={(open) => {
          if (!open) setViewingMember(null);
        }}
        actions={
          viewingMember && getWhatsAppHref(viewingMember.phone_number) ? (
            <Button
              asChild
              variant="outline"
              aria-label="Open WhatsApp"
              className="border-[var(--outline-variant)] text-[#007D55] hover:bg-[var(--surface-container)] hover:text-[#006242]"
            >
              <a
                href={getWhatsAppHref(viewingMember.phone_number, getWhatsAppMessage(viewingMember)) || "#"}
                target="_blank"
                rel="noreferrer"
              >
                <WhatsAppIcon className="h-4 w-4 mr-2" />
                WhatsApp
              </a>
            </Button>
          ) : null
        }
      />
    </div>
  );
}

function CelebrantRow({
  member,
  onSelect,
}: {
  member: Member;
  onSelect: (m: Member) => void;
}) {
  const primaryUnit = member.units?.[0]?.name;
  const roleOrUnit = member.position || primaryUnit || "Member";
  const bdayDate = new Date(member.date_of_birth).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const waHref = getWhatsAppHref(
    member.phone_number,
    `Happy Birthday ${member.first_name}! 🎉 May God bless your new age!`
  );

  return (
    <div className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-1">
      <button
        type="button"
        onClick={() => onSelect(member)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left group"
      >
        <Avatar className="h-10 w-10 border border-[var(--outline-variant)]/60 shrink-0">
          <AvatarImage src={member.photo_url || ""} alt={member.first_name} className="object-cover" />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
            {member.first_name?.[0]}
            {member.last_name?.[0]}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {member.first_name} {member.last_name}
          </p>
          <p className="text-xs text-[var(--outline)] truncate mt-0.5">
            {roleOrUnit} · <span className="font-medium text-amber-700">{bdayDate}</span>
          </p>
        </div>
      </button>

      <div className="flex items-center gap-1.5 shrink-0">
        {member.phone_number && (
          <a
            href={`tel:${member.phone_number}`}
            className="flex size-8 items-center justify-center rounded-lg border border-[var(--outline-variant)]/60 text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-low)] hover:text-primary transition-colors"
            title="Call"
          >
            <Phone className="size-3.5" />
          </a>
        )}
        {waHref && (
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            className="flex size-8 items-center justify-center rounded-lg border border-emerald-600/20 bg-emerald-50/50 text-[#007D55] hover:bg-emerald-100 transition-colors"
            title="Send WhatsApp greeting"
          >
            <WhatsAppIcon className="size-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

function getWhatsAppHref(phone?: string | null, text?: string) {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return null;
  const international = digits.startsWith("0") ? `234${digits.slice(1)}` : digits;
  const base = `https://wa.me/${international}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

function getWhatsAppMessage(member: Member) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `Hello ${member.first_name}, please review and update your profile details on the church portal here: ${origin}/profile`;
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91a9.86 9.86 0 0 0-2.91-7.01ZM12.05 20.15h-.01a8.25 8.25 0 0 1-4.21-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.55 3.7-8.25 8.26-8.25 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.42 5.83c0 4.55-3.7 8.24-8.23 8.24Zm4.52-6.17c-.25-.13-1.47-.73-1.7-.81-.23-.08-.39-.13-.56.13-.16.25-.64.81-.78.98-.14.16-.29.18-.54.06-.25-.13-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.14.16-.25.25-.42.08-.16.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.66.31-.23.25-.86.84-.86 2.05s.88 2.38 1 2.54c.13.16 1.73 2.64 4.19 3.7.59.25 1.04.4 1.4.52.59.19 1.12.16 1.54.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z" />
    </svg>
  );
}
