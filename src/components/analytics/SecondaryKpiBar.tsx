import React from 'react';
import { CommercialKPIs } from '../../types/commercial';
import {
  formatGuaranies,
  formatTons,
  formatPercent,
  formatInteger
} from '../../services/dataNormalizer';
import { Scale, Users, TrendingUp, Layers, CheckCircle2, AlertTriangle } from 'lucide-react';

interface SecondaryKpiBarProps {
  kpis: CommercialKPIs;
  isProductFiltered: boolean;
}

export const SecondaryKpiBar: React.FC<SecondaryKpiBarProps> = ({ kpis, isProductFiltered }) => {
  // Analytical derived metrics
  const avgPricePerTon =
    kpis.ventasToneladas > 0 ? Math.round(kpis.ventasFacturacion / kpis.ventasToneladas) : 0;
  const avgSalesPerRoute =
    kpis.totalRutas > 0 ? Math.round(kpis.ventasFacturacion / kpis.totalRutas) : 0;

  return (
    <div className="rounded-lg border border-[#374151] bg-[#1F2937] divide-y lg:divide-y-0 lg:divide-x divide-[#374151] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 shadow-xs">
      {/* 1. Volumen Físico */}
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between text-xs font-medium text-[#9CA3AF] mb-1">
          <span>Despacho Físico</span>
          <Scale className="h-4 w-4 text-[#6B7280]" />
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono text-[#F9FAFB]">
          {formatTons(kpis.ventasToneladas, 2)}
        </div>
        <div className="mt-1 flex items-center justify-between text-xs font-mono text-[#9CA3AF]">
          <span>Meta: {formatTons(kpis.objetivoToneladas, 2)}</span>
          <span
            className={`font-bold ${
              (kpis.cumplimientoToneladas || 0) >= 100 ? 'text-[#14B8A6]' : 'text-[#EF4444]'
            }`}
          >
            {formatPercent(kpis.cumplimientoToneladas)}
          </span>
        </div>
        <div className="mt-1 text-[11px] font-mono text-[#6B7280]">
          Delta: {kpis.diferenciaToneladas >= 0 ? '+' : ''}{formatTons(kpis.diferenciaToneladas, 2)}
        </div>
      </div>

      {/* 2. Cobertura de Clientes */}
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between text-xs font-medium text-[#9CA3AF] mb-1">
          <span>Cobertura de Clientes</span>
          <Users className="h-4 w-4 text-[#6B7280]" />
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono text-[#F9FAFB]">
          {isProductFiltered ? 'N/A' : `${formatInteger(kpis.clientesReales)} cli`}
        </div>
        <div className="mt-1 flex items-center justify-between text-xs font-mono text-[#9CA3AF]">
          <span>{isProductFiltered ? 'Por ruta/zona' : `Plan: ${formatInteger(kpis.coberturaPlanificada)}`}</span>
          <span
            className={`font-bold ${
              isProductFiltered
                ? 'text-[#6B7280]'
                : (kpis.cumplimientoCobertura || 0) >= 90
                ? 'text-[#14B8A6]'
                : 'text-[#F59E0B]'
            }`}
          >
            {isProductFiltered ? 'N/D' : formatPercent(kpis.cumplimientoCobertura)}
          </span>
        </div>
        <div className="mt-1 text-[11px] font-mono text-[#6B7280]">
          {isProductFiltered ? 'Incompatible con filtro de producto' : `Brecha: ${kpis.diferenciaCobertura} clientes`}
        </div>
      </div>

      {/* 3. Valorización por Tonelada (Precio Medio Efectivo) */}
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between text-xs font-medium text-[#9CA3AF] mb-1">
          <span>Valorización / Tonelada</span>
          <TrendingUp className="h-4 w-4 text-[#6B7280]" />
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono text-[#F9FAFB]">
          {formatGuaranies(avgPricePerTon, true)}
        </div>
        <div className="mt-1 flex items-center justify-between text-xs font-mono text-[#9CA3AF]">
          <span>Facturación / Volumen</span>
          <span className="text-[#3B82F6] font-semibold">PYG / Ton</span>
        </div>
        <div className="mt-1 text-[11px] text-[#6B7280]">
          Rendimiento monetario medio
        </div>
      </div>

      {/* 4. Densidad por Ruta */}
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between text-xs font-medium text-[#9CA3AF] mb-1">
          <span>Densidad por Circuito</span>
          <Layers className="h-4 w-4 text-[#6B7280]" />
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono text-[#F9FAFB]">
          {formatGuaranies(avgSalesPerRoute, true)}
        </div>
        <div className="mt-1 flex items-center justify-between text-xs font-mono text-[#9CA3AF]">
          <span>{kpis.totalRutas} rutas activas</span>
          <span>{kpis.totalSupervisores} supervisores</span>
        </div>
        <div className="mt-1 text-[11px] text-[#6B7280]">
          Facturación promedio por ruta
        </div>
      </div>
    </div>
  );
};
