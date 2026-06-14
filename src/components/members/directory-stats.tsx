"use client";

import { Users, GraduationCap, BriefcaseBusiness, UserRoundCheck } from "lucide-react";

type DirectoryStatsProps = {
  total: number;
  students: number;
  working: number;
  visitors: number;
};

export function DirectoryStats({ total, students, working, visitors }: DirectoryStatsProps) {
  const cards = [
    {
      title: "Total Members",
      count: total,
      icon: Users,
      colorClass: "bg-primary/10 text-primary",
      hoverBorder: "hover:border-primary",
      badge: "+12%", // Optional growth label matching design
    },
    {
      title: "Students",
      count: students,
      icon: GraduationCap,
      colorClass: "bg-secondary/15 text-[var(--secondary)]",
      hoverBorder: "hover:border-[var(--secondary)]",
    },
    {
      title: "Working Class",
      count: working,
      icon: BriefcaseBusiness,
      colorClass: "bg-[var(--member-emerald)]/10 text-[var(--member-emerald)]",
      hoverBorder: "hover:border-[var(--member-emerald)]",
    },
    {
      title: "Visitors",
      count: visitors,
      icon: UserRoundCheck,
      colorClass: "bg-primary/10 text-primary",
      hoverBorder: "hover:border-primary",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`bg-[var(--surface-container-lowest)] p-5 rounded-xl border border-[var(--outline-variant)]/40 shadow-xs group transition-colors cursor-default ${card.hoverBorder}`}
          >
            <div className="flex justify-between items-start mb-3">
              <div className={`p-2 rounded-lg ${card.colorClass}`}>
                <Icon className="h-5 w-5" />
              </div>
              {card.badge && (
                <span className="text-[10px] font-mono text-[var(--member-emerald)] uppercase bg-[var(--member-emerald)]/10 px-2 py-0.5 rounded-full font-semibold">
                  {card.badge}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--outline)] font-mono uppercase tracking-wider">{card.title}</p>
            <h3 className="text-2xl font-bold mt-1 text-foreground">{card.count.toLocaleString()}</h3>
          </div>
        );
      })}
    </div>
  );
}
