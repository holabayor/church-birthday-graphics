"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Vote, ShieldCheck, HelpCircle, Loader2, Calendar, AlertCircle, Phone, ArrowRight, UserCheck, Search, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [churchName, setChurchName] = useState("Church Portal");

  // Auth state
  const [member, setMember] = useState<{ id: string; name: string } | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [authError, setAuthError] = useState("");

  // Fingerprint state
  const [fingerprint, setFingerprint] = useState("");

  const checkAuthAndLoad = async () => {
    setLoading(true);
    try {
      // 1. Resolve current auth status
      const authRes = await fetch("/api/auth");
      if (authRes.ok) {
        const authJson = await authRes.json();
        if (authJson.member) {
          setMember(authJson.member);
        } else {
          setMember(null);
        }
      }

      // 2. Fetch eligible polls
      let fp = localStorage.getItem("poll_device_fingerprint") || "";
      const fpParam = fp ? `?fingerprint=${fp}` : "";
      const res = await fetch(`/api/polls${fpParam}`);
      const data = await res.json();
      if (res.ok) {
        // Only active polls should be shown
        setPolls(data.data || []);
      }
    } catch (e) {
      console.error("Failed to load details", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Generate or fetch fingerprint
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

    checkAuthAndLoad();
  }, []);

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
        toast.success(`Welcome back, ${data.name}!`);
        setPhoneNumber("");
        checkAuthAndLoad();
      } else {
        setAuthError(data.error || "We could not find a member profile matching that phone number.");
      }
    } catch {
      setAuthError("Failed to reach authentication server. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
      if (res.ok) {
        toast.success("Signed out successfully");
        setMember(null);
        checkAuthAndLoad();
      }
    } catch {
      toast.error("Failed to sign out");
    }
  };

  const filteredPolls = useMemo(() => {
    return polls.filter(poll =>
      poll.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (poll.description || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [polls, searchQuery]);

  if (loading && polls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-slate-500 font-medium">Checking authorizations...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50 flex flex-col justify-between py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto w-full flex-1">
        {/* Top Header */}
        <div className="text-center mb-10">
          <span className="font-mono text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1.5 rounded-full">
            {churchName}
          </span>
          <h2 className="text-3xl font-extrabold mt-3 text-slate-900">Decision Portal</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
            Participate in active congregation surveys, polls, and unit nominations.
          </p>
        </div>

        {/* Auth / Welcome Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 items-start">
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="search"
                  placeholder="Search active polls..."
                  className="pl-9 h-10 border-slate-200/80 bg-white"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Polls Listing */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Active Polls ({filteredPolls.length})</h3>

              {filteredPolls.length === 0 ? (
                <Card className="border-slate-200/80 shadow-xs">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-14 w-14 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-dashed border-slate-200">
                      <Vote className="h-6 w-6 text-slate-400" />
                    </div>
                    <h4 className="font-bold text-slate-800">No Open Polls Found</h4>
                    <p className="text-slate-500 text-sm max-w-xs mt-1">
                      There are currently no active polls matching your search or eligibility criteria.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredPolls.map(poll => {
                    const isVoted = poll.has_voted;
                    const isEligible = poll.is_eligible !== false;
                    const endsDate = new Date(poll.ends_at);
                    
                    return (
                      <Card
                        key={poll.id}
                        onClick={() => {
                          if (isEligible) {
                            router.push(`/polls/${poll.slug || poll.id}`);
                          } else {
                            toast.error("You are not eligible to participate in this poll.");
                          }
                        }}
                        className={`border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all duration-200 rounded-xl cursor-pointer ${
                          !isEligible ? "opacity-75 bg-slate-50/50 hover:border-slate-200 cursor-not-allowed" : "hover:border-primary/45"
                        }`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start mb-2">
                            <Badge
                              variant="outline"
                              className={
                                isVoted
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                  : !isEligible
                                  ? "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-100"
                                  : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50"
                              }
                            >
                              {isVoted ? "VOTED" : !isEligible ? "RESTRICTED" : "ELIGIBLE"}
                            </Badge>
                            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5">
                              <Calendar className="h-3 w-3" />
                              Ends {endsDate.toLocaleDateString()}
                            </span>
                          </div>
                          <CardTitle className="text-base text-slate-800 font-bold line-clamp-1">
                            {poll.title}
                          </CardTitle>
                          {poll.description && (
                            <CardDescription className="text-xs text-slate-400 line-clamp-2 mt-1">
                              {poll.description}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="pt-2">
                          <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-3">
                            <span className="capitalize">
                              {poll.voter_type.replace("_", " ")}
                            </span>
                            <span className="font-semibold text-slate-600">
                              {poll.poll_candidates.length} Nominees
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Auth panel */}
          <div className="space-y-6">
            {member ? (
              /* Signed In Profile Card */
              <Card className="border-slate-200/80 shadow-xs overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <UserCheck className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-400 font-medium">Logged in Member</p>
                      <h4 className="font-bold text-sm text-slate-800 truncate">{member.name}</h4>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    You have access to surveys and ballot selections targeted to your church units and membership tier.
                  </p>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full text-slate-600 hover:text-red-600 hover:bg-red-50 border-slate-200"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </CardContent>
              </Card>
            ) : (
              /* Phone Sign-In Card */
              <Card className="border-slate-200/80 shadow-xs">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-2 text-primary">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base text-slate-800">Identify Profile</CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Verify your phone number to access private member and worker-specific polls.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <form onSubmit={handleMemberVerify} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="sidebar-phone" className="text-xs font-semibold text-slate-600">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <Input
                          id="sidebar-phone"
                          type="tel"
                          placeholder="e.g. 08031234567"
                          value={phoneNumber}
                          onChange={e => setPhoneNumber(e.target.value)}
                          className="pl-9 h-10 border-slate-200"
                          required
                        />
                      </div>
                    </div>

                    {authError && (
                      <div className="flex gap-2 p-2.5 bg-red-50 border border-red-100 rounded-lg text-[11px] text-red-600 leading-normal">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{authError}</span>
                      </div>
                    )}

                    <Button type="submit" className="w-full h-10 text-xs font-semibold" disabled={verifying}>
                      {verifying ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          Verify Phone
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            <div className="p-4 bg-slate-50 border border-slate-200/40 rounded-xl space-y-2 text-center text-xs text-slate-400">
              <span className="flex items-center justify-center gap-1 font-semibold text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                Secure voting channel
              </span>
              <p className="leading-normal">
                Kinship prevents device fraud using IP logging and unique browser signature checks.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto w-full text-center text-xs text-slate-400 mt-12 border-t border-slate-100 pt-6">
        <span>© {new Date().getFullYear()} {churchName} Voting Portal. End-to-end audit trails enabled.</span>
      </div>
    </div>
  );
}
