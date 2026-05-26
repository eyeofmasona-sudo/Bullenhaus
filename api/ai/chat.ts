export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "AI service not configured on this server." });
    return;
  }

  const { messages, model, max_tokens, temperature } = req.body ?? {};

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages array is required." });
    return;
  }

  const selectedModel = model || "deepseek/deepseek-v4-flash:free";
  const referer = "https://bullenhaus.app";

  try {
    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": referer,
        "X-Title": "Bullenhaus Platform",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages,
        max_tokens: max_tokens ?? 600,
        temperature: temperature ?? 0.3,
      }),
    });

    if (!upstream.ok) {
      const err = await upstream.json().catch(() => ({}));
      const msg = (err as any)?.error?.message || `OpenRouter error ${upstream.status}`;
      res.status(502).json({ error: msg });
      return;
    }

    const data = await upstream.json() as any;
    const reply = data.choices?.[0]?.message?.content ?? "Sorry, no response generated.";
    res.json({ reply });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "AI service error.";
    res.status(502).json({ error: msg });
  }
}
