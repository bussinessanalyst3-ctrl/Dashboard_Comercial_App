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
    <div className="space-y-6 font-mono text-xs">
      {/* Header & Period Selectors */}
      <div className="border border-[#242C37] bg-[#12161C] p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[#242C37]">
          <div>
            <div className="flex items-center gap-2 text-[10px] text-[#626D7C] uppercase tracking-wider">
              <span>SERIES TEMPORALES Y BENCHMARKS</span>
              <span>/</span>
              <span className="text-[#C5F467] font-bold">COMPARATIVA INTERMENSUAL</span>
            </div>
            <h2 className="mt-1 text-base font-bold text-[#F1F5F9]">
              Comparativa Histórica MoM (Mes contra Mes) & YoY (Año contra Año)
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div>
              <span className="text-[10px] font-mono text-[#626D7C] uppercase block mb-1">
                Período Base:
              </span>
              <select
                value={basePeriod}
                onChange={e => setBasePeriod(e.target.value)}
                className="h-7 rounded-sm border border-[#242C37] bg-[#0B0D10] px-2 text-xs font-mono font-bold text-[#F1F5F9] focus:border-[#C5F467] focus:outline-hidden"
              >
                {timeline.map(t => (
                  <option key={t.periodo} value={t.periodo}>
                    {formatPeriodDisplay(t.periodo).toUpperCase()} ({t.periodo})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-[10px] font-mono text-[#626D7C] uppercase block mb-1">
                Comparar contra:
              </span>
              <select
                value={comparePeriod}
                onChange={e => setComparePeriod(e.target.value)}
                className="h-7 rounded-sm border border-[#242C37] bg-[#0B0D10] px-2 text-xs font-mono font-bold text-[#F1F5F9] focus:border-[#C5F467] focus:outline-hidden"
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
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#929EAD]">
          <span className="text-[#626D7C]">Completitud de {formatPeriodDisplay(basePeriod)}:</span>
          <span className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${basePoint?.hasVentas ? 'bg-[#C5F467]' : 'bg-[#FB7185]'}`} />
            {basePoint?.hasVentas ? 'Ventas presentes' : 'Sin ventas'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${basePoint?.hasObjetivos ? 'bg-[#C5F467]' : 'bg-[#FB7185]'}`} />
            {basePoint?.hasObjetivos ? 'Objetivos presentes' : 'Sin objetivos'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${basePoint?.hasCobertura ? 'bg-[#C5F467]' : 'bg-[#FB7185]'}`} />
            {basePoint?.hasCobertura ? 'Cobertura presente' : 'Sin cobertura'}
          </span>
        </div>
      </div>

      {/* COMPARATIVE PANELS */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* PANEL 1: MoM */}
        <div className="border border-[#242C37] bg-[#12161C] p-5">
          <div className="flex items-center justify-between border-b border-[#242C37] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#C5F467]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#F1F5F9]">
                Variación Intermensual (MoM: {basePeriod} vs {comparePeriod})
              </h3>
            </div>
          </div>

          {!basePoint || !comparePoint ? (
            <div className="py-8 text-center text-xs text-[#626D7C]">
              Datos insuficientes para el período seleccionado.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Facturación MoM */}
              <div className="border border-[#242C37] bg-[#0B0D10] p-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[#929EAD]">Facturación Real</span>
                  <span
                    className={`font-bold inline-flex items-center gap-1 ${
                      (factMoM?.pct || 0) >= 0 ? 'text-[#C5F467]' : 'text-[#FB7185]'
                    }`}
                  >
                    {(factMoM?.pct || 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {typeof factMoM?.pct === 'number' ? `${factMoM.pct >= 0 ? '+' : ''}${factMoM.pct.toFixed(1)}%` : 'N/D'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#F1F5F9] font-bold">{formatGuaranies(basePoint.realFact)}</span>
                  <span className="text-[#626D7C]">vs {formatGuaranies(comparePoint.realFact)}</span>
                </div>
                <div className="mt-1 text-[10px] text-[#929EAD]">
                  Delta: {(factMoM?.diff || 0) >= 0 ? '+' : ''}{formatGuaranies(factMoM?.diff, true)}
                </div>
              </div>

              {/* Toneladas MoM */}
              <div className="border border-[#242C37] bg-[#0B0D10] p-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[#929EAD]">Despacho en Toneladas</span>
                  <span
                    className={`font-bold inline-flex items-center gap-1 ${
                      (tonMoM?.pct || 0) >= 0 ? 'text-[#C5F467]' : 'text-[#FB7185]'
                    }`}
                  >
                    {(tonMoM?.pct || 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {typeof tonMoM?.pct === 'number' ? `${tonMoM.pct >= 0 ? '+' : ''}${tonMoM.pct.toFixed(1)}%` : 'N/D'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#F1F5F9] font-bold">{formatTons(basePoint.realTon, 2)}</span>
                  <span className="text-[#626D7C]">vs {formatTons(comparePoint.realTon, 2)}</span>
                </div>
                <div className="mt-1 text-[10px] text-[#929EAD]">
                  Delta: {(tonMoM?.diff || 0) >= 0 ? '+' : ''}{formatTons(tonMoM?.diff, 2)}
                </div>
              </div>

              {/* Clientes MoM */}
              <div className="border border-[#242C37] bg-[#0B0D10] p-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[#929EAD]">Clientes Efectivos</span>
                  <span
                    className={`font-bold ${
                      (cobMoM?.pct || 0) >= 0 ? 'text-[#C5F467]' : 'text-[#FB7185]'
                    }`}
                  >
                    {typeof cobMoM?.pct === 'number' ? `${cobMoM.pct >= 0 ? '+' : ''}${cobMoM.pct.toFixed(1)}%` : 'N/D'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#F1F5F9] font-bold">{basePoint.clientesReal} clientes</span>
                  <span className="text-[#626D7C]">vs {comparePoint.clientesReal} clientes</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PANEL 2: YoY */}
        <div className="border border-[#242C37] bg-[#12161C] p-5">
          <div className="flex items-center justify-between border-b border-[#242C37] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#38BDF8]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#F1F5F9]">
                Comparativa Interanual (YoY: {basePeriod} vs {yoyTargetPeriod})
              </h3>
            </div>
          </div>

          {!yoyPoint ? (
            <div className="border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-4 text-xs text-[#F59E0B]">
              <div className="flex items-center gap-2 font-bold mb-1">
                <AlertCircle className="h-4 w-4" />
                Período del año previo ({yoyTargetPeriod}) no detectado
              </div>
              <p>
                Importe el archivo histórico correspondiente a {yoyTargetPeriod} desde el módulo de Gestión de Datos para activar la comparación interanual directa.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border border-[#242C37] bg-[#0B0D10] p-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[#929EAD]">Crecimiento Anual Facturación</span>
                  <span
                    className={`font-bold inline-flex items-center gap-1 ${
                      (factYoY?.pct || 0) >= 0 ? 'text-[#C5F467]' : 'text-[#FB7185]'
                    }`}
                  >
                    {(factYoY?.pct || 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {typeof factYoY?.pct === 'number' ? `${factYoY.pct >= 0 ? '+' : ''}${factYoY.pct.toFixed(1)}% YoY` : 'N/D'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#F1F5F9] font-bold">{formatGuaranies(basePoint?.realFact)}</span>
                  <span className="text-[#626D7C]">vs {formatGuaranies(yoyPoint.realFact)}</span>
                </div>
              </div>

              <div className="border border-[#242C37] bg-[#0B0D10] p-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[#929EAD]">Crecimiento Anual Toneladas</span>
                  <span
                    className={`font-bold inline-flex items-center gap-1 ${
                      (tonYoY?.pct || 0) >= 0 ? 'text-[#C5F467]' : 'text-[#FB7185]'
                    }`}
                  >
                    {typeof tonYoY?.pct === 'number' ? `${tonYoY.pct >= 0 ? '+' : ''}${tonYoY.pct.toFixed(1)}% YoY` : 'N/D'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#F1F5F9] font-bold">{formatTons(basePoint?.realTon, 2)}</span>
                  <span className="text-[#626D7C]">vs {formatTons(yoyPoint.realTon, 2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* HISTORICAL TABLE */}
      <div className="border border-[#242C37] bg-[#12161C] p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#F1F5F9] mb-3">
          Historial Cronológico de Períodos
        </h3>
        <div className="overflow-x-auto border border-[#242C37]">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-[#242C37] bg-[#0B0D10] text-[10px] font-bold text-[#626D7C] uppercase tracking-wider">
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
            <tbody className="divide-y divide-[#242C37]/60">
              {timeline.map(t => (
                <tr key={t.periodo} className="hover:bg-[#191F27]/60 text-[#F1F5F9]">
                  <td className="py-2.5 px-3 font-bold text-[#F1F5F9]">
                    {formatPeriodDisplay(t.periodo)} ({t.periodo})
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-[#F1F5F9]">
                    {formatGuaranies(t.realFact)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-[#929EAD]">
                    {formatGuaranies(t.objetivoFact)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-[#C5F467]">
                    {formatPercent(t.cumplimientoFact)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-[#F1F5F9]">
                    {formatTons(t.realTon, 2)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-[#929EAD]">
                    {formatTons(t.objetivoTon, 2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-[#C5F467]">
                    {formatPercent(t.cumplimientoTon)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-[#929EAD]">
                    {t.clientesReal} / {t.coberturaObj} cli ({formatPercent(t.cumplimientoCob)})
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => onSelectPeriod(t.periodo)}
                      className="text-xs font-bold text-[#C5F467] hover:underline"
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
