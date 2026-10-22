import React from 'react';
import { FilterState } from '../types/commercial';
import { formatPeriodDisplay } from '../services/dataNormalizer';
import { RotateCcw, Search, Filter, Info, X } from 'lucide-react';

interface GlobalFiltersProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  availablePeriods: string[];
  availableZonas: string[];
  availableSupervisores: string[];
  availableRutas: string[];
  availableProductos: string[];
  availableVendedores: string[];
  totalRecordsMatching: {
    ventas: number;
    objetivos: number;
    cobertura: number;
  };
}

export const GlobalFilters: React.FC<GlobalFiltersProps> = ({
  filters,
  onFilterChange,
  availablePeriods,
  availableZonas,
  availableSupervisores,
  availableRutas,
  availableProductos,
  availableVendedores,
  totalRecordsMatching
}) => {
  const handleReset = () => {
    onFilterChange({
      periodo: availablePeriods.includes('sept-26') ? 'sept-26' : availablePeriods[0] || 'TODOS',
      zona: 'TODAS',
      supervisor: 'TODOS',
      codigoRuta: 'TODAS',
      producto: 'TODOS',
      vendedor: 'TODOS',
      busqueda: ''
    });
  };

  const isFiltered =
    (filters.periodo !== 'sept-26' && filters.periodo !== 'TODOS') ||
    filters.zona !== 'TODAS' ||
    filters.supervisor !== 'TODOS' ||
    filters.codigoRuta !== 'TODAS' ||
    filters.producto !== 'TODOS' ||
    filters.vendedor !== 'TODOS' ||
    filters.busqueda.trim() !== '';

  const removeFilter = (key: keyof FilterState) => {
    if (key === 'periodo') {
      onFilterChange({ ...filters, periodo: 'TODOS' });
    } else if (key === 'busqueda') {
      onFilterChange({ ...filters, busqueda: '' });
    } else {
      onFilterChange({
        ...filters,
        [key]: key === 'zona' || key === 'codigoRuta' ? 'TODAS' : 'TODOS'
      });
    }
  };

  return (
    <div className="border border-[#242C37] bg-[#12161C] p-4 font-mono text-xs">
      {/* Top Bar: Title, Counters and Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#242C37] pb-3">
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-[#C5F467]" />
          <span className="font-extrabold uppercase tracking-wider text-[#F1F5F9]">
            FILTROS MULTIDIMENSIONALES
          </span>
          <span className="text-[#333D4D]">/</span>
          <span className="text-[#929EAD]">
            {totalRecordsMatching.ventas} ventas · {totalRecordsMatching.objetivos} obj · {totalRecordsMatching.cobertura} rutas
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isFiltered && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 border border-[#FB7185]/30 bg-[#FB7185]/10 px-2.5 py-1 text-xs text-[#FB7185] hover:bg-[#FB7185]/20 transition-colors font-bold"
            >
              <RotateCcw className="h-3 w-3" />
              Restablecer
            </button>
          )}

          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#626D7C]" />
            <input
              type="text"
              placeholder="Buscar en dimensiones..."
              value={filters.busqueda}
              onChange={e => onFilterChange({ ...filters, busqueda: e.target.value })}
              className="h-7 w-60 rounded-sm border border-[#242C37] bg-[#0B0D10] pl-8 pr-2 text-xs text-[#F1F5F9] placeholder:text-[#626D7C] focus:border-[#C5F467] focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Select Controls Row */}
      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {/* 1. Periodo */}
        <div>
          <label className="block text-[10px] text-[#626D7C] uppercase tracking-wider mb-1">
            PERÍODO
          </label>
          <select
            value={filters.periodo}
            onChange={e => onFilterChange({ ...filters, periodo: e.target.value })}
            className="w-full h-7 rounded-sm border border-[#242C37] bg-[#0B0D10] px-2 text-xs text-[#F1F5F9] font-mono focus:border-[#C5F467] focus:outline-hidden"
          >
            <option value="TODOS">TODOS LOS PERÍODOS</option>
            {availablePeriods.map(p => (
              <option key={p} value={p}>
                {formatPeriodDisplay(p).toUpperCase()} ({p})
              </option>
            ))}
          </select>
        </div>

        {/* 2. Zona */}
        <div>
          <label className="block text-[10px] text-[#626D7C] uppercase tracking-wider mb-1">
            ZONA
          </label>
          <select
            value={filters.zona}
            onChange={e => onFilterChange({ ...filters, zona: e.target.value })}
            className="w-full h-7 rounded-sm border border-[#242C37] bg-[#0B0D10] px-2 text-xs text-[#F1F5F9] font-mono focus:border-[#C5F467] focus:outline-hidden"
          >
            <option value="TODAS">TODAS LAS ZONAS</option>
            {availableZonas.map(z => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Supervisor */}
        <div>
          <label className="block text-[10px] text-[#626D7C] uppercase tracking-wider mb-1">
            SUPERVISOR
          </label>
          <select
            value={filters.supervisor}
            onChange={e => onFilterChange({ ...filters, supervisor: e.target.value })}
            className="w-full h-7 rounded-sm border border-[#242C37] bg-[#0B0D10] px-2 text-xs text-[#F1F5F9] font-mono focus:border-[#C5F467] focus:outline-hidden"
          >
            <option value="TODOS">TODOS LOS SUPERVISORES</option>
            {availableSupervisores.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Código Ruta */}
        <div>
          <label className="block text-[10px] text-[#626D7C] uppercase tracking-wider mb-1">
            CÓDIGO DE RUTA
          </label>
          <select
            value={filters.codigoRuta}
            onChange={e => onFilterChange({ ...filters, codigoRuta: e.target.value })}
            className="w-full h-7 rounded-sm border border-[#242C37] bg-[#0B0D10] px-2 text-xs text-[#F1F5F9] font-mono focus:border-[#C5F467] focus:outline-hidden"
          >
            <option value="TODAS">TODAS LAS RUTAS</option>
            {availableRutas.map(r => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* 5. Producto */}
        <div>
          <label className="block text-[10px] text-[#626D7C] uppercase tracking-wider mb-1">
            LÍNEA PRODUCTO
          </label>
          <select
            value={filters.producto}
            onChange={e => onFilterChange({ ...filters, producto: e.target.value })}
            className="w-full h-7 rounded-sm border border-[#242C37] bg-[#0B0D10] px-2 text-xs text-[#F1F5F9] font-mono focus:border-[#C5F467] focus:outline-hidden"
          >
            <option value="TODOS">TODAS LAS LÍNEAS</option>
            {availableProductos.map(p => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* 6. Vendedor */}
        <div>
          <label className="block text-[10px] text-[#626D7C] uppercase tracking-wider mb-1">
            VENDEDOR
          </label>
          <select
            value={filters.vendedor}
            onChange={e => onFilterChange({ ...filters, vendedor: e.target.value })}
            className="w-full h-7 rounded-sm border border-[#242C37] bg-[#0B0D10] px-2 text-xs text-[#F1F5F9] font-mono focus:border-[#C5F467] focus:outline-hidden"
          >
            <option value="TODOS">TODOS LOS VENDEDORES</option>
            {availableVendedores.map(v => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filter Indicators */}
      {isFiltered && (
        <div className="mt-3 flex flex-wrap items-center gap-2 pt-2.5 border-t border-[#242C37] text-[11px]">
          <span className="text-[#626D7C]">FILTROS ACTIVOS:</span>
          {filters.periodo !== 'TODOS' && (
            <button
              onClick={() => removeFilter('periodo')}
              className="inline-flex items-center gap-1 border border-[#242C37] bg-[#0B0D10] px-2 py-0.5 text-[#F1F5F9] hover:border-[#FB7185] transition-colors"
            >
              <span>Mes: {formatPeriodDisplay(filters.periodo)}</span>
              <X className="h-3 w-3 text-[#626D7C]" />
            </button>
          )}
          {filters.zona !== 'TODAS' && (
            <button
              onClick={() => removeFilter('zona')}
              className="inline-flex items-center gap-1 border border-[#242C37] bg-[#0B0D10] px-2 py-0.5 text-[#F1F5F9] hover:border-[#FB7185] transition-colors"
            >
              <span>Zona: {filters.zona}</span>
              <X className="h-3 w-3 text-[#626D7C]" />
            </button>
          )}
          {filters.supervisor !== 'TODOS' && (
            <button
              onClick={() => removeFilter('supervisor')}
              className="inline-flex items-center gap-1 border border-[#242C37] bg-[#0B0D10] px-2 py-0.5 text-[#F1F5F9] hover:border-[#FB7185] transition-colors"
            >
              <span>Sup: {filters.supervisor}</span>
              <X className="h-3 w-3 text-[#626D7C]" />
            </button>
          )}
          {filters.codigoRuta !== 'TODAS' && (
            <button
              onClick={() => removeFilter('codigoRuta')}
              className="inline-flex items-center gap-1 border border-[#242C37] bg-[#0B0D10] px-2 py-0.5 text-[#F1F5F9] hover:border-[#FB7185] transition-colors"
            >
              <span>Ruta: {filters.codigoRuta}</span>
              <X className="h-3 w-3 text-[#626D7C]" />
            </button>
          )}
          {filters.producto !== 'TODOS' && (
            <button
              onClick={() => removeFilter('producto')}
              className="inline-flex items-center gap-1 border border-[#242C37] bg-[#0B0D10] px-2 py-0.5 text-[#F1F5F9] hover:border-[#FB7185] transition-colors"
            >
              <span>Línea: {filters.producto}</span>
              <X className="h-3 w-3 text-[#626D7C]" />
            </button>
          )}
          {filters.vendedor !== 'TODOS' && (
            <button
              onClick={() => removeFilter('vendedor')}
              className="inline-flex items-center gap-1 border border-[#242C37] bg-[#0B0D10] px-2 py-0.5 text-[#F1F5F9] hover:border-[#FB7185] transition-colors"
            >
              <span>Vendedor: {filters.vendedor}</span>
              <X className="h-3 w-3 text-[#626D7C]" />
            </button>
          )}
          {filters.busqueda && (
            <button
              onClick={() => removeFilter('busqueda')}
              className="inline-flex items-center gap-1 border border-[#242C37] bg-[#0B0D10] px-2 py-0.5 text-[#F1F5F9] hover:border-[#FB7185] transition-colors"
            >
              <span>Búsqueda: "{filters.busqueda}"</span>
              <X className="h-3 w-3 text-[#626D7C]" />
            </button>
          )}
        </div>
      )}

      {/* Informative granularity notice */}
      {filters.producto !== 'TODOS' && (
        <div className="mt-2.5 flex items-center gap-2 border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-3 py-1.5 text-[11px] text-[#F59E0B]">
          <Info className="h-3.5 w-3.5 shrink-0" />
          <span>
            Granularidad de cobertura: DB_Cobertura mide clientes por ruta sin desglose por producto. La cobertura se calcula a nivel de ruta y vendedor.
          </span>
        </div>
      )}
    </div>
  );
};
