"use client";

import { UserCog } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UnitRole } from "@/components/units/types";
import { unitRoleOptions } from "@/lib/unitRoles";

type UnitRoleMenuProps = {
  currentRole: UnitRole;
  disabled?: boolean;
  onChange: (role: UnitRole) => void;
};

export function UnitRoleMenu({ currentRole, disabled, onChange }: UnitRoleMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="h-9 border-primary/20 bg-white text-primary hover:bg-[var(--surface-container)] hover:text-primary/90"
        >
          <UserCog className="mr-2 h-4 w-4" />
          Change Role
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border-[var(--outline-variant)]">
        <DropdownMenuLabel>Set unit role</DropdownMenuLabel>
        {unitRoleOptions.map(({ value, label }) => (
          <DropdownMenuItem
            key={value}
            disabled={currentRole === value || disabled}
            onClick={() => onChange(value as UnitRole)}
          >
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
