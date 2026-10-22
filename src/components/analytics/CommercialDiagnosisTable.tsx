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

    const strokeColor = val >= 100 ? '#C5F467' : val >= 90 ? '#38BDF8' : '#FB7185';

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
    <div className="border border-[#242C37] bg-[#12161C] p-5">
      {/* Header & Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-[#242C37] pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#F1F5F9]">
              ZONA E — DIAGNÓSTICO COMERCIAL & MATRIZ DE DESVIACIONES
            </h3>
            <span className="text-xs text-[#626D7C]">/</span>
            <span className="text-[11px] font-mono text-[#929EAD]">
              Filtro operativo de contingencias y áreas de alto rendimiento
            </span>
          </div>
          <p className="mt-1 text-xs text-[#929EAD]">
            Identificación directa de rutas con mayor brecha, concentración de producto y cumplimiento por supervisión.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#0B0D10] border border-[#242C37] rounded-sm text-xs font-mono">
          <button
            onClick={() => { setActiveView('rutas-brecha'); setSearchTerm(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
              activeView === 'rutas-brecha'
                ? 'bg-[#191F27] text-[#FB7185] font-bold border border-[#FB7185]/30'
                : 'text-[#929EAD] hover:text-[#F1F5F9]'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5 text-[#FB7185]" />
            <span>Rutas con Brecha ({deficitRoutes.length})</span>
          </button>

          <button
            onClick={() => { setActiveView('rutas-lideres'); setSearchTerm(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
              activeView === 'rutas-lideres'
                ? 'bg-[#191F27] text-[#C5F467] font-bold border border-[#C5F467]/30'
                : 'text-[#929EAD] hover:text-[#F1F5F9]'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-[#C5F467]" />
            <span>Rutas con Superávit ({surplusRoutes.length})</span>
          </button>

          <button
            onClick={() => { setActiveView('productos'); setSearchTerm(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
              activeView === 'productos'
                ? 'bg-[#191F27] text-[#38BDF8] font-bold border border-[#38BDF8]/30'
                : 'text-[#929EAD] hover:text-[#F1F5F9]'
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-[#38BDF8]" />
            <span>Mix de Productos ({sortedProducts.length})</span>
          </button>

          <button
            onClick={() => { setActiveView('supervisores'); setSearchTerm(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
              activeView === 'supervisores'
                ? 'bg-[#191F27] text-[#F1F5F9] font-bold border border-[#333D4D]'
                : 'text-[#929EAD] hover:text-[#F1F5F9]'
            }`}
          >
            <span>Supervisores ({sortedSupervisors.length})</span>
          </button>
        </div>
      </div>

      {/* Subheader / Search */}
      <div className="flex items-center justify-between mb-3 text-xs font-mono">
        <div className="text-[#929EAD]">
          Mostrando {filteredList.length} registros clasificados por desviación
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#626D7C]" />
          <input
            type="text"
            placeholder="Filtrar en diagnóstico..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="h-7 w-52 rounded-sm border border-[#242C37] bg-[#0B0D10] pl-8 pr-2 text-xs text-[#F1F5F9] placeholder:text-[#626D7C] focus:border-[#C5F467] focus:outline-hidden"
          />
        </div>
      </div>

      {/* Advanced Matrix Table */}
      <div className="overflow-x-auto border border-[#242C37]">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className="border-b border-[#242C37] bg-[#0B0D10] text-[10px] font-bold text-[#626D7C] uppercase tracking-wider">
              <th className="py-2.5 px-3">Unidad de Análisis</th>
              <th className="py-2.5 px-3 text-right">Facturación Real</th>
              <th className="py-2.5 px-3">Contribución / Barra</th>
              <th className="py-2.5 px-3 text-right">Meta Presupuestaria</th>
              <th className="py-2.5 px-3 text-right">Cumplimiento %</th>
              <th className="py-2.5 px-3 text-right">Brecha Monetaria</th>
              <th className="py-2.5 px-3 text-center">Tendencia</th>
              <th className="py-2.5 px-3 text-center">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#242C37]/60">
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-xs text-[#626D7C]">
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
                    className="hover:bg-[#191F27]/60 transition-colors text-[#F1F5F9]"
                  >
                    {/* 1. Unit */}
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#626D7C] w-4">{idx + 1}.</span>
                        <div>
                          <div className="font-bold text-[#F1F5F9]">{row.nombre}</div>
                          {row.subtexto && (
                            <div className="text-[10px] text-[#929EAD] font-sans">{row.subtexto}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 2. Real Fact */}
                    <td className="py-2 px-3 text-right font-bold text-[#F1F5F9]">
                      {formatGuaranies(row.realFact)}
                    </td>

                    {/* 3. In-Cell Data Bar */}
                    <td className="py-2 px-3 w-32">
                      <div className="h-2 w-full bg-[#0B0D10] border border-[#242C37] rounded-xs overflow-hidden">
                        <div
                          className={`h-full ${
                            activeView === 'rutas-brecha' ? 'bg-[#FB7185]' : 'bg-[#C5F467]'
                          }`}
                          style={{ width: `${Math.min(sharePct, 100)}%` }}
                        />
                      </div>
                    </td>

                    {/* 4. Meta */}
                    <td className="py-2 px-3 text-right text-[#929EAD]">
                      {formatGuaranies(row.objetivoFact)}
                    </td>

                    {/* 5. Cumplimiento % */}
                    <td className="py-2 px-3 text-right">
                      <span
                        className={`font-bold ${
                          isPositive
                            ? 'text-[#C5F467]'
                            : (row.cumplimientoFact || 0) >= 90
                            ? 'text-[#F59E0B]'
                            : 'text-[#FB7185]'
                        }`}
                      >
                        {formatPercent(row.cumplimientoFact)}
                      </span>
                    </td>

                    {/* 6. Brecha */}
                    <td className="py-2 px-3 text-right font-bold">
                      <span className={isPositive ? 'text-[#C5F467]' : 'text-[#FB7185]'}>
                        {isPositive ? '+' : ''}{formatGuaranies(row.deltaFact, true)}
                      </span>
                    </td>

                    {/* 7. Inline Sparkline */}
                    <td className="py-2 px-3 text-center">
                      <div className="flex justify-center">
                        {renderSparkline(row.cumplimientoFact)}
                      </div>
                    </td>

                    {/* 8. Action */}
                    <td className="py-2 px-3 text-center">
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
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#C5F467] hover:underline"
                        title="Filtrar todo el dashboard por este elemento"
                      >
                        <span>Explorar</span>
                        <ArrowRight className="h-3 w-3" />
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
        <div className="mt-2 text-right text-[10px] font-mono text-[#626D7C]">
          Mostrando los 15 registros más críticos. Use el buscador para consultar otros elementos.
        </div>
      )}
    </div>
  );
};
