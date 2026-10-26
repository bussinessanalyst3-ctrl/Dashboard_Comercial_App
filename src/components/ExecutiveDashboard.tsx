import React, { useState } from 'react';
import {
  CommercialKPIs,
  DimensionAggregation,
  HistoricalPoint,
  FilterState
} from '../types/commercial';
import {
  formatGuaranies,
  formatTons,
  formatPercent,
  formatPeriodDisplay
} from '../services/dataNormalizer';
import { DominantKpiHero } from './analytics/DominantKpiHero';
import { SecondaryKpiBar } from './analytics/SecondaryKpiBar';
import { ContextBanner } from './analytics/ContextBanner';
import { VarianceChart } from './analytics/VarianceChart';
import { ParetoChart } from './analytics/ParetoChart';
import { CommercialDiagnosisTable } from './analytics/CommercialDiagnosisTable';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  Activity,
  Layers,
  Building2,
  Users,
  Target,
  ArrowRight
} from 'lucide-react';

interface ExecutiveDashboardProps {
  kpis: CommercialKPIs;
  filters: FilterState;
  zoneAggs: DimensionAggregation[];
  supervisorAggs: DimensionAggregation[];
  productAggs: DimensionAggregation[];
  routeAggs: DimensionAggregation[];
  timeline: HistoricalPoint[];
  totalVentasCount: number;
  supabaseConnected: boolean;
  onSelectPeriod: (p: string) => void;
  onSelectZone: (z: string) => void;
  onSelectProduct: (p: string) => void;
  onSelectRoute: (r: string) => void;
  onSelectSupervisor: (s: string) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  kpis,
  filters,
  zoneAggs,
  supervisorAggs,
  productAggs,
  routeAggs,
  timeline,
  totalVentasCount,
  supabaseConnected,
  onSelectPeriod,
  onSelectZone,
  onSelectProduct,
  onSelectRoute,
  onSelectSupervisor
}) => {
  const [temporalMetric, setTemporalMetric] = useState<'facturacion' | 'toneladas'>('facturacion');

  const isProductFiltered = filters.producto !== 'TODOS';

  // Find previous and YoY points for comparative momentum
  const currentIdx = timeline.findIndex(t => t.periodo === filters.periodo);
  const previousPoint = currentIdx > 0 ? timeline[currentIdx - 1] : undefined;

  const [mName, yNum] = (filters.periodo || '').split('-');
  const yoyPeriodKey = `${mName}-${(parseInt(yNum || '26', 10) - 1).toString().padStart(2, '0')}`;
  const yoyPoint = timeline.find(t => t.periodo === yoyPeriodKey);

  return (
    <div className="space-y-6">
      {/* Empty State Banner if Data Wiped */}
      {totalVentasCount === 0 && (
        <div className="border border-[#38BDF8]/40 bg-[#12161C] p-5 font-mono text-xs">
          <div className="flex items-center gap-2 font-bold text-sm text-[#F1F5F9]">
            <Layers className="h-4 w-4 text-[#38BDF8]" />
            Base de Datos Vacía — Listo para Carga de Datos Reales
          </div>
          <p className="font-sans text-slate-300 leading-relaxed max-w-2xl mt-2 text-xs">
            Se han vaciado los datos de prueba. El sistema se encuentra en blanco y listo para recibir los archivos comerciales operativos de su empresa. Diríjase a la sección <strong>"Cargar Datos / Excel"</strong> en el menú lateral para importar su plantilla o archivo mensual (Ventas, Objetivos y Cobertura).
          </p>
        </div>
      )}

      {/* ZONA B — ENCABEZADO DE CONTEXTO EDITORIAL */}
      <ContextBanner
        filters={filters}
        kpis={kpis}
        totalVentasRecords={totalVentasCount}
        supabaseConnected={supabaseConnected}
      />

      {/* ZONA C — INDICADOR PRINCIPAL DOMINANTE (HERO BULLET) */}
      <DominantKpiHero
        kpis={kpis}
        periodo={filters.periodo}
        previousPoint={previousPoint}
        yoyPoint={yoyPoint}
      />

      {/* SECONDARY METRICS RIBBON (NO PILLS / UNIFIED BARS) */}
      <SecondaryKpiBar
        kpis={kpis}
        isProductFiltered={isProductFiltered}
      />

      {/* ZONA D — CAMPO DE ANÁLISIS (COMPOSICIÓN ASIMÉTRICA) */}
      <div className="space-y-6">
        {/* ROW 1: EVOLUCIÓN TEMPORAL MULTIMENSUAL + ANÁLISIS DE VARIANZA POR ZONA */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Main Time-Series Area Chart (7 cols) */}
          <div className="lg:col-span-7 rounded-lg border border-[#374151] bg-[#1F2937] p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#374151] pb-3 mb-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#F9FAFB]">
                  Evolución Multimensual: Presupuesto vs Real
                </h3>
                <p className="text-[11px] text-[#9CA3AF]">
                  Serie histórica de desempeño consolidado por período
                </p>
              </div>

              <div className="flex items-center rounded-md border border-[#374151] bg-[#111827] p-1 text-xs">
                <button
                  onClick={() => setTemporalMetric('facturacion')}
                  className={`px-3 py-1 rounded-sm font-medium transition-colors ${
                    temporalMetric === 'facturacion'
                      ? 'bg-[#3B82F6] text-white'
                      : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
                  }`}
                >
                  Facturación (M)
                </button>
                <button
                  onClick={() => setTemporalMetric('toneladas')}
                  className={`px-3 py-1 rounded-sm font-medium transition-colors ${
                    temporalMetric === 'toneladas'
                      ? 'bg-[#3B82F6] text-white'
                      : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
                  }`}
                >
                  Toneladas
                </button>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={timeline.map(t => ({
                    periodo: t.periodo,
                    name: formatPeriodDisplay(t.periodo),
                    Objetivo: temporalMetric === 'facturacion' ? Math.round(t.objetivoFact / 1_000_000) : t.objetivoTon,
                    Real: temporalMetric === 'facturacion' ? Math.round(t.realFact / 1_000_000) : t.realTon,
                    cumplimiento: temporalMetric === 'facturacion' ? t.cumplimientoFact : t.cumplimientoTon
                  }))}
                  margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="realGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#14B8A6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="objGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 2" stroke="#374151" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#9CA3AF', fontFamily: 'Plus Jakarta Sans' }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#6B7280', fontFamily: 'JetBrains Mono' }}
                    tickFormatter={v => (temporalMetric === 'facturacion' ? `₲${v}M` : `${v}T`)}
                  />
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      temporalMetric === 'facturacion'
                        ? `₲ ${(Number(val) * 1_000_000).toLocaleString('es-PY')}`
                        : `${Number(val).toFixed(2)} Ton`,
                      name === 'Real' ? 'Venta Real' : 'Objetivo Presupuestado'
                    ]}
                    contentStyle={{
                      backgroundColor: '#111827',
                      border: '1px solid #374151',
                      borderRadius: '6px',
                      color: '#F9FAFB',
                      fontSize: '11px',
                      fontFamily: 'JetBrains Mono'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Objetivo"
                    stroke="#3B82F6"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    fill="url(#objGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Real"
                    stroke="#14B8A6"
                    strokeWidth={2.5}
                    fill="url(#realGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-2 flex items-center justify-between text-xs text-[#9CA3AF]">
              <span className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-4 rounded-xs bg-[#14B8A6]" /> Venta Real
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-0.5 w-4 bg-[#3B82F6] border-dashed border-b" /> Presupuesto
                </span>
              </span>
              <span className="text-[11px] text-[#6B7280]">Evolución acumulada mensual</span>
            </div>
          </div>

          {/* Variance Chart by Zone (5 cols) */}
          <div className="lg:col-span-5">
            <VarianceChart
              data={zoneAggs}
              title="Desviación Neta por Zona"
              dimensionLabel="Zona Territorial"
              onSelectDimension={onSelectZone}
            />
          </div>
        </div>

        {/* ROW 2: CURVA DE PARETO DE PRODUCTOS (80/20) + SUPERVISIÓN COMERCIAL */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Pareto Chart (7 cols) */}
          <div className="lg:col-span-7">
            <ParetoChart
              products={productAggs}
              onSelectProduct={onSelectProduct}
            />
          </div>

          {/* Supervisor Efficiency Summary (5 cols) */}
          <div className="lg:col-span-5 rounded-lg border border-[#374151] bg-[#1F2937] p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#374151] pb-3 mb-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#F9FAFB]">
                  Desempeño por Supervisión
                </h3>
                <p className="text-[11px] text-[#9CA3AF]">
                  Cumplimiento de metas por equipo comercial
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-[#3B82F6] rounded-md px-2 py-0.5 bg-[#3B82F6]/10 border border-[#3B82F6]/20">
                {supervisorAggs.length} supervisores
              </span>
            </div>

            <div className="space-y-2.5">
              {supervisorAggs.map((sup, idx) => {
                const cFact = sup.cumplimientoFact || 0;
                const isOver = cFact >= 100;
                const isWarning = cFact < 90;

                return (
                  <div
                    key={sup.clave}
                    onClick={() => onSelectSupervisor(sup.clave)}
                    className="p-3 rounded-md border border-[#374151] bg-[#111827]/70 hover:bg-[#243042] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-[10px] text-[#6B7280] font-mono">{idx + 1}.</span>
                        <span className="font-semibold text-[#F9FAFB] truncate">{sup.nombre}</span>
                      </div>
                      <span
                        className={`font-mono font-bold ${
                          isOver ? 'text-[#14B8A6]' : isWarning ? 'text-[#EF4444]' : 'text-[#3B82F6]'
                        }`}
                      >
                        {formatPercent(sup.cumplimientoFact)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-[#9CA3AF] mb-1.5">
                      <span>Real: {formatGuaranies(sup.realFact, true)}</span>
                      <span>Meta: {formatGuaranies(sup.objetivoFact, true)}</span>
                      <span className={sup.deltaFact >= 0 ? 'text-[#14B8A6]' : 'text-[#EF4444]'}>
                        {sup.deltaFact >= 0 ? '+' : ''}{formatGuaranies(sup.deltaFact, true)}
                      </span>
                    </div>

                    {/* Compact progress bar */}
                    <div className="h-1.5 w-full bg-[#1F2937] border border-[#374151] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOver ? 'bg-[#14B8A6]' : isWarning ? 'bg-[#EF4444]' : 'bg-[#3B82F6]'
                        }`}
                        style={{ width: `${Math.min(cFact, 115)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ZONA E — DIAGNÓSTICO COMERCIAL AVANZADO */}
      <CommercialDiagnosisTable
        routeAggs={routeAggs}
        productAggs={productAggs}
        supervisorAggs={supervisorAggs}
        onSelectRoute={onSelectRoute}
        onSelectProduct={onSelectProduct}
        onSelectSupervisor={onSelectSupervisor}
      />
    </div>
  );
};
