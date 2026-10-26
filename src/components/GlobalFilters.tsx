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
    <div className="rounded-lg border border-[#374151] bg-[#1F2937] p-4 text-xs">
      {/* Top Bar: Title, Counters and Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#374151] pb-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#3B82F6]" />
          <span className="font-bold text-[#F9FAFB] tracking-tight">
            Filtros Multidimensionales
          </span>
          <span className="text-[#4B5563]">/</span>
          <span className="text-[#9CA3AF] font-mono text-[11px]">
            {totalRecordsMatching.ventas} ventas · {totalRecordsMatching.objetivos} obj · {totalRecordsMatching.cobertura} rutas
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isFiltered && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#EF4444]/30 bg-[#EF4444]/10 px-2.5 py-1 text-xs text-[#EF4444] hover:bg-[#EF4444]/20 transition-colors font-medium"
            >
              <RotateCcw className="h-3 w-3" />
              Restablecer
            </button>
          )}

          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Buscar dimensión o código..."
              value={filters.busqueda}
              onChange={e => onFilterChange({ ...filters, busqueda: e.target.value })}
              className="h-8 w-64 rounded-md border border-[#374151] bg-[#111827] pl-8 pr-2.5 text-xs text-[#F9FAFB] placeholder:text-[#6B7280] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Select Controls Row */}
      <div className="mt-3.5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* 1. Periodo */}
        <div>
          <label className="block text-[11px] font-medium text-[#9CA3AF] mb-1">
            Período
          </label>
          <select
            value={filters.periodo}
            onChange={e => onFilterChange({ ...filters, periodo: e.target.value })}
            className="w-full h-8 rounded-md border border-[#374151] bg-[#111827] px-2.5 text-xs text-[#F9FAFB] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] focus:outline-hidden cursor-pointer"
          >
            <option value="TODOS">Todos los períodos</option>
            {availablePeriods.map(p => (
              <option key={p} value={p}>
                {formatPeriodDisplay(p)} ({p})
              </option>
            ))}
          </select>
        </div>

        {/* 2. Zona */}
        <div>
          <label className="block text-[11px] font-medium text-[#9CA3AF] mb-1">
            Zona Territorial
          </label>
          <select
            value={filters.zona}
            onChange={e => onFilterChange({ ...filters, zona: e.target.value })}
            className="w-full h-8 rounded-md border border-[#374151] bg-[#111827] px-2.5 text-xs text-[#F9FAFB] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] focus:outline-hidden cursor-pointer"
          >
            <option value="TODAS">Todas las zonas</option>
            {availableZonas.map(z => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Supervisor */}
        <div>
          <label className="block text-[11px] font-medium text-[#9CA3AF] mb-1">
            Supervisor
          </label>
          <select
            value={filters.supervisor}
            onChange={e => onFilterChange({ ...filters, supervisor: e.target.value })}
            className="w-full h-8 rounded-md border border-[#374151] bg-[#111827] px-2.5 text-xs text-[#F9FAFB] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] focus:outline-hidden cursor-pointer"
          >
            <option value="TODOS">Todos los supervisores</option>
            {availableSupervisores.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Código Ruta */}
        <div>
          <label className="block text-[11px] font-medium text-[#9CA3AF] mb-1">
            Código de Ruta
          </label>
          <select
            value={filters.codigoRuta}
            onChange={e => onFilterChange({ ...filters, codigoRuta: e.target.value })}
            className="w-full h-8 rounded-md border border-[#374151] bg-[#111827] px-2.5 text-xs text-[#F9FAFB] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] focus:outline-hidden cursor-pointer"
          >
            <option value="TODAS">Todas las rutas</option>
            {availableRutas.map(r => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* 5. Producto */}
        <div>
          <label className="block text-[11px] font-medium text-[#9CA3AF] mb-1">
            Línea de Producto
          </label>
          <select
            value={filters.producto}
            onChange={e => onFilterChange({ ...filters, producto: e.target.value })}
            className="w-full h-8 rounded-md border border-[#374151] bg-[#111827] px-2.5 text-xs text-[#F9FAFB] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] focus:outline-hidden cursor-pointer"
          >
            <option value="TODOS">Todas las líneas</option>
            {availableProductos.map(p => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* 6. Vendedor */}
        <div>
          <label className="block text-[11px] font-medium text-[#9CA3AF] mb-1">
            Vendedor
          </label>
          <select
            value={filters.vendedor}
            onChange={e => onFilterChange({ ...filters, vendedor: e.target.value })}
            className="w-full h-8 rounded-md border border-[#374151] bg-[#111827] px-2.5 text-xs text-[#F9FAFB] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] focus:outline-hidden cursor-pointer"
          >
            <option value="TODOS">Todos los vendedores</option>
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
        <div className="mt-3.5 flex flex-wrap items-center gap-2 pt-3 border-t border-[#374151] text-xs">
          <span className="text-[#9CA3AF] font-medium text-[11px]">Filtros activos:</span>
          {filters.periodo !== 'TODOS' && (
            <button
              onClick={() => removeFilter('periodo')}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#374151] bg-[#111827] px-2.5 py-1 text-[#F9FAFB] hover:border-[#EF4444] hover:text-[#EF4444] transition-colors"
            >
              <span>Mes: {formatPeriodDisplay(filters.periodo)}</span>
              <X className="h-3.5 w-3.5 text-[#6B7280]" />
            </button>
          )}
          {filters.zona !== 'TODAS' && (
            <button
              onClick={() => removeFilter('zona')}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#374151] bg-[#111827] px-2.5 py-1 text-[#F9FAFB] hover:border-[#EF4444] hover:text-[#EF4444] transition-colors"
            >
              <span>Zona: {filters.zona}</span>
              <X className="h-3.5 w-3.5 text-[#6B7280]" />
            </button>
          )}
          {filters.supervisor !== 'TODOS' && (
            <button
              onClick={() => removeFilter('supervisor')}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#374151] bg-[#111827] px-2.5 py-1 text-[#F9FAFB] hover:border-[#EF4444] hover:text-[#EF4444] transition-colors"
            >
              <span>Supervisor: {filters.supervisor}</span>
              <X className="h-3.5 w-3.5 text-[#6B7280]" />
            </button>
          )}
          {filters.codigoRuta !== 'TODAS' && (
            <button
              onClick={() => removeFilter('codigoRuta')}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#374151] bg-[#111827] px-2.5 py-1 text-[#F9FAFB] hover:border-[#EF4444] hover:text-[#EF4444] transition-colors"
            >
              <span>Ruta: {filters.codigoRuta}</span>
              <X className="h-3.5 w-3.5 text-[#6B7280]" />
            </button>
          )}
          {filters.producto !== 'TODOS' && (
            <button
              onClick={() => removeFilter('producto')}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#374151] bg-[#111827] px-2.5 py-1 text-[#F9FAFB] hover:border-[#EF4444] hover:text-[#EF4444] transition-colors"
            >
              <span>Línea: {filters.producto}</span>
              <X className="h-3.5 w-3.5 text-[#6B7280]" />
            </button>
          )}
          {filters.vendedor !== 'TODOS' && (
            <button
              onClick={() => removeFilter('vendedor')}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#374151] bg-[#111827] px-2.5 py-1 text-[#F9FAFB] hover:border-[#EF4444] hover:text-[#EF4444] transition-colors"
            >
              <span>Vendedor: {filters.vendedor}</span>
              <X className="h-3.5 w-3.5 text-[#6B7280]" />
            </button>
          )}
          {filters.busqueda && (
            <button
              onClick={() => removeFilter('busqueda')}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#374151] bg-[#111827] px-2.5 py-1 text-[#F9FAFB] hover:border-[#EF4444] hover:text-[#EF4444] transition-colors"
            >
              <span>Búsqueda: "{filters.busqueda}"</span>
              <X className="h-3.5 w-3.5 text-[#6B7280]" />
            </button>
          )}
        </div>
      )}

      {/* Informative granularity notice */}
      {filters.producto !== 'TODOS' && (
        <div className="mt-3 flex items-center gap-2.5 rounded-md border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-3 py-2 text-xs text-[#F59E0B]">
          <Info className="h-4 w-4 shrink-0" />
          <span>
            Granularidad de cobertura: DB_Cobertura mide clientes por ruta sin desglose por producto. La cobertura se calcula a nivel de ruta y vendedor.
          </span>
        </div>
      )}
    </div>
  );
};
