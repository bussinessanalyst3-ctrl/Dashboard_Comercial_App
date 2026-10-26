import React, { useState } from 'react';
import { DimensionAggregation } from '../types/commercial';
import {
  formatGuaranies,
  formatTons,
  formatPercent,
  formatInteger
} from '../services/dataNormalizer';
import {
  ArrowUpDown,
  Search,
  Download,
  Building2,
  UserCheck,
  Truck,
  Package,
  Users
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface DimensionalAnalysisProps {
  zoneAggs: DimensionAggregation[];
  supervisorAggs: DimensionAggregation[];
  routeAggs: DimensionAggregation[];
  productAggs: DimensionAggregation[];
  vendorAggs: DimensionAggregation[];
}

type TabKey = 'zona' | 'supervisor' | 'ruta' | 'producto' | 'vendedor';

export const DimensionalAnalysis: React.FC<DimensionalAnalysisProps> = ({
  zoneAggs,
  supervisorAggs,
  routeAggs,
  productAggs,
  vendorAggs
}) => {
  const [activeDimension, setActiveDimension] = useState<TabKey>('zona');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof DimensionAggregation>('realFact');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const tabs = [
    { key: 'zona' as TabKey, label: 'Zonas', icon: Building2, count: zoneAggs.length },
    { key: 'supervisor' as TabKey, label: 'Supervisores', icon: UserCheck, count: supervisorAggs.length },
    { key: 'ruta' as TabKey, label: 'Rutas', icon: Truck, count: routeAggs.length },
    { key: 'producto' as TabKey, label: 'Productos', icon: Package, count: productAggs.length },
    { key: 'vendedor' as TabKey, label: 'Vendedores', icon: Users, count: vendorAggs.length }
  ];

  const getData = (): DimensionAggregation[] => {
    switch (activeDimension) {
      case 'zona':
        return zoneAggs;
      case 'supervisor':
        return supervisorAggs;
      case 'ruta':
        return routeAggs;
      case 'producto':
        return productAggs;
      case 'vendedor':
        return vendorAggs;
    }
  };

  const rawData = getData();

  const filteredData = rawData.filter(d => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.nombre.toLowerCase().includes(q) ||
      (d.subtexto && d.subtexto.toLowerCase().includes(q))
    );
  });

  const sortedData = [...filteredData].sort((a, b) => {
    const valA = a[sortField] ?? 0;
    const valB = b[sortField] ?? 0;
    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortOrder === 'asc' ? (Number(valA) - Number(valB)) : (Number(valB) - Number(valA));
  });

  const handleSort = (field: keyof DimensionAggregation) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Grand totals strictly from sums
  const totalObjTon = sortedData.reduce((acc, r) => acc + r.objetivoTon, 0);
  const totalRealTon = sortedData.reduce((acc, r) => acc + r.realTon, 0);
  const totalCumplTon = totalObjTon > 0 ? (totalRealTon / totalObjTon) * 100 : null;
  const totalDeltaTon = totalRealTon - totalObjTon;

  const totalObjFact = sortedData.reduce((acc, r) => acc + r.objetivoFact, 0);
  const totalRealFact = sortedData.reduce((acc, r) => acc + r.realFact, 0);
  const totalCumplFact = totalObjFact > 0 ? (totalRealFact / totalObjFact) * 100 : null;
  const totalDeltaFact = totalRealFact - totalObjFact;

  const isProduct = activeDimension === 'producto';
  const totalCobObj = isProduct ? 0 : sortedData.reduce((acc, r) => acc + r.coberturaObj, 0);
  const totalCliReal = isProduct ? 0 : sortedData.reduce((acc, r) => acc + r.clientesReal, 0);
  const totalCumplCob = !isProduct && totalCobObj > 0 ? (totalCliReal / totalCobObj) * 100 : null;

  const exportCurrentTable = () => {
    const exportRows = sortedData.map(d => ({
      Dimensión: d.nombre,
      Referencia: d.subtexto || '',
      'Objetivo Toneladas': d.objetivoTon,
      'Real Toneladas': d.realTon,
      'Cumplimiento Ton %': d.cumplimientoTon ? d.cumplimientoTon.toFixed(2) : 'N/D',
      'Diferencia Toneladas': d.deltaTon,
      'Objetivo Facturación (PYG)': d.objetivoFact,
      'Real Facturación (PYG)': d.realFact,
      'Cumplimiento Fact %': d.cumplimientoFact ? d.cumplimientoFact.toFixed(2) : 'N/D',
      'Diferencia Facturación': d.deltaFact,
      'Cobertura Planificada': isProduct ? 'N/A' : d.coberturaObj,
      'Clientes Reales': isProduct ? 'N/A' : d.clientesReal,
      'Cumplimiento Cobertura %': isProduct ? 'N/A' : (d.cumplimientoCob ? d.cumplimientoCob.toFixed(2) : 'N/D')
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Analisis_${activeDimension.toUpperCase()}`);
    XLSX.writeFile(wb, `Analisis_${activeDimension}_${Date.now()}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Dimension Tabs */}
      <div className="rounded-lg border border-[#374151] bg-[#1F2937] p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#374151]">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
              <span>MATRICES DE CONTRAPRESTACIÓN</span>
              <span>/</span>
              <span className="text-[#3B82F6] font-bold">DESGLOSE DIMENSIONAL</span>
            </div>
            <h2 className="mt-1 text-base font-bold text-[#F9FAFB]">
              Análisis Cruzado de Objetivos, Facturación y Cobertura
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCurrentTable}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#374151] bg-[#111827] px-3 py-1.5 text-xs font-semibold text-[#D1D5DB] hover:text-[#F9FAFB] hover:border-[#4B5563] transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-[#9CA3AF]" />
              Exportar Matriz (.xlsx)
            </button>
          </div>
        </div>

        {/* Tab Buttons & Search */}
        <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-[#111827] border border-[#374151] rounded-lg">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeDimension === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveDimension(tab.key);
                    setSearchQuery('');
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#3B82F6] text-white shadow-xs'
                      : 'text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#1F2937]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                  <span className={`text-[10px] ${isActive ? 'text-blue-100' : 'text-[#6B7280]'}`}>({tab.count})</span>
                </button>
              );
            })}
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder={`Filtrar en ${activeDimension}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-9 w-60 rounded-md border border-[#374151] bg-[#111827] pl-8 pr-3 text-xs text-[#F9FAFB] placeholder:text-[#6B7280] focus:border-[#3B82F6] focus:outline-hidden focus:ring-1 focus:ring-[#3B82F6]"
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-lg border border-[#374151] bg-[#1F2937] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#374151] bg-[#111827] text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                <th
                  onClick={() => handleSort('nombre')}
                  className="py-3 px-3 cursor-pointer hover:text-[#F9FAFB]"
                >
                  <div className="flex items-center gap-1">
                    <span>{tabs.find(t => t.key === activeDimension)?.label.slice(0, -1) || 'Dimensión'}</span>
                    <ArrowUpDown className="h-3 w-3 text-[#6B7280]" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('realTon')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-[#F9FAFB]"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Ton Real / Meta</span>
                    <ArrowUpDown className="h-3 w-3 text-[#6B7280]" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('cumplimientoTon')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-[#F9FAFB]"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>% Ton</span>
                    <ArrowUpDown className="h-3 w-3 text-[#6B7280]" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('realFact')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-[#F9FAFB]"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Facturación Real (PYG)</span>
                    <ArrowUpDown className="h-3 w-3 text-[#6B7280]" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('objetivoFact')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-[#F9FAFB]"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Meta Presupuesto</span>
                    <ArrowUpDown className="h-3 w-3 text-[#6B7280]" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('cumplimientoFact')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-[#F9FAFB]"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>% Fact</span>
                    <ArrowUpDown className="h-3 w-3 text-[#6B7280]" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('deltaFact')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-[#F9FAFB]"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Brecha Monetaria</span>
                    <ArrowUpDown className="h-3 w-3 text-[#6B7280]" />
                  </div>
                </th>
                {!isProduct && (
                  <th
                    onClick={() => handleSort('cumplimientoCob')}
                    className="py-3 px-3 text-right cursor-pointer hover:text-[#F9FAFB]"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Cobertura (Cli / Obj)</span>
                      <ArrowUpDown className="h-3 w-3 text-[#6B7280]" />
                    </div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#374151]">
              {sortedData.length === 0 ? (
                <tr>
                  <td colSpan={isProduct ? 7 : 8} className="py-8 text-center text-[#9CA3AF]">
                    No se encontraron registros para los filtros aplicados.
                  </td>
                </tr>
              ) : (
                sortedData.map(row => {
                  const isTonGood = (row.cumplimientoTon || 0) >= 100;
                  const isFactGood = (row.cumplimientoFact || 0) >= 100;
                  const isCobGood = (row.cumplimientoCob || 0) >= 90;

                  return (
                    <tr
                      key={row.clave}
                      className="hover:bg-[#111827]/60 transition-colors text-[#F9FAFB]"
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-[#F9FAFB]">{row.nombre}</div>
                        {row.subtexto && (
                          <div className="text-[10px] text-[#9CA3AF]">{row.subtexto}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[11px] font-mono tabular-nums">
                        <span className="font-semibold text-[#F9FAFB]">{formatTons(row.realTon, 2)}</span>
                        <div className="text-[10px] text-[#9CA3AF]">Meta: {formatTons(row.objetivoTon, 2)}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        <span
                          className={`font-semibold ${
                            row.cumplimientoTon === null
                              ? 'text-[#6B7280]'
                              : isTonGood
                              ? 'text-[#14B8A6]'
                              : 'text-[#F59E0B]'
                          }`}
                        >
                          {formatPercent(row.cumplimientoTon)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-[#F9FAFB] font-mono tabular-nums">
                        {formatGuaranies(row.realFact)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#9CA3AF] font-mono tabular-nums">
                        {formatGuaranies(row.objetivoFact)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        <span
                          className={`font-semibold ${
                            row.cumplimientoFact === null
                              ? 'text-[#6B7280]'
                              : isFactGood
                              ? 'text-[#14B8A6]'
                              : (row.cumplimientoFact || 0) >= 90
                              ? 'text-[#F59E0B]'
                              : 'text-[#EF4444]'
                          }`}
                        >
                          {formatPercent(row.cumplimientoFact)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold font-mono tabular-nums">
                        <span
                          className={row.deltaFact >= 0 ? 'text-[#14B8A6]' : 'text-[#EF4444]'}
                        >
                          {row.deltaFact >= 0 ? '+' : ''}{formatGuaranies(row.deltaFact, true)}
                        </span>
                      </td>
                      {!isProduct && (
                        <td className="py-2.5 px-3 text-right text-[11px] font-mono tabular-nums">
                          <div>
                            <span className="font-semibold text-[#F9FAFB]">{row.clientesReal}</span>
                            <span className="text-[#9CA3AF]"> / {row.coberturaObj} cli</span>
                          </div>
                          <span
                            className={`text-[10px] font-semibold ${
                              row.cumplimientoCob === null
                                ? 'text-[#6B7280]'
                                : isCobGood
                                ? 'text-[#14B8A6]'
                                : 'text-[#F59E0B]'
                            }`}
                          >
                            {formatPercent(row.cumplimientoCob)}
                          </span>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Grand Totals Footer */}
            {sortedData.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-[#374151] bg-[#111827] font-semibold text-[#F9FAFB] text-xs">
                  <td className="py-3 px-3 uppercase tracking-wider text-[10px] text-[#9CA3AF]">
                    TOTALES CONSOLIDADOS ({sortedData.length})
                  </td>
                  <td className="py-3 px-3 text-right text-[11px] font-mono tabular-nums">
                    <div>{formatTons(totalRealTon, 2)}</div>
                    <div className="text-[10px] text-[#9CA3AF]">Meta: {formatTons(totalObjTon, 2)}</div>
                  </td>
                  <td className="py-3 px-3 text-right text-[#14B8A6] font-mono tabular-nums">
                    {formatPercent(totalCumplTon)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-[#F9FAFB] font-mono tabular-nums">
                    {formatGuaranies(totalRealFact)}
                  </td>
                  <td className="py-3 px-3 text-right text-[#9CA3AF] font-mono tabular-nums">
                    {formatGuaranies(totalObjFact)}
                  </td>
                  <td className="py-3 px-3 text-right text-[#14B8A6] font-mono tabular-nums">
                    {formatPercent(totalCumplFact)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold font-mono tabular-nums">
                    <span className={totalDeltaFact >= 0 ? 'text-[#14B8A6]' : 'text-[#EF4444]'}>
                      {totalDeltaFact >= 0 ? '+' : ''}{formatGuaranies(totalDeltaFact, true)}
                    </span>
                  </td>
                  {!isProduct && (
                    <td className="py-3 px-3 text-right text-[11px] font-mono tabular-nums">
                      <div>{totalCliReal} / {totalCobObj} cli</div>
                      <div className="text-[#14B8A6] text-[10px]">{formatPercent(totalCumplCob)}</div>
                    </td>
                  )}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
