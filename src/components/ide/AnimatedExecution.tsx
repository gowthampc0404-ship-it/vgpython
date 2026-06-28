import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, SkipForward, SkipBack, RotateCcw, ArrowRight, ArrowDown, PhoneCall, CornerDownRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ExecutionStep {
  step: number;
  line: number;
  code: string;
  action: string;
  variables_state: Record<string, any>;
  output_produced: string | null;
  flow_type: string;
}

interface AnimatedExecutionProps {
  data: {
    summary: string;
    execution_flow: ExecutionStep[];
    output_breakdown: Array<{ output_line: string; produced_by_line: number; explanation: string }>;
    key_insight: string;
  };
  onLineChange?: (line: number | null) => void;
}

// Detect what changed between two variable states
function getChangedVars(
  prev: Record<string, any> | null,
  current: Record<string, any>
): Set<string> {
  const changed = new Set<string>();
  if (!prev) {
    Object.keys(current).forEach((k) => changed.add(k));
    return changed;
  }
  for (const key of Object.keys(current)) {
    if (!(key in prev) || JSON.stringify(prev[key]) !== JSON.stringify(current[key])) {
      changed.add(key);
    }
  }
  return changed;
}

// Parse an operation from code like "sum = a + b"
function parseOperation(code: string, vars: Record<string, any>): {
  target: string;
  expression: string;
  resolvedExpression: string;
  result: any;
} | null {
  const match = code.trim().match(/^(\w+)\s*=\s*(.+)$/);
  if (!match) return null;
  const [, target, expression] = match;
  if (!expression || /^[\d."'\[\]{} ]/.test(expression.trim()) && !expression.includes('+') && !expression.includes('-') && !expression.includes('*') && !expression.includes('/')) {
    return null; // Simple literal assignment, not an operation
  }
  // Try to resolve variable names in expression
  let resolved = expression;
  for (const [k, v] of Object.entries(vars)) {
    if (k === target) continue;
    const re = new RegExp(`\\b${k}\\b`, "g");
    resolved = resolved.replace(re, JSON.stringify(v));
  }
  if (resolved === expression) return null; // No variables to resolve
  return {
    target,
    expression: expression.trim(),
    resolvedExpression: resolved.trim(),
    result: vars[target],
  };
}

function VariableBox({
  name,
  value,
  isNew,
  isChanged,
}: {
  name: string;
  value: any;
  isNew: boolean;
  isChanged: boolean;
}) {
  const displayVal = typeof value === "string" ? `"${value}"` : JSON.stringify(value);
  return (
    <div
      className={cn(
        "relative flex flex-col items-center px-3 py-2 rounded-lg border-2 transition-all duration-500 min-w-[70px]",
        isNew
          ? "border-accent bg-accent/10 scale-105 shadow-lg shadow-accent/20"
          : isChanged
          ? "border-primary bg-primary/10 scale-105 shadow-lg shadow-primary/20"
          : "border-border bg-card"
      )}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
        {name}
      </span>
      <span
        className={cn(
          "text-sm font-mono font-bold transition-colors duration-300",
          isNew ? "text-accent" : isChanged ? "text-primary" : "text-foreground"
        )}
      >
        {displayVal}
      </span>
      {(isNew || isChanged) && (
        <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-primary animate-ping" />
      )}
    </div>
  );
}

function OperationVisual({
  operation,
}: {
  operation: { target: string; expression: string; resolvedExpression: string; result: any };
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap justify-center py-2 px-3 rounded-lg bg-secondary/80 border border-border">
      <span className="text-xs font-mono text-muted-foreground">{operation.expression}</span>
      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <span className="text-xs font-mono text-primary font-semibold">{operation.resolvedExpression}</span>
      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <span className="text-sm font-mono font-bold text-accent">
        {operation.target} = {JSON.stringify(operation.result)}
      </span>
    </div>
  );
}

function FunctionCallBadge({ code }: { code: string }) {
  const funcName = code.match(/(\w+)\s*\(/)?.[1] || "function";
  const args = code.match(/\(([^)]*)\)/)?.[1] || "";
  return (
    <div className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-accent/10 border border-accent/30">
      <PhoneCall className="w-3.5 h-3.5 text-accent" />
      <span className="text-xs font-mono font-semibold text-accent">{funcName}</span>
      {args && (
        <>
          <span className="text-xs text-muted-foreground">(</span>
          <span className="text-xs font-mono text-foreground">{args}</span>
          <span className="text-xs text-muted-foreground">)</span>
        </>
      )}
    </div>
  );
}

export function AnimatedExecution({ data, onLineChange }: AnimatedExecutionProps) {
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [consoleLines, setConsoleLines] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const steps = data.execution_flow || [];
  const totalSteps = steps.length;

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  const advance = useCallback(() => {
    setCurrentStep((prev) => {
      const next = prev + 1;
      if (next >= totalSteps) { setIsPlaying(false); return prev; }
      const s = steps[next];
      if (s?.output_produced) setConsoleLines((o) => [...o, s.output_produced!]);
      return next;
    });
  }, [totalSteps, steps]);

  useEffect(() => {
    const step = currentStep >= 0 ? steps[currentStep] : null;
    onLineChange?.(step?.line ?? null);
  }, [currentStep, steps, onLineChange]);

  useEffect(() => {
    clearTimer();
    if (isPlaying && currentStep < totalSteps - 1) {
      timerRef.current = setTimeout(advance, 1800 / speed);
    } else if (currentStep >= totalSteps - 1) {
      setIsPlaying(false);
    }
    return clearTimer;
  }, [isPlaying, currentStep, speed, advance, clearTimer, totalSteps]);

  // Auto-scroll to bottom of step list
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentStep]);

  const handlePlay = () => {
    if (currentStep >= totalSteps - 1) {
      setCurrentStep(-1); setConsoleLines([]); setIsPlaying(true);
      setTimeout(advance, 200);
    } else {
      setIsPlaying(true);
      if (currentStep === -1) advance();
    }
  };
  const handlePause = () => setIsPlaying(false);
  const handleStepForward = () => { setIsPlaying(false); if (currentStep < totalSteps - 1) advance(); };
  const handleStepBack = () => {
    setIsPlaying(false);
    setCurrentStep((prev) => {
      if (prev <= 0) { setConsoleLines([]); return -1; }
      const out: string[] = [];
      for (let i = 0; i < prev; i++) { if (steps[i]?.output_produced) out.push(steps[i].output_produced!); }
      setConsoleLines(out);
      return prev - 1;
    });
  };
  const handleReset = () => { clearTimer(); setIsPlaying(false); setCurrentStep(-1); setConsoleLines([]); };

  const step = currentStep >= 0 ? steps[currentStep] : null;
  const prevVars = currentStep > 0 ? steps[currentStep - 1]?.variables_state : null;
  const changedVars = step ? getChangedVars(currentStep === 0 ? null : prevVars || null, step.variables_state || {}) : new Set<string>();
  const newVars = step && currentStep === 0 ? new Set(Object.keys(step.variables_state || {})) : new Set<string>();
  if (step && prevVars) {
    for (const k of Object.keys(step.variables_state || {})) {
      if (!(k in prevVars)) newVars.add(k);
    }
  }

  const operation = step ? parseOperation(step.code, step.variables_state || {}) : null;
  const isFunctionCall = step?.flow_type === "function_call" || step?.flow_type === "call";
  const isReturn = step?.flow_type === "return";

  // Build call stack
  const callStack: string[] = [];
  if (step) {
    for (let i = 0; i <= currentStep; i++) {
      const s = steps[i];
      if (s.flow_type === "function_call" || s.flow_type === "call") {
        const name = s.code.match(/(\w+)\s*\(/)?.[1] || s.code.trim();
        callStack.push(name);
      }
      if (s.flow_type === "return" && callStack.length > 0) {
        callStack.pop();
      }
    }
  }

  const varEntries = Object.entries(step?.variables_state || {});

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Main visual area */}
      <div className="flex-1 overflow-hidden" ref={scrollRef}>
        {currentStep === -1 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3 px-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <Play className="w-7 h-7 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Press play to visualize execution</p>
              <p className="text-xs text-muted-foreground/60 max-w-[240px] mx-auto">{data.summary}</p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-3 space-y-3">
              {/* Step Header */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                  Step {currentStep + 1}/{totalSteps}
                </span>
                {/* Connector back to editor — left-pointing arrow shows the linked line */}
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 border border-primary/30 px-1.5 py-0.5 rounded animate-pulse">
                  <ChevronLeft className="w-3 h-3" />
                  <span className="font-mono">Line {step?.line}</span>
                </span>
                {step?.flow_type && step.flow_type !== "sequential" && (
                  <span className={cn(
                    "text-[10px] font-semibold uppercase px-2 py-0.5 rounded",
                    isFunctionCall ? "bg-accent/10 text-accent" :
                    isReturn ? "bg-green-500/10 text-green-500" :
                    step.flow_type === "loop" ? "bg-yellow-500/10 text-yellow-500" :
                    step.flow_type === "conditional" ? "bg-orange-500/10 text-orange-500" :
                    "bg-secondary text-muted-foreground"
                  )}>
                    {step.flow_type}
                  </span>
                )}
              </div>

              {/* Code being executed */}
              <div className="rounded-lg bg-secondary border border-border px-3 py-2">
                <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Executing</div>
                <code className="text-sm font-mono text-foreground block">{step?.code}</code>
              </div>

              {/* Function call indicator */}
              {isFunctionCall && step && <FunctionCallBadge code={step.code} />}

              {/* Return indicator */}
              {isReturn && (
                <div className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <CornerDownRight className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-xs font-semibold text-green-500">Return</span>
                </div>
              )}

              {/* What happens - explanation */}
              <div className="rounded-lg bg-card border border-border px-3 py-2">
                <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">What happens</div>
                <p className="text-xs text-foreground leading-relaxed">{step?.action}</p>
              </div>

              {/* Operation visualization */}
              {operation && (
                <div>
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1.5 px-1">Computation</div>
                  <OperationVisual operation={operation} />
                </div>
              )}

              {/* Call Stack */}
              {callStack.length > 0 && (
                <div className="rounded-lg bg-accent/5 border border-accent/20 px-3 py-2">
                  <div className="text-[10px] text-accent font-semibold uppercase tracking-wider mb-1">Call Stack</div>
                  <div className="flex items-center gap-1 flex-wrap">
                    {callStack.map((name, i) => (
                      <div key={i} className="flex items-center gap-1">
                        {i > 0 && <ArrowRight className="w-3 h-3 text-accent/50" />}
                        <span className="text-xs font-mono text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                          {name}()
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Variables - visual boxes */}
              {varEntries.length > 0 && (
                <div>
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1.5 px-1">
                    Variables
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {varEntries.map(([k, v]) => (
                      <VariableBox
                        key={k}
                        name={k}
                        value={v}
                        isNew={newVars.has(k)}
                        isChanged={changedVars.has(k) && !newVars.has(k)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Arrow showing flow to output */}
              {step?.output_produced && (
                <div className="flex justify-center">
                  <ArrowDown className="w-4 h-4 text-green-500 animate-bounce" />
                </div>
              )}

              {/* Output produced this step */}
              {step?.output_produced && (
                <div className="rounded-lg bg-green-500/10 border border-green-500/30 px-3 py-2">
                  <div className="text-[10px] text-green-500 font-semibold uppercase tracking-wider mb-1">Output</div>
                  <code className="text-sm font-mono text-green-400 block">{step.output_produced}</code>
                </div>
              )}

              {/* Console history */}
              {consoleLines.length > 0 && (
                <div className="rounded-lg bg-card border border-border px-3 py-2">
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Console</div>
                  <div className="space-y-0.5">
                    {consoleLines.map((line, i) => (
                      <div key={i} className="text-xs font-mono text-green-400">
                        <span className="text-muted-foreground mr-1">›</span>{line}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Done indicator */}
              {currentStep >= totalSteps - 1 && totalSteps > 0 && (
                <div className="rounded-lg bg-primary/10 border border-primary/30 px-3 py-3 text-center">
                  <div className="text-[10px] text-primary font-semibold uppercase tracking-wider mb-1">✅ Complete</div>
                  <p className="text-xs text-foreground">{data.key_insight}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Controls */}
      <div className="border-t border-border bg-secondary/60 px-4 py-3 space-y-3 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Speed</span>
              <span className="text-xs font-mono text-foreground">{speed}x</span>
            </div>
            <Slider
              value={[speed]}
              min={0.5}
              max={3}
              step={0.5}
              onValueChange={([v]) => setSpeed(v)}
              className="w-full"
            />
          </div>
          <div className="text-right">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mb-1">Step</span>
            <span className="text-sm font-mono text-foreground">{Math.max(0, currentStep + 1)} / {totalSteps}</span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleStepBack}>
            <SkipBack className="w-4 h-4" />
          </Button>
          {isPlaying ? (
            <Button size="sm" className="h-9 w-9 p-0 rounded-full" onClick={handlePause}>
              <Pause className="w-4 h-4" />
            </Button>
          ) : (
            <Button size="sm" className="h-9 w-9 p-0 rounded-full" onClick={handlePlay}>
              <Play className="w-4 h-4 ml-0.5" />
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleStepForward}>
            <SkipForward className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleReset}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
