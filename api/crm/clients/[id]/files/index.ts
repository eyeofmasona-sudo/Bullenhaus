import { getAdminClient, requireCrmStaff } from "../../../../_lib/supabase.js";

// Server-side validation — mirrors the bucket-level limits in migration 08
// and the client-side checks in the CRM UI.
const BUCKET = "client-files";
const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
const ALLOWED_MIME = new Set<string>([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export default async function handler(req: any, res: any) {
  const { id: clientId } = req.query as { id: string };

  // ── GET: list files attached to the client (with short-lived signed URLs)
  if (req.method === "GET") {
    const caller = await requireCrmStaff(req, res);
    if (!caller) return;

    const supabase = getAdminClient();
    const { data: rows, error } = await supabase
      .from("client_files")
      .select("id, client_id, file_name, storage_path, content_type, size_bytes, uploaded_by, created_at")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const files = await Promise.all(
      (rows || []).map(async (row: any) => {
        const { data: signed } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(row.storage_path, 3600);
        return { ...row, signed_url: signed?.signedUrl ?? null };
      }),
    );

    res.json({ files });
    return;
  }

  // ── POST: register metadata for a file already uploaded to storage
  if (req.method === "POST") {
    const caller = await requireCrmStaff(req, res);
    if (!caller) return;

    const { file_name, storage_path, content_type, size_bytes } = req.body ?? {};

    if (!file_name || !storage_path) {
      res.status(400).json({ error: "file_name and storage_path are required" });
      return;
    }
    // The object must live inside this client's folder: "{clientId}/...".
    if (typeof storage_path !== "string" || !storage_path.startsWith(`${clientId}/`)) {
      res.status(400).json({ error: "storage_path must be scoped to the client folder" });
      return;
    }
    if (content_type && !ALLOWED_MIME.has(content_type)) {
      res.status(400).json({ error: `Unsupported file type: ${content_type}` });
      return;
    }
    if (typeof size_bytes === "number" && size_bytes > MAX_SIZE_BYTES) {
      res.status(400).json({ error: "File exceeds the 15 MB limit" });
      return;
    }

    const supabase = getAdminClient();

    // Ensure the target is actually a client, not a staff user.
    const { data: target } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", clientId)
      .single();
    if (!target || target.role !== "client") {
      res.status(404).json({ error: "Client not found" });
      return;
    }

    const { data: inserted, error } = await supabase
      .from("client_files")
      .insert({
        client_id: clientId,
        file_name,
        storage_path,
        content_type: content_type ?? null,
        size_bytes: typeof size_bytes === "number" ? size_bytes : null,
        uploaded_by: caller.id,
      })
      .select("id, client_id, file_name, storage_path, content_type, size_bytes, uploaded_by, created_at")
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(201).json({ file: inserted });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
