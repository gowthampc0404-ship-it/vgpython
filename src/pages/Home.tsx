import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Braces,
  FileCode2,
  Database,
  FolderCheck,
  Copy,
  Smartphone,
  MousePointerClick,
  Send,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

function getAnonId(): string {
  const key = "pylearn_anon_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = "User_" + Math.floor(1000 + Math.random() * 9000);
    localStorage.setItem(key, id);
  }
  return id;
}

const MODULES = [
  {
    icon: Braces,
    title: "Python Fundamentals & Data Structures",
    description:
      "Master the logic. Step-by-step breakdowns of loops, functions, and Stack implementations with easy-to-copy code snippets.",
    action: "Explore Stacks & Functions",
  },
  {
    icon: FileCode2,
    title: "File Handling & Simulations",
    description:
      "Text, Binary, and CSV files demystified. Use interactive simulators to see read/write operations in action.",
    action: "Try File Simulators",
  },
  {
    icon: Database,
    title: "MySQL & Database Connectivity",
    description:
      "Connect Python to MySQL without syntax errors. Ready-to-use boilerplate code for all CRUD operations.",
    action: "View MySQL Scripts",
  },
  {
    icon: FolderCheck,
    title: "The Practical File Hub",
    description:
      "Full-marks blueprint. Formatted and verified scripts ready to compile into your final board submission.",
    action: "Download Practical Code",
  },
];

const FEATURES = [
  {
    icon: MousePointerClick,
    title: "Interactive File Simulators",
    body: "Visually track pointer movements and record writes in text/CSV files directly in the browser.",
  },
  {
    icon: Smartphone,
    title: "Mobile-Optimized Code Views",
    body: "Syntax-highlighted code blocks formatted for smartphone screens without breaking text width.",
  },
  {
    icon: Copy,
    title: "One-Click Copy",
    body: "Fast clipboard copy buttons on all code snippets to speed up practical assignments.",
  },
];

const PREVIEW_CODE = [
  { n: 1, t: "# stack_demo.py" },
  { n: 2, t: "stack = []" },
  { n: 3, t: "def push(item):" },
  { n: 4, t: "    stack.append(item)" },
  { n: 5, t: "def pop():" },
  { n: 6, t: "    return stack.pop()" },
  { n: 7, t: "push(10); push(20)" },
  { n: 8, t: "print(pop())  # 20" },
];

export default function Home() {
  const [topic, setTopic] = useState("");
  const [sending, setSending] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    if (!showIntro) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showIntro]);

  const submitTopic = async () => {
    const trimmed = topic.trim();
    if (!trimmed) {
      toast.error("Please type a topic or question first.");
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-feedback", {
        body: { anon_id: getAnonId(), message: `[Topic request] ${trimmed}` },
      });
      if (error) throw error;
      setTopic("");
      toast.success("Topic requested 🎉", {
        description: "We'll add the breakdown in the next update.",
      });
    } catch (e: any) {
      toast.error("Couldn't send your request", {
        description: e?.message || "Please try again in a moment.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {showIntro && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
          role="dialog"
          aria-label="VGPYTHON introduction"
        >
          <video
            className="h-full w-full object-contain"
            src="/vgpython-intro.mp4"
            autoPlay
            playsInline
            onEnded={() => setShowIntro(false)}
            onError={() => setShowIntro(false)}
            aria-label="VGPYTHON opening animation"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setShowIntro(false)}
            className="absolute right-4 top-4 gap-1.5 border border-border bg-secondary/90 shadow-lg backdrop-blur-sm"
            aria-label="Skip introduction"
          >
            Skip <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            background:
              "radial-gradient(600px circle at 50% -10%, hsl(var(--primary) / 0.25), transparent 60%), radial-gradient(500px circle at 80% 10%, hsl(var(--accent) / 0.25), transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-4xl px-5 py-20 text-center sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 font-mono text-[11px] uppercase tracking-widest text-primary shadow-[0_0_24px_-6px_hsl(var(--primary)/0.7)]">
            <Sparkles className="h-3.5 w-3.5" />
            CBSE Class 11 &amp; 12 Computer Science
          </span>

          <h1 className="mt-7 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl">
            Crack Class 12 Computer Science{" "}
            <span className="text-primary">Without the Chaos.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Stop digging through messy notes. Get clean Python scripts, simplified MySQL
            connectivity guides, and interactive file handling simulations—structured
            specifically for your board exams.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full gap-2 font-semibold sm:w-auto">
              <Link to="/ide">
                Start Practicing Now <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full border-accent/50 hover:bg-accent/15 sm:w-auto"
            >
              <a href="#modules">Practical File Hub</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section id="modules" className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
          Core Modules
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Everything on the syllabus, split into four focused tracks.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
          {MODULES.map((m) => (
            <Link
              key={m.title}
              to="/ide"
              className="group relative rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_16px_40px_-20px_hsl(var(--primary)/0.6)]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                <m.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold leading-snug">{m.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {m.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-primary">
                {m.action}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Differentiator */}
      <section className="border-y border-border bg-card/40">
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-12 px-5 py-16 sm:py-20 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Learn by Doing, Not Just Reading.
            </h2>
            <ul className="mt-8 space-y-6">
              {FEATURES.map((f) => (
                <li key={f.title} className="flex gap-4">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent-foreground">
                    <f.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{f.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {f.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Mock editor */}
          <div className="overflow-hidden rounded-xl border border-border bg-editor-bg shadow-2xl">
            <div className="flex items-center gap-2 border-b border-border bg-editor-gutter px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
              <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                stack_demo.py
              </span>
              <span className="ml-auto inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                <Copy className="h-3 w-3" /> copy
              </span>
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-6">
              {PREVIEW_CODE.map((l) => (
                <div key={l.n} className="flex gap-4">
                  <span className="select-none text-muted-foreground/50">
                    {String(l.n).padStart(2, "0")}
                  </span>
                  <code className="text-foreground/90">{l.t}</code>
                </div>
              ))}
            </pre>
            <div className="border-t border-border bg-editor-highlight px-4 py-2.5 font-mono text-[11px] text-success">
              &gt;&gt;&gt; 20
            </div>
          </div>
        </div>
      </section>

      {/* Topic request */}
      <section className="mx-auto max-w-3xl px-5 py-16 sm:py-20">
        <div className="rounded-xl border border-accent/40 bg-card p-6 shadow-[0_0_40px_-24px_hsl(var(--accent)/0.9)] sm:p-8">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            Stuck on a Topic? Request a Guide.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Drop the topic, syllabus doubt, or environment configuration issue you're facing.
            We'll add the breakdown in the next update.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitTopic()}
              placeholder="Topic or Question"
              maxLength={500}
              disabled={sending}
              aria-label="Topic or Question"
            />
            <Button onClick={submitTopic} disabled={sending || !topic.trim()} className="gap-1.5">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Request Topic
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-5 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            <a href="#modules" className="text-muted-foreground hover:text-foreground">
              All Modules
            </a>
            <a href="#modules" className="text-muted-foreground hover:text-foreground">
              Practical Files
            </a>
            <Link to="/ide" className="text-muted-foreground hover:text-foreground">
              Report a Bug
            </Link>
            <Link to="/ide" className="text-muted-foreground hover:text-foreground">
              Feedback
            </Link>
          </nav>
          <p className="font-mono text-xs text-muted-foreground">
            Built for Class 11 &amp; 12 CS Students • vgpython
          </p>
        </div>
      </footer>
    </div>
  );
}
