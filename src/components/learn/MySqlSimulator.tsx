import { useMemo, useState } from "react";
import { Play, RotateCcw, Table2, Terminal, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { runSql, seedDatabase, type Database, type QueryResult } from "@/lib/miniSql";

const EXAMPLES = [
  "SELECT * FROM student;",
  "SELECT name, marks FROM student WHERE marks > 70 ORDER BY marks DESC;",
  "SELECT stream, COUNT(*), AVG(marks) FROM student GROUP BY stream;",
  "INSERT INTO student VALUES (6,'Nila','Commerce',81,'Erode');",
  "UPDATE student SET marks = marks + 5 WHERE stream = 'Science';",
  "DELETE FROM student WHERE marks < 60;",
  "SELECT * FROM library WHERE title LIKE '%MySQL%';",
];

export default function MySqlSimulator() {
  const [db, setDb] = useState<Database>(() => seedDatabase());
  const [sql, setSql] = useState("SELECT * FROM student;");
  const [log, setLog] = useState<{ sql: string; res: QueryResult }[]>([]);
  const [active, setActive] = useState("student");
  const [tick, setTick] = useState(0);

  const tables = Object.values(db);
  const current = useMemo(
    () => db[active] ?? tables[0],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, active, tick]
  );

  const execute = () => {
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
    const entries: { sql: string; res: QueryResult }[] = [];
    for (const st of statements) {
      const res = runSql(db, st);
      entries.push({ sql: st, res });
      const target = st.match(/(?:from|into|table|update)\s+(\w+)/i);
      if (target && db[target[1].toLowerCase()]) setActive(target[1].toLowerCase());
    }
    setDb(db);
    setTick((t) => t + 1);
    setLog((l) => [...entries.reverse(), ...l].slice(0, 20));
  };

  const reset = () => {
    setDb(seedDatabase());
    setLog([]);
    setActive("student");
    setTick((t) => t + 1);
  };

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
        <Terminal className="h-4 w-4 text-primary" />
        <span className="font-mono text-sm font-medium">MySQL simulator</span>
        <Badge variant="secondary" className="font-mono text-[10px]">
          database: school
        </Badge>
        <Button variant="ghost" size="sm" className="ml-auto gap-1.5" onClick={reset}>
          <RotateCcw className="h-3.5 w-3.5" /> Reset data
        </Button>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-2">
        {/* Query side */}
        <div className="space-y-3">
          <textarea
            value={sql}
            spellCheck={false}
            onChange={(e) => setSql(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") execute();
            }}
            rows={6}
            className="w-full resize-y rounded-md border border-border bg-editor-bg p-3 font-mono text-[12.5px] leading-6 outline-none focus:border-primary"
            aria-label="SQL query"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" className="gap-1.5" onClick={execute}>
              <Play className="h-3.5 w-3.5" /> Run query
            </Button>
            <span className="font-mono text-[11px] text-muted-foreground">
              Ctrl + Enter
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setSql(ex)}
                className="rounded-full border border-border px-2.5 py-1 text-left font-mono text-[10.5px] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {ex.length > 44 ? ex.slice(0, 42) + "…" : ex}
              </button>
            ))}
          </div>

          <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border border-border bg-editor-bg p-3">
            {log.length === 0 && (
              <p className="font-mono text-[12px] text-muted-foreground">
                mysql&gt; run a query to see the result here
              </p>
            )}
            {log.map((entry, i) => (
              <div key={i} className="font-mono text-[12px]">
                <p className="flex gap-1.5 text-muted-foreground">
                  <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                  <span className="break-all">{entry.sql};</span>
                </p>
                {entry.res.kind === "error" ? (
                  <p className="pl-5 text-destructive">ERROR: {entry.res.message}</p>
                ) : entry.res.kind === "message" ? (
                  <p className="pl-5 text-success">{entry.res.message}</p>
                ) : (
                  <p className="pl-5 text-success">
                    {entry.res.rows?.length ?? 0} row(s) in set
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Live table side */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {tables.map((t) => (
              <button
                key={t.name}
                onClick={() => setActive(t.name.toLowerCase())}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[11px] ${
                  current?.name === t.name
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                <Table2 className="h-3.5 w-3.5" />
                {t.name} ({t.rows.length})
              </button>
            ))}
          </div>

          {/* Result of latest SELECT */}
          {log[0]?.res.kind === "rows" && (
            <ResultTable
              title="Query result"
              columns={log[0].res.columns ?? []}
              rows={log[0].res.rows ?? []}
              highlight
            />
          )}

          {current && (
            <ResultTable
              title={`Live table: ${current.name}`}
              columns={current.columns.map((c) => c.name)}
              rows={current.rows}
            />
          )}
        </div>
      </div>
    </section>
  );
}

function ResultTable({
  title,
  columns,
  rows,
  highlight,
}: {
  title: string;
  columns: string[];
  rows: Record<string, any>[];
  highlight?: boolean;
}) {
  return (
    <div
      className={`overflow-hidden rounded-md border ${
        highlight ? "border-primary/50" : "border-border"
      }`}
    >
      <p
        className={`px-3 py-1.5 font-mono text-[11px] ${
          highlight ? "bg-primary/10 text-primary" : "bg-editor-gutter text-muted-foreground"
        }`}
      >
        {title} · {rows.length} row(s)
      </p>
      <div className="max-h-72 overflow-auto">
        <table className="w-full border-collapse font-mono text-[12px]">
          <thead>
            <tr className="bg-editor-gutter">
              {columns.map((c) => (
                <th
                  key={c}
                  className="whitespace-nowrap border-b border-border px-3 py-1.5 text-left font-semibold"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="odd:bg-muted/20">
                {columns.map((c) => (
                  <td
                    key={c}
                    className="whitespace-nowrap border-b border-border/60 px-3 py-1.5"
                  >
                    {r[c] === null || r[c] === undefined ? (
                      <span className="text-muted-foreground">NULL</span>
                    ) : (
                      String(r[c])
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={Math.max(columns.length, 1)}
                  className="px-3 py-3 text-center text-muted-foreground"
                >
                  Empty set
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
