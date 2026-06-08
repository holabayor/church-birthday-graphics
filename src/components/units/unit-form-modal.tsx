"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import type { ManagedUnit } from "@/components/units/types";

type UnitFormModalProps = {
  open: boolean;
  unit: ManagedUnit | null;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: { name: string; description: string }) => void;
};

export function UnitFormModal({ open, unit, saving, onOpenChange, onSubmit }: UnitFormModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(unit?.name || "");
    setDescription(unit?.description || "");
  }, [open, unit]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-hidden border-[var(--outline-variant)] bg-[var(--surface)] p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-[var(--outline-variant)] bg-white px-5 py-4 text-left">
          <p className="font-mono text-[12px] font-medium uppercase leading-4 tracking-[0.05em] text-[var(--secondary)]">
            {unit ? "Edit unit" : "Create unit"}
          </p>
          <DialogTitle className="font-[var(--font-manrope)] text-xl font-semibold text-[#0B1C30]">
            {unit ? "Update Unit Details" : "New Church Unit"}
          </DialogTitle>
          <DialogDescription className="text-sm text-[var(--on-surface-variant)]">
            Keep unit records clear so pastors, admins, and unit leaders can find the right workspace quickly.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={event => {
            event.preventDefault();
            onSubmit({ name, description });
          }}
          className="flex max-h-[calc(100dvh-10rem)] min-h-0 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
            <div className="space-y-2">
              <Label htmlFor="unit_name">Unit name</Label>
              <Input
                id="unit_name"
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder="Choir"
                className="h-11 border-[var(--outline-variant)] bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit_description">Description</Label>
              <Textarea
                id="unit_description"
                value={description}
                onChange={event => setDescription(event.target.value)}
                placeholder="Briefly describe this unit's responsibility."
                className="min-h-28 border-[var(--outline-variant)] bg-white"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-[var(--outline-variant)] bg-white p-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !name.trim()}
              
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {unit ? "Save Changes" : "Create Unit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
