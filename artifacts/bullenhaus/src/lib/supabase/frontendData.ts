import { getSupabaseBrowserClient } from './browserClient';

export const SUPABASE_PENDING_MESSAGE = 'Данные пока недоступны: миграция схемы ещё не завершена.';

export function toUserMessage(error: unknown, fallback = SUPABASE_PENDING_MESSAGE): string {
  const code = (error as { code?: string } | null)?.code;
  if (code === '42P01') return 'Таблица ещё не создана. Модуль ожидает применение MVP schema.';
  if (code === '42501') return 'Недостаточно прав для чтения данных (RLS).';
  return fallback;
}

export async function fetchTable<T>(table: string, query: (q: any) => any): Promise<{ data: T[]; error: string | null }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { data: [], error: 'Supabase не настроен в окружении.' };

  const { data, error } = await query(client.from(table));
  if (error) return { data: [], error: toUserMessage(error) };
  return { data: (data as T[]) ?? [], error: null };
}
