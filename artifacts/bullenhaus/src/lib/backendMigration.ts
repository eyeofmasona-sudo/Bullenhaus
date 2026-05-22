export const BACKEND_MIGRATION_MESSAGE = 'Этот модуль временно недоступен: идёт миграция backend на Supabase Edge Functions.';

export const isLegacyApiRequest = (url: string) => url.startsWith('/api/');

export async function safeLegacyApiFetch(url: string, init?: RequestInit): Promise<Response> {
  if (!isLegacyApiRequest(url)) return fetch(url, init);

  try {
    return await fetch(url, init);
  } catch {
    return new Response(
      JSON.stringify({
        error: 'backend_migration_pending',
        message: BACKEND_MIGRATION_MESSAGE,
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function safeJson<T>(response: Response, fallback: T): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}
