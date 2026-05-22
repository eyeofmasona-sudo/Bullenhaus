/**
 * authClient.ts — Supabase Auth wrapper
 *
 * Provides a unified auth API backed by Supabase Auth.
 * Session is managed entirely by @supabase/supabase-js:
 *   - access token auto-refreshed via PKCE / refresh token rotation
 *   - session persisted to localStorage by the Supabase client
 *   - no manual JWT storage or custom refresh logic needed
 *
 * 2FA/MFA: not implemented — mark as TODO when Supabase MFA is enabled.
 */

import { createClient, type SupabaseClient, type Session } from '@supabase/supabase-js';

// ── Supabase client ───────────────────────────────────────────────────────────

const SUPABASE_URL =
  (import.meta as any).env?.VITE_SUPABASE_URL as string || '';
const SUPABASE_ANON_KEY =
  ((import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY as string) ||
  ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) ||
  '';

let _supabase: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(SUPABASE_URL || 'http://localhost:54321', SUPABASE_ANON_KEY || 'placeholder', {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }
  return _supabase;
}

// -------------------------------------------------------
// Fetch wrapper (adds Authorization header automatically)
// -------------------------------------------------------

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = tokenStore.get();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(path, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message || res.statusText);
  }
  return res.json() as Promise<T>;
}

export const tokenStore = {
  /** Returns the current access token from the active Supabase session, or null. */
  get: (): string | null => {
    // Supabase stores the session in localStorage internally; this is just a
    // synchronous peek. Use getSession() for the authoritative value.
    const raw = localStorage.getItem(`sb-${new URL(SUPABASE_URL || 'http://x').hostname}-auth-token`);
    try {
      return raw ? JSON.parse(raw)?.access_token ?? null : null;
    } catch {
      return null;
    }
  },
  /** No-op — Supabase owns the token lifecycle. */
  set: (_token: string): void => {},
  /** No-op — call logout() to invalidate the session. */
  clear: (): void => {},
};

// ── Auth methods ──────────────────────────────────────────────────────────────

import type { LoginRequest, LoginResult } from '../../types/auth.types.js';

/**
 * Login with email + password via Supabase Auth.
 * Returns a LoginResponse on success.
 * Throws ApiError on failure.
 */
export async function login(credentials: LoginRequest): Promise<LoginResult> {
  const { data, error } = await getClient().auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) throw new ApiError(401, error.message);
  if (!data.session) throw new ApiError(401, 'Login failed — no session returned');

  return {
    accessToken: data.session.access_token,
    user: {
      id:        data.user.id,
      email:     data.user.email ?? credentials.email,
      firstName: (data.user.user_metadata?.full_name as string || '').split(' ')[0] || '',
      lastName:  (data.user.user_metadata?.full_name as string || '').split(' ').slice(1).join(' ') || '',
      systemRole: 'TRADER',
      domain: 'TRADING',
    },
    permissions: [],
  };
}

/**
 * Register with email + password via Supabase Auth.
 */
export async function register(email: string, password: string, fullName?: string): Promise<void> {
  const { error } = await getClient().auth.signUp({
    email,
    password,
    options: {
      data: fullName ? { full_name: fullName } : {},
      emailRedirectTo: `${window.location.origin}/trade/dashboard`,
    },
  });
  if (error) throw new ApiError(400, error.message);
}

/**
 * MFA verification — not yet implemented.
 * Enable Supabase MFA (TOTP) in the Supabase dashboard to use this.
 */
export async function verifyMfa(_payload: import('../../types/auth.types.js').MfaVerifyRequest): Promise<never> {
  throw new ApiError(501, 'MFA is not yet configured. Enable Supabase MFA in the dashboard.');
}

/**
 * Get the current Supabase session (auto-refreshed).
 * Returns null if the user is not logged in.
 */
export async function getSession(): Promise<Session | null> {
  const { data } = await getClient().auth.getSession();
  return data.session;
}

/**
 * Refresh the session. Supabase handles this automatically; call only if
 * you need to force a refresh ahead of schedule.
 */
export async function refreshAccessToken(): Promise<string | null> {
  const { data, error } = await getClient().auth.refreshSession();
  if (error || !data.session) return null;
  return data.session.access_token;
}

/**
 * Send a password-reset email.
 */
export async function sendPasswordResetEmail(email: string): Promise<void> {
  const { error } = await getClient().auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw new ApiError(400, error.message);
}

/**
 * Update the user's password (call after following the reset link).
 */
export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await getClient().auth.updateUser({ password: newPassword });
  if (error) throw new ApiError(400, error.message);
}

/**
 * Sign out the current device.
 */
export async function logout(): Promise<void> {
  await getClient().auth.signOut();
}

/**
 * Sign out all devices (revokes all sessions).
 */
export async function logoutAll(): Promise<void> {
  await getClient().auth.signOut({ scope: 'global' });
}

/**
 * Subscribe to session changes.
 * Returns the unsubscribe function.
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
): () => void {
  const { data: { subscription } } = getClient().auth.onAuthStateChange(callback);
  return () => subscription.unsubscribe();
}

// ── Error class ───────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isUnauthorized(): boolean { return this.status === 401; }
  get isForbidden(): boolean    { return this.status === 403; }
  get isNotFound(): boolean     { return this.status === 404; }
  get isNotImplemented(): boolean { return this.status === 501; }
}
