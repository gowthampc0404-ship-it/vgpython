import { useRef, useCallback } from "react";
import { ChevronRight } from "lucide-react";

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  onLineClick: (lineNumber: number) => void;
  highlightedLine?: number | null;
  showVisualConnector?: boolean;
}

export function CodeEditor({
  code,
  onChange,
  onLineClick,
  highlightedLine,
  showVisualConnector = false,
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const lines = code.split("\n");
  const lineCount = lines.length;

  const handleScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  // Python keywords that increase indentation
  const INDENT_KEYWORDS = /^\s*(def |class |if |elif |else:|for |while |try:|except|finally:|with |match |case )/;
  const ENDS_WITH_COLON = /:\s*(#.*)?$/;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      if (e.key === "Tab") {
        e.preventDefault();
        if (e.shiftKey) {
          // Dedent: remove up to 4 leading spaces on current line
          const lineStart = code.lastIndexOf("\n", start - 1) + 1;
          const lineText = code.substring(lineStart, start);
          const spacesToRemove = Math.min(4, lineText.length - lineText.trimStart().length);
          if (spacesToRemove > 0) {
            const newValue = code.substring(0, lineStart) + code.substring(lineStart + spacesToRemove);
            onChange(newValue);
            setTimeout(() => {
              textarea.selectionStart = textarea.selectionEnd = start - spacesToRemove;
            }, 0);
          }
        } else {
          const newValue = code.substring(0, start) + "    " + code.substring(end);
          onChange(newValue);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + 4;
          }, 0);
        }
      }

      if (e.key === "Enter") {
        e.preventDefault();
        // Get current line
        const lineStart = code.lastIndexOf("\n", start - 1) + 1;
        const currentLine = code.substring(lineStart, start);
        // Get current indentation
        const indentMatch = currentLine.match(/^(\s*)/);
        let indent = indentMatch ? indentMatch[1] : "";

        // If line ends with colon, increase indent
        const trimmedLine = currentLine.trimEnd();
        if (ENDS_WITH_COLON.test(trimmedLine)) {
          indent += "    ";
        }

        // Handle dedent keywords: return, break, continue, pass, raise
        const dedentKeywords = /^\s*(return|break|continue|pass|raise)\b/;
        if (dedentKeywords.test(trimmedLine) && indent.length >= 4) {
          // Keep same indent (don't add more), the current line's indent is already correct
        }

        const newValue = code.substring(0, start) + "\n" + indent + code.substring(end);
        onChange(newValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 1 + indent.length;
        }, 0);
      }

      // Backspace: delete 4 spaces if cursor is at an indent boundary
      if (e.key === "Backspace" && start === end) {
        const lineStart = code.lastIndexOf("\n", start - 1) + 1;
        const beforeCursor = code.substring(lineStart, start);
        if (beforeCursor.length > 0 && beforeCursor.trim() === "" && beforeCursor.length % 4 === 0) {
          e.preventDefault();
          const newValue = code.substring(0, start - 4) + code.substring(start);
          onChange(newValue);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start - 4;
          }, 0);
        }
      }
    },
    [code, onChange]
  );

  return (
    <div className="flex flex-col h-full bg-editor-bg">
      {/* File tab */}
      <div className="flex items-center px-3 py-1.5 bg-secondary border-b border-border">
        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span className="w-3 h-3 bg-accent/30 rounded-sm flex items-center justify-center text-[8px]">
            📄
          </span>
          main.py
        </span>
      </div>

      {/* Editor area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Line numbers */}
        <div
          ref={lineNumbersRef}
          className="flex flex-col items-end py-3 px-2 bg-editor-gutter select-none overflow-hidden min-w-[3rem]"
        >
          {Array.from({ length: Math.max(lineCount, 20) }, (_, i) => (
            <button
              key={i}
              onClick={() => i < lineCount && onLineClick(i + 1)}
              className={`text-xs leading-6 font-mono w-full text-right pr-2 transition-colors ${
                highlightedLine === i + 1
                  ? "text-accent bg-accent/10"
                  : "text-muted-foreground/50 hover:text-muted-foreground"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Highlighted line background */}
        {highlightedLine && (
          <>
            <div
              className={`absolute left-12 right-0 h-6 pointer-events-none transition-colors ${
                showVisualConnector
                  ? "bg-primary/15 border-l-2 border-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.2)]"
                  : "bg-accent/5"
              }`}
              style={{ top: `${(highlightedLine - 1) * 24 + 12}px` }}
            />
            {/* Visual tab connector — right-pointing arrow showing this line is being visualized */}
            {showVisualConnector && (
              <div
                className="absolute right-0 h-6 flex items-center pointer-events-none z-10"
                style={{ top: `${(highlightedLine - 1) * 24 + 12}px` }}
              >
                <div className="flex items-center gap-1 bg-primary/90 text-primary-foreground text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-l shadow-lg animate-pulse">
                  <span>Visual</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            )}
          </>
        )}

        {/* Code textarea */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="flex-1 bg-transparent text-foreground font-mono text-sm leading-6 p-3 resize-none focus:outline-none overflow-auto"
          style={{ tabSize: 4 }}
        />
      </div>
    </div>
  );
}
