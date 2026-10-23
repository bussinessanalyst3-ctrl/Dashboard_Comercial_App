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
    // Attempt to query with flexible table name detection (com_* or comercial_*)
    let vFound = false;
    const v1 = await client.from('comercial_ventas').select('id').limit(1);
    if (!v1.error || v1.error.code !== '42P01') {
      vFound = true;
    } else {
      const v2 = await client.from('com_ventas').select('id').limit(1);
      if (!v2.error || v2.error.code !== '42P01') vFound = true;
    }

    let oFound = false;
    const o1 = await client.from('comercial_objetivos').select('id').limit(1);
    if (!o1.error || o1.error.code !== '42P01') {
      oFound = true;
    } else {
      const o2 = await client.from('com_objetivos').select('id').limit(1);
      if (!o2.error || o2.error.code !== '42P01') oFound = true;
    }

    let cFound = false;
    const c1 = await client.from('comercial_cobertura').select('id').limit(1);
    if (!c1.error || c1.error.code !== '42P01') {
      cFound = true;
    } else {
      const c2 = await client.from('com_cobertura').select('id').limit(1);
      if (!c2.error || c2.error.code !== '42P01') cFound = true;
    }

    let bFound = false;
    const b1 = await client.from('import_batches').select('id').limit(1);
    if (!b1.error || b1.error.code !== '42P01') {
      bFound = true;
    } else {
      const b2 = await client.from('com_import_batches').select('id').limit(1);
      if (!b2.error || b2.error.code !== '42P01') bFound = true;
    }

    let aFound = false;
    const a1 = await client.from('import_audit_logs').select('id').limit(1);
    if (!a1.error || a1.error.code !== '42P01') {
      aFound = true;
    } else {
      const a2 = await client.from('com_audit_logs').select('id').limit(1);
      if (!a2.error || a2.error.code !== '42P01') aFound = true;
    }

    const { error: pErr } = await client.from('user_profiles').select('id').limit(1);

    const tablesFound = {
      ventas: vFound,
      objetivos: oFound,
      cobertura: cFound,
      batches: bFound,
      auditLogs: aFound,
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
    id: 'usr_admin_master',
    email: 'bussinessanalyst3@gmail.com',
    full_name: 'Administrador Principal',
    role: 'admin'
  }
];
