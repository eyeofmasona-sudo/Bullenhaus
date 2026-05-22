// ============================================================================
// CRM auth — Supabase-native implementation
// Replaces the old Express /api/v1/auth/* calls.
// Public API is kept identical so existing CRM code needs no changes.
// ============================================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  (import.meta as any).env?.VITE_SUPABASE_URL as string || '';
const supabaseKey =
  ((import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY as string) ||
  ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) ||
  '';

const supabase = createClient(
  supabaseUrl || 'http://localhost:54321',
  supabaseKey || 'placeholder'
);

// ── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

// ── localStorage keys (same as before — keeps Layout / AuthGuard compat) ────

const KEYS = {
  role:         'aura_role',
  token:        'accessToken',
  refreshToken: 'aura_refresh',
  user:         'aura_user',
} as const;

export const authStorage = {
  getRole:         (): string | null => localStorage.getItem(KEYS.role),
  setRole:         (r: string)       => localStorage.setItem(KEYS.role, r),

  getToken:        (): string | null => localStorage.getItem(KEYS.token),
  setToken:        (t: string)       => localStorage.setItem(KEYS.token, t),

  getRefreshToken: (): string | null => localStorage.getItem(KEYS.refreshToken),
  setRefreshToken: (t: string)       => localStorage.setItem(KEYS.refreshToken, t),

  getUser: (): AuthUser | null => {
    try { return JSON.parse(localStorage.getItem(KEYS.user) || 'null'); }
    catch { return null; }
  },
  setUser: (u: AuthUser) => localStorage.setItem(KEYS.user, JSON.stringify(u)),

  clear: () => Object.values(KEYS).forEach(k => localStorage.removeItem(k)),
};

// ── Real API login ───────────────────────────────────────────────────────────
import { safeLegacyApiFetch } from "../../../lib/backendMigration";

export async function apiLogin(email: string, password: string): Promise<AuthUser> {
  const res = await safeLegacyApiFetch("/api/v1/auth/login", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || "Login failed");
  }

// ── Login ────────────────────────────────────────────────────────────────────

export async function apiLogin(email: string, password: string): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  if (!data.user || !data.session) throw new Error('Login failed — no session returned');

  // Fetch role from `users` table; fall back to user_metadata
  let role = 'agent';
  try {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single();
    if (profile?.role) role = mapRole(profile.role as string);
  } catch {
    role = mapRole(data.user.user_metadata?.role as string | undefined);
  }

  const nameParts = (data.user.user_metadata?.full_name as string || '').split(' ');
  const user: AuthUser = {
    id:        data.user.id,
    email:     data.user.email || email,
    firstName: nameParts[0] || '',
    lastName:  nameParts.slice(1).join(' ') || '',
    roles:     [role],
  };

  authStorage.setToken(data.session.access_token);
  authStorage.setRefreshToken(data.session.refresh_token || '');
  authStorage.setUser(user);
  authStorage.setRole(role);

  return user;
}

// ── Refresh ──────────────────────────────────────────────────────────────────

  try {
    const res = await safeLegacyApiFetch("/api/v1/auth/refresh", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const { accessToken } = await res.json();
    authStorage.setToken(accessToken);
    return accessToken;
  } catch {
    return null;
  }
  const token = data.session.access_token;
  authStorage.setToken(token);
  return token;
}

// ── Authenticated fetch (passes Supabase session token) ──────────────────────
// NOTE: The target API endpoints (/api/v1/*) require a backend.
// Until Supabase Edge Functions or RPC is set up, these calls will fail
// and the hooks will display graceful empty states.

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // Always prefer the live Supabase session token
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || authStorage.getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let res = await safeLegacyApiFetch(url, { ...options, headers });

  // Auto-refresh on 401
  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await safeLegacyApiFetch(url, { ...options, headers: { ...headers, Authorization: `Bearer ${newToken}` } });
    }
  }

  return res;
}

// ── Logout ───────────────────────────────────────────────────────────────────

export async function apiLogout(): Promise<void> {
  const refreshToken = authStorage.getRefreshToken();
  if (refreshToken) {
    await safeLegacyApiFetch("/api/v1/auth/logout", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ refreshToken }),
    }).catch(() => {});
  }
  authStorage.clear();
  await supabase.auth.signOut().catch(() => {});
}
