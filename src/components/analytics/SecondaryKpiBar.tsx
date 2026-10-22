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
    <div className="border border-[#242C37] bg-[#12161C] divide-y lg:divide-y-0 lg:divide-x divide-[#242C37] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Volumen Físico */}
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#929EAD] mb-1">
          <span>DESPACHO FÍSICO</span>
          <Scale className="h-3.5 w-3.5 text-[#626D7C]" />
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono text-[#F1F5F9]">
          {formatTons(kpis.ventasToneladas, 2)}
        </div>
        <div className="mt-1 flex items-center justify-between text-xs font-mono text-[#929EAD]">
          <span>Meta: {formatTons(kpis.objetivoToneladas, 2)}</span>
          <span
            className={`font-bold ${
              (kpis.cumplimientoToneladas || 0) >= 100 ? 'text-[#C5F467]' : 'text-[#FB7185]'
            }`}
          >
            {formatPercent(kpis.cumplimientoToneladas)}
          </span>
        </div>
        <div className="mt-1 text-[10px] font-mono text-[#626D7C]">
          Delta: {kpis.diferenciaToneladas >= 0 ? '+' : ''}{formatTons(kpis.diferenciaToneladas, 2)}
        </div>
      </div>

      {/* 2. Cobertura de Clientes */}
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#929EAD] mb-1">
          <span>COBERTURA DE CLIENTES</span>
          <Users className="h-3.5 w-3.5 text-[#626D7C]" />
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono text-[#F1F5F9]">
          {isProductFiltered ? 'N/A' : `${formatInteger(kpis.clientesReales)} cli`}
        </div>
        <div className="mt-1 flex items-center justify-between text-xs font-mono text-[#929EAD]">
          <span>{isProductFiltered ? 'Por ruta/zona' : `Plan: ${formatInteger(kpis.coberturaPlanificada)}`}</span>
          <span
            className={`font-bold ${
              isProductFiltered
                ? 'text-[#626D7C]'
                : (kpis.cumplimientoCobertura || 0) >= 90
                ? 'text-[#C5F467]'
                : 'text-[#F59E0B]'
            }`}
          >
            {isProductFiltered ? 'N/D' : formatPercent(kpis.cumplimientoCobertura)}
          </span>
        </div>
        <div className="mt-1 text-[10px] font-mono text-[#626D7C]">
          {isProductFiltered ? 'Incompatible con filtro de producto' : `Brecha: ${kpis.diferenciaCobertura} clientes`}
        </div>
      </div>

      {/* 3. Valorización por Tonelada (Precio Medio Efectivo) */}
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#929EAD] mb-1">
          <span>VALORIZACIÓN / TONELADA</span>
          <TrendingUp className="h-3.5 w-3.5 text-[#626D7C]" />
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono text-[#F1F5F9]">
          {formatGuaranies(avgPricePerTon, true)}
        </div>
        <div className="mt-1 flex items-center justify-between text-xs font-mono text-[#929EAD]">
          <span>Facturación / Volumen</span>
          <span className="text-[#38BDF8]">PYG / Ton</span>
        </div>
        <div className="mt-1 text-[10px] font-mono text-[#626D7C]">
          Rendimiento monetario por unidad despachada
        </div>
      </div>

      {/* 4. Intensidad por Ruta & Conteo Operativo */}
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#929EAD] mb-1">
          <span>DENSIDAD POR RUTA</span>
          <Layers className="h-3.5 w-3.5 text-[#626D7C]" />
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono text-[#F1F5F9]">
          {formatGuaranies(avgSalesPerRoute, true)}
        </div>
        <div className="mt-1 flex items-center justify-between text-xs font-mono text-[#929EAD]">
          <span>{kpis.totalRutas} rutas activas</span>
          <span>{kpis.totalSupervisores} supervisores</span>
        </div>
        <div className="mt-1 text-[10px] font-mono text-[#626D7C]">
          Facturación promedio por circuito comercial
        </div>
      </div>
    </div>
  );
};
