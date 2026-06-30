import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/ide/Header";
import { CodeEditor } from "@/components/ide/CodeEditor";
import { OutputPanel } from "@/components/ide/OutputPanel";
import { usePyodide } from "@/hooks/usePyodide";
import { useAIExplain } from "@/hooks/useAIExplain";
import { useToast } from "@/hooks/use-toast";

const EXAMPLE_CODE = `# Factorial Calculator
def factorial(n):
    if n <= 1:
        return 1
    else:
        return n * factorial(n - 1)

# Calculate factorial of 5
number = 5
result = factorial(number)
print(f"The factorial of {number} is {result}")

# Loop example
for i in range(1, 4):
    print(f"Loop iteration: {i}")
`;

const BUGGY_CODE = `# This code has bugs - can you find them?
def greet(name)
    print("Hello, " + name)

numbers = [1, 2, 3, 4, 5]
for i in range(len(numbers)):
    print(numbers[i + 1])

x = 10
y = 0
result = x / y
print(result)
`;

type OutputTab = "output" | "trace" | "errors" | "line" | "alllines" | "chat" | "modules" | "outputexplain" | "animate";

const Index = () => {
  const [code, setCode] = useState(EXAMPLE_CODE);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<OutputTab>("output");
  const { toast } = useToast();

  const {
    isReady,
    isLoading,
    isRunning,
    waitingForInput,
    inputPromptText,
    liveOutput,
    installedPackages,
    isInstallingPackage,
    runCode,
    loadPyodide,
    submitInput,
    stopExecution,
    installPackage,
    getInstalledPackages,
  } = usePyodide();

  const {
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
  } = useAIExplain();

  // Defer Pyodide loading to avoid blocking main thread (improves FID)
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(() => loadPyodide(), { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    } else {
      const id = setTimeout(() => loadPyodide(), 100);
      return () => clearTimeout(id);
    }
  }, [loadPyodide]);

  const handleRun = useCallback(async () => {
    setActiveTab("output");
    const result = await runCode(code);
    setOutput(result.output);
    setError(result.error);

    if (result.error) {
      // Auto-explain errors
      setActiveTab("errors");
      explainError(code, result.error);
    } else if (result.output) {
      // Auto-explain output flow
      explainOutput(code, result.output);
    }
  }, [code, runCode, explainError, explainOutput]);

  const handleExplain = useCallback(() => {
    explainCode(code);
    explainAllLines(code);
    setActiveTab("trace");
  }, [code, explainCode, explainAllLines]);

  const handleLineClick = useCallback(
    (lineNumber: number) => {
      setHighlightedLine(lineNumber);
      explainLine(code, lineNumber);
      setActiveTab("line");
    },
    [code, explainLine]
  );

  const handleExample = useCallback(() => {
    setCode(EXAMPLE_CODE);
    setOutput("");
    setError(null);
    toast({ title: "Example loaded", description: "Factorial calculator example loaded." });
  }, [toast]);

  const handleBuggyCode = useCallback(() => {
    setCode(BUGGY_CODE);
    setOutput("");
    setError(null);
    toast({
      title: "Buggy code loaded",
      description: "Try running this code to see errors and get AI explanations!",
      variant: "destructive",
    });
  }, [toast]);

  const handleSendChat = useCallback(
    (message: string) => {
      sendChatMessage(code, message);
    },
    [code, sendChatMessage]
  );

  const handleAnimateLineChange = useCallback((line: number | null) => {
    setHighlightedLine(line);
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header
        isReady={isReady}
        isLoading={isLoading}
        isRunning={isRunning}
        isExplaining={isExplaining}
        onRun={handleRun}
        onExplain={handleExplain}
        onExample={handleExample}
        onBuggyCode={handleBuggyCode}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Code Editor */}
        <div className="w-1/2 border-r border-border">
          <CodeEditor
            code={code}
            onChange={setCode}
            onLineClick={handleLineClick}
            highlightedLine={highlightedLine}
            showVisualConnector={activeTab === "animate" && highlightedLine !== null}
          />
        </div>

        {/* Right: Output Panel */}
        <div className="w-1/2">
          <OutputPanel
            output={output}
            error={error}
            liveOutput={liveOutput}
            waitingForInput={waitingForInput}
            inputPromptText={inputPromptText}
            isRunning={isRunning}
            onSubmitInput={submitInput}
            onStopExecution={stopExecution}
            explanation={explanation}
            lineExplanation={lineExplanation}
            allLinesExplanation={allLinesExplanation}
            errorExplanation={errorExplanation}
            outputExplanation={outputExplanation}
            onExplainOutput={(outputText: string) => explainOutput(code, outputText)}
            chatMessages={chatMessages}
            isChatLoading={isChatLoading}
            isExplaining={isExplaining}
            onSendChat={handleSendChat}
            onClearChat={clearChat}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            installedPackages={installedPackages}
            isInstallingPackage={isInstallingPackage}
            onInstallPackage={installPackage}
            onRefreshPackages={getInstalledPackages}
            isPyodideReady={isReady}
            onAnimateLineChange={handleAnimateLineChange}
            onJumpToLine={(line) => setHighlightedLine(line)}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
