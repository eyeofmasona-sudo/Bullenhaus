import { getAdminClient, requireCrmStaff } from "../../../../_lib/supabase.js";

const BUCKET = "client-files";

export default async function handler(req: any, res: any) {
  const { id: clientId, fileId } = req.query as { id: string; fileId: string };

  // ── DELETE: remove the file from storage and drop the metadata row
  if (req.method === "DELETE") {
    const caller = await requireCrmStaff(req, res);
    if (!caller) return;

    const supabase = getAdminClient();

    const { data: row, error: findErr } = await supabase
      .from("client_files")
      .select("id, storage_path")
      .eq("id", fileId)
      .eq("client_id", clientId)
      .single();

    if (findErr || !row) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const { error: storageErr } = await supabase.storage
      .from(BUCKET)
      .remove([row.storage_path]);
    if (storageErr) {
      res.status(500).json({ error: storageErr.message });
      return;
    }

    const { error: dbErr } = await supabase
      .from("client_files")
      .delete()
      .eq("id", fileId);
    if (dbErr) {
      res.status(500).json({ error: dbErr.message });
      return;
    }

    res.json({ deleted: true });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
