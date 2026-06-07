"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Copy, Download, MessageCircle, Search } from "lucide-react";
import { AttendanceSession, ChurchUnit } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type OutreachRow = {
  id: string;
  name: string;
  phone_number: string | null;
  member_type: string;
  date_of_birth?: string;
  attendance_status?: string;
  follow_up_status?: string;
  assigned_to?: string | null;
  unit_role?: string;
  units?: Array<{ name: string; role: string }>;
};

const toCsv = (rows: OutreachRow[]) => {
  const columns = ["name", "phone_number", "member_type", "date_of_birth", "follow_up_status", "assigned_to", "unit_role", "units"];
  const escape = (value: unknown) => {
    const text = value === null || value === undefined ? "" : String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  return [
    columns.join(","),
    ...rows.map(row => columns.map(column => {
      if (column === "units") return escape((row.units || []).map(unit => `${unit.name}:${unit.role}`).join("; "));
      return escape(row[column as keyof OutreachRow]);
    }).join(",")),
  ].join("\r\n");
};

const downloadCsv = (rows: OutreachRow[], filename: string) => {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export default function OutreachPage() {
  const [activeTab, setActiveTab] = useState("birthdays");
  const [birthdayRange, setBirthdayRange] = useState("today");
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [units, setUnits] = useState<ChurchUnit[]>([]);
  const [unitId, setUnitId] = useState("");
  const [rows, setRows] = useState<OutreachRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter(row =>
      row.name.toLowerCase().includes(query) ||
      row.phone_number?.includes(query) ||
      row.member_type?.toLowerCase().includes(query) ||
      row.follow_up_status?.toLowerCase().includes(query) ||
      row.units?.some(unit => unit.name.toLowerCase().includes(query))
    );
  }, [rows, search]);

  const phoneList = filteredRows
    .map(row => row.phone_number)
    .filter(Boolean)
    .join("\n");

  useEffect(() => {
    Promise.all([
      fetch("/api/attendance/sessions").then(res => res.ok ? res.json() : { data: [] }),
      fetch("/api/units").then(res => res.ok ? res.json() : { data: [] }),
    ]).then(([sessionsData, unitsData]) => {
      const loadedSessions = Array.isArray(sessionsData.data) ? sessionsData.data : [];
      const loadedUnits = Array.isArray(unitsData.data) ? unitsData.data : [];
      setSessions(loadedSessions);
      setUnits(loadedUnits);
      if (loadedSessions[0]) setSessionId(loadedSessions[0].id);
      if (loadedUnits[0]) setUnitId(loadedUnits[0].id);
    });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({ type: activeTab });
    if (activeTab === "birthdays") params.set("range", birthdayRange);
    if (activeTab === "absentees") {
      if (!sessionId) {
        setRows([]);
        return;
      }
      params.set("session_id", sessionId);
    }
    if (activeTab === "units") {
      if (!unitId) {
        setRows([]);
        return;
      }
      params.set("unit_id", unitId);
    }

    setLoading(true);
    fetch(`/api/outreach?${params.toString()}`)
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load outreach list");
        setRows(Array.isArray(data.data) ? data.data : []);
      })
      .catch(err => {
        setRows([]);
        toast.error(err.message || "Failed to load outreach list");
      })
      .finally(() => setLoading(false));
  }, [activeTab, birthdayRange, sessionId, unitId]);

  const copyPhones = async () => {
    if (!phoneList) {
      toast.info("No phone numbers to copy");
      return;
    }
    await navigator.clipboard.writeText(phoneList);
    toast.success("Phone list copied");
  };

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 w-full">
      <div className="space-y-1.5">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <MessageCircle className="h-8 w-8 text-primary" />
          Outreach Lists
        </h1>
        <p className="text-muted-foreground font-medium">
          Prepare WhatsApp-ready contact lists for birthdays, absentees, and church units.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Contact Builder</CardTitle>
            <CardDescription>{filteredRows.length} contacts in the current list</CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={copyPhones}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Phones
            </Button>
            <Button variant="outline" onClick={() => downloadCsv(filteredRows, `${activeTab}-outreach.csv`)}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="birthdays">Birthdays</TabsTrigger>
              <TabsTrigger value="absentees">Absentees</TabsTrigger>
              <TabsTrigger value="units">Units</TabsTrigger>
            </TabsList>

            <div className="mt-4 grid gap-3 md:grid-cols-[220px_1fr]">
              <TabsContent value="birthdays" className="m-0">
                <Select value={birthdayRange} onValueChange={setBirthdayRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Next 7 Days</SelectItem>
                    <SelectItem value="month">Next 31 Days</SelectItem>
                  </SelectContent>
                </Select>
              </TabsContent>

              <TabsContent value="absentees" className="m-0">
                <Select value={sessionId} onValueChange={setSessionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select session" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map(session => (
                      <SelectItem key={session.id} value={session.id}>
                        {session.title} - {new Date(session.session_date).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TabsContent>

              <TabsContent value="units" className="m-0">
                <Select value={unitId} onValueChange={setUnitId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(unit => (
                      <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TabsContent>

              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search list..."
                  className="pl-9"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
          </Tabs>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No contacts found for this list.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRows.map(row => (
                <div key={`${activeTab}-${row.id}`} className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-900">{row.name}</p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>{row.phone_number || "No phone"}</span>
                      <Badge variant="outline" className="capitalize">{row.member_type}</Badge>
                      {row.date_of_birth && <Badge variant="secondary">{new Date(row.date_of_birth).toLocaleDateString()}</Badge>}
                      {row.follow_up_status && <Badge variant="secondary" className="capitalize">{row.follow_up_status.replace(/_/g, " ")}</Badge>}
                      {row.unit_role && <Badge variant="secondary" className="capitalize">{row.unit_role}</Badge>}
                    </div>
                    {(row.units || []).length > 0 && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {(row.units || []).map(unit => `${unit.name} (${unit.role})`).join(", ")}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!row.phone_number) return;
                      navigator.clipboard.writeText(row.phone_number);
                      toast.success("Phone number copied");
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
