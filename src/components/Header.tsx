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
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-[#242C37] bg-[#0B0D10]/95 px-4 backdrop-blur-xs sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 border border-[#242C37] text-[#929EAD] hover:text-[#F1F5F9] lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 font-mono text-xs">
          <Calendar className="h-3.5 w-3.5 text-[#626D7C]" />
          <span className="text-[#929EAD]">PERÍODO ACTIVO:</span>
          <span className="font-bold text-[#F1F5F9]">
            {currentPeriod === 'TODOS'
              ? 'TODOS LOS PERÍODOS'
              : `${formatPeriodDisplay(currentPeriod).toUpperCase()}`}
          </span>
          <span className="text-[#626D7C]">({currentPeriod})</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5 font-mono text-xs">
        {/* Toggle Filters Button */}
        {onToggleFilters && (
          <button
            onClick={onToggleFilters}
            className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs transition-colors ${
              isFiltersOpen
                ? 'border-[#C5F467]/40 bg-[#C5F467]/10 text-[#C5F467]'
                : 'border-[#242C37] bg-[#12161C] text-[#929EAD] hover:text-[#F1F5F9]'
            }`}
          >
            <Filter className="h-3 w-3" />
            <span className="hidden sm:inline">Panel de Filtros</span>
          </button>
        )}

        {/* Export Excel Button */}
        <button
          onClick={handleExportFilteredExcel}
          className="inline-flex items-center gap-1.5 border border-[#242C37] bg-[#12161C] px-2.5 py-1 text-xs text-[#929EAD] hover:text-[#F1F5F9] hover:border-[#333D4D] transition-colors"
          title="Descargar libro Excel con las 3 hojas del período activo"
        >
          <Download className="h-3 w-3" />
          <span className="hidden sm:inline">Exportar Excel</span>
        </button>

        {/* Supabase status badge */}
        <div
          className={`hidden sm:inline-flex items-center gap-1.5 border px-2 py-0.5 text-[10px] uppercase tracking-wider ${
            supabaseConnected
              ? 'border-[#C5F467]/40 bg-[#C5F467]/10 text-[#C5F467]'
              : 'border-[#242C37] bg-[#12161C] text-[#626D7C]'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              supabaseConnected ? 'bg-[#C5F467] animate-pulse' : 'bg-[#626D7C]'
            }`}
          />
          {supabaseConnected ? 'Supabase' : 'Local'}
        </div>

        {/* User Role Badge */}
        <div
          className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs font-bold ${
            currentUser.role === 'admin'
              ? 'border-[#C5F467]/40 bg-[#C5F467]/10 text-[#C5F467]'
              : 'border-[#38BDF8]/40 bg-[#38BDF8]/10 text-[#38BDF8]'
          }`}
        >
          {currentUser.role === 'admin' ? (
            <Shield className="h-3 w-3 text-[#C5F467]" />
          ) : (
            <Eye className="h-3 w-3 text-[#38BDF8]" />
          )}
          <span className="uppercase text-[10px] tracking-wider">
            {currentUser.role === 'admin' ? 'ADMIN' : 'COMERCIAL'}
          </span>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="inline-flex items-center gap-1 border border-[#242C37] bg-[#12161C] px-2 py-1 text-xs text-[#929EAD] hover:text-[#FB7185] hover:border-[#FB7185]/40 transition-colors"
          title="Cerrar Sesión"
        >
          <LogOut className="h-3 w-3" />
          <span className="hidden md:inline">Salir</span>
        </button>
      </div>
    </header>
  );
};
