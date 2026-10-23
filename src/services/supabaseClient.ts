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

export async function testSupabaseConnection(): Promise<SupabaseHealthCheck> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      connected: false,
      message: 'Supabase no está configurado. Ingrese la URL del proyecto y la Anon Key.'
    };
  }

  try {
    // Attempt to query user_profiles or comercial_ventas
    const { error: vErr } = await client.from('comercial_ventas').select('id').limit(1);
    const { error: oErr } = await client.from('comercial_objetivos').select('id').limit(1);
    const { error: cErr } = await client.from('comercial_cobertura').select('id').limit(1);
    const { error: bErr } = await client.from('import_batches').select('id').limit(1);
    const { error: aErr } = await client.from('import_audit_logs').select('id').limit(1);
    const { error: pErr } = await client.from('user_profiles').select('id').limit(1);

    const tablesFound = {
      ventas: !vErr || vErr.code !== '42P01',
      objetivos: !oErr || oErr.code !== '42P01',
      cobertura: !cErr || cErr.code !== '42P01',
      batches: !bErr || bErr.code !== '42P01',
      auditLogs: !aErr || aErr.code !== '42P01',
      profiles: !pErr || pErr.code !== '42P01'
    };

    const hasTables = tablesFound.ventas && tablesFound.objetivos;

    return {
      connected: true,
      message: hasTables
        ? 'Conexión exitosa a Supabase PostgreSQL y tablas comerciales detectadas.'
        : 'Conexión a Supabase exitosa, pero las tablas comerciales aún no han sido creadas. Ejecute el script SQL.',
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
    id: 'usr_admin_1',
    email: 'admin@empresa.com.py',
    full_name: 'Director Comercial (Admin)',
    role: 'admin'
  },
  {
    id: 'usr_consulta_1',
    email: 'analista@empresa.com.py',
    full_name: 'Analista de Ventas (Consulta)',
    role: 'consulta'
  }
];
