"use client";

import { useEffect, useState, useMemo } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [member, setMember] = useState<{ id: string; name: string } | null>(null);

  const checkAuthAndLoad = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const authRes = await fetch("/api/auth");
      let currentMember = null;
      if (authRes.ok) {
        const authJson = await authRes.json();
        currentMember = authJson.member || authJson.user || null;
      }

      if (!currentMember) {
        setMember(null);
        router.push("/login");
        return;
      }

      setMember(currentMember);

      let fp = localStorage.getItem("poll_device_fingerprint") || "";
      const fpParam = fp ? `?fingerprint=${fp}` : "";
      const res = await fetch(`/api/polls${fpParam}`);
      const data = await res.json();
      if (res.ok) {
        const pollsData = data.data || [];
        setPolls(pollsData);
        // Cache to sessionStorage
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

    // Load from cache first (stale-while-revalidate pattern)
    const cached = sessionStorage.getItem("cached_polls");
    if (cached) {
      try {
        setPolls(JSON.parse(cached));
        setLoading(false);
        // Load in background
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
      poll =>
        poll.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (poll.description || "").toLowerCase().includes(searchQuery.toLowerCase()),
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
        <p className="text-xs text-slate-500 font-semibold tracking-wide">Resolving polls directory...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--surface) pb-24 sm:pb-8">
      <PageHeader
        eyebrow="Congregation engagement"
        title="Decision Portal"
        description="Participate in active congregation surveys, polls, and unit nominations."
      />

      <main className="w-full space-y-6 p-4 md:p-8">
        {/* Search Bar */}
        <div className="flex items-center gap-4 bg-white rounded-2xl border border-(--outline-variant)/60 shadow-xs max-w-md relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="search"
            placeholder="Search active polls..."
            className="pl-10 h-10 border-none focus-visible:ring-0 bg-transparent text-sm"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Poll Grid */}
        <div>
          {filteredPolls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-(--outline-variant)/60 shadow-xs">
              <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-dashed border-slate-200">
                <Vote className="h-7 w-7 text-slate-400" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">No Active Polls Found</h3>
              <p className="text-slate-500 text-sm max-w-sm mt-1.5 px-4 leading-normal">
                There are currently no active polls matching your search or eligibility criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPolls.map(poll => {
                const isVoted = poll.has_voted;
                const isEligible = poll.is_eligible !== false;
                const endsDate = new Date(poll.ends_at);
                const startsDate = new Date(poll.starts_at);
                const now = new Date();

                // Determine Status Badge
                let statusLabel = "Active";
                let statusClass = "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50";

                if (poll.status === "closed" || now > endsDate) {
                  statusLabel = "Completed";
                  statusClass = "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100";
                } else if (now < startsDate) {
                  statusLabel = "Upcoming";
                  statusClass = "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50";
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
                    className={`border-(--outline-variant)/60 bg-white shadow-xs rounded-2xl flex flex-col justify-between hover:shadow-md hover:border-primary/45 transition-all duration-300 cursor-pointer p-4 gap-2 ${
                      !isEligible
                        ? "opacity-75 bg-slate-50/50 cursor-not-allowed hover:border-(--outline-variant)/60 hover:shadow-xs"
                        : ""
                    }`}
                  >
                    <div>
                      {/* Top metadata */}
                      <div className="flex justify-between items-center mb-3">
                        <Badge
                          variant="outline"
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wider ${statusClass}`}
                        >
                          {statusLabel.toUpperCase()}
                        </Badge>
                        <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Ends {endsDate.toLocaleDateString()}
                        </span>
                      </div>

                      {/* Header block with Category Icon */}
                      <div className="flex items-center gap-3.5 mb-3">
                        <div className="size-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-slate-500">
                          <CategoryIcon className="size-5" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base text-slate-900 font-bold tracking-tight line-clamp-2 leading-snug">
                            {poll.title}
                          </CardTitle>
                        </div>
                      </div>

                      {/* Description */}
                      {poll.description && (
                        <CardDescription className="text-xs text-slate-500 line-clamp-3 leading-relaxed min-h-[2.25rem]">
                          {poll.description}
                        </CardDescription>
                      )}
                    </div>

                    {/* Footer Details */}
                    <div className="pt-2 border-t border-slate-200 space-y-4">
                      <div className="flex items-center justify-between">
                        {/* Overlapping Nominee Avatars */}
                        <div className="flex items-center">
                          <div className="flex -space-x-3">
                            {poll.poll_candidates.slice(0, 3).map((cand: any, index: number) => (
                              <Avatar
                                key={cand.id}
                                className={`size-10 border-2 border-white shadow-xs z-${index} relative`}
                              >
                                <AvatarImage src={cand.photo_url || ""} />
                                <AvatarFallback className="bg-primary/5 text-primary text-[8px] font-bold">
                                  {cand.display_name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {poll.poll_candidates.length > 3 && (
                              <div className="size-10 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-500 shadow-xs z-10">
                                +{poll.poll_candidates.length - 3}
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-semibold ml-2">
                            {poll.poll_candidates.length} Nominees
                          </span>
                        </div>

                        {/* Voting Status Badge */}
                        <div className="flex items-center gap-1">
                          {isVoted ? (
                            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                              <CheckCircle2 className="size-3.5" />
                              You voted
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                              <Clock className="size-3.5" />
                              Not yet voted
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Pill CTA button */}
                      <Button
                        disabled={!isEligible}
                        className={`w-full h-9.5 rounded-lg font-bold text-xs shadow-none border transition-all duration-300 ${
                          isVoted
                            ? "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
                            : !isEligible
                              ? "bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed"
                              : "bg-primary text-white hover:bg-primary/95 border-transparent shadow-sm"
                        }`}
                      >
                        {isVoted ? "View Poll" : "Vote Now"}
                        <ArrowRight className="h-3 w-3 ml-1.5" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
