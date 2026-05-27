const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const JSON_HEADERS = { ...CORS, "Content-Type": "application/json" };

// Reports whether the AI backend has an OpenRouter key configured.
// No sensitive data is returned — only a boolean.
Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const configured = !!Deno.env.get("OPENROUTER_API_KEY");
  return new Response(JSON.stringify({ configured }), { headers: JSON_HEADERS });
});
