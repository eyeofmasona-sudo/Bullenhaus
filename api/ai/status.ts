const PRIMARY_MODEL = process.env.AI_PRIMARY_MODEL || "deepseek/deepseek-chat";
const FALLBACK_MODEL = process.env.AI_FALLBACK_MODEL || "openai/gpt-4o-mini";

export default function handler(_req: any, res: any) {
  res.json({
    configured: Boolean(process.env.OPENROUTER_API_KEY),
    enabled: process.env.AI_OPENROUTER_ENABLED !== "false",
    provider: "openrouter",
    primaryModel: PRIMARY_MODEL,
    fallbackModel: FALLBACK_MODEL,
    routing: {
      allowFallbacks: process.env.AI_OPENROUTER_ALLOW_FALLBACKS !== "false",
      sort: process.env.AI_OPENROUTER_SORT || "price",
      dataCollection: process.env.AI_OPENROUTER_DATA_COLLECTION || "deny",
      zdr: process.env.AI_OPENROUTER_ZDR === "true",
    },
    profiles: {
      "bullenhouse-livechat": { temperature: 0.2, maxTokens: 700 },
      "bullenhouse-crm": { temperature: 0.15, maxTokens: 1000 },
    },
  });
}
