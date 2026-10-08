import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_TYPES = new Set([
  "explain",
  "explain_line",
  "explain_all_lines",
  "explain_error",
  "chat",
  "explain_output",
]);
const MAX_CODE_LEN = 10_000;
const MAX_ERROR_LEN = 5_000;
const MAX_OUTPUT_LEN = 10_000;
const MAX_MSG_COUNT = 50;
const MAX_MSG_LEN = 2_000;

const SYSTEM_PROMPTS: Record<string, string> = {
  explain: `You are a Python teaching assistant. The user will provide Python code. Provide a structured explanation as a JSON object.

IMPORTANT: You MUST respond with ONLY a valid JSON object (no markdown, no code fences, no extra text):

{
  "overview": "A clear 1-2 sentence summary of what the code does overall",
  "concepts": [
    {"name": "Concept Name", "icon": "🔧", "description": "Brief explanation of the concept used"}
  ],
  "walkthrough": [
    {"step": 1, "title": "Step title", "description": "What happens in this step", "code_ref": "relevant code snippet"}
  ],
  "improvements": [
    {"title": "Improvement title", "description": "Why and how to improve", "priority": "HIGH|MEDIUM|LOW"}
  ],
  "summary": "One final takeaway sentence for the learner"
}

For "concepts", include ALL key Python concepts used (functions, loops, conditions, input/output, data types, etc.) with a relevant emoji icon.
For "walkthrough", provide a clear step-by-step execution flow showing what happens when the code runs.
For "improvements", suggest best practices or optimizations. Mark priority as HIGH for critical, MEDIUM for recommended, LOW for nice-to-have.

Be educational and beginner-friendly. Respond with ONLY the JSON object.`,

  explain_line: `You are a Python teaching assistant. The user will provide Python code and a specific line number. Explain ONLY that specific line in detail.

IMPORTANT: You MUST respond with ONLY a valid JSON object (no markdown, no code fences, no extra text):

{
  "line": <line_number>,
  "type": "COMMENT|FUNCTION|CONDITION|RETURN|ASSIGNMENT|LOOP|IMPORT|PRINT|CALL|EMPTY|CLASS|DECORATOR|EXCEPTION|OTHER",
  "code": "the exact code on that line",
  "title": "Short title like 'Function Definition' or 'If Statement'",
  "description": "A clear explanation of what this line does",
  "details": {
    "key1": "value1"
  },
  "how_it_works": "Optional deeper explanation of the concept",
  "value_changes": [
    {"variable": "variable_name", "before": "value before this line executes (or 'undefined')", "after": "value after this line executes", "explanation": "Why this change happens"}
  ],
  "example_with_input": {
    "sample_input": "e.g. user enters 5",
    "execution": "What happens on this line with that input",
    "result": "The resulting value or output"
  }
}

Pick the best "type" from: COMMENT, FUNCTION, CONDITION, RETURN, ASSIGNMENT, LOOP, IMPORT, PRINT, CALL, EMPTY, CLASS, DECORATOR, EXCEPTION, OTHER.

For "details", include relevant key-value pairs like:
- For functions: {"Name": "func_name", "Parameters": "a, b"}
- For conditions: {"Condition": "x > 0"}
- For assignments: {"Variable": "x", "Value": "5"}
- For loops: {"Iterable": "range(10)", "Variable": "i"}
- For returns: {"Returns": "the expression"}

For "value_changes", show ALL variables that change on this line. If user uses input(), show what happens with an example value.
For "example_with_input", if the line involves input() or depends on input, show a concrete example with a sample user-provided value.

Be educational and beginner-friendly. Respond with ONLY the JSON object.`,

  explain_all_lines: `You are a Python teaching assistant. The user will provide Python code. Explain EVERY line of the code.

IMPORTANT: You MUST respond with ONLY a valid JSON array (no markdown, no code fences, no extra text). Each element represents one line:

[
  {
    "line": 1,
    "type": "COMMENT|FUNCTION|CONDITION|RETURN|ASSIGNMENT|LOOP|IMPORT|PRINT|CALL|EMPTY|CLASS|DECORATOR|EXCEPTION|OTHER",
    "code": "the exact code on that line",
    "title": "Short title like 'Function Definition' or 'Variable Assignment'",
    "description": "One-sentence explanation of what this line does",
    "details": {
      "key1": "value1"
    },
    "value_changes": [
      {"variable": "variable_name", "before": "undefined", "after": "new_value", "explanation": "Why this change happens"}
    ],
    "example_with_input": {
      "sample_input": "e.g. user enters 5",
      "execution": "What happens with that input",
      "result": "Resulting value"
    }
  }
]

Rules for the "type" field - pick the BEST match:
- COMMENT: lines starting with #
- FUNCTION: def statements
- CONDITION: if/elif/else statements
- RETURN: return statements
- ASSIGNMENT: variable assignments (x = ..., including augmented)
- LOOP: for/while statements
- IMPORT: import/from...import
- PRINT: print() calls
- CALL: other function calls as standalone statements
- EMPTY: blank lines
- CLASS: class definitions
- DECORATOR: @decorator lines
- EXCEPTION: try/except/finally/raise
- OTHER: anything else

For "details", include relevant key-value pairs.
For "value_changes", show ALL variables that change on this line with before/after values. Use example values (e.g. if input() is called, assume user enters "5" or "hello" etc.).
For "example_with_input", if the line involves input() or depends on user input, show a concrete example. If the line doesn't involve input, omit this field.

IMPORTANT: Trace through the code with a sample execution. If the code uses input(), pick realistic example values and show how variables change through the entire program with those values.

Be educational and beginner-friendly in descriptions. Respond with ONLY the JSON array.`,

  explain_error: `You are a Python debugging assistant. The user will provide Python code and an error message.

IMPORTANT: You MUST respond with ONLY a valid JSON object (no markdown, no code fences, no extra text):

{
  "error_type": "e.g. SyntaxError, TypeError, IndexError",
  "error_icon": "🐛",
  "title": "Short human-readable title of the error",
  "summary": "A clear 1-2 sentence beginner-friendly explanation of what went wrong",
  "cause": {
    "line": <line_number or null>,
    "code": "the problematic code snippet",
    "explanation": "Why this specific code causes the error"
  },
  "fix": {
    "description": "What needs to change and why",
    "corrected_code": "The full corrected Python code",
    "changes": [
      {"line": <line_number>, "before": "old code", "after": "new code", "reason": "Why this change fixes it"}
    ]
  },
  "prevention_tips": [
    {"tip": "Short tip title", "icon": "💡", "description": "How to avoid this error in the future"}
  ]
}

Be educational, encouraging, and beginner-friendly. Respond with ONLY the JSON object.`,

  chat: `You are a friendly Python tutor chatbot. The user is working on Python code and may ask questions about it.

IMPORTANT: You MUST respond with ONLY a valid JSON object (no markdown, no code fences, no extra text):

{
  "answer": "The main answer to the user's question in clear, beginner-friendly language",
  "sections": [
    {
      "title": "Section heading",
      "icon": "💡",
      "content": "Detailed explanation for this section",
      "code_example": "optional Python code example",
      "type": "CONCEPT|EXAMPLE|TIP|WARNING|FIX"
    }
  ],
  "key_takeaway": "One-sentence summary of the most important thing to remember"
}

For "sections", break your answer into logical parts. Use these types:
- CONCEPT: explaining a Python concept
- EXAMPLE: showing code examples
- TIP: best practices or helpful hints  
- WARNING: common mistakes or gotchas
- FIX: debugging help or code corrections

Include relevant code_example fields when showing code snippets. Be educational, encouraging, and reference the user's code when relevant.
Respond with ONLY the JSON object.`,

  explain_output: `You are a Python teaching assistant. The user will provide Python code and its output. Explain WHY that specific output was produced by tracing execution step by step.

IMPORTANT: You MUST respond with ONLY a valid JSON object (no markdown, no code fences, no extra text):

{
  "summary": "A clear 1-2 sentence summary of what the program did and what output it produced",
  "execution_flow": [
    {
      "step": 1,
      "line": 1,
      "code": "the exact code on that line",
      "action": "What happens at this step",
      "variables_state": {"var_name": "current_value"},
      "output_produced": "any print output from this step, or null",
      "flow_type": "SEQUENTIAL|BRANCH_TRUE|BRANCH_FALSE|LOOP_START|LOOP_ITERATION|LOOP_END|FUNCTION_CALL|FUNCTION_RETURN|INPUT|OUTPUT"
    }
  ],
  "output_breakdown": [
    {
      "output_line": "The exact output text",
      "produced_by_line": 1,
      "explanation": "Why this specific text was printed"
    }
  ],
  "key_insight": "One important takeaway about the execution flow"
}

CRITICAL: Do NOT skip any line. You MUST include EVERY single line of the code in the execution_flow, including comments, blank lines, function definitions, variable assignments, and lines that don't produce output. Every line number from 1 to the last line must appear at least once. For lines inside loops, show each iteration separately. For conditional branches, show which branch was taken AND mention the skipped branch. Show function calls jumping into the function body. Be educational and beginner-friendly. Respond with ONLY the JSON object.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const jsonResp = (status: number, body: Record<string, unknown>) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  // Public endpoint: no auth required (verify_jwt = false in config.toml).

  try {
    let payload: any;
    try {
      payload = await req.json();
    } catch {
      return jsonResp(400, { error: "Invalid JSON body" });
    }
    const { type, code, lineNumber, error: userError, messages, output: codeOutput } = payload ?? {};

    // --- Input validation ---
    if (typeof type !== "string" || !VALID_TYPES.has(type)) {
      return jsonResp(400, { error: "Invalid type" });
    }
    if (code !== undefined && (typeof code !== "string" || code.length > MAX_CODE_LEN)) {
      return jsonResp(400, { error: "Code missing or too large" });
    }
    if (userError !== undefined && (typeof userError !== "string" || userError.length > MAX_ERROR_LEN)) {
      return jsonResp(400, { error: "Error text too large" });
    }
    if (codeOutput !== undefined && (typeof codeOutput !== "string" || codeOutput.length > MAX_OUTPUT_LEN)) {
      return jsonResp(400, { error: "Output too large" });
    }
    if (type === "explain_line") {
      if (!Number.isInteger(lineNumber) || lineNumber < 1 || lineNumber > 100_000) {
        return jsonResp(400, { error: "Invalid lineNumber" });
      }
    }
    let safeMessages: Array<{ role: string; content: string }> = [];
    if (messages !== undefined) {
      if (!Array.isArray(messages) || messages.length > MAX_MSG_COUNT) {
        return jsonResp(400, { error: "Too many messages" });
      }
      for (const m of messages) {
        if (
          !m || typeof m !== "object" ||
          (m.role !== "user" && m.role !== "assistant" && m.role !== "system") ||
          typeof m.content !== "string" || m.content.length > MAX_MSG_LEN
        ) {
          return jsonResp(400, { error: "Invalid message" });
        }
        safeMessages.push({ role: m.role, content: m.content });
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("python-ai config error: LOVABLE_API_KEY missing");
      return jsonResp(503, { error: "Service unavailable" });
    }

    const systemPrompt = SYSTEM_PROMPTS[type];

    let userMessages: Array<{ role: string; content: string }> = [];

    if (type === "explain") {
      userMessages = [{ role: "user", content: `Here's the Python code:\n\`\`\`python\n${code}\n\`\`\`` }];
    } else if (type === "explain_line") {
      userMessages = [
        {
          role: "user",
          content: `Here's the Python code:\n\`\`\`python\n${code}\n\`\`\`\n\nPlease explain line ${lineNumber}.`,
        },
      ];
    } else if (type === "explain_all_lines") {
      userMessages = [
        {
          role: "user",
          content: `Here's the Python code:\n\`\`\`python\n${code}\n\`\`\`\n\nPlease explain every single line.`,
        },
      ];
    } else if (type === "explain_error") {
      userMessages = [
        {
          role: "user",
          content: `Here's the Python code:\n\`\`\`python\n${code}\n\`\`\`\n\nI got this error:\n\`\`\`\n${userError}\n\`\`\`\n\nPlease explain the error and how to fix it.`,
        },
      ];
    } else if (type === "explain_output") {
      userMessages = [
        {
          role: "user",
          content: `Here's the Python code:\n\`\`\`python\n${code}\n\`\`\`\n\nHere is the output it produced:\n\`\`\`\n${codeOutput || ""}\n\`\`\`\n\nPlease explain step-by-step why this output was produced, tracing through the execution flow.`,
        },
      ];
    } else if (type === "chat") {
      userMessages = [
        {
          role: "system",
          content: `The user is working on this Python code:\n\`\`\`python\n${code}\n\`\`\``,
        },
        ...safeMessages,
      ];
    }

    // Try a sequence of models so transient 503/overload on one model
    // automatically falls back to the next.
    const MODEL_CHAIN = [
      "google/gemini-3.5-flash",
      "google/gemini-3.1-flash-lite",
    ];
    let response: Response | null = null;
    let lastStatus = 0;
    let lastBody = "";
    for (const model of MODEL_CHAIN) {
      const r = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "Lovable-API-Key": LOVABLE_API_KEY,
            "X-Lovable-AIG-SDK": "fetch",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "system", content: systemPrompt }, ...userMessages],
            stream: true,
          }),
        },
      );
      if (r.ok) {
        response = r;
        break;
      }
      lastStatus = r.status;
      lastBody = await r.text().catch(() => "");
      console.warn(`Model ${model} returned ${r.status}; trying next.`);
      // Only fall through on overload/rate-limit style failures.
      if (r.status !== 503 && r.status !== 429 && r.status !== 500) {
        break;
      }
    }

    if (!response) {
      console.error("AI gateway error after fallback chain:", lastStatus, lastBody);
      if (lastStatus === 429) {
        return jsonResp(429, { error: "Rate limit exceeded. Please try again later." });
      }
      if (lastStatus === 402) {
        return jsonResp(402, { error: "AI credits exhausted. Please add credits." });
      }
      if (lastStatus === 503) {
        return jsonResp(503, { error: "All AI models are overloaded right now. Please try again in a moment." });
      }
      return jsonResp(502, { error: "AI service unavailable" });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("python-ai error:", e); // server-side only
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
