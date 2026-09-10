import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Play,
  Copy,
  Download,
  Loader2,
  Check,
  CircleDot,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { usePyodide } from "@/hooks/usePyodide";
import { downloadText } from "@/lib/download";

interface RuntimeCtx {
  isReady: boolean;
  isLoading: boolean;
  isRunning: boolean;
  runCode: (code: string) => Promise<{ output: string; error: string | null }>;
  nextCount: () => number;
  waitingForInput: boolean;
  inputPromptText: string;
  submitInput: (v: string) => void;
}

const RuntimeContext = createContext<RuntimeCtx | null>(null);

export function NotebookPage({
  fileName,
  title,
  subtitle,
  children,
}: {
  fileName: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const py = usePyodide();
  const counter = useRef(0);
  const [pending, setPending] = useState("");

  useEffect(() => {
    py.loadPyodide();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nextCount = useCallback(() => ++counter.current, []);

  const status = py.isReady
    ? "Connected"
    : py.isLoading
      ? "Connecting to Python…"
      : "Starting…";

  return (
    <RuntimeContext.Provider
      value={{
        isReady: py.isReady,
        isLoading: py.isLoading,
        isRunning: py.isRunning,
        runCode: py.runCode,
        nextCount,
        waitingForInput: py.waitingForInput,
        inputPromptText: py.inputPromptText,
        submitInput: py.submitInput,
      }}
    >
      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
          <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-2.5">
            <Button asChild variant="ghost" size="sm" className="gap-1.5 px-2">
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </Link>
            </Button>
            <div className="min-w-0">
              <p className="truncate font-mono text-sm font-medium">{fileName}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                VGPYTHON notebook
              </p>
            </div>
            <span
              className={`ml-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] ${
                py.isReady
                  ? "border-success/40 text-success"
                  : "border-border text-muted-foreground"
              }`}
            >
              {py.isReady ? (
                <CircleDot className="h-3 w-3" />
              ) : (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
              {status}
            </span>
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-4 pb-24 pt-8">
          <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
          <div className="mt-8 space-y-5">{children}</div>

          {py.waitingForInput && (
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card p-3">
              <div className="mx-auto flex max-w-4xl gap-2">
                <input
                  autoFocus
                  value={pending}
                  onChange={(e) => setPending(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      py.submitInput(pending);
                      setPending("");
                    }
                  }}
                  placeholder={py.inputPromptText || "Program is waiting for input…"}
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
                />
                <Button
                  onClick={() => {
                    py.submitInput(pending);
                    setPending("");
                  }}
                >
                  Send
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </RuntimeContext.Provider>
  );
}

export function TextCell({
  heading,
  children,
}: {
  heading?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg px-1 py-2">
      {heading && (
        <h2 className="text-xl font-bold tracking-tight">{heading}</h2>
      )}
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export function CodeCell({
  code: initial,
  fileName = "cell.py",
  runnable = true,
}: {
  code: string;
  fileName?: string;
  runnable?: boolean;
}) {
  const ctx = useContext(RuntimeContext);
  const [code, setCode] = useState(initial.trimEnd());
  const [out, setOut] = useState<{ output: string; error: string | null } | null>(
    null
  );
  const [busy, setBusy] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const run = async () => {
    if (!ctx) return;
    setBusy(true);
    setOut(null);
    const res = await ctx.runCode(code);
    setOut(res);
    setCount(ctx.nextCount());
    setBusy(false);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied");
    setTimeout(() => setCopied(false), 1500);
  };

  const lines = code.split("\n").length;

  return (
    <section className="group rounded-lg border border-border bg-card">
      <div className="flex items-stretch gap-2 p-2">
        <div className="flex w-12 shrink-0 flex-col items-center gap-1 pt-1">
          {runnable ? (
            <button
              onClick={run}
              disabled={busy || !ctx?.isReady}
              title={ctx?.isReady ? "Run cell" : "Python is still loading"}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary disabled:opacity-40"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </button>
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground">
              <Square className="h-3 w-3" />
            </span>
          )}
          <span className="font-mono text-[10px] text-muted-foreground">
            [{count ?? " "}]
          </span>
        </div>

        <div className="min-w-0 flex-1 overflow-hidden rounded-md border border-border bg-editor-bg">
          <div className="flex items-center gap-2 border-b border-border bg-editor-gutter px-3 py-1.5">
            <span className="font-mono text-[11px] text-muted-foreground">
              {fileName}
            </span>
            <span className="ml-auto flex gap-1">
              <Button variant="ghost" size="sm" className="h-7 gap-1 px-2" onClick={copy}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline text-[11px]">Copy</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2"
                onClick={() => downloadText(fileName, code)}
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-[11px]">Save</span>
              </Button>
            </span>
          </div>
          <textarea
            value={code}
            spellCheck={false}
            onChange={(e) => setCode(e.target.value)}
            rows={Math.min(Math.max(lines, 2), 30)}
            className="w-full resize-y bg-transparent p-3 font-mono text-[12.5px] leading-6 outline-none"
          />
        </div>
      </div>

      {out && (
        <div className="border-t border-border px-2 pb-3 pl-16">
          {out.output && (
            <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-editor-highlight p-3 font-mono text-[12.5px] leading-6 text-foreground/90">
              {out.output}
            </pre>
          )}
          {out.error && (
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-md border border-destructive/40 bg-destructive/10 p-3 font-mono text-[12.5px] leading-6 text-destructive">
              {out.error}
            </pre>
          )}
          {!out.output && !out.error && (
            <p className="py-1 font-mono text-[12px] text-muted-foreground">
              Ran with no output.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
