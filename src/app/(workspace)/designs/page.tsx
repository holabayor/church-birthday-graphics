"use client";

import { useEffect, useState } from "react";
import { designs, defaultMessages } from "@/lib/designs";
import {
  RefreshCw,
  LayoutTemplate,
  Download,
  ImageIcon,
  CheckCircle2,
  Loader2,
  Gift,
  Users,
  Send,
  Calendar,
  Sparkles,
} from "lucide-react";
import { BirthdayMessageManager } from "@/components/birthdays/birthday-message-manager";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Member } from "@/lib/types";
import { ADMIN_ROLE, PERMISSION, type AdminRole, type Permission } from "@/lib/adminRoles";
import { MemberDetailDialog } from "@/components/members/member-detail-dialog";

export default function DesignsPage() {
  // Existing template states
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedDesign, setSelectedDesign] = useState<number | null>(null);

  // Celebrants tab states
  const [celebrants, setCelebrants] = useState<Member[]>([]);
  const [loadingCelebrants, setLoadingCelebrants] = useState(false);
  const [celebrantFilter, setCelebrantFilter] = useState<"today" | "week" | "month" | "custom">("today");
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [customEnd, setCustomEnd] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [activeMember, setActiveMember] = useState<Member | null>(null);
  const [designIndex, setDesignIndex] = useState<number>(0);
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<string[]>([]);
  const [generating, setGenerating] = useState<string | null>(null);
  const [celebrantPreviewUrl, setCelebrantPreviewUrl] = useState<string | null>(null);
  const [viewingMember, setViewingMember] = useState<Member | null>(null);
  const [viewer, setViewer] = useState<{ role: AdminRole | null; permissions: Permission[] }>({
    role: null,
    permissions: [],
  });

  // Fetch messages and auth details
  useEffect(() => {
    fetch("/api/birthday-messages")
      .then(res => res.json())
      .then(data => {
        const loadedMsgs = data?.data?.map((m: any) => m.message) || [];
        setMessages(loadedMsgs.length > 0 ? loadedMsgs : defaultMessages);
      })
      .catch(() => setMessages(defaultMessages));

    fetch("/api/auth")
      .then(res => res.json())
      .then(data => {
        const role = (data.user?.role || data.member?.role || null) as AdminRole | null;
        const permissions = (data.permissions ||
          data.user?.permissions ||
          data.member?.permissions ||
          []) as Permission[];
        setViewer({ role, permissions });
      })
      .catch(() => setViewer({ role: null, permissions: [] }));
  }, []);

  // Fetch celebrants based on filters
  const fetchCelebrants = async () => {
    setLoadingCelebrants(true);
    try {
      if (celebrantFilter === "today") {
        const res = await fetch("/api/birthdays/today");
        const data = await res.json();
        setCelebrants(Array.isArray(data) ? data : []);
      } else if (celebrantFilter === "week") {
        const res = await fetch("/api/birthdays/week");
        const data = await res.json();
        setCelebrants(Array.isArray(data) ? data : []);
      } else if (celebrantFilter === "month") {
        const res = await fetch(`/api/members?month=${selectedMonth}&limit=100`);
        const data = await res.json();
        setCelebrants(Array.isArray(data?.data) ? data.data : []);
      } else {
        const res = await fetch(`/api/birthdays/custom?start=${customStart}&end=${customEnd}`);
        const data = await res.json();
        setCelebrants(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      toast.error("Failed to load celebrants");
    } finally {
      setLoadingCelebrants(false);
    }
  };

  useEffect(() => {
    fetchCelebrants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [celebrantFilter, selectedMonth, customStart, customEnd]);

  // Generate Celebrant Dynamic Preview
  useEffect(() => {
    if (!activeMember) {
      setCelebrantPreviewUrl(null);
      return;
    }

    const params = new URLSearchParams({
      design: designIndex.toString(),
      first_name: activeMember.first_name,
      middle_name: activeMember.middle_name || "",
      last_name: activeMember.last_name,
      position: activeMember.position || "",
      photo_url: activeMember.photo_url || "",
      date_of_birth: activeMember.date_of_birth,
      message,
    });
    setCelebrantPreviewUrl(`/api/generate?${params.toString()}`);
  }, [activeMember, designIndex, message]);

  const generateCelebrantPreview = (member: Member) => {
    setGenerating(member.id);
    setActiveMember(member);
    const activeMessages = messages.length > 0 ? messages : defaultMessages;
    setMessage(activeMessages[0] || defaultMessages[0]);
  };

  // Original template preview
  const previewDesign = (index: number) => {
    setLoadingIdx(index);
    setSelectedDesign(index);
    const message = defaultMessages[0];
    const params = new URLSearchParams({
      design: index.toString(),
      first_name: "John",
      middle_name: "David",
      last_name: "Okonkwo",
      photo_url: "https://res.cloudinary.com/dev-storage/image/upload/v1770827775/teen_khqk4d.png",
      position: "Choir Director",
      date_of_birth: "1991-02-11",
      message,
    });
    setPreviewUrl(`/api/generate?${params.toString()}`);
  };

  const triggerSend = async () => {
    try {
      const res = await fetch("/api/birthdays/send", { method: "POST" });
      const data = await res.json();
      if (data.birthdayCount > 0) {
        toast.success(`Generated graphics for ${data.birthdayCount} birthday(s)`);
        fetchCelebrants(); // Refresh list
      } else {
        toast.info("No birthdays today");
      }
    } catch {
      toast.error("Failed to trigger birthday send");
    }
  };

  return (
    <div className="flex-1 w-full bg-[var(--background)] min-h-screen">
      <PageHeader
        eyebrow="Celebration workflow"
        title="Birthday Management"
        description="Manage birthday templates, greeting messages, and celebration assets."
        meta={
          <div className="flex items-center gap-2 rounded-full border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-3 py-1.5">
            <LayoutTemplate className="h-4 w-4 text-[var(--secondary)]" />
            <span className="text-sm font-medium text-foreground">{designs.length} Templates Active</span>
          </div>
        }
        actions={
          <Button onClick={triggerSend} variant="secondary" className="w-full sm:w-auto">
            <Send className="mr-2 h-4 w-4" />
            Send Today's Greetings
          </Button>
        }
      />

      <div className="space-y-6 p-4 md:space-y-8 md:p-8">
        <Tabs defaultValue="celebrants" className="w-full gap-6">
          <div className="overflow-x-auto rounded-xl border border-[var(--outline-variant)] bg-white p-2 shadow-sm">
            <TabsList className="grid h-auto w-full grid-cols-3 gap-1 bg-transparent p-0">
              <TabsTrigger
                value="celebrants"
                className="h-11 justify-start rounded-md border border-transparent px-3 text-sm font-medium text-[var(--on-surface-variant)] data-[state=active]:border-[var(--outline-variant)] data-[state=active]:bg-[var(--surface-container)] data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                <Gift className="h-4 w-4" />
                Celebrants
              </TabsTrigger>
              <TabsTrigger
                value="templates"
                className="h-11 justify-start rounded-md border border-transparent px-3 text-sm font-medium text-[var(--on-surface-variant)] data-[state=active]:border-[var(--outline-variant)] data-[state=active]:bg-[var(--surface-container)] data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                <LayoutTemplate className="h-4 w-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger
                value="messages"
                className="h-11 justify-start rounded-md border border-transparent px-3 text-sm font-medium text-[var(--on-surface-variant)] data-[state=active]:border-[var(--outline-variant)] data-[state=active]:bg-[var(--surface-container)] data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                <ImageIcon className="h-4 w-4" />
                Messages
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="celebrants" className="mt-0">
            <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-12">
              {/* Left Column: Filter and Celebrants List */}
              <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                <Card className="shadow-sm border-slate-200">
                  <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter By:</span>
                        <div className="flex rounded-lg border border-slate-200 p-0.5 bg-white">
                          <button
                            type="button"
                            onClick={() => setCelebrantFilter("today")}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                              celebrantFilter === "today" ? "bg-primary text-primary-foreground" : "text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            Today
                          </button>
                          <button
                            type="button"
                            onClick={() => setCelebrantFilter("week")}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                              celebrantFilter === "week" ? "bg-primary text-primary-foreground" : "text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            This Week
                          </button>
                          <button
                            type="button"
                            onClick={() => setCelebrantFilter("month")}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                              celebrantFilter === "month" ? "bg-primary text-primary-foreground" : "text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            Month
                          </button>
                          <button
                            type="button"
                            onClick={() => setCelebrantFilter("custom")}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                              celebrantFilter === "custom" ? "bg-primary text-primary-foreground" : "text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            Custom Range
                          </button>
                        </div>
                      </div>

                      {celebrantFilter === "month" && (
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                          <SelectTrigger className="w-[140px] bg-white border-slate-200 h-9 text-xs">
                            <SelectValue placeholder="Select Month" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">January</SelectItem>
                            <SelectItem value="2">February</SelectItem>
                            <SelectItem value="3">March</SelectItem>
                            <SelectItem value="4">April</SelectItem>
                            <SelectItem value="5">May</SelectItem>
                            <SelectItem value="6">June</SelectItem>
                            <SelectItem value="7">July</SelectItem>
                            <SelectItem value="8">August</SelectItem>
                            <SelectItem value="9">September</SelectItem>
                            <SelectItem value="10">October</SelectItem>
                            <SelectItem value="11">November</SelectItem>
                            <SelectItem value="12">December</SelectItem>
                          </SelectContent>
                        </Select>
                      )}

                      {celebrantFilter === "custom" && (
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-500">From:</span>
                            <Input
                              type="date"
                              value={customStart}
                              onChange={e => setCustomStart(e.target.value)}
                              className="h-9 text-xs w-[130px] px-2 bg-white border-slate-200"
                            />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-500">To:</span>
                            <Input
                              type="date"
                              value={customEnd}
                              onChange={e => setCustomEnd(e.target.value)}
                              className="h-9 text-xs w-[130px] px-2 bg-white border-slate-200"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {loadingCelebrants ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center space-x-4 p-4 border rounded-xl">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2 flex-1">
                              <Skeleton className="h-4 w-[200px]" />
                              <Skeleton className="h-3 w-[150px]" />
                            </div>
                            <Skeleton className="h-9 w-[100px]" />
                          </div>
                        ))}
                      </div>
                    ) : celebrants.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-dashed border-slate-200">
                          <Gift className="h-10 w-10 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">No celebrants found</h3>
                        <p className="text-slate-500 text-sm max-w-sm mt-1">
                          {celebrantFilter === "today"
                            ? "There are no members celebrating their birthday today."
                            : celebrantFilter === "week"
                              ? "There are no members celebrating their birthday this week."
                              : celebrantFilter === "month"
                                ? "There are no members celebrating their birthday in this month."
                                : "There are no members celebrating their birthday in this date range."}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {celebrants.map((member) => (
                          <BirthdayCard
                            key={member.id}
                            member={member}
                            generating={generating}
                            generatePreview={generateCelebrantPreview}
                            onViewProfile={setViewingMember}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Live Preview Panel */}
              <div className="lg:col-span-5 xl:col-span-4">
                <div className="sticky top-6">
                  <Card className="shadow-sm border-slate-200 overflow-hidden flex flex-col">
                    <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-primary" />
                        Live Preview
                      </CardTitle>
                      <CardDescription>
                        Preview the generated birthday graphic before downloading or sending.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      {celebrantPreviewUrl ? (
                        <div className="flex flex-col">
                          <div className="relative group bg-muted/10 p-4 border-b border-slate-100">
                            <div className="relative rounded-lg overflow-hidden border shadow-sm aspect-square md:aspect-auto flex justify-center items-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={celebrantPreviewUrl}
                                alt="Birthday preview"
                                className="w-full h-auto max-h-[500px] object-contain rounded-lg"
                                onLoad={() => setGenerating(null)}
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm rounded-lg">
                                <Button asChild variant="secondary" className="shadow-lg">
                                  <a href={celebrantPreviewUrl} download={`${activeMember?.first_name || "birthday"}-graphic.png`}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download High-Res
                                  </a>
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          {/* Design Customizer Controls */}
                          <div className="p-5 bg-slate-50/30 flex flex-col gap-4 border-t border-slate-100">
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Select Design Template
                              </label>
                              <Select value={designIndex.toString()} onValueChange={(val) => {
                                if (activeMember) setGenerating(activeMember.id);
                                setDesignIndex(parseInt(val));
                              }}>
                                <SelectTrigger className="bg-white border-slate-200">
                                  <SelectValue placeholder="Select Template" />
                                </SelectTrigger>
                                <SelectContent>
                                  {designs.map((d, idx) => (
                                    <SelectItem key={idx} value={idx.toString()}>
                                      {d.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Birthday Greeting Message
                              </label>
                              <Select value={message} onValueChange={(val) => {
                                if (activeMember) setGenerating(activeMember.id);
                                setMessage(val);
                              }}>
                                <SelectTrigger className="bg-white border-slate-200">
                                  <SelectValue placeholder="Select Message" />
                                </SelectTrigger>
                                <SelectContent>
                                  {(messages.length > 0 ? messages : defaultMessages).map((msg, idx) => (
                                    <SelectItem key={idx} value={msg}>
                                      Message {idx + 1}: {msg.substring(0, 40)}...
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-8 text-center aspect-square md:aspect-[4/3] bg-slate-50/10">
                          <div className="h-16 w-16 rounded-full bg-white border border-dashed border-slate-200 flex items-center justify-center mb-4">
                            <ImageIcon className="h-6 w-6 text-slate-400" />
                          </div>
                          <h3 className="font-medium text-slate-900">No Preview Selected</h3>
                          <p className="text-sm text-slate-500 max-w-[200px] mt-1">
                            Select &quot;Preview Graphic&quot; on any celebrant to see the generated design.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="mt-0">
            <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-12">
              <div className="space-y-6 lg:col-span-7 xl:col-span-8">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {designs.map((design, i) => {
                    const isSelected = selectedDesign === i;
                    const isLoading = loadingIdx === i;

                    return (
                      <div
                        key={i}
                        onClick={() => !isLoading && previewDesign(i)}
                        className={`group relative cursor-pointer overflow-hidden rounded-xl border p-5 transition-all duration-200 ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20"
                            : "border-border bg-card hover:border-primary/50 hover:shadow-sm"
                        }`}
                      >
                        <div className="mb-4 flex items-start justify-between">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                              isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                            }`}
                          >
                            <ImageIcon className="h-5 w-5" />
                          </div>
                          {isSelected && <CheckCircle2 className="h-5 w-5 animate-in zoom-in text-primary" />}
                        </div>

                        <div>
                          <h3 className={`mb-1 text-lg font-semibold transition-colors ${isSelected ? "text-primary" : "text-foreground group-hover:text-primary"}`}>
                            {design.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">Template Variant #{i + 1}</p>
                        </div>

                        {isLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[2px]">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-5 xl:col-span-4">
                <div className="sticky top-6">
                  <Card className="flex flex-col overflow-hidden border-[var(--outline-variant)] shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-[var(--outline-variant)] bg-white pb-4">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <LayoutTemplate className="h-5 w-5 text-primary" />
                          Live Preview
                        </CardTitle>
                        <CardDescription className="mt-1">
                          See how this template looks with sample data.
                        </CardDescription>
                      </div>
                      {selectedDesign !== null && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => previewDesign(selectedDesign)}
                          disabled={loadingIdx !== null}
                          title="Regenerate Preview"
                        >
                          <RefreshCw className={`h-4 w-4 ${loadingIdx !== null ? "animate-spin" : ""}`} />
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent className="p-0">
                      {previewUrl ? (
                        <div className="group relative bg-muted/10 p-4">
                          <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border shadow-sm md:aspect-auto">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={previewUrl}
                              alt="Design preview"
                              className="h-auto max-h-[500px] w-full rounded-lg object-contain"
                              onLoad={() => setLoadingIdx(null)}
                            />
                            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/60 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                              <Button asChild variant="secondary" className="shadow-lg">
                                <a href={previewUrl} download={`design-${selectedDesign}.png`}>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download High-Res
                                </a>
                              </Button>
                            </div>
                          </div>
                          <div className="mt-3 text-center">
                            <p className="text-xs text-muted-foreground">Preview generated with sample member data</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex aspect-square flex-col items-center justify-center bg-muted/10 p-8 text-center md:aspect-[4/3]">
                          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-muted-foreground/30 bg-background">
                            <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                          </div>
                          <h3 className="font-medium text-foreground">No Template Selected</h3>
                          <p className="mt-1 max-w-[200px] text-sm text-muted-foreground">
                            Choose a design from the gallery to preview how it looks.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="messages" className="mt-0">
            <BirthdayMessageManager />
          </TabsContent>
        </Tabs>
      </div>

      <MemberDetailDialog
        member={viewingMember}
        viewer={viewer}
        onOpenChange={(open) => {
          if (!open) setViewingMember(null);
        }}
        actions={
          viewingMember && getWhatsAppHref(viewingMember.phone_number) ? (
            <Button
              asChild
              variant="outline"
              aria-label="Open WhatsApp"
              className="border-[var(--outline-variant)] text-[#007D55] hover:bg-[var(--surface-container)] hover:text-[#006242]"
            >
              <a href={getWhatsAppHref(viewingMember.phone_number, getWhatsAppMessage(viewingMember)) || "#"} target="_blank" rel="noreferrer">
                <WhatsAppIcon className="h-4 w-4 mr-2" />
                WhatsApp
              </a>
            </Button>
          ) : null
        }
      />
    </div>
  );
}

function BirthdayCard({ 
  member, 
  generating, 
  generatePreview,
  onViewProfile,
}: { 
  member: Member; 
  generating: string | null; 
  generatePreview: (m: Member) => void;
  onViewProfile: (m: Member) => void;
}) {
  return (
    <div className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-card hover:bg-accent/40 transition-colors">
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
          <AvatarImage src={member.photo_url || ""} alt={member.first_name} />
          <AvatarFallback className="bg-primary/5 text-primary font-medium">
            {member.first_name[0]}{member.last_name[0]}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-foreground text-base">
            {member.first_name} {member.middle_name ? member.middle_name + " " : ""}
            {member.last_name}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {member.position ? (
              <Badge variant="secondary" className="font-normal text-xs px-2 py-0">
                {member.position}
              </Badge>
            ) : null}
            <span className="text-xs font-semibold text-amber-600">
              {new Date(member.date_of_birth).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Button
          variant="outline"
          onClick={() => onViewProfile(member)}
          className="flex-1 sm:flex-initial shadow-sm"
        >
          View Profile
        </Button>
        <Button
          variant={generating === member.id ? "secondary" : "outline"}
          onClick={() => generatePreview(member)}
          disabled={generating === member.id}
          className="flex-1 sm:flex-initial shadow-sm"
        >
          {generating === member.id ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating
            </>
          ) : (
            "Preview Graphic"
          )}
        </Button>
      </div>
    </div>
  );
}

function getWhatsAppHref(phone?: string | null, text?: string) {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return null;
  const international = digits.startsWith("0") ? `234${digits.slice(1)}` : digits;
  const base = `https://wa.me/${international}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

function getWhatsAppMessage(member: Member) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `Hello ${member.first_name}, please review and update your profile details on the church portal here: ${origin}/profile`;
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91a9.86 9.86 0 0 0-2.91-7.01ZM12.05 20.15h-.01a8.25 8.25 0 0 1-4.21-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.55 3.7-8.25 8.26-8.25 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.42 5.83c0 4.55-3.7 8.24-8.23 8.24Zm4.52-6.17c-.25-.13-1.47-.73-1.7-.81-.23-.08-.39-.13-.56.13-.16.25-.64.81-.78.98-.14.16-.29.18-.54.06-.25-.13-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.14.16-.25.25-.42.08-.16.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.66.31-.23.25-.86.84-.86 2.05s.88 2.38 1 2.54c.13.16 1.73 2.64 4.19 3.7.59.25 1.04.4 1.4.52.59.19 1.12.16 1.54.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z" />
    </svg>
  );
}
