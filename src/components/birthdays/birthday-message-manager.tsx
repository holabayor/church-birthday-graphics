"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Check, Loader2, MessageSquare, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

type BirthdayMessage = {
  id: string;
  message: string;
};

export function BirthdayMessageManager() {
  const [messages, setMessages] = useState<BirthdayMessage[]>([]);
  const [isFallback, setIsFallback] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [newMessageText, setNewMessageText] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageText, setEditingMessageText] = useState("");
  const [savingMessage, setSavingMessage] = useState(false);

  const fetchMessages = async () => {
    setLoadingMessages(true);
    try {
      const res = await fetch("/api/birthday-messages");
      if (res.ok) {
        const data = await res.json();
        setMessages(data.data || []);
        setIsFallback(data.isFallback || false);
      }
    } catch (error) {
      console.error("Failed to fetch birthday messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleAddMessage = async (event: React.FormEvent) => {
    event.preventDefault();
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
      toast.info("Cannot delete read-only fallback messages. Run the Supabase SQL database migration to customize greetings.");
      return;
    }

    if (!confirm("Are you sure you want to delete this greeting message?")) return;

    setSavingMessage(true);
    try {
      const res = await fetch(`/api/birthday-messages/${id}`, { method: "DELETE" });

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
    <Card className="overflow-hidden border-[var(--outline-variant)] bg-white shadow-sm">
      <CardHeader className="gap-2 border-b border-[var(--outline-variant)] bg-white pb-5">
        <CardTitle className="flex items-center gap-2 font-[var(--font-manrope)] text-xl text-[#0B1C30]">
          <MessageSquare className="h-5 w-5 text-primary" />
          Birthday Greeting Messages
        </CardTitle>
        <CardDescription>
          Manage the messages used when generating birthday graphics and outreach copy.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isFallback && (
          <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-sm">
              <strong>Database Migration Required:</strong> The greeting system is currently using static fallback messages. Run the birthday_messages SQL setup before customizing messages.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleAddMessage} className="space-y-3">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium leading-none">Add New Greeting Message</label>
            <Textarea
              placeholder="Enter a celebratory greeting message..."
              value={newMessageText}
              onChange={event => setNewMessageText(event.target.value)}
              disabled={savingMessage}
              className="min-h-[96px] bg-background"
            />
          </div>
          <Button type="submit" disabled={savingMessage || !newMessageText.trim()}>
            {savingMessage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Add Message
          </Button>
        </form>

        <div className="space-y-4 border-t border-[var(--outline-variant)] pt-6">
          <h4 className="font-mono text-[12px] font-medium uppercase tracking-[0.05em] text-muted-foreground">
            Current Birthday Messages ({messages.length})
          </h4>

          {loadingMessages ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          ) : messages.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-muted-foreground">
              No greeting messages configured yet.
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map(message => {
                const isEditing = editingMessageId === message.id;

                return (
                  <div
                    key={message.id}
                    className="group flex flex-col gap-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-4 transition-all hover:bg-zinc-50 md:flex-row md:items-start md:justify-between"
                  >
                    <div className="flex-1 text-sm font-medium leading-relaxed text-zinc-800">
                      {isEditing ? (
                        <Textarea
                          value={editingMessageText}
                          onChange={event => setEditingMessageText(event.target.value)}
                          className="min-h-[88px] w-full bg-white"
                        />
                      ) : (
                        <p>{message.message}</p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2 self-end md:self-start">
                      {isEditing ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-zinc-200 bg-white text-zinc-700 shadow-xs"
                            onClick={() => handleUpdateMessage(message.id)}
                            disabled={savingMessage || !editingMessageText.trim()}
                          >
                            <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-zinc-500 hover:text-zinc-900"
                            onClick={() => setEditingMessageId(null)}
                            disabled={savingMessage}
                          >
                            <X className="mr-1.5 h-3.5 w-3.5" />
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                            onClick={() => {
                              if (isFallback) {
                                toast.info("Cannot edit read-only fallback messages. Run the birthday_messages setup SQL first.");
                                return;
                              }
                              setEditingMessageId(message.id);
                              setEditingMessageText(message.message);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-zinc-500 transition-colors hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDeleteMessage(message.id)}
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
  );
}
