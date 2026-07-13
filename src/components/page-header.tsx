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
        "flex flex-col gap-4 border-b border-[var(--outline-variant)] bg-[var(--surface)] px-4 py-4 md:px-8",
        className,
      )}
    >
      <div className="flex gap-4 flex-row flex-wrap items-center justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="font-mono text-[12px] font-medium uppercase leading-4 tracking-[0.05em] text-primary">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-[var(--font-manrope)] text-2xl font-bold text-foreground md:text-[32px] md:leading-10">
            {title}
          </h1>
          {description ? (
            <p className="max-w-3xl text-xs font-medium leading-5 text-[var(--on-surface-variant)] md:text-sm md:leading-6">
              {description}
            </p>
          ) : null}
        </div>

        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>

      {meta ? <div className="flex flex-wrap items-center gap-2">{meta}</div> : null}
    </header>
  );
}
