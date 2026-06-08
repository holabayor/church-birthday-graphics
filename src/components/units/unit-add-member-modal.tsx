"use client";

import { useEffect, useState } from "react";
import { Loader2, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UnitRole } from "@/components/units/types";
import { unitRoleLabels } from "@/components/units/types";

type UnitAddMemberModalProps = {
  open: boolean;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: { phone_number: string; role: UnitRole }) => void;
};

export function UnitAddMemberModal({ open, saving, onOpenChange, onSubmit }: UnitAddMemberModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState<UnitRole>("member");

  useEffect(() => {
    if (!open) return;
    setPhoneNumber("");
    setRole("member");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-hidden border-[var(--outline-variant)] bg-[var(--surface)] p-0 sm:max-w-md">
        <DialogHeader className="border-b border-[var(--outline-variant)] bg-white px-5 py-4 text-left">
          <p className="font-mono text-[12px] font-medium uppercase leading-4 tracking-[0.05em] text-[var(--secondary)]">
            Add member
          </p>
          <DialogTitle className="font-[var(--font-manrope)] text-xl font-semibold text-[#0B1C30]">
            Add Existing Member
          </DialogTitle>
          <DialogDescription className="text-sm text-[var(--on-surface-variant)]">
            Add a member by their registered phone number and set their unit responsibility.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={event => {
            event.preventDefault();
            onSubmit({ phone_number: phoneNumber, role });
          }}
        >
          <div className="space-y-4 px-5 py-5">
            <div className="space-y-2">
              <Label htmlFor="unit_member_phone">Phone number</Label>
              <Input
                id="unit_member_phone"
                value={phoneNumber}
                onChange={event => setPhoneNumber(event.target.value)}
                placeholder="08012345678"
                className="h-11 border-[var(--outline-variant)] bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_member_role">Unit role</Label>
              <Select value={role} onValueChange={value => setRole(value as UnitRole)}>
                <SelectTrigger id="unit_member_role" className="h-11 w-full border-[var(--outline-variant)] bg-white">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="border-[var(--outline-variant)]">
                  {(["member", "assistant", "head"] as UnitRole[]).map(option => (
                    <SelectItem key={option} value={option}>
                      {unitRoleLabels[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="border-t border-[var(--outline-variant)] bg-white p-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !phoneNumber.trim()}
              
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Add Member
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
