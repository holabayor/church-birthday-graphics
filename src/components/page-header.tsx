import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  meta?: ReactNode;
  className?: string;
};

export function PageHeader({ eyebrow, title, description, actions, meta, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "page-header-container flex flex-col gap-3 border-b border-[var(--outline-variant)]/70 bg-white px-4 py-4 md:px-8 md:py-5",
        className,
      )}
    >
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          {eyebrow ? (
            <p className="font-mono text-[11px] font-semibold uppercase leading-4 tracking-[0.06em] text-primary">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-[var(--font-manrope)] text-xl font-bold tracking-tight text-foreground sm:text-2xl md:text-[28px] md:leading-9">
            {title}
          </h1>
          {description ? (
            <p className="max-w-3xl text-xs font-medium leading-relaxed text-[var(--on-surface-variant)] md:text-sm">
              {description}
            </p>
          ) : null}
        </div>

        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            {actions}
          </div>
        ) : null}
      </div>

      {meta ? <div className="flex flex-wrap items-center gap-2 pt-0.5">{meta}</div> : null}
    </header>
  );
}
