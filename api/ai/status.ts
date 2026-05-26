const FREE_MODELS = [
  { value: "deepseek/deepseek-v4-flash:free", label: "DeepSeek V4 Flash — Free (recommended)" },
  { value: "openai/gpt-oss-20b:free", label: "OpenAI GPT-OSS 20B — Free" },
  { value: "openai/gpt-oss-120b:free", label: "OpenAI GPT-OSS 120B — Free (slowest)" },
];

export default function handler(_req: any, res: any) {
  res.json({
    configured: Boolean(process.env.OPENROUTER_API_KEY),
    freeModels: FREE_MODELS,
    defaultModel: "deepseek/deepseek-v4-flash:free",
  });
}
