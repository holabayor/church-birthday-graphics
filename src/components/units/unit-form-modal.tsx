"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";

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
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ManagedUnit } from "@/components/units/types";
import { UNIT_ROLE } from "@/lib/unitRoles";
import { getUnitLeader, getUnitMemberName } from "./unit-leadership-summary";
import { MemberSearchAutocomplete } from "./member-search-autocomplete";

type UnitFormModalProps = {
  open: boolean;
  unit: ManagedUnit | null;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: {
    name: string;
    description: string;
    category: string;
    hodId: string | null;
    assistantId: string | null;
    isPublic: boolean;
  }) => void;
};

export function UnitFormModal({ open, unit, saving, onOpenChange, onSubmit }: UnitFormModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("departmental");
  const [hodId, setHodId] = useState<string | null>(null);
  const [hodName, setHodName] = useState("");
  const [assistantId, setAssistantId] = useState<string | null>(null);
  const [assistantName, setAssistantName] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    if (!open) return;
    setName(unit?.name || "");
    setDescription(unit?.description || "");
    setCategory("departmental"); // Default category
    setIsPublic(true); // Default visibility

    // Prepopulate leadership if editing
    if (unit) {
      const currentHod = getUnitLeader(unit.members, UNIT_ROLE.HEAD);
      if (currentHod) {
        setHodId(currentHod.id);
        setHodName(getUnitMemberName(currentHod));
      } else {
        setHodId(null);
        setHodName("");
      }

      const currentAsst = getUnitLeader(unit.members, UNIT_ROLE.ASSISTANT);
      if (currentAsst) {
        setAssistantId(currentAsst.id);
        setAssistantName(getUnitMemberName(currentAsst));
      } else {
        setAssistantId(null);
        setAssistantName("");
      }
    } else {
      setHodId(null);
      setHodName("");
      setAssistantId(null);
      setAssistantName("");
    }
  }, [open, unit]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      category,
      hodId,
      assistantId,
      isPublic,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-hidden border-(--outline-variant) bg-(--surface-container-lowest) p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-(--outline-variant) bg-(--surface-container-lowest) px-8 py-6 text-left">
          <DialogTitle className="font-headline text-2xl font-bold text-[#0B1C30]">
            {unit ? "Update Unit Details" : "Create New Unit"}
          </DialogTitle>
          <DialogDescription className="text-sm text-(--on-surface-variant) mt-1">
            {unit
              ? "Modify the organization, description, and leaders of this division."
              : "Initialize a new organizational division within Kinship."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex max-h-[calc(100dvh-10rem)] min-h-0 flex-col">
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-8 py-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="unitName"
                  className="font-mono text-[12px] uppercase tracking-wider text-(--on-surface-variant) font-semibold"
                >
                  Unit Name
                </Label>
                <Input
                  id="unitName"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., Sanctuary Choir"
                  className="h-11 border-(--outline-variant) bg-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="unitCategory"
                  className="font-mono text-[12px] uppercase tracking-wider text-(--on-surface-variant) font-semibold"
                >
                  Unit Category
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="unitCategory" className="h-11 w-full border-(--outline-variant) bg-white">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="border-(--outline-variant)">
                    <SelectItem value="departmental">Departmental</SelectItem>
                    <SelectItem value="fellowship">Fellowship</SelectItem>
                    <SelectItem value="outreach">Outreach</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="font-mono text-[12px] uppercase tracking-wider text-(--on-surface-variant) font-semibold"
              >
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Define the primary purpose and scope of this unit..."
                className="min-h-24 border-(--outline-variant) bg-white resize-none"
              />
            </div>

            {/* Leadership Section */}
            <div className="pt-4 border-t border-(--outline-variant)">
              <h3 className="font-headline text-base font-bold text-[#0B1C30] mb-4 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Leadership Assignment
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="hod"
                    className="font-mono text-[12px] uppercase tracking-wider text-(--on-surface-variant) font-semibold"
                  >
                    Primary Leadership (HOD)
                  </Label>
                  <MemberSearchAutocomplete
                    id="hod"
                    placeholder="Search members..."
                    selectedMemberId={hodId}
                    selectedMemberName={hodName}
                    onSelect={(id, name) => {
                      setHodId(id);
                      setHodName(name);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="assistant"
                    className="font-mono text-[12px] uppercase tracking-wider text-(--on-surface-variant) font-semibold"
                  >
                    Assistant Leadership
                  </Label>
                  <MemberSearchAutocomplete
                    id="assistant"
                    placeholder="Search members..."
                    selectedMemberId={assistantId}
                    selectedMemberName={assistantName}
                    onSelect={(id, name) => {
                      setAssistantId(id);
                      setAssistantName(name);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Initial Configuration */}
            <div className="pt-4 border-t border-(--outline-variant)">
              <div className="bg-(--surface-container-low) p-4 rounded-xl flex items-center justify-between border border-(--outline-variant)">
                <div>
                  <p className="font-headline font-bold text-[#0B1C30]">Public Visibility</p>
                  <p className="text-xs text-(--on-surface-variant) mt-0.5">
                    Allow all members to see this unit in the portal.
                  </p>
                </div>
                <Switch checked={isPublic} onCheckedChange={setIsPublic} aria-label="Toggle public visibility" />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-(--outline-variant) bg-(--surface-container-low) px-8 py-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 border-(--outline-variant) bg-white font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !name.trim()}
              className="h-11 px-6 font-bold shadow-lg shadow-primary/10"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {unit ? "Save Changes" : "Create Unit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
