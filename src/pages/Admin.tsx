import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { DAILY_AI_LIMIT } from "@/lib/anonId";
import { RefreshCw, Lock, Activity } from "lucide-react";

interface UsageRow {
  anon_id: string;
  request_type: string;
  created_at: string;
}

interface UserStat {
  anonId: string;
  today: number;
  total: number;
  last: string;
}

const AUTH_KEY = "vgpython_admin_ok";

export default function Admin() {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem(AUTH_KEY) === "1"
  );
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [rows, setRows] = useState<UsageRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("ai_usage")
      .select("anon_id, request_type, created_at")
      .order("created_at", { ascending: false })
      .limit(5000);
    setRows((data as UsageRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (authed) load();
  }, [authed]);

  const stats = useMemo<UserStat[]>(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const map = new Map<string, UserStat>();
    for (const r of rows) {
      const s =
        map.get(r.anon_id) ??
        { anonId: r.anon_id, today: 0, total: 0, last: r.created_at };
      s.total += 1;
      if (new Date(r.created_at) >= startOfDay) s.today += 1;
      if (new Date(r.created_at) > new Date(s.last)) s.last = r.created_at;
      map.set(r.anon_id, s);
    }
    return [...map.values()].sort((a, b) => b.today - a.today || b.total - a.total);
  }, [rows]);

  const totalToday = stats.reduce((n, s) => n + s.today, 0);

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
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">AI usage dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Daily limit per visitor: {DAILY_AI_LIMIT} requests
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Visitors</p>
              <p className="text-2xl font-bold">{stats.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Requests today</p>
              <p className="text-2xl font-bold">{totalToday}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Requests total</p>
              <p className="text-2xl font-bold">{rows.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" /> Per visitor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.length === 0 && (
              <p className="text-sm text-muted-foreground">No usage recorded yet.</p>
            )}
            {stats.map((s) => {
              const pct = Math.min(100, (s.today / DAILY_AI_LIMIT) * 100);
              return (
                <div key={s.anonId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{s.anonId}</span>
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span>
                        {s.today}/{DAILY_AI_LIMIT} today
                      </span>
                      <Badge variant={pct >= 100 ? "destructive" : "secondary"}>
                        {s.total} total
                      </Badge>
                    </span>
                  </div>
                  <Progress value={pct} />
                  <p className="text-xs text-muted-foreground">
                    Last used {new Date(s.last).toLocaleString()}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
