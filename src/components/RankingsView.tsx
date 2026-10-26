import React, { useState } from 'react';
import { DimensionAggregation } from '../types/commercial';
import {
  formatGuaranies,
  formatTons,
  formatPercent
} from '../services/dataNormalizer';
import { Trophy, Medal, Award, TrendingUp, Users, Package, Truck, ArrowUpRight } from 'lucide-react';

interface RankingsViewProps {
  vendorAggs: DimensionAggregation[];
  routeAggs: DimensionAggregation[];
  productAggs: DimensionAggregation[];
  supervisorAggs: DimensionAggregation[];
  onSelectVendor?: (v: string) => void;
  onSelectRoute?: (r: string) => void;
}

export const RankingsView: React.FC<RankingsViewProps> = ({
  vendorAggs,
  routeAggs,
  productAggs,
  supervisorAggs,
  onSelectVendor,
  onSelectRoute
}) => {
  const [metricTab, setMetricTab] = useState<'facturacion' | 'toneladas' | 'cobertura'>('facturacion');

  const sortedVendors = [...vendorAggs].sort((a, b) => {
    if (metricTab === 'facturacion') return b.realFact - a.realFact;
    if (metricTab === 'toneladas') return b.realTon - a.realTon;
    return (b.cumplimientoCob || 0) - (a.cumplimientoCob || 0);
  });

  const sortedRoutes = [...routeAggs].sort((a, b) => (b.cumplimientoCob || 0) - (a.cumplimientoCob || 0));
  const sortedSupervisors = [...supervisorAggs].sort((a, b) => (b.cumplimientoFact || 0) - (a.cumplimientoFact || 0));

  const maxVendorVal = sortedVendors[0]
    ? metricTab === 'facturacion'
      ? sortedVendors[0].realFact
      : metricTab === 'toneladas'
      ? sortedVendors[0].realTon
      : sortedVendors[0].cumplimientoCob || 100
    : 1;

  const getRankBadge = (index: number) => {
    if (index === 0) {
      return (
        <span className="flex h-5 w-5 rounded-full items-center justify-center font-mono font-bold text-[11px] bg-[#F59E0B] text-slate-950 shadow-xs">
          1
        </span>
      );
    }
    if (index === 1) {
      return (
        <span className="flex h-5 w-5 rounded-full items-center justify-center font-mono font-bold text-[11px] bg-[#94A3B8] text-slate-950 shadow-xs">
          2
        </span>
      );
    }
    if (index === 2) {
      return (
        <span className="flex h-5 w-5 rounded-full items-center justify-center font-mono font-bold text-[11px] bg-[#D97706] text-slate-950 shadow-xs">
          3
        </span>
      );
    }
    return (
      <span className="flex h-5 w-5 rounded-full items-center justify-center font-mono text-[11px] text-[#6B7280] bg-[#111827] border border-[#374151]">
        {index + 1}
      </span>
    );
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Header with Switcher */}
      <div className="rounded-lg border border-[#374151] bg-[#1F2937] p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#374151] pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#9CA3AF]">
              <span>Desempeño y Efectividad</span>
              <span>/</span>
              <span className="text-[#3B82F6] font-semibold">Líderes Comerciales</span>
            </div>
            <h2 className="mt-1 text-base font-bold text-[#F9FAFB]">
              Rankings de Rendimiento & Cobertura Efectiva
            </h2>
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#111827] border border-[#374151] rounded-md">
            <button
              onClick={() => setMetricTab('facturacion')}
              className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
                metricTab === 'facturacion'
                  ? 'bg-[#3B82F6] text-white shadow-xs'
                  : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
              }`}
            >
              Facturación
            </button>
            <button
              onClick={() => setMetricTab('toneladas')}
              className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
                metricTab === 'toneladas'
                  ? 'bg-[#3B82F6] text-white shadow-xs'
                  : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
              }`}
            >
              Toneladas
            </button>
            <button
              onClick={() => setMetricTab('cobertura')}
              className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
                metricTab === 'cobertura'
                  ? 'bg-[#3B82F6] text-white shadow-xs'
                  : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
              }`}
            >
              Cobertura
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* LEADERBOARD 1: VENDEDORES */}
        <div className="rounded-lg border border-[#374151] bg-[#1F2937] p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#374151] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#3B82F6]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#F9FAFB]">
                Ranking de Vendedores ({metricTab.toUpperCase()})
              </h3>
            </div>
            <span className="text-xs text-[#9CA3AF]">{sortedVendors.length} vendedores</span>
          </div>

          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
            {sortedVendors.slice(0, 16).map((vendor, idx) => {
              const currentVal =
                metricTab === 'facturacion'
                  ? vendor.realFact
                  : metricTab === 'toneladas'
                  ? vendor.realTon
                  : vendor.cumplimientoCob || 0;

              const pct = maxVendorVal > 0 ? (currentVal / maxVendorVal) * 100 : 0;

              return (
                <div
                  key={vendor.clave}
                  onClick={() => onSelectVendor?.(vendor.nombre)}
                  className="rounded-md border border-[#374151] bg-[#111827] p-3 hover:bg-[#243042] cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {getRankBadge(idx)}
                      <div className="truncate">
                        <div className="text-xs font-semibold text-[#F9FAFB] truncate">
                          {vendor.nombre}
                        </div>
                        <div className="text-[11px] text-[#9CA3AF] truncate">
                          {vendor.subtexto}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold font-mono text-[#F9FAFB]">
                        {metricTab === 'facturacion' && formatGuaranies(vendor.realFact)}
                        {metricTab === 'toneladas' && formatTons(vendor.realTon, 2)}
                        {metricTab === 'cobertura' && formatPercent(vendor.cumplimientoCob)}
                      </div>
                      <div className="text-[11px] font-mono text-[#14B8A6]">
                        {formatPercent(vendor.cumplimientoFact)} de meta
                      </div>
                    </div>
                  </div>

                  <div className="h-1.5 w-full bg-[#1F2937] border border-[#374151] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#14B8A6] rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* LEADERBOARD 2: SUPERVISORES Y RUTAS */}
        <div className="space-y-6">
          {/* Supervisores */}
          <div className="rounded-lg border border-[#374151] bg-[#1F2937] p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#374151] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-[#3B82F6]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#F9FAFB]">
                  Cumplimiento por Supervisor
                </h3>
              </div>
            </div>

            <div className="space-y-3">
              {sortedSupervisors.map((sup, idx) => (
                <div key={sup.clave} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[10px] text-[#6B7280] font-mono">{idx + 1}.</span>
                      <span className="font-semibold text-[#F9FAFB] truncate">{sup.nombre}</span>
                      <span className="text-[11px] text-[#9CA3AF]">({sup.subtexto})</span>
                    </div>
                    <span className="font-bold font-mono text-[#14B8A6]">
                      {formatPercent(sup.cumplimientoFact)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#9CA3AF]">
                    <span>Real: {formatGuaranies(sup.realFact, true)}</span>
                    <span>Meta: {formatGuaranies(sup.objetivoFact, true)}</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#111827] border border-[#374151] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        (sup.cumplimientoFact || 0) >= 100 ? 'bg-[#14B8A6]' : 'bg-[#F59E0B]'
                      }`}
                      style={{ width: `${Math.min(sup.cumplimientoFact || 0, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rutas con Mejor Cobertura */}
          <div className="rounded-lg border border-[#374151] bg-[#1F2937] p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#374151] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-[#14B8A6]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#F9FAFB]">
                  Líderes de Penetración Efectiva (Rutas)
                </h3>
              </div>
            </div>

            <div className="space-y-2">
              {sortedRoutes.slice(0, 5).map((r, idx) => (
                <div
                  key={r.clave}
                  onClick={() => onSelectRoute?.(r.clave)}
                  className="flex items-center justify-between text-xs p-3 rounded-md border border-[#374151] bg-[#111827] hover:bg-[#243042] cursor-pointer transition-colors"
                >
                  <div className="truncate">
                    <div className="font-semibold text-[#F9FAFB] flex items-center gap-1.5">
                      <Medal className="h-3.5 w-3.5 text-[#14B8A6]" />
                      {r.clave}
                    </div>
                    <div className="text-[11px] text-[#9CA3AF] truncate">{r.subtexto}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold font-mono text-[#F9FAFB]">
                      {r.clientesReal} / {r.coberturaObj} cli
                    </div>
                    <div className="text-[11px] font-mono text-[#14B8A6] font-semibold">
                      {formatPercent(r.cumplimientoCob)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
