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
        <span className="flex h-5 w-5 items-center justify-center font-mono font-bold text-xs bg-[#C5F467] text-[#0B0D10]">
          1
        </span>
      );
    }
    if (index === 1) {
      return (
        <span className="flex h-5 w-5 items-center justify-center font-mono font-bold text-xs bg-[#38BDF8] text-[#0B0D10]">
          2
        </span>
      );
    }
    if (index === 2) {
      return (
        <span className="flex h-5 w-5 items-center justify-center font-mono font-bold text-xs bg-[#F59E0B] text-[#0B0D10]">
          3
        </span>
      );
    }
    return (
      <span className="flex h-5 w-5 items-center justify-center font-mono text-xs text-[#626D7C]">
        {index + 1}
      </span>
    );
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header with Switcher */}
      <div className="border border-[#242C37] bg-[#12161C] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#242C37] pb-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] text-[#626D7C] uppercase tracking-wider">
              <span>CUADRO DE HONOR Y EFICIENCIA</span>
              <span>/</span>
              <span className="text-[#C5F467] font-bold">LÍDERES COMERCIALES</span>
            </div>
            <h2 className="mt-1 text-base font-bold text-[#F1F5F9]">
              Rankings de Rendimiento & Cobertura Efectiva
            </h2>
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#0B0D10] border border-[#242C37] rounded-sm">
            <button
              onClick={() => setMetricTab('facturacion')}
              className={`px-3 py-1 text-xs transition-colors ${
                metricTab === 'facturacion'
                  ? 'bg-[#191F27] text-[#C5F467] font-bold border border-[#333D4D]'
                  : 'text-[#929EAD] hover:text-[#F1F5F9]'
              }`}
            >
              Facturación
            </button>
            <button
              onClick={() => setMetricTab('toneladas')}
              className={`px-3 py-1 text-xs transition-colors ${
                metricTab === 'toneladas'
                  ? 'bg-[#191F27] text-[#C5F467] font-bold border border-[#333D4D]'
                  : 'text-[#929EAD] hover:text-[#F1F5F9]'
              }`}
            >
              Toneladas
            </button>
            <button
              onClick={() => setMetricTab('cobertura')}
              className={`px-3 py-1 text-xs transition-colors ${
                metricTab === 'cobertura'
                  ? 'bg-[#191F27] text-[#C5F467] font-bold border border-[#333D4D]'
                  : 'text-[#929EAD] hover:text-[#F1F5F9]'
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
        <div className="border border-[#242C37] bg-[#12161C] p-5">
          <div className="flex items-center justify-between border-b border-[#242C37] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#C5F467]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#F1F5F9]">
                Ranking de Vendedores ({metricTab.toUpperCase()})
              </h3>
            </div>
            <span className="text-xs text-[#626D7C]">{sortedVendors.length} vendedores</span>
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
                  className="border border-[#242C37] bg-[#0B0D10] p-2.5 hover:bg-[#191F27] cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      {getRankBadge(idx)}
                      <div className="truncate">
                        <div className="text-xs font-bold text-[#F1F5F9] truncate">
                          {vendor.nombre}
                        </div>
                        <div className="text-[10px] text-[#929EAD] font-sans truncate">
                          {vendor.subtexto}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-[#F1F5F9]">
                        {metricTab === 'facturacion' && formatGuaranies(vendor.realFact)}
                        {metricTab === 'toneladas' && formatTons(vendor.realTon, 2)}
                        {metricTab === 'cobertura' && formatPercent(vendor.cumplimientoCob)}
                      </div>
                      <div className="text-[10px] text-[#C5F467]">
                        {formatPercent(vendor.cumplimientoFact)} de meta
                      </div>
                    </div>
                  </div>

                  <div className="h-1 w-full bg-[#12161C] border border-[#242C37] overflow-hidden">
                    <div
                      className="h-full bg-[#C5F467] transition-all duration-300"
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
          <div className="border border-[#242C37] bg-[#12161C] p-5">
            <div className="flex items-center justify-between border-b border-[#242C37] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-[#38BDF8]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#F1F5F9]">
                  Cumplimiento por Supervisor
                </h3>
              </div>
            </div>

            <div className="space-y-3">
              {sortedSupervisors.map((sup, idx) => (
                <div key={sup.clave} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[10px] text-[#626D7C]">{idx + 1}.</span>
                      <span className="font-bold text-[#F1F5F9] truncate">{sup.nombre}</span>
                      <span className="text-[10px] text-[#929EAD]">({sup.subtexto})</span>
                    </div>
                    <span className="font-bold text-[#C5F467]">
                      {formatPercent(sup.cumplimientoFact)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#929EAD]">
                    <span>Real: {formatGuaranies(sup.realFact, true)}</span>
                    <span>Meta: {formatGuaranies(sup.objetivoFact, true)}</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#0B0D10] border border-[#242C37] overflow-hidden">
                    <div
                      className={`h-full ${
                        (sup.cumplimientoFact || 0) >= 100 ? 'bg-[#C5F467]' : 'bg-[#F59E0B]'
                      }`}
                      style={{ width: `${Math.min(sup.cumplimientoFact || 0, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rutas con Mejor Cobertura */}
          <div className="border border-[#242C37] bg-[#12161C] p-5">
            <div className="flex items-center justify-between border-b border-[#242C37] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-[#C5F467]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#F1F5F9]">
                  Líderes de Penetración Efectiva (Rutas)
                </h3>
              </div>
            </div>

            <div className="space-y-2">
              {sortedRoutes.slice(0, 5).map((r, idx) => (
                <div
                  key={r.clave}
                  onClick={() => onSelectRoute?.(r.clave)}
                  className="flex items-center justify-between text-xs p-2.5 border border-[#242C37] bg-[#0B0D10] hover:bg-[#191F27] cursor-pointer transition-colors"
                >
                  <div className="truncate">
                    <div className="font-bold text-[#F1F5F9] flex items-center gap-1.5">
                      <Medal className="h-3.5 w-3.5 text-[#C5F467]" />
                      {r.clave}
                    </div>
                    <div className="text-[10px] text-[#929EAD] font-sans truncate">{r.subtexto}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#F1F5F9]">
                      {r.clientesReal} / {r.coberturaObj} cli
                    </div>
                    <div className="text-[10px] text-[#C5F467] font-bold">
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
