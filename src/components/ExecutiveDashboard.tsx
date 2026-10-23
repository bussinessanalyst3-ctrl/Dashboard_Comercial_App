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
          <div className="lg:col-span-7 border border-[#242C37] bg-[#12161C] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#242C37] pb-3 mb-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#F1F5F9]">
                  Evolución Multimensual: Presupuesto vs Real
                </h3>
                <p className="text-[11px] font-mono text-[#929EAD]">
                  Serie histórica de desempeño consolidado por período
                </p>
              </div>

              <div className="flex items-center rounded-sm border border-[#29313B] bg-[#0B0D10] p-0.5 text-xs font-mono">
                <button
                  onClick={() => setTemporalMetric('facturacion')}
                  className={`px-2.5 py-0.5 transition-colors ${
                    temporalMetric === 'facturacion'
                      ? 'bg-[#191F27] text-[#C5F467] font-bold'
                      : 'text-[#929EAD] hover:text-[#F1F5F9]'
                  }`}
                >
                  Facturación (M)
                </button>
                <button
                  onClick={() => setTemporalMetric('toneladas')}
                  className={`px-2.5 py-0.5 transition-colors ${
                    temporalMetric === 'toneladas'
                      ? 'bg-[#191F27] text-[#C5F467] font-bold'
                      : 'text-[#929EAD] hover:text-[#F1F5F9]'
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
                      <stop offset="5%" stopColor="#C5F467" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#C5F467" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="objGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 2" stroke="#1F2732" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#929EAD', fontFamily: 'JetBrains Mono' }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#626D7C', fontFamily: 'JetBrains Mono' }}
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
                      backgroundColor: '#0B0D10',
                      border: '1px solid #242C37',
                      borderRadius: '2px',
                      color: '#F1F5F9',
                      fontSize: '11px',
                      fontFamily: 'JetBrains Mono'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Objetivo"
                    stroke="#38BDF8"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    fill="url(#objGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Real"
                    stroke="#C5F467"
                    strokeWidth={2.5}
                    fill="url(#realGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-[#929EAD]">
              <span className="flex items-center gap-2">
                <span className="h-0.5 w-4 bg-[#C5F467]" /> Venta Real
                <span className="h-0.5 w-4 bg-[#38BDF8] border-dashed border-b" /> Presupuesto
              </span>
              <span className="text-[#626D7C]">Haga clic en un punto para explorar</span>
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
          <div className="lg:col-span-5 border border-[#242C37] bg-[#12161C] p-5">
            <div className="flex items-center justify-between border-b border-[#242C37] pb-3 mb-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#F1F5F9]">
                  Desempeño por Supervisión
                </h3>
                <p className="text-[11px] font-mono text-[#929EAD]">
                  Cumplimiento de metas por equipo comercial
                </p>
              </div>
              <span className="text-xs font-mono text-[#C5F467]">
                {supervisorAggs.length} supervisores
              </span>
            </div>

            <div className="space-y-3">
              {supervisorAggs.map((sup, idx) => {
                const cFact = sup.cumplimientoFact || 0;
                const isOver = cFact >= 100;
                const isWarning = cFact < 90;

                return (
                  <div
                    key={sup.clave}
                    onClick={() => onSelectSupervisor(sup.clave)}
                    className="p-2.5 border border-[#242C37] bg-[#0B0D10]/50 hover:bg-[#191F27] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs font-mono mb-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-[10px] text-[#626D7C]">{idx + 1}.</span>
                        <span className="font-bold text-[#F1F5F9] truncate">{sup.nombre}</span>
                      </div>
                      <span
                        className={`font-bold ${
                          isOver ? 'text-[#C5F467]' : isWarning ? 'text-[#FB7185]' : 'text-[#38BDF8]'
                        }`}
                      >
                        {formatPercent(sup.cumplimientoFact)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-[#929EAD] mb-1.5">
                      <span>Real: {formatGuaranies(sup.realFact, true)}</span>
                      <span>Meta: {formatGuaranies(sup.objetivoFact, true)}</span>
                      <span className={sup.deltaFact >= 0 ? 'text-[#C5F467]' : 'text-[#FB7185]'}>
                        {sup.deltaFact >= 0 ? '+' : ''}{formatGuaranies(sup.deltaFact, true)}
                      </span>
                    </div>

                    {/* Compact progress bar */}
                    <div className="h-1.5 w-full bg-[#12161C] border border-[#242C37] rounded-xs overflow-hidden">
                      <div
                        className={`h-full ${
                          isOver ? 'bg-[#C5F467]' : isWarning ? 'bg-[#FB7185]' : 'bg-[#38BDF8]'
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
