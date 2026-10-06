"use client";

import React, { useState, useEffect } from "react";
import { designs, defaultMessages } from "@/lib/designs";
import {
  Download,
  Share2,
  Upload,
  RefreshCw,
  Sparkles,
  LayoutTemplate,
  Check,
  Copy,
  User,
  Calendar,
  Building,
  MessageSquare,
  Eye,
  X,
  UserCheck,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const COMMON_POSITIONS = [
  "Protocol Department",
  "Valued Partner & Sponsor",
  "Guest Minister",
  "Choir Member",
  "Ushering Team",
  "Youth Executive",
  "Honored Celebrant",
  "Special Guest",
];

export function CustomCardBuilder() {
  // Form states
  const [firstName, setFirstName] = useState("Ibukunoluwa");
  const [middleName, setMiddleName] = useState("Oyejoko");
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

  // Helper UI states
  const [presetMessages, setPresetMessages] = useState<string[]>(defaultMessages);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [previewLoaded, setPreviewLoaded] = useState(false);

  // Fetch preset messages from database
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

  // Build API Query Parameters for Live Preview & Download
  const buildApiParams = () => {
    return new URLSearchParams({
      design: selectedDesign.toString(),
      first_name: firstName.trim() || "Celebrant",
      middle_name: middleName.trim(),
      last_name: lastName.trim(),
      position: position.trim(),
      photo_url: photoUrl.trim(),
      date_of_birth: dateOfBirth,
      message: message.trim() || defaultMessages[0],
      unit_name: position.trim(),
    });
  };

  const previewApiUrl = `/api/generate?${buildApiParams().toString()}`;

  // Handle Photo File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local data URL preview instantly
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPhotoUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    // Also attempt remote upload to Supabase Storage if configured
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

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          setPhotoUrl(data.url);
          toast.success("Photo uploaded successfully!");
        }
      }
    } catch (err) {
      console.warn("Using local image preview fallback", err);
    } finally {
      setUploading(false);
    }
  };

  // Download High-Res PNG
  const handleDownload = async () => {
    try {
      setDownloading(true);
      toast.info("Generating high-resolution PNG birthday card...");

      const res = await fetch(previewApiUrl);
      if (!res.ok) throw new Error("Failed to render card");

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      const cleanName = `${lastName || firstName || "Celebrant"}-Birthday-Card`
        .replace(/[^a-zA-Z0-9-]/g, "_");

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${cleanName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      toast.success("Birthday card downloaded!");
    } catch (err) {
      toast.error("Failed to download image. Try again.");
    } finally {
      setDownloading(false);
    }
  };

  // Copy Image Link
  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}${previewApiUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success("Card graphics link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Reset Form
  const handleReset = () => {
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setPosition("Partner & Sponsor");
    setPhotoUrl("https://res.cloudinary.com/dev-storage/image/upload/v1770827775/teen_khqk4d.png");
    setMessage(defaultMessages[0]);
    setSelectedDesign(0);
    toast.info("Form cleared for new celebrant card!");
  };

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-linear-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              Custom Birthday Card Studio
            </h2>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Create and download custom high-res birthday graphics for non-database celebrants, special partners, and guest ministers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="border-slate-300 text-slate-700 text-xs"
          >
            Reset Form
          </Button>
        </div>
      </div>

      {/* Main 2-Column Builder Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
        
        {/* Left Column (Form Inputs - 7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card Details Section */}
          <Card className="shadow-xs border-slate-200">
            <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                1. Celebrant Information
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Enter details for unregistered members, partners, or honorees.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              
              {/* Name Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cust_first_name" className="text-xs font-semibold text-slate-700">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="cust_first_name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Ibukunoluwa"
                    className="h-10 text-xs border-slate-300"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cust_middle_name" className="text-xs font-semibold text-slate-700">
                    Middle Name (Optional)
                  </Label>
                  <Input
                    id="cust_middle_name"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    placeholder="e.g. Oyejoko"
                    className="h-10 text-xs border-slate-300"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cust_last_name" className="text-xs font-semibold text-slate-700">
                    Surname / Last Name
                  </Label>
                  <Input
                    id="cust_last_name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. OSIJONWO"
                    className="h-10 text-xs border-slate-300 font-semibold"
                  />
                </div>
              </div>

              {/* Department / Title Field */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="cust_position" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Building className="h-3.5 w-3.5 text-slate-500" />
                    Department / Role / Organization Title
                  </Label>
                  <span className="text-[10px] text-slate-400 font-mono">Displayed under name</span>
                </div>
                <Input
                  id="cust_position"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g. Protocol Department, Valued Partner, Choir Member"
                  className="h-10 text-xs border-slate-300"
                />

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-400 self-center mr-1">Quick Select:</span>
                  {COMMON_POSITIONS.map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => setPosition(pos)}
                      className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${
                        position === pos
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date of Birth & Photo Upload Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                
                {/* Date of Birth */}
                <div className="space-y-1.5">
                  <Label htmlFor="cust_dob" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    Celebration Date
                  </Label>
                  <Input
                    id="cust_dob"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="h-10 text-xs border-slate-300"
                  />
                </div>

                {/* Photo File Upload / Link */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Upload className="h-3.5 w-3.5 text-slate-500" />
                    Celebrant Photo
                  </Label>
                  
                  <div className="flex items-center gap-2">
                    <label className="flex-1 cursor-pointer">
                      <div className="h-10 border border-dashed border-slate-300 hover:border-primary bg-slate-50 hover:bg-slate-100 rounded-md px-3 flex items-center justify-center text-xs text-slate-600 font-medium transition-colors">
                        {uploading ? (
                          <RefreshCw className="h-4 w-4 animate-spin text-primary mr-1.5" />
                        ) : (
                          <Upload className="h-4 w-4 mr-1.5 text-slate-500" />
                        )}
                        {uploading ? "Uploading..." : "Upload Photo File"}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    {photoUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPhotoUrl("")}
                        className="h-10 px-2 text-slate-400 hover:text-red-500"
                        title="Clear photo"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Celebration Greeting Message Section */}
          <Card className="shadow-xs border-slate-200">
            <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  2. Prayer & Greeting Message
                </CardTitle>
                
                {presetMessages.length > 0 && (
                  <Select onValueChange={(val) => setMessage(val)}>
                    <SelectTrigger className="w-[170px] h-8 text-xs border-slate-300 bg-white">
                      <SelectValue placeholder="Preset Prayers" />
                    </SelectTrigger>
                    <SelectContent>
                      {presetMessages.map((msg, i) => (
                        <SelectItem key={i} value={msg} className="text-xs">
                          Preset #{i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write a custom birthday prayer or celebration message..."
                rows={3}
                className="text-xs border-slate-300 leading-relaxed"
              />
            </CardContent>
          </Card>

          {/* Template Selection Palette */}
          <Card className="shadow-xs border-slate-200">
            <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <LayoutTemplate className="h-4 w-4 text-primary" />
                3. Choose Design Template ({designs.length} Available)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Select a template style to instantly render the custom graphic.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {designs.map((d, index) => {
                  const isSelected = selectedDesign === index;
                  return (
                    <button
                      key={d.name || index}
                      type="button"
                      onClick={() => setSelectedDesign(index)}
                      className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between h-20 ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {d.name}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Template #{index + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right Column (Live Graphic Preview & Download Actions - 5 cols) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
          <Card className="shadow-md border-slate-300 overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-900 text-white flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  Live Graphic Preview
                </CardTitle>
                <CardDescription className="text-[11px] text-slate-300">
                  {designs[selectedDesign]?.name || "Template"} • 1080x1080 High-Res
                </CardDescription>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoomOpen(true)}
                className="h-8 text-xs text-slate-300 hover:text-white hover:bg-slate-800"
                title="Full Preview"
              >
                <Eye className="h-4 w-4 mr-1" />
                Zoom
              </Button>
            </CardHeader>

            <CardContent className="p-4 bg-slate-950 flex flex-col items-center justify-center min-h-[380px]">
              
              {/* Graphic Canvas Container */}
              <div className="relative w-full aspect-square max-w-[380px] rounded-xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900 flex items-center justify-center">
                {!previewLoaded && (
                  <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-slate-400 space-y-2 z-10">
                    <RefreshCw className="h-8 w-8 animate-spin text-amber-400" />
                    <span className="text-xs font-mono">Rendering graphic...</span>
                  </div>
                )}

                <img
                  src={previewApiUrl}
                  alt="Custom Birthday Card Preview"
                  onLoad={() => setPreviewLoaded(true)}
                  className="w-full h-full object-cover transition-opacity duration-300"
                />
              </div>

              {/* Action Buttons */}
              <div className="w-full grid grid-cols-2 gap-2 pt-4">
                <Button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md h-11"
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
                  className="w-full border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 text-xs font-semibold h-11"
                >
                  {copied ? (
                    <Check className="h-4 w-4 mr-1.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1.5" />
                  )}
                  {copied ? "Link Copied!" : "Copy Image Link"}
                </Button>
              </div>

              <p className="text-[11px] text-slate-400 font-mono text-center pt-2">
                1080x1080 PNG image formatted for Instagram, WhatsApp, & Print.
              </p>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Full Resolution Preview Dialog */}
      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-w-xl p-0 bg-slate-950 border border-slate-800 overflow-hidden text-white">
          <DialogHeader className="p-4 bg-slate-900 border-b border-slate-800">
            <DialogTitle className="text-sm font-bold text-white flex items-center gap-2">
              High Resolution Card Preview
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 flex items-center justify-center">
            <img
              src={previewApiUrl}
              alt="High-Res Birthday Card"
              className="w-full max-w-[500px] h-auto rounded-lg border border-slate-800 shadow-2xl"
            />
          </div>
          <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end gap-2">
            <Button
              onClick={handleDownload}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
            >
              <Download className="h-4 w-4 mr-1.5" />
              Download PNG
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
