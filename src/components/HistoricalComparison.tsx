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
  HelpCircle,
  ArrowRight,
  GitCompare,
  BarChart3
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar
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
    // find index of base
    const idx = timeline.findIndex(t => t.periodo === basePeriod);
    if (idx > 0) return timeline[idx - 1].periodo;
    return timeline[0]?.periodo || '';
  });

  const basePoint = timeline.find(t => t.periodo === basePeriod);
  const comparePoint = timeline.find(t => t.periodo === comparePeriod);

  // YoY candidate (e.g. if base is sept-26, yoy is sept-25)
  const [baseMonth, baseYear] = (basePeriod || '').split('-');
  const yoyTargetPeriod = `${baseMonth}-${(parseInt(baseYear || '26', 10) - 1).toString().padStart(2, '0')}`;
  const yoyPoint = timeline.find(t => t.periodo === yoyTargetPeriod);

  // Calculate MoM deltas
  const calcDelta = (curVal: number, prevVal: number) => {
    const diff = curVal - prevVal;
    const pct = prevVal > 0 ? (diff / prevVal) * 100 : null;
    return { diff, pct };
  };

  const factMoM = basePoint && comparePoint ? calcDelta(basePoint.realFact, comparePoint.realFact) : null;
  const tonMoM = basePoint && comparePoint ? calcDelta(basePoint.realTon, comparePoint.realTon) : null;
  const cobMoM = basePoint && comparePoint ? calcDelta(basePoint.clientesReal, comparePoint.clientesReal) : null;

  // YoY deltas
  const factYoY = basePoint && yoyPoint ? calcDelta(basePoint.realFact, yoyPoint.realFact) : null;
  const tonYoY = basePoint && yoyPoint ? calcDelta(basePoint.realTon, yoyPoint.realTon) : null;

  return (
    <div className="space-y-6">
      {/* Header & Period Selectors */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-slate-700" />
              Comparativa Histórica & Tendencia Mensual
            </h2>
            <p className="text-xs text-slate-500">
              Evaluación Mes contra Mes (MoM), Año contra Año (YoY) y verificación de completitud de fuentes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">
                Período Principal:
              </span>
              <select
                value={basePeriod}
                onChange={e => setBasePeriod(e.target.value)}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 font-bold focus:border-slate-900 focus:outline-hidden"
              >
                {timeline.map(t => (
                  <option key={t.periodo} value={t.periodo}>
                    {formatPeriodDisplay(t.periodo)} ({t.periodo})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">
                Comparar contra:
              </span>
              <select
                value={comparePeriod}
                onChange={e => setComparePeriod(e.target.value)}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 font-bold focus:border-slate-900 focus:outline-hidden"
              >
                {timeline.map(t => (
                  <option key={t.periodo} value={t.periodo}>
                    {formatPeriodDisplay(t.periodo)} ({t.periodo})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Audit Status of Selected Base Month */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
          <span className="text-slate-500 font-medium">Estado de fuentes para {formatPeriodDisplay(basePeriod)}:</span>
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span
              className={`h-2 w-2 rounded-full ${
                basePoint?.hasVentas ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            {basePoint?.hasVentas ? 'Ventas presentes' : 'Ventas no importadas'}
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span
              className={`h-2 w-2 rounded-full ${
                basePoint?.hasObjetivos ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            {basePoint?.hasObjetivos ? 'Objetivos presentes' : 'Sin objetivos'}
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span
              className={`h-2 w-2 rounded-full ${
                basePoint?.hasCobertura ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            {basePoint?.hasCobertura ? 'Cobertura presente' : 'Sin cobertura'}
          </span>
        </div>
      </div>

      {/* COMPARATIVE METRIC PANELS */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* PANEL 1: MES CONTRA MES (MoM) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Variación Intermensual ({formatPeriodDisplay(basePeriod)} vs {formatPeriodDisplay(comparePeriod)})
              </h3>
            </div>
          </div>

          {!basePoint || !comparePoint ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Datos insuficientes para realizar el cálculo comparativo.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Facturación MoM */}
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">Facturación Real</span>
                  <span
                    className={`font-mono font-bold inline-flex items-center gap-1 ${
                      (factMoM?.pct || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {(factMoM?.pct || 0) >= 0 ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5" />
                    )}
                    {factMoM?.pct !== null ? `${factMoM?.pct.toFixed(1)}%` : 'N/D'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-900 font-bold">{formatGuaranies(basePoint.realFact)}</span>
                  <span className="text-slate-400">vs {formatGuaranies(comparePoint.realFact)}</span>
                </div>
                <div className="mt-1 text-[11px] text-slate-500 font-mono">
                  Delta: {(factMoM?.diff || 0) >= 0 ? '+' : ''}{formatGuaranies(factMoM?.diff, true)}
                </div>
              </div>

              {/* Toneladas MoM */}
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">Volumen en Toneladas</span>
                  <span
                    className={`font-mono font-bold inline-flex items-center gap-1 ${
                      (tonMoM?.pct || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {(tonMoM?.pct || 0) >= 0 ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5" />
                    )}
                    {tonMoM?.pct !== null ? `${tonMoM?.pct.toFixed(1)}%` : 'N/D'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-900 font-bold">{formatTons(basePoint.realTon)}</span>
                  <span className="text-slate-400">vs {formatTons(comparePoint.realTon)}</span>
                </div>
                <div className="mt-1 text-[11px] text-slate-500 font-mono">
                  Delta: {(tonMoM?.diff || 0) >= 0 ? '+' : ''}{formatTons(tonMoM?.diff)}
                </div>
              </div>

              {/* Cobertura MoM */}
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">Clientes Reales Atendidos</span>
                  <span
                    className={`font-mono font-bold inline-flex items-center gap-1 ${
                      (cobMoM?.pct || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {cobMoM?.pct !== null ? `${cobMoM?.pct.toFixed(1)}%` : 'N/D'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-900 font-bold">{basePoint.clientesReal} clientes</span>
                  <span className="text-slate-400">vs {comparePoint.clientesReal} clientes</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PANEL 2: COMPARATIVA INTERANUAL (YoY) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-slate-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Comparativa Interanual (YoY: {formatPeriodDisplay(basePeriod)} vs {formatPeriodDisplay(yoyTargetPeriod)})
              </h3>
            </div>
          </div>

          {!yoyPoint ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
              <div className="flex items-center gap-2 font-bold mb-1">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                Período de referencia previo ({yoyTargetPeriod}) no detectado
              </div>
              <p>
                No se registraron datos del año anterior para este mes. Puede importar el archivo correspondiente desde el módulo de Gestión de Datos para activar la comparación interanual.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">Crecimiento Anual Facturación</span>
                  <span
                    className={`font-mono font-bold inline-flex items-center gap-1 ${
                      (factYoY?.pct || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {(factYoY?.pct || 0) >= 0 ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5" />
                    )}
                    {factYoY?.pct !== null ? `${factYoY?.pct.toFixed(1)}% YoY` : 'N/D'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-900 font-bold">{formatGuaranies(basePoint?.realFact)}</span>
                  <span className="text-slate-400">vs {formatGuaranies(yoyPoint.realFact)}</span>
                </div>
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">Crecimiento Anual Toneladas</span>
                  <span
                    className={`font-mono font-bold inline-flex items-center gap-1 ${
                      (tonYoY?.pct || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {tonYoY?.pct !== null ? `${tonYoY?.pct.toFixed(1)}% YoY` : 'N/D'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-900 font-bold">{formatTons(basePoint?.realTon)}</span>
                  <span className="text-slate-400">vs {formatTons(yoyPoint.realTon)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FULL HISTORICAL TIMELINE TABLE */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
          Historial Cronológico de Períodos
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase">
                <th className="py-2.5 px-3">Período</th>
                <th className="py-2.5 px-3 text-right">Facturación Real</th>
                <th className="py-2.5 px-3 text-right">Presupuesto Fact</th>
                <th className="py-2.5 px-3 text-right">% Fact</th>
                <th className="py-2.5 px-3 text-right">Toneladas Real</th>
                <th className="py-2.5 px-3 text-right">Presupuesto Ton</th>
                <th className="py-2.5 px-3 text-right">% Ton</th>
                <th className="py-2.5 px-3 text-right">Clientes Cobertura</th>
                <th className="py-2.5 px-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {timeline.map(t => (
                <tr key={t.periodo} className="hover:bg-slate-50 font-medium">
                  <td className="py-2.5 px-3 font-bold text-slate-900">
                    {formatPeriodDisplay(t.periodo)} ({t.periodo})
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    {formatGuaranies(t.realFact)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                    {formatGuaranies(t.objetivoFact)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                    {formatPercent(t.cumplimientoFact)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-900">
                    {formatTons(t.realTon)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                    {formatTons(t.objetivoTon)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                    {formatPercent(t.cumplimientoTon)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    {t.clientesReal} / {t.coberturaObj} cli ({formatPercent(t.cumplimientoCob)})
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => onSelectPeriod(t.periodo)}
                      className="text-xs font-semibold text-slate-900 hover:text-emerald-700 transition-colors"
                    >
                      Filtrar Mes
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
