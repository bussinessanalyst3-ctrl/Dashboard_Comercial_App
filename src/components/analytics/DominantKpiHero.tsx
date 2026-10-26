import React, { useState } from 'react';
import { CommercialKPIs, HistoricalPoint } from '../../types/commercial';
import {
  formatGuaranies,
  formatTons,
  formatPercent,
  formatPeriodDisplay
} from '../../services/dataNormalizer';
import { getComplianceStatus, THRESHOLDS } from '../../styles/theme';
import { Target, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Layers, DollarSign, Scale } from 'lucide-react';

interface DominantKpiHeroProps {
  kpis: CommercialKPIs;
  periodo: string;
  previousPoint?: HistoricalPoint;
  yoyPoint?: HistoricalPoint;
}

export const DominantKpiHero: React.FC<DominantKpiHeroProps> = ({
  kpis,
  periodo,
  previousPoint,
  yoyPoint
}) => {
  const [selectedMetric, setSelectedMetric] = useState<'facturacion' | 'toneladas'>('facturacion');

  const isFact = selectedMetric === 'facturacion';

  const realValue = isFact ? kpis.ventasFacturacion : kpis.ventasToneladas;
  const objValue = isFact ? kpis.objetivoFacturacion : kpis.objetivoToneladas;
  const compliance = isFact ? kpis.cumplimientoFacturacion : kpis.cumplimientoToneladas;
  const delta = isFact ? kpis.diferenciaFacturacion : kpis.diferenciaToneladas;

  const status = getComplianceStatus(compliance);

  // MoM comparison
  const prevVal = previousPoint
    ? isFact
      ? previousPoint.realFact
      : previousPoint.realTon
    : null;
  const momDelta = prevVal && prevVal > 0 ? ((realValue - prevVal) / prevVal) * 100 : null;

  // YoY comparison
  const yoyVal = yoyPoint ? (isFact ? yoyPoint.realFact : yoyPoint.realTon) : null;
  const yoyDelta = yoyVal && yoyVal > 0 ? ((realValue - yoyVal) / yoyVal) * 100 : null;

  // Quantitative Bullet scale parameters (0 to 125%)
  const bulletPct = compliance ? Math.min(Math.max(compliance, 0), 125) : 0;
  const targetPct = 100; // Target is always at 100% position on the 0-125 scale -> (100 / 125) * 100 = 80%

  return (
    <div className="relative overflow-hidden rounded-lg border border-[#374151] bg-[#1F2937] p-5 sm:p-7 shadow-xs">
      {/* Decorative subtle ambient gradient */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#3B82F6]/10 blur-3xl" />

      {/* Top Header Row of Hero */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-[#374151] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-2.5 w-2.5 rounded-full bg-[#14B8A6] animate-pulse" />
          <span className="text-xs font-semibold tracking-wider text-[#9CA3AF] uppercase">
            Rendimiento Comercial Consolidado
          </span>
          <span className="text-xs text-[#6B7280]">/</span>
          <span className="text-xs font-semibold text-[#F9FAFB]">
            {formatPeriodDisplay(periodo)}
          </span>
        </div>

        {/* Metric Switcher (Facturación vs Toneladas) */}
        <div className="flex items-center rounded-lg border border-[#374151] bg-[#111827] p-1">
          <button
            onClick={() => setSelectedMetric('facturacion')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              isFact
                ? 'bg-[#3B82F6] text-white shadow-xs'
                : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
            }`}
          >
            <DollarSign className="h-3.5 w-3.5" />
            <span>Facturación (PYG)</span>
          </button>
          <button
            onClick={() => setSelectedMetric('toneladas')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              !isFact
                ? 'bg-[#3B82F6] text-white shadow-xs'
                : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
            }`}
          >
            <Scale className="h-3.5 w-3.5" />
            <span>Volumen (Toneladas)</span>
          </button>
        </div>
      </div>

      {/* Main Core Metric Display */}
      <div className="relative z-10 mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end">
        {/* Left Column: Metric Numbers (8 cols) */}
        <div className="lg:col-span-8">
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-mono text-[#F9FAFB]">
              {isFact ? formatGuaranies(realValue) : formatTons(realValue, 2)}
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-mono font-bold tracking-wide ${
                  compliance && compliance >= 100
                    ? 'border-[#14B8A6]/40 bg-[#14B8A6]/10 text-[#14B8A6]'
                    : compliance && compliance >= 90
                    ? 'border-[#3B82F6]/40 bg-[#3B82F6]/10 text-[#3B82F6]'
                    : 'border-[#EF4444]/40 bg-[#EF4444]/10 text-[#EF4444]'
                }`}
              >
                {compliance ? `${compliance.toFixed(1)}%` : 'N/D'}
              </span>
              <span className="text-xs font-medium uppercase tracking-wider text-[#9CA3AF]">
                {status.label}
              </span>
            </div>
          </div>

          {/* Subtitle / Objective & Absolute Gap Breakdown */}
          <div className="mt-3.5 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-mono text-[#9CA3AF]">
            <div className="flex items-center gap-1.5">
              <span className="text-[#6B7280]">OBJETIVO:</span>
              <span className="font-semibold text-[#F9FAFB]">
                {isFact ? formatGuaranies(objValue) : formatTons(objValue, 2)}
              </span>
            </div>
            <span className="text-[#4B5563]">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[#6B7280]">BRECHA:</span>
              <span
                className={`font-bold ${
                  delta >= 0 ? 'text-[#14B8A6]' : 'text-[#EF4444]'
                }`}
              >
                {delta >= 0 ? '+' : ''}
                {isFact ? formatGuaranies(delta, true) : formatTons(delta, 2)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Comparative Momentum (MoM & YoY) (4 cols) */}
        <div className="lg:col-span-4 flex flex-row lg:flex-col justify-between lg:justify-end gap-3 border-t lg:border-t-0 lg:border-l border-[#374151] pt-4 lg:pt-0 lg:pl-6 text-xs">
          {/* MoM Delta */}
          <div>
            <div className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wider mb-0.5">
              Momentum Intermensual (MoM)
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span
                className={`flex items-center font-bold text-sm ${
                  momDelta !== null && momDelta >= 0 ? 'text-[#14B8A6]' : 'text-[#EF4444]'
                }`}
              >
                {momDelta !== null && momDelta >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 mr-0.5" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 mr-0.5" />
                )}
                {momDelta !== null ? `${momDelta >= 0 ? '+' : ''}${momDelta.toFixed(1)}%` : 'N/D'}
              </span>
              <span className="text-xs text-[#9CA3AF]">
                vs {previousPoint ? previousPoint.periodo : 'mes anterior'}
              </span>
            </div>
          </div>

          {/* YoY Delta */}
          <div>
            <div className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wider mb-0.5">
              Crecimiento Interanual (YoY)
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span
                className={`flex items-center font-bold text-sm ${
                  yoyDelta !== null && yoyDelta >= 0 ? 'text-[#14B8A6]' : 'text-[#EF4444]'
                }`}
              >
                {yoyDelta !== null && yoyDelta >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 mr-0.5" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 mr-0.5" />
                )}
                {yoyDelta !== null ? `${yoyDelta >= 0 ? '+' : ''}${yoyDelta.toFixed(1)}%` : 'N/D'}
              </span>
              <span className="text-xs text-[#9CA3AF]">
                vs {yoyPoint ? yoyPoint.periodo : 'año anterior'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* QUANTITATIVE BULLET / SEGMENTED SCALE VISUALIZATION */}
      <div className="relative z-10 mt-6 pt-5 border-t border-[#374151]">
        <div className="flex items-center justify-between text-xs text-[#9CA3AF] mb-2 font-medium">
          <span>Escala Cuantitativa de Cumplimiento (Bullet Progression)</span>
          <span className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-xs bg-[#EF4444]/70 inline-block" /> &lt;80% Crítico
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-xs bg-[#F59E0B]/70 inline-block" /> 80-90% Alerta
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-xs bg-[#3B82F6]/70 inline-block" /> 90-100% En Rango
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-xs bg-[#14B8A6] inline-block" /> 100%+ Meta
            </span>
          </span>
        </div>

        {/* The Track: 0% to 125% max scale */}
        <div className="relative h-6 w-full rounded-md bg-[#111827] border border-[#374151] overflow-hidden flex">
          {/* Qualitative background bands */}
          <div className="h-full bg-[#EF4444]/10 border-r border-[#374151]/60" style={{ width: `${(80 / 125) * 100}%` }} />
          <div className="h-full bg-[#F59E0B]/10 border-r border-[#374151]/60" style={{ width: `${(10 / 125) * 100}%` }} />
          <div className="h-full bg-[#3B82F6]/10 border-r border-[#374151]/60" style={{ width: `${(10 / 125) * 100}%` }} />
          <div className="h-full bg-[#14B8A6]/10" style={{ width: `${(25 / 125) * 100}%` }} />

          {/* Actual Achievement Bar (Bullet Bar) */}
          <div
            className={`absolute top-1 bottom-1 left-0 rounded-xs transition-all duration-700 ${
              compliance && compliance >= 100
                ? 'bg-[#14B8A6]'
                : compliance && compliance >= 90
                ? 'bg-[#3B82F6]'
                : 'bg-[#EF4444]'
            }`}
            style={{ width: `${(bulletPct / 125) * 100}%` }}
          />

          {/* Target Reference Marker at 100% (position 100/125 = 80%) */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)] z-20"
            style={{ left: `${(100 / 125) * 100}%` }}
            title="Meta Objetivo 100%"
          />
        </div>

        {/* Scale labels */}
        <div className="relative mt-1.5 h-4 w-full text-[10px] font-mono text-[#6B7280]">
          <span className="absolute left-0">0%</span>
          <span className="absolute -translate-x-1/2" style={{ left: `${(80 / 125) * 100}%` }}>80%</span>
          <span className="absolute -translate-x-1/2" style={{ left: `${(90 / 125) * 100}%` }}>90%</span>
          <span className="absolute -translate-x-1/2 font-bold text-[#F9FAFB]" style={{ left: `${(100 / 125) * 100}%` }}>
            META 100%
          </span>
          <span className="absolute right-0">125%</span>
        </div>
      </div>
    </div>
  );
};
