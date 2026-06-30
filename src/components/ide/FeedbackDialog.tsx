import { useState, useEffect, useRef } from "react";
import { Loader2, Send, CheckCircle2, MessageSquarePlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function getAnonId(): string {
  const key = "pylearn_anon_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = "User_" + Math.floor(1000 + Math.random() * 9000);
    localStorage.setItem(key, id);
  }
  return id;
}

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [justSent, setJustSent] = useState(false);
  const anonIdRef = useRef<string>("");

  useEffect(() => {
    if (open) {
      anonIdRef.current = getAnonId();
      setJustSent(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      toast.error("Please write something before sending.");
      return;
    }
    setIsSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-feedback", {
        body: { anon_id: anonIdRef.current, message: trimmed },
      });
      if (error) throw error;
      setMessage("");
      setJustSent(true);
      toast.success("Feedback Sent Successfully! 🎉", {
        description: "Thank you — Gowtham will read it soon.",
        duration: 4000,
      });
      setTimeout(() => onOpenChange(false), 1400);
    } catch (e: any) {
      toast.error("Couldn't send feedback", {
        description: e?.message || "Please try again in a moment.",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5 text-primary" />
            Send Feedback
          </DialogTitle>
          <DialogDescription>
            Share ideas, bugs, or questions. Sent anonymously as{" "}
            <span className="font-mono text-primary">{anonIdRef.current || "User_••••"}</span>.
          </DialogDescription>
        </DialogHeader>

        {justSent ? (
          <div className="flex flex-col items-center justify-center py-8 animate-in fade-in zoom-in duration-300">
            <div className="w-14 h-14 rounded-full bg-success/15 flex items-center justify-center mb-3 animate-in zoom-in duration-500">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <p className="text-base font-semibold text-foreground">Feedback Sent Successfully!</p>
            <p className="text-sm text-muted-foreground mt-1">Thank you.</p>
          </div>
        ) : (
          <>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your feedback here…"
              rows={6}
              maxLength={5000}
              disabled={isSending}
              className="resize-none"
            />
            <div className="text-[11px] text-muted-foreground text-right">
              {message.length}/5000
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSending}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSending || !message.trim()} className="gap-1.5">
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isSending ? "Sending…" : "Submit Feedback"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}