import { getAdminClient, requireCrmAdmin } from "../../../../_lib/supabase.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "DELETE") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const callerId = await requireCrmAdmin(req, res);
  if (!callerId) return;

  const { codeId } = req.query as { codeId: string };
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("referral_codes")
    .delete()
    .eq("id", codeId);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ deleted: true });
}
