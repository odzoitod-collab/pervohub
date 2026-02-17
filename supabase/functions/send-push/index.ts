// Supabase Edge Function: відправка пуш-уведомлення одному користувачу через OneSignal.
// Потрібно: ONE_SIGNAL_REST_API_KEY у Secrets (Dashboard → Project Settings → Edge Functions → Secrets).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ONESIGNAL_APP_ID = "bde018e4-7715-4013-905b-f78ef5a62020";

interface ReqBody {
  user_id: string;
  title?: string;
  body?: string;
  url?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" } });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json" } });
  }

  const apiKey = Deno.env.get("ONE_SIGNAL_REST_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "ONE_SIGNAL_REST_API_KEY not set" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  let body: ReqBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  const { user_id, title = "PervozHub", body = "", url } = body;
  if (!user_id) {
    return new Response(JSON.stringify({ error: "user_id required" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: profile, error: dbError } = await supabase.from("profiles").select("onesignal_id").eq("id", user_id).single();
  if (dbError || !profile?.onesignal_id) {
    return new Response(JSON.stringify({ error: "User has no onesignal_id or not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
  }

  const payload: Record<string, unknown> = {
    app_id: ONESIGNAL_APP_ID,
    include_subscription_ids: [profile.onesignal_id],
    target_channel: "push",
    contents: { en: body || title },
    headings: body ? { en: title } : undefined,
  };
  if (url) payload.url = url;

  const res = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return new Response(JSON.stringify({ error: "OneSignal error", details: data }), { status: res.status, headers: { "Content-Type": "application/json" } });
  }
  return new Response(JSON.stringify({ success: true, id: data.id }), { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
});
