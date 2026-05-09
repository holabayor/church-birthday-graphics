"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Save, Upload, Church, Image as ImageIcon } from "lucide-react";
import { ChurchSettings } from "@/lib/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Omit<ChurchSettings, "id">>({
    church_name: "",
    church_address: "",
    logo_url: null,
    updated_at: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/church-settings")
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) {
          setSettings(data);
        }
      });
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "church-assets");
      formData.append("folder", "logos");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        setSettings({ ...settings, logo_url: data.url });
        toast.success("Logo uploaded");
      } else {
        toast.error("Upload failed");
      }
    } catch {
      toast.error("Upload failed");
    }
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/church-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          church_name: settings?.church_name,
          church_address: settings?.church_address,
          logo_url: settings?.logo_url,
        }),
      });
      if (res.ok) {
        toast.success("Church settings saved");
      } else {
        toast.error("Failed to save settings");
      }
    } catch (error) {
      console.log("The error is ", error);
      toast.error("Failed to save settings");
    }
    setSaving(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Settings</h1>
        <p className="text-zinc-500 text-sm mt-1">Configure your church info and birthday graphic system</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Church size={20} className="text-zinc-700" />
            <h2 className="text-lg font-semibold text-zinc-900">Church Information</h2>
          </div>
          <p className="text-sm text-zinc-500 mb-5">This information will appear on all birthday graphics.</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Church Logo</label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {settings?.logo_url ? (
                  <div className="w-20 h-20 rounded-lg border border-zinc-200 overflow-hidden bg-zinc-50 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={settings?.logo_url} alt="Church logo" className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-lg border-2 border-dashed border-zinc-200 flex items-center justify-center bg-zinc-50">
                    <ImageIcon size={24} className="text-zinc-300" />
                  </div>
                )}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 px-3 py-2 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50"
                  >
                    <Upload size={14} />
                    {uploading ? "Uploading..." : settings?.logo_url ? "Change Logo" : "Upload Logo"}
                  </button>
                  <p className="text-xs text-zinc-400 mt-1">PNG or JPG, recommended 200x200px</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Church Name *</label>
              <input
                value={settings?.church_name}
                onChange={e => setSettings({ ...settings, church_name: e.target.value })}
                placeholder="e.g. Redeemed Christian Church of God"
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Church Address</label>
              <input
                value={settings?.church_address}
                onChange={e => setSettings({ ...settings, church_address: e.target.value })}
                placeholder="e.g. 15 Church Street, Lagos, Nigeria"
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              <Save size={14} />
              {saving ? "Saving..." : "Save Church Info"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">WhatsApp Integration</h2>
          <p className="text-sm text-zinc-500 mb-4">
            To enable automatic WhatsApp sending, set up the following environment variables on your server:
          </p>
          <div className="space-y-3">
            <div className="bg-zinc-50 rounded-lg p-4">
              <code className="text-sm text-zinc-700">
                WHATSAPP_TOKEN=your_whatsapp_cloud_api_token
                <br />
                WHATSAPP_PHONE_ID=your_phone_number_id
                <br />
                WHATSAPP_GROUP_ID=recipient_phone_or_group_id
                <br />
                CRON_SECRET=a_secret_for_cron_auth
              </code>
            </div>
            <p className="text-xs text-zinc-400">
              Get these from the Meta Business / WhatsApp Cloud API dashboard at developers.facebook.com
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Cron Job Setup</h2>
          <p className="text-sm text-zinc-500 mb-3">
            Set up a daily cron job to automatically check for birthdays and send graphics:
          </p>
          <div className="bg-zinc-50 rounded-lg p-4">
            <code className="text-sm text-zinc-700 break-all">
              POST /api/birthdays/send
              <br />
              Authorization: Bearer YOUR_CRON_SECRET
            </code>
          </div>
          <p className="text-xs text-zinc-400 mt-3">
            If deploying on Vercel, add a vercel.json with cron configuration. Otherwise, use any cron service (e.g.,
            cron-job.org).
          </p>
        </div>
      </div>
    </div>
  );
}
