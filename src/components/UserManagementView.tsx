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
    <div className="space-y-6 font-mono text-xs">
      {/* Header Container */}
      <div className="border border-[#242C37] bg-[#12161C] p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[#242C37]">
          <div>
            <div className="flex items-center gap-2 text-[10px] text-[#626D7C] uppercase tracking-wider">
              <span>SEGURIDAD & CONTROL DE IDENTIDADES</span>
              <span>/</span>
              <span className="text-[#C5F467] font-bold">ADMINISTRACIÓN DE ROLES</span>
            </div>
            <h2 className="mt-1 text-base font-bold text-[#F1F5F9]">
              Gestión de Usuarios y Asignación de Permisos
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 border border-[#242C37] bg-[#0B0D10] px-3 py-1.5 text-xs text-[#929EAD] hover:text-[#F1F5F9] transition-colors"
              title="Refrescar listado"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refrescar</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 border border-[#C5F467]/50 bg-[#C5F467] px-3.5 py-1.5 text-xs font-bold text-[#0B0D10] hover:bg-[#b8eb58] transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              <span>Registrar Nuevo Usuario</span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        {notification && (
          <div
            className={`mt-4 border p-3 flex items-center gap-2 ${
              notification.type === 'success'
                ? 'border-[#C5F467]/40 bg-[#C5F467]/10 text-[#C5F467]'
                : 'border-[#FB7185]/40 bg-[#FB7185]/10 text-[#FB7185]'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            )}
            <span className="font-sans">{notification.message}</span>
          </div>
        )}

        {/* Search bar & Stats */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#626D7C]" />
            <input
              type="text"
              placeholder="Buscar por nombre, correo o rol..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-8 w-full border border-[#242C37] bg-[#0B0D10] pl-8 pr-3 text-xs text-[#F1F5F9] placeholder:text-[#626D7C] focus:border-[#C5F467] focus:outline-hidden"
            />
          </div>

          <div className="text-[11px] text-[#929EAD] flex items-center gap-3">
            <span>
              Total Usuarios:{' '}
              <strong className="text-[#F1F5F9]">{users.length}</strong>
            </span>
            <span>·</span>
            <span>
              Admins:{' '}
              <strong className="text-[#C5F467]">
                {users.filter(u => u.role === 'admin').length}
              </strong>
            </span>
            <span>·</span>
            <span>
              Comercial:{' '}
              <strong className="text-[#38BDF8]">
                {users.filter(u => u.role === 'consulta').length}
              </strong>
            </span>
          </div>
        </div>

        {/* Users Table */}
        <div className="mt-4 overflow-x-auto border border-[#242C37]">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[#242C37] bg-[#0B0D10] text-[10px] text-[#626D7C] uppercase tracking-wider">
                <th className="p-3 font-bold">Usuario / Nombre</th>
                <th className="p-3 font-bold">Correo Electrónico</th>
                <th className="p-3 font-bold">Rol Actual</th>
                <th className="p-3 font-bold">Permisos Asignados</th>
                <th className="p-3 font-bold text-right">Asignar Rol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242C37] bg-[#12161C]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-[#626D7C]">
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
                      className="hover:bg-[#191F27] transition-colors"
                    >
                      <td className="p-3 font-bold text-[#F1F5F9]">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-6 w-6 items-center justify-center border ${
                              isAdmin
                                ? 'border-[#C5F467]/40 bg-[#C5F467]/10 text-[#C5F467]'
                                : 'border-[#38BDF8]/40 bg-[#38BDF8]/10 text-[#38BDF8]'
                            }`}
                          >
                            {isAdmin ? <Shield className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </div>
                          <span>{user.full_name}</span>
                          {isCurrent && (
                            <span className="text-[9px] px-1 py-0.5 border border-[#C5F467]/40 bg-[#C5F467]/10 text-[#C5F467]">
                              TÚ
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3 text-[#929EAD] font-mono">{user.email}</td>

                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 border text-[10px] font-bold uppercase tracking-wider ${
                            isAdmin
                              ? 'border-[#C5F467]/40 bg-[#C5F467]/10 text-[#C5F467]'
                              : 'border-[#38BDF8]/40 bg-[#38BDF8]/10 text-[#38BDF8]'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isAdmin ? 'bg-[#C5F467]' : 'bg-[#38BDF8]'
                            }`}
                          />
                          {isAdmin ? 'ADMINISTRADOR' : 'EQUIPO COMERCIAL'}
                        </span>
                      </td>

                      <td className="p-3 text-[11px] text-[#626D7C] font-sans">
                        {isAdmin
                          ? 'Acceso total: Ingesta, SQL, Reemplazos, Usuarios, Auditoría'
                          : 'Solo lectura: Consulta Dashboard, Rankings, Gráficos y Filtros'}
                      </td>

                      <td className="p-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {isAdmin ? (
                            <button
                              onClick={() => handleRoleChange(user, 'consulta')}
                              className="border border-[#242C37] bg-[#0B0D10] px-2.5 py-1 text-[11px] text-[#929EAD] hover:text-[#38BDF8] hover:border-[#38BDF8]/40 transition-colors"
                              title="Cambiar a Equipo Comercial (Consulta)"
                            >
                              Cambiar a Comercial
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRoleChange(user, 'admin')}
                              className="border border-[#C5F467]/40 bg-[#C5F467]/10 px-2.5 py-1 text-[11px] font-bold text-[#C5F467] hover:bg-[#C5F467]/20 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md border border-[#242C37] bg-[#12161C] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#242C37] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-[#C5F467]" />
                <h3 className="text-sm font-bold text-[#F1F5F9]">
                  Registrar Nuevo Miembro de Equipo
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#626D7C] hover:text-[#F1F5F9]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#929EAD] mb-1 font-bold">
                  Nombre Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#626D7C]" />
                  <input
                    type="text"
                    required
                    placeholder="Ej. Rodrigo Mendoza"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="h-8 w-full border border-[#242C37] bg-[#0B0D10] pl-9 pr-3 text-xs text-[#F1F5F9] focus:border-[#C5F467] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#929EAD] mb-1 font-bold">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#626D7C]" />
                  <input
                    type="email"
                    required
                    placeholder="usuario@empresa.com.py"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className="h-8 w-full border border-[#242C37] bg-[#0B0D10] pl-9 pr-3 text-xs text-[#F1F5F9] focus:border-[#C5F467] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#929EAD] mb-1 font-bold">
                  Contraseña Temporal
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#626D7C]" />
                  <input
                    type="password"
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="h-8 w-full border border-[#242C37] bg-[#0B0D10] pl-9 pr-3 text-xs text-[#F1F5F9] focus:border-[#C5F467] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#929EAD] mb-1 font-bold">
                  Rol y Nivel de Acceso
                </label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as UserRole)}
                  className="h-8 w-full border border-[#242C37] bg-[#0B0D10] px-2 text-xs text-[#F1F5F9] focus:border-[#C5F467] focus:outline-hidden"
                >
                  <option value="consulta">Equipo Comercial (Solo Consulta Dashboard)</option>
                  <option value="admin">Administrador (Control Total & Gestión)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-[#242C37] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={isCreating}
                  className="px-3 py-1.5 text-xs text-[#929EAD] hover:text-[#F1F5F9]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="border border-[#C5F467]/50 bg-[#C5F467] px-4 py-1.5 text-xs font-bold text-[#0B0D10] hover:bg-[#b8eb58] transition-colors disabled:opacity-50"
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
