import React from 'react';
import {
  Menu,
  Download,
  Shield,
  Eye,
  Database,
  Calendar,
  Building,
  TrendingUp
} from 'lucide-react';
import { UserRole, VentaRecord, ObjetivoRecord, CoberturaRecord } from '../types/commercial';
import { formatPeriodDisplay, exportToExcel } from '../services/dataNormalizer';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  currentPeriod: string;
  userRole: UserRole;
  onToggleRole: () => void;
  supabaseConnected: boolean;
  ventas: VentaRecord[];
  objetivos: ObjetivoRecord[];
  cobertura: CoberturaRecord[];
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  currentPeriod,
  userRole,
  onToggleRole,
  supabaseConnected,
  ventas,
  objetivos,
  cobertura
}) => {
  const handleExportFilteredExcel = () => {
    exportToExcel(
      objetivos,
      ventas,
      cobertura,
      `Dashboard_Comercial_${currentPeriod}_${Date.now()}.xlsx`
    );
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xs sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-900">
            {currentPeriod === 'TODOS'
              ? 'Todos los Períodos'
              : formatPeriodDisplay(currentPeriod)}
          </span>
          <span className="text-xs text-slate-400">({currentPeriod})</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Export Excel Button */}
        <button
          onClick={handleExportFilteredExcel}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-colors"
          title="Descargar libro Excel con las 3 hojas del período activo"
        >
          <Download className="h-3.5 w-3.5 text-slate-500" />
          <span className="hidden sm:inline">Exportar Excel</span>
        </button>

        {/* Supabase status badge */}
        <div
          className={`hidden sm:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
            supabaseConnected
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-slate-200 bg-slate-50 text-slate-600'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              supabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
            }`}
          />
          {supabaseConnected ? 'Supabase Conectado' : 'Local Persistence'}
        </div>

        {/* User Role Badge / Switcher */}
        <button
          onClick={onToggleRole}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-colors ${
            userRole === 'admin'
              ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
              : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          title="Click para alternar entre Administrador y Consulta"
        >
          {userRole === 'admin' ? (
            <Shield className="h-3.5 w-3.5 text-amber-600" />
          ) : (
            <Eye className="h-3.5 w-3.5 text-slate-500" />
          )}
          <span>{userRole === 'admin' ? 'Admin' : 'Consulta'}</span>
        </button>
      </div>
    </header>
  );
};
