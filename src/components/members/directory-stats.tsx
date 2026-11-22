"use client";

import { Users, GraduationCap, BriefcaseBusiness, ShieldCheck } from "lucide-react";
import { FILTER_VALUE } from "@/lib/filterOptions";
import { LIFE_STAGE } from "@/lib/memberLifecycle";

type DirectoryStatsProps = {
  total: number;
  students: number;
  working: number;
  visitors?: number;
  workers?: number;
  activeFilter?: string;
  onFilterSelect?: (filterValue: string) => void;
};

export function DirectoryStats({
  total,
  students,
  working,
  workers = 0,
  activeFilter,
  onFilterSelect,
}: DirectoryStatsProps) {
  const cards = [
    {
      title: "Total Members",
      count: total,
      subtitle: "All records",
      icon: Users,
      filterValue: FILTER_VALUE.ALL,
      colorClass: "bg-primary/10 text-primary",
    },
    {
      title: "Church Workers",
      count: workers,
      subtitle: "Serving in units",
      icon: ShieldCheck,
      filterValue: "workers",
      colorClass: "bg-amber-500/15 text-amber-600",
    },
    {
      title: "Students",
      count: students,
      subtitle: "Campus & youth",
      icon: GraduationCap,
      filterValue: LIFE_STAGE.STUDENT,
      colorClass: "bg-purple-500/10 text-purple-600",
    },
    {
      title: "Working Class",
      count: working,
      subtitle: "Professionals & NYSC",
      icon: BriefcaseBusiness,
      filterValue: LIFE_STAGE.WORKING_CLASS,
      colorClass: "bg-emerald-500/10 text-emerald-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const isSelected = activeFilter === card.filterValue;
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onFilterSelect?.(card.filterValue)}
            className={`text-left bg-white p-4 sm:p-5 rounded-xl border shadow-2xs transition-all ${
              isSelected
                ? "border-primary ring-2 ring-primary/15"
                : "border-[var(--outline-variant)]/70 hover:border-primary/40"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-[var(--on-surface-variant)] truncate">
                {card.title}
              </span>
              <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${card.colorClass}`}>
                <Icon className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {card.count.toLocaleString()}
              </div>
              <p className="mt-1 text-xs text-[var(--outline)] truncate">{card.subtitle}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
