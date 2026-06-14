"use client";

import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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
  const chips = [
    { label: "All Members", value: FILTER_VALUE.ALL },
    { label: "Students", value: LIFE_STAGE.STUDENT },
    { label: "NYSC", value: LIFE_STAGE.NYSC_CORPER },
    { label: "Working", value: LIFE_STAGE.WORKING_CLASS },
    { label: "Visitors", value: LIFE_STAGE.VISITOR },
  ];

  return (
    <div className="bg-[var(--surface-container-lowest)] p-5 border-b border-[var(--outline-variant)]/40 space-y-4">
      {/* Desktop Filter Bar */}
      <div className="hidden md:flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--outline)]" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, phone, or email..."
            className="pl-9 pr-8 h-10 border-[var(--outline-variant)] bg-[var(--surface-container-low)] focus-visible:ring-primary focus-visible:border-primary"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-[var(--surface-container)] text-[var(--outline)]"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-wider text-[var(--outline)] mr-1">Filter by:</span>

          {/* Life Stage Select */}
          <Select value={memberType || FILTER_VALUE.ALL} onValueChange={onMemberTypeChange}>
            <SelectTrigger className="h-10 w-[160px] border-[var(--outline-variant)] bg-[var(--surface-container-low)]">
              <SelectValue placeholder="Life Stage: All" />
            </SelectTrigger>
            <SelectContent className="border-[var(--outline-variant)]">
              <SelectItem value={FILTER_VALUE.ALL}>Life Stage: All</SelectItem>
              {lifeStageOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Unit Select */}
          <Select value={unitId || FILTER_VALUE.ALL} onValueChange={onUnitIdChange}>
            <SelectTrigger className="h-10 w-[160px] border-[var(--outline-variant)] bg-[var(--surface-container-low)]">
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
            <SelectTrigger className="h-10 w-[140px] border-[var(--outline-variant)] bg-[var(--surface-container-low)]">
              <SelectValue placeholder="Birth Month" />
            </SelectTrigger>
            <SelectContent className="border-[var(--outline-variant)]">
              <SelectItem value={FILTER_VALUE.ALL}>All months</SelectItem>
              {birthMonthOptions.map(option => (
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
            <SelectTrigger className="h-10 w-[160px] border-[var(--outline-variant)] bg-[var(--surface-container-low)]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="border-[var(--outline-variant)]">
              {memberSortOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 border-[var(--outline-variant)] text-[var(--outline)] hover:text-primary hover:bg-[var(--surface-container-low)]"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mobile Search Bar (Only on mobile viewport) */}
      <div className="relative w-full md:hidden">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--outline)]" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search members..."
          className="w-full h-11 pl-11 pr-8 rounded-full bg-[var(--surface-container-low)] border-none focus-visible:ring-primary focus-visible:border-primary"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--surface-container)] text-[var(--outline)]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Mobile Filter Chips Scroll */}
      <div className="flex md:hidden gap-2 overflow-x-auto no-scrollbar pb-1">
        {chips.map((chip) => {
          const isActive = (memberType || FILTER_VALUE.ALL) === chip.value;
          return (
            <button
              key={chip.value}
              onClick={() => onMemberTypeChange(chip.value)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-colors ${
                isActive
                  ? "bg-primary text-white"
                  : "bg-[var(--surface-container-low)] text-[var(--on-surface-variant)] border border-[var(--outline-variant)]/30 hover:bg-[var(--surface-container)]"
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
