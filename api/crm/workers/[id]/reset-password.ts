import { getAdminClient, requireAdmin } from "../../../_lib/supabase.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const callerId = await requireAdmin(req, res);
  if (!callerId) return;

  const { id } = req.query as { id: string };
  const { password } = req.body ?? {};

  if (!password || password.length < 8) {
    res.status(400).json({ error: "New password must be at least 8 characters" });
    return;
  }

  const supabase = getAdminClient();
  const { error } = await supabase.auth.admin.updateUserById(id, { password });
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ success: true });
}
