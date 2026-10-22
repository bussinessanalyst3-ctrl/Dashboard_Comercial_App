import React from 'react';
import { CommercialKPIs, FilterState } from '../../types/commercial';
import { formatPeriodDisplay, formatGuaranies, formatTons } from '../../services/dataNormalizer';
import { ShieldCheck, Activity, AlertCircle, CheckCircle, Database } from 'lucide-react';

interface ContextBannerProps {
  filters: FilterState;
  kpis: CommercialKPIs;
  totalVentasRecords: number;
  supabaseConnected: boolean;
}

export const ContextBanner: React.FC<ContextBannerProps> = ({
  filters,
  kpis,
  totalVentasRecords,
  supabaseConnected
}) => {
  // Generate real data-driven narrative diagnosis
  const generateNarrative = (): string => {
    if (kpis.ventasFacturacion === 0) {
      return 'No se registran ventas para los filtros activos. Seleccione otro período o restablezca las dimensiones de búsqueda.';
    }

    const cFact = kpis.cumplimientoFacturacion;
    const isAboveTarget = cFact !== null && cFact >= 100;
    const isAcceptable = cFact !== null && cFact >= 90;

    let conclusion = '';
    if (isAboveTarget) {
      conclusion = `El cumplimiento de facturación supera la meta establecida con un ${cFact?.toFixed(1)}% (+${formatGuaranies(kpis.diferenciaFacturacion, true)} de superávit monetario).`;
    } else if (isAcceptable) {
      conclusion = `El cumplimiento de facturación se ubica en rango controlado con un ${cFact?.toFixed(1)}% (${formatGuaranies(kpis.diferenciaFacturacion, true)} respecto al objetivo mensual).`;
    } else {
      conclusion = `El cumplimiento de facturación se encuentra por debajo del objetivo mensual (${cFact?.toFixed(1)}%), generando una brecha comercial de ${formatGuaranies(kpis.diferenciaFacturacion, true)}.`;
    }

    // Add physical volume context
    conclusion += ` El despacho físico alcanza ${formatTons(kpis.ventasToneladas, 2)} (${kpis.cumplimientoToneladas?.toFixed(1) || 'N/D'}% de meta física).`;

    // Add dimension context if filtered
    if (filters.zona !== 'TODAS') {
      conclusion += ` Enfoque territorial activo en zona ${filters.zona}.`;
    }
    if (filters.producto !== 'TODOS') {
      conclusion += ` Análisis específico de la línea comercial ${filters.producto}.`;
    }

    return conclusion;
  };

  const periodLabel = filters.periodo === 'TODOS'
    ? 'TODOS LOS PERÍODOS ACUMULADOS'
    : `${formatPeriodDisplay(filters.periodo).toUpperCase()} (${filters.periodo.toUpperCase()})`;

  return (
    <div className="border border-[#242C37] bg-[#12161C] p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#242C37]/80 pb-3">
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <span className="font-extrabold tracking-wider text-[#F1F5F9]">
            COMMERCIAL PERFORMANCE STUDIO
          </span>
          <span className="text-[#626D7C]">/</span>
          <span className="text-[#C5F467] font-bold tracking-wide">
            {periodLabel}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono text-[#929EAD]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#C5F467] animate-pulse" />
            <span>Actualizado en vivo</span>
          </span>
          <span className="text-[#333D4D]">|</span>
          <span>{totalVentasRecords} filas procesadas</span>
          <span className="text-[#333D4D]">|</span>
          <span className="text-[#626D7C]">
            {supabaseConnected ? 'Supabase Cloud Sync' : 'Local Persistence'}
          </span>
        </div>
      </div>

      {/* Narrative Sentence strictly grounded in real data */}
      <div className="mt-3 flex items-start gap-2.5">
        <div className="mt-0.5 shrink-0 text-[#C5F467]">
          <Activity className="h-4 w-4" />
        </div>
        <p className="text-xs sm:text-sm font-sans leading-relaxed text-[#F1F5F9]/90 font-medium">
          {generateNarrative()}
        </p>
      </div>
    </div>
  );
};
