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
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
      {/* Top Filter Bar: Period and Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Filtros Globales
          </span>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs text-slate-500">
            {totalRecordsMatching.ventas} ventas · {totalRecordsMatching.objetivos} objetivos · {totalRecordsMatching.cobertura} rutas cobertura
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isFiltered && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
              Restablecer Filtros
            </button>
          )}

          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar zona, supervisor, ruta, vendedor, producto..."
              value={filters.busqueda}
              onChange={e => onFilterChange({ ...filters, busqueda: e.target.value })}
              className="h-8 w-64 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Select Controls Row */}
      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {/* 1. Periodo */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Período (Mes)
          </label>
          <select
            value={filters.periodo}
            onChange={e => onFilterChange({ ...filters, periodo: e.target.value })}
            className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 font-medium focus:border-slate-900 focus:outline-hidden"
          >
            <option value="TODOS">Todos los Períodos</option>
            {availablePeriods.map(p => (
              <option key={p} value={p}>
                {formatPeriodDisplay(p)} ({p})
              </option>
            ))}
          </select>
        </div>

        {/* 2. Zona */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Zona
          </label>
          <select
            value={filters.zona}
            onChange={e => onFilterChange({ ...filters, zona: e.target.value })}
            className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 font-medium focus:border-slate-900 focus:outline-hidden"
          >
            <option value="TODAS">Todas las Zonas</option>
            {availableZonas.map(z => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Supervisor */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Supervisor
          </label>
          <select
            value={filters.supervisor}
            onChange={e => onFilterChange({ ...filters, supervisor: e.target.value })}
            className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 font-medium focus:border-slate-900 focus:outline-hidden"
          >
            <option value="TODOS">Todos los Supervisores</option>
            {availableSupervisores.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Código Ruta */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Código de Ruta
          </label>
          <select
            value={filters.codigoRuta}
            onChange={e => onFilterChange({ ...filters, codigoRuta: e.target.value })}
            className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 font-medium focus:border-slate-900 focus:outline-hidden"
          >
            <option value="TODAS">Todas las Rutas</option>
            {availableRutas.map(r => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* 5. Producto */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Producto
          </label>
          <select
            value={filters.producto}
            onChange={e => onFilterChange({ ...filters, producto: e.target.value })}
            className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 font-medium focus:border-slate-900 focus:outline-hidden"
          >
            <option value="TODOS">Todos los Productos</option>
            {availableProductos.map(p => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* 6. Vendedor */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Vendedor
          </label>
          <select
            value={filters.vendedor}
            onChange={e => onFilterChange({ ...filters, vendedor: e.target.value })}
            className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 font-medium focus:border-slate-900 focus:outline-hidden"
          >
            <option value="TODOS">Todos los Vendedores</option>
            {availableVendedores.map(v => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filter Chips / Indicators */}
      {isFiltered && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-medium">Filtros aplicados:</span>
          {filters.periodo !== 'TODOS' && (
            <button
              onClick={() => removeFilter('periodo')}
              className="inline-flex items-center gap-1 rounded-md bg-slate-100 hover:bg-slate-200 px-2 py-0.5 text-slate-700 font-medium transition-colors"
            >
              <span>Mes: {formatPeriodDisplay(filters.periodo)}</span>
              <X className="h-3 w-3 text-slate-400" />
            </button>
          )}
          {filters.zona !== 'TODAS' && (
            <button
              onClick={() => removeFilter('zona')}
              className="inline-flex items-center gap-1 rounded-md bg-slate-100 hover:bg-slate-200 px-2 py-0.5 text-slate-700 font-medium transition-colors"
            >
              <span>Zona: {filters.zona}</span>
              <X className="h-3 w-3 text-slate-400" />
            </button>
          )}
          {filters.supervisor !== 'TODOS' && (
            <button
              onClick={() => removeFilter('supervisor')}
              className="inline-flex items-center gap-1 rounded-md bg-slate-100 hover:bg-slate-200 px-2 py-0.5 text-slate-700 font-medium transition-colors"
            >
              <span>Sup: {filters.supervisor}</span>
              <X className="h-3 w-3 text-slate-400" />
            </button>
          )}
          {filters.codigoRuta !== 'TODAS' && (
            <button
              onClick={() => removeFilter('codigoRuta')}
              className="inline-flex items-center gap-1 rounded-md bg-slate-100 hover:bg-slate-200 px-2 py-0.5 text-slate-700 font-medium transition-colors"
            >
              <span>Ruta: {filters.codigoRuta}</span>
              <X className="h-3 w-3 text-slate-400" />
            </button>
          )}
          {filters.producto !== 'TODOS' && (
            <button
              onClick={() => removeFilter('producto')}
              className="inline-flex items-center gap-1 rounded-md bg-slate-100 hover:bg-slate-200 px-2 py-0.5 text-slate-700 font-medium transition-colors"
            >
              <span>Producto: {filters.producto}</span>
              <X className="h-3 w-3 text-slate-400" />
            </button>
          )}
          {filters.vendedor !== 'TODOS' && (
            <button
              onClick={() => removeFilter('vendedor')}
              className="inline-flex items-center gap-1 rounded-md bg-slate-100 hover:bg-slate-200 px-2 py-0.5 text-slate-700 font-medium transition-colors"
            >
              <span>Vendedor: {filters.vendedor}</span>
              <X className="h-3 w-3 text-slate-400" />
            </button>
          )}
          {filters.busqueda && (
            <button
              onClick={() => removeFilter('busqueda')}
              className="inline-flex items-center gap-1 rounded-md bg-slate-100 hover:bg-slate-200 px-2 py-0.5 text-slate-700 font-medium transition-colors"
            >
              <span>Búsqueda: "{filters.busqueda}"</span>
              <X className="h-3 w-3 text-slate-400" />
            </button>
          )}
        </div>
      )}

      {/* Informative granularity callout if product filter is selected */}
      {filters.producto !== 'TODOS' && (
        <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200/60 px-3 py-2 text-[11px] text-amber-900">
          <Info className="h-4 w-4 shrink-0 text-amber-600" />
          <span>
            <strong>Aviso de Granularidad:</strong> La fuente de <em>DB_Cobertura</em> registra clientes por ruta y vendedor sin dimensión de Producto. Al filtrar por producto específico, las métricas de cobertura planificada y real se muestran como N/A para evitar atribuciones artificiales.
          </span>
        </div>
      )}
    </div>
  );
};
