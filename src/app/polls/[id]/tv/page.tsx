"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trophy, Users, Award, Printer, ArrowLeft, RefreshCw, Share2, Copy, Check, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Candidate = {
  id: string;
  member_id: string | null;
  display_name: string;
  photo_url: string | null;
  nomination_reason: string | null;
  votes: number | null;
  position?: string | null;
  departments?: Array<{ name: string; role: string }>;
};

type Poll = {
  id: string;
  slug?: string | null;
  title: string;
  description: string | null;
  voter_type: string;
  status: "draft" | "active" | "closed" | string;
  starts_at: string;
  ends_at: string;
  allow_view_results: boolean;
  poll_candidates: Candidate[];
};

type ChurchSettings = {
  church_name?: string;
  church_address?: string;
  logo_url?: string | null;
};

export default function PollTvResultsPage() {
  const params = useParams();
  const router = useRouter();
  const pollId = params.id as string;

  const [poll, setPoll] = useState<Poll | null>(null);
  const [totalVotes, setTotalVotes] = useState(0);
  const [churchSettings, setChurchSettings] = useState<ChurchSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPollData = async () => {
    if (!pollId) return;
    try {
      setRefreshing(true);
      const res = await fetch(`/api/polls/${pollId}`);
      const data = await res.json();

      if (res.ok && data.poll) {
        setPoll(data.poll);
        setTotalVotes(data.totalVotes || 0);
      } else {
        toast.error(data.error || "Failed to load poll data");
      }
    } catch {
      toast.error("Network error loading poll results");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchChurchSettings = async () => {
    try {
      const res = await fetch("/api/church-settings");
      if (res.ok) {
        const data = await res.json();
        setChurchSettings(data);
      }
    } catch (e) {
      console.error("Failed to load church settings", e);
    }
  };

  useEffect(() => {
    fetchPollData();
    fetchChurchSettings();
  }, [pollId]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("TV Page URL copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#050C1A] text-white flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="h-10 w-10 text-amber-400 animate-spin" />
        <p className="text-sm font-mono text-slate-400 tracking-wider">
          LOADING BROADCAST RESULTS...
        </p>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="h-screen w-screen bg-[#050C1A] text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold text-red-400 mb-2">Poll Not Found</h1>
        <p className="text-slate-400 text-sm mb-6">The requested poll could not be located or results are unavailable.</p>
        <Button onClick={() => router.push("/polls-manage")} variant="outline" className="text-white border-slate-700">
          <ArrowLeft className="h-4 w-4 mr-2" /> Return to Dashboard
        </Button>
      </div>
    );
  }

  // Process candidates sorted by votes
  const sortedCandidates = [...(poll.poll_candidates || [])].sort(
    (a, b) => (b.votes || 0) - (a.votes || 0)
  );

  const maxVotes = sortedCandidates.length > 0 ? (sortedCandidates[0].votes || 0) : 0;
  const winners = maxVotes > 0 ? sortedCandidates.filter(c => (c.votes || 0) === maxVotes) : [];
  const isTie = winners.length > 1;

  const dateFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Decide if we split candidates into 2 columns (for 7-12 candidates)
  const isMultiColumn = sortedCandidates.length > 6;
  const halfLength = Math.ceil(sortedCandidates.length / 2);
  const leftCandidates = isMultiColumn ? sortedCandidates.slice(0, halfLength) : sortedCandidates;
  const rightCandidates = isMultiColumn ? sortedCandidates.slice(halfLength) : [];

  return (
    <div className="h-screen w-screen bg-[#050C1A] text-white p-4 md:p-6 flex flex-col justify-between overflow-hidden select-none font-sans">
      
      {/* Top TV Header Bar */}
      <header className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0 gap-4">
        <div className="flex items-center gap-3">
          {churchSettings?.logo_url ? (
            <img
              src={churchSettings.logo_url}
              alt="Church Logo"
              className="h-11 w-auto object-contain bg-white/10 p-1 rounded-xl border border-white/20"
            />
          ) : (
            <div className="h-11 w-11 rounded-xl bg-linear-to-br from-amber-400 to-yellow-600 text-slate-950 flex items-center justify-center font-black text-xl shadow-md">
              ⛪
            </div>
          )}
          <div>
            <h1 className="text-base md:text-lg font-black tracking-tight text-white flex items-center gap-2 leading-none">
              {churchSettings?.church_name || "Church Decision Portal"}
            </h1>
            <p className="text-[11px] text-amber-400 font-mono tracking-wider uppercase font-semibold mt-1">
              TV BROADCAST RESULTS • {dateFormatted}
            </p>
          </div>
        </div>

        {/* Status, Segment & Action Controls (no-print) */}
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 text-slate-300 rounded-lg font-mono text-xs font-bold border border-slate-800">
            <Users className="h-3.5 w-3.5 text-amber-400" />
            {poll.voter_type.replace("_", " ")}
          </span>

          <span className="px-3.5 py-1 bg-amber-500 text-slate-950 rounded-lg font-mono text-xs font-black uppercase tracking-wider shadow-sm">
            TOTAL VOTES: {totalVotes}
          </span>

          {/* Action Bar (hidden when printing) */}
          <div className="no-print flex items-center gap-1 ml-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={fetchPollData}
              disabled={refreshing}
              className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800"
              title="Refresh Data"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopyLink}
              className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800"
              title="Copy Page URL"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => window.print()}
              className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800"
              title="Print Page / Save PDF"
            >
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Poll Title Banner */}
      <div className="py-2.5 my-2 border-b border-slate-800/80 shrink-0 flex justify-between items-baseline">
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 block">
            OFFICIAL DECISION RESULT
          </span>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight truncate">
            {poll.title}
          </h2>
        </div>
        {poll.description && (
          <p className="text-xs text-slate-400 italic hidden lg:block max-w-xs truncate text-right">
            &ldquo;{poll.description}&rdquo;
          </p>
        )}
      </div>

      {/* Main 100vh Landscape Grid (No Scrollbars - Fits Up to 12 Contestants) */}
      <main className="flex-1 grid grid-cols-12 gap-4 min-h-0 py-1">
        
        {/* Left Column (4 Cols) - Winner Spotlight Card */}
        <div className="col-span-12 lg:col-span-4 bg-linear-to-b from-amber-500/15 via-slate-900/90 to-slate-950 border-2 border-amber-400/80 rounded-2xl p-4 md:p-5 flex flex-col justify-between shadow-xl relative overflow-hidden h-full">
          <div className="flex justify-between items-center mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-slate-950 font-mono font-black text-xs uppercase tracking-wider rounded-md shadow-xs">
              <Trophy className="h-3.5 w-3.5" />
              {isTie ? "CO-WINNERS (TIE)" : "OFFICIAL WINNER"}
            </span>
            <span className="text-xs font-mono text-amber-300 font-bold">
              {maxVotes > 0 ? `${maxVotes} Votes (${totalVotes > 0 ? Math.round((maxVotes / totalVotes) * 100) : 0}%)` : "No Votes"}
            </span>
          </div>

          {totalVotes === 0 || winners.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-800 rounded-xl">
              <Trophy className="h-10 w-10 text-slate-600 mb-2" />
              <p className="text-slate-400 text-xs font-semibold">No votes cast for this poll yet.</p>
            </div>
          ) : (
            <div className="space-y-3 flex-1 flex flex-col justify-center my-auto">
              {winners.map((winner, idx) => {
                const pct = totalVotes > 0 ? Math.round(((winner.votes || 0) / totalVotes) * 100) : 0;
                return (
                  <div key={winner.id || idx} className="flex items-center gap-3 bg-slate-950/80 border border-amber-400/50 p-3 rounded-xl shadow-md">
                    {winner.photo_url ? (
                      <img
                        src={winner.photo_url}
                        alt={winner.display_name}
                        className="h-16 w-16 md:h-20 md:w-20 rounded-full object-cover border-3 border-amber-400 shrink-0 shadow-md"
                      />
                    ) : (
                      <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-linear-to-br from-amber-400 to-yellow-600 text-slate-950 font-black text-xl md:text-2xl flex items-center justify-center border-3 border-amber-300 shrink-0 shadow-md">
                        {winner.display_name
                          .split(" ")
                          .map((s) => s[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg md:text-xl font-black text-white truncate tracking-tight">
                        {winner.display_name}
                      </h3>
                      {winner.position && (
                        <p className="text-xs font-bold text-amber-300 truncate">
                          {winner.position}
                        </p>
                      )}
                      <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-500/20 border border-amber-400/40 rounded text-amber-200 font-mono text-[11px] font-bold">
                        <span>{winner.votes || 0} Votes</span>
                        <span>•</span>
                        <span>{pct}% Share</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {winners[0]?.nomination_reason && (
                <div className="bg-slate-950/90 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 italic line-clamp-2">
                  &ldquo;{winners[0].nomination_reason}&rdquo;
                </div>
              )}
            </div>
          )}

          <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono flex justify-between items-center shrink-0">
            <span>Verified System Ledger</span>
            <span className="text-emerald-400 font-bold">● Certified Final</span>
          </div>
        </div>

        {/* Right Column (8 Cols) - Candidates Leaderboard Grid (Supports 10-12 contestants cleanly) */}
        <div className="col-span-12 lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-full min-h-0">
          <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800 shrink-0">
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-amber-400" />
              CANDIDATE STANDINGS ({sortedCandidates.length} CONTESTANTS)
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Ranked by Total Votes</span>
          </div>

          {/* Standings List Container: Fits 12 contestants on 1 screen via 2-column layout */}
          <div className="flex-1 min-h-0 flex flex-col justify-around">
            <div className={`grid ${isMultiColumn ? "grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2" : "grid-cols-1 gap-y-2.5"} h-full justify-between items-center`}>
              
              {/* Left Sub-Column (or Full List if <= 6 candidates) */}
              <div className="space-y-2 flex flex-col justify-around h-full">
                {leftCandidates.map((cand, idx) => renderCandidateRow(cand, idx, totalVotes, maxVotes))}
              </div>

              {/* Right Sub-Column (for Candidates 7 to 12) */}
              {isMultiColumn && (
                <div className="space-y-2 flex flex-col justify-around h-full">
                  {rightCandidates.map((cand, idx) => renderCandidateRow(cand, halfLength + idx, totalVotes, maxVotes))}
                </div>
              )}

            </div>
          </div>

          <footer className="pt-2 mt-1 border-t border-slate-800/80 flex justify-between items-center text-[10px] text-slate-500 font-mono shrink-0">
            <span>Pathfinder Church Polls</span>
            <span>100% Single Screen Broadcast Fit</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

function renderCandidateRow(
  cand: Candidate,
  rankIdx: number,
  totalVotes: number,
  maxVotes: number
) {
  const votes = cand.votes || 0;
  const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
  const isCandidateWinner = maxVotes > 0 && votes === maxVotes;

  return (
    <div
      key={cand.id || rankIdx}
      className={`p-2 rounded-xl border flex flex-col justify-center transition-all ${
        isCandidateWinner
          ? "bg-amber-500/10 border-amber-400/60 text-white"
          : "bg-slate-950/70 border-slate-800/80 text-slate-200"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`h-6 w-6 rounded-md flex items-center justify-center font-mono font-black text-xs shrink-0 ${
              rankIdx === 0 && maxVotes > 0
                ? "bg-amber-400 text-slate-950"
                : rankIdx === 1
                ? "bg-slate-300 text-slate-950"
                : rankIdx === 2
                ? "bg-amber-700 text-white"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            {rankIdx + 1}
          </span>

          {cand.photo_url ? (
            <img
              src={cand.photo_url}
              alt={cand.display_name}
              className="h-7 w-7 rounded-full object-cover border border-slate-700 shrink-0"
            />
          ) : (
            <div className="h-7 w-7 rounded-full bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
              {cand.display_name.substring(0, 1).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <p className="font-extrabold text-xs truncate flex items-center gap-1.5 leading-tight">
              {cand.display_name}
              {isCandidateWinner && (
                <span className="px-1 py-0.2 bg-amber-400 text-slate-950 font-mono font-black text-[9px] rounded uppercase shrink-0">
                  WINNER
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0 font-mono leading-none">
          <span className="text-xs font-black text-white">{votes} <span className="text-[10px] font-normal text-slate-400">pts</span></span>
          <span className="text-[10px] text-amber-300 font-bold ml-1.5">{pct}%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden mt-1.5">
        <div
          className={`h-full rounded-full ${
            isCandidateWinner
              ? "bg-linear-to-r from-amber-400 to-yellow-500"
              : "bg-linear-to-r from-blue-500 to-indigo-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
