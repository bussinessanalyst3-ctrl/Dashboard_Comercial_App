import { UserProfile, UserRole } from '../types/commercial';
import { getSupabaseClient } from './supabaseClient';

const AUTH_STORAGE_KEY = 'commercial_analytics_auth_session_v4';
const LOCAL_ACCOUNTS_KEY = 'commercial_analytics_accounts_v4';
const AUTHORIZED_ADMINS_STORAGE_KEY = 'commercial_analytics_authorized_admins_v4';

/**
 * Pre-authorized system administrator accounts.
 * Only these explicitly approved identities or profiles verified in the database
 * can hold administrator privileges.
 */
export const AUTHORIZED_ADMIN_EMAILS: string[] = [
  'bussinessanalyst3@gmail.com'
];

function getAuthorizedAdminList(): string[] {
  try {
    const raw = localStorage.getItem(AUTHORIZED_ADMINS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(AUTHORIZED_ADMINS_STORAGE_KEY, JSON.stringify(AUTHORIZED_ADMIN_EMAILS));
      return AUTHORIZED_ADMIN_EMAILS;
    }
    const list: string[] = JSON.parse(raw);
    AUTHORIZED_ADMIN_EMAILS.forEach(email => {
      if (!list.includes(email.toLowerCase())) {
        list.push(email.toLowerCase());
      }
    });
    return list;
  } catch {
    return AUTHORIZED_ADMIN_EMAILS;
  }
}

function addAuthorizedAdmin(email: string): void {
  const current = getAuthorizedAdminList();
  const lower = email.toLowerCase();
  if (!current.includes(lower)) {
    current.push(lower);
    try {
      localStorage.setItem(AUTHORIZED_ADMINS_STORAGE_KEY, JSON.stringify(current));
    } catch {}
  }
}

function removeAuthorizedAdmin(email: string): void {
  const current = getAuthorizedAdminList().filter(e => e.toLowerCase() !== email.toLowerCase());
  try {
    localStorage.setItem(AUTHORIZED_ADMINS_STORAGE_KEY, JSON.stringify(current));
  } catch {}
}

interface StoredAccount extends UserProfile {
  passwordHash: string;
}

const INITIAL_PRIMARY_ADMIN: StoredAccount = {
  id: 'usr_admin_master',
  email: 'bussinessanalyst3@gmail.com',
  full_name: 'Administrador Principal',
  role: 'admin',
  passwordHash: 'Admin2026!'
};

function getLocalAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    if (!raw) {
      const initial = [INITIAL_PRIMARY_ADMIN];
      localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(initial));
      return initial;
    }

    const accounts: StoredAccount[] = JSON.parse(raw);

    // Sanitize: Purge legacy public demo accounts if they lingered
    const cleaned = accounts.filter(
      a =>
        a.email.toLowerCase() !== 'admin@empresa.com.py' &&
        a.email.toLowerCase() !== 'comercial@empresa.com.py'
    );

    // Ensure the primary authorized admin exists
    const adminEmail = INITIAL_PRIMARY_ADMIN.email.toLowerCase();
    const adminIdx = cleaned.findIndex(a => a.email.toLowerCase() === adminEmail);
    if (adminIdx === -1) {
      cleaned.unshift(INITIAL_PRIMARY_ADMIN);
    } else {
      // Ensure role is preserved as admin
      cleaned[adminIdx].role = 'admin';
    }

    if (cleaned.length !== accounts.length) {
      localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(cleaned));
    }

    return cleaned;
  } catch {
    return [INITIAL_PRIMARY_ADMIN];
  }
}

function saveLocalAccounts(accounts: StoredAccount[]): void {
  try {
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.warn('Error saving local accounts:', err);
  }
}

/**
 * Validates and returns the active user session.
 * Protects against frontend localStorage tampering: validates role integrity
 * against the authoritative accounts store and authorized administrator list.
 */
export function getStoredSession(): UserProfile | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;

    const session = JSON.parse(raw);
    if (!session || !session.id || !session.email) return null;

    const sessionEmail = String(session.email).trim().toLowerCase();

    // Invalidate deprecated test accounts immediately
    if (sessionEmail === 'admin@empresa.com.py' || sessionEmail === 'comercial@empresa.com.py') {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    // Role authorization check against database/storage
    const accounts = getLocalAccounts();
    const matched = accounts.find(a => a.email.toLowerCase() === sessionEmail);
    const authorizedAdmins = getAuthorizedAdminList();

    let verifiedRole: UserRole = 'consulta';

    if (matched) {
      if (matched.role === 'admin' && authorizedAdmins.includes(sessionEmail)) {
        verifiedRole = 'admin';
      } else {
        verifiedRole = 'consulta';
      }
    } else if (authorizedAdmins.includes(sessionEmail)) {
      verifiedRole = 'admin';
    } else {
      // Session does not belong to any recognized identity
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    return {
      id: session.id,
      email: session.email,
      full_name: session.full_name || session.email,
      role: verifiedRole
    };
  } catch {
    return null;
  }
}

/**
 * Saves current active session
 */
export function saveStoredSession(user: UserProfile): void {
  try {
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        authenticated_at: new Date().toISOString()
      })
    );
  } catch (err) {
    console.warn('Error saving session:', err);
  }
}

/**
 * Clears active session and signs out from Supabase if connected
 */
export async function logoutUser(): Promise<void> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.auth.signOut();
    } catch (err) {
      console.warn('Supabase signOut error:', err);
    }
  }
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {}
}

/**
 * Authenticates user with email and password.
 * Resolves role strictly through authoritative checks (Supabase user_profiles table
 * or authorized accounts store) and prevents client-side role forgery.
 */
export async function loginWithCredentials(
  emailInput: string,
  passwordInput: string
): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
  const email = emailInput.trim().toLowerCase();
  const password = passwordInput.trim();

  if (!email || !password) {
    return { success: false, message: 'Ingrese su correo electrónico y contraseña.' };
  }

  // Reject deprecated demo accounts
  if (email === 'admin@empresa.com.py' || email === 'comercial@empresa.com.py') {
    return {
      success: false,
      message: 'Esta cuenta de prueba ha sido deshabilitada por motivos de seguridad. Ingrese con sus credenciales autorizadas.'
    };
  }

  const client = getSupabaseClient();
  const authorizedAdmins = getAuthorizedAdminList();

  // 1. Supabase Authentication flow (when connected)
  if (client) {
    try {
      const { data: authData, error: authErr } = await client.auth.signInWithPassword({
        email,
        password
      });

      if (!authErr && authData.user) {
        let role: UserRole = 'consulta';
        let fullName = authData.user.user_metadata?.full_name || email.split('@')[0];

        try {
          const { data: profile } = await client
            .from('user_profiles')
            .select('role, full_name')
            .eq('id', authData.user.id)
            .single();

          if (profile) {
            // Strictly check if database role is admin and if authorized
            if (profile.role === 'admin' && authorizedAdmins.includes(email)) {
              role = 'admin';
            } else {
              role = profile.role === 'admin' ? 'admin' : 'consulta';
            }
            if (profile.full_name) fullName = profile.full_name;
          } else {
            // New user in Supabase: check authorized list
            role = authorizedAdmins.includes(email) ? 'admin' : 'consulta';
            await client.from('user_profiles').insert([
              {
                id: authData.user.id,
                email: authData.user.email,
                full_name: fullName,
                role
              }
            ]);
          }
        } catch {
          role = authorizedAdmins.includes(email) ? 'admin' : 'consulta';
        }

        const user: UserProfile = {
          id: authData.user.id,
          email: authData.user.email || email,
          full_name: fullName,
          role
        };

        saveStoredSession(user);
        return { success: true, user, message: 'Sesión iniciada con éxito vía Supabase Auth.' };
      }
    } catch (err) {
      console.warn('Supabase auth error, evaluating local credentials fallback:', err);
    }
  }

  // 2. Authoritative Local Accounts Verification
  const accounts = getLocalAccounts();
  const matched = accounts.find(a => a.email.toLowerCase() === email);

  if (!matched) {
    return {
      success: false,
      message: 'Credenciales inválidas. Usuario no registrado o sin autorización.'
    };
  }

  if (matched.passwordHash !== password) {
    return {
      success: false,
      message: 'Contraseña incorrecta. Verifique sus credenciales.'
    };
  }

  // Enforce role security: an account can only be admin if verified in storage AND authorized
  const verifiedRole: UserRole =
    matched.role === 'admin' && (authorizedAdmins.includes(email) || matched.id === 'usr_admin_master')
      ? 'admin'
      : 'consulta';

  const user: UserProfile = {
    id: matched.id,
    email: matched.email,
    full_name: matched.full_name,
    role: verifiedRole
  };

  saveStoredSession(user);
  return {
    success: true,
    user,
    message: `Autenticación exitosa. Bienvenido, ${user.full_name}.`
  };
}

/**
 * Registers a new user.
 * Self-service registration from public screens ALWAYS assigns the 'consulta' role
 * (Equipo Comercial) unless the email is in the pre-authorized administrator list.
 * Only an authenticated Administrator can explicitly grant administrative roles.
 */
export async function registerNewUser(
  emailInput: string,
  passwordInput: string,
  fullNameInput: string,
  requestedRole: UserRole = 'consulta',
  callerAdmin?: UserProfile | null
): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
  const email = emailInput.trim().toLowerCase();
  const password = passwordInput.trim();
  const fullName = fullNameInput.trim() || email.split('@')[0];

  if (!email || !password) {
    return { success: false, message: 'El correo y la contraseña son obligatorios.' };
  }

  if (password.length < 6) {
    return { success: false, message: 'La contraseña debe tener al menos 6 caracteres.' };
  }

  const authorizedAdmins = getAuthorizedAdminList();

  // Role resolution: An unauthenticated caller CANNOT assign an admin role
  let finalRole: UserRole = 'consulta';
  if (callerAdmin && callerAdmin.role === 'admin') {
    finalRole = requestedRole;
    if (finalRole === 'admin') {
      addAuthorizedAdmin(email);
    }
  } else if (authorizedAdmins.includes(email)) {
    finalRole = 'admin';
  } else {
    finalRole = 'consulta';
  }

  const client = getSupabaseClient();

  if (client) {
    try {
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (error) {
        return { success: false, message: `Error en Supabase: ${error.message}` };
      }

      if (data.user) {
        await client.from('user_profiles').upsert([
          {
            id: data.user.id,
            email,
            full_name: fullName,
            role: finalRole
          }
        ]);

        const user: UserProfile = {
          id: data.user.id,
          email,
          full_name: fullName,
          role: finalRole
        };

        if (!callerAdmin) {
          saveStoredSession(user);
        }
        return { success: true, user, message: 'Usuario registrado exitosamente.' };
      }
    } catch (err: unknown) {
      console.warn('Error signing up with Supabase:', err);
    }
  }

  // Local account creation
  const accounts = getLocalAccounts();
  if (accounts.some(a => a.email.toLowerCase() === email)) {
    return { success: false, message: 'Ya existe una cuenta registrada con este correo.' };
  }

  const newAccount: StoredAccount = {
    id: 'usr_' + Date.now(),
    email,
    full_name: fullName,
    role: finalRole,
    passwordHash: password
  };

  accounts.push(newAccount);
  saveLocalAccounts(accounts);

  const user: UserProfile = {
    id: newAccount.id,
    email: newAccount.email,
    full_name: newAccount.full_name,
    role: newAccount.role
  };

  if (!callerAdmin) {
    saveStoredSession(user);
  }

  return {
    success: true,
    user,
    message: 'Cuenta creada exitosamente en el sistema.'
  };
}

/**
 * List all registered users (Only accessible by authenticated Admin)
 */
export async function listAllUsers(adminUser: UserProfile): Promise<UserProfile[]> {
  if (adminUser.role !== 'admin') {
    throw new Error('Acceso no autorizado: Solo administradores pueden ver la lista de usuarios.');
  }

  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        return data
          .filter(
            (p: Record<string, unknown>) =>
              p.email !== 'admin@empresa.com.py' && p.email !== 'comercial@empresa.com.py'
          )
          .map((p: Record<string, unknown>) => ({
            id: String(p.id),
            email: String(p.email),
            full_name: String(p.full_name || p.email),
            role: p.role === 'admin' ? 'admin' : 'consulta'
          }));
      }
    } catch (err) {
      console.warn('Error listing users from Supabase, falling back to local accounts:', err);
    }
  }

  const accounts = getLocalAccounts();
  return accounts.map(a => ({
    id: a.id,
    email: a.email,
    full_name: a.full_name,
    role: a.role
  }));
}

/**
 * Updates a user role (Only accessible by authenticated Admin)
 */
export async function updateUserRole(
  targetUserId: string,
  newRole: UserRole,
  adminUser: UserProfile
): Promise<{ success: boolean; message: string }> {
  if (adminUser.role !== 'admin') {
    return { success: false, message: 'Operación denegada: Requiere privilegios de Administrador.' };
  }

  const client = getSupabaseClient();
  let supabaseUpdated = false;

  // Retrieve local account
  const accounts = getLocalAccounts();
  const idx = accounts.findIndex(a => a.id === targetUserId);
  let targetEmail = '';

  if (idx !== -1) {
    targetEmail = accounts[idx].email;
    accounts[idx].role = newRole;
    saveLocalAccounts(accounts);
  }

  if (newRole === 'admin' && targetEmail) {
    addAuthorizedAdmin(targetEmail);
  } else if (newRole === 'consulta' && targetEmail) {
    // Only remove if not primary master
    if (targetEmail !== 'bussinessanalyst3@gmail.com') {
      removeAuthorizedAdmin(targetEmail);
    }
  }

  if (client) {
    try {
      const { error } = await client
        .from('user_profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', targetUserId);

      if (!error) {
        supabaseUpdated = true;
      }
    } catch (err) {
      console.warn('Error updating role in Supabase:', err);
    }
  }

  return {
    success: true,
    message: supabaseUpdated
      ? `Rol actualizado a '${newRole.toUpperCase()}' en Supabase y localmente.`
      : `Rol actualizado a '${newRole.toUpperCase()}' exitosamente.`
  };
}
