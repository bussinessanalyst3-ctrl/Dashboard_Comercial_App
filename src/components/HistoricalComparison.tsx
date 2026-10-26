import React, { useState } from 'react';
import { HistoricalPoint } from '../types/commercial';
import {
  formatGuaranies,
  formatTons,
  formatPercent,
  formatPeriodDisplay
} from '../services/dataNormalizer';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  GitCompare,
  BarChart3,
  ArrowRight,
  Layers
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface HistoricalComparisonProps {
  timeline: HistoricalPoint[];
  currentPeriod: string;
  onSelectPeriod: (p: string) => void;
}

export const HistoricalComparison: React.FC<HistoricalComparisonProps> = ({
  timeline,
  currentPeriod,
  onSelectPeriod
}) => {
  const [basePeriod, setBasePeriod] = useState<string>(
    currentPeriod && currentPeriod !== 'TODOS' ? currentPeriod : (timeline[timeline.length - 1]?.periodo || 'sept-26')
  );

  const [comparePeriod, setComparePeriod] = useState<string>(() => {
    const idx = timeline.findIndex(t => t.periodo === basePeriod);
    if (idx > 0) return timeline[idx - 1].periodo;
    return timeline[0]?.periodo || '';
  });

  const basePoint = timeline.find(t => t.periodo === basePeriod);
  const comparePoint = timeline.find(t => t.periodo === comparePeriod);

  // YoY candidate
  const [baseMonth, baseYear] = (basePeriod || '').split('-');
  const yoyTargetPeriod = `${baseMonth}-${(parseInt(baseYear || '26', 10) - 1).toString().padStart(2, '0')}`;
  const yoyPoint = timeline.find(t => t.periodo === yoyTargetPeriod);

  const calcDelta = (curVal: number, prevVal: number) => {
    const diff = curVal - prevVal;
    const pct = prevVal > 0 ? (diff / prevVal) * 100 : null;
    return { diff, pct };
  };

  const factMoM = basePoint && comparePoint ? calcDelta(basePoint.realFact, comparePoint.realFact) : null;
  const tonMoM = basePoint && comparePoint ? calcDelta(basePoint.realTon, comparePoint.realTon) : null;
  const cobMoM = basePoint && comparePoint ? calcDelta(basePoint.clientesReal, comparePoint.clientesReal) : null;

  const factYoY = basePoint && yoyPoint ? calcDelta(basePoint.realFact, yoyPoint.realFact) : null;
  const tonYoY = basePoint && yoyPoint ? calcDelta(basePoint.realTon, yoyPoint.realTon) : null;

  return (
    <div className="space-y-6">
      {/* Header & Period Selectors */}
      <div className="rounded-lg border border-[#374151] bg-[#1F2937] p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[#374151]">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
              <span>SERIES TEMPORALES Y BENCHMARKS</span>
              <span>/</span>
              <span className="text-[#3B82F6] font-bold">COMPARATIVA INTERMENSUAL</span>
            </div>
            <h2 className="mt-1 text-base font-bold text-[#F9FAFB]">
              Comparativa Histórica MoM (Mes contra Mes) & YoY (Año contra Año)
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div>
              <span className="text-[10px] font-medium text-[#9CA3AF] uppercase block mb-1">
                Período Base:
              </span>
              <select
                value={basePeriod}
                onChange={e => setBasePeriod(e.target.value)}
                className="h-8 rounded-md border border-[#374151] bg-[#111827] px-2.5 text-xs font-semibold text-[#F9FAFB] focus:border-[#3B82F6] focus:outline-hidden focus:ring-1 focus:ring-[#3B82F6] cursor-pointer"
              >
                {timeline.map(t => (
                  <option key={t.periodo} value={t.periodo}>
                    {formatPeriodDisplay(t.periodo).toUpperCase()} ({t.periodo})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-[10px] font-medium text-[#9CA3AF] uppercase block mb-1">
                Comparar contra:
              </span>
              <select
                value={comparePeriod}
                onChange={e => setComparePeriod(e.target.value)}
                className="h-8 rounded-md border border-[#374151] bg-[#111827] px-2.5 text-xs font-semibold text-[#F9FAFB] focus:border-[#3B82F6] focus:outline-hidden focus:ring-1 focus:ring-[#3B82F6] cursor-pointer"
              >
                {timeline.map(t => (
                  <option key={t.periodo} value={t.periodo}>
                    {formatPeriodDisplay(t.periodo).toUpperCase()} ({t.periodo})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Audit Status of Selected Base Month */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#9CA3AF]">
          <span className="text-[#6B7280]">Completitud de {formatPeriodDisplay(basePeriod)}:</span>
          <span className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${basePoint?.hasVentas ? 'bg-[#14B8A6]' : 'bg-[#EF4444]'}`} />
            <span className={basePoint?.hasVentas ? 'text-[#D1D5DB]' : 'text-[#9CA3AF]'}>{basePoint?.hasVentas ? 'Ventas presentes' : 'Sin ventas'}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${basePoint?.hasObjetivos ? 'bg-[#14B8A6]' : 'bg-[#EF4444]'}`} />
            <span className={basePoint?.hasObjetivos ? 'text-[#D1D5DB]' : 'text-[#9CA3AF]'}>{basePoint?.hasObjetivos ? 'Objetivos presentes' : 'Sin objetivos'}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${basePoint?.hasCobertura ? 'bg-[#14B8A6]' : 'bg-[#EF4444]'}`} />
            <span className={basePoint?.hasCobertura ? 'text-[#D1D5DB]' : 'text-[#9CA3AF]'}>{basePoint?.hasCobertura ? 'Cobertura presente' : 'Sin cobertura'}</span>
          </span>
        </div>
      </div>

      {/* COMPARATIVE PANELS */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* PANEL 1: MoM */}
        <div className="rounded-lg border border-[#374151] bg-[#1F2937] p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#374151] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#3B82F6]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#F9FAFB]">
                Variación Intermensual (MoM: {basePeriod} vs {comparePeriod})
              </h3>
            </div>
          </div>

          {!basePoint || !comparePoint ? (
            <div className="py-8 text-center text-xs text-[#9CA3AF]">
              Datos insuficientes para el período seleccionado.
            </div>
          ) : (
            <div className="space-y-3">
              {/* Facturación MoM */}
              <div className="rounded-md border border-[#374151] bg-[#111827] p-3.5">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[#9CA3AF] font-medium">Facturación Real</span>
                  <span
                    className={`font-semibold inline-flex items-center gap-1 font-mono tabular-nums ${
                      (factMoM?.pct || 0) >= 0 ? 'text-[#14B8A6]' : 'text-[#EF4444]'
                    }`}
                  >
                    {(factMoM?.pct || 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {typeof factMoM?.pct === 'number' ? `${factMoM.pct >= 0 ? '+' : ''}${factMoM.pct.toFixed(1)}%` : 'N/D'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#F9FAFB] font-bold font-mono tabular-nums">{formatGuaranies(basePoint.realFact)}</span>
                  <span className="text-[#9CA3AF] font-mono tabular-nums">vs {formatGuaranies(comparePoint.realFact)}</span>
                </div>
                <div className="mt-1.5 text-[11px] font-mono tabular-nums text-[#9CA3AF]">
                  Delta: {(factMoM?.diff || 0) >= 0 ? '+' : ''}{formatGuaranies(factMoM?.diff, true)}
                </div>
              </div>

              {/* Toneladas MoM */}
              <div className="rounded-md border border-[#374151] bg-[#111827] p-3.5">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[#9CA3AF] font-medium">Despacho en Toneladas</span>
                  <span
                    className={`font-semibold inline-flex items-center gap-1 font-mono tabular-nums ${
                      (tonMoM?.pct || 0) >= 0 ? 'text-[#14B8A6]' : 'text-[#EF4444]'
                    }`}
                  >
                    {(tonMoM?.pct || 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {typeof tonMoM?.pct === 'number' ? `${tonMoM.pct >= 0 ? '+' : ''}${tonMoM.pct.toFixed(1)}%` : 'N/D'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#F9FAFB] font-bold font-mono tabular-nums">{formatTons(basePoint.realTon, 2)}</span>
                  <span className="text-[#9CA3AF] font-mono tabular-nums">vs {formatTons(comparePoint.realTon, 2)}</span>
                </div>
                <div className="mt-1.5 text-[11px] font-mono tabular-nums text-[#9CA3AF]">
                  Delta: {(tonMoM?.diff || 0) >= 0 ? '+' : ''}{formatTons(tonMoM?.diff, 2)}
                </div>
              </div>

              {/* Clientes MoM */}
              <div className="rounded-md border border-[#374151] bg-[#111827] p-3.5">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[#9CA3AF] font-medium">Clientes Efectivos</span>
                  <span
                    className={`font-semibold font-mono tabular-nums ${
                      (cobMoM?.pct || 0) >= 0 ? 'text-[#14B8A6]' : 'text-[#EF4444]'
                    }`}
                  >
                    {typeof cobMoM?.pct === 'number' ? `${cobMoM.pct >= 0 ? '+' : ''}${cobMoM.pct.toFixed(1)}%` : 'N/D'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#F9FAFB] font-bold font-mono tabular-nums">{basePoint.clientesReal} clientes</span>
                  <span className="text-[#9CA3AF] font-mono tabular-nums">vs {comparePoint.clientesReal} clientes</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PANEL 2: YoY */}
        <div className="rounded-lg border border-[#374151] bg-[#1F2937] p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#374151] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#38BDF8]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#F9FAFB]">
                Comparativa Interanual (YoY: {basePeriod} vs {yoyTargetPeriod})
              </h3>
            </div>
          </div>

          {!yoyPoint ? (
            <div className="rounded-md border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-4 text-xs text-[#F59E0B]">
              <div className="flex items-center gap-2 font-bold mb-1.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Período del año previo ({yoyTargetPeriod}) no detectado
              </div>
              <p className="text-[#D1D5DB] leading-relaxed">
                Importe el archivo histórico correspondiente a {yoyTargetPeriod} desde el módulo de Gestión de Datos para activar la comparación interanual directa.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-md border border-[#374151] bg-[#111827] p-3.5">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[#9CA3AF] font-medium">Crecimiento Anual Facturación</span>
                  <span
                    className={`font-semibold inline-flex items-center gap-1 font-mono tabular-nums ${
                      (factYoY?.pct || 0) >= 0 ? 'text-[#14B8A6]' : 'text-[#EF4444]'
                    }`}
                  >
                    {(factYoY?.pct || 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {typeof factYoY?.pct === 'number' ? `${factYoY.pct >= 0 ? '+' : ''}${factYoY.pct.toFixed(1)}% YoY` : 'N/D'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#F9FAFB] font-bold font-mono tabular-nums">{formatGuaranies(basePoint?.realFact)}</span>
                  <span className="text-[#9CA3AF] font-mono tabular-nums">vs {formatGuaranies(yoyPoint.realFact)}</span>
                </div>
              </div>

              <div className="rounded-md border border-[#374151] bg-[#111827] p-3.5">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[#9CA3AF] font-medium">Crecimiento Anual Toneladas</span>
                  <span
                    className={`font-semibold inline-flex items-center gap-1 font-mono tabular-nums ${
                      (tonYoY?.pct || 0) >= 0 ? 'text-[#14B8A6]' : 'text-[#EF4444]'
                    }`}
                  >
                    {typeof tonYoY?.pct === 'number' ? `${tonYoY.pct >= 0 ? '+' : ''}${tonYoY.pct.toFixed(1)}% YoY` : 'N/D'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#F9FAFB] font-bold font-mono tabular-nums">{formatTons(basePoint?.realTon, 2)}</span>
                  <span className="text-[#9CA3AF] font-mono tabular-nums">vs {formatTons(yoyPoint.realTon, 2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* HISTORICAL TABLE */}
      <div className="rounded-lg border border-[#374151] bg-[#1F2937] p-5 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#F9FAFB] mb-3">
          Historial Cronológico de Períodos
        </h3>
        <div className="overflow-x-auto rounded-md border border-[#374151]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#374151] bg-[#111827] text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                <th className="py-2.5 px-3">Período</th>
                <th className="py-2.5 px-3 text-right">Facturación Real</th>
                <th className="py-2.5 px-3 text-right">Meta Presupuesto</th>
                <th className="py-2.5 px-3 text-right">% Fact</th>
                <th className="py-2.5 px-3 text-right">Toneladas Real</th>
                <th className="py-2.5 px-3 text-right">Meta Ton</th>
                <th className="py-2.5 px-3 text-right">% Ton</th>
                <th className="py-2.5 px-3 text-right">Clientes Cobertura</th>
                <th className="py-2.5 px-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#374151]">
              {timeline.map(t => (
                <tr key={t.periodo} className="hover:bg-[#111827]/60 text-[#F9FAFB] transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-[#F9FAFB]">
                    {formatPeriodDisplay(t.periodo)} ({t.periodo})
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-[#F9FAFB] font-mono tabular-nums">
                    {formatGuaranies(t.realFact)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-[#9CA3AF] font-mono tabular-nums">
                    {formatGuaranies(t.objetivoFact)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-[#14B8A6] font-mono tabular-nums">
                    {formatPercent(t.cumplimientoFact)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-[#F9FAFB] font-mono tabular-nums">
                    {formatTons(t.realTon, 2)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-[#9CA3AF] font-mono tabular-nums">
                    {formatTons(t.objetivoTon, 2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-[#14B8A6] font-mono tabular-nums">
                    {formatPercent(t.cumplimientoTon)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-[#9CA3AF] font-mono tabular-nums">
                    {t.clientesReal} / {t.coberturaObj} cli ({formatPercent(t.cumplimientoCob)})
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => onSelectPeriod(t.periodo)}
                      className="rounded px-2.5 py-1 text-xs font-semibold text-[#3B82F6] hover:bg-[#3B82F6]/10 transition-colors cursor-pointer"
                    >
                      Filtrar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
