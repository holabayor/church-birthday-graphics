"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import type { ChurchUnit } from "@/lib/types";
import { FILTER_VALUE, birthMonthOptions, memberSortOptions } from "@/lib/filterOptions";
import { LIFE_STAGE, lifeStageOptions } from "@/lib/memberLifecycle";

type DirectoryFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  memberType: string;
  onMemberTypeChange: (value: string) => void;
  unitId: string;
  onUnitIdChange: (value: string) => void;
  month: string;
  onMonthChange: (value: string) => void;
  sort: string;
  order: string;
  onSortChange: (sort: string, order: string) => void;
  units: ChurchUnit[];
};

export function DirectoryFilters({
  search,
  onSearchChange,
  memberType,
  onMemberTypeChange,
  unitId,
  onUnitIdChange,
  month,
  onMonthChange,
  sort,
  order,
  onSortChange,
  units,
}: DirectoryFiltersProps) {
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const chips = [
    { label: "All Members", value: FILTER_VALUE.ALL },
    { label: "Workers", value: "workers" },
    { label: "Students", value: LIFE_STAGE.STUDENT },
    { label: "NYSC", value: LIFE_STAGE.NYSC_CORPER },
    { label: "Working", value: LIFE_STAGE.WORKING_CLASS },
    { label: "Visitors", value: LIFE_STAGE.VISITOR },
  ];

  const activeFilterCount = [
    memberType && memberType !== FILTER_VALUE.ALL,
    unitId && unitId !== FILTER_VALUE.ALL,
    month && month !== FILTER_VALUE.ALL,
  ].filter(Boolean).length;

  const resetAllFilters = () => {
    onSearchChange("");
    onMemberTypeChange(FILTER_VALUE.ALL);
    onUnitIdChange(FILTER_VALUE.ALL);
    onMonthChange(FILTER_VALUE.ALL);
    onSortChange("first_name", "asc");
  };

  return (
    <div className="bg-white p-4 sm:p-5 border-b border-[var(--outline-variant)]/50 space-y-3.5">
      {/* Desktop Filter Bar */}
      <div className="hidden md:flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--outline)]" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, phone, position, or email..."
            className="pl-9 pr-8 h-10 border-[var(--outline-variant)] bg-[var(--surface-container-low)] focus-visible:ring-primary focus-visible:border-primary"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-[var(--surface-container)] text-[var(--outline)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category / Life Stage Select */}
          <Select value={memberType || FILTER_VALUE.ALL} onValueChange={onMemberTypeChange}>
            <SelectTrigger className="h-10 w-[165px] border-[var(--outline-variant)] bg-[var(--surface-container-low)] text-xs font-medium">
              <SelectValue placeholder="Category: All" />
            </SelectTrigger>
            <SelectContent className="border-[var(--outline-variant)]">
              <SelectItem value={FILTER_VALUE.ALL}>Category: All</SelectItem>
              <SelectItem value="workers">Church Workers Only</SelectItem>
              {lifeStageOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Unit Select */}
          <Select value={unitId || FILTER_VALUE.ALL} onValueChange={onUnitIdChange}>
            <SelectTrigger className="h-10 w-[165px] border-[var(--outline-variant)] bg-[var(--surface-container-low)] text-xs font-medium">
              <SelectValue placeholder="Unit: All" />
            </SelectTrigger>
            <SelectContent className="border-[var(--outline-variant)]">
              <SelectItem value={FILTER_VALUE.ALL}>Unit: All</SelectItem>
              {units.map((unit) => (
                <SelectItem key={unit.id} value={unit.id}>
                  {unit.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Birth Month Select */}
          <Select value={month || FILTER_VALUE.ALL} onValueChange={onMonthChange}>
            <SelectTrigger className="h-10 w-[145px] border-[var(--outline-variant)] bg-[var(--surface-container-low)] text-xs font-medium">
              <SelectValue placeholder="Birth Month" />
            </SelectTrigger>
            <SelectContent className="border-[var(--outline-variant)]">
              <SelectItem value={FILTER_VALUE.ALL}>All Months</SelectItem>
              {birthMonthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Select */}
          <Select
            value={`${sort}-${order}`}
            onValueChange={(val) => {
              const [s, o] = val.split("-");
              onSortChange(s, o);
            }}
          >
            <SelectTrigger className="h-10 w-[155px] border-[var(--outline-variant)] bg-[var(--surface-container-low)] text-xs font-medium">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="border-[var(--outline-variant)]">
              {memberSortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetAllFilters}
              className="h-10 px-2.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              title="Reset Filters"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Search Bar + Filter Drawer Trigger */}
      <div className="flex items-center gap-2 md:hidden">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--outline)]" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search name, phone, position..."
            className="w-full h-11 pl-10 pr-8 rounded-xl bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/50 text-sm focus-visible:ring-primary"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--surface-container)] text-[var(--outline)]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => setMobileFilterOpen(true)}
          className="relative h-11 px-3.5 rounded-xl border-[var(--outline-variant)] bg-white text-foreground shrink-0"
        >
          <SlidersHorizontal className="h-4 w-4 text-primary mr-1.5" />
          <span className="text-xs font-bold">Filters</span>
          {activeFilterCount > 0 && (
            <span className="ml-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Quick Category Filter Chips (Visible on both Mobile & Desktop) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
        {chips.map((chip) => {
          const isActive = (memberType || FILTER_VALUE.ALL) === chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => onMemberTypeChange(chip.value)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
                isActive
                  ? "bg-primary text-white shadow-2xs"
                  : "bg-[var(--surface-container-low)] text-[var(--on-surface-variant)] border border-[var(--outline-variant)]/40 hover:bg-[var(--surface-container)]"
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Mobile Filter & Sort Bottom Sheet */}
      <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl border-t border-[var(--outline-variant)] bg-white p-0 max-h-[85dvh] flex flex-col"
        >
          <SheetHeader className="border-b border-[var(--outline-variant)]/60 px-5 py-4 text-left">
            <SheetTitle className="font-[var(--font-manrope)] text-lg font-bold text-foreground">
              Filter & Sort Directory
            </SheetTitle>
            <SheetDescription className="text-xs text-[var(--on-surface-variant)]">
              Narrow down members by ministry unit, birth month, life stage, or sort order.
            </SheetDescription>
          </SheetHeader>

          <div className="p-5 space-y-4 overflow-y-auto">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[var(--outline)]">
                Member Category / Life Stage
              </Label>
              <Select value={memberType || FILTER_VALUE.ALL} onValueChange={onMemberTypeChange}>
                <SelectTrigger className="h-11 w-full border-[var(--outline-variant)] bg-[var(--surface-container-low)]">
                  <SelectValue placeholder="All Members" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FILTER_VALUE.ALL}>All Members</SelectItem>
                  <SelectItem value="workers">Church Workers Only</SelectItem>
                  {lifeStageOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[var(--outline)]">
                Ministry Unit / Department
              </Label>
              <Select value={unitId || FILTER_VALUE.ALL} onValueChange={onUnitIdChange}>
                <SelectTrigger className="h-11 w-full border-[var(--outline-variant)] bg-[var(--surface-container-low)]">
                  <SelectValue placeholder="All Units" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FILTER_VALUE.ALL}>All Units</SelectItem>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[var(--outline)]">
                Birthday Month
              </Label>
              <Select value={month || FILTER_VALUE.ALL} onValueChange={onMonthChange}>
                <SelectTrigger className="h-11 w-full border-[var(--outline-variant)] bg-[var(--surface-container-low)]">
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FILTER_VALUE.ALL}>All Months</SelectItem>
                  {birthMonthOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[var(--outline)]">
                Sort Order
              </Label>
              <Select
                value={`${sort}-${order}`}
                onValueChange={(val) => {
                  const [s, o] = val.split("-");
                  onSortChange(s, o);
                }}
              >
                <SelectTrigger className="h-11 w-full border-[var(--outline-variant)] bg-[var(--surface-container-low)]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {memberSortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <SheetFooter className="border-t border-[var(--outline-variant)]/60 p-4 pb-safe flex-row gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetAllFilters();
                setMobileFilterOpen(false);
              }}
              className="flex-1 h-11 rounded-xl"
            >
              Reset All
            </Button>
            <Button
              type="button"
              onClick={() => setMobileFilterOpen(false)}
              className="flex-1 h-11 rounded-xl font-bold"
            >
              Apply Filters
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
