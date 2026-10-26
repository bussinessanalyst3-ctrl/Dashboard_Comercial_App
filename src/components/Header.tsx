import {
  Menu,
  Download,
  Shield,
  Eye,
  Calendar,
  Layers,
  Database,
  Filter,
  LogOut
} from 'lucide-react';
import { UserProfile, UserRole, VentaRecord, ObjetivoRecord, CoberturaRecord } from '../types/commercial';
import { formatPeriodDisplay, exportToExcel } from '../services/dataNormalizer';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  currentPeriod: string;
  currentUser: UserProfile;
  onLogout: () => void;
  supabaseConnected: boolean;
  ventas: VentaRecord[];
  objetivos: ObjetivoRecord[];
  cobertura: CoberturaRecord[];
  onToggleFilters?: () => void;
  isFiltersOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  currentPeriod,
  currentUser,
  onLogout,
  supabaseConnected,
  ventas,
  objetivos,
  cobertura,
  onToggleFilters,
  isFiltersOpen
}) => {
  const handleExportFilteredExcel = () => {
    exportToExcel(
      objetivos,
      ventas,
      cobertura,
      `Analytics_Studio_${currentPeriod}_${Date.now()}.xlsx`
    );
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-[#374151] bg-[#111827]/95 px-4 backdrop-blur-xs sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 rounded-md border border-[#374151] text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#1F2937] lg:hidden transition-colors"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 text-xs">
          <Calendar className="h-4 w-4 text-[#3B82F6]" />
          <span className="text-[#9CA3AF] font-medium hidden sm:inline">Período Activo:</span>
          <span className="font-semibold text-[#F9FAFB]">
            {currentPeriod === 'TODOS'
              ? 'Todos los períodos'
              : `${formatPeriodDisplay(currentPeriod)}`}
          </span>
          <span className="text-[#6B7280] font-mono text-[11px]">({currentPeriod})</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5 text-xs">
        {/* Toggle Filters Button */}
        {onToggleFilters && (
          <button
            onClick={onToggleFilters}
            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              isFiltersOpen
                ? 'border-[#3B82F6]/50 bg-[#3B82F6]/15 text-[#3B82F6]'
                : 'border-[#374151] bg-[#1F2937] text-[#9CA3AF] hover:text-[#F9FAFB] hover:border-[#4B5563]'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Filtros</span>
          </button>
        )}

        {/* Export Excel Button */}
        <button
          onClick={handleExportFilteredExcel}
          className="inline-flex items-center gap-1.5 rounded-md border border-[#374151] bg-[#1F2937] px-2.5 py-1.5 text-xs font-medium text-[#9CA3AF] hover:text-[#F9FAFB] hover:border-[#4B5563] transition-colors"
          title="Descargar libro Excel con las 3 hojas del período activo"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Exportar Excel</span>
        </button>

        {/* Supabase status badge */}
        <div
          className={`hidden sm:inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium ${
            supabaseConnected
              ? 'border-[#14B8A6]/40 bg-[#14B8A6]/10 text-[#14B8A6]'
              : 'border-[#374151] bg-[#1F2937] text-[#6B7280]'
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              supabaseConnected ? 'bg-[#14B8A6] animate-pulse' : 'bg-[#6B7280]'
            }`}
          />
          {supabaseConnected ? 'Supabase Sync' : 'Local'}
        </div>

        {/* User Role Badge */}
        <div
          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${
            currentUser.role === 'admin'
              ? 'border-[#3B82F6]/40 bg-[#3B82F6]/10 text-[#3B82F6]'
              : 'border-[#14B8A6]/40 bg-[#14B8A6]/10 text-[#14B8A6]'
          }`}
        >
          {currentUser.role === 'admin' ? (
            <Shield className="h-3.5 w-3.5 text-[#3B82F6]" />
          ) : (
            <Eye className="h-3.5 w-3.5 text-[#14B8A6]" />
          )}
          <span className="uppercase text-[10px] tracking-wider">
            {currentUser.role === 'admin' ? 'Admin' : 'Comercial'}
          </span>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="inline-flex items-center gap-1 rounded-md border border-[#374151] bg-[#1F2937] px-2.5 py-1 text-xs font-medium text-[#9CA3AF] hover:text-[#EF4444] hover:border-[#EF4444]/40 transition-colors"
          title="Cerrar Sesión"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Salir</span>
        </button>
      </div>
    </header>
  );
};
