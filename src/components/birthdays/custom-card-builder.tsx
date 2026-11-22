"use client";

import React, { useState, useEffect } from "react";
import { designs, defaultMessages } from "@/lib/designs";
import {
  Download,
  Upload,
  RefreshCw,
  Sparkles,
  Check,
  Copy,
  Eye,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

export function CustomCardBuilder() {
  const [title, setTitle] = useState("Pastor (Mrs)");
  const [firstName, setFirstName] = useState("Ibukunoluwa");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("OSIJONWO");
  const [position, setPosition] = useState("Protocol Department");
  const [dateOfBirth, setDateOfBirth] = useState(() => {
    const today = new Date();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${today.getFullYear()}-${m}-${d}`;
  });
  const [photoUrl, setPhotoUrl] = useState<string>(
    "https://res.cloudinary.com/dev-storage/image/upload/v1770827775/teen_khqk4d.png"
  );
  const [message, setMessage] = useState<string>(defaultMessages[0]);
  const [selectedDesign, setSelectedDesign] = useState<number>(0);

  const [presetMessages, setPresetMessages] = useState<string[]>(defaultMessages);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);

  const [previewBlobUrl, setPreviewBlobUrl] = useState<string>("");
  const [renderingPreview, setRenderingPreview] = useState(true);

  useEffect(() => {
    fetch("/api/birthday-messages")
      .then((res) => res.json())
      .then((data) => {
        const loaded = data?.data?.map((m: any) => m.message) || [];
        if (loaded.length > 0) {
          setPresetMessages(loaded);
        }
      })
      .catch(() => setPresetMessages(defaultMessages));
  }, []);

  const buildCardPayload = () => ({
    design: selectedDesign,
    title: title.trim(),
    first_name: firstName.trim() || "Celebrant",
    middle_name: middleName.trim(),
    last_name: lastName.trim(),
    position: position.trim(),
    photo_url: photoUrl.trim(),
    date_of_birth: dateOfBirth,
    message: message.trim() || defaultMessages[0],
    unit_name: position.trim(),
  });

  useEffect(() => {
    let active = true;
    setRenderingPreview(true);

    const updatePreview = async () => {
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildCardPayload()),
        });

        if (!res.ok) throw new Error("Failed to generate card graphic preview");

        const blob = await res.blob();
        if (active) {
          const newUrl = URL.createObjectURL(blob);
          setPreviewBlobUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return newUrl;
          });
        }
      } catch (err) {
        console.error("Preview render error:", err);
      } finally {
        if (active) setRenderingPreview(false);
      }
    };

    const timer = setTimeout(updatePreview, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDesign, title, firstName, middleName, lastName, position, photoUrl, dateOfBirth, message]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "avatars");
      formData.append("folder", "custom-celebrants");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setPhotoUrl(data.url);
        toast.success("Photo uploaded");
      } else {
        toast.error(data.error || "Failed to upload photo");
      }
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildCardPayload()),
      });

      if (!res.ok) throw new Error("Failed to render card");

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const cleanName = `${title || ""} ${lastName || firstName || "Celebrant"}-Birthday-Card`.replace(
        /[^a-zA-Z0-9-]/g,
        "_"
      );

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${cleanName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      toast.success("Birthday card downloaded");
    } catch {
      toast.error("Failed to download image");
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyLink = () => {
    if (photoUrl.startsWith("data:")) {
      toast.info("Use 'Download PNG' to save cards with uploaded photos.");
      return;
    }
    const params = new URLSearchParams({
      design: selectedDesign.toString(),
      title: title.trim(),
      first_name: firstName.trim() || "Celebrant",
      middle_name: middleName.trim(),
      last_name: lastName.trim(),
      position: position.trim(),
      photo_url: photoUrl.trim(),
      date_of_birth: dateOfBirth,
      message: message.trim() || defaultMessages[0],
      unit_name: position.trim(),
    });
    const fullUrl = `${window.location.origin}/api/generate?${params.toString()}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success("Card link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setTitle("");
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setPosition("");
    setPhotoUrl("https://res.cloudinary.com/dev-storage/image/upload/v1770827775/teen_khqk4d.png");
    setMessage(defaultMessages[0]);
    setSelectedDesign(0);
    toast.info("Form cleared");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Single Clean Form Card (7 cols) */}
      <Card className="lg:col-span-7 border-[var(--outline-variant)]/60 bg-white shadow-2xs rounded-2xl">
        <CardHeader className="border-b border-[var(--outline-variant)]/40 pb-4 flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold text-foreground">
              Custom Card Details
            </CardTitle>
            <CardDescription className="text-xs text-[var(--on-surface-variant)] mt-0.5">
              Create a birthday graphic for a guest, partner, or member.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-8 text-xs text-[var(--on-surface-variant)]"
          >
            Clear
          </Button>
        </CardHeader>

        <CardContent className="p-5 space-y-5">
          {/* Photo & Template Top Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--outline-variant)]/40">
            <div className="flex items-center gap-3.5">
              <Avatar className="h-14 w-14 border border-[var(--outline-variant)]/70 shrink-0">
                <AvatarImage src={photoUrl} className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                  {firstName?.[0] || "C"}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <label className={uploading ? "cursor-not-allowed opacity-70" : "cursor-pointer"}>
                    <div className="h-8 rounded-lg border border-[var(--outline-variant)] bg-white hover:bg-[var(--surface-container-low)] px-3 inline-flex items-center text-xs font-semibold text-foreground transition-colors">
                      {uploading ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary mr-1.5" />
                      ) : (
                        <Upload className="h-3.5 w-3.5 mr-1.5 text-primary" />
                      )}
                      {uploading ? "Uploading..." : "Upload Photo"}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoUrl("")}
                      className="text-xs text-[var(--on-surface-variant)] hover:text-red-600 px-1.5"
                      title="Remove photo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-[var(--on-surface-variant)]">
                  Square portrait works best
                </p>
              </div>
            </div>

            <div className="w-full sm:w-56 space-y-1.5">
              <Label className="text-xs font-medium text-[var(--on-surface-variant)]">
                Design Template
              </Label>
              <Select
                value={selectedDesign.toString()}
                onValueChange={(val) => setSelectedDesign(Number(val))}
              >
                <SelectTrigger className="h-9 bg-[var(--surface-container-low)] border-[var(--outline-variant)]/60 rounded-xl text-xs font-semibold">
                  <SelectValue placeholder="Choose template" />
                </SelectTrigger>
                <SelectContent>
                  {designs.map((d, index) => (
                    <SelectItem key={d.name || index} value={index.toString()} className="text-xs">
                      {index + 1}. {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Name Row: Title, First Name, Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="cust_title" className="text-xs font-medium text-[var(--on-surface-variant)]">
                Title (Optional)
              </Label>
              <Input
                id="cust_title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Pastor, Dr., Bro."
                className="h-10 text-sm rounded-xl border-[var(--outline-variant)]/70"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cust_first_name" className="text-xs font-medium text-[var(--on-surface-variant)]">
                First Name
              </Label>
              <Input
                id="cust_first_name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="h-10 text-sm rounded-xl border-[var(--outline-variant)]/70"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cust_last_name" className="text-xs font-medium text-[var(--on-surface-variant)]">
                Last Name
              </Label>
              <Input
                id="cust_last_name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Surname"
                className="h-10 text-sm rounded-xl border-[var(--outline-variant)]/70"
              />
            </div>
          </div>

          {/* Role & Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="cust_position" className="text-xs font-medium text-[var(--on-surface-variant)]">
                Role or Department
              </Label>
              <Input
                id="cust_position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="e.g. Choir, Protocol, Guest Minister"
                className="h-10 text-sm rounded-xl border-[var(--outline-variant)]/70"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cust_dob" className="text-xs font-medium text-[var(--on-surface-variant)]">
                Birthday Date
              </Label>
              <Input
                id="cust_dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="h-10 text-sm rounded-xl border-[var(--outline-variant)]/70"
              />
            </div>
          </div>

          {/* Greeting Message */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs font-medium text-[var(--on-surface-variant)]">
                Birthday Message
              </Label>
              {presetMessages.length > 0 && (
                <Select onValueChange={(val) => setMessage(val)}>
                  <SelectTrigger className="w-40 h-7 text-xs border-[var(--outline-variant)]/60 rounded-lg bg-[var(--surface-container-low)]">
                    <SelectValue placeholder="Use preset..." />
                  </SelectTrigger>
                  <SelectContent>
                    {presetMessages.map((msg, i) => (
                      <SelectItem key={i} value={msg} className="text-xs">
                        Preset #{i + 1}: {msg.slice(0, 28)}...
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a birthday prayer or greeting..."
              rows={3}
              className="text-sm rounded-xl border-[var(--outline-variant)]/70 leading-relaxed"
            />
          </div>
        </CardContent>
      </Card>

      {/* Live Preview Card (5 cols) */}
      <div className="lg:col-span-5 lg:sticky lg:top-6">
        <Card className="border-[var(--outline-variant)]/60 bg-white shadow-2xs rounded-2xl overflow-hidden">
          <CardHeader className="py-3.5 px-4 border-b border-[var(--outline-variant)]/40 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                Live Preview
              </CardTitle>
              <CardDescription className="text-xs text-[var(--on-surface-variant)]">
                {designs[selectedDesign]?.name || "Template"} · 1080×1080 PNG
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoomOpen(true)}
              className="h-8 text-xs text-[var(--on-surface-variant)]"
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              Zoom
            </Button>
          </CardHeader>

          <CardContent className="p-4 space-y-3.5">
            <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-[var(--outline-variant)]/50 bg-slate-900 flex items-center justify-center">
              {renderingPreview && (
                <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center text-slate-300 space-y-2 z-10 backdrop-blur-xs">
                  <RefreshCw className="h-6 w-6 animate-spin text-amber-400" />
                  <span className="text-xs">Rendering...</span>
                </div>
              )}

              {previewBlobUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewBlobUrl}
                  alt="Custom Birthday Card Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-500">
                  <Sparkles className="h-8 w-8 text-slate-600 mb-1.5" />
                  <span className="text-xs">Preparing preview...</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-10 rounded-xl"
              >
                {downloading ? (
                  <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-1.5" />
                )}
                Download PNG
              </Button>

              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="w-full border-[var(--outline-variant)]/70 bg-white text-foreground hover:bg-[var(--surface-container-low)] text-xs font-semibold h-10 rounded-xl"
              >
                {copied ? (
                  <Check className="h-4 w-4 mr-1.5 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4 mr-1.5 text-primary" />
                )}
                {copied ? "Copied!" : "Copy Link"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full Resolution Zoom Modal */}
      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-w-xl p-0 bg-slate-950 border border-slate-800 overflow-hidden text-white rounded-2xl">
          <DialogHeader className="p-4 bg-slate-900 border-b border-slate-800">
            <DialogTitle className="text-sm font-semibold text-white">
              High-Resolution Preview
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 flex items-center justify-center">
            {previewBlobUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewBlobUrl}
                alt="High-Res Birthday Card"
                className="w-full max-w-[480px] h-auto rounded-xl border border-slate-800"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
