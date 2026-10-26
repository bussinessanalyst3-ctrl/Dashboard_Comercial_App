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
    <div className="rounded-lg border border-[#374151] bg-[#1F2937] p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#374151] pb-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold tracking-tight text-[#F9FAFB]">
            Diagnóstico Ejecutivo Comercial
          </span>
          <span className="text-[#4B5563]">/</span>
          <span className="text-[#3B82F6] font-semibold">
            {periodLabel}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#9CA3AF]">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span className="h-2 w-2 rounded-full bg-[#14B8A6] animate-pulse" />
            <span>Datos activos</span>
          </span>
          <span className="text-[#4B5563]">|</span>
          <span className="font-mono text-[11px]">{totalVentasRecords} registros</span>
          <span className="text-[#4B5563]">|</span>
          <span className="text-[#9CA3AF]">
            {supabaseConnected ? 'Supabase Sync' : 'Persistencia Local'}
          </span>
        </div>
      </div>

      {/* Narrative Sentence strictly grounded in real data */}
      <div className="mt-3.5 flex items-start gap-3">
        <div className="mt-0.5 shrink-0 text-[#3B82F6]">
          <Activity className="h-5 w-5" />
        </div>
        <p className="text-xs sm:text-sm leading-relaxed text-[#F9FAFB]/90 font-medium">
          {generateNarrative()}
        </p>
      </div>
    </div>
  );
};
