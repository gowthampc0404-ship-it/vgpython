import { useState, useRef, useEffect } from "react";
import {
  Terminal,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  BookOpenCheck,
  MessageCircle,
  Send,
  Trash2,
  Loader2,
  Square,
  Package,
  Download,
  CheckCircle2,
  XCircle,
  Search,
  GitBranch,
  PlayCircle,
  RefreshCw,
} from "lucide-react";
import { Copy, ShieldAlert, Wrench, Sparkles } from "lucide-react";
import { AnimatedExecution } from "./AnimatedExecution";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";

type Tab = "output" | "trace" | "errors" | "line" | "alllines" | "chat" | "modules" | "outputexplain" | "animate";

interface OutputPanelProps {
  output: string;
  error: string | null;
  liveOutput: string;
  waitingForInput: boolean;
  inputPromptText: string;
  isRunning: boolean;
  onSubmitInput: (value: string) => void;
  onStopExecution: () => void;
  explanation: string;
  lineExplanation: string;
  allLinesExplanation: string;
  errorExplanation: string;
  outputExplanation: string;
  onExplainOutput: (output: string) => void;
  chatMessages: { role: "user" | "assistant"; content: string }[];
  isChatLoading: boolean;
  isExplaining: boolean;
  onSendChat: (message: string) => void;
  onClearChat: () => void;
  activeTab?: Tab;
  onTabChange?: (tab: Tab) => void;
  installedPackages: Array<{ name: string; version: string }>;
  isInstallingPackage: boolean;
  onInstallPackage: (name: string) => Promise<{ success: boolean; error?: string }>;
  onRefreshPackages: () => void;
  isPyodideReady: boolean;
  onAnimateLineChange?: (line: number | null) => void;
  onJumpToLine?: (line: number) => void;
}

export function OutputPanel({
  output,
  error,
  liveOutput,
  waitingForInput,
  inputPromptText,
  isRunning,
  onSubmitInput,
  onStopExecution,
  explanation,
  lineExplanation,
  allLinesExplanation,
  errorExplanation,
  outputExplanation,
  onExplainOutput,
  chatMessages,
  isChatLoading,
  isExplaining,
  onSendChat,
  onClearChat,
  activeTab: externalTab,
  onTabChange,
  installedPackages,
  isInstallingPackage,
  onInstallPackage,
  onRefreshPackages,
  isPyodideReady,
  onAnimateLineChange,
  onJumpToLine,
}: OutputPanelProps) {
  const [internalTab, setInternalTab] = useState<Tab>("output");
  const activeTabValue = externalTab || internalTab;
  const setActiveTab = (t: Tab) => {
    setInternalTab(t);
    onTabChange?.(t);
  };

  const TYPE_COLORS: Record<string, string> = {
    COMMENT: "bg-gray-500",
    FUNCTION: "bg-orange-500",
    CONDITION: "bg-yellow-500",
    RETURN: "bg-red-500",
    ASSIGNMENT: "bg-blue-500",
    LOOP: "bg-purple-500",
    IMPORT: "bg-cyan-500",
    PRINT: "bg-green-500",
    CALL: "bg-teal-500",
    EMPTY: "bg-gray-600",
    CLASS: "bg-pink-500",
    DECORATOR: "bg-indigo-500",
    EXCEPTION: "bg-rose-500",
    OTHER: "bg-slate-500",
  };

  const renderValueChanges = (valueChanges?: Array<{ variable: string; before: string; after: string; explanation: string }>) => {
    if (!valueChanges || valueChanges.length === 0) return null;
    return (
      <div className="pt-1 space-y-1.5">
        <p className="text-xs text-accent font-semibold flex items-center gap-1">📊 Value Changes:</p>
        {valueChanges.map((vc, idx) => (
          <div key={idx} className="bg-[hsl(var(--editor-bg))] rounded px-3 py-1.5 text-xs space-y-0.5">
            <div className="flex items-center gap-2 font-mono">
              <span className="text-primary font-bold">{vc.variable}</span>
              <span className="text-destructive">{vc.before}</span>
              <span className="text-muted-foreground">→</span>
              <span className="text-success">{vc.after}</span>
            </div>
            {vc.explanation && (
              <p className="text-muted-foreground text-[11px]">{vc.explanation}</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderInputExample = (example?: { sample_input: string; execution: string; result: string }) => {
    if (!example) return null;
    return (
      <div className="pt-1 border-t border-border mt-2">
        <p className="text-xs text-accent font-semibold flex items-center gap-1 mb-1">🔤 Example with Input:</p>
        <div className="bg-[hsl(var(--editor-bg))] rounded px-3 py-1.5 text-xs space-y-1">
          <p className="font-mono"><span className="text-warning">Input:</span> <span className="text-foreground">{example.sample_input}</span></p>
          <p><span className="text-warning">Execution:</span> <span className="text-muted-foreground">{example.execution}</span></p>
          <p className="font-mono"><span className="text-warning">Result:</span> <span className="text-success">{example.result}</span></p>
        </div>
      </div>
    );
  };

  const renderAllLinesCards = (raw: string) => {
    try {
      let jsonStr = raw.trim();
      const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) jsonStr = fenceMatch[1].trim();
      
      const lines: Array<{
        line: number;
        type: string;
        code: string;
        title: string;
        description: string;
        details: Record<string, string>;
        value_changes?: Array<{ variable: string; before: string; after: string; explanation: string }>;
        example_with_input?: { sample_input: string; execution: string; result: string };
      }> = JSON.parse(jsonStr);

      return lines.map((item) => (
        <div key={item.line} className="bg-secondary rounded-lg p-3 space-y-2 border border-border">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground">Line {item.line}</span>
            <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded ${TYPE_COLORS[item.type] || TYPE_COLORS.OTHER}`}>
              {item.type}
            </span>
          </div>
          <div className="bg-[hsl(var(--editor-bg))] rounded px-3 py-1.5 font-mono text-xs text-foreground">
            {item.code}
          </div>
          <p className="text-xs font-semibold text-primary">{item.title}</p>
          <p className="text-xs text-muted-foreground">{item.description}</p>
          {item.details && Object.keys(item.details).length > 0 && (
            <div className="space-y-1 pt-1">
              {Object.entries(item.details).map(([key, val]) => (
                <p key={key} className="text-xs text-muted-foreground">
                  <span className="text-warning font-medium">{key}:</span>{" "}
                  <span className="text-foreground">{String(val)}</span>
                </p>
              ))}
            </div>
          )}
          {renderValueChanges(item.value_changes)}
          {renderInputExample(item.example_with_input)}
        </div>
      ));
    } catch {
      return (
        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>{raw}</ReactMarkdown>
        </div>
      );
    }
  };

  const renderLineCard = (raw: string) => {
    try {
      let jsonStr = raw.trim();
      const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) jsonStr = fenceMatch[1].trim();

      const item: {
        line: number;
        type: string;
        code: string;
        title: string;
        description: string;
        details: Record<string, string>;
        how_it_works?: string;
        value_changes?: Array<{ variable: string; before: string; after: string; explanation: string }>;
        example_with_input?: { sample_input: string; execution: string; result: string };
      } = JSON.parse(jsonStr);

      return (
        <div className="bg-secondary rounded-lg p-3 space-y-2 border border-border">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground">Line {item.line}</span>
            <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded ${TYPE_COLORS[item.type] || TYPE_COLORS.OTHER}`}>
              {item.type}
            </span>
          </div>
          <div className="bg-[hsl(var(--editor-bg))] rounded px-3 py-1.5 font-mono text-xs text-foreground">
            {item.code}
          </div>
          <p className="text-xs font-semibold text-primary">{item.title}</p>
          <p className="text-xs text-muted-foreground">{item.description}</p>
          {item.details && Object.keys(item.details).length > 0 && (
            <div className="space-y-1 pt-1">
              {Object.entries(item.details).map(([key, val]) => (
                <p key={key} className="text-xs text-muted-foreground">
                  <span className="text-warning font-medium">{key}:</span>{" "}
                  <span className="text-foreground">{String(val)}</span>
                </p>
              ))}
            </div>
          )}
          {renderValueChanges(item.value_changes)}
          {renderInputExample(item.example_with_input)}
          {item.how_it_works && (
            <div className="pt-1 border-t border-border mt-2">
              <p className="text-xs text-warning font-medium mb-1">How it works:</p>
              <p className="text-xs text-muted-foreground">{item.how_it_works}</p>
            </div>
          )}
        </div>
      );
    } catch {
      return (
        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>{raw}</ReactMarkdown>
        </div>
      );
    }
  };

  const SECTION_COLORS: Record<string, string> = {
    CONCEPT: "bg-blue-500",
    EXAMPLE: "bg-green-500",
    TIP: "bg-yellow-500",
    WARNING: "bg-orange-500",
    FIX: "bg-red-500",
  };

  const PRIORITY_COLORS: Record<string, string> = {
    HIGH: "bg-red-500",
    MEDIUM: "bg-yellow-500",
    LOW: "bg-green-500",
  };

  const renderTraceCards = (raw: string) => {
    try {
      let jsonStr = raw.trim();
      const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) jsonStr = fenceMatch[1].trim();

      const data: {
        overview: string;
        concepts: Array<{ name: string; icon: string; description: string }>;
        walkthrough: Array<{ step: number; title: string; description: string; code_ref: string }>;
        improvements: Array<{ title: string; description: string; priority: string }>;
        summary: string;
      } = JSON.parse(jsonStr);

      return (
        <>
          {/* Overview */}
          <div className="bg-secondary rounded-lg p-3 border border-border space-y-1">
            <p className="text-xs font-bold text-primary flex items-center gap-1.5">🎯 Overview</p>
            <p className="text-sm text-foreground">{data.overview}</p>
          </div>

          {/* Concepts */}
          {data.concepts && data.concepts.length > 0 && (
            <div className="bg-secondary rounded-lg p-3 border border-border space-y-2">
              <p className="text-xs font-bold text-accent flex items-center gap-1.5">🧩 Key Concepts</p>
              <div className="flex flex-wrap gap-2">
                {data.concepts.map((c, i) => (
                  <div key={i} className="bg-[hsl(var(--editor-bg))] rounded-md px-3 py-2 space-y-0.5 flex-1 min-w-[120px]">
                    <p className="text-xs font-semibold text-foreground">{c.icon} {c.name}</p>
                    <p className="text-[11px] text-muted-foreground">{c.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Walkthrough */}
          {data.walkthrough && data.walkthrough.length > 0 && (
            <div className="bg-secondary rounded-lg p-3 border border-border space-y-2">
              <p className="text-xs font-bold text-success flex items-center gap-1.5">🚀 Step-by-Step Walkthrough</p>
              {data.walkthrough.map((step, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {step.step}
                  </span>
                  <div className="space-y-1 flex-1">
                    <p className="text-xs font-semibold text-foreground">{step.title}</p>
                    <p className="text-[11px] text-muted-foreground">{step.description}</p>
                    {step.code_ref && (
                      <div className="bg-[hsl(var(--editor-bg))] rounded px-2 py-1 font-mono text-[11px] text-foreground">
                        {step.code_ref}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Improvements */}
          {data.improvements && data.improvements.length > 0 && (
            <div className="bg-secondary rounded-lg p-3 border border-border space-y-2">
              <p className="text-xs font-bold text-warning flex items-center gap-1.5">💡 Improvements</p>
              {data.improvements.map((imp, i) => (
                <div key={i} className="bg-[hsl(var(--editor-bg))] rounded px-3 py-2 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold text-white px-1.5 py-0.5 rounded ${PRIORITY_COLORS[imp.priority] || PRIORITY_COLORS.LOW}`}>
                      {imp.priority}
                    </span>
                    <span className="text-xs font-semibold text-foreground">{imp.title}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{imp.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          {data.summary && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">
              <p className="text-xs text-primary font-medium">✨ {data.summary}</p>
            </div>
          )}
        </>
      );
    } catch {
      return (
        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>{raw}</ReactMarkdown>
        </div>
      );
    }
  };

  const renderChatCard = (raw: string) => {
    try {
      let jsonStr = raw.trim();
      const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) jsonStr = fenceMatch[1].trim();

      const data: {
        answer: string;
        sections: Array<{ title: string; icon: string; content: string; code_example?: string; type: string }>;
        key_takeaway: string;
      } = JSON.parse(jsonStr);

      return (
        <div className="space-y-3">
          {/* Main answer */}
          <p className="text-sm text-foreground">{data.answer}</p>

          {/* Sections */}
          {data.sections && data.sections.map((sec, i) => (
            <div key={i} className="bg-[hsl(var(--editor-bg))] rounded-lg px-3 py-2 space-y-1.5 border-l-2" style={{
              borderLeftColor: sec.type === 'CONCEPT' ? 'hsl(217, 91%, 60%)' : sec.type === 'EXAMPLE' ? 'hsl(142, 71%, 45%)' : sec.type === 'TIP' ? 'hsl(48, 96%, 53%)' : sec.type === 'WARNING' ? 'hsl(25, 95%, 53%)' : 'hsl(0, 84%, 60%)'
            }}>
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-bold text-white px-1.5 py-0.5 rounded ${SECTION_COLORS[sec.type] || SECTION_COLORS.CONCEPT}`}>
                  {sec.type}
                </span>
                <span className="text-xs font-semibold text-foreground">{sec.icon} {sec.title}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{sec.content}</p>
              {sec.code_example && (
                <div className="bg-secondary rounded px-2 py-1.5 font-mono text-[11px] text-foreground whitespace-pre-wrap">
                  {sec.code_example}
                </div>
              )}
            </div>
          ))}

          {/* Key takeaway */}
          {data.key_takeaway && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">
              <p className="text-[11px] text-primary font-medium">🔑 {data.key_takeaway}</p>
            </div>
          )}
        </div>
      );
    } catch {
      return (
        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>{raw}</ReactMarkdown>
        </div>
      );
    }
  };

  const renderAIError = (
    raw: string,
    title: string,
    onRetry: () => void,
    buttonIcon: React.ReactNode,
    buttonLabel: string
  ) => {
    const message = raw.replace(/^Error:\s*/, "");
    let status: number | null = null;
    let displayMessage = message;

    try {
      const parsed = JSON.parse(message);
      if (parsed && typeof parsed.status === "number") {
        status = parsed.status;
        displayMessage = parsed.message || message;
      }
    } catch {
      // message isn't our structured JSON, use it as-is
    }

    try {
      const inner = JSON.parse(displayMessage);
      if (inner && typeof inner.error === "string") {
        displayMessage = inner.error;
      }
    } catch {
      // leave displayMessage unchanged
    }

    const hint =
      status === 503
        ? "Gemini is overloaded right now. Wait a moment and retry."
        : status === 429
        ? "Rate limit hit. Please retry in a few seconds."
        : status === 500
        ? "AI service error. A retry often succeeds."
        : "Something went wrong. Please try again.";

    return (
      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-destructive/20 text-destructive uppercase tracking-wider">
            {status ? `HTTP ${status}` : "ERROR"}
          </span>
          <h3 className="text-sm font-semibold text-destructive">{title}</h3>
        </div>
        <p className="text-xs text-muted-foreground">{displayMessage}</p>
        <p className="text-xs text-foreground/80 flex items-start gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5 text-warning" />
          {hint}
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          className="gap-1.5 mt-1"
        >
          {buttonIcon || <RefreshCw className="w-3.5 h-3.5" />}
          {buttonLabel}
        </Button>
      </div>
    );
  };

  const [chatInput, setChatInput] = useState("");
  const [terminalInput, setTerminalInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const terminalInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Auto-scroll terminal and focus input when waiting
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [liveOutput, output]);

  useEffect(() => {
    if (waitingForInput) {
      terminalInputRef.current?.focus();
      terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [waitingForInput]);

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    onSendChat(chatInput.trim());
    setChatInput("");
  };

  const handleTerminalSubmit = () => {
    onSubmitInput(terminalInput);
    setTerminalInput("");
  };

  // Determine what to show in the terminal
  const terminalText = isRunning ? liveOutput : (output || liveOutput);
  const showTerminalReady = !isRunning && !terminalText && !error;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "output", label: "Output", icon: <Terminal className="w-3.5 h-3.5" /> },
    { id: "trace", label: "Trace", icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: "errors", label: "Errors", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
    { id: "line", label: "Line", icon: <Lightbulb className="w-3.5 h-3.5" /> },
    { id: "alllines", label: "All Lines", icon: <BookOpenCheck className="w-3.5 h-3.5" /> },
    { id: "chat", label: "Chat", icon: <MessageCircle className="w-3.5 h-3.5" /> },
    { id: "outputexplain" as Tab, label: "Output Flow", icon: <GitBranch className="w-3.5 h-3.5" /> },
    { id: "animate" as Tab, label: "Visual", icon: <PlayCircle className="w-3.5 h-3.5" /> },
    { id: "modules", label: "Modules", icon: <Package className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Tabs */}
      <div className="flex items-center border-b border-border bg-secondary overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
              activeTabValue === tab.id
                ? "text-foreground border-b-2 border-primary bg-card"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {/* ===== OUTPUT / TERMINAL TAB ===== */}
        {activeTabValue === "output" && (
          <div className="flex flex-col h-full">
            <ScrollArea className="flex-1">
              <div className="p-4 font-mono text-sm">
                {showTerminalReady ? (
                  <p className="text-success">
                    🐍 Python 3.11 Ready! Click "Run" to execute your code.
                  </p>
                ) : (
                  <>
                    {terminalText && (
                      <pre className="text-foreground whitespace-pre-wrap">{terminalText}</pre>
                    )}
                    {error && !isRunning && (
                      <pre className="text-destructive whitespace-pre-wrap mt-2">{error}</pre>
                    )}
                  </>
                )}

                {/* Inline input — appears directly in the output flow like real Python IDLE */}
                {waitingForInput && (
                  <div className="flex items-center mt-0">
                    {inputPromptText && (
                      <span className="text-foreground whitespace-pre">{inputPromptText}</span>
                    )}
                    <input
                      ref={terminalInputRef}
                      value={terminalInput}
                      onChange={(e) => setTerminalInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleTerminalSubmit();
                        }
                      }}
                      className="flex-1 bg-transparent border-none outline-none font-mono text-sm text-foreground caret-primary"
                      autoFocus
                      style={{ padding: 0, margin: 0, minWidth: 0 }}
                    />
                  </div>
                )}

                {/* Running indicator */}
                {isRunning && !waitingForInput && (
                  <div className="flex items-center gap-2 mt-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">Running...</span>
                  </div>
                )}

                <div ref={terminalEndRef} />
              </div>
            </ScrollArea>

            {/* Stop button bar — only when running */}
            {isRunning && (
              <div className="flex items-center justify-end border-t border-border px-3 py-1.5 bg-editor-bg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onStopExecution}
                  className="h-6 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs gap-1"
                  title="Stop execution (Ctrl+C)"
                >
                  <Square className="w-3 h-3 fill-current" />
                  Stop
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ===== TRACE TAB ===== */}
        {activeTabValue === "trace" && (
          <ScrollArea className="h-full">
            <div className="p-4">
              {isExplaining ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing code...
                </div>
              ) : explanation ? (
                <div className="space-y-4">
                  {renderTraceCards(explanation)}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Click "Explain Code" to get a detailed explanation of your code.
                </p>
              )}
            </div>
          </ScrollArea>
        )}

        {/* ===== ERRORS TAB ===== */}
        {activeTabValue === "errors" && (
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {error ? (
                <>
                  {/* Raw traceback card */}
                  {(() => {
                    const lines = error.split("\n");
                    const lastNonEmpty = [...lines].reverse().find((l) => l.trim()) || "";
                    const errMatch = lastNonEmpty.match(/^([A-Za-z_][\w.]*Error|SyntaxError|IndentationError|TabError|Exception|Warning):\s*(.*)$/);
                    const errType = errMatch?.[1] || "Error";
                    const errMsg = errMatch?.[2] || lastNonEmpty;
                    return (
                      <div className="rounded-lg border border-destructive/30 bg-destructive/5 overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-destructive/20 bg-destructive/10">
                          <div className="flex items-center gap-2 min-w-0">
                            <ShieldAlert className="w-4 h-4 text-destructive shrink-0" />
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-destructive/20 text-destructive uppercase tracking-wider shrink-0">
                              {errType}
                            </span>
                            <span className="text-xs text-foreground truncate font-medium">{errMsg}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 shrink-0"
                            onClick={() => navigator.clipboard.writeText(error)}
                            title="Copy traceback"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <div className="bg-[hsl(var(--editor-bg))] max-h-72 overflow-auto">
                          <table className="w-full font-mono text-xs">
                            <tbody>
                              {lines.map((ln, i) => {
                                const isErrLine = /Error:|Exception:|Warning:/.test(ln);
                                const isLoc = /^\s*File "/.test(ln) || /^\s+line \d+/.test(ln);
                                const lineMatch = ln.match(/(?:line|Line)\s+(\d+)/);
                                const jumpLine = lineMatch ? parseInt(lineMatch[1], 10) : null;
                                const clickable = !!(jumpLine && onJumpToLine);
                                return (
                                  <tr
                                    key={i}
                                    className={`${isErrLine ? "bg-destructive/10" : ""} ${clickable ? "cursor-pointer hover:bg-primary/10 transition-colors" : ""}`}
                                    onClick={clickable ? () => onJumpToLine!(jumpLine!) : undefined}
                                    title={clickable ? `Jump to line ${jumpLine} in editor` : undefined}
                                  >
                                    <td className="select-none text-right pr-3 pl-3 py-0.5 text-muted-foreground/50 border-r border-border/40 w-10">
                                      {i + 1}
                                    </td>
                                    <td className={`px-3 py-0.5 whitespace-pre-wrap break-all ${isErrLine ? "text-destructive font-semibold" : isLoc ? "text-warning" : "text-foreground/80"}`}>
                                      {clickable ? (
                                        <>
                                          {ln.slice(0, lineMatch!.index!)}
                                          <span className="underline decoration-dotted decoration-primary text-primary font-semibold">
                                            {lineMatch![0]}
                                          </span>
                                          {ln.slice(lineMatch!.index! + lineMatch![0].length)}
                                        </>
                                      ) : (
                                        ln || "\u00A0"
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}

                  {isExplaining && !errorExplanation ? (
                    <div className="rounded-lg border border-border bg-secondary/50 p-4 flex items-center gap-2 text-muted-foreground text-sm">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span>AI is analyzing the error…</span>
                    </div>
                  ) : errorExplanation?.startsWith("Error:") ? (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-destructive/20 text-destructive uppercase tracking-wider">AI</span>
                        <h3 className="text-sm font-semibold text-destructive">Couldn't analyze the error</h3>
                      </div>
                      <p className="text-xs text-muted-foreground">{errorExplanation.replace(/^Error:\s*/, "")}</p>
                      <p className="text-[11px] text-foreground/70 flex items-start gap-1.5 pt-1">
                        <Lightbulb className="w-3 h-3 mt-0.5 text-warning shrink-0" />
                        Re-run the code to retry the AI analysis.
                      </p>
                    </div>
                  ) : errorExplanation ? (
                    <div className="space-y-4">
                      {(() => {
                        try {
                          const data = JSON.parse(errorExplanation);
                          return (
                            <>
                              {/* Error Header */}
                              <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-destructive/15 to-destructive/5 border border-destructive/30">
                                <span className="text-2xl shrink-0">{data.error_icon || "🐛"}</span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-destructive/20 text-destructive uppercase tracking-wider">{data.error_type}</span>
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                      <Sparkles className="w-3 h-3" /> AI analysis
                                    </span>
                                  </div>
                                  <h3 className="text-sm font-semibold text-foreground leading-tight">{data.title}</h3>
                                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{data.summary}</p>
                                </div>
                              </div>

                              {/* Cause */}
                              {data.cause && (
                                <div className="rounded-lg border border-warning/30 bg-warning/5 overflow-hidden">
                                  <div className="flex items-center justify-between px-3 py-2 bg-warning/10 border-b border-warning/20">
                                    <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                      <Search className="w-3.5 h-3.5 text-warning" /> Root Cause
                                    </h4>
                                    {data.cause.line && (
                                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-warning/20 text-warning">
                                        Line {data.cause.line}
                                      </span>
                                    )}
                                  </div>
                                  <div className="p-3 space-y-2">
                                    {data.cause.code && (
                                      <pre className="text-xs font-mono bg-[hsl(var(--editor-bg))] p-2 rounded text-destructive border-l-2 border-destructive overflow-x-auto">{data.cause.code}</pre>
                                    )}
                                    <p className="text-xs text-muted-foreground leading-relaxed">{data.cause.explanation}</p>
                                  </div>
                                </div>
                              )}

                              {/* Fix */}
                              {data.fix && (
                                <div className="rounded-lg border border-success/30 bg-success/5 overflow-hidden">
                                  <div className="px-3 py-2 bg-success/10 border-b border-success/20">
                                    <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                      <Wrench className="w-3.5 h-3.5 text-success" /> Suggested Fix
                                    </h4>
                                  </div>
                                  <div className="p-3 space-y-3">
                                    <p className="text-xs text-muted-foreground leading-relaxed">{data.fix.description}</p>
                                    {data.fix.changes?.map((change: any, i: number) => (
                                      <div key={i} className="rounded-md border border-border bg-[hsl(var(--editor-bg))] p-2 space-y-1.5">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Line {change.line}</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-1.5 text-xs">
                                          <pre className="font-mono bg-destructive/10 text-destructive px-2 py-1 rounded line-through overflow-x-auto">{change.before}</pre>
                                          <span className="text-muted-foreground text-center hidden sm:block">→</span>
                                          <pre className="font-mono bg-success/10 text-success px-2 py-1 rounded overflow-x-auto">{change.after}</pre>
                                        </div>
                                        {change.reason && <p className="text-[11px] text-muted-foreground italic">{change.reason}</p>}
                                      </div>
                                    ))}
                                    {data.fix.corrected_code && (
                                      <details className="group">
                                        <summary className="text-xs text-primary cursor-pointer hover:underline list-none flex items-center gap-1">
                                          <span className="group-open:rotate-90 transition-transform">▸</span>
                                          View corrected code
                                        </summary>
                                        <div className="relative mt-2">
                                          <pre className="text-xs font-mono bg-[hsl(var(--editor-bg))] p-3 rounded border border-border text-foreground whitespace-pre-wrap overflow-x-auto">{data.fix.corrected_code}</pre>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="absolute top-1 right-1 h-7 w-7 p-0"
                                            onClick={() => navigator.clipboard.writeText(data.fix.corrected_code)}
                                            title="Copy code"
                                          >
                                            <Copy className="w-3.5 h-3.5" />
                                          </Button>
                                        </div>
                                      </details>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Prevention Tips */}
                              {data.prevention_tips?.length > 0 && (
                                <div className="rounded-lg border border-primary/20 bg-primary/5 overflow-hidden">
                                  <div className="px-3 py-2 bg-primary/10 border-b border-primary/20">
                                    <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                      <Lightbulb className="w-3.5 h-3.5 text-primary" /> Prevention Tips
                                    </h4>
                                  </div>
                                  <div className="p-3 grid gap-2">
                                    {data.prevention_tips.map((tip: any, i: number) => (
                                      <div key={i} className="flex items-start gap-2 p-2 rounded-md bg-background/40 border border-border/50">
                                        <span className="text-base shrink-0">{tip.icon}</span>
                                        <div className="min-w-0">
                                          <p className="text-xs font-medium text-foreground">{tip.tip}</p>
                                          <p className="text-[11px] text-muted-foreground leading-relaxed">{tip.description}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        } catch {
                          return (
                            <div className="prose prose-invert prose-sm max-w-none">
                              <ReactMarkdown>{errorExplanation}</ReactMarkdown>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-12 px-4 rounded-lg border border-success/20 bg-success/5">
                  <div className="w-12 h-12 rounded-full bg-success/15 flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-6 h-6 text-success" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">No errors detected</p>
                  <p className="text-xs text-muted-foreground mt-1">Your code ran cleanly. Hit <span className="font-mono px-1 rounded bg-muted">Run</span> after edits to re-check.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {/* ===== LINE TAB ===== */}
        {activeTabValue === "line" && (
          <ScrollArea className="h-full">
            <div className="p-4">
              {isExplaining ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Explaining line...
                </div>
              ) : lineExplanation ? (
                <div className="space-y-2">
                  {renderLineCard(lineExplanation)}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  💡 Click on a line number in the editor to get an explanation of that line.
                </p>
              )}
            </div>
          </ScrollArea>
        )}

        {/* ===== ALL LINES TAB ===== */}
        {activeTabValue === "alllines" && (
          <ScrollArea className="h-full">
            <div className="p-4">
              {isExplaining ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Explaining all lines...
                </div>
              ) : allLinesExplanation ? (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    🐍 Line-by-Line Code Explanation
                  </h3>
                  {renderAllLinesCards(allLinesExplanation)}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  📚 Click "Explain Code" to get line-by-line explanations.
                </p>
              )}
            </div>
          </ScrollArea>
        )}

        {/* ===== CHAT TAB ===== */}
        {activeTabValue === "chat" && (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <span className="text-xs text-muted-foreground">
                Ask questions about your code
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearChat}
                className="h-6 px-2 text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {chatMessages.length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-8">
                    🤖 Ask me anything about your Python code!
                  </p>
                )}
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-foreground"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        renderChatCard(msg.content)
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}
                {isChatLoading && chatMessages[chatMessages.length - 1]?.role !== "assistant" && (
                  <div className="flex justify-start">
                    <div className="bg-secondary rounded-lg px-3 py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>

            <div className="border-t border-border p-3 flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendChat()}
                placeholder="Ask a question about your code..."
                className="flex-1 bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <Button
                onClick={handleSendChat}
                disabled={isChatLoading || !chatInput.trim()}
                size="sm"
                className="bg-primary text-primary-foreground"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ===== OUTPUT FLOW TAB ===== */}
        {activeTabValue === "outputexplain" && (
          <ScrollArea className="h-full">
            <div className="p-4">
              {!output && !liveOutput ? (
                <p className="text-muted-foreground text-sm">
                  ▶️ Run your code first, then click "Explain Output" to see a step-by-step flow of how the output was produced.
                </p>
              ) : (
                <>
                  {!outputExplanation && !isExplaining && (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground text-sm mb-3">See why your code produced this output</p>
                      <Button
                        size="sm"
                        onClick={() => onExplainOutput(output || liveOutput)}
                        className="gap-1.5"
                      >
                        <GitBranch className="w-3.5 h-3.5" />
                        Explain Output Flow
                      </Button>
                    </div>
                  )}
                  {isExplaining && !outputExplanation && (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Tracing execution flow...
                    </div>
                  )}
                  {outputExplanation && outputExplanation.startsWith("Error:") && renderAIError(
                    outputExplanation,
                    "AI service unavailable",
                    () => onExplainOutput(output || liveOutput),
                    <GitBranch className="w-3.5 h-3.5" />,
                    "Retry"
                  )}
                  {outputExplanation && !outputExplanation.startsWith("Error:") && (() => {
                    try {
                      let jsonStr = outputExplanation.trim();
                      const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
                      if (fenceMatch) jsonStr = fenceMatch[1].trim();
                      const data = JSON.parse(jsonStr);

                      const FLOW_ICONS: Record<string, string> = {
                        SEQUENTIAL: "➡️",
                        BRANCH_TRUE: "✅",
                        BRANCH_FALSE: "❌",
                        LOOP_START: "🔁",
                        LOOP_ITERATION: "🔄",
                        LOOP_END: "🏁",
                        FUNCTION_CALL: "📞",
                        FUNCTION_RETURN: "↩️",
                        INPUT: "⌨️",
                        OUTPUT: "📤",
                      };

                      const FLOW_COLORS: Record<string, string> = {
                        SEQUENTIAL: "border-l-blue-500",
                        BRANCH_TRUE: "border-l-green-500",
                        BRANCH_FALSE: "border-l-red-500",
                        LOOP_START: "border-l-purple-500",
                        LOOP_ITERATION: "border-l-purple-400",
                        LOOP_END: "border-l-purple-600",
                        FUNCTION_CALL: "border-l-orange-500",
                        FUNCTION_RETURN: "border-l-orange-400",
                        INPUT: "border-l-cyan-500",
                        OUTPUT: "border-l-green-400",
                      };

                      return (
                        <div className="space-y-4">
                          {/* Summary */}
                          <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                            <p className="text-sm text-foreground">{data.summary}</p>
                          </div>

                          {/* Execution Flow - Visual Flowchart */}
                          <div>
                            <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                              <GitBranch className="w-3.5 h-3.5" /> Execution Flowchart
                            </h3>
                            <div className="relative flex flex-col items-center">
                              {data.execution_flow?.map((step: any, i: number, arr: any[]) => {
                                const flowType = step.flow_type || "SEQUENTIAL";
                                const isCondition = flowType.startsWith("BRANCH");
                                const isLoop = flowType.startsWith("LOOP");
                                const isFunc = flowType.startsWith("FUNCTION");
                                const isIO = flowType === "INPUT" || flowType === "OUTPUT";

                                // Shape styles
                                const shapeClass = isCondition
                                  ? "rotate-0 border-2 border-yellow-500/60 bg-yellow-500/10"
                                  : isLoop
                                  ? "border-2 border-purple-500/60 bg-purple-500/10 rounded-full"
                                  : isFunc
                                  ? "border-2 border-orange-500/60 bg-orange-500/10 rounded-lg border-l-4 border-r-4"
                                  : isIO
                                  ? "border-2 border-cyan-500/60 bg-cyan-500/10 skew-x-0 rounded-lg"
                                  : "border border-border bg-secondary rounded-lg";

                                const accentColor = isCondition
                                  ? "text-yellow-400"
                                  : isLoop
                                  ? "text-purple-400"
                                  : isFunc
                                  ? "text-orange-400"
                                  : isIO
                                  ? "text-cyan-400"
                                  : "text-blue-400";

                                const isLast = i === arr.length - 1;

                                return (
                                  <div key={i} className="flex flex-col items-center w-full max-w-md">
                                    {/* Node */}
                                    <div className={`relative w-full p-3 ${shapeClass}`}>
                                      {/* Condition diamond indicator */}
                                      {isCondition && (
                                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rotate-45 border-2 border-yellow-500/60 bg-yellow-500/20" />
                                      )}
                                      <div className="flex items-center gap-2 mb-1.5">
                                        <span className={`text-sm ${accentColor}`}>{FLOW_ICONS[flowType] || "➡️"}</span>
                                        <span className="text-[10px] font-bold text-muted-foreground bg-muted/80 px-1.5 py-0.5 rounded">
                                          Step {step.step}
                                        </span>
                                        <span className="text-[10px] font-bold text-muted-foreground bg-muted/80 px-1.5 py-0.5 rounded">
                                          L{step.line}
                                        </span>
                                        <span className={`text-[10px] font-semibold ${accentColor}`}>
                                          {flowType.replace(/_/g, " ")}
                                        </span>
                                      </div>
                                      <pre className="text-xs font-mono bg-[hsl(var(--editor-bg))] px-2 py-1 rounded mb-1.5 text-foreground overflow-x-auto">{step.code}</pre>
                                      <p className="text-xs text-muted-foreground">{step.action}</p>
                                      {step.variables_state && Object.keys(step.variables_state).length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                                          {Object.entries(step.variables_state).map(([k, v]) => (
                                            <span key={k} className="text-[10px] font-mono bg-muted/80 px-1.5 py-0.5 rounded">
                                              <span className="text-primary">{k}</span>=<span className="text-success">{String(v)}</span>
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                      {step.output_produced && (
                                        <div className="mt-1.5 flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded">
                                          <span className="text-[10px] text-green-400">📤</span>
                                          <code className="text-[10px] font-mono text-green-300">{step.output_produced}</code>
                                        </div>
                                      )}
                                    </div>
                                    {/* Arrow connector */}
                                    {!isLast && (
                                      <div className="flex flex-col items-center py-0.5">
                                        <div className={`w-0.5 h-5 ${isLoop ? "bg-purple-500/50" : isCondition ? "bg-yellow-500/50" : isFunc ? "bg-orange-500/50" : "bg-border"}`} />
                                        <div className={`w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent ${isLoop ? "border-t-purple-500/70" : isCondition ? "border-t-yellow-500/70" : isFunc ? "border-t-orange-500/70" : "border-t-muted-foreground/50"}`} />
                                        {/* Label on arrow for branches/loops */}
                                        {(isCondition || isLoop) && (
                                          <span className={`text-[9px] font-bold mt-0.5 ${accentColor}`}>
                                            {flowType === "BRANCH_TRUE" ? "TRUE" : flowType === "BRANCH_FALSE" ? "FALSE" : flowType === "LOOP_END" ? "EXIT" : ""}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    {/* Terminal dot for last step */}
                                    {isLast && (
                                      <div className="flex flex-col items-center pt-2">
                                        <div className="w-0.5 h-4 bg-border" />
                                        <div className="w-3 h-3 rounded-full bg-muted-foreground/30 border-2 border-muted-foreground/50" />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Output Breakdown */}
                          {data.output_breakdown?.length > 0 && (
                            <div>
                              <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">📋 Output Breakdown</h3>
                              <div className="space-y-2">
                                {data.output_breakdown.map((item: any, i: number) => (
                                  <div key={i} className="p-2 rounded-lg bg-muted/30 border border-border">
                                    <pre className="text-xs font-mono text-success mb-1">{item.output_line}</pre>
                                    <p className="text-[10px] text-muted-foreground">
                                      <span className="text-warning">Line {item.produced_by_line}</span> — {item.explanation}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Key Insight */}
                          {data.key_insight && (
                            <div className="p-3 rounded-lg bg-accent/10 border border-accent/30">
                              <p className="text-xs text-foreground">💡 <strong>Key Insight:</strong> {data.key_insight}</p>
                            </div>
                          )}
                        </div>
                      );
                    } catch {
                      return (
                        <div className="prose prose-invert prose-sm max-w-none">
                          {isExplaining ? (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm not-prose">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Tracing execution flow…
                            </div>
                          ) : (
                            <ReactMarkdown>{outputExplanation}</ReactMarkdown>
                          )}
                        </div>
                      );
                    }
                  })()}
                </>
              )}
            </div>
          </ScrollArea>
        )}

        {/* ===== VISUAL TAB ===== */}
        {activeTabValue === "animate" && (
          <div className="h-full">
            {!output && !liveOutput ? (
              <div className="p-4">
                <p className="text-muted-foreground text-sm">
                  ▶️ Run your code first to see an animated step-by-step execution.
                </p>
              </div>
            ) : !outputExplanation && !isExplaining ? (
              <div className="p-4 text-center py-6">
                <p className="text-muted-foreground text-sm mb-3">Generate the execution trace to animate it</p>
                <Button size="sm" onClick={() => onExplainOutput(output || liveOutput)} className="gap-1.5">
                  <PlayCircle className="w-3.5 h-3.5" />
                  Generate &amp; Animate
                </Button>
              </div>
            ) : outputExplanation && outputExplanation.startsWith("Error:") ? (
              <div className="p-4">
                {renderAIError(
                  outputExplanation,
                  "Couldn't build the visual trace",
                  () => onExplainOutput(output || liveOutput),
                  <PlayCircle className="w-3.5 h-3.5" />,
                  "Retry"
                )}
              </div>
            ) : (
              (() => {
                // Try to parse the (possibly partial) streaming JSON.
                let parsed: any = null;
                if (outputExplanation) {
                  try {
                    let jsonStr = outputExplanation.trim();
                    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
                    if (fenceMatch) jsonStr = fenceMatch[1].trim();
                    parsed = JSON.parse(jsonStr);
                  } catch {
                    parsed = null;
                  }
                }

                // While streaming OR JSON not yet complete → friendly loading state
                if (!parsed || !parsed.execution_flow || !Array.isArray(parsed.execution_flow) || parsed.execution_flow.length === 0) {
                  // Estimate progress from how much text has streamed (rough but reassuring)
                  const charCount = outputExplanation?.length || 0;
                  // Typical full trace ≈ 4000+ chars; cap display at 90% until parse succeeds
                  const progress = Math.min(90, Math.round((charCount / 4000) * 100));
                  return (
                    <ScrollArea className="h-full">
                      <div className="p-4 space-y-4">
                        <div className="flex items-center gap-2 text-foreground text-sm">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          <span className="font-medium">Building visual trace…</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          The AI is mapping each line of your code into an interactive step-by-step animation. This usually takes a few seconds.
                        </p>

                        {/* Progress bar */}
                        <div className="space-y-1">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                              style={{ width: `${Math.max(8, progress)}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground/70 font-mono">
                            {charCount > 0 ? `Streamed ${charCount.toLocaleString()} chars…` : "Connecting to AI…"}
                          </p>
                        </div>

                        {/* Skeleton cards mimicking the real Visual UI */}
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-16 rounded bg-secondary animate-pulse" />
                            <div className="h-4 w-12 rounded bg-secondary animate-pulse" />
                          </div>
                          <div className="rounded-lg bg-secondary/60 border border-border px-3 py-2 space-y-1.5">
                            <div className="h-2.5 w-20 rounded bg-muted animate-pulse" />
                            <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                          </div>
                          <div className="rounded-lg bg-card border border-border px-3 py-2 space-y-1.5">
                            <div className="h-2.5 w-24 rounded bg-muted animate-pulse" />
                            <div className="h-3 w-full rounded bg-muted animate-pulse" />
                            <div className="h-3 w-5/6 rounded bg-muted animate-pulse" />
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <div className="h-12 w-16 rounded-lg border-2 border-border bg-card animate-pulse" />
                            <div className="h-12 w-16 rounded-lg border-2 border-border bg-card animate-pulse" />
                            <div className="h-12 w-16 rounded-lg border-2 border-border bg-card animate-pulse" />
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  );
                }

                return <AnimatedExecution data={parsed} onLineChange={onAnimateLineChange} />;
              })()
            )}
          </div>
        )}

        {/* ===== MODULES TAB ===== */}
        {activeTabValue === "modules" && (
          <ModulesTab
            installedPackages={installedPackages}
            isInstallingPackage={isInstallingPackage}
            onInstallPackage={onInstallPackage}
            onRefreshPackages={onRefreshPackages}
            isPyodideReady={isPyodideReady}
          />
        )}
      </div>
    </div>
  );
}

const POPULAR_PACKAGES = [
  { name: "numpy", desc: "Numerical computing with arrays & matrices", icon: "🔢" },
  { name: "pandas", desc: "Data analysis & manipulation", icon: "🐼" },
  { name: "matplotlib", desc: "Data visualization & plotting", icon: "📊" },
  { name: "scipy", desc: "Scientific computing algorithms", icon: "🔬" },
  { name: "sympy", desc: "Symbolic mathematics", icon: "∑" },
  { name: "networkx", desc: "Graph & network analysis", icon: "🕸️" },
  { name: "scikit-learn", desc: "Machine learning algorithms", icon: "🤖" },
  { name: "pillow", desc: "Image processing", icon: "🖼️" },
  { name: "requests", desc: "HTTP requests (pyodide-http)", icon: "🌐" },
  { name: "beautifulsoup4", desc: "HTML/XML parsing", icon: "🍜" },
  { name: "regex", desc: "Advanced regular expressions", icon: "🔍" },
  { name: "pyyaml", desc: "YAML parser", icon: "📄" },
];

function ModulesTab({
  installedPackages,
  isInstallingPackage,
  onInstallPackage,
  onRefreshPackages,
  isPyodideReady,
}: {
  installedPackages: Array<{ name: string; version: string }>;
  isInstallingPackage: boolean;
  onInstallPackage: (name: string) => Promise<{ success: boolean; error?: string }>;
  onRefreshPackages: () => void;
  isPyodideReady: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [customPackage, setCustomPackage] = useState("");
  const [installStatus, setInstallStatus] = useState<{ name: string; success: boolean; error?: string } | null>(null);

  useEffect(() => {
    if (isPyodideReady) onRefreshPackages();
  }, [isPyodideReady, onRefreshPackages]);

  const handleInstall = async (name: string) => {
    setInstallStatus(null);
    const result = await onInstallPackage(name);
    setInstallStatus({ name, ...result });
  };

  const handleCustomInstall = async () => {
    if (!customPackage.trim()) return;
    await handleInstall(customPackage.trim());
    setCustomPackage("");
  };

  const installedNames = new Set(installedPackages.map(p => p.name.toLowerCase()));
  const filteredPopular = POPULAR_PACKAGES.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isPyodideReady) {
    return (
      <div className="p-4 flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Waiting for Python to load...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Install custom package */}
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={customPackage}
              onChange={e => setCustomPackage(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCustomInstall()}
              placeholder="Install any package (e.g. numpy)"
              className="w-full bg-secondary border border-border rounded-md pl-8 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <Button
            onClick={handleCustomInstall}
            disabled={isInstallingPackage || !customPackage.trim()}
            size="sm"
            className="bg-primary text-primary-foreground gap-1"
          >
            {isInstallingPackage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Install
          </Button>
        </div>

        {/* Status message */}
        {installStatus && (
          <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded ${installStatus.success ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
            {installStatus.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            {installStatus.success ? `${installStatus.name} installed successfully!` : `Failed: ${installStatus.error}`}
          </div>
        )}

        {/* Search filter for popular */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search popular packages..."
            className="w-full bg-secondary border border-border rounded-md pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Popular packages */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-primary flex items-center gap-1.5">⭐ Popular Packages</p>
            <div className="grid gap-2">
              {filteredPopular.map(pkg => {
                const isInstalled = installedNames.has(pkg.name.toLowerCase());
                return (
                  <div key={pkg.name} className="bg-secondary rounded-lg px-3 py-2 border border-border flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">{pkg.icon}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground">{pkg.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{pkg.desc}</p>
                      </div>
                    </div>
                    {isInstalled ? (
                      <span className="flex items-center gap-1 text-[10px] text-success font-medium shrink-0">
                        <CheckCircle2 className="w-3 h-3" /> Installed
                      </span>
                    ) : (
                      <Button
                        onClick={() => handleInstall(pkg.name)}
                        disabled={isInstallingPackage}
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-[10px] gap-1 shrink-0"
                      >
                        {isInstallingPackage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                        Install
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Installed packages */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-accent flex items-center gap-1.5">📦 Installed ({installedPackages.length})</p>
              <Button variant="ghost" size="sm" onClick={onRefreshPackages} className="h-5 px-1.5 text-[10px] text-muted-foreground">
                Refresh
              </Button>
            </div>
            <div className="grid gap-1">
              {installedPackages.length === 0 ? (
                <p className="text-xs text-muted-foreground">No packages installed yet.</p>
              ) : (
                installedPackages.map(pkg => (
                  <div key={pkg.name} className="flex items-center justify-between bg-[hsl(var(--editor-bg))] rounded px-2.5 py-1.5">
                    <span className="text-xs font-mono text-foreground">{pkg.name}</span>
                    <span className="text-[10px] text-muted-foreground">{pkg.version}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
