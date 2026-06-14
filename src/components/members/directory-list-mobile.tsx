"use client";

import { ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { Member } from "@/lib/types";
import {
  LIFE_STAGE,
  getLifeStageLabel,
  getMembershipStatusLabel,
  isAvailableMember,
  normalizeLifeStage,
  usesNyscProfile,
  workingLifeStages,
} from "@/lib/memberLifecycle";

type DirectoryListMobileProps = {
  members: Member[];
  onView: (member: Member) => void;
};

function getMemberName(member: Member) {
  return [member.first_name, member.middle_name, member.last_name].filter(Boolean).join(" ");
}

export function DirectoryListMobile({ members, onView }: DirectoryListMobileProps) {
  return (
    <div className="divide-y divide-[var(--outline-variant)]/30 md:hidden bg-[var(--surface-container-lowest)]">
      {members.map((m) => {
        const lifeStage = normalizeLifeStage(m.life_stage);
        const isActive = isAvailableMember(m.membership_status, m.is_active);
        
        let typeBadgeStyle = "bg-[var(--surface-container)] text-foreground border border-[var(--outline-variant)]/30";
        if (workingLifeStages.includes(lifeStage)) {
          typeBadgeStyle = "bg-primary/10 text-primary border border-primary/10";
        } else if (lifeStage === LIFE_STAGE.STUDENT) {
          typeBadgeStyle = "bg-[var(--surface-container-highest)] text-primary border border-primary/10";
        } else if (usesNyscProfile(lifeStage)) {
          typeBadgeStyle = "bg-secondary/15 text-[var(--secondary-foreground)] border border-secondary/10";
        } else if (lifeStage === LIFE_STAGE.VISITOR) {
          typeBadgeStyle = "bg-[var(--member-emerald)]/10 text-[var(--member-emerald)] border border-[var(--member-emerald)]/10";
        }

        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onView(m)}
            className="flex w-full items-center gap-4 px-4 py-3.5 text-left bg-[var(--surface-container-lowest)] hover:bg-[var(--surface-container-low)]/50 active:bg-[var(--surface-container-low)] transition-colors"
          >
            {/* Avatar & Online Dot */}
            <div className="relative shrink-0">
              <Avatar className="w-12 h-12 border border-[var(--outline-variant)]/30 shadow-xs">
                <AvatarImage src={m.photo_url || ""} className="object-cover" />
                <AvatarFallback className="bg-primary/5 text-primary font-bold text-sm">
                  {m.first_name?.[0]}
                  {m.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              {isActive && (
                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[var(--member-emerald)] border-2 border-white shadow-sm"></div>
              )}
            </div>

            {/* Member Details */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline gap-2 mb-0.5">
                <h2 className="text-base font-bold text-foreground truncate leading-tight">
                  {getMemberName(m)}
                </h2>
                <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${typeBadgeStyle}`}>
                  {getLifeStageLabel(lifeStage)}
                </span>
              </div>
              
              {isActive ? (
                <div className="flex items-center gap-1.5 text-[var(--on-surface-variant)] text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[var(--member-emerald)] shrink-0" />
                  <span className="truncate">{getMembershipStatusLabel(m.membership_status, m.is_active)}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-destructive text-xs">
                  <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                  <span className="truncate">{getMembershipStatusLabel(m.membership_status, m.is_active)}</span>
                </div>
              )}
            </div>

            {/* Chevron Right */}
            <ChevronRight className="h-5 w-5 text-[var(--outline)]/40 shrink-0" />
          </button>
        );
      })}
    </div>
  );
}
