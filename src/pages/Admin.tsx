import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DAILY_AI_LIMIT } from "@/lib/anonId";
import {
  RefreshCw,
  Lock,
  Activity,
  Users,
  Zap,
  RotateCcw,
  LogOut,
  Search,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface UsageRow {
  anon_id: string;
  request_type: string;
  created_at: string;
}

interface ResetRow {
  anon_id: string;
  reset_at: string;
}

interface UserStat {
  anonId: string;
  today: number;
  total: number;
  sinceReset: number;
  last: string;
  first: string;
  byType: Record<string, number>;
  lastReset: string | null;
}

const AUTH_KEY = "vgpython_admin_ok";

const TYPE_LABELS: Record<string, string> = {
  explain: "Explain code",
  explain_line: "Explain line",
  explain_all_lines: "Explain all lines",
  explain_error: "Explain error",
  explain_output: "Explain output",
  chat: "Chat",
};

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}

export default function Admin() {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem(AUTH_KEY) === "1"
  );
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [rows, setRows] = useState<UsageRow[]>([]);
  const [resets, setResets] = useState<ResetRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sort, setSort] = useState<"today" | "total" | "recent">("today");

  const load = async () => {
    setLoading(true);
    const [usage, resetData] = await Promise.all([
      supabase
        .from("ai_usage")
        .select("anon_id, request_type, created_at")
        .order("created_at", { ascending: false })
        .limit(5000),
      supabase
        .from("ai_credit_resets")
        .select("anon_id, reset_at")
        .order("reset_at", { ascending: false })
        .limit(2000),
    ]);
    setRows((usage.data as UsageRow[]) ?? []);
    setResets((resetData.data as ResetRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (authed) load();
  }, [authed]);

  const lastResetMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of resets) {
      const cur = m.get(r.anon_id);
      if (!cur || new Date(r.reset_at) > new Date(cur)) m.set(r.anon_id, r.reset_at);
    }
    return m;
  }, [resets]);

  const stats = useMemo<UserStat[]>(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const map = new Map<string, UserStat>();
    for (const r of rows) {
      let s = map.get(r.anon_id);
      if (!s) {
        s = {
          anonId: r.anon_id,
          today: 0,
          total: 0,
          sinceReset: 0,
          last: r.created_at,
          first: r.created_at,
          byType: {},
          lastReset: lastResetMap.get(r.anon_id) ?? null,
        };
        map.set(r.anon_id, s);
      }
      const at = new Date(r.created_at);
      s.total += 1;
      s.byType[r.request_type] = (s.byType[r.request_type] ?? 0) + 1;
      if (at >= startOfDay) s.today += 1;
      const resetAt = s.lastReset ? new Date(s.lastReset) : null;
      const windowStart = resetAt && resetAt > startOfDay ? resetAt : startOfDay;
      if (at >= windowStart) s.sinceReset += 1;
      if (at > new Date(s.last)) s.last = r.created_at;
      if (at < new Date(s.first)) s.first = r.created_at;
    }
    const list = [...map.values()];
    list.sort((a, b) => {
      if (sort === "total") return b.total - a.total;
      if (sort === "recent")
        return new Date(b.last).getTime() - new Date(a.last).getTime();
      return b.sinceReset - a.sinceReset || b.total - a.total;
    });
    return list;
  }, [rows, lastResetMap, sort]);

  const filtered = useMemo(
    () =>
      stats.filter((s) =>
        s.anonId.toLowerCase().includes(query.trim().toLowerCase())
      ),
    [stats, query]
  );

  const totalToday = stats.reduce((n, s) => n + s.today, 0);
  const hourAgo = Date.now() - 3600_000;
  const activeNow = stats.filter((s) => new Date(s.last).getTime() > hourAgo).length;
  const atLimit = stats.filter((s) => s.sinceReset >= DAILY_AI_LIMIT).length;

  const typeTotals = useMemo(() => {
    const t: Record<string, number> = {};
    for (const r of rows) t[r.request_type] = (t[r.request_type] ?? 0) + 1;
    return Object.entries(t).sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const resetOne = async (anonId: string) => {
    const { error } = await supabase
      .from("ai_credit_resets")
      .insert({ anon_id: anonId });
    if (error) {
      toast.error("Could not reset credits");
      return;
    }
    toast.success(`Credits reset for ${anonId}`);
    load();
  };

  const resetAll = async () => {
    if (filtered.length === 0) return;
    const { error } = await supabase
      .from("ai_credit_resets")
      .insert(filtered.map((s) => ({ anon_id: s.anonId })));
    if (error) {
      toast.error("Could not reset credits");
      return;
    }
    toast.success(`Credits reset for ${filtered.length} visitors`);
    load();
  };

  const signOut = () => {
    sessionStorage.removeItem(AUTH_KEY);
    setAuthed(false);
    setId("");
    setPw("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (id.trim() === "admin123" && pw === "gowtham") {
      sessionStorage.setItem(AUTH_KEY, "1");
      setAuthed(true);
      setErr("");
    } else {
      setErr("Wrong ID or password.");
    }
  };

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="h-4 w-4" /> Admin sign in
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-3">
              <Input
                placeholder="ID"
                value={id}
                onChange={(e) => setId(e.target.value)}
                autoFocus
              />
              <Input
                type="password"
                placeholder="Password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
              />
              {err && <p className="text-sm text-destructive">{err}</p>}
              <Button type="submit" className="w-full">
                Enter
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">VGPYTHON admin dashboard</h1>
            <p className="text-sm text-muted-foreground">
              AI credit limit: {DAILY_AI_LIMIT} requests per visitor per day
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Visitors", value: stats.length, icon: Users },
            { label: "Requests today", value: totalToday, icon: Zap },
            { label: "Active last hour", value: activeNow, icon: Activity },
            { label: "At credit limit", value: atLimit, icon: Lock },
          ].map((c) => (
            <Card key={c.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{c.label}</p>
                  <c.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{c.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Requests by feature</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {typeTotals.length === 0 && (
              <p className="text-sm text-muted-foreground">Nothing recorded yet.</p>
            )}
            {typeTotals.map(([type, count]) => (
              <div key={type} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{TYPE_LABELS[type] ?? type}</span>
                  <span className="text-muted-foreground">{count}</span>
                </div>
                <Progress value={(count / (typeTotals[0]?.[1] || 1)) * 100} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
            <CardTitle className="text-base">Visitors</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="h-9 w-44 pl-8"
                  placeholder="Search visitor"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <select
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
              >
                <option value="today">Sort: credits used</option>
                <option value="total">Sort: total requests</option>
                <option value="recent">Sort: most recent</option>
              </select>
              <Button variant="outline" size="sm" onClick={resetAll}>
                <RotateCcw className="h-4 w-4" />
                Reset all shown
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground">No visitors found.</p>
            )}
            {filtered.map((s) => {
              const used = s.sinceReset;
              const pct = Math.min(100, (used / DAILY_AI_LIMIT) * 100);
              const open = expanded === s.anonId;
              return (
                <div key={s.anonId} className="rounded-lg border p-3 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      className="flex items-center gap-1.5 text-sm font-medium"
                      onClick={() => setExpanded(open ? null : s.anonId)}
                    >
                      {open ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      {s.anonId}
                    </button>
                    <div className="flex items-center gap-2">
                      <Badge variant={pct >= 100 ? "destructive" : "secondary"}>
                        {used}/{DAILY_AI_LIMIT} credits used
                      </Badge>
                      <Badge variant="outline">{s.total} all time</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resetOne(s.anonId)}
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reset
                      </Button>
                    </div>
                  </div>
                  <Progress value={pct} />
                  <p className="text-xs text-muted-foreground">
                    Last active {relTime(s.last)}
                    {s.lastReset && ` · reset ${relTime(s.lastReset)}`}
                  </p>
                  {open && (
                    <div className="grid gap-1 pt-2 text-xs text-muted-foreground sm:grid-cols-2">
                      <p>First seen: {new Date(s.first).toLocaleString()}</p>
                      <p>Last seen: {new Date(s.last).toLocaleString()}</p>
                      {Object.entries(s.byType)
                        .sort((a, b) => b[1] - a[1])
                        .map(([t, n]) => (
                          <p key={t}>
                            {TYPE_LABELS[t] ?? t}: {n}
                          </p>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {rows.slice(0, 25).map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b pb-1.5 text-sm last:border-0"
              >
                <span className="font-medium">{r.anon_id}</span>
                <span className="text-muted-foreground">
                  {TYPE_LABELS[r.request_type] ?? r.request_type}
                </span>
                <span className="text-xs text-muted-foreground">
                  {relTime(r.created_at)}
                </span>
              </div>
            ))}
            {rows.length === 0 && (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
