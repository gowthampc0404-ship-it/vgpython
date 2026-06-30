import { useState } from "react";
import { Play, BookOpen, Bug, FileCode, Loader2, Clock, MessageSquarePlus } from "lucide-react";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { FeedbackDialog } from "./FeedbackDialog";

interface HeaderProps {
  isReady: boolean;
  isLoading: boolean;
  isRunning: boolean;
  isExplaining: boolean;
  onRun: () => void;
  onExplain: () => void;
  onExample: () => void;
  onBuggyCode: () => void;
}

export function Header({
  isReady,
  isLoading,
  isRunning,
  isExplaining,
  onRun,
  onExplain,
  onExample,
  onBuggyCode
}: HeaderProps) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const buildTime = new Date(__BUILD_TIME__);
  const lastUpdated = buildTime.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return (
    <header className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-[hsl(260,80%,30%)] to-[hsl(220,80%,25%)] border-b border-border">
      <div className="flex items-center gap-3">
        <img alt="PyLearn IDE Logo" className="w-8 h-8 rounded" src="/lovable-uploads/0cc17d65-000b-4365-b538-53042a9452ef.png" />
        <div>
          <h1 className="text-lg font-bold text-foreground tracking-tight whitespace-pre-line font-mono border-double rounded-none">
            {"PYTHON\n~By Gowtham\n(2025-26)"}
          </h1>
          <p className="text-xs text-foreground/60">
            Interactive Python Learning Environment
          </p>
          <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-foreground/10 text-foreground/70 font-mono text-[10px]">
            <Clock className="w-2.5 h-2.5" />
            <span>Last updated: {lastUpdated}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={onRun}
          disabled={!isReady || isRunning}
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-1.5">
          
          {isRunning ?
          <Loader2 className="w-4 h-4 animate-spin" /> :

          <Play className="w-4 h-4" />
          }
          Run Code
        </Button>

        <Button
          onClick={onExplain}
          disabled={isExplaining}
          size="sm"
          variant="outline"
          className="border-accent/50 text-accent-foreground hover:bg-accent/20 gap-1.5">
          
          {isExplaining ?
          <Loader2 className="w-4 h-4 animate-spin" /> :

          <BookOpen className="w-4 h-4" />
          }
          Explain Code
        </Button>

        <div className="w-px h-6 bg-foreground/20 mx-1" />

        <Button
          onClick={onExample}
          size="sm"
          variant="ghost"
          className="text-foreground/70 hover:text-foreground hover:bg-foreground/10 gap-1.5">
          
          <FileCode className="w-4 h-4" />
          Example
        </Button>

        <Button
          onClick={onBuggyCode}
          size="sm"
          variant="ghost"
          className="text-warning hover:text-warning hover:bg-warning/10 gap-1.5">
          
          <Bug className="w-4 h-4" />
          Buggy Code
        </Button>

        <Button
          onClick={() => setFeedbackOpen(true)}
          size="sm"
          variant="ghost"
          className="text-foreground/80 hover:text-foreground hover:bg-foreground/10 gap-1.5">
          <MessageSquarePlus className="w-4 h-4" />
          Feedback
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
          isReady ?
          "bg-success animate-pulse-glow" :
          isLoading ?
          "bg-warning animate-pulse" :
          "bg-muted-foreground"}`
          } />
        
        <span className="text-xs text-foreground/70">
          {isReady ?
          "Python Ready" :
          isLoading ?
          "Loading Python..." :
          "Initializing..."}
        </span>
      </div>
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </header>);

}