import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAnonId } from "@/lib/anonId";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function useAIExplain() {
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [lineExplanation, setLineExplanation] = useState("");
  const [allLinesExplanation, setAllLinesExplanation] = useState("");
  const [errorExplanation, setErrorExplanation] = useState("");
  const [outputExplanation, setOutputExplanation] = useState("");
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const streamFromEdge = useCallback(
    async (
      type: string,
      code: string,
      extra: Record<string, any>,
      onDelta: (text: string) => void
    ) => {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/python-ai`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
      body: JSON.stringify({ type, code, ...extra }),
        }
      );

      // Best-effort usage logging (never blocks the response)
      supabase
        .from("ai_usage")
        .insert({ anon_id: getAnonId(), request_type: type })
        .then(() => {}, () => {});

      if (!resp.ok) {
        const errText = await resp.text();
        const message = errText || `Error ${resp.status}`;
        throw new Error(JSON.stringify({ status: resp.status, message }));
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        if (readerDone) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) onDelta(content);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    },
    []
  );

  const explainCode = useCallback(
    async (code: string) => {
      setIsExplaining(true);
      setExplanation("");
      let full = "";
      try {
        await streamFromEdge("explain", code, {}, (chunk) => {
          full += chunk;
          setExplanation(full);
        });
      } catch (e: any) {
        setExplanation("Error: " + e.message);
      } finally {
        setIsExplaining(false);
      }
    },
    [streamFromEdge]
  );

  const explainLine = useCallback(
    async (code: string, lineNumber: number) => {
      setIsExplaining(true);
      setLineExplanation("");
      let full = "";
      try {
        await streamFromEdge("explain_line", code, { lineNumber }, (chunk) => {
          full += chunk;
          setLineExplanation(full);
        });
      } catch (e: any) {
        setLineExplanation("Error: " + e.message);
      } finally {
        setIsExplaining(false);
      }
    },
    [streamFromEdge]
  );

  const explainAllLines = useCallback(
    async (code: string) => {
      setIsExplaining(true);
      setAllLinesExplanation("");
      let full = "";
      try {
        await streamFromEdge("explain_all_lines", code, {}, (chunk) => {
          full += chunk;
          setAllLinesExplanation(full);
        });
      } catch (e: any) {
        setAllLinesExplanation("Error: " + e.message);
      } finally {
        setIsExplaining(false);
      }
    },
    [streamFromEdge]
  );

  const explainError = useCallback(
    async (code: string, error: string) => {
      setIsExplaining(true);
      setErrorExplanation("");
      let full = "";
      try {
        await streamFromEdge("explain_error", code, { error }, (chunk) => {
          full += chunk;
          setErrorExplanation(full);
        });
      } catch (e: any) {
        setErrorExplanation("Error: " + e.message);
      } finally {
        setIsExplaining(false);
      }
    },
    [streamFromEdge]
  );

  const explainOutput = useCallback(
    async (code: string, outputText: string) => {
      setIsExplaining(true);
      setOutputExplanation("");
      let full = "";
      try {
        await streamFromEdge("explain_output", code, { output: outputText }, (chunk) => {
          full += chunk;
          setOutputExplanation(full);
        });
      } catch (e: any) {
        setOutputExplanation("Error: " + e.message);
      } finally {
        setIsExplaining(false);
      }
    },
    [streamFromEdge]
  );

  const sendChatMessage = useCallback(
    async (code: string, userMessage: string) => {
      const userMsg: Message = { role: "user", content: userMessage };
      setChatMessages((prev) => [...prev, userMsg]);
      setIsChatLoading(true);

      let assistantContent = "";
      const allMessages = [...chatMessages, userMsg];

      try {
        await streamFromEdge(
          "chat",
          code,
          {
            messages: allMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          },
          (chunk) => {
            assistantContent += chunk;
            setChatMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: assistantContent } : m
                );
              }
              return [...prev, { role: "assistant", content: assistantContent }];
            });
          }
        );
      } catch (e: any) {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Error: " + e.message },
        ]);
      } finally {
        setIsChatLoading(false);
      }
    },
    [chatMessages, streamFromEdge]
  );

  const clearChat = useCallback(() => {
    setChatMessages([]);
  }, []);

  return {
    isExplaining,
    explanation,
    lineExplanation,
    allLinesExplanation,
    errorExplanation,
    outputExplanation,
    chatMessages,
    isChatLoading,
    explainCode,
    explainLine,
    explainAllLines,
    explainError,
    explainOutput,
    sendChatMessage,
    clearChat,
  };
}
