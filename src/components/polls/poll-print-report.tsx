"use client";

import React from "react";
import { Trophy, Users, Award } from "lucide-react";

export type PrintableCandidate = {
  id?: string;
  member_id?: string | null;
  display_name: string;
  photo_url?: string | null;
  nomination_reason?: string | null;
  votes?: number | null;
  position?: string | null;
  departments?: Array<{ name: string; role: string }>;
};

export type PrintablePoll = {
  id: string;
  title: string;
  description?: string | null;
  voter_type: string;
  status: "draft" | "active" | "closed" | string;
  starts_at: string;
  ends_at: string;
  allow_view_results?: boolean;
};

export type ChurchSettingsData = {
  church_name?: string;
  church_address?: string;
  logo_url?: string | null;
};

interface PollPrintReportProps {
  poll: PrintablePoll;
  candidates: PrintableCandidate[];
  totalVotes: number;
  churchSettings?: ChurchSettingsData | null;
}

export function PollPrintReport({
  poll,
  candidates,
  totalVotes,
  churchSettings,
}: PollPrintReportProps) {
  // Sort candidates by votes descending
  const sortedCandidates = [...candidates].sort(
    (a, b) => (b.votes || 0) - (a.votes || 0)
  );

  const maxVotes = sortedCandidates.length > 0 ? (sortedCandidates[0].votes || 0) : 0;
  
  // Find winner(s) if any votes cast
  const winners = maxVotes > 0 ? sortedCandidates.filter(c => (c.votes || 0) === maxVotes) : [];
  const isTie = winners.length > 1;

  const printedAtDate = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      id="poll-print-report-container"
      className="w-full bg-[#0B1C30] text-white p-6 sm:p-8 rounded-2xl border border-slate-700/60 flex flex-col justify-between my-6 font-sans"
      style={{ colorScheme: "dark" }}
    >
      {/* Top TV Broadcast Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-700/80 pb-5 gap-4">
        {/* Church Branding & Logo */}
        <div className="flex items-center gap-4">
          {churchSettings?.logo_url ? (
            <img
              src={churchSettings.logo_url}
              alt="Church Logo"
              className="h-14 w-auto object-contain bg-white/10 p-1.5 rounded-xl border border-white/20"
            />
          ) : (
            <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-amber-500 to-yellow-600 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg">
              ⛪
            </div>
          )}
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              {churchSettings?.church_name || "Church Decision Portal"}
            </h1>
            <p className="text-xs text-amber-400 font-mono tracking-wider uppercase font-semibold">
              OFFICIAL BROADCAST RESULTS • {printedAtDate}
            </p>
          </div>
        </div>

        {/* Poll Metadata & Status Badge */}
        <div className="flex items-center gap-3 self-end md:self-center">
          <span className="px-3.5 py-1.5 bg-slate-800/90 text-amber-300 rounded-xl font-mono text-xs font-bold uppercase tracking-widest border border-amber-500/30 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-amber-400" />
            {poll.voter_type.replace("_", " ")}
          </span>
          <span className="px-3.5 py-1.5 bg-amber-500 text-slate-950 rounded-xl font-mono text-xs font-black uppercase tracking-widest shadow-md">
            TOTAL VOTES: {totalVotes}
          </span>
        </div>
      </div>

      {/* Main Poll Title Banner */}
      <div className="py-4 my-2 border-b border-slate-800">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 block mb-1">
          POLL TITLE & DECISION RESULTS
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {poll.title}
        </h2>
        {poll.description && (
          <p className="text-sm text-slate-300 italic mt-1 line-clamp-2">
            &ldquo;{poll.description}&rdquo;
          </p>
        )}
      </div>

      {/* Landscape 2-Column TV Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-4 flex-1 items-stretch">
        
        {/* Left Column (40% width) - Winner Spotlight Broadcast Box */}
        <div className="lg:col-span-5 bg-linear-to-b from-amber-500/15 via-slate-900/90 to-slate-950 border-2 border-amber-400/80 rounded-2xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-slate-950 font-mono font-black text-xs uppercase tracking-wider rounded-lg shadow-sm">
              <Trophy className="h-4 w-4" />
              {isTie ? "CO-WINNERS (TIE)" : "OFFICIAL WINNER"}
            </span>
            <span className="text-xs font-mono text-amber-300 font-bold">
              {maxVotes > 0 ? `${maxVotes} Votes (${totalVotes > 0 ? Math.round((maxVotes / totalVotes) * 100) : 0}%)` : "No Votes"}
            </span>
          </div>

          {totalVotes === 0 || winners.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-700 rounded-xl">
              <Trophy className="h-12 w-12 text-slate-600 mb-2" />
              <p className="text-slate-400 text-sm font-semibold">No votes cast for this poll yet.</p>
            </div>
          ) : (
            <div className="space-y-4 flex-1 flex flex-col justify-center">
              {winners.map((winner, idx) => {
                const pct = Math.round(((winner.votes || 0) / totalVotes) * 100);
                return (
                  <div key={winner.id || idx} className="flex items-center gap-4 bg-slate-900/90 border border-amber-400/40 p-4 rounded-xl shadow-md">
                    {winner.photo_url ? (
                      <img
                        src={winner.photo_url}
                        alt={winner.display_name}
                        className="h-20 w-20 rounded-full object-cover border-4 border-amber-400 shrink-0 shadow-lg"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-linear-to-br from-amber-400 to-yellow-600 text-slate-950 font-black text-2xl flex items-center justify-center border-4 border-amber-300 shrink-0 shadow-lg">
                        {winner.display_name
                          .split(" ")
                          .map((s) => s[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h3 className="text-xl font-black text-white truncate tracking-tight">
                        {winner.display_name}
                      </h3>
                      {winner.position && (
                        <p className="text-xs font-bold text-amber-300 mt-0.5">
                          {winner.position}
                        </p>
                      )}
                      <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-400/50 rounded-lg text-amber-200 font-mono text-xs font-bold">
                        <span>{winner.votes || 0} Votes</span>
                        <span>•</span>
                        <span>{pct}% Share</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {winners[0]?.nomination_reason && (
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 italic">
                  &ldquo;{winners[0].nomination_reason}&rdquo;
                </div>
              )}
            </div>
          )}

          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono flex justify-between items-center">
            <span>Verified Ledger Count</span>
            <span className="text-emerald-400 font-bold">● Certified Winner</span>
          </div>
        </div>

        {/* Right Column (60% width) - Candidates Standings Table / Leaderboard */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                CANDIDATE STANDINGS & VOTE SHARE
              </h3>
              <span className="text-xs font-mono text-slate-400">{sortedCandidates.length} Nominees</span>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {sortedCandidates.map((cand, idx) => {
                const votes = cand.votes || 0;
                const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                const isCandidateWinner = maxVotes > 0 && votes === maxVotes;

                return (
                  <div
                    key={cand.id || idx}
                    className={`p-3.5 rounded-xl border flex flex-col gap-2 transition-all ${
                      isCandidateWinner
                        ? "bg-amber-500/10 border-amber-400/60 text-white"
                        : "bg-slate-950/60 border-slate-800 text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`h-7 w-7 rounded-lg flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                            idx === 0 && maxVotes > 0
                              ? "bg-amber-400 text-slate-950"
                              : idx === 1
                              ? "bg-slate-300 text-slate-950"
                              : idx === 2
                              ? "bg-amber-700 text-white"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {idx + 1}
                        </span>

                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate flex items-center gap-2">
                            {cand.display_name}
                            {isCandidateWinner && (
                              <span className="px-1.5 py-0.5 bg-amber-400 text-slate-950 font-mono font-black text-[10px] rounded uppercase">
                                WINNER
                              </span>
                            )}
                          </p>
                          {cand.nomination_reason && (
                            <p className="text-xs text-slate-400 truncate italic">
                              {cand.nomination_reason}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0 font-mono">
                        <span className="text-sm font-black text-white">{votes} votes</span>
                        <span className="text-xs text-slate-400 block font-semibold">{pct}%</span>
                      </div>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCandidateWinner
                            ? "bg-linear-to-r from-amber-400 to-yellow-500"
                            : "bg-linear-to-r from-blue-500 to-indigo-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex justify-between items-center text-xs text-slate-400 font-mono">
            <span>Official Church Polling Record</span>
            <span>Printed Landscape TV Display Format</span>
          </div>
        </div>
      </div>
    </div>
  );
}
