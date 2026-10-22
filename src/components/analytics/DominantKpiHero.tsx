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
    <div className="relative overflow-hidden border border-[#242C37] bg-[#12161C] p-5 sm:p-7">
      {/* Decorative hairline grid lines */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#242C37_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />

      {/* Top Header Row of Hero */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-[#242C37]/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-2 w-2 rounded-full bg-[#C5F467] animate-pulse" />
          <span className="text-[11px] font-bold tracking-widest text-[#929EAD] uppercase">
            MÉTRICA DOMINANTE DE RENDIMIENTO COMERCIAL
          </span>
          <span className="text-xs text-[#626D7C]">/</span>
          <span className="text-xs font-mono font-semibold text-[#F1F5F9]">
            {formatPeriodDisplay(periodo)}
          </span>
        </div>

        {/* Metric Switcher (Facturación vs Toneladas) */}
        <div className="flex items-center rounded-sm border border-[#29313B] bg-[#0B0D10] p-0.5">
          <button
            onClick={() => setSelectedMetric('facturacion')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-semibold transition-colors ${
              isFact
                ? 'bg-[#191F27] text-[#C5F467] shadow-xs border border-[#333D4D]'
                : 'text-[#929EAD] hover:text-[#F1F5F9]'
            }`}
          >
            <DollarSign className="h-3.5 w-3.5" />
            <span>Facturación (PYG)</span>
          </button>
          <button
            onClick={() => setSelectedMetric('toneladas')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-semibold transition-colors ${
              !isFact
                ? 'bg-[#191F27] text-[#C5F467] shadow-xs border border-[#333D4D]'
                : 'text-[#929EAD] hover:text-[#F1F5F9]'
            }`}
          >
            <Scale className="h-3.5 w-3.5" />
            <span>Volumen (Toneladas)</span>
          </button>
        </div>
      </div>

      {/* Main Core Metric Display */}
      <div className="relative z-10 mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end">
        {/* Left Column: Big Typographic Numbers (8 cols) */}
        <div className="lg:col-span-8">
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-mono text-[#F1F5F9]">
              {isFact ? formatGuaranies(realValue) : formatTons(realValue, 2)}
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 border px-2 py-0.5 text-xs font-mono font-bold tracking-wide ${
                  compliance && compliance >= 100
                    ? 'border-[#C5F467]/40 bg-[#C5F467]/10 text-[#C5F467]'
                    : compliance && compliance >= 90
                    ? 'border-[#38BDF8]/40 bg-[#38BDF8]/10 text-[#38BDF8]'
                    : 'border-[#FB7185]/40 bg-[#FB7185]/10 text-[#FB7185]'
                }`}
              >
                {compliance ? `${compliance.toFixed(1)}%` : 'N/D'}
              </span>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#929EAD]">
                {status.label}
              </span>
            </div>
          </div>

          {/* Subtitle / Objective & Absolute Gap Breakdown */}
          <div className="mt-3 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-mono text-[#929EAD]">
            <div className="flex items-center gap-1.5">
              <span className="text-[#626D7C]">OBJETIVO:</span>
              <span className="font-bold text-[#F1F5F9]">
                {isFact ? formatGuaranies(objValue) : formatTons(objValue, 2)}
              </span>
            </div>
            <span className="text-[#333D4D]">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[#626D7C]">BRECHA ABSOLUTA:</span>
              <span
                className={`font-bold ${
                  delta >= 0 ? 'text-[#C5F467]' : 'text-[#FB7185]'
                }`}
              >
                {delta >= 0 ? '+' : ''}
                {isFact ? formatGuaranies(delta, true) : formatTons(delta, 2)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Comparative Momentum (MoM & YoY) (4 cols) */}
        <div className="lg:col-span-4 flex flex-row lg:flex-col justify-between lg:justify-end gap-3 border-t lg:border-t-0 lg:border-l border-[#242C37] pt-4 lg:pt-0 lg:pl-6 text-xs font-mono">
          {/* MoM Delta */}
          <div>
            <div className="text-[10px] uppercase text-[#626D7C] tracking-wider mb-0.5">
              Momentum Intermensual (MoM)
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`flex items-center font-bold text-sm ${
                  momDelta !== null && momDelta >= 0 ? 'text-[#C5F467]' : 'text-[#FB7185]'
                }`}
              >
                {momDelta !== null && momDelta >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 mr-0.5" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 mr-0.5" />
                )}
                {momDelta !== null ? `${momDelta >= 0 ? '+' : ''}${momDelta.toFixed(1)}%` : 'N/D'}
              </span>
              <span className="text-[11px] text-[#929EAD]">
                vs {previousPoint ? previousPoint.periodo : 'mes anterior'}
              </span>
            </div>
          </div>

          {/* YoY Delta */}
          <div>
            <div className="text-[10px] uppercase text-[#626D7C] tracking-wider mb-0.5">
              Crecimiento Interanual (YoY)
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`flex items-center font-bold text-sm ${
                  yoyDelta !== null && yoyDelta >= 0 ? 'text-[#C5F467]' : 'text-[#FB7185]'
                }`}
              >
                {yoyDelta !== null && yoyDelta >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 mr-0.5" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 mr-0.5" />
                )}
                {yoyDelta !== null ? `${yoyDelta >= 0 ? '+' : ''}${yoyDelta.toFixed(1)}%` : 'N/D'}
              </span>
              <span className="text-[11px] text-[#929EAD]">
                vs {yoyPoint ? yoyPoint.periodo : 'año anterior'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* QUANTITATIVE BULLET / SEGMENTED SCALE VISUALIZATION */}
      <div className="relative z-10 mt-7 pt-5 border-t border-[#242C37]/80">
        <div className="flex items-center justify-between text-[11px] font-mono text-[#929EAD] mb-2">
          <span>ESCALA DE CUMPLIMIENTO CUANTITATIVA (BULLET PROGRESSION)</span>
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 bg-[#FB7185]/50 inline-block" /> &lt;80% Crítico
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 bg-[#F59E0B]/50 inline-block" /> 80-90% Alerta
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 bg-[#38BDF8]/40 inline-block" /> 90-100% En Rango
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 bg-[#C5F467] inline-block" /> 100%+ Meta
            </span>
          </span>
        </div>

        {/* The Track: 0% to 125% max scale */}
        <div className="relative h-6 w-full bg-[#0B0D10] border border-[#242C37] overflow-hidden flex">
          {/* Qualitative background bands */}
          {/* 0 to 80% (which is 80/125 = 64% of total track) */}
          <div className="h-full bg-[#FB7185]/10 border-r border-[#242C37]/50" style={{ width: `${(80 / 125) * 100}%` }} />
          {/* 80% to 90% (10/125 = 8%) */}
          <div className="h-full bg-[#F59E0B]/10 border-r border-[#242C37]/50" style={{ width: `${(10 / 125) * 100}%` }} />
          {/* 90% to 100% (10/125 = 8%) */}
          <div className="h-full bg-[#38BDF8]/10 border-r border-[#242C37]/50" style={{ width: `${(10 / 125) * 100}%` }} />
          {/* 100% to 125% (25/125 = 20%) */}
          <div className="h-full bg-[#C5F467]/10" style={{ width: `${(25 / 125) * 100}%` }} />

          {/* Actual Achievement Bar (Bullet Bar) */}
          <div
            className={`absolute top-1.5 bottom-1.5 left-0 transition-all duration-700 ${
              compliance && compliance >= 100
                ? 'bg-[#C5F467]'
                : compliance && compliance >= 90
                ? 'bg-[#38BDF8]'
                : 'bg-[#FB7185]'
            }`}
            style={{ width: `${(bulletPct / 125) * 100}%` }}
          />

          {/* Target Reference Marker at 100% (position 100/125 = 80%) */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] z-20"
            style={{ left: `${(100 / 125) * 100}%` }}
            title="Meta Objetivo 100%"
          />
        </div>

        {/* Scale labels */}
        <div className="relative mt-1.5 h-4 w-full text-[10px] font-mono text-[#626D7C]">
          <span className="absolute left-0">0%</span>
          <span className="absolute -translate-x-1/2" style={{ left: `${(80 / 125) * 100}%` }}>80%</span>
          <span className="absolute -translate-x-1/2" style={{ left: `${(90 / 125) * 100}%` }}>90%</span>
          <span className="absolute -translate-x-1/2 font-bold text-[#F1F5F9]" style={{ left: `${(100 / 125) * 100}%` }}>
            META 100%
          </span>
          <span className="absolute right-0">125%</span>
        </div>
      </div>
    </div>
  );
};
