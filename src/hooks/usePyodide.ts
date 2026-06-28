import { useState, useRef, useCallback } from "react";

declare global {
  interface Window {
    loadPyodide: (config?: any) => Promise<any>;
  }
}

interface InstalledPackage {
  name: string;
  version: string;
}

interface PyodideHook {
  isReady: boolean;
  isLoading: boolean;
  isRunning: boolean;
  waitingForInput: boolean;
  inputPromptText: string;
  liveOutput: string;
  installedPackages: InstalledPackage[];
  isInstallingPackage: boolean;
  runCode: (code: string) => Promise<{ output: string; error: string | null }>;
  loadPyodide: () => Promise<void>;
  submitInput: (value: string) => void;
  stopExecution: () => void;
  installPackage: (packageName: string) => Promise<{ success: boolean; error?: string }>;
  getInstalledPackages: () => void;
}

export function usePyodide(): PyodideHook {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [inputPromptText, setInputPromptText] = useState("");
  const [liveOutput, setLiveOutput] = useState("");
  const [installedPackages, setInstalledPackages] = useState<InstalledPackage[]>([]);
  const [isInstallingPackage, setIsInstallingPackage] = useState(false);
  const pyodideRef = useRef<any>(null);
  const outputRef = useRef("");
  const inputResolveRef = useRef<((value: string) => void) | null>(null);
  const inputRejectRef = useRef<((reason: any) => void) | null>(null);

  const loadPyodideInstance = useCallback(async () => {
    if (pyodideRef.current || isLoading) return;
    setIsLoading(true);

    try {
      if (!window.loadPyodide) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Pyodide"));
          document.head.appendChild(script);
        });
      }

      const pyodide = await window.loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/",
      });

      pyodideRef.current = pyodide;
      setIsReady(true);
    } catch (err) {
      console.error("Failed to load Pyodide:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const submitInput = useCallback((value: string) => {
    if (inputResolveRef.current) {
      // Echo the typed value into the output stream
      outputRef.current += value + "\n";
      setLiveOutput(outputRef.current);
      setWaitingForInput(false);
      inputResolveRef.current(value);
      inputResolveRef.current = null;
      inputRejectRef.current = null;
    }
  }, []);

  const stopExecution = useCallback(() => {
    if (inputRejectRef.current) {
      inputRejectRef.current(new Error("KeyboardInterrupt"));
      inputRejectRef.current = null;
      inputResolveRef.current = null;
      setWaitingForInput(false);
    }
  }, []);

  const runCode = useCallback(
    async (code: string): Promise<{ output: string; error: string | null }> => {
      if (!pyodideRef.current) {
        return { output: "", error: "Python is not loaded yet. Please wait..." };
      }

      setIsRunning(true);
      outputRef.current = "";
      setLiveOutput("");

      try {
        const pyodide = pyodideRef.current;

        // JS callback for real-time stdout
        const jsWriteOutput = (text: string) => {
          outputRef.current += text;
          setLiveOutput(outputRef.current);
        };

        // JS async function for interactive input — returns a Promise
        const jsAsyncInput = (_prompt: string) => {
          setLiveOutput(outputRef.current);
          setInputPromptText(_prompt || "");
          setWaitingForInput(true);

          return new Promise<string>((resolve, reject) => {
            inputResolveRef.current = resolve;
            inputRejectRef.current = reject;
          });
        };

        pyodide.globals.set("__js_write_output__", jsWriteOutput);
        pyodide.globals.set("__js_async_input__", jsAsyncInput);

        // Set up Python environment with real-time stdout and async input
        pyodide.runPython(`
import sys
from pyodide.ffi import run_sync as __run_sync__

class __JsWriter__:
    def write(self, text):
        __js_write_output__(text)
    def flush(self):
        pass

__stderr_buf__ = __import__('io').StringIO()
sys.stdout = __JsWriter__()
sys.stderr = __stderr_buf__

def input(prompt=""):
    val = __run_sync__(__js_async_input__(prompt))
    return str(val)

__builtins__.input = input
`);

        // Run user code
        try {
          await pyodide.runPythonAsync(code);
        } catch (e: any) {
          // Errors captured in stderr
        }

        const stderr = pyodide.runPython("__stderr_buf__.getvalue()");

        // Reset stdout/stderr
        pyodide.runPython(`
import sys
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
`);

        return {
          output: outputRef.current,
          error: stderr || null,
        };
      } catch (err: any) {
        return {
          output: outputRef.current,
          error: err.message || "An unknown error occurred",
        };
      } finally {
        setIsRunning(false);
        setWaitingForInput(false);
      }
    },
    []
  );

  const getInstalledPackages = useCallback(async () => {
    if (!pyodideRef.current) return;
    try {
      const pyodide = pyodideRef.current;
      await pyodide.loadPackage("micropip");
      const packagesJson = pyodide.runPython(`
import json, micropip
json.dumps([{"name": name, "version": str(pkg.version)} for name, pkg in micropip.list().items()])
`);
      const packages: InstalledPackage[] = JSON.parse(packagesJson);
      // Filter out internal pyodide packages
      setInstalledPackages(packages.filter(p => !p.name.startsWith('_')));
    } catch {
      // micropip might not be loaded yet
    }
  }, []);

  const installPackage = useCallback(
    async (packageName: string): Promise<{ success: boolean; error?: string }> => {
      if (!pyodideRef.current) {
        return { success: false, error: "Python is not loaded yet." };
      }
      setIsInstallingPackage(true);
      try {
      const pyodide = pyodideRef.current;
      // Ensure micropip is loaded first
      await pyodide.loadPackage("micropip");
      await pyodide.runPythonAsync(`
import micropip
await micropip.install("${packageName.replace(/"/g, '\\"')}")
`);
        getInstalledPackages();
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || "Failed to install package" };
      } finally {
        setIsInstallingPackage(false);
      }
    },
    [getInstalledPackages]
  );

  return {
    isReady,
    isLoading,
    isRunning,
    waitingForInput,
    inputPromptText,
    liveOutput,
    installedPackages,
    isInstallingPackage,
    runCode,
    loadPyodide: loadPyodideInstance,
    submitInput,
    stopExecution,
    installPackage,
    getInstalledPackages,
  };
}
