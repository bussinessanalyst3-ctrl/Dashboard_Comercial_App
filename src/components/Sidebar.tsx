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
  UserCheck,
  Eye,
  ChevronRight,
  TrendingUp,
  X
} from 'lucide-react';
import { UserRole } from '../types/commercial';

export type ActiveTab =
  | 'dashboard'
  | 'dimensional'
  | 'rankings'
  | 'comparisons'
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
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  userRole,
  onToggleRole,
  supabaseConnected,
  isOpenMobile,
  onCloseMobile
}) => {
  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Resumen Ejecutivo',
      icon: LayoutDashboard,
      description: 'KPIs, cumplimiento y alertas'
    },
    {
      id: 'dimensional' as ActiveTab,
      label: 'Análisis Dimensional',
      icon: Layers,
      description: 'Zonas, supervisores, rutas y productos'
    },
    {
      id: 'rankings' as ActiveTab,
      label: 'Rankings & Desempeño',
      icon: Award,
      description: 'Líderes de venta y cobertura'
    },
    {
      id: 'comparisons' as ActiveTab,
      label: 'Historial & Comparativas',
      icon: CalendarDays,
      description: 'MoM, YoY y tendencia acumulada'
    },
    {
      id: 'import' as ActiveTab,
      label: 'Gestión de Datos',
      icon: FileSpreadsheet,
      description: 'Importar Excel y reemplazar períodos',
      badge: userRole === 'admin' ? 'Admin' : 'Lectura'
    },
    {
      id: 'audit' as ActiveTab,
      label: 'Auditoría de Cargas',
      icon: History,
      description: 'Historial de lotes y trazabilidad'
    },
    {
      id: 'supabase' as ActiveTab,
      label: 'Supabase & SQL',
      icon: Database,
      description: 'Conexión PostgreSQL y RLS'
    }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white shadow-xs">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-slate-900">
                Dashboard Comercial
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Objetivos · Ventas · Cobertura
              </div>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1 text-slate-400 hover:text-slate-600 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="px-2 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Módulos Principales
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
                  className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-700'
                      }`}
                    />
                    <div className="truncate">
                      <div className="font-semibold">{item.label}</div>
                      <div
                        className={`truncate text-[10px] ${
                          isActive ? 'text-slate-300' : 'text-slate-400'
                        }`}
                      >
                        {item.description}
                      </div>
                    </div>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-slate-800 text-slate-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick status box */}
          <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-700">Motor de Persistencia</span>
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {supabaseConnected ? 'Supabase Activo' : 'Local + SQL Ready'}
              </span>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed">
              {supabaseConnected
                ? 'Conectado a la nube Supabase PostgreSQL con RLS activado.'
                : 'Almacenamiento persistente local activo. Puede vincular Supabase en cualquier momento.'}
            </p>
          </div>
        </div>

        {/* User Role & Profile Switcher */}
        <div className="border-t border-slate-200 p-3 bg-slate-50/50">
          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                    userRole === 'admin'
                      ? 'bg-slate-900 text-amber-400'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {userRole === 'admin' ? (
                    <Shield className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 truncate">
                  <div className="text-xs font-semibold text-slate-900 truncate">
                    {userRole === 'admin' ? 'Director Comercial' : 'Analista Comercial'}
                  </div>
                  <div className="text-[10px] text-slate-500 capitalize">
                    Rol: {userRole === 'admin' ? 'Administrador' : 'Consulta (Solo Lectura)'}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">Probar control de acceso:</span>
              <button
                onClick={onToggleRole}
                className="text-[11px] font-semibold text-slate-900 hover:text-emerald-700 transition-colors inline-flex items-center gap-1"
                title="Alternar entre Admin y Consulta"
              >
                Cambiar a {userRole === 'admin' ? 'Consulta' : 'Admin'}
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
