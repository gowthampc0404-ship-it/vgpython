import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RECIPIENT = "gowthamoffical2009@gmail.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { anon_id, message } = await req.json();
    const cleanId = typeof anon_id === "string" ? anon_id.trim().slice(0, 64) : "";
    const cleanMsg = typeof message === "string" ? message.trim() : "";

    if (!cleanId || !cleanMsg) {
      return new Response(JSON.stringify({ error: "anon_id and message are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (cleanMsg.length > 5000) {
      return new Response(JSON.stringify({ error: "message too long (max 5000)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error: dbError } = await supabase
      .from("feedback")
      .insert({ anon_id: cleanId, message: cleanMsg });

    if (dbError) {
      console.error("DB insert failed:", dbError);
      return new Response(JSON.stringify({ error: "Failed to save feedback" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Optional email delivery — only if a Resend key is configured.
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    let emailed = false;
    if (RESEND_API_KEY) {
      try {
        const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "PyLearn Feedback <onboarding@resend.dev>",
            to: [RECIPIENT],
            subject: `New feedback from ${cleanId}`,
            text: `From: ${cleanId}\n\n${cleanMsg}`,
            html: `<p><strong>From:</strong> ${cleanId}</p><pre style="white-space:pre-wrap;font-family:inherit">${
              cleanMsg.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!))
            }</pre>`,
          }),
        });
        emailed = r.ok;
        if (!r.ok) console.warn("Resend send failed:", r.status, await r.text());
      } catch (e) {
        console.warn("Resend send error:", e);
      }
    }

    return new Response(JSON.stringify({ ok: true, emailed, recipient: RECIPIENT }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-feedback error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});