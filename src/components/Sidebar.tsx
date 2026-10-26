import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Award,
  CalendarDays,
  FileSpreadsheet,
  History,
  Database,
  Shield,
  Eye,
  TrendingUp,
  X,
  Target,
  Users,
  Sun,
  Moon,
  Activity,
  BarChart2,
  LogOut,
  UserCheck
} from 'lucide-react';
import { UserProfile, UserRole } from '../types/commercial';
import { AppTheme } from '../styles/theme';

export type ActiveTab =
  | 'overview'
  | 'sales'
  | 'goals'
  | 'coverage'
  | 'rankings'
  | 'history'
  | 'import'
  | 'users'
  | 'audit'
  | 'supabase';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentUser: UserProfile;
  onLogout: () => void;
  supabaseConnected: boolean;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  theme: AppTheme;
  onToggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  supabaseConnected,
  isOpenMobile,
  onCloseMobile,
  theme,
  onToggleTheme
}) => {
  const userRole = currentUser.role;
  const allNavItems = [
    {
      id: 'overview' as ActiveTab,
      label: 'Overview',
      sub: 'Performance Studio',
      icon: LayoutDashboard,
      badge: 'Principal',
      adminOnly: false
    },
    {
      id: 'sales' as ActiveTab,
      label: 'Sales Intelligence',
      sub: 'Volumen & Mix',
      icon: BarChart2,
      adminOnly: false
    },
    {
      id: 'goals' as ActiveTab,
      label: 'Objetivos & Varianza',
      sub: 'Metas dimensionales',
      icon: Target,
      adminOnly: false
    },
    {
      id: 'coverage' as ActiveTab,
      label: 'Cobertura',
      sub: 'Clientes & Rutas',
      icon: Users,
      adminOnly: false
    },
    {
      id: 'rankings' as ActiveTab,
      label: 'Rankings & Pareto',
      sub: 'Concentración 80/20',
      icon: Award,
      adminOnly: false
    },
    {
      id: 'history' as ActiveTab,
      label: 'Historial',
      sub: 'Series & MoM/YoY',
      icon: CalendarDays,
      adminOnly: false
    },
    {
      id: 'import' as ActiveTab,
      label: 'Data Management',
      sub: 'Excel & Reemplazos',
      icon: FileSpreadsheet,
      badge: 'Admin',
      adminOnly: true
    },
    {
      id: 'users' as ActiveTab,
      label: 'Gestión Usuarios',
      sub: 'Roles & Permisos',
      icon: UserCheck,
      badge: 'Admin',
      adminOnly: true
    },
    {
      id: 'audit' as ActiveTab,
      label: 'Auditoría',
      sub: 'Trazabilidad de lotes',
      icon: History,
      badge: 'Admin',
      adminOnly: true
    },
    {
      id: 'supabase' as ActiveTab,
      label: 'Supabase & SQL',
      sub: 'PostgreSQL & RLS',
      icon: Database,
      badge: 'Admin',
      adminOnly: true
    }
  ];

  // Restrict items: commercial team ONLY sees visualization tabs
  const navItems = allNavItems.filter(item => !item.adminOnly || userRole === 'admin');

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-[#374151] bg-[#111827] text-[#F9FAFB] transition-transform duration-200 lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-[#374151] px-4 bg-[#111827]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] text-white shadow-xs">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-[#F9FAFB]">
                Analytics Studio
              </div>
              <div className="text-[11px] text-[#9CA3AF] font-medium">
                Commercial Intelligence
              </div>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1 text-[#9CA3AF] hover:text-[#F9FAFB] lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="px-2 pb-2.5 text-[11px] font-semibold tracking-wider text-[#6B7280] uppercase">
            Módulos Analíticos
          </div>
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    onCloseMobile();
                  }}
                  className={`group flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-medium transition-colors ${
                    isActive
                      ? 'border-l-3 border-[#3B82F6] bg-[#3B82F6]/10 text-[#3B82F6] font-semibold'
                      : 'border-l-3 border-transparent text-[#9CA3AF] hover:bg-[#1F2937] hover:text-[#F9FAFB]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isActive ? 'text-[#3B82F6]' : 'text-[#6B7280] group-hover:text-[#9CA3AF]'
                      }`}
                    />
                    <div className="truncate">
                      <div className="truncate leading-tight">{item.label}</div>
                      <div className="truncate text-[11px] text-[#6B7280] font-normal">
                        {item.sub}
                      </div>
                    </div>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider ${
                        isActive
                          ? 'border border-[#3B82F6]/30 bg-[#3B82F6]/20 text-[#3B82F6]'
                          : 'border border-[#374151] bg-[#1F2937] text-[#9CA3AF]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Engine Status */}
          <div className="mt-8 rounded-lg border border-[#374151] bg-[#1F2937] p-3 text-xs">
            <div className="flex items-center justify-between text-[#9CA3AF]">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">Persistencia</span>
              <span className="flex items-center gap-1.5 font-medium text-[#14B8A6]">
                <span className="h-2 w-2 rounded-full bg-[#14B8A6] animate-pulse" />
                {supabaseConnected ? 'Supabase Sync' : 'Indexed Local'}
              </span>
            </div>
            <p className="mt-1.5 text-[11px] text-[#9CA3AF] leading-relaxed">
              {supabaseConnected
                ? 'Conectado a Supabase PostgreSQL con RLS en producción.'
                : 'Almacenamiento persistente local activo. Esquema SQL listo para vincular.'}
            </p>
          </div>
        </div>

        {/* Footer: User Role and Theme Switcher */}
        <div className="border-t border-[#374151] p-3 bg-[#111827]">
          <div className="rounded-lg border border-[#374151] bg-[#1F2937] p-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                    userRole === 'admin'
                      ? 'border border-[#3B82F6]/40 bg-[#3B82F6]/10 text-[#3B82F6]'
                      : 'border border-[#14B8A6]/40 bg-[#14B8A6]/10 text-[#14B8A6]'
                  }`}
                >
                  {userRole === 'admin' ? <Shield className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </div>
                <div className="min-w-0 truncate">
                  <div className="text-xs font-semibold text-[#F9FAFB] truncate">
                    {currentUser.full_name || currentUser.email}
                  </div>
                  <div className={`text-[10px] font-medium uppercase tracking-wider ${
                    userRole === 'admin' ? 'text-[#3B82F6]' : 'text-[#14B8A6]'
                  }`}>
                    {userRole === 'admin' ? 'Administrador' : 'Equipo Comercial'}
                  </div>
                </div>
              </div>

              {/* Theme Toggle Button */}
              <button
                onClick={onToggleTheme}
                className="p-1.5 rounded-md border border-[#374151] text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#374151]/50 transition-colors"
                title={`Cambiar a tema ${theme === 'dark' ? 'claro' : 'oscuro'}`}
              >
                {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              </button>
            </div>

            <div className="mt-2.5 pt-2 border-t border-[#374151] flex items-center justify-between text-[11px]">
              <span className="text-[#6B7280] truncate max-w-[130px] font-mono">{currentUser.email}</span>
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-1 text-[#EF4444] hover:text-red-400 font-medium transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="h-3 w-3" />
                <span>Salir</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
