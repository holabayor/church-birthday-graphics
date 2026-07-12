"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Share2, Trash2, Play, Square, Users, Vote, Loader2, Calendar, Info } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MemberSearchAutocomplete } from "@/components/units/member-search-autocomplete";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

type Candidate = {
  id?: string;
  member_id: string | null;
  display_name: string;
  photo_url: string | null;
  nomination_reason: string | null;
  votes?: number | null;
};

type Poll = {
  id: string;
  title: string;
  slug?: string | null;
  description: string | null;
  voter_type: "anyone" | "members" | "workers" | "selected_groups";
  allowed_groups: string[];
  status: "draft" | "active" | "closed";
  allow_view_results: boolean;
  starts_at: string;
  ends_at: string;
  created_at: string;
  poll_candidates: Candidate[];
};

export default function PollsAdminPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog controls
  const [createOpen, setCreateOpen] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [pollResults, setPollResults] = useState<{ poll: Poll; totalVotes: number } | null>(null);
  const [loadingResults, setLoadingResults] = useState(false);

  // Edit Period states
  const [editPeriodOpen, setEditPeriodOpen] = useState(false);
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null);
  const [editStartsAt, setEditStartsAt] = useState("");
  const [editEndsAt, setEditEndsAt] = useState("");
  const [editAllowViewResults, setEditAllowViewResults] = useState(true);
  const [updatingPeriod, setUpdatingPeriod] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [voterType, setVoterType] = useState<"anyone" | "members" | "workers" | "selected_groups">("anyone");
  const [allowedGroups, setAllowedGroups] = useState<string[]>([]);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [allowViewResults, setAllowViewResults] = useState(true);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Temporary autocomplete states
  const [tempMemberId, setTempMemberId] = useState<string | null>(null);
  const [tempMemberName, setTempMemberName] = useState<string>("");

  // Church Units (for selected groups filter)
  const [units, setUnits] = useState<{ id: string; name: string }[]>([]);

  const fetchPolls = async () => {
    try {
      const res = await fetch("/api/polls");
      const data = await res.json();
      if (res.ok) {
        setPolls(data.data || []);
      } else {
        toast.error(data.error || "Failed to load polls");
      }
    } catch {
      toast.error("Failed to fetch polls");
    } finally {
      setLoading(false);
    }
  };

  const fetchUnits = async () => {
    try {
      const res = await fetch("/api/units");
      const data = await res.json();
      if (res.ok) {
        setUnits(data.data || []);
      }
    } catch (e) {
      console.error("Failed to load units for polling setup", e);
    }
  };

  useEffect(() => {
    fetchPolls();
    fetchUnits();
  }, []);

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startsAt || !endsAt) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (candidates.length < 2) {
      toast.error("Please add at least 2 candidates/nominees");
      return;
    }

    setSubmitting(true);
    try {
      const isEdit = !!editingPoll;
      const url = isEdit ? `/api/polls/${editingPoll.id}` : "/api/polls";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          voter_type: voterType,
          allowed_groups: allowedGroups,
          starts_at: new Date(startsAt).toISOString(),
          ends_at: new Date(endsAt).toISOString(),
          allow_view_results: allowViewResults,
          candidates: candidates.map(c => ({
            member_id: c.member_id,
            display_name: c.display_name,
            photo_url: c.photo_url,
            nomination_reason: c.nomination_reason,
          })),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(isEdit ? "Poll updated successfully" : "Poll created successfully");
        setCreateOpen(false);
        resetForm();
        fetchPolls();
      } else {
        toast.error(data.error || "Failed to save poll");
      }
    } catch {
      toast.error("Network error saving poll");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEditDraft = (poll: Poll) => {
    setEditingPoll(poll);
    setTitle(poll.title);
    setDescription(poll.description || "");
    setVoterType(poll.voter_type);
    setAllowedGroups(poll.allowed_groups || []);
    
    const localStart = new Date(new Date(poll.starts_at).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const localEnd = new Date(new Date(poll.ends_at).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setStartsAt(localStart);
    setEndsAt(localEnd);
    
    setAllowViewResults(poll.allow_view_results);
    setCandidates(poll.poll_candidates || []);
    setCreateOpen(true);
  };

  const handleUpdatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPoll) return;
    setUpdatingPeriod(true);
    try {
      const res = await fetch(`/api/polls/${editingPoll.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          starts_at: new Date(editStartsAt).toISOString(),
          ends_at: new Date(editEndsAt).toISOString(),
          allow_view_results: editAllowViewResults,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Voting period updated successfully");
        setEditPeriodOpen(false);
        fetchPolls();
      } else {
        toast.error(data.error || "Failed to update voting period");
      }
    } catch {
      toast.error("Failed to update voting period");
    } finally {
      setUpdatingPeriod(false);
    }
  };

  const togglePollStatus = async (poll: Poll, newStatus: "active" | "closed") => {
    try {
      const res = await fetch(`/api/polls/${poll.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success(`Poll status updated to ${newStatus}`);
        fetchPolls();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update status");
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDeletePoll = async (id: string) => {
    const targetPoll = polls.find(p => p.id === id);
    if (targetPoll?.status === "active") {
      toast.error("Ongoing/active polls cannot be deleted. Please close the poll first.");
      return;
    }

    if (!confirm("Are you sure you want to delete this poll? This will erase all votes cast.")) return;

    try {
      const res = await fetch(`/api/polls/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Poll deleted");
        fetchPolls();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete poll");
      }
    } catch {
      toast.error("Failed to delete poll");
    }
  };

  const handleViewResults = async (poll: Poll) => {
    setActivePoll(poll);
    setResultsOpen(true);
    setLoadingResults(true);

    try {
      const res = await fetch(`/api/polls/${poll.id}`);
      const data = await res.json();
      if (res.ok) {
        setPollResults(data);
      } else {
        toast.error(data.error || "Failed to load results");
      }
    } catch {
      toast.error("Failed to load results");
    } finally {
      setLoadingResults(false);
    }
  };

  const handleShareLink = (identifier: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/polls/${identifier}`;
    navigator.clipboard.writeText(url);
    toast.success("Voter link copied to clipboard!");
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setVoterType("anyone");
    setAllowedGroups([]);
    setStartsAt("");
    setEndsAt("");
    setAllowViewResults(true);
    setCandidates([]);
    setTempMemberId(null);
    setTempMemberName("");
    setEditingPoll(null);
  };

  const handleAddCandidate = (memberId: string, fullName: string, photoUrl?: string | null) => {
    if (candidates.some(c => c.member_id === memberId)) {
      toast.info(`${fullName} is already added as a candidate`);
      return;
    }

    const newCandidate: Candidate = {
      member_id: memberId,
      display_name: fullName,
      photo_url: photoUrl || null,
      nomination_reason: "",
    };

    setCandidates([...candidates, newCandidate]);
  };

  const handleAddCustomCandidate = (name: string) => {
    if (!name.trim()) return;
    const newCandidate: Candidate = {
      member_id: null,
      display_name: name.trim(),
      photo_url: null,
      nomination_reason: "",
    };
    setCandidates([...candidates, newCandidate]);
  };

  const handleRemoveCandidate = (index: number) => {
    setCandidates(candidates.filter((_, i) => i !== index));
  };

  const handleUpdateCandidateReason = (index: number, reason: string) => {
    const updated = [...candidates];
    updated[index].nomination_reason = reason;
    setCandidates(updated);
  };

  const handleToggleGroup = (groupId: string) => {
    if (allowedGroups.includes(groupId)) {
      setAllowedGroups(allowedGroups.filter(id => id !== groupId));
    } else {
      setAllowedGroups([...allowedGroups, groupId]);
    }
  };

  const filteredPolls = polls.filter(poll => poll.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex-1 w-full bg-(--background)] min-h-screen">
      <PageHeader
        eyebrow="Congregation Engagement"
        title="Polls & Voting"
        description="Create and manage voting polls for selecting the best workers, leaders, or other congregational decisions."
        actions={
          <Button
            onClick={() => {
              resetForm();
              setCreateOpen(true);
            }}
            variant="secondary"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Poll
          </Button>
        }
      />

      <main className="space-y-6 p-4 md:p-8">
        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--outline)]" />
          <Input
            type="search"
            placeholder="Search polls..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="h-11 border-(--outline-variant) bg-white pl-10 shadow-sm"
          />
        </div>

        {/* Directory Listing */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="border-(--outline-variant) bg-white">
                <CardHeader>
                  <Skeleton className="h-5 w-40 mb-2" />
                  <Skeleton className="h-4 w-60" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPolls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-(--outline-variant) shadow-sm">
            <div className="h-16 w-16 bg-slate-50 border border-dashed rounded-full flex items-center justify-center mb-4 border-(--outline-variant)">
              <Vote className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="font-semibold text-lg text-[#0B1C30]">No polls found</h3>
            <p className="text-slate-500 text-sm max-w-xs mt-1">
              Create a new poll to gather feedback or vote for workers of the month.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPolls.map(poll => {
              const start = new Date(poll.starts_at).toLocaleDateString();
              const end = new Date(poll.ends_at).toLocaleDateString();
              const isActivePoll = poll.status === "active";
              const isClosedPoll = poll.status === "closed";

              return (
                <Card
                  key={poll.id}
                  className="border-(--outline-variant) bg-white flex flex-col justify-between shadow-xs rounded-xl hover:border-primary/50 hover:shadow-sm transition-all duration-200"
                >
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <Badge
                        variant="outline"
                        className={
                          isActivePoll
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                            : isClosedPoll
                              ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-50"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-50"
                        }
                      >
                        {poll.status.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                        <Calendar className="h-3 w-3" />
                        {start} - {end}
                      </span>
                    </div>
                    <CardTitle className="line-clamp-1 text-[#0B1C30] font-semibold text-lg">{poll.title}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1 text-(--on-surface-variant) text-sm">
                      {poll.description || "No description provided."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-xs border-t border-(--outline-variant)/60 pt-3 text-(--on-surface-variant)">
                      <span className="flex items-center gap-1 font-medium capitalize">
                        <Users className="h-3.5 w-3.5 text-(--secondary)]" />
                        {poll.voter_type.replace("_", " ")}
                      </span>
                      <span className="font-semibold text-[#0B1C30] font-mono">
                        {poll.poll_candidates.length} Nominees
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewResults(poll)}
                        className="w-full border-(--outline-variant) bg-white text-slate-700 hover:bg-(--surface-container)]"
                      >
                        Results
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShareLink(poll.slug || poll.id)}
                        className="w-full border-(--outline-variant) bg-white text-slate-700 hover:bg-(--surface-container)]"
                      >
                        <Share2 className="h-3.5 w-3.5 mr-1" />
                        Share
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-(--outline-variant)/60">
                      {poll.status === "draft" && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => togglePollStatus(poll, "active")}
                          className="flex-1 bg-emerald-500 text-white hover:bg-emerald-600 border border-transparent shadow-xs"
                        >
                          <Play className="h-3.5 w-3.5 mr-1" />
                          Launch
                        </Button>
                      )}
                      {poll.status === "active" && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => togglePollStatus(poll, "closed")}
                          className="flex-1 bg-amber-500 text-white hover:bg-amber-600 border border-transparent shadow-xs"
                        >
                          <Square className="h-3.5 w-3.5 mr-1" />
                          Close Poll
                        </Button>
                      )}
                      {poll.status === "draft" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartEditDraft(poll)}
                          className="border-(--outline-variant) bg-white text-slate-700 hover:bg-(--surface-container) text-xs"
                        >
                          Edit Poll
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const localStart = new Date(new Date(poll.starts_at).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                            const localEnd = new Date(new Date(poll.ends_at).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                            setEditingPoll(poll);
                            setEditStartsAt(localStart);
                            setEditEndsAt(localEnd);
                            setEditAllowViewResults(poll.allow_view_results);
                            setEditPeriodOpen(true);
                          }}
                          className={`border-(--outline-variant) bg-white text-slate-700 hover:bg-(--surface-container) text-xs ${poll.status === "closed" ? "flex-1" : ""}`}
                        >
                          Edit Period
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={poll.status === "active"}
                        onClick={() => handleDeletePoll(poll.id)}
                        className={poll.status === "active"
                          ? "text-slate-300 border-slate-100 cursor-not-allowed"
                          : "text-red-500 border-red-100 hover:bg-red-50 hover:text-red-600"
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Poll Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if(!open) resetForm(); }}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-hidden border-(--outline-variant) bg-(--surface-container-lowest) p-0 sm:max-w-2xl">
          <DialogHeader className="border-b border-(--outline-variant) bg-(--surface-container-lowest) px-8 py-6 text-left">
            <DialogTitle className="font-headline text-2xl font-bold text-[#0B1C30]">{editingPoll ? "Edit Poll" : "Create New Poll"}</DialogTitle>
            <DialogDescription className="text-sm text-(--on-surface-variant)">
              {editingPoll
                ? `Modify the details, nominees, and metadata for "${editingPoll.title}".`
                : "Initialize a new dynamic voting poll, define voter access criteria, and nominate candidates."}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleCreatePoll}
            className="flex max-h-[calc(100dvh-10rem)] min-h-0 flex-col overflow-hidden"
          >
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-8 py-6">
              {/* Basic Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label
                    htmlFor="poll_title"
                    className="font-mono text-[12px] uppercase tracking-wider text-(--on-surface-variant) font-semibold"
                  >
                    Poll Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="poll_title"
                    placeholder="e.g. Best Worker of the Month - June"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="h-11 border-(--outline-variant) bg-white"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label
                    htmlFor="poll_desc"
                    className="font-mono text-[12px] uppercase tracking-wider text-(--on-surface-variant) font-semibold"
                  >
                    Description
                  </Label>
                  <Textarea
                    id="poll_desc"
                    placeholder="Provide context or instructions for voters..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="min-h-24 border-(--outline-variant) bg-white resize-none"
                    rows={2}
                  />
                </div>
              </div>

              {/* Timelines Block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-(--outline-variant)">
                <div className="space-y-2">
                  <Label
                    htmlFor="starts_at"
                    className="font-mono text-[12px] uppercase tracking-wider text-(--on-surface-variant) font-semibold"
                  >
                    Starts At <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="starts_at"
                    type="datetime-local"
                    value={startsAt}
                    onChange={e => setStartsAt(e.target.value)}
                    className="h-11 border-(--outline-variant) bg-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="ends_at"
                    className="font-mono text-[12px] uppercase tracking-wider text-(--on-surface-variant) font-semibold"
                  >
                    Ends At <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="ends_at"
                    type="datetime-local"
                    value={endsAt}
                    onChange={e => setEndsAt(e.target.value)}
                    className="h-11 border-(--outline-variant) bg-white"
                    required
                  />
                </div>
              </div>

              {/* Voter Rules Block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="voter_type"
                    className="font-mono text-[12px] uppercase tracking-wider text-(--on-surface-variant) font-semibold"
                  >
                    Who Can Vote?
                  </Label>
                  <Select
                    value={voterType}
                    onValueChange={val => setVoterType(val as "anyone" | "members" | "workers" | "selected_groups")}
                  >
                    <SelectTrigger id="voter_type" className="h-11 bg-white border-(--outline-variant)">
                      <SelectValue placeholder="Select Voter Segment" />
                    </SelectTrigger>
                    <SelectContent className="border-(--outline-variant)">
                      <SelectItem value="anyone">Open to Anyone (Public)</SelectItem>
                      <SelectItem value="members">Open to Members Only</SelectItem>
                      <SelectItem value="workers">Open to Workers Only</SelectItem>
                      <SelectItem value="selected_groups">Selected Units Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="self-end">
                  <Label
                    htmlFor="results_visibility"
                    className="font-mono text-[12px] uppercase tracking-wider text-(--on-surface-variant) font-semibold"
                  >
                    Results Visibility
                  </Label>
                  <div className="flex items-center justify-between h-11">
                    <p className="">Allow voters to see results.</p>
                    <Switch id="results_visibility" checked={allowViewResults} onCheckedChange={setAllowViewResults} />
                  </div>
                </div>
              </div>

              {voterType === "selected_groups" && (
                <div className="space-y-2 pt-4 border-t border-(--outline-variant)">
                  <Label className="font-mono text-[12px] uppercase tracking-wider text-(--on-surface-variant) font-semibold block">
                    Allowed Units
                  </Label>
                  {units.length === 0 ? (
                    <p className="text-xs text-slate-500">No units loaded.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 p-4 border border-(--outline-variant) rounded-xl bg-white max-h-[120px] overflow-y-auto pr-1">
                      {units.map(unit => (
                        <div key={unit.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`group_${unit.id}`}
                            checked={allowedGroups.includes(unit.id)}
                            onChange={() => handleToggleGroup(unit.id)}
                            className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                          />
                          <Label
                            htmlFor={`group_${unit.id}`}
                            className="text-sm font-normal text-slate-700 cursor-pointer"
                          >
                            {unit.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Nominee section */}
              <div className="space-y-4 pt-4 border-t border-(--outline-variant)">
                <h3 className="font-headline text-base font-bold text-[#0B1C30] mb-2 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Nominated Candidates ({candidates.length}) <span className="text-red-500">*</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border border-(--outline-variant) rounded-xl bg-slate-50/50">
                  <div className="space-y-2">
                    <Label className="font-mono text-[12px] uppercase tracking-wider text-(--on-surface-variant) font-semibold">
                      Search Member to Nominate
                    </Label>
                    <MemberSearchAutocomplete
                      placeholder="Type member name..."
                      selectedMemberId={tempMemberId}
                      selectedMemberName={tempMemberName}
                      onSelect={(id, name, photoUrl) => {
                        if (id && name) {
                          handleAddCandidate(id, name, photoUrl);
                          // Reset the picker immediately
                          setTempMemberId(null);
                          setTempMemberName("");
                        }
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-mono text-[12px] uppercase tracking-wider text-(--on-surface-variant) font-semibold">
                      Or Nominate Custom Candidate
                    </Label>
                    <Input
                      placeholder="Type name and press Enter..."
                      className="h-11 bg-white border-(--outline-variant)"
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomCandidate(e.currentTarget.value);
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </div>
                </div>

                {candidates.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[240px] overflow-y-auto pr-1 pt-1">
                    {candidates.map((cand, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col gap-2 p-4 border border-(--outline-variant) bg-white rounded-xl shadow-xs"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8 border border-slate-100 shadow-xs shrink-0 bg-white">
                              <AvatarImage src={cand.photo_url || ""} alt={cand.display_name} />
                              <AvatarFallback className="bg-primary/5 text-primary font-bold text-xs">
                                {cand.display_name.split(" ").map(s => s[0]).join("").substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-semibold text-slate-800 text-sm truncate max-w-[120px]">
                              {cand.display_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {cand.member_id && (
                              <Badge
                                variant="outline"
                                className="text-[9px] font-normal text-slate-500 border-slate-200 bg-slate-50"
                              >
                                Member
                              </Badge>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveCandidate(idx)}
                              className="h-6 text-red-500 hover:text-red-600 hover:bg-red-50 px-1.5 text-xs"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                        <Input
                          placeholder="Nomination citation (e.g. Dedicated service)"
                          value={cand.nomination_reason || ""}
                          onChange={e => handleUpdateCandidateReason(idx, e.target.value)}
                          className="h-8 text-xs bg-slate-50/50 border-(--outline-variant)"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="border-t border-(--outline-variant) bg-(--surface-container-lowest)] px-8 py-6">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingPoll ? "Save Changes" : "Create Draft"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Results View Dialog */}
      <Dialog open={resultsOpen} onOpenChange={setResultsOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-hidden border-(--outline-variant) bg-white p-0 sm:max-w-md flex flex-col">
          <DialogHeader className="border-b border-(--outline-variant) bg-white px-5 py-4 text-left">
            <p className="font-mono text-[12px] font-medium uppercase leading-4 tracking-wider text-(--secondary)]">
              Tally & Analytics
            </p>
            <DialogTitle className="font-(--font-manrope)] text-xl font-semibold text-[#0B1C30]">
              Poll Standings
            </DialogTitle>
            <DialogDescription className="text-sm text-(--on-surface-variant) line-clamp-1">
              {activePoll?.title}
            </DialogDescription>
          </DialogHeader>

          {loadingResults ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 space-y-3 min-h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-slate-500 font-medium">Tallying vote records...</p>
            </div>
          ) : !pollResults ? (
            <div className="flex-1 flex items-center justify-center py-12 text-slate-500 min-h-[300px]">
              Failed to load results data.
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-5 py-5 max-h-[60vh] space-y-6 bg-white">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-(--outline-variant) bg-slate-50/50 text-center">
                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Total Ballots</span>
                  <p className="text-3xl font-bold text-[#0B1C30] mt-1">{pollResults.totalVotes}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Voter Access</span>
                  <p className="text-base font-semibold text-slate-800 mt-2.5 capitalize">
                    {pollResults.poll.voter_type.replace("_", " ")}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Tally</h4>

                <div className="space-y-4">
                  {pollResults.poll.poll_candidates.map(cand => {
                    const votes = cand.votes || 0;
                    const pct = pollResults.totalVotes > 0 ? Math.round((votes / pollResults.totalVotes) * 100) : 0;

                    return (
                      <div key={cand.id} className="space-y-1.5">
                        <div className="flex justify-between items-center text-sm font-semibold text-slate-800">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8 border border-slate-100 shadow-xs shrink-0 bg-white">
                              <AvatarImage src={cand.photo_url || ""} alt={cand.display_name} />
                              <AvatarFallback className="bg-primary/5 text-primary font-bold text-xs">
                                {cand.display_name.split(" ").map(s => s[0]).join("").substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span>{cand.display_name}</span>
                          </div>
                          <span className="text-slate-500 font-mono font-medium">
                            {votes} vote{votes !== 1 && "s"} ({pct}%)
                          </span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-100">
                          <div
                            className="h-full bg-linear-to-r from-primary to-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        {cand.nomination_reason && (
                          <p className="text-xs text-slate-400 italic">
                            Nominated: &ldquo;{cand.nomination_reason}&rdquo;
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-(--outline-variant)/60 pt-4 flex justify-between items-center text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  Real-time results fetched from secure ledger
                </span>
                {activePoll?.status === "active" && (
                  <Badge variant="outline" className="animate-pulse bg-emerald-50 text-emerald-700 border-emerald-200">
                    Live Tallying
                  </Badge>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-(--outline-variant) bg-white p-4">
            <Button onClick={() => setResultsOpen(false)} className="w-full sm:w-auto">
              Close Results
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Voting Period Dialog */}
      <Dialog open={editPeriodOpen} onOpenChange={setEditPeriodOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-hidden border-(--outline-variant) bg-(--surface-container-lowest) p-0 sm:max-w-md">
          <DialogHeader className="border-b border-(--outline-variant) bg-(--surface-container-lowest) px-8 py-6 text-left">
            <DialogTitle className="font-headline text-2xl font-bold text-[#0B1C30]">Edit Voting Period</DialogTitle>
            <DialogDescription className="text-sm text-(--on-surface-variant) mt-1">
              Update the start and end date/time for <strong>{editingPoll?.title}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdatePeriod} className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit_starts_at" className="text-xs font-semibold text-slate-700">Starts At</Label>
                <Input
                  id="edit_starts_at"
                  type="datetime-local"
                  value={editStartsAt}
                  onChange={e => setEditStartsAt(e.target.value)}
                  required
                  className="h-11 border-(--outline-variant) bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_ends_at" className="text-xs font-semibold text-slate-700">Ends At</Label>
                <Input
                  id="edit_ends_at"
                  type="datetime-local"
                  value={editEndsAt}
                  onChange={e => setEditEndsAt(e.target.value)}
                  required
                  className="h-11 border-(--outline-variant) bg-white"
                />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <input
                  id="edit_allow_view_results"
                  type="checkbox"
                  checked={editAllowViewResults}
                  onChange={e => setEditAllowViewResults(e.target.checked)}
                  className="rounded border-(--outline-variant) text-primary focus:ring-primary h-4.5 w-4.5"
                />
                <Label htmlFor="edit_allow_view_results" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Allow voters to view results while voting is ongoing / closed
                </Label>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-(--outline-variant) mt-6 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setEditPeriodOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updatingPeriod}>
                {updatingPeriod ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
