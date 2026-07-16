"use client";

import { useEffect, useState } from "react";
import { Member } from "@/lib/types";
import { designs, defaultMessages } from "@/lib/designs";
import { toast } from "sonner";
import { Gift, Users, Send, Image as ImageIcon, Download, Sparkles, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ADMIN_ROLE, PERMISSION, type AdminRole, type Permission } from "@/lib/adminRoles";
import { MemberDetailDialog } from "@/components/members/member-detail-dialog";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Dashboard() {
  const [todayBirthdays, setTodayBirthdays] = useState<Member[]>([]);
  const [weekBirthdays, setWeekBirthdays] = useState<Member[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [activeMember, setActiveMember] = useState<Member | null>(null);
  const [designIndex, setDesignIndex] = useState<number>(0);
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<string[]>([]);
  const [viewingMember, setViewingMember] = useState<Member | null>(null);
  const [viewer, setViewer] = useState<{ role: AdminRole | null; permissions: Permission[] }>({
    role: null,
    permissions: [],
  });

  useEffect(() => {
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

  useEffect(() => {
    Promise.all([
      fetch("/api/birthdays/today").then(r => r.json()),
      fetch("/api/birthdays/week").then(r => r.json()),
      fetch("/api/members?limit=1").then(r => r.json()),
      fetch("/api/birthday-messages").then(r => r.json()).catch(() => ({ data: [] })),
    ]).then(([birthdays, week, members, messagesData]) => {
      setTodayBirthdays(Array.isArray(birthdays) ? birthdays : []);
      setWeekBirthdays(Array.isArray(week) ? week : []);
      setTotalMembers(members.total || 0);
      
      const loadedMsgs = messagesData?.data?.map((m: any) => m.message) || [];
      setMessages(loadedMsgs.length > 0 ? loadedMsgs : defaultMessages);
      setLoading(false);
    });
  }, []);

  const generatePreview = (member: Member) => {
    setGenerating(member.id);
    setActiveMember(member);
    const activeMessages = messages.length > 0 ? messages : defaultMessages;
    const randDesign = Math.floor(Math.random() * designs.length);
    setDesignIndex(randDesign);
    setMessage(activeMessages[0] || defaultMessages[0]);
  };

  useEffect(() => {
    if (!activeMember) {
      setPreviewUrl(null);
      return;
    }

    const primaryUnit = activeMember.units?.[0];
    const params = new URLSearchParams({
      design: designIndex.toString(),
      first_name: activeMember.first_name,
      middle_name: activeMember.middle_name || "",
      last_name: activeMember.last_name,
      position: activeMember.position || "",
      photo_url: activeMember.photo_url || "",
      date_of_birth: activeMember.date_of_birth,
      message,
      unit_name: primaryUnit?.name || "",
      unit_role: primaryUnit?.role || "",
    });
    setPreviewUrl(`/api/generate?${params.toString()}`);
  }, [activeMember, designIndex, message]);

  const triggerSend = async () => {
    try {
      const res = await fetch("/api/birthdays/send", { method: "POST" });
      const data = await res.json();
      if (data.birthdayCount > 0) {
        toast.success(`Generated graphics for ${data.birthdayCount} birthday(s)`);
      } else {
        toast.info("No birthdays today");
      }
    } catch {
      toast.error("Failed to trigger birthday send");
    }
  };

  return (
    <div className="flex-1 w-full">
      <PageHeader
        eyebrow="Workspace overview"
        title="Dashboard"
        description={new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
        actions={
          <Button onClick={triggerSend} variant="secondary" className="w-full sm:w-auto">
            <Send className="mr-2 h-4 w-4" />
            Send Today&apos;s Greetings
          </Button>
        }
      />

      <div className="space-y-8 p-4 md:p-8">

      {/* KPI Stats Section */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Members
            </CardTitle>
            <div className="h-9 w-9 bg-primary/10 rounded-full flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loading ? <Skeleton className="h-8 w-20" /> : totalMembers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active directory members
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Birthdays Today
            </CardTitle>
            <div className="h-9 w-9 bg-secondary/15 rounded-full flex items-center justify-center">
              <Gift className="h-4 w-4 text-secondary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loading ? <Skeleton className="h-8 w-16" /> : todayBirthdays.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Requires attention today
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Design Templates
            </CardTitle>
            <div className="h-9 w-9 bg-primary/10 rounded-full flex items-center justify-center">
              <ImageIcon className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{designs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Available graphic styles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid gap-6 md:gap-8 grid-cols-1 lg:grid-cols-12">
        
        {/* Celebrants List */}
        <Card className="lg:col-span-7 flex flex-col shadow-sm border-muted">
          <Tabs defaultValue="today" className="flex flex-col flex-1">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    Celebrants
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Review upcoming birthdays and generate personalized graphics.
                  </CardDescription>
                </div>
                <TabsList>
                  <TabsTrigger value="today">Today ({todayBirthdays.length})</TabsTrigger>
                  <TabsTrigger value="week">This Week ({weekBirthdays.length})</TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>
            <CardContent className="flex-1 pt-6">
            {loading ? (
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
            ) : (
              <>
                {/* Today Tab */}
                <TabsContent value="today" className="mt-0">
                  {todayBirthdays.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                        <Gift className="h-10 w-10 text-muted-foreground/50" />
                      </div>
                      <h3 className="text-lg font-semibold">No birthdays today</h3>
                      <p className="text-muted-foreground text-sm max-w-sm mt-1">
                        There are no members in your directory celebrating a birthday today.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {todayBirthdays.map((member) => (
                        <BirthdayCard 
                          key={member.id} 
                          member={member} 
                          generating={generating} 
                          generatePreview={generatePreview} 
                          onViewProfile={setViewingMember}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* This Week Tab */}
                <TabsContent value="week" className="mt-0">
                  {weekBirthdays.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                        <Gift className="h-10 w-10 text-muted-foreground/50" />
                      </div>
                      <h3 className="text-lg font-semibold">No upcoming birthdays</h3>
                      <p className="text-muted-foreground text-sm max-w-sm mt-1">
                        There are no members celebrating a birthday in the next 7 days.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {weekBirthdays.map((member) => (
                        <BirthdayCard 
                          key={member.id} 
                          member={member} 
                          generating={generating} 
                          generatePreview={generatePreview} 
                          onViewProfile={setViewingMember}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </>
            )}
          </CardContent>
          </Tabs>
        </Card>

        {/* Live Preview Panel */}
        <div className="lg:col-span-5">
          <div className="sticky top-6">
            <Card className="shadow-sm border-muted overflow-hidden flex flex-col">
              <CardHeader className="bg-muted/30 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  Live Preview
                </CardTitle>
                <CardDescription>
                  Preview the generated birthday graphic before downloading or sending.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {previewUrl ? (
                  <div className="flex flex-col">
                    <div className="relative group bg-muted/10 p-4 border-b border-border/50">
                      <div className="relative rounded-lg overflow-hidden border shadow-sm aspect-square md:aspect-auto flex justify-center items-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewUrl}
                          alt="Birthday preview"
                          className="w-full h-auto max-h-[500px] object-contain rounded-lg"
                          onLoad={() => setGenerating(null)}
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm rounded-lg">
                          <Button asChild variant="secondary" className="shadow-lg">
                            <a href={previewUrl} download={`${activeMember?.first_name || "birthday"}-graphic.png`}>
                              <Download className="mr-2 h-4 w-4" />
                              Download High-Res
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Design Customizer Controls */}
                    <div className="p-5 bg-muted/30 flex flex-col gap-4 border-t border-border/30">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Select Design Template
                        </label>
                        <Select value={designIndex.toString()} onValueChange={(val) => {
                          if (activeMember) setGenerating(activeMember.id);
                          setDesignIndex(parseInt(val));
                        }}>
                          <SelectTrigger className="bg-background border-muted-foreground/20">
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
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Birthday Greeting Message
                        </label>
                        <Select value={message} onValueChange={(val) => {
                          if (activeMember) setGenerating(activeMember.id);
                          setMessage(val);
                        }}>
                          <SelectTrigger className="bg-background border-muted-foreground/20">
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
                  <div className="flex flex-col items-center justify-center p-8 text-center aspect-square md:aspect-[4/3] bg-muted/10">
                    <div className="h-16 w-16 rounded-full bg-background border border-dashed border-muted-foreground/30 flex items-center justify-center mb-4">
                      <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <h3 className="font-medium text-foreground">No Preview Selected</h3>
                    <p className="text-sm text-muted-foreground max-w-[200px] mt-1">
                      Select &quot;Preview Graphic&quot; on any celebrant to see the generated design.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
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
