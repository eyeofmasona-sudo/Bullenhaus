import { createClient } from "@supabase/supabase-js";

export function getAdminClient() {
  const url = process.env["VITE_SUPABASE_URL"] || process.env["SUPABASE_URL"] || "";
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"] || "";
  if (!url || !key) throw new Error("Supabase admin credentials not configured");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function requireAdmin(req: any, res: any): Promise<string | null> {
  const auth = req.headers["authorization"] as string | undefined;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing authorization header" });
    return null;
  }
  const token = auth.slice(7);
  const supabase = getAdminClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ error: "Invalid token" });
    return null;
  }
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = profile?.role || user.user_metadata?.role;
  if (role !== "admin" && role !== "director") {
    res.status(403).json({ error: "Insufficient permissions" });
    return null;
  }
  return user.id;
}

export async function requireCrmAdmin(req: any, res: any): Promise<string | null> {
  const auth = req.headers["authorization"] as string | undefined;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing authorization header" });
    return null;
  }
  const token = auth.slice(7);
  const supabase = getAdminClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ error: "Invalid token" });
    return null;
  }
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = profile?.role || user.user_metadata?.role;
  if (!["admin", "director", "trade_admin"].includes(role)) {
    res.status(403).json({ error: "Insufficient permissions" });
    return null;
  }
  return user.id;
}

// Roles allowed to manage client file attachments.
// 'superadmin' is included for forward-compatibility only — it is not part
// of the users_role_check constraint yet, so such a row cannot exist.
export const CLIENT_FILE_ROLES = ["superadmin", "admin", "director", "manager"] as const;
type ClientFileRole = (typeof CLIENT_FILE_ROLES)[number];

// Authorizes the caller and returns { id, role } when the caller holds one of
// the CLIENT_FILE_ROLES. Otherwise writes a 401/403 response and returns null.
export async function requireCrmStaff(
  req: any,
  res: any,
): Promise<{ id: string; role: string } | null> {
  const auth = req.headers["authorization"] as string | undefined;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing authorization header" });
    return null;
  }
  const token = auth.slice(7);
  const supabase = getAdminClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ error: "Invalid token" });
    return null;
  }
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = (profile?.role || user.user_metadata?.role) as string | undefined;
  if (!role || !CLIENT_FILE_ROLES.includes(role as ClientFileRole)) {
    res.status(403).json({ error: "Insufficient permissions" });
    return null;
  }
  return { id: user.id, role };
}

// Roles allowed to manage client file attachments.
// 'superadmin' is included for forward-compatibility only — it is not part
// of the users_role_check constraint yet, so such a row cannot exist.
export const CLIENT_FILE_ROLES = ["superadmin", "admin", "director", "manager"] as const;
type ClientFileRole = (typeof CLIENT_FILE_ROLES)[number];

// Authorizes the caller and returns { id, role } when the caller holds one of
// the CLIENT_FILE_ROLES. Otherwise writes a 401/403 response and returns null.
export async function requireCrmStaff(
  req: any,
  res: any,
): Promise<{ id: string; role: string } | null> {
  const auth = req.headers["authorization"] as string | undefined;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing authorization header" });
    return null;
  }
  const token = auth.slice(7);
  const supabase = getAdminClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ error: "Invalid token" });
    return null;
  }
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = (profile?.role || user.user_metadata?.role) as string | undefined;
  if (!role || !CLIENT_FILE_ROLES.includes(role as ClientFileRole)) {
    res.status(403).json({ error: "Insufficient permissions" });
    return null;
  }
  return { id: user.id, role };
}
