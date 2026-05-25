import { Router, type IRouter } from "express";

const router: IRouter = Router();

export const FREE_MODELS = [
  { value: "deepseek/deepseek-v4-flash:free",  label: "DeepSeek V4 Flash — Free (recommended)" },
  { value: "openai/gpt-oss-20b:free",          label: "OpenAI GPT-OSS 20B — Free" },
  { value: "openai/gpt-oss-120b:free",         label: "OpenAI GPT-OSS 120B — Free (slowest)" },
];

const DEFAULT_MODEL = "deepseek/deepseek-v4-flash:free";

router.get("/status", (_req, res) => {
  res.json({
    configured: Boolean(process.env.OPENROUTER_API_KEY),
    freeModels: FREE_MODELS,
    defaultModel: DEFAULT_MODEL,
  });
});

router.post("/chat", async (req, res) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "AI service not configured on this server." });
    return;
  }

  const { messages, model, max_tokens, temperature } = req.body as {
    messages: { role: string; content: string }[];
    model?: string;
    max_tokens?: number;
    temperature?: number;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages array is required." });
    return;
  }

  const selectedModel = model || DEFAULT_MODEL;
  const referer = (process.env.REPLIT_DOMAINS || "").split(",")[0]
    ? `https://${(process.env.REPLIT_DOMAINS || "").split(",")[0]}`
    : "https://bullenhaus.app";

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
      const msg = (err as { error?: { message?: string } })?.error?.message
        || `OpenRouter error ${upstream.status}`;
      res.status(502).json({ error: msg });
      return;
    }

    const data = await upstream.json() as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = data.choices?.[0]?.message?.content ?? "Sorry, no response generated.";
    res.json({ reply });
  } catch (err: unknown) {
    req.log.error({ err }, "AI proxy error");
    const msg = err instanceof Error ? err.message : "AI service error.";
    res.status(502).json({ error: msg });
  }
});

export default router;
