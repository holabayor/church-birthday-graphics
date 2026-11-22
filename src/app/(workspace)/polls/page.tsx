"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Vote,
  Calendar,
  Search,
  CheckCircle2,
  ArrowRight,
  Trophy,
  Users,
  Sparkles,
  Clock,
  Loader2,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useWorkspace } from "@/components/workspace-provider";
import { PERMISSION } from "@/lib/adminRoles";

type Poll = {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  voter_type: "anyone" | "members" | "workers" | "selected_groups";
  allowed_groups: string[];
  status: "draft" | "active" | "closed";
  allow_view_results: boolean;
  starts_at: string;
  ends_at: string;
  is_eligible?: boolean;
  has_voted?: boolean;
  poll_candidates: any[];
};

export default function PublicPollsDirectory() {
  const router = useRouter();
  const { can } = useWorkspace();
  const canManagePolls = can(PERMISSION.POLLS_MANAGE);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const checkAuthAndLoad = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const fp = localStorage.getItem("poll_device_fingerprint") || "";
      const fpParam = fp ? `?fingerprint=${fp}` : "";
      const res = await fetch(`/api/polls${fpParam}`);
      const data = await res.json();
      if (res.ok) {
        const pollsData = data.data || [];
        setPolls(pollsData);
        sessionStorage.setItem("cached_polls", JSON.stringify(pollsData));
      }
    } catch (e) {
      console.error("Failed to load details", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let fp = localStorage.getItem("poll_device_fingerprint");
    if (!fp) {
      fp = "fp_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("poll_device_fingerprint", fp);
    }

    const cached = sessionStorage.getItem("cached_polls");
    if (cached) {
      try {
        setPolls(JSON.parse(cached));
        setLoading(false);
        checkAuthAndLoad(true);
        return;
      } catch (e) {
        console.error("Failed to parse cached polls", e);
      }
    }

    checkAuthAndLoad(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredPolls = useMemo(() => {
    return polls.filter(
      (poll) =>
        poll.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (poll.description || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [polls, searchQuery]);

  const getCategoryIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("award") || t.includes("year") || t.includes("best") || t.includes("trophy")) {
      return Trophy;
    }
    if (
      t.includes("leader") ||
      t.includes("member") ||
      t.includes("worker") ||
      t.includes("exco") ||
      t.includes("committee")
    ) {
      return Users;
    }
    if (t.includes("feedback") || t.includes("survey") || t.includes("opinion") || t.includes("review")) {
      return Sparkles;
    }
    return Vote;
  };

  if (loading && polls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-slate-500 font-semibold tracking-wide">Loading polls...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full">
      <PageHeader
        eyebrow="Congregation engagement"
        title="Polls & Voting"
        description="Participate in active congregation surveys, polls, and unit nominations."
        actions={
          canManagePolls ? (
            <Button asChild variant="outline" size="sm" className="h-10 bg-white border-[var(--outline-variant)] font-semibold">
              <Link href="/polls-manage">
                <Settings2 className="mr-1.5 h-4 w-4 text-primary" />
                Manage Polls
              </Link>
            </Button>
          ) : undefined
        }
      />

      <main className="w-full space-y-6 p-4 md:p-8">
        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--outline)]" />
          <Input
            type="search"
            placeholder="Search active polls..."
            className="pl-10 h-10 bg-white border-[var(--outline-variant)]/60 rounded-xl shadow-2xs text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Poll Grid */}
        {filteredPolls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-(--outline-variant)/60 shadow-2xs">
            <div className="h-14 w-14 bg-[var(--surface-container-low)] rounded-full flex items-center justify-center mb-3">
              <Vote className="h-7 w-7 text-[var(--outline)]" />
            </div>
            <h3 className="font-semibold text-foreground text-base">No Active Polls Found</h3>
            <p className="text-[var(--on-surface-variant)] text-xs max-w-sm mt-1 px-4">
              There are currently no active polls matching your search or eligibility criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPolls.map((poll) => {
              const isVoted = poll.has_voted;
              const isEligible = poll.is_eligible !== false;
              const endsDate = new Date(poll.ends_at);
              const startsDate = new Date(poll.starts_at);
              const now = new Date();

              let statusLabel = "Active";
              let statusClass = "bg-emerald-50 text-emerald-700 border-emerald-200";

              if (poll.status === "closed" || now > endsDate) {
                statusLabel = "Completed";
                statusClass = "bg-slate-100 text-slate-600 border-slate-200";
              } else if (now < startsDate) {
                statusLabel = "Upcoming";
                statusClass = "bg-blue-50 text-blue-700 border-blue-200";
              }

              const CategoryIcon = getCategoryIcon(poll.title);

              return (
                <Card
                  key={poll.id}
                  onClick={() => {
                    if (isEligible) {
                      router.push(`/polls/${poll.slug || poll.id}`);
                    }
                  }}
                  className={`border-(--outline-variant)/60 bg-white shadow-2xs rounded-2xl flex flex-col justify-between hover:border-primary/40 transition-colors cursor-pointer p-5 gap-4 ${
                    !isEligible ? "opacity-75 bg-slate-50/50 cursor-not-allowed" : ""
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <Badge
                        variant="outline"
                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${statusClass}`}
                      >
                        {statusLabel}
                      </Badge>
                      <span className="text-xs text-[var(--on-surface-variant)] flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Ends {endsDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                      <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                        <CategoryIcon className="size-4.5" />
                      </div>
                      <CardTitle className="text-base text-foreground font-semibold line-clamp-2 leading-snug">
                        {poll.title}
                      </CardTitle>
                    </div>

                    {poll.description && (
                      <CardDescription className="text-xs text-[var(--on-surface-variant)] line-clamp-2 leading-relaxed">
                        {poll.description}
                      </CardDescription>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[var(--outline-variant)]/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex -space-x-2">
                          {poll.poll_candidates.slice(0, 3).map((cand: any, index: number) => (
                            <Avatar
                              key={cand.id || index}
                              className="size-7 border-2 border-white shadow-2xs relative"
                            >
                              <AvatarImage src={cand.photo_url || ""} />
                              <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-bold">
                                {cand.display_name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        <span className="text-xs text-[var(--on-surface-variant)] ml-2">
                          {poll.poll_candidates.length} {poll.poll_candidates.length === 1 ? "nominee" : "nominees"}
                        </span>
                      </div>

                      {isVoted ? (
                        <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="size-3.5" />
                          Voted
                        </span>
                      ) : (
                        <span className="text-[11px] text-[var(--on-surface-variant)] flex items-center gap-1">
                          <Clock className="size-3.5" />
                          Open
                        </span>
                      )}
                    </div>

                    <Button
                      disabled={!isEligible}
                      variant={isVoted ? "outline" : "default"}
                      className="w-full h-9 rounded-xl font-semibold text-xs"
                    >
                      {isVoted ? "View Ballot" : "Vote Now"}
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
