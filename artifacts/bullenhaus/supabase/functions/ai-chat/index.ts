import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const JSON_HEADERS = { ...CORS, "Content-Type": "application/json" };

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Only free OpenRouter models offered in the UI are allowed through the proxy.
const ALLOWED_MODELS = [
  "deepseek/deepseek-v4-flash:free",
  "openai/gpt-oss-20b:free",
  "openai/gpt-oss-120b:free",
  "meta-llama/llama-3.1-8b-instruct:free",
];

function jsonError(msg: string, status: number): Response {
  return new Response(JSON.stringify({ error: msg }), { status, headers: JSON_HEADERS });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return jsonError("Method not allowed — use POST", 405);

  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) return jsonError("AI service not configured", 503);

  // Require a logged-in user — blocks anonymous abuse of the OpenRouter key.
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return jsonError("Unauthorized", 401);
  const token = authHeader.slice(7);

  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );
  const { data: { user }, error: authErr } = await anonClient.auth.getUser();
  if (authErr || !user) return jsonError("Unauthorized — login required", 401);

  let body: {
    model?: string;
    messages?: unknown;
    max_tokens?: number;
    temperature?: number;
  };
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const model = typeof body.model === "string" ? body.model : "deepseek/deepseek-v4-flash:free";
  if (!ALLOWED_MODELS.includes(model)) {
    return jsonError(`Model not allowed: ${model}`, 400);
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return jsonError("messages array required", 400);
  }

  try {
    const orRes = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: body.messages,
        max_tokens: Math.min(typeof body.max_tokens === "number" ? body.max_tokens : 600, 2000),
        temperature: typeof body.temperature === "number" ? body.temperature : 0.2,
      }),
    });

    if (!orRes.ok) {
      const errText = await orRes.text().catch(() => "");
      console.error("[ai-chat] OpenRouter error:", orRes.status, errText);
      return jsonError(`AI provider error ${orRes.status}`, 502);
    }

    const data = await orRes.json();
    const reply = data?.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ reply }), { headers: JSON_HEADERS });
  } catch (err) {
    console.error("[ai-chat] proxy failure:", err);
    return jsonError("Failed to reach AI provider", 502);
  }
});
