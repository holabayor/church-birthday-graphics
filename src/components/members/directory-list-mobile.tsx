"use client";

import { Phone } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { Member } from "@/lib/types";
import {
  getLifeStageLabel,
  isAvailableMember,
  normalizeLifeStage,
} from "@/lib/memberLifecycle";

type DirectoryListMobileProps = {
  members: Member[];
  onView: (member: Member) => void;
};

function getMemberName(member: Member) {
  return [member.first_name, member.middle_name, member.last_name].filter(Boolean).join(" ");
}

function getWhatsAppHref(phone?: string | null) {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return null;
  const international = digits.startsWith("0") ? `234${digits.slice(1)}` : digits;
  return `https://wa.me/${international}`;
}

export function DirectoryListMobile({ members, onView }: DirectoryListMobileProps) {
  return (
    <div className="divide-y divide-[var(--outline-variant)]/40 md:hidden bg-white">
      {members.map((m) => {
        const lifeStage = normalizeLifeStage(m.life_stage);
        const isActive = isAvailableMember(m.membership_status, m.is_active);
        const units = m.units || [];
        const primaryRoleOrUnit =
          m.position ||
          (units.length > 0
            ? units.length > 1
              ? `${units[0].name} +${units.length - 1}`
              : units[0].name
            : getLifeStageLabel(lifeStage));
        const waHref = getWhatsAppHref(m.phone_number);

        return (
          <div
            key={m.id}
            className="flex items-center justify-between gap-3 px-4 py-3 bg-white hover:bg-[var(--surface-container-low)]/40 transition-colors"
          >
            <button
              type="button"
              onClick={() => onView(m)}
              className="flex flex-1 min-w-0 items-center gap-3 text-left"
            >
              <div className="relative shrink-0">
                <Avatar className="w-11 h-11 border border-[var(--outline-variant)]/50">
                  <AvatarImage src={m.photo_url || ""} className="object-cover" />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                    {m.first_name?.[0]}
                    {m.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                {isActive && (
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-foreground truncate">
                    {getMemberName(m)}
                  </h2>
                  <span className="shrink-0 rounded-md bg-[var(--surface-container-low)] px-2 py-0.5 text-[10px] font-medium text-[var(--on-surface-variant)] truncate max-w-[110px]">
                    {primaryRoleOrUnit}
                  </span>
                </div>
                <p className="text-xs text-[var(--outline)] truncate mt-0.5">
                  {m.phone_number || "No phone"} · {getLifeStageLabel(lifeStage)}
                </p>
              </div>
            </button>

            <div className="flex shrink-0 items-center gap-1.5">
              {m.phone_number && (
                <a
                  href={`tel:${m.phone_number}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex size-8.5 items-center justify-center rounded-lg border border-[var(--outline-variant)]/60 text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-low)] hover:text-primary transition-colors"
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
                  onClick={(e) => e.stopPropagation()}
                  className="flex size-8.5 items-center justify-center rounded-lg border border-emerald-600/20 bg-emerald-50/50 text-[#007D55] hover:bg-emerald-100 transition-colors"
                  title="WhatsApp"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5" fill="currentColor">
                    <path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91a9.86 9.86 0 0 0-2.91-7.01ZM12.05 20.15h-.01a8.25 8.25 0 0 1-4.21-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.55 3.7-8.25 8.26-8.25 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.42 5.83c0 4.55-3.7 8.24-8.23 8.24Zm4.52-6.17c-.25-.13-1.47-.73-1.7-.81-.23-.08-.39-.13-.56.13-.16.25-.64.81-.78.98-.14.16-.29.18-.54.06-.25-.13-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.14.16-.25.25-.42.08-.16.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.66.31-.23.25-.86.84-.86 2.05s.88 2.38 1 2.54c.13.16 1.73 2.64 4.19 3.7.59.25 1.04.4 1.4.52.59.19 1.12.16 1.54.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
