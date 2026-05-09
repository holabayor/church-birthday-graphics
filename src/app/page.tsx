"use client";

import { useEffect, useState } from "react";
import { Member } from "@/lib/types";
import { designs, defaultMessages } from "@/lib/designs";
import { toast } from "sonner";
import { Gift, Users, Send, Image as ImageIcon } from "lucide-react";

export default function Dashboard() {
  const [todayBirthdays, setTodayBirthdays] = useState<Member[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/birthdays/today").then(r => r.json()),
      fetch("/api/members?limit=1").then(r => r.json()),
    ]).then(([birthdays, members]) => {
      setTodayBirthdays(Array.isArray(birthdays) ? birthdays : []);
      setTotalMembers(members.total || 0);
      setLoading(false);
    });
  }, []);

  const generatePreview = (member: Member) => {
    setGenerating(member.id);
    const designIndex = Math.floor(Math.random() * designs.length);
    const message = defaultMessages[Math.floor(Math.random() * defaultMessages.length)];
    const params = new URLSearchParams({
      design: designIndex.toString(),
      first_name: member.first_name,
      middle_name: member.middle_name || "",
      last_name: member.last_name,
      position: member.position || "",
      photo_url: member.photo_url || "",
      date_of_birth: member.date_of_birth,
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
      } else {
        toast.info("No birthdays today");
      }
    } catch {
      toast.error("Failed to trigger birthday send");
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <button
          onClick={triggerSend}
          className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          <Send size={16} />
          Send Today&apos;s Greetings
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users size={18} className="text-blue-600" />
            </div>
            <span className="text-sm text-zinc-500">Total Members</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900">{loading ? "..." : totalMembers}</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
              <Gift size={18} className="text-amber-600" />
            </div>
            <span className="text-sm text-zinc-500">Birthdays Today</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900">{loading ? "..." : todayBirthdays.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
              <ImageIcon size={18} className="text-purple-600" />
            </div>
            <span className="text-sm text-zinc-500">Design Templates</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900">{designs.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Today&apos;s Birthdays</h2>
          {loading ? (
            <p className="text-zinc-400 text-sm">Loading...</p>
          ) : todayBirthdays.length === 0 ? (
            <p className="text-zinc-400 text-sm">No birthdays today</p>
          ) : (
            <div className="space-y-3">
              {todayBirthdays.map(member => (
                <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50">
                  <div>
                    <p className="font-medium text-zinc-900">
                      {member.first_name} {member.middle_name ? member.middle_name + " " : ""}
                      {member.last_name}
                    </p>
                    {member.position && <p className="text-xs text-zinc-500">{member.position}</p>}
                  </div>
                  <button
                    onClick={() => generatePreview(member)}
                    disabled={generating === member.id}
                    className="text-xs bg-zinc-900 text-white px-3 py-1.5 rounded-md hover:bg-zinc-800 transition-colors disabled:opacity-50"
                  >
                    {generating === member.id ? "Generating..." : "Preview"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Preview</h2>
          {previewUrl ? (
            <div className="space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Birthday preview"
                className="w-full rounded-lg"
                onLoad={() => setGenerating(null)}
              />
              <a
                href={previewUrl}
                download="birthday-graphic.png"
                className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                Download Image
              </a>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center bg-zinc-50 rounded-lg">
              <p className="text-zinc-400 text-sm">Click &quot;Preview&quot; on a birthday to see the graphic</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
