"use client";

import React from "react";
import { Trophy, Calendar, Users, Award, CheckCircle2 } from "lucide-react";

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

  const startDateFormatted = new Date(poll.starts_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const endDateFormatted = new Date(poll.ends_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      id="poll-print-report-container"
      className="hidden print:block font-sans text-slate-900 bg-white p-8 max-w-4xl mx-auto border border-slate-200 rounded-xl"
      style={{ colorScheme: "light" }}
    >
      {/* Header with Church Logo & Name */}
      <div className="flex items-center justify-between border-b-2 border-slate-800 pb-5 mb-6">
        <div className="flex items-center gap-4">
          {churchSettings?.logo_url ? (
            <img
              src={churchSettings.logo_url}
              alt="Church Logo"
              className="h-14 w-auto object-contain"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xl">
              ⛪
            </div>
          )}
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {churchSettings?.church_name || "Church Administration"}
            </h1>
            {churchSettings?.church_address && (
              <p className="text-xs text-slate-500 font-medium">
                {churchSettings.church_address}
              </p>
            )}
          </div>
        </div>

        <div className="text-right">
          <span className="inline-block px-3 py-1 bg-slate-100 text-slate-800 rounded font-mono text-xs font-bold uppercase tracking-wider border border-slate-300">
            OFFICIAL POLL REPORT
          </span>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">
            Generated: {printedAtDate}
          </p>
        </div>
      </div>

      {/* Poll Details Box */}
      <div className="bg-slate-50 border border-slate-300 rounded-lg p-5 mb-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 font-mono">
              Poll Title
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-0.5">
              {poll.title}
            </h2>
          </div>
          <span
            className={`px-2.5 py-1 rounded text-xs font-bold uppercase font-mono tracking-wide ${
              poll.status === "active"
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                : poll.status === "closed"
                ? "bg-slate-200 text-slate-800 border border-slate-300"
                : "bg-amber-100 text-amber-800 border border-amber-300"
            }`}
          >
            Status: {poll.status}
          </span>
        </div>

        {poll.description && (
          <p className="text-sm text-slate-600 mb-4 italic">
            &ldquo;{poll.description}&rdquo;
          </p>
        )}

        <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 font-semibold block text-[10px] uppercase font-mono">
              Voting Timeline
            </span>
            <span className="font-bold text-slate-800">
              {startDateFormatted} — {endDateFormatted}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block text-[10px] uppercase font-mono">
              Voter Access Segment
            </span>
            <span className="font-bold text-slate-800 capitalize">
              {poll.voter_type.replace("_", " ")}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block text-[10px] uppercase font-mono">
              Total Votes Cast
            </span>
            <span className="font-extrabold text-slate-900 text-sm">
              {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Winner Spotlight Section */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono mb-2 flex items-center gap-1.5">
          <Trophy className="h-4 w-4 text-amber-500" />
          Poll Winner Announcement
        </h3>

        {totalVotes === 0 || winners.length === 0 ? (
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center bg-slate-50">
            <p className="text-slate-500 text-sm font-semibold">
              No votes recorded yet for this poll.
            </p>
          </div>
        ) : (
          <div className="border-2 border-amber-400 bg-amber-50/60 rounded-lg p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3 border-b border-amber-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-amber-500 text-white p-1.5 rounded-full">
                  <Trophy className="h-5 w-5" />
                </span>
                <div>
                  <span className="text-xs font-extrabold text-amber-900 uppercase tracking-widest font-mono">
                    {isTie ? "CO-WINNERS (TIE)" : "OFFICIAL WINNER"}
                  </span>
                  <p className="text-xs text-amber-700 font-medium">
                    Highest tally with {maxVotes} vote{maxVotes !== 1 ? "s" : ""} (
                    {Math.round((maxVotes / totalVotes) * 100)}% of total)
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-amber-500 text-white text-xs font-black rounded-full uppercase tracking-wider shadow-xs">
                {isTie ? "TIE WINNERS 🏆" : "WINNER 🏆"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {winners.map((winner, idx) => {
                const pct = Math.round(((winner.votes || 0) / totalVotes) * 100);
                return (
                  <div
                    key={winner.id || idx}
                    className="flex items-center gap-4 bg-white border border-amber-300 rounded-lg p-3 shadow-xs"
                  >
                    {winner.photo_url ? (
                      <img
                        src={winner.photo_url}
                        alt={winner.display_name}
                        className="h-14 w-14 rounded-full object-cover border-2 border-amber-400 shrink-0"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-full bg-amber-100 text-amber-800 font-black flex items-center justify-center text-lg border-2 border-amber-300 shrink-0">
                        {winner.display_name
                          .split(" ")
                          .map((s) => s[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-slate-900 text-base leading-tight truncate">
                        {winner.display_name}
                      </h4>
                      {winner.position && (
                        <p className="text-xs font-semibold text-slate-600">
                          {winner.position}
                        </p>
                      )}
                      <div className="mt-1 flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                          {winner.votes || 0} votes ({pct}%)
                        </span>
                      </div>
                      {winner.nomination_reason && (
                        <p className="text-[11px] text-slate-500 italic mt-1 line-clamp-1">
                          &ldquo;{winner.nomination_reason}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Complete Candidate Standings Table */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono mb-3">
          Complete Candidate Standings
        </h3>

        <table className="w-full text-left border-collapse border border-slate-300 text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-mono text-[11px] uppercase border-b border-slate-300">
              <th className="py-2.5 px-3 border-r border-slate-300 w-12 text-center">
                Rank
              </th>
              <th className="py-2.5 px-3 border-r border-slate-300">
                Candidate Name
              </th>
              <th className="py-2.5 px-3 border-r border-slate-300">
                Citation / Reason
              </th>
              <th className="py-2.5 px-3 border-r border-slate-300 w-24 text-right">
                Votes
              </th>
              <th className="py-2.5 px-3 border-r border-slate-300 w-20 text-right">
                Share
              </th>
              <th className="py-2.5 px-3 w-28 text-center">Result</th>
            </tr>
          </thead>
          <tbody>
            {sortedCandidates.map((cand, idx) => {
              const votes = cand.votes || 0;
              const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
              const isCandidateWinner = maxVotes > 0 && votes === maxVotes;

              return (
                <tr
                  key={cand.id || idx}
                  className={`border-b border-slate-200 ${
                    isCandidateWinner ? "bg-amber-50/50 font-medium" : "even:bg-slate-50/50"
                  }`}
                >
                  <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-bold text-slate-600">
                    {idx === 0 && maxVotes > 0 ? "🥇 1st" : idx === 1 ? "🥈 2nd" : idx === 2 ? "🥉 3rd" : `${idx + 1}th`}
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-200 font-semibold text-slate-900">
                    {cand.display_name}
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-200 text-slate-600 italic">
                    {cand.nomination_reason || "—"}
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono font-bold text-slate-900">
                    {votes}
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono text-slate-700">
                    {pct}%
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {isCandidateWinner ? (
                      <span className="inline-block px-2 py-0.5 bg-amber-400 text-amber-950 rounded font-bold text-[10px] uppercase font-mono">
                        {isTie ? "CO-WINNER" : "WINNER"}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px] font-mono">
                        Runner-up
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Sign-off & Audit Footer */}
      <div className="pt-6 border-t-2 border-slate-800 flex justify-between items-end text-xs text-slate-500">
        <div>
          <p className="font-semibold text-slate-800">
            Church Decision & Polling Ledger System
          </p>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
            Verified electronic vote totals compiled automatically.
          </p>
        </div>

        <div className="text-right">
          <div className="w-48 border-b border-slate-400 mb-1"></div>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
            Authorized Official Signature
          </span>
        </div>
      </div>
    </div>
  );
}
