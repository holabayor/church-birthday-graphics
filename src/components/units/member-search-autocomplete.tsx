"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface MemberSearchAutocompleteProps {
  placeholder?: string;
  selectedMemberId: string | null;
  selectedMemberName: string;
  onSelect: (memberId: string | null, fullName: string, photoUrl?: string | null) => void;
  id?: string;
}

interface MemberOption {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  email?: string | null;
  phone_number?: string | null;
  photo_url?: string | null;
}

export function MemberSearchAutocomplete({
  placeholder = "Search members...",
  selectedMemberId,
  selectedMemberName,
  onSelect,
  id,
}: MemberSearchAutocompleteProps) {
  const [query, setQuery] = useState(selectedMemberName || "");
  const [options, setOptions] = useState<MemberOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync query when selectedMemberName changes
  useEffect(() => {
    setQuery(selectedMemberName || "");
  }, [selectedMemberName]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset query text to current selected name if query doesn't match selection
        if (!selectedMemberId) {
          setQuery("");
        } else {
          setQuery(selectedMemberName);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedMemberId, selectedMemberName]);

  // Debounced search query
  useEffect(() => {
    if (!query.trim() || query === selectedMemberName) {
      setOptions([]);
      return;
    }

    const delay = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/members?limit=8&search=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (res.ok && Array.isArray(json.data)) {
          setOptions(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch members:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [query, selectedMemberName]);

  const handleSelect = (member: MemberOption) => {
    const fullName = [member.first_name, member.middle_name, member.last_name]
      .filter(Boolean)
      .join(" ");
    onSelect(member.id, fullName, member.photo_url);
    setQuery(fullName);
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelect(null, "");
    setQuery("");
    setOptions([]);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--outline)]" />
        <Input
          id={id}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            if (!e.target.value) {
              onSelect(null, "");
            }
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="h-11 border-[var(--outline-variant)] bg-white pl-10 pr-10"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--outline)]">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
        {!loading && query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-[var(--outline)] hover:bg-[var(--surface-container)] hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && (options.length > 0 || (query.trim() && query !== selectedMemberName && !loading)) && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-[var(--outline-variant)] bg-white shadow-lg">
          {options.length > 0 ? (
            <ul className="py-1">
              {options.map((member) => {
                const name = [member.first_name, member.middle_name, member.last_name]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <li key={member.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(member)}
                      className="flex w-full flex-col px-4 py-2 text-left hover:bg-[var(--surface-container-low)]"
                    >
                      <span className="text-sm font-semibold text-foreground">{name}</span>
                      {(member.phone_number || member.email) && (
                        <span className="text-xs text-[var(--on-surface-variant)] mt-0.5">
                          {member.phone_number} {member.email ? `• ${member.email}` : ""}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-4 py-3 text-sm text-[var(--on-surface-variant)]">No members found</div>
          )}
        </div>
      )}
    </div>
  );
}
