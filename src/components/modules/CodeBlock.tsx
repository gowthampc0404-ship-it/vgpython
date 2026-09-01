import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CodeBlockProps {
  code: string;
  filename?: string;
}

export function CodeBlock({ code, filename = "snippet.py" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const lines = code.split("\n");

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-editor-bg">
      <div className="flex items-center gap-2 border-b border-border bg-editor-gutter px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
        <span className="ml-2 truncate font-mono text-[11px] text-muted-foreground">
          {filename}
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={copy}
          className="ml-auto h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-6 sm:text-[13px]">
        {lines.map((l, i) => (
          <div key={i} className="flex gap-4">
            <span className="w-6 shrink-0 select-none text-right text-muted-foreground/40">
              {i + 1}
            </span>
            <code className="whitespace-pre text-foreground/90">{l || " "}</code>
          </div>
        ))}
      </pre>
    </div>
  );
}
