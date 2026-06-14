import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type AuthFieldProps = {
  id: string;
  label: string;
  icon?: LucideIcon;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
  className?: string;
};

export function AuthField({ id, label, icon: Icon, hint, optional, children, className }: AuthFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id} className="text-sm font-semibold text-foreground">
          {label}
        </Label>
        {optional ? <span className="text-xs text-[var(--outline)]">Optional</span> : null}
      </div>
      <div className="relative">
        {Icon ? (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--outline)]" />
        ) : null}
        {children}
      </div>
      {hint ? <p className="text-xs leading-5 text-[var(--outline)]">{hint}</p> : null}
    </div>
  );
}
