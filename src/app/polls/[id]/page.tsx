"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { HelpCircle, Loader2, Calendar, AlertCircle, ArrowLeft, CheckCircle2, Search, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Candidate = {
  id: string;
  member_id: string | null;
  display_name: string;
  photo_url: string | null;
  nomination_reason: string | null;
  votes: number | null;
  departments?: string[];
};

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
  poll_candidates: Candidate[];
};

export default function PublicPollPage() {
  const params = useParams<{ id: string }>();
  const pollId = params.id;
  const router = useRouter();

  const [poll, setPoll] = useState<Poll | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedCandidateId, setVotedCandidateId] = useState<string | null>(null);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fingerprint, setFingerprint] = useState("");
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; name: string; depts: string[] } | null>(null);

  useEffect(() => {
    let fp = localStorage.getItem("poll_device_fingerprint");
    if (!fp) {
      fp = "fp_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("poll_device_fingerprint", fp);
    }
    setFingerprint(fp);
  }, []);

  const loadPollDetails = async (fpVal = fingerprint) => {
    if (!pollId) return;
    setLoading(true);
    try {
      const fpParam = fpVal ? `?fingerprint=${fpVal}` : "";
      const res = await fetch(`/api/polls/${pollId}${fpParam}`);
      const data = await res.json();

      if (res.status === 401 || data.error?.includes("Authentication is required")) {
        router.push("/login");
      } else if (res.ok) {
        setPoll(data.poll);
        setHasVoted(data.hasVoted);
        setVotedCandidateId(data.votedCandidateId);
        setTotalVotes(data.totalVotes);
      } else {
        toast.error(data.error || "Failed to load poll details");
      }
    } catch {
      toast.error("Failed to load poll details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fingerprint) {
      loadPollDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollId, fingerprint]);

  const handleVoteSubmit = async () => {
    if (!selectedCandidate || !pollId) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: selectedCandidate,
          fingerprint,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Thank you! Your vote has been recorded.");
        setSelectedCandidate(null);
        loadPollDetails();
      } else {
        toast.error(data.error || "Failed to submit vote");
      }
    } catch {
      toast.error("Error submitting vote. Please check your internet connection.");
    } finally {
      setSubmitting(false);
    }
  };

  const isPollExpired = poll ? new Date() > new Date(poll.ends_at) : false;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-slate-500 font-semibold tracking-wide">Resolving ballot details...</p>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <Card className="border-slate-200 shadow-xs">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">Poll Unavailable</h3>
            <p className="text-slate-500 text-sm max-w-xs mt-1.5 leading-normal">
              This poll might have been deleted, closed, or you do not have permission to view it.
            </p>
            <Button onClick={() => router.push("/polls")} variant="outline" className="mt-6 rounded-xl">
              Back to Portal
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active Deadline String Formatter
  const deadlineStr = `Voting closes ${new Date(poll.ends_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  return (
    <div className="min-h-screen bg-(--surface) pb-24 sm:pb-8">
      <PageHeader
        eyebrow="Decision Ballot"
        title={poll.title}
        description={poll.description || undefined}
        actions={
          <Button
            onClick={() => router.push("/polls")}
            // variant="ghost"
            // size="sm"
            // className="-ml-3 h-8 text-(--outline) hover:bg-(--surface-container-low) rounded-md"
          >
            <ArrowLeft className="mr-1.5 size-4" />
            Back to Portal
          </Button>
        }
        // meta={
        //   <div className="flex items-center gap-2">
        //     <Badge
        //       variant="outline"
        //       className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wider ${
        //         poll.status === "active" && !isPollExpired
        //           ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        //           : "bg-slate-100 text-slate-500 border-slate-200"
        //       }`}
        //     >
        //       {poll.status === "active" && !isPollExpired ? "ACTIVE" : "CLOSED"}
        //     </Badge>
        //     <Badge
        //       variant="outline"
        //       className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wider capitalize bg-slate-50 text-slate-500 border-slate-200"
        //     >
        //       {poll.voter_type.replace("_", " ")}
        //     </Badge>
        //   </div>
        // }
      />

      <main className="w-full space-y-6 p-4 md:p-8 pb-32">
        {/* Voting Deadline and Status Summary Card */}
        <div className="flex justify-between items-center bg-white border border-(--outline-variant)/60 px-5 py-4 rounded-2xl shadow-xs text-xs text-slate-500">
          <span className="font-semibold text-slate-600">
            Voter Access: <span className="capitalize text-slate-800">{poll.voter_type.replace("_", " ")}</span>
          </span>
          <span className="flex items-center gap-1.5 font-bold text-slate-700">
            <Calendar className="h-4 w-4 text-primary" />
            {deadlineStr}
          </span>
        </div>

        <div>
          {hasVoted ? (
            /* Voted Standings Mode */
            <div className="bg-white border border-(--outline-variant)/60 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-6 md:p-8 border-b border-slate-100 bg-emerald-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base">Your Ballot is Cast</h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      Thank you! Your selection is cryptographically registered.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-500 font-mono bg-slate-100 border border-slate-200/60 px-3 py-1.5 rounded-xl">
                  Total Ballots: {totalVotes}
                </span>
              </div>

              <div className="p-6 md:p-8 space-y-6">
                {poll.allow_view_results ? (
                  /* Dynamic standings list */
                  <div className="space-y-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Current Tally Standings
                    </h4>

                    <div className="space-y-6">
                      {poll.poll_candidates.map(cand => {
                        const votes = cand.votes || 0;
                        const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                        const isUserSelection = cand.id === votedCandidateId;

                        return (
                          <div
                            key={cand.id}
                            className="flex flex-col sm:flex-row sm:items-center gap-4 bg-slate-50/50 border border-slate-100 p-4 rounded-xl"
                          >
                            {/* Nominee Profile info */}
                            <div className="flex items-center gap-3 shrink-0 sm:w-1/3">
                              <div
                                onClick={e => {
                                  e.stopPropagation();
                                  setPreviewPhoto({
                                    url: cand.photo_url || "",
                                    name: cand.display_name,
                                    depts: cand.departments || [],
                                  });
                                }}
                                className="relative group shrink-0 cursor-zoom-in"
                              >
                                <Avatar className="h-12 w-12 border border-slate-200 shadow-xs shrink-0 transition-transform duration-300 hover:scale-105">
                                  <AvatarImage src={cand.photo_url || ""} alt={cand.display_name} />
                                  <AvatarFallback className="bg-primary/5 text-primary font-bold text-sm">
                                    {cand.display_name
                                      .split(" ")
                                      .map(s => s[0])
                                      .join("")
                                      .substring(0, 2)
                                      .toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full flex items-center justify-center text-white">
                                  <Search className="size-3.5" />
                                </div>
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-800 text-sm truncate flex items-center gap-1.5">
                                  {cand.display_name}
                                  {isUserSelection && (
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] font-bold px-1.5 py-0 bg-emerald-100 text-emerald-700 border-emerald-200"
                                    >
                                      Selected
                                    </Badge>
                                  )}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {(cand.departments || []).map((dep, i) => (
                                    <span
                                      key={i}
                                      className="text-[9px] bg-slate-200/50 text-slate-500 font-semibold px-1.5 py-0.5 rounded-md"
                                    >
                                      {dep}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="flex-1 space-y-1">
                              <div className="flex justify-between text-xs font-semibold">
                                <span className="text-slate-400 font-mono">Tally: {votes} votes</span>
                                <span className="text-slate-700 font-mono">{pct}%</span>
                              </div>
                              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-100">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${isUserSelection ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gradient-to-r from-primary to-blue-500"}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 border rounded-2xl bg-slate-50/50 flex flex-col items-center justify-center text-center">
                    <HelpCircle className="h-12 w-12 text-slate-400 mb-3" />
                    <h4 className="font-bold text-slate-800 text-sm">Standings Locked</h4>
                    <p className="text-xs text-slate-500 max-w-sm mt-1.5 leading-normal">
                      The administrator has configured this poll to keep results hidden until the voting timeline
                      concludes.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : isPollExpired ? (
            /* Closed Ballot View */
            <div className="bg-white border border-(--outline-variant)/60 rounded-2xl shadow-xs p-8 text-center space-y-4">
              <div className="h-16 w-16 bg-slate-50 border border-dashed rounded-full flex items-center justify-center mx-auto border-slate-200">
                <AlertCircle className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Voting Period Concluded</h3>
              <p className="text-slate-500 text-sm max-w-xs mx-auto leading-normal">
                This poll concluded on {new Date(poll.ends_at).toLocaleString()}. You can no longer participate.
              </p>
            </div>
          ) : (
            /* Voting Selection Mode */
            <div className="space-y-4">
              <div className="border-b border-slate-200/60 pb-3">
                <span className="text-sm font-bold text-slate-700 tracking-tight">Select one nominee</span>
              </div>

              {/* Vertically Stacked Nominee Cards */}
              <div className="flex flex-col gap-3">
                {poll.poll_candidates.map(cand => {
                  const isSelected = selectedCandidate === cand.id;

                  return (
                    <div
                      key={cand.id}
                      onClick={() => setSelectedCandidate(cand.id)}
                      className={`group relative flex items-center justify-between p-4 md:p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                        isSelected
                          ? "border-primary bg-primary/[0.03] shadow-xs"
                          : "border-slate-200/80 bg-white hover:border-primary/45 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Nominee Avatar */}
                        <div
                          onClick={e => {
                            e.stopPropagation();
                            setPreviewPhoto({
                              url: cand.photo_url || "",
                              name: cand.display_name,
                              depts: cand.departments || [],
                            });
                          }}
                          className="relative group/avatar shrink-0"
                        >
                          <Avatar className="h-16 w-16 md:h-20 md:w-20 border-2 border-slate-200 shadow-xs transition-transform duration-300 group-hover/avatar:scale-102 group-hover/avatar:border-primary cursor-zoom-in">
                            <AvatarImage src={cand.photo_url || ""} alt={cand.display_name} className="object-cover" />
                            <AvatarFallback className="bg-primary/5 text-primary font-extrabold text-lg">
                              {cand.display_name
                                .split(" ")
                                .map(s => s[0])
                                .join("")
                                .substring(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {/* Hover search overlay */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300 rounded-full flex items-center justify-center text-white cursor-zoom-in">
                            <Search className="size-4.5" />
                          </div>
                        </div>

                        {/* Nominee details */}
                        <div className="min-w-0 space-y-1.5">
                          <h4
                            className={`font-bold text-base transition-colors ${isSelected ? "text-primary" : "text-slate-800 group-hover:text-primary"}`}
                          >
                            {cand.display_name}
                          </h4>

                          {/* Department chips */}
                          <div className="flex flex-wrap gap-1">
                            {(cand.departments || []).length > 0 ? (
                              (cand.departments || []).map((dep, i) => (
                                <span
                                  key={i}
                                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                    isSelected
                                      ? "bg-primary/10 text-primary"
                                      : "bg-slate-100 text-slate-500 border border-slate-200/40"
                                  }`}
                                >
                                  {dep}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-400 italic font-medium">No units assigned</span>
                            )}
                          </div>

                          {cand.nomination_reason && (
                            <p className="text-xs text-slate-400 leading-normal line-clamp-1 italic">
                              &ldquo;{cand.nomination_reason}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right side check/radio indicator */}
                      <div className="shrink-0 pl-3">
                        <div
                          className={`h-6.5 w-6.5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                            isSelected ? "border-primary bg-primary text-white shadow-xs" : "border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-white" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Floating / Sticky Action Vote Bar */}
              <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-slate-200/80 px-6 py-4 flex flex-col sm:flex-row justify-between items-center max-w-4xl mx-auto rounded-t-3xl shadow-lg md:bottom-4 md:rounded-3xl md:left-4 md:right-4 md:border">
                <div className="hidden sm:block text-left min-w-0 pr-4">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Active Ballot Selection
                  </span>
                  <p className="text-sm font-extrabold text-slate-800 truncate max-w-[240px] mt-0.5">
                    {selectedCandidate
                      ? poll.poll_candidates.find(c => c.id === selectedCandidate)?.display_name
                      : "Please select a nominee"}
                  </p>
                </div>
                <Button
                  onClick={handleVoteSubmit}
                  disabled={submitting || !selectedCandidate}
                  className="w-full sm:w-auto h-11 px-10 rounded-xl font-bold tracking-tight bg-primary text-white shadow-sm hover:bg-primary/95 transition-all duration-300"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4.5 w-4.5 animate-spin" />
                      Casting ballot...
                    </>
                  ) : (
                    "Submit Vote"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Audit and Security Information */}
      {/* <div className="max-w-xl mx-auto w-full text-center text-xs text-slate-400 mt-12 border-t border-slate-100 pt-6">
        <span className="flex items-center justify-center gap-1.5 font-semibold text-slate-400 bg-slate-50 border border-slate-100 w-fit mx-auto px-3 py-1 rounded-full shadow-xs">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          End-to-End Cryptographic Vote verification enabled
        </span>
      </div> */}

      {/* Zoom Nominee Image Dialog */}
      <Dialog
        open={!!previewPhoto}
        onOpenChange={open => {
          if (!open) setPreviewPhoto(null);
        }}
      >
        <DialogContent className="max-w-md p-0 overflow-hidden border-(--outline-variant) bg-white">
          <DialogHeader className="p-6 pb-4 text-left border-b border-slate-100">
            <DialogTitle className="font-headline text-lg font-bold text-slate-900">{previewPhoto?.name}</DialogTitle>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {previewPhoto?.depts.map((d, i) => (
                <span
                  key={i}
                  className="text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200/40 px-2 py-0.5 rounded-full"
                >
                  {d}
                </span>
              ))}
            </div>
          </DialogHeader>
          <div className="relative aspect-square w-full bg-slate-50 flex items-center justify-center p-4">
            {previewPhoto?.url ? (
              <img
                src={previewPhoto.url}
                alt={previewPhoto?.name}
                className="max-h-full max-w-full rounded-lg object-contain shadow-xs border border-slate-200/60"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400">
                <User className="size-16 stroke-1 mb-2" />
                <span className="text-xs font-semibold">No profile image available</span>
              </div>
            )}
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
            <Button
              onClick={() => setPreviewPhoto(null)}
              variant="outline"
              className="rounded-xl h-9.5 text-xs font-bold"
            >
              Close Preview
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
