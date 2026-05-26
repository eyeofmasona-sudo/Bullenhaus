import { getAdminClient, requireAdmin } from "../../../_lib/supabase.js";

const CRM_ROLES = ["agent", "manager", "director", "admin"] as const;
type CrmRole = (typeof CRM_ROLES)[number];

export default async function handler(req: any, res: any) {
  const { id } = req.query as { id: string };

  if (req.method === "PATCH") {
    const callerId = await requireAdmin(req, res);
    if (!callerId) return;

    const { role, full_name } = req.body ?? {};

    if (role && !CRM_ROLES.includes(role as CrmRole)) {
      res.status(400).json({ error: `role must be one of: ${CRM_ROLES.join(", ")}` });
      return;
    }

    const supabase = getAdminClient();
    const updates: Record<string, string> = {};
    if (role) updates["role"] = role;
    if (full_name !== undefined) {
      updates["full_name"] = full_name;
      updates["display_name"] = full_name;
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase.from("users").update(updates).eq("id", id);
      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }
    }

    if (role) {
      await supabase.auth.admin.updateUserById(id, { user_metadata: { role } });
    }

    res.json({ id, ...updates });
    return;
  }

  if (req.method === "DELETE") {
    const callerId = await requireAdmin(req, res);
    if (!callerId) return;

    if (id === callerId) {
      res.status(400).json({ error: "Cannot delete your own account" });
      return;
    }

    const supabase = getAdminClient();
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ deleted: true });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
