"use client";

import { useState, type ReactNode } from "react";
import {
  BookOpen,
  BriefcaseBusiness,
  ChevronDown,
  Clock3,
  GraduationCap,
  MapPin,
  Phone,
  User,
  Users,
  CheckCircle2,
  XCircle,
  Music,
  Video,
  UserPlus,
  Heart,
  Shield,
  type LucideIcon,
} from "lucide-react";

import { PERMISSION, fullMemberDetailRoles, type AdminRole, type Permission } from "@/lib/adminRoles";
import type { Member, MemberUnitAssignment } from "@/lib/types";
import type { UnitRole } from "@/components/units/types";
import { unitRoleLabels } from "@/components/units/types";
import { Badge } from "@/components/ui/badge";
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
    const formatted = dob.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return `${formatted} (${age})`;
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

function getUnitIcon(unitName: string): LucideIcon {
  const name = unitName.toLowerCase();
  if (name.includes("choir") || name.includes("music") || name.includes("worship")) return Music;
  if (name.includes("media") || name.includes("tech") || name.includes("sound")) return Video;
  if (name.includes("usher") || name.includes("greeter")) return UserPlus;
  if (name.includes("mentor") || name.includes("youth") || name.includes("care") || name.includes("welfare"))
    return Heart;
  if (name.includes("security") || name.includes("protocol")) return Shield;
  if (name.includes("teach") || name.includes("sunday school") || name.includes("bible")) return BookOpen;
  return Users;
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
      className="bg-(--surface-container-lowest) rounded-xl border border-(--outline-variant)/40 overflow-hidden shadow-xs"
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between font-sans font-semibold text-base md:text-lg cursor-pointer p-4 bg-(--surface-container-lowest) hover:bg-(--surface-container-low) transition-colors select-none text-left">
        <div className="flex items-center gap-3 text-foreground">
          <Icon className={`h-5 w-5 ${iconColorClass}`} />
          {title}
        </div>
        <ChevronDown
          className={`h-5 w-5 text-(--outline) transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t border-(--outline-variant)/40 bg-(--surface-container-lowest)">
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
  const lifeStage = normalizeLifeStage(member?.life_stage);
  const isActiveMember = isAvailableMember(member?.membership_status, member?.is_active);
  const membershipStatusLabel = getMembershipStatusLabel(member?.membership_status, member?.is_active);

  // Generate dynamic timeline items for Church History section
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
      assignedUnits.forEach(unit => {
        timelineItems.push({
          date: "Active",
          title: `Assigned to ${unit.name}`,
          description: `Serving as ${unitRoleLabels[unit.role as UnitRole] || unit.role}.`,
          iconColor: "bg-secondary",
        });
      });
    }
    if (member.updated_at && member.updated_at !== member.created_at) {
      timelineItems.push({
        date: new Date(member.updated_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        title: "Profile Updated",
        description: "Member details updated in database.",
        iconColor: "bg-(--outline)",
      });
    }
  }

  return (
    <Dialog open={!!member} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[60dvh] h-full w-full flex-col overflow-hidden border-none bg-(--surface-container-lowest) p-0 sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl rounded-2xl shadow-xl">
        {member ? (
          <div className="flex flex-col md:flex-row h-full overflow-hidden relative">
            {/* LEFT COLUMN: Profile Image (Approx 35%) */}
            <div className="w-full md:w-[35%] shrink-0 relative bg-(--surface-container-low) border-r border-(--outline-variant)/20 hidden md:block">
              <div className="h-full w-full">
                {member.photo_url ? (
                  <img
                    src={member.photo_url}
                    alt={getMemberName(member)}
                    className="h-full w-full object-cover object-center"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-primary to-blue-700 font-bold text-4xl text-white">
                    {member.first_name?.[0]}
                    {member.last_name?.[0]}
                  </div>
                )}
              </div>
              {/* Gradient overlay at bottom for quick stats */}
              <div className="absolute bottom-0 w-full bg-linear-to-t from-(--inverse-surface)/90 via-(--inverse-surface)/60 to-transparent p-6 pt-20">
                <div className="flex items-center gap-2 text-(--inverse-on-surface) mb-2">
                  {isActiveMember ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span className="font-mono text-xs uppercase tracking-wider font-semibold">
                        {membershipStatusLabel}
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-destructive" />
                      <span className="font-mono text-xs uppercase tracking-wider font-semibold">
                        {membershipStatusLabel}
                      </span>
                    </>
                  )}
                </div>
                {member.created_at && (
                  <p className="font-sans text-(--inverse-on-surface)/80 text-sm">
                    Joined{" "}
                    {new Date(member.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </p>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Details & Actions (Approx 65%) */}
            <div className="w-full md:w-[65%] flex flex-col h-full bg-(--surface-container-lowest) overflow-y-auto">
              {/* Mobile Image Header (Visible only on mobile) */}
              <div className="md:hidden h-64 w-full relative shrink-0">
                {member.photo_url ? (
                  <img
                    src={member.photo_url}
                    alt={getMemberName(member)}
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-primary to-blue-700 font-bold text-4xl text-white">
                    {member.first_name?.[0]}
                    {member.last_name?.[0]}
                  </div>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-(--surface-container-lowest) via-transparent to-transparent" />
              </div>

              <div className="p-6 md:p-10 flex-1 space-y-8">
                {/* Header Section */}
                <div>
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge className="bg-primary/10 text-primary border-none rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize shadow-none hover:bg-primary/15">
                      {getLifeStageLabel(lifeStage)}
                    </Badge>
                    {assignedUnits.map(unit => {
                      const UnitIcon = getUnitIcon(unit.name);
                      return (
                        <Badge
                          key={unit.id}
                          className="bg-(--surface-container-low) text-(--on-surface-variant) border border-(--outline-variant)/30 rounded-full px-2.5 py-0.5 text-xs font-medium shadow-none inline-flex items-center gap-1"
                        >
                          <UnitIcon className="h-3 w-3 text-primary" />
                          {unit.name} - {unitRoleLabels[unit.role as UnitRole] || unit.role}
                        </Badge>
                      );
                    })}
                  </div>

                  {/* Name & ID */}
                  <DialogTitle className="font-sans text-3xl font-bold leading-tight text-foreground">
                    {getMemberName(member)}
                  </DialogTitle>
                  <DialogDescription className="font-mono text-xs text-(--outline) mt-1">
                    ID: {member.id}
                  </DialogDescription>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pb-6 border-b border-(--outline-variant)/30">
                  {member.phone_number && (
                    <Button
                      onClick={() => window.open(`tel:${member.phone_number}`)}
                      className="grow sm:flex-none inline-flex items-center justify-center gap-2 px-5 h-10 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/95 transition-colors shadow-sm"
                    >
                      <Phone className="h-4 w-4" />
                      Call
                    </Button>
                  )}
                  {actions}
                </div>

                {/* Collapsible Sections */}
                <div className="space-y-4">
                  {/* Personal Information Collapsible */}
                  <CollapsibleSection title="Personal Information" icon={User} defaultOpen={true}>
                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6 text-sm">
                      <div>
                        <p className="font-mono text-[12px] uppercase tracking-wider text-(--outline) mb-0.5">
                          Phone Number
                        </p>
                        <p className="font-semibold text-foreground">{member.phone_number || "Not provided"}</p>
                      </div>
                      {canSeeOperational && (
                        <div>
                          <p className="font-mono text-[12px] uppercase tracking-wider text-(--outline) mb-0.5">
                            Email Address
                          </p>
                          <p className="font-semibold text-foreground break-all">{member.email || "Not provided"}</p>
                        </div>
                      )}
                      {canSeeOperational && (
                        <div>
                          <p className="font-mono text-[12px] uppercase tracking-wider text-(--outline) mb-0.5">
                            Date of Birth
                          </p>
                          <p className="font-semibold text-foreground">{formatBirthdayAndAge(member.date_of_birth)}</p>
                        </div>
                      )}
                      {canSeeFull && (
                        <div className="sm:col-span-2">
                          <p className="font-mono text-[12px] uppercase tracking-wider text-(--outline) mb-0.5">
                            Home Address
                          </p>
                          <p className="font-semibold text-foreground">{member.residence || "Not provided"}</p>
                        </div>
                      )}
                      {canSeeFull && (
                        <div>
                          <p className="font-mono text-[12px] uppercase tracking-wider text-(--outline) mb-0.5">
                            Cell Group
                          </p>
                          <p className="font-semibold text-foreground">{member.cell_group || "Not provided"}</p>
                        </div>
                      )}
                      {canSeeFull && (
                        <div>
                          <p className="font-mono text-[12px] uppercase tracking-wider text-(--outline) mb-0.5">
                            Emergency Contact
                          </p>
                          <p className="font-semibold text-foreground">
                            {member.guardian_name || "Not provided"}
                            {member.guardian_phone && ` (${member.guardian_phone})`}
                          </p>
                        </div>
                      )}
                    </div>
                  </CollapsibleSection>

                  {/* Student Profile Collapsible */}
                  {canSeeFull && usesStudentProfile(lifeStage) && (
                    <CollapsibleSection title="Student Profile" icon={GraduationCap} iconColorClass="text-secondary">
                      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6 text-sm">
                        <div>
                          <p className="font-mono text-[12px] uppercase tracking-wider text-(--outline) mb-0.5">
                            Institution
                          </p>
                          <p className="font-semibold text-foreground">{member.institution || "Not provided"}</p>
                        </div>
                        <div>
                          <p className="font-mono text-[12px] uppercase tracking-wider text-(--outline) mb-0.5">
                            Department & Level
                          </p>
                          <p className="font-semibold text-foreground">
                            {[member.department, member.academic_level || member.graduation_year]
                              .filter(Boolean)
                              .join(" - ") || "Not provided"}
                          </p>
                        </div>
                        <div>
                          <p className="font-mono text-[12px] uppercase tracking-wider text-(--outline) mb-0.5">
                            Student Status
                          </p>
                          <p className="font-semibold text-foreground">
                            {member.student_status ? getStudentStatusLabel(member.student_status) : "Not provided"}
                          </p>
                        </div>
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* NYSC Profile Collapsible */}
                  {canSeeFull && usesNyscProfile(lifeStage) && (
                    <CollapsibleSection title="NYSC Profile" icon={MapPin} iconColorClass="text-secondary">
                      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6 text-sm">
                        <div>
                          <p className="font-mono text-[12px] uppercase tracking-wider text-(--outline) mb-0.5">
                            NYSC State
                          </p>
                          <p className="font-semibold text-foreground">{member.nysc_state || "Not provided"}</p>
                        </div>
                        <div>
                          <p className="font-mono text-[12px] uppercase tracking-wider text-(--outline) mb-0.5">
                            Primary Place of Assignment (PPA)
                          </p>
                          <p className="font-semibold text-foreground">{member.nysc_ppa || "Not provided"}</p>
                        </div>
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* Professional Profile Collapsible */}
                  {canSeeFull && usesWorkProfile(lifeStage) && (
                    <CollapsibleSection
                      title="Professional Profile"
                      icon={BriefcaseBusiness}
                      iconColorClass="text-secondary"
                    >
                      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6 text-sm">
                        <div>
                          <p className="font-mono text-[12px] uppercase tracking-wider text-(--outline) mb-0.5">
                            Employment Details
                          </p>
                          <p className="font-semibold text-foreground">
                            {[member.job_title, member.employer, member.work_location].filter(Boolean).join(" - ") ||
                              "Not provided"}
                          </p>
                        </div>
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* Church History Collapsible */}
                  {canSeeOperational && timelineItems.length > 0 && (
                    <CollapsibleSection title="Church History" icon={Clock3} iconColorClass="text-primary">
                      <div className="p-5">
                        <div className="relative pl-6 border-l-2 border-(--surface-dim) space-y-6">
                          {timelineItems.map((item, idx) => (
                            <div key={idx} className="relative">
                              <div className="absolute left-[-31px] bg-(--surface-container-lowest) rounded-full p-1 border-2 border-(--surface-dim)">
                                <div className={`w-2.5 h-2.5 rounded-full ${item.iconColor}`} />
                              </div>
                              <p className="font-mono text-[12px] text-(--outline) mb-0.5 uppercase tracking-wider">
                                {item.date}
                              </p>
                              <p className="font-semibold text-foreground text-sm">{item.title}</p>
                              <p className="text-xs text-(--on-surface-variant) mt-1">{item.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* System Audit Details Collapsible */}
                  {canSeeFull && (
                    <CollapsibleSection
                      title="System Audit Details"
                      icon={Clock3}
                      iconColorClass="text-(--outline)"
                    >
                      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6 text-sm">
                        <div>
                          <p className="font-mono text-[12px] uppercase tracking-wider text-(--outline) mb-0.5">
                            Account Created
                          </p>
                          <p className="font-semibold text-foreground">{formatDateTime(member.created_at)}</p>
                        </div>
                        <div>
                          <p className="font-mono text-[12px] uppercase tracking-wider text-(--outline) mb-0.5">
                            Last Updated
                          </p>
                          <p className="font-semibold text-foreground">{formatDateTime(member.updated_at)}</p>
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
