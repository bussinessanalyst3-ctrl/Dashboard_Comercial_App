import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile, UserRole } from '../types/commercial';

const STORAGE_URL_KEY = 'dashboard_comercial_supabase_url';
const STORAGE_KEY_KEY = 'dashboard_comercial_supabase_anon_key';

let cachedClient: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

export function cleanSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  // Strip trailing /rest/v1 or /rest/v1/
  url = url.replace(/\/rest\/v1\/?$/, '');
  // Strip any trailing slashes
  url = url.replace(/\/+$/, '');
  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  return url;
}

export function getStoredSupabaseConfig(): { url: string; anonKey: string } {
  const envUrl = cleanSupabaseUrl((import.meta.env.VITE_SUPABASE_URL as string) || '');
  const envKey = ((import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '').trim();

  const storedUrl = typeof window !== 'undefined' ? cleanSupabaseUrl(localStorage.getItem(STORAGE_URL_KEY) || '') : '';
  const storedKey = typeof window !== 'undefined' ? (localStorage.getItem(STORAGE_KEY_KEY) || '').trim() : '';

  return {
    url: storedUrl || envUrl,
    anonKey: storedKey || envKey
  };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  const cleanedUrl = cleanSupabaseUrl(url);
  const cleanedKey = anonKey.trim();
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_URL_KEY, cleanedUrl);
    localStorage.setItem(STORAGE_KEY_KEY, cleanedKey);
  }
  cachedClient = null; // reset client
}

export function clearSupabaseConfig(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_URL_KEY);
    localStorage.removeItem(STORAGE_KEY_KEY);
  }
  cachedClient = null;
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getStoredSupabaseConfig();
  if (!url || !anonKey) return null;

  if (cachedClient && url === lastUrl && anonKey === lastKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
    lastUrl = url;
    lastKey = anonKey;
    return cachedClient;
  } catch (err) {
    console.warn('Error inicializando Supabase client:', err);
    return null;
  }
}

export interface SupabaseHealthCheck {
  connected: boolean;
  message: string;
  tablesFound?: {
    ventas: boolean;
    objetivos: boolean;
    cobertura: boolean;
    batches: boolean;
    auditLogs: boolean;
    profiles: boolean;
  };
}

export function isTableMissingError(error: any): boolean {
  if (!error) return false;
  const code = String(error.code || '').toUpperCase();
  const msg = String(error.message || '').toLowerCase();
  return (
    code === '42P01' ||
    code.startsWith('PGRST20') ||
    code === 'PGRST116' ||
    msg.includes('could not find the table') ||
    msg.includes('schema cache') ||
    msg.includes('relation') ||
    msg.includes('does not exist')
  );
}

export function isTablePresent(res: { data: any; error: any }): boolean {
  if (!res.error) return true;
  if (isTableMissingError(res.error)) return false;
  // If error is permission or RLS (e.g. 42501 or permission denied), the table exists in PostgreSQL
  return true;
}

export async function checkTableExists(client: SupabaseClient, candidateNames: string[]): Promise<string | null> {
  for (const name of candidateNames) {
    try {
      const res = await client.from(name).select('id').limit(1);
      if (isTablePresent(res)) {
        return name;
      }
    } catch {
      continue;
    }
  }
  return null;
}

export async function testSupabaseConnection(): Promise<SupabaseHealthCheck> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      connected: false,
      message: 'Supabase no está configurado. Ingrese la URL del proyecto y la Anon Key.'
    };
  }

  try {
    const vTable = await checkTableExists(client, ['comercial_ventas', 'com_ventas', 'ventas']);
    const oTable = await checkTableExists(client, ['comercial_objetivos', 'com_objetivos', 'objetivos']);
    const cTable = await checkTableExists(client, ['comercial_cobertura', 'com_cobertura', 'cobertura']);
    const bTable = await checkTableExists(client, ['import_batches', 'com_import_batches', 'batches']);
    const aTable = await checkTableExists(client, ['import_audit_logs', 'com_audit_logs', 'audit_logs']);
    const pTable = await checkTableExists(client, ['user_profiles', 'profiles']);

    const tablesFound = {
      ventas: vTable !== null,
      objetivos: oTable !== null,
      cobertura: cTable !== null,
      batches: bTable !== null,
      auditLogs: aTable !== null,
      profiles: pTable !== null
    };

    const hasTables = tablesFound.ventas && tablesFound.objetivos;

    return {
      connected: true,
      message: hasTables
        ? `Conexión exitosa a Supabase PostgreSQL. Tablas activas: ${vTable}, ${oTable}, ${cTable || 'cobertura'}.`
        : 'Conexión a Supabase exitosa, pero las tablas comerciales aún no han sido creadas en PostgreSQL. Copie y ejecute el script SQL.',
      tablesFound
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      message: `Fallo de conexión a Supabase: ${errorMsg}`
    };
  }
}

/**
 * Mock/Local User State Manager with real Supabase Auth fallback
 */
export const LOCAL_USERS: UserProfile[] = [
  {
    id: 'usr_admin_master',
    email: 'bussinessanalyst3@gmail.com',
    full_name: 'Administrador Principal',
    role: 'admin'
  }
];
