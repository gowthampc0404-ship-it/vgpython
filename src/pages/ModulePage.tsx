import { useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowLeft, Lightbulb, Play, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeBlock } from "@/components/modules/CodeBlock";
import { getModule } from "@/data/modules";

export default function ModulePage() {
  const { slug } = useParams();
  const mod = getModule(slug);
  const [active, setActive] = useState(0);

  if (!mod) return <Navigate to="/" replace />;

  const topic = mod.topics[active];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/40">
        <div className="mx-auto max-w-5xl px-5 py-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to modules
          </Link>
          <p className="mt-5 font-mono text-[11px] uppercase tracking-widest text-primary">
            {mod.tagline}
          </p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-4xl">
            {mod.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {mod.description}
          </p>
          <Button asChild size="sm" className="mt-5 gap-1.5">
            <Link to="/ide">
              <Play className="h-3.5 w-3.5" /> Run code in the IDE
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10">
        {/* Topic switcher */}
        <div className="flex flex-wrap gap-2">
          {mod.topics.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setActive(i)}
              className={`rounded-lg border px-3 py-2 text-left text-xs font-semibold transition-colors ${
                i === active
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.title}
            </button>
          ))}
        </div>

        <section className="mt-6 rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-md bg-accent/20 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
              {topic.badge}
            </span>
            <h2 className="text-lg font-bold tracking-tight sm:text-xl">{topic.title}</h2>
          </div>

          <Tabs defaultValue="code" key={topic.id} className="mt-5">
            <TabsList>
              <TabsTrigger value="code" className="gap-1.5">
                <Terminal className="h-3.5 w-3.5" /> Code
              </TabsTrigger>
              <TabsTrigger value="explanation" className="gap-1.5">
                <Lightbulb className="h-3.5 w-3.5" /> Explanation
              </TabsTrigger>
            </TabsList>

            <TabsContent value="code" className="mt-4">
              <CodeBlock code={topic.code} filename={`${topic.id}.py`} />
            </TabsContent>

            <TabsContent value="explanation" className="mt-4 space-y-3">
              {topic.explanation.map((e, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-editor-highlight p-4 transition-colors hover:border-primary/40"
                >
                  <code className="font-mono text-xs font-semibold text-primary">{e.line}</code>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{e.text}</p>
                </div>
              ))}

              {topic.notes?.length ? (
                <div className="rounded-lg border border-warning/40 bg-warning/5 p-4">
                  <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-warning">
                    Exam notes
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {topic.notes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
}
