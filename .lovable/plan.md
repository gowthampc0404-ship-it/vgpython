## Changes

### 1. Upgrade AI model
- In `supabase/functions/python-ai/index.ts`, replace `google/gemini-3-flash-preview` with `google/gemini-3.5-flash` (line 268).
- Redeploy the edge function so the new model takes effect.

### 2. "Last updated" bar under the logo
- Expose the build timestamp to the app via Vite's `define` in `vite.config.ts`:
  - Add `define: { __BUILD_TIME__: JSON.stringify(new Date().toISOString()) }`.
  - Declare the global in `src/vite-env.d.ts`.
- In `src/components/ide/Header.tsx`, render a small badge directly under the existing title block (logo area), showing the formatted build date + time, e.g. `Last updated: 5 Jun 2026, 14:32`.
  - Style: tiny muted text (`text-[10px] text-foreground/60 font-mono`), single line, with a small clock icon from `lucide-react`.
  - Format using `toLocaleString` with `{ dateStyle: 'medium', timeStyle: 'short' }`.

### Notes
- "Last update" reflects the moment the site was last built/published. Each new publish refreshes it automatically — no manual edits needed.
- Gemini 4 Flash isn't released; using Gemini 3.5 Flash as the newest stable Flash model.
