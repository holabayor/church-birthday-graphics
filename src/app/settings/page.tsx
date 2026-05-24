"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { 
  Save, 
  Upload, 
  Church, 
  Image as ImageIcon, 
  MessageSquareCode, 
  Clock, 
  Server,
  MessageSquare,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  AlertCircle,
  Loader2
} from "lucide-react";
import { ChurchSettings } from "@/lib/types";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

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

  // Message management states
  const [messages, setMessages] = useState<{ id: string; message: string }[]>([]);
  const [isFallback, setIsFallback] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [newMessageText, setNewMessageText] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageText, setEditingMessageText] = useState("");
  const [savingMessage, setSavingMessage] = useState(false);

  useEffect(() => {
    // Fetch church settings
    fetch("/api/church-settings")
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) {
          setSettings(data);
        }
      });

    // Fetch messages
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoadingMessages(true);
    try {
      const res = await fetch("/api/birthday-messages");
      if (res.ok) {
        const data = await res.json();
        setMessages(data.data || []);
        setIsFallback(data.isFallback || false);
      }
    } catch (e) {
      console.error("Failed to fetch messages:", e);
    } finally {
      setLoadingMessages(false);
    }
  };

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
        toast.success("Logo uploaded successfully");
      } else {
        toast.error("Upload failed. Please try again.");
      }
    } catch {
      toast.error("Upload failed. Please try again.");
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
        toast.success("Church settings saved successfully");
      } else {
        toast.error("Failed to save settings");
      }
    } catch (error) {
      console.log("The error is ", error);
      toast.error("Failed to save settings");
    }
    setSaving(false);
  };

  // Message handlers
  const handleAddMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    setSavingMessage(true);
    try {
      const res = await fetch("/api/birthday-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessageText }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Greeting message added successfully");
        setNewMessageText("");
        fetchMessages();
      } else {
        toast.error(data.error || "Failed to add message");
      }
    } catch {
      toast.error("Failed to add message");
    } finally {
      setSavingMessage(false);
    }
  };

  const handleUpdateMessage = async (id: string) => {
    if (!editingMessageText.trim()) return;

    setSavingMessage(true);
    try {
      const res = await fetch(`/api/birthday-messages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: editingMessageText }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Greeting message updated successfully");
        setEditingMessageId(null);
        fetchMessages();
      } else {
        toast.error(data.error || "Failed to update message");
      }
    } catch {
      toast.error("Failed to update message");
    } finally {
      setSavingMessage(false);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (isFallback) {
      toast.info("Cannot delete read-only fallback messages. Run the Supabase SQL database migration to customize greetings!");
      return;
    }

    if (!confirm("Are you sure you want to delete this greeting message?")) return;

    setSavingMessage(true);
    try {
      const res = await fetch(`/api/birthday-messages/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Greeting message deleted successfully");
        fetchMessages();
      } else {
        toast.error("Failed to delete message");
      }
    } catch {
      toast.error("Failed to delete message");
    } finally {
      setSavingMessage(false);
    }
  };

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 max-w-4xl mx-auto w-full">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Server className="h-8 w-8 text-primary" />
            System Settings
          </h1>
          <p className="text-muted-foreground font-medium">
            Configure your church identity and graphic automation system.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* Church Identity Settings */}
        <Card className="shadow-sm border-zinc-200">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Church className="h-5 w-5 text-primary" />
              Church Information
            </CardTitle>
            <CardDescription>
              This information will appear on all generated birthday graphics.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium leading-none">Church Logo</label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <Avatar className="h-24 w-24 border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/30">
                  {settings?.logo_url ? (
                    <AvatarImage src={settings.logo_url} className="object-contain p-2" />
                  ) : (
                    <AvatarFallback className="bg-transparent">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading ? "Uploading..." : settings?.logo_url ? "Change Logo" : "Upload Logo"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    PNG or JPG up to 2MB. Recommended dimensions: 200x200px.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium leading-none">
                  Church Name *
                </label>
                <Input
                  value={settings?.church_name}
                  onChange={e => setSettings({ ...settings, church_name: e.target.value })}
                  placeholder="e.g. Redeemed Christian Church of God"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium leading-none">
                  Church Address
                </label>
                <Input
                  value={settings?.church_address}
                  onChange={e => setSettings({ ...settings, church_address: e.target.value })}
                  placeholder="e.g. 15 Church Street, Lagos, Nigeria"
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving Changes..." : "Save Church Info"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Birthday Greeting Messages Card */}
        <Card className="shadow-sm border-zinc-200">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Birthday Greeting Messages
            </CardTitle>
            <CardDescription>
              Manage the customized messages used when generating celebratory graphics.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isFallback && (
              <Alert className="bg-amber-500/10 text-amber-800 border-amber-500/30">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-sm">
                  <strong>Database Migration Required:</strong> The greeting system is currently running on static fallback messages. To customize, add, and delete messages, please run the SQL setup script in your Supabase editor (refer to <code className="bg-amber-500/20 px-1 rounded">SUPABASE_SETUP.md</code>).
                </AlertDescription>
              </Alert>
            )}

            {/* Add New Message Form */}
            <form onSubmit={handleAddMessage} className="space-y-3">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium leading-none">Add New Greeting Message</label>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Enter a celebratory greeting message..."
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    disabled={savingMessage}
                    className="flex-1 min-h-[80px] bg-background border-zinc-200 focus-visible:ring-zinc-900"
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={savingMessage || !newMessageText.trim()}
                className="shadow-sm"
              >
                {savingMessage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Message
                  </>
                )}
              </Button>
            </form>

            {/* Messages List */}
            <div className="space-y-4 pt-6 border-t">
              <h4 className="text-sm font-semibold text-zinc-950 uppercase tracking-wider">
                Current Birthday Messages ({messages.length})
              </h4>
              
              {loadingMessages ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No greeting messages configured. Write one above!
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const isEditing = editingMessageId === msg.id;
                    return (
                      <div 
                        key={msg.id} 
                        className="group flex flex-col md:flex-row md:items-start justify-between gap-4 p-4 rounded-xl border bg-zinc-50/50 hover:bg-zinc-50 transition-all border-zinc-200/80"
                      >
                        <div className="flex-1 text-sm text-zinc-800 leading-relaxed font-medium">
                          {isEditing ? (
                            <Textarea
                              value={editingMessageText}
                              onChange={(e) => setEditingMessageText(e.target.value)}
                              className="w-full bg-white border-zinc-300 focus-visible:ring-zinc-900 min-h-[80px]"
                            />
                          ) : (
                            <p>{msg.message}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end md:self-start">
                          {isEditing ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 border-zinc-200 text-zinc-700 bg-white shadow-xs"
                                onClick={() => {
                                  handleUpdateMessage(msg.id);
                                }}
                                disabled={savingMessage || !editingMessageText.trim()}
                              >
                                <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-zinc-500 hover:text-zinc-900"
                                onClick={() => setEditingMessageId(null)}
                                disabled={savingMessage}
                              >
                                <X className="h-3.5 w-3.5 mr-1.5" />
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                                onClick={() => {
                                  if (isFallback) {
                                    toast.info("Cannot edit read-only fallback messages. Run Supabase setup SQL in SUPABASE_SETUP.md first!");
                                    return;
                                  }
                                  setEditingMessageId(msg.id);
                                  setEditingMessageText(msg.message);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-zinc-500 hover:text-destructive hover:bg-destructive/10 transition-colors"
                                onClick={() => handleDeleteMessage(msg.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp Integration Info */}
        <Card className="shadow-sm bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquareCode className="h-5 w-5 text-primary" />
              WhatsApp Integration
            </CardTitle>
            <CardDescription className="text-primary/80">
              To enable automatic WhatsApp sending, set up the following environment variables on your server infrastructure.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-background rounded-lg p-4 border font-mono text-sm text-muted-foreground">
              <div className="flex flex-col gap-1.5">
                <div><span className="text-primary font-medium">WHATSAPP_TOKEN</span>=your_whatsapp_cloud_api_token</div>
                <div><span className="text-primary font-medium">WHATSAPP_PHONE_ID</span>=your_phone_number_id</div>
                <div><span className="text-primary font-medium">WHATSAPP_GROUP_ID</span>=recipient_phone_or_group_id</div>
                <div><span className="text-primary font-medium">CRON_SECRET</span>=a_secret_for_cron_auth</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Get these credentials from the Meta Business / WhatsApp Cloud API dashboard at <a href="https://developers.facebook.com" className="underline hover:text-primary" target="_blank" rel="noreferrer">developers.facebook.com</a>.
            </p>
          </CardContent>
        </Card>

        {/* Cron Job Info */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Cron Job Automation
            </CardTitle>
            <CardDescription>
              Set up a daily cron job to automatically check for birthdays and dispatch graphics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg p-4 border font-mono text-sm text-muted-foreground space-y-1">
              <div><span className="text-amber-600 dark:text-amber-400 font-bold">POST</span> /api/birthdays/send</div>
              <div><span className="text-blue-600 dark:text-blue-400">Authorization</span>: Bearer YOUR_CRON_SECRET</div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              If deploying on Vercel, add a <code className="bg-muted px-1 rounded">vercel.json</code> with cron configuration. Otherwise, use any standard cron service (e.g., cron-job.org).
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
