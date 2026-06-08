import { Badge } from "@/components/ui/badge";
import type { ManagedUnit } from "@/components/units/types";

export function UnitAccessBadge({ access }: { access: ManagedUnit["access"] }) {
  const label = access.can_manage_members ? "Can manage members" : access.role || "View only";

  return (
    <Badge
      className={`rounded-full px-3 py-1 font-normal capitalize ${
        access.can_manage_members
          ? "bg-[var(--surface-container)] text-primary hover:bg-[var(--surface-container)]"
          : "border border-[var(--outline-variant)] bg-white text-[var(--on-surface-variant)] hover:bg-white"
      }`}
    >
      {label}
    </Badge>
  );
}
