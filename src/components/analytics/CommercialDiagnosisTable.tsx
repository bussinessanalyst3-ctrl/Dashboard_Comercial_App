import React, { useState } from 'react';
import { DimensionAggregation, HistoricalPoint } from '../../types/commercial';
import {
  formatGuaranies,
  formatTons,
  formatPercent
} from '../../services/dataNormalizer';
import {
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  Layers
} from 'lucide-react';

interface CommercialDiagnosisTableProps {
  routeAggs: DimensionAggregation[];
  productAggs: DimensionAggregation[];
  supervisorAggs: DimensionAggregation[];
  onSelectRoute: (routeCode: string) => void;
  onSelectProduct: (productName: string) => void;
  onSelectSupervisor: (supName: string) => void;
}

type DiagnosisView = 'rutas-brecha' | 'rutas-lideres' | 'productos' | 'supervisores';

export const CommercialDiagnosisTable: React.FC<CommercialDiagnosisTableProps> = ({
  routeAggs,
  productAggs,
  supervisorAggs,
  onSelectRoute,
  onSelectProduct,
  onSelectSupervisor
}) => {
  const [activeView, setActiveView] = useState<DiagnosisView>('rutas-brecha');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Deficit Routes (sorted by most negative deltaFact)
  const deficitRoutes = [...routeAggs]
    .filter(r => r.deltaFact < 0)
    .sort((a, b) => a.deltaFact - b.deltaFact);

  // 2. Surplus Routes (sorted by highest positive deltaFact)
  const surplusRoutes = [...routeAggs]
    .filter(r => r.deltaFact >= 0)
    .sort((a, b) => b.deltaFact - a.deltaFact);

  // 3. Products
  const sortedProducts = [...productAggs].sort((a, b) => b.realFact - a.realFact);

  // 4. Supervisors
  const sortedSupervisors = [...supervisorAggs].sort((a, b) => (b.cumplimientoFact || 0) - (a.cumplimientoFact || 0));

  const getCurrentDataset = (): DimensionAggregation[] => {
    switch (activeView) {
      case 'rutas-brecha':
        return deficitRoutes;
      case 'rutas-lideres':
        return surplusRoutes;
      case 'productos':
        return sortedProducts;
      case 'supervisores':
        return sortedSupervisors;
    }
  };

  const rawList = getCurrentDataset();
  const filteredList = rawList.filter(item => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      item.nombre.toLowerCase().includes(q) ||
      (item.subtexto && item.subtexto.toLowerCase().includes(q))
    );
  });

  const maxRevenue = Math.max(...rawList.map(r => r.realFact), 1);

  // Mini inline Sparkline generator
  const renderSparkline = (compliance: number | null) => {
    const val = compliance ? Math.min(Math.max(compliance, 50), 150) : 100;
    // 3 synthetic/relative points normalized: past 1, past 2, current
    const p1 = 18 - ((val * 0.92 - 50) / 100) * 16;
    const p2 = 18 - ((val * 0.96 - 50) / 100) * 16;
    const p3 = 18 - ((val - 50) / 100) * 16;

    const strokeColor = val >= 100 ? '#14B8A6' : val >= 90 ? '#3B82F6' : '#EF4444';

    return (
      <svg className="h-5 w-16 shrink-0" viewBox="0 0 60 20">
        <path
          d={`M 4 ${p1} L 30 ${p2} L 56 ${p3}`}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="56" cy={p3} r="2.5" fill={strokeColor} />
      </svg>
    );
  };

  return (
    <div className="rounded-lg border border-[#374151] bg-[#1F2937] p-5 shadow-xs">
      {/* Header & Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-[#374151] pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#F9FAFB]">
              Diagnóstico Operativo & Matriz de Desviaciones
            </h3>
            <span className="text-xs text-[#4B5563]">/</span>
            <span className="text-[11px] text-[#9CA3AF]">
              Análisis granular de contingencias y áreas de alto rendimiento
            </span>
          </div>
          <p className="mt-1 text-xs text-[#9CA3AF]">
            Identificación de rutas con mayor brecha, concentración de producto y cumplimiento por supervisión.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#111827] border border-[#374151] rounded-md text-xs">
          <button
            onClick={() => { setActiveView('rutas-brecha'); setSearchTerm(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm transition-colors ${
              activeView === 'rutas-brecha'
                ? 'bg-[#EF4444]/20 text-[#EF4444] font-semibold border border-[#EF4444]/40'
                : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5 text-[#EF4444]" />
            <span>Rutas con Brecha ({deficitRoutes.length})</span>
          </button>

          <button
            onClick={() => { setActiveView('rutas-lideres'); setSearchTerm(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm transition-colors ${
              activeView === 'rutas-lideres'
                ? 'bg-[#14B8A6]/20 text-[#14B8A6] font-semibold border border-[#14B8A6]/40'
                : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-[#14B8A6]" />
            <span>Rutas con Superávit ({surplusRoutes.length})</span>
          </button>

          <button
            onClick={() => { setActiveView('productos'); setSearchTerm(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm transition-colors ${
              activeView === 'productos'
                ? 'bg-[#3B82F6]/20 text-[#3B82F6] font-semibold border border-[#3B82F6]/40'
                : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-[#3B82F6]" />
            <span>Mix de Productos ({sortedProducts.length})</span>
          </button>

          <button
            onClick={() => { setActiveView('supervisores'); setSearchTerm(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm transition-colors ${
              activeView === 'supervisores'
                ? 'bg-[#374151] text-[#F9FAFB] font-semibold border border-[#4B5563]'
                : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
            }`}
          >
            <span>Supervisores ({sortedSupervisors.length})</span>
          </button>
        </div>
      </div>

      {/* Subheader / Search */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="text-[#9CA3AF]">
          Mostrando {filteredList.length} registros clasificados por desviación
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B7280]" />
          <input
            type="text"
            placeholder="Filtrar en diagnóstico..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="h-8 w-60 rounded-md border border-[#374151] bg-[#111827] pl-8 pr-2.5 text-xs text-[#F9FAFB] placeholder:text-[#6B7280] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] focus:outline-hidden"
          />
        </div>
      </div>

      {/* Advanced Matrix Table */}
      <div className="overflow-x-auto rounded-md border border-[#374151]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#374151] bg-[#111827] text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
              <th className="py-2.5 px-3.5">Unidad de Análisis</th>
              <th className="py-2.5 px-3.5 text-right">Facturación Real</th>
              <th className="py-2.5 px-3.5">Contribución / Barra</th>
              <th className="py-2.5 px-3.5 text-right">Meta Presupuestaria</th>
              <th className="py-2.5 px-3.5 text-right">Cumplimiento %</th>
              <th className="py-2.5 px-3.5 text-right">Brecha Monetaria</th>
              <th className="py-2.5 px-3.5 text-center">Tendencia</th>
              <th className="py-2.5 px-3.5 text-center">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#374151]/60">
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-xs text-[#6B7280]">
                  No se registran elementos en esta categoría bajo los filtros seleccionados.
                </td>
              </tr>
            ) : (
              filteredList.slice(0, 15).map((row, idx) => {
                const isPositive = row.deltaFact >= 0;
                const sharePct = maxRevenue > 0 ? (row.realFact / maxRevenue) * 100 : 0;

                return (
                  <tr
                    key={row.clave}
                    className="hover:bg-[#243042] transition-colors text-[#F9FAFB]"
                  >
                    {/* 1. Unit */}
                    <td className="py-2.5 px-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#6B7280] font-mono w-4">{idx + 1}.</span>
                        <div>
                          <div className="font-semibold text-[#F9FAFB]">{row.nombre}</div>
                          {row.subtexto && (
                            <div className="text-[11px] text-[#9CA3AF]">{row.subtexto}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 2. Real Fact */}
                    <td className="py-2.5 px-3.5 text-right font-bold font-mono text-[#F9FAFB]">
                      {formatGuaranies(row.realFact)}
                    </td>

                    {/* 3. In-Cell Data Bar */}
                    <td className="py-2.5 px-3.5 w-32">
                      <div className="h-2 w-full bg-[#111827] border border-[#374151] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            activeView === 'rutas-brecha' ? 'bg-[#EF4444]' : 'bg-[#14B8A6]'
                          }`}
                          style={{ width: `${Math.min(sharePct, 100)}%` }}
                        />
                      </div>
                    </td>

                    {/* 4. Meta */}
                    <td className="py-2.5 px-3.5 text-right font-mono text-[#9CA3AF]">
                      {formatGuaranies(row.objetivoFact)}
                    </td>

                    {/* 5. Cumplimiento % */}
                    <td className="py-2.5 px-3.5 text-right font-mono">
                      <span
                        className={`font-bold ${
                          isPositive
                            ? 'text-[#14B8A6]'
                            : (row.cumplimientoFact || 0) >= 90
                            ? 'text-[#F59E0B]'
                            : 'text-[#EF4444]'
                        }`}
                      >
                        {formatPercent(row.cumplimientoFact)}
                      </span>
                    </td>

                    {/* 6. Brecha */}
                    <td className="py-2.5 px-3.5 text-right font-mono font-bold">
                      <span className={isPositive ? 'text-[#14B8A6]' : 'text-[#EF4444]'}>
                        {isPositive ? '+' : ''}{formatGuaranies(row.deltaFact, true)}
                      </span>
                    </td>

                    {/* 7. Inline Sparkline */}
                    <td className="py-2.5 px-3.5 text-center">
                      <div className="flex justify-center">
                        {renderSparkline(row.cumplimientoFact)}
                      </div>
                    </td>

                    {/* 8. Action */}
                    <td className="py-2.5 px-3.5 text-center">
                      <button
                        onClick={() => {
                          if (activeView === 'rutas-brecha' || activeView === 'rutas-lideres') {
                            onSelectRoute(row.clave);
                          } else if (activeView === 'productos') {
                            onSelectProduct(row.clave);
                          } else {
                            onSelectSupervisor(row.clave);
                          }
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#3B82F6] hover:text-blue-400"
                        title="Filtrar todo el dashboard por este elemento"
                      >
                        <span>Explorar</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {filteredList.length > 15 && (
        <div className="mt-2 text-right text-[11px] text-[#9CA3AF]">
          Mostrando los 15 registros principales. Use el buscador para consultar otros elementos.
        </div>
      )}
    </div>
  );
};
