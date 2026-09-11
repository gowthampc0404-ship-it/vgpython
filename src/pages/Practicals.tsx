import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Copy,
  Check,
  FileCode2,
  PackageOpen,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { downloadText } from "@/lib/download";
import { PRACTICAL_SCRIPTS } from "@/lib/practicalScripts";

const CATEGORIES = [
  "All",
  "Python",
  "Data Structures",
  "File Handling",
  "CSV",
  "MySQL",
] as const;

export default function Practicals() {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(PRACTICAL_SCRIPTS[0]?.id ?? null);
  const [copied, setCopied] = useState<string | null>(null);

  const list = useMemo(
    () =>
      PRACTICAL_SCRIPTS.filter(
        (s) =>
          (cat === "All" || s.category === cat) &&
          (s.title + s.aim + s.file).toLowerCase().includes(q.trim().toLowerCase())
      ),
    [cat, q]
  );

  const copy = async (id: string, code: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(id);
    toast.success("Program copied");
    setTimeout(() => setCopied(null), 1500);
  };

  const downloadAll = () => {
    const bundle = PRACTICAL_SCRIPTS.map(
      (s) => `${"#".repeat(64)}\n# FILE: ${s.file}\n${"#".repeat(64)}\n\n${s.code}`
    ).join("\n\n");
    downloadText("vgpython_practical_file.py", bundle);
    toast.success("All programs downloaded");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-2.5">
          <Button asChild variant="ghost" size="sm" className="gap-1.5 px-2">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
          </Button>
          <p className="font-mono text-sm font-medium">practical_file/</p>
          <Button size="sm" className="ml-auto gap-1.5" onClick={downloadAll}>
            <PackageOpen className="h-4 w-4" />
            Download all
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-20 pt-8">
        <h1 className="text-3xl font-extrabold tracking-tight">The Practical File Hub</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Formatted, commented and verified programs with the Aim line already written.
          Download a single file or the complete set and paste it straight into your board
          practical record.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search programs"
              className="h-9 w-48 pl-8"
            />
          </div>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                cat === c
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {list.length === 0 && (
            <p className="text-sm text-muted-foreground">No programs match that search.</p>
          )}
          {list.map((s, i) => {
            const open = openId === s.id;
            return (
              <article key={s.id} className="rounded-xl border border-border bg-card">
                <div className="flex flex-wrap items-start gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileCode2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold leading-snug">
                        {i + 1}. {s.title}
                      </h2>
                      <Badge variant="secondary" className="text-[10px]">
                        {s.category}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      <strong className="text-foreground/80">Aim:</strong> {s.aim}
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                      {s.file}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => copy(s.id, s.code)}
                    >
                      {copied === s.id ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => downloadText(s.file, s.code)}
                    >
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Download</span>
                    </Button>
                  </div>
                </div>

                <button
                  onClick={() => setOpenId(open ? null : s.id)}
                  className="w-full border-t border-border px-4 py-2 text-left font-mono text-[11px] text-primary"
                >
                  {open ? "Hide code" : "Show code"}
                </button>

                {open && (
                  <pre className="overflow-x-auto border-t border-border bg-editor-bg p-4 font-mono text-[12.5px] leading-6">
                    {s.code}
                  </pre>
                )}
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
