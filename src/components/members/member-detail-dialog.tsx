"use client";

import { useState, type ReactNode } from "react";
import {
  BriefcaseBusiness,
  ChevronDown,
  Clock3,
  GraduationCap,
  MapPin,
  Phone,
  User,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Building2,
  Mail,
  Cake,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { PERMISSION, fullMemberDetailRoles, type AdminRole, type Permission } from "@/lib/adminRoles";
import type { Member, MemberUnitAssignment } from "@/lib/types";
import type { UnitRole } from "@/components/units/types";
import { unitRoleLabels } from "@/components/units/types";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  getLifeStageLabel,
  getMembershipStatusLabel,
  isAvailableMember,
  normalizeLifeStage,
  usesNyscProfile,
  usesStudentProfile,
  usesWorkProfile,
} from "@/lib/memberLifecycle";
import { getStudentStatusLabel } from "@/lib/studentStatus";
import { getUnitIcon } from "@/lib/utils";

type MemberDetailRecord = Partial<Member> & {
  id: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  unit_role?: UnitRole;
};

type MemberDetailViewer = {
  role?: AdminRole | null;
  permissions?: Permission[];
};

type DetailLevel = "basic" | "operational" | "full";

type MemberDetailDialogProps = {
  member: MemberDetailRecord | null;
  viewer?: MemberDetailViewer;
  unitName?: string;
  actions?: ReactNode;
  onOpenChange: (open: boolean) => void;
};

function getMemberName(member: MemberDetailRecord) {
  return [member.first_name, member.middle_name, member.last_name].filter(Boolean).join(" ");
}

function getDetailLevel(viewer?: MemberDetailViewer): DetailLevel {
  const role = viewer?.role || null;
  const permissions = viewer?.permissions || [];

  if (
    (role && fullMemberDetailRoles.includes(role as any)) ||
    permissions.includes(PERMISSION.MEMBERS_MANAGE) ||
    permissions.includes(PERMISSION.ADMINS_MANAGE)
  ) {
    return "full";
  }

  if (
    permissions.includes(PERMISSION.MEMBERS_VIEW) ||
    permissions.includes(PERMISSION.ATTENDANCE_VIEW) ||
    permissions.includes(PERMISSION.ATTENDANCE_MANAGE) ||
    permissions.includes(PERMISSION.FOLLOWUPS_MANAGE) ||
    permissions.includes(PERMISSION.OUTREACH_VIEW) ||
    permissions.includes(PERMISSION.UNITS_MANAGE)
  ) {
    return "operational";
  }

  return "basic";
}

function formatBirthdayAndAge(dobString?: string | null) {
  if (!dobString) return "Not provided";
  try {
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return dobString;
    return dob.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  } catch {
    return dobString;
  }
}

function formatDateTime(date?: string | null) {
  if (!date) return "Not provided";
  return new Date(date).toLocaleString();
}

function unitLabels(member: MemberDetailRecord, unitName?: string) {
  if (unitName && member.unit_role) return [{ id: "selected", name: unitName, role: member.unit_role }];
  return (member.units || []).map((unit: MemberUnitAssignment) => ({ id: unit.id, name: unit.name, role: unit.role }));
}

function CollapsibleSection({
  title,
  icon: Icon,
  iconColorClass = "text-primary",
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: LucideIcon;
  iconColorClass?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="bg-white rounded-xl border border-[var(--outline-variant)]/60 overflow-hidden shadow-2xs"
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between font-sans font-bold text-sm sm:text-base cursor-pointer px-4 py-3.5 bg-white hover:bg-[var(--surface-container-low)]/50 transition-colors select-none text-left">
        <div className="flex items-center gap-2.5 text-foreground">
          <Icon className={`h-4.5 w-4.5 ${iconColorClass}`} />
          {title}
        </div>
        <ChevronDown
          className={`h-4.5 w-4.5 text-[var(--outline)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t border-[var(--outline-variant)]/40 bg-white">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function MemberDetailDialog({ member, viewer, unitName, actions, onOpenChange }: MemberDetailDialogProps) {
  const detailLevel = getDetailLevel(viewer);
  const canSeeOperational = detailLevel === "operational" || detailLevel === "full";
  const canSeeFull = detailLevel === "full";

  const assignedUnits = member ? unitLabels(member, unitName) : [];
  const isWorker = assignedUnits.length > 0 || Boolean(member?.position && member.position.trim());
  const lifeStage = normalizeLifeStage(member?.life_stage);
  const isActiveMember = isAvailableMember(member?.membership_status, member?.is_active);
  const membershipStatusLabel = getMembershipStatusLabel(member?.membership_status, member?.is_active);

  const timelineItems = [];
  if (member) {
    if (member.created_at) {
      timelineItems.push({
        date: new Date(member.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        title: "Joined Membership Directory",
        description: "Profile registered in the church database.",
        iconColor: "bg-primary",
      });
    }
    if (assignedUnits.length > 0) {
      assignedUnits.forEach((unit) => {
        timelineItems.push({
          date: "Active",
          title: `Assigned to ${unit.name}`,
          description: `Serving as ${unitRoleLabels[unit.role as UnitRole] || unit.role}.`,
          iconColor: "bg-amber-500",
        });
      });
    }
    if (member.updated_at && member.updated_at !== member.created_at) {
      timelineItems.push({
        date: new Date(member.updated_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        title: "Profile Updated",
        description: "Member details updated in database.",
        iconColor: "bg-[var(--outline)]",
      });
    }
  }

  return (
    <Dialog open={!!member} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88dvh] w-[calc(100vw-1.25rem)] flex-col overflow-hidden border border-[var(--outline-variant)] bg-[var(--surface)] p-0 sm:max-w-xl md:max-w-3xl lg:max-w-4xl rounded-2xl shadow-2xl">
        {member ? (
          <div className="flex flex-col md:flex-row h-full max-h-[88dvh] overflow-hidden relative">
            {/* LEFT COLUMN (Desktop Only): Profile Image & Status */}
            <div className="hidden md:flex md:w-[34%] shrink-0 relative bg-[var(--surface-container-low)] border-r border-[var(--outline-variant)]/40 flex-col">
              <div className="flex-1 min-h-[360px] w-full relative">
                {member.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.photo_url}
                    alt={getMemberName(member)}
                    className="h-full w-full object-cover object-center"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-primary to-blue-800 font-bold text-5xl text-white">
                    {member.first_name?.[0]}
                    {member.last_name?.[0]}
                  </div>
                )}
                <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-slate-950/90 via-slate-950/55 to-transparent p-6 pt-20">
                  <div className="flex items-center gap-2 text-white mb-1.5">
                    {isActiveMember ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <span className="font-mono text-xs uppercase tracking-wider font-bold">
                          {membershipStatusLabel}
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-rose-400" />
                        <span className="font-mono text-xs uppercase tracking-wider font-bold">
                          {membershipStatusLabel}
                        </span>
                      </>
                    )}
                  </div>
                  {member.created_at && (
                    <p className="font-sans text-white/80 text-xs">
                      Member since{" "}
                      {new Date(member.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Scrollable Details & Actions */}
            <div className="w-full md:w-[66%] flex flex-col flex-1 min-h-0 bg-[var(--surface)] overflow-y-auto">
              <div className="p-4 sm:p-6 md:p-8 space-y-5">
                {/* Header Section (Responsive Mobile Avatar + Badges + Name) */}
                <div className="flex items-start gap-4 bg-white p-4 rounded-2xl border border-[var(--outline-variant)]/60 shadow-2xs">
                  <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-primary/20 shadow-xs shrink-0 md:hidden">
                    <AvatarImage src={member.photo_url || ""} alt={getMemberName(member)} className="object-cover" />
                    <AvatarFallback className="bg-primary text-white font-bold text-xl">
                      {member.first_name?.[0]}
                      {member.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      {isWorker ? (
                        <Badge className="bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5 text-[11px] font-bold shadow-none hover:bg-blue-50">
                          <ShieldCheck className="size-3 mr-1" />
                          Church Worker
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                          Congregation Member
                        </Badge>
                      )}

                      <Badge className="bg-primary/10 text-primary border-none rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize shadow-none">
                        {getLifeStageLabel(lifeStage)}
                      </Badge>

                      {member.position && (
                        <Badge className="bg-amber-50 text-amber-800 border border-amber-200 rounded-full px-2.5 py-0.5 text-[11px] font-bold shadow-none">
                          {member.position}
                        </Badge>
                      )}
                      {assignedUnits.map((unit) => {
                        const UnitIcon = getUnitIcon(unit.name);
                        return (
                          <Badge
                            key={unit.id}
                            className="bg-[var(--surface-container-low)] text-foreground border border-[var(--outline-variant)]/50 rounded-full px-2.5 py-0.5 text-[11px] font-medium shadow-none inline-flex items-center gap-1"
                          >
                            <UnitIcon className="h-3 w-3 text-primary" />
                            {unit.name} · {unitRoleLabels[unit.role as UnitRole] || unit.role}
                          </Badge>
                        );
                      })}
                    </div>

                    <DialogTitle className="font-[var(--font-manrope)] text-xl sm:text-2xl font-extrabold leading-tight text-foreground">
                      {getMemberName(member)}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-[var(--on-surface-variant)] mt-1 flex flex-wrap items-center gap-2">
                      <span>{membershipStatusLabel}</span>
                      {member.date_of_birth && (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                            <Cake className="size-3" />
                            {formatBirthdayAndAge(member.date_of_birth)}
                          </span>
                        </>
                      )}
                    </DialogDescription>
                  </div>
                </div>

                {/* Action Buttons Bar */}
                <div className="flex flex-wrap items-center gap-2">
                  {member.phone_number && (
                    <Button
                      onClick={() => window.open(`tel:${member.phone_number}`)}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 h-10 bg-primary text-primary-foreground rounded-xl font-bold text-xs sm:text-sm hover:bg-primary/95 shadow-2xs"
                    >
                      <Phone className="h-4 w-4" />
                      Call Member
                    </Button>
                  )}
                  {actions}
                </div>

                {/* Collapsible Sections */}
                <div className="space-y-3">
                  {/* Personal Information */}
                  <CollapsibleSection title="Contact & Personal Details" icon={User} defaultOpen={true}>
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--outline)] mb-0.5">
                          Primary Phone
                        </p>
                        <p className="font-bold text-foreground font-mono">{member.phone_number || "Not provided"}</p>
                      </div>
                      {member.alternate_phone && (
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--outline)] mb-0.5">
                            Alternate Phone
                          </p>
                          <p className="font-bold text-foreground font-mono">{member.alternate_phone}</p>
                        </div>
                      )}
                      {canSeeOperational && (
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--outline)] mb-0.5">
                            Email Address
                          </p>
                          <p className="font-semibold text-foreground break-all">{member.email || "Not provided"}</p>
                        </div>
                      )}
                      {canSeeOperational && (
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--outline)] mb-0.5">
                            Date of Birth
                          </p>
                          <p className="font-semibold text-foreground">{formatBirthdayAndAge(member.date_of_birth)}</p>
                        </div>
                      )}
                      {canSeeFull && (
                        <div className="sm:col-span-2">
                          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--outline)] mb-0.5">
                            Residence / Hostel Address
                          </p>
                          <p className="font-semibold text-foreground">{member.residence || "Not provided"}</p>
                        </div>
                      )}
                      {canSeeFull && (
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--outline)] mb-0.5">
                            Cell / Small Group
                          </p>
                          <p className="font-semibold text-foreground">{member.cell_group || "Not provided"}</p>
                        </div>
                      )}
                      {canSeeFull && (
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--outline)] mb-0.5">
                            Emergency / Guardian Contact
                          </p>
                          <p className="font-semibold text-foreground">
                            {member.guardian_name || "Not provided"}
                            {member.guardian_phone && ` (${member.guardian_phone})`}
                          </p>
                        </div>
                      )}
                      {canSeeFull && member.skills_interests && (
                        <div className="sm:col-span-2">
                          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--outline)] mb-0.5">
                            Skills & Interests
                          </p>
                          <p className="font-semibold text-foreground">{member.skills_interests}</p>
                        </div>
                      )}
                    </div>
                  </CollapsibleSection>

                  {/* Student Profile */}
                  {canSeeFull && usesStudentProfile(lifeStage) && (
                    <CollapsibleSection
                      title="Academic & Student Profile"
                      icon={GraduationCap}
                      iconColorClass="text-purple-600"
                      defaultOpen={true}
                    >
                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--outline)] mb-0.5">
                            Institution
                          </p>
                          <p className="font-semibold text-foreground">{member.institution || "Not provided"}</p>
                        </div>
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--outline)] mb-0.5">
                            Department & Level
                          </p>
                          <p className="font-semibold text-foreground">
                            {[member.department, member.academic_level || member.graduation_year]
                              .filter(Boolean)
                              .join(" • ") || "Not provided"}
                          </p>
                        </div>
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--outline)] mb-0.5">
                            Student Status
                          </p>
                          <p className="font-semibold text-foreground">
                            {member.student_status ? getStudentStatusLabel(member.student_status) : "Not provided"}
                          </p>
                        </div>
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* NYSC Profile */}
                  {canSeeFull && usesNyscProfile(lifeStage) && (
                    <CollapsibleSection
                      title="NYSC Profile"
                      icon={MapPin}
                      iconColorClass="text-amber-600"
                      defaultOpen={true}
                    >
                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--outline)] mb-0.5">
                            NYSC State
                          </p>
                          <p className="font-semibold text-foreground">{member.nysc_state || "Not provided"}</p>
                        </div>
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--outline)] mb-0.5">
                            Primary Place of Assignment (PPA)
                          </p>
                          <p className="font-semibold text-foreground">{member.nysc_ppa || "Not provided"}</p>
                        </div>
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* Professional Profile */}
                  {canSeeFull && usesWorkProfile(lifeStage) && (
                    <CollapsibleSection
                      title="Professional & Career Profile"
                      icon={BriefcaseBusiness}
                      iconColorClass="text-emerald-600"
                      defaultOpen={true}
                    >
                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--outline)] mb-0.5">
                            Job Title & Employer
                          </p>
                          <p className="font-semibold text-foreground">
                            {[member.job_title, member.employer].filter(Boolean).join(" at ") || "Not provided"}
                          </p>
                        </div>
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--outline)] mb-0.5">
                            Work Location
                          </p>
                          <p className="font-semibold text-foreground">{member.work_location || "Not provided"}</p>
                        </div>
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* Church History */}
                  {canSeeOperational && timelineItems.length > 0 && (
                    <CollapsibleSection title="Church History & Audit" icon={Clock3} iconColorClass="text-primary">
                      <div className="p-4">
                        <div className="relative pl-5 border-l-2 border-[var(--outline-variant)] space-y-4">
                          {timelineItems.map((item, idx) => (
                            <div key={idx} className="relative">
                              <div className="absolute left-[-26px] bg-white rounded-full p-1 border-2 border-[var(--outline-variant)]">
                                <div className={`w-2 h-2 rounded-full ${item.iconColor}`} />
                              </div>
                              <p className="font-mono text-[10px] text-[var(--outline)] uppercase tracking-wider">
                                {item.date}
                              </p>
                              <p className="font-bold text-foreground text-xs sm:text-sm">{item.title}</p>
                              <p className="text-xs text-[var(--on-surface-variant)] mt-0.5">{item.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CollapsibleSection>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
