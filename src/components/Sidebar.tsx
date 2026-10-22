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
  BarChart2
} from 'lucide-react';
import { UserRole } from '../types/commercial';
import { AppTheme } from '../styles/theme';

export type ActiveTab =
  | 'overview'
  | 'sales'
  | 'goals'
  | 'coverage'
  | 'rankings'
  | 'history'
  | 'import'
  | 'audit'
  | 'supabase';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  userRole: UserRole;
  onToggleRole: () => void;
  supabaseConnected: boolean;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  theme: AppTheme;
  onToggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  userRole,
  onToggleRole,
  supabaseConnected,
  isOpenMobile,
  onCloseMobile,
  theme,
  onToggleTheme
}) => {
  const navItems = [
    {
      id: 'overview' as ActiveTab,
      label: 'Overview',
      sub: 'Performance Studio',
      icon: LayoutDashboard,
      badge: 'Principal'
    },
    {
      id: 'sales' as ActiveTab,
      label: 'Sales Intelligence',
      sub: 'Volumen & Mix',
      icon: BarChart2
    },
    {
      id: 'goals' as ActiveTab,
      label: 'Objetivos & Varianza',
      sub: 'Metas dimensionales',
      icon: Target
    },
    {
      id: 'coverage' as ActiveTab,
      label: 'Cobertura',
      sub: 'Clientes & Rutas',
      icon: Users
    },
    {
      id: 'rankings' as ActiveTab,
      label: 'Rankings & Pareto',
      sub: 'Concentración 80/20',
      icon: Award
    },
    {
      id: 'history' as ActiveTab,
      label: 'Historial',
      sub: 'Series & MoM/YoY',
      icon: CalendarDays
    },
    {
      id: 'import' as ActiveTab,
      label: 'Data Management',
      sub: 'Excel & Reemplazos',
      icon: FileSpreadsheet,
      badge: userRole === 'admin' ? 'Admin' : 'Lectura'
    },
    {
      id: 'audit' as ActiveTab,
      label: 'Auditoría',
      sub: 'Trazabilidad de lotes',
      icon: History
    },
    {
      id: 'supabase' as ActiveTab,
      label: 'Supabase & SQL',
      sub: 'PostgreSQL & RLS',
      icon: Database
    }
  ];

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
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-[#242C37] bg-[#0B0D10] text-[#F1F5F9] transition-transform duration-200 lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Editorial Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-[#242C37] px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center border border-[#C5F467]/40 bg-[#12161C] text-[#C5F467]">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <div className="font-mono text-xs font-extrabold tracking-wider text-[#F1F5F9] uppercase">
                ANALYTICS STUDIO
              </div>
              <div className="text-[10px] font-mono text-[#626D7C]">
                Commercial Intelligence
              </div>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1 text-[#929EAD] hover:text-[#F1F5F9] lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto px-2 py-4">
          <div className="px-2 pb-2 text-[10px] font-mono font-bold tracking-widest text-[#626D7C] uppercase">
            MÓDULOS ANALÍTICOS
          </div>
          <nav className="space-y-0.5">
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
                  className={`group flex w-full items-center justify-between px-2.5 py-2 text-left font-mono text-xs transition-colors ${
                    isActive
                      ? 'border-l-2 border-[#C5F467] bg-[#12161C] text-[#C5F467] font-bold'
                      : 'border-l-2 border-transparent text-[#929EAD] hover:bg-[#12161C]/60 hover:text-[#F1F5F9]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isActive ? 'text-[#C5F467]' : 'text-[#626D7C] group-hover:text-[#929EAD]'
                      }`}
                    />
                    <div className="truncate">
                      <div className="truncate leading-tight">{item.label}</div>
                      <div className="truncate text-[10px] text-[#626D7C] font-sans">
                        {item.sub}
                      </div>
                    </div>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1 py-0.2 font-mono uppercase tracking-wider ${
                        isActive
                          ? 'border border-[#C5F467]/30 bg-[#C5F467]/10 text-[#C5F467]'
                          : 'border border-[#242C37] bg-[#0B0D10] text-[#626D7C]'
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
          <div className="mt-8 border border-[#242C37] bg-[#12161C] p-3 text-[11px] font-mono">
            <div className="flex items-center justify-between text-[#929EAD]">
              <span className="uppercase text-[10px] text-[#626D7C]">PERSISTENCIA</span>
              <span className="flex items-center gap-1.5 text-[#C5F467]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C5F467] animate-pulse" />
                {supabaseConnected ? 'Supabase Sync' : 'Indexed Local'}
              </span>
            </div>
            <p className="mt-1.5 text-[10px] text-[#626D7C] leading-relaxed font-sans">
              {supabaseConnected
                ? 'Conectado a Supabase PostgreSQL con RLS en producción.'
                : 'Almacenamiento persistente local activo. Esquema SQL listo para vincular.'}
            </p>
          </div>
        </div>

        {/* Footer: User Role and Theme Switcher */}
        <div className="border-t border-[#242C37] p-3 bg-[#0B0D10]">
          <div className="border border-[#242C37] bg-[#12161C] p-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center text-xs font-bold ${
                    userRole === 'admin'
                      ? 'border border-[#C5F467]/40 bg-[#C5F467]/10 text-[#C5F467]'
                      : 'border border-[#242C37] bg-[#191F27] text-[#929EAD]'
                  }`}
                >
                  {userRole === 'admin' ? <Shield className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </div>
                <div className="min-w-0 truncate font-mono">
                  <div className="text-[11px] font-bold text-[#F1F5F9] truncate">
                    {userRole === 'admin' ? 'Admin / Director' : 'Consulta / Analista'}
                  </div>
                  <div className="text-[9px] text-[#626D7C] uppercase">
                    RBAC: {userRole}
                  </div>
                </div>
              </div>

              {/* Theme Toggle Button */}
              <button
                onClick={onToggleTheme}
                className="p-1 border border-[#242C37] text-[#929EAD] hover:text-[#F1F5F9] transition-colors"
                title={`Cambiar a tema ${theme === 'dark' ? 'claro' : 'oscuro'}`}
              >
                {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              </button>
            </div>

            <div className="mt-2 pt-1.5 border-t border-[#242C37] flex items-center justify-between text-[10px] font-mono">
              <span className="text-[#626D7C]">Alternar rol:</span>
              <button
                onClick={onToggleRole}
                className="text-[#C5F467] hover:underline font-bold"
              >
                Cambiar a {userRole === 'admin' ? 'Consulta' : 'Admin'}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
