"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Vote, ShieldCheck, HelpCircle, Loader2, Calendar, AlertCircle, Phone, ArrowLeft, ArrowRight, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Candidate = {
  id: string;
  member_id: string | null;
  display_name: string;
  photo_url: string | null;
  nomination_reason: string | null;
  votes: number | null;
};

type Poll = {
  id: string;
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
  
  // Auth state for restricted polls
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [authError, setAuthError] = useState("");

  // Fingerprint state
  const [fingerprint, setFingerprint] = useState("");

  // Church Identity
  const [churchName, setChurchName] = useState("Church Portal");

  useEffect(() => {
    // 1. Fetch or generate a simple browser fingerprint saved in localstorage
    let fp = localStorage.getItem("poll_device_fingerprint");
    if (!fp) {
      fp = "fp_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("poll_device_fingerprint", fp);
    }
    setFingerprint(fp);

    // 2. Fetch Church Identity Settings
    fetch("/api/church-settings")
      .then(res => res.json())
      .then(data => {
        if (data.church_name) setChurchName(data.church_name);
      })
      .catch(e => console.error("Could not fetch church identity", e));
  }, []);

  const loadPollDetails = async (fpVal = fingerprint) => {
    if (!pollId) return;
    setLoading(true);
    try {
      const fpParam = fpVal ? `?fingerprint=${fpVal}` : "";
      const res = await fetch(`/api/polls/${pollId}${fpParam}`);
      const data = await res.json();
      
      if (res.status === 401 || data.error?.includes("Authentication is required")) {
        setRequiresAuth(true);
      } else if (res.ok) {
        setPoll(data.poll);
        setHasVoted(data.hasVoted);
        setVotedCandidateId(data.votedCandidateId);
        setTotalVotes(data.totalVotes);
        setRequiresAuth(false);
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
        // Refresh poll results
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

  const handleMemberVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (!phoneNumber.trim()) return;

    setVerifying(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "member_login",
          phone_number: phoneNumber.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Authenticated successfully!");
        setRequiresAuth(false);
        loadPollDetails();
      } else {
        setAuthError(data.error || "We could not find a member profile matching that phone number.");
      }
    } catch {
      setAuthError("Failed to reach authentication server. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const isPollExpired = poll ? new Date() > new Date(poll.ends_at) : false;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-slate-500 font-medium">Loading poll configurations...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50 flex flex-col justify-between py-12 px-4 sm:px-6">
      {/* Top Header */}
      <div className="max-w-xl mx-auto w-full text-center mb-8">
        <span className="font-mono text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1.5 rounded-full">
          {churchName}
        </span>
        <h2 className="text-xl font-bold mt-3 text-slate-900">Decision Portal</h2>
      </div>

      <div className="max-w-xl mx-auto w-full flex-1 flex flex-col justify-center">
        {requiresAuth ? (
          /* Phone Verification Card */
          <Card className="border-slate-200/80 shadow-md">
            <CardHeader className="text-center pb-2 bg-slate-50/50 border-b border-slate-100">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl text-slate-800">Verification Required</CardTitle>
              <CardDescription>
                This poll is restricted to verified church congregation members or workers.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleMemberVerify} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="e.g. 08031234567"
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value)}
                      className="pl-9 h-11 border-slate-200"
                      required
                    />
                  </div>
                  <p className="text-xs text-slate-400">Enter the phone number associated with your church profile.</p>
                </div>

                {authError && (
                  <div className="flex gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <Button type="submit" className="w-full h-11" disabled={verifying}>
                  {verifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      Verify Identity
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : !poll ? (
          /* Poll Not Found Card */
          <Card className="border-slate-200 shadow-md">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">Poll Unavailable</h3>
              <p className="text-slate-500 text-sm max-w-xs mt-1">
                This poll might have been deleted, closed, or you do not have permission to view it.
              </p>
            </CardContent>
          </Card>
        ) : (
          /* Main Poll / Voting Interface */
          <Card className="border-slate-200/80 shadow-md overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <div className="flex justify-between items-center mb-2">
                <Badge variant={poll.status === "active" ? "success" : "secondary"}>
                  {poll.status === "active" ? "ACTIVE" : "CLOSED"}
                </Badge>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Ends {new Date(poll.ends_at).toLocaleDateString()}
                </span>
              </div>
              <CardTitle className="text-xl text-slate-900">{poll.title}</CardTitle>
              {poll.description && (
                <CardDescription className="text-slate-500 mt-1">
                  {poll.description}
                </CardDescription>
              )}
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {hasVoted ? (
                /* Post-Vote view (receipt & optional standings) */
                <div className="space-y-6">
                  <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/30 flex items-center gap-3">
                    <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                      <UserCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">Ballot Cast Successfully</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Your vote has been verified and permanently counted.</p>
                    </div>
                  </div>

                  {poll.allow_view_results ? (
                    /* Show standings list */
                    <div className="space-y-4">
                      <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Standings</span>
                        <span className="text-xs text-slate-500 font-medium">Total Ballots: {totalVotes}</span>
                      </div>
                      
                      <div className="space-y-4">
                        {poll.poll_candidates.map(cand => {
                          const votes = cand.votes || 0;
                          const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                          const isUserVote = cand.id === votedCandidateId;

                          return (
                            <div key={cand.id} className="space-y-1.5">
                              <div className="flex justify-between items-center text-sm font-semibold">
                                <span className="flex items-center gap-1.5 text-slate-800">
                                  {cand.display_name}
                                  {isUserVote && (
                                    <Badge variant="outline" className="text-[9px] font-normal text-emerald-600 border-emerald-200 bg-emerald-50">
                                      Your Selection
                                    </Badge>
                                  )}
                                </span>
                                <span className="text-slate-500 font-medium">{pct}%</span>
                              </div>
                              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-100">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${isUserVote ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-primary to-blue-500'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* Standing results hidden by admin */
                    <div className="p-6 border rounded-xl bg-slate-50/50 flex flex-col items-center justify-center text-center">
                      <HelpCircle className="h-10 w-10 text-slate-400 mb-2" />
                      <h4 className="font-semibold text-slate-700 text-sm">Standings Locked</h4>
                      <p className="text-xs text-slate-500 max-w-xs mt-1">
                        The administrator has configured this poll to keep results hidden until the voting timeline concludes.
                      </p>
                    </div>
                  )}
                </div>
              ) : isPollExpired ? (
                /* Poll Ended View */
                <div className="p-6 border rounded-xl bg-slate-50/50 flex flex-col items-center justify-center text-center">
                  <AlertCircle className="h-10 w-10 text-slate-400 mb-2" />
                  <h4 className="font-semibold text-slate-700 text-sm">Voting Period Ended</h4>
                  <p className="text-xs text-slate-500 max-w-xs mt-1">
                    This poll concluded on {new Date(poll.ends_at).toLocaleString()}. Votes can no longer be cast.
                  </p>
                </div>
              ) : (
                /* Nominee Cards list for voting */
                <div className="space-y-4">
                  <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Candidates List</span>
                    <span className="text-xs text-slate-400">Select one option</span>
                  </div>

                  <div className="space-y-3">
                    {poll.poll_candidates.map(cand => {
                      const isSelected = selectedCandidate === cand.id;

                      return (
                        <div
                          key={cand.id}
                          onClick={() => setSelectedCandidate(cand.id)}
                          className={`group flex items-center justify-between gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-sm"
                              : "border-slate-200 bg-white hover:border-primary/50 hover:bg-slate-50/30"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 border-2 border-background shadow-sm shrink-0">
                              <AvatarImage src={cand.photo_url || ""} alt={cand.display_name} />
                              <AvatarFallback className="bg-primary/5 text-primary font-bold text-sm">
                                {cand.display_name.split(" ").map(s => s[0]).join("").substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className={`font-semibold text-sm transition-colors ${isSelected ? 'text-primary' : 'text-slate-800 group-hover:text-primary'}`}>
                                {cand.display_name}
                              </p>
                              {cand.nomination_reason && (
                                <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{cand.nomination_reason}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-center shrink-0">
                            <div className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${
                              isSelected ? 'border-primary bg-primary text-white' : 'border-slate-300 bg-white'
                            }`}>
                              {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Button
                    onClick={handleVoteSubmit}
                    className="w-full h-11 mt-4 text-base font-semibold"
                    disabled={submitting || !selectedCandidate}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Submitting Vote...
                      </>
                    ) : (
                      "Cast Ballot"
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer Info */}
      <div className="max-w-xl mx-auto w-full text-center text-xs text-slate-400 mt-8">
        <span className="flex items-center justify-center gap-1">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          End-to-End Cryptographic Vote verification
        </span>
      </div>
    </div>
  );
}
