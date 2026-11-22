"use client";

import { Phone } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UnitRoleMenu } from "./unit-role-menu";
import type { UnitMember, UnitRole } from "./types";
import { unitRoleLabels } from "./types";

interface MobileRosterListProps {
  roster: UnitMember[];
  canManageMembers: boolean;
  saving: boolean;
  onViewDetails: (member: UnitMember) => void;
  onChangeRole: (member: UnitMember, role: UnitRole) => void;
}

function getMemberName(member: UnitMember) {
  return [member.first_name, member.middle_name, member.last_name].filter(Boolean).join(" ");
}

function getInitials(member: UnitMember) {
  return `${member.first_name?.[0] || ""}${member.last_name?.[0] || ""}` || "M";
}

function getWhatsAppHref(phone?: string | null) {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return null;
  const international = digits.startsWith("0") ? `234${digits.slice(1)}` : digits;
  return `https://wa.me/${international}`;
}

export function MobileRosterList({
  roster,
  canManageMembers,
  saving,
  onViewDetails,
  onChangeRole,
}: MobileRosterListProps) {
  return (
    <div className="divide-y divide-[var(--outline-variant)]/50 md:hidden">
      {roster.map((member) => {
        const waHref = getWhatsAppHref(member.phone_number);
        const isLeader = member.unit_role === "head" || member.unit_role === "assistant";

        return (
          <div key={member.id} className="flex items-center justify-between gap-2.5 px-4 py-3.5 bg-white">
            <button
              type="button"
              onClick={() => onViewDetails(member)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left focus:outline-none"
            >
              <Avatar className="h-10 w-10 border border-[var(--outline-variant)]/60 bg-[var(--surface-container-low)] shrink-0">
                <AvatarImage src={member.photo_url || ""} className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                  {getInitials(member)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate font-semibold text-foreground text-sm">{getMemberName(member)}</p>
                  {isLeader && (
                    <span className="shrink-0 rounded-md bg-primary/10 text-[10px] font-semibold text-primary px-1.5 py-0.5">
                      {unitRoleLabels[member.unit_role]}
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-[var(--on-surface-variant)] mt-0.5">
                  {unitRoleLabels[member.unit_role]} · {member.phone_number || member.email || "No phone"}
                </p>
              </div>
            </button>

            <div className="flex items-center gap-1.5 shrink-0">
              {member.phone_number && (
                <a
                  href={`tel:${member.phone_number}`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--outline-variant)]/70 bg-white text-[var(--on-surface-variant)] transition-all hover:bg-primary hover:text-white"
                  title="Call Member"
                >
                  <Phone className="h-3.5 w-3.5" />
                </a>
              )}
              {waHref && (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-600/25 bg-emerald-50/70 text-[#007D55] transition-all hover:bg-emerald-600 hover:text-white"
                  title="WhatsApp Member"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5" fill="currentColor">
                    <path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91a9.86 9.86 0 0 0-2.91-7.01ZM12.05 20.15h-.01a8.25 8.25 0 0 1-4.21-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.55 3.7-8.25 8.26-8.25 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.42 5.83c0 4.55-3.7 8.24-8.23 8.24Zm4.52-6.17c-.25-.13-1.47-.73-1.7-.81-.23-.08-.39-.13-.56.13-.16.25-.64.81-.78.98-.14.16-.29.18-.54.06-.25-.13-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.14.16-.25.25-.42.08-.16.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.66.31-.23.25-.86.84-.86 2.05s.88 2.38 1 2.54c.13.16 1.73 2.64 4.19 3.7.59.25 1.04.4 1.4.52.59.19 1.12.16 1.54.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z" />
                  </svg>
                </a>
              )}
              {canManageMembers && (
                <UnitRoleMenu
                  currentRole={member.unit_role}
                  disabled={saving}
                  onChange={(role) => onChangeRole(member, role)}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
