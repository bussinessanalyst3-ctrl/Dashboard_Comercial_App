import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/commercial';
import { listAllUsers, updateUserRole, registerNewUser } from '../services/authService';
import {
  Users,
  Shield,
  Eye,
  UserPlus,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Lock,
  Mail,
  User
} from 'lucide-react';

interface UserManagementViewProps {
  currentUser: UserProfile;
  onAuditAction?: (action: string, details: string) => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  currentUser,
  onAuditAction
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // New user form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('consulta');
  const [isCreating, setIsCreating] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await listAllUsers(currentUser);
      setUsers(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setNotification({ type: 'error', message: `Error al obtener usuarios: ${msg}` });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (targetUser: UserProfile, nextRole: UserRole) => {
    if (targetUser.id === currentUser.id && nextRole !== 'admin') {
      if (!confirm('Advertencia: Está modificando su propio rol de Administrador. Si continúa, perderá privilegios de administración. ¿Desea proceder?')) {
        return;
      }
    }

    try {
      const res = await updateUserRole(targetUser.id, nextRole, currentUser);
      if (res.success) {
        setNotification({ type: 'success', message: res.message });
        setUsers(prev =>
          prev.map(u => (u.id === targetUser.id ? { ...u, role: nextRole } : u))
        );
        onAuditAction?.(
          'ROLE_CHANGE',
          `El administrador ${currentUser.email} modificó el rol del usuario ${targetUser.email} a: ${nextRole.toUpperCase()}`
        );
      } else {
        setNotification({ type: 'error', message: res.message });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setNotification({ type: 'error', message: `Fallo al actualizar rol: ${msg}` });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setNotification(null);

    try {
      const res = await registerNewUser(newEmail, newPassword, newName, newRole, currentUser);
      if (res.success && res.user) {
        setNotification({
          type: 'success',
          message: `Usuario ${res.user.email} creado con éxito con rol ${newRole.toUpperCase()}.`
        });
        setShowAddModal(false);
        setNewEmail('');
        setNewName('');
        setNewPassword('');
        setNewRole('consulta');
        fetchUsers();
        onAuditAction?.(
          'USER_CREATED',
          `El administrador ${currentUser.email} creó la cuenta para ${res.user.email} con rol ${newRole.toUpperCase()}`
        );
      } else {
        setNotification({ type: 'error', message: res.message || 'Error al crear usuario.' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setNotification({ type: 'error', message: `Error: ${msg}` });
    } finally {
      setIsCreating(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Container */}
      <div className="rounded-lg border border-[#374151] bg-[#1F2937] p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[#374151]">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
              <span>SEGURIDAD & CONTROL DE IDENTIDADES</span>
              <span>/</span>
              <span className="text-[#3B82F6] font-bold">ADMINISTRACIÓN DE ROLES</span>
            </div>
            <h2 className="mt-1 text-base font-bold text-[#F9FAFB]">
              Gestión de Usuarios y Asignación de Permisos
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#374151] bg-[#111827] px-3 py-1.5 text-xs font-semibold text-[#D1D5DB] hover:text-[#F9FAFB] hover:border-[#4B5563] transition-colors cursor-pointer"
              title="Refrescar listado"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refrescar</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#3B82F6] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#2563EB] transition-colors shadow-sm cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span>Registrar Nuevo Usuario</span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        {notification && (
          <div
            className={`mt-4 rounded-md border p-3 flex items-center gap-2 text-xs ${
              notification.type === 'success'
                ? 'border-[#14B8A6]/40 bg-[#14B8A6]/10 text-[#14B8A6]'
                : 'border-[#EF4444]/40 bg-[#EF4444]/10 text-[#EF4444]'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Search bar & Stats */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Buscar por nombre, correo o rol..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-md border border-[#374151] bg-[#111827] pl-9 pr-3 text-xs text-[#F9FAFB] placeholder:text-[#6B7280] focus:border-[#3B82F6] focus:outline-hidden focus:ring-1 focus:ring-[#3B82F6]"
            />
          </div>

          <div className="text-[11px] text-[#9CA3AF] flex items-center gap-3">
            <span>
              Total Usuarios:{' '}
              <strong className="text-[#F9FAFB] font-mono">{users.length}</strong>
            </span>
            <span>·</span>
            <span>
              Admins:{' '}
              <strong className="text-[#3B82F6] font-mono">
                {users.filter(u => u.role === 'admin').length}
              </strong>
            </span>
            <span>·</span>
            <span>
              Comercial:{' '}
              <strong className="text-[#14B8A6] font-mono">
                {users.filter(u => u.role === 'consulta').length}
              </strong>
            </span>
          </div>
        </div>

        {/* Users Table */}
        <div className="mt-4 overflow-x-auto rounded-md border border-[#374151]">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[#374151] bg-[#111827] text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                <th className="p-3">Usuario / Nombre</th>
                <th className="p-3">Correo Electrónico</th>
                <th className="p-3">Rol Actual</th>
                <th className="p-3">Permisos Asignados</th>
                <th className="p-3 text-right">Asignar Rol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#374151] bg-[#1F2937]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-[#9CA3AF]">
                    No se encontraron usuarios coincidentes con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const isCurrent = user.id === currentUser.id;
                  const isAdmin = user.role === 'admin';

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-[#111827]/60 transition-colors"
                    >
                      <td className="p-3 font-semibold text-[#F9FAFB]">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded ${
                              isAdmin
                                ? 'bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30'
                                : 'bg-[#14B8A6]/15 text-[#14B8A6] border border-[#14B8A6]/30'
                            }`}
                          >
                            {isAdmin ? <Shield className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </div>
                          <span>{user.full_name}</span>
                          {isCurrent && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-[#3B82F6]/20 text-[#38BDF8] border border-[#3B82F6]/40">
                              TÚ
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3 text-[#9CA3AF] font-mono">{user.email}</td>

                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            isAdmin
                              ? 'bg-[#3B82F6]/15 text-[#38BDF8] border border-[#3B82F6]/30'
                              : 'bg-[#14B8A6]/15 text-[#14B8A6] border border-[#14B8A6]/30'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isAdmin ? 'bg-[#3B82F6]' : 'bg-[#14B8A6]'
                            }`}
                          />
                          {isAdmin ? 'ADMINISTRADOR' : 'EQUIPO COMERCIAL'}
                        </span>
                      </td>

                      <td className="p-3 text-[11px] text-[#9CA3AF] leading-relaxed">
                        {isAdmin
                          ? 'Acceso total: Ingesta, SQL, Reemplazos, Usuarios, Auditoría'
                          : 'Solo lectura: Consulta Dashboard, Rankings, Gráficos y Filtros'}
                      </td>

                      <td className="p-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {isAdmin ? (
                            <button
                              onClick={() => handleRoleChange(user, 'consulta')}
                              className="rounded border border-[#374151] bg-[#111827] px-2.5 py-1 text-[11px] font-medium text-[#9CA3AF] hover:text-[#38BDF8] hover:border-[#38BDF8]/40 transition-colors cursor-pointer"
                              title="Cambiar a Equipo Comercial (Consulta)"
                            >
                              Cambiar a Comercial
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRoleChange(user, 'admin')}
                              className="rounded border border-[#3B82F6]/40 bg-[#3B82F6]/10 px-2.5 py-1 text-[11px] font-semibold text-[#3B82F6] hover:bg-[#3B82F6]/20 transition-colors cursor-pointer"
                              title="Promover a Administrador"
                            >
                              Promover a Admin
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TO REGISTER NEW USER */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg border border-[#374151] bg-[#1F2937] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#374151] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-[#3B82F6]" />
                <h3 className="text-sm font-bold text-[#F9FAFB]">
                  Registrar Nuevo Miembro de Equipo
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#9CA3AF] hover:text-[#F9FAFB] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#9CA3AF] mb-1 font-semibold">
                  Nombre Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
                  <input
                    type="text"
                    required
                    placeholder="Ej. Rodrigo Mendoza"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="h-9 w-full rounded-md border border-[#374151] bg-[#111827] pl-9 pr-3 text-xs text-[#F9FAFB] focus:border-[#3B82F6] focus:outline-hidden focus:ring-1 focus:ring-[#3B82F6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#9CA3AF] mb-1 font-semibold">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
                  <input
                    type="email"
                    required
                    placeholder="usuario@empresa.com.py"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className="h-9 w-full rounded-md border border-[#374151] bg-[#111827] pl-9 pr-3 text-xs text-[#F9FAFB] focus:border-[#3B82F6] focus:outline-hidden focus:ring-1 focus:ring-[#3B82F6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#9CA3AF] mb-1 font-semibold">
                  Contraseña Temporal
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
                  <input
                    type="password"
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="h-9 w-full rounded-md border border-[#374151] bg-[#111827] pl-9 pr-3 text-xs text-[#F9FAFB] focus:border-[#3B82F6] focus:outline-hidden focus:ring-1 focus:ring-[#3B82F6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#9CA3AF] mb-1 font-semibold">
                  Rol y Nivel de Acceso
                </label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as UserRole)}
                  className="h-9 w-full rounded-md border border-[#374151] bg-[#111827] px-3 text-xs text-[#F9FAFB] focus:border-[#3B82F6] focus:outline-hidden focus:ring-1 focus:ring-[#3B82F6] cursor-pointer"
                >
                  <option value="consulta">Equipo Comercial (Solo Consulta Dashboard)</option>
                  <option value="admin">Administrador (Control Total & Gestión)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-[#374151] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={isCreating}
                  className="rounded-md px-3.5 py-1.5 text-xs font-semibold text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="rounded-md bg-[#3B82F6] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#2563EB] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isCreating ? 'Registrando...' : 'Registrar Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
