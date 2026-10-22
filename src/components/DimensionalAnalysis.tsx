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
    <div className="space-y-4 font-mono text-xs">
      {/* Top Header & Dimension Tabs */}
      <div className="border border-[#242C37] bg-[#12161C] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#242C37]">
          <div>
            <div className="flex items-center gap-2 text-[10px] text-[#626D7C] uppercase tracking-wider">
              <span>MATRICES DE CONTRAPRESTACIÓN</span>
              <span>/</span>
              <span className="text-[#C5F467] font-bold">DESGLOSE DIMENSIONAL</span>
            </div>
            <h2 className="mt-1 text-base font-bold text-[#F1F5F9]">
              Análisis Cruzado de Objetivos, Facturación y Cobertura
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCurrentTable}
              className="inline-flex items-center gap-1.5 border border-[#242C37] bg-[#0B0D10] px-3 py-1.5 text-xs text-[#929EAD] hover:text-[#F1F5F9] hover:border-[#333D4D] transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-[#626D7C]" />
              Exportar Matriz (.xlsx)
            </button>
          </div>
        </div>

        {/* Tab Buttons & Search */}
        <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-[#0B0D10] border border-[#242C37] rounded-sm">
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
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
                    isActive
                      ? 'bg-[#191F27] text-[#C5F467] font-bold border border-[#333D4D]'
                      : 'text-[#929EAD] hover:text-[#F1F5F9]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                  <span className="text-[10px] text-[#626D7C]">({tab.count})</span>
                </button>
              );
            })}
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#626D7C]" />
            <input
              type="text"
              placeholder={`Filtrar en ${activeDimension}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-8 w-60 rounded-sm border border-[#242C37] bg-[#0B0D10] pl-8 pr-2 text-xs text-[#F1F5F9] placeholder:text-[#626D7C] focus:border-[#C5F467] focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="border border-[#242C37] bg-[#12161C] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-[#242C37] bg-[#0B0D10] text-[10px] font-bold text-[#626D7C] uppercase tracking-wider">
                <th
                  onClick={() => handleSort('nombre')}
                  className="py-3 px-3 cursor-pointer hover:text-[#F1F5F9]"
                >
                  <div className="flex items-center gap-1">
                    <span>{tabs.find(t => t.key === activeDimension)?.label.slice(0, -1) || 'Dimensión'}</span>
                    <ArrowUpDown className="h-3 w-3 text-[#626D7C]" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('realTon')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-[#F1F5F9]"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Ton Real / Meta</span>
                    <ArrowUpDown className="h-3 w-3 text-[#626D7C]" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('cumplimientoTon')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-[#F1F5F9]"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>% Ton</span>
                    <ArrowUpDown className="h-3 w-3 text-[#626D7C]" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('realFact')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-[#F1F5F9]"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Facturación Real (PYG)</span>
                    <ArrowUpDown className="h-3 w-3 text-[#626D7C]" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('objetivoFact')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-[#F1F5F9]"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Meta Presupuesto</span>
                    <ArrowUpDown className="h-3 w-3 text-[#626D7C]" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('cumplimientoFact')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-[#F1F5F9]"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>% Fact</span>
                    <ArrowUpDown className="h-3 w-3 text-[#626D7C]" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('deltaFact')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-[#F1F5F9]"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Brecha Monetaria</span>
                    <ArrowUpDown className="h-3 w-3 text-[#626D7C]" />
                  </div>
                </th>
                {!isProduct && (
                  <th
                    onClick={() => handleSort('cumplimientoCob')}
                    className="py-3 px-3 text-right cursor-pointer hover:text-[#F1F5F9]"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Cobertura (Cli / Obj)</span>
                      <ArrowUpDown className="h-3 w-3 text-[#626D7C]" />
                    </div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242C37]/60">
              {sortedData.length === 0 ? (
                <tr>
                  <td colSpan={isProduct ? 7 : 8} className="py-8 text-center text-[#626D7C]">
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
                      className="hover:bg-[#191F27]/60 transition-colors text-[#F1F5F9]"
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-[#F1F5F9]">{row.nombre}</div>
                        {row.subtexto && (
                          <div className="text-[10px] text-[#929EAD] font-sans">{row.subtexto}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[11px]">
                        <span className="font-bold text-[#F1F5F9]">{formatTons(row.realTon, 2)}</span>
                        <div className="text-[10px] text-[#626D7C]">Meta: {formatTons(row.objetivoTon, 2)}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`font-bold ${
                            row.cumplimientoTon === null
                              ? 'text-[#626D7C]'
                              : isTonGood
                              ? 'text-[#C5F467]'
                              : 'text-[#F59E0B]'
                          }`}
                        >
                          {formatPercent(row.cumplimientoTon)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#F1F5F9]">
                        {formatGuaranies(row.realFact)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#929EAD]">
                        {formatGuaranies(row.objetivoFact)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`font-bold ${
                            row.cumplimientoFact === null
                              ? 'text-[#626D7C]'
                              : isFactGood
                              ? 'text-[#C5F467]'
                              : (row.cumplimientoFact || 0) >= 90
                              ? 'text-[#F59E0B]'
                              : 'text-[#FB7185]'
                          }`}
                        >
                          {formatPercent(row.cumplimientoFact)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold">
                        <span
                          className={row.deltaFact >= 0 ? 'text-[#C5F467]' : 'text-[#FB7185]'}
                        >
                          {row.deltaFact >= 0 ? '+' : ''}{formatGuaranies(row.deltaFact, true)}
                        </span>
                      </td>
                      {!isProduct && (
                        <td className="py-2.5 px-3 text-right text-[11px]">
                          <div>
                            <span className="font-bold text-[#F1F5F9]">{row.clientesReal}</span>
                            <span className="text-[#626D7C]"> / {row.coberturaObj} cli</span>
                          </div>
                          <span
                            className={`text-[10px] font-bold ${
                              row.cumplimientoCob === null
                                ? 'text-[#626D7C]'
                                : isCobGood
                                ? 'text-[#C5F467]'
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
                <tr className="border-t-2 border-[#333D4D] bg-[#0B0D10] font-bold text-[#F1F5F9] text-xs">
                  <td className="py-3 px-3 uppercase tracking-wider text-[10px] text-[#626D7C]">
                    TOTALES CONSOLIDADOS ({sortedData.length})
                  </td>
                  <td className="py-3 px-3 text-right text-[11px]">
                    <div>{formatTons(totalRealTon, 2)}</div>
                    <div className="text-[10px] text-[#626D7C]">Meta: {formatTons(totalObjTon, 2)}</div>
                  </td>
                  <td className="py-3 px-3 text-right text-[#C5F467]">
                    {formatPercent(totalCumplTon)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-[#F1F5F9]">
                    {formatGuaranies(totalRealFact)}
                  </td>
                  <td className="py-3 px-3 text-right text-[#929EAD]">
                    {formatGuaranies(totalObjFact)}
                  </td>
                  <td className="py-3 px-3 text-right text-[#C5F467]">
                    {formatPercent(totalCumplFact)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold">
                    <span className={totalDeltaFact >= 0 ? 'text-[#C5F467]' : 'text-[#FB7185]'}>
                      {totalDeltaFact >= 0 ? '+' : ''}{formatGuaranies(totalDeltaFact, true)}
                    </span>
                  </td>
                  {!isProduct && (
                    <td className="py-3 px-3 text-right text-[11px]">
                      <div>{totalCliReal} / {totalCobObj} cli</div>
                      <div className="text-[#C5F467] text-[10px]">{formatPercent(totalCumplCob)}</div>
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
