import React, { useState } from 'react';
import { DimensionAggregation } from '../types/commercial';
import {
  formatGuaranies,
  formatTons,
  formatPercent
} from '../services/dataNormalizer';
import { Trophy, Medal, Award, TrendingUp, Users, Package, Truck } from 'lucide-react';

interface RankingsViewProps {
  vendorAggs: DimensionAggregation[];
  routeAggs: DimensionAggregation[];
  productAggs: DimensionAggregation[];
  supervisorAggs: DimensionAggregation[];
}

export const RankingsView: React.FC<RankingsViewProps> = ({
  vendorAggs,
  routeAggs,
  productAggs,
  supervisorAggs
}) => {
  const [metricTab, setMetricTab] = useState<'facturacion' | 'toneladas' | 'cobertura'>('facturacion');

  // Top Sellers by selected metric
  const sortedVendors = [...vendorAggs].sort((a, b) => {
    if (metricTab === 'facturacion') return b.realFact - a.realFact;
    if (metricTab === 'toneladas') return b.realTon - a.realTon;
    return (b.cumplimientoCob || 0) - (a.cumplimientoCob || 0);
  });

  // Top Routes by Cobertura
  const sortedRoutes = [...routeAggs].sort((a, b) => (b.cumplimientoCob || 0) - (a.cumplimientoCob || 0));

  // Top Products by Facturación
  const sortedProducts = [...productAggs].sort((a, b) => b.realFact - a.realFact);

  // Top Supervisors by Cumplimiento
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
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-800 font-bold text-xs">
          1
        </span>
      );
    }
    if (index === 1) {
      return (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-700 font-bold text-xs">
          2
        </span>
      );
    }
    if (index === 2) {
      return (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-700/10 text-amber-900 font-bold text-xs">
          3
        </span>
      );
    }
    return (
      <span className="flex h-6 w-6 items-center justify-center text-slate-400 font-medium text-xs">
        {index + 1}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Metric Switcher */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Rankings de Desempeño Comercial
          </h2>
          <p className="text-xs text-slate-500">
            Cuadros de honor y ordenamiento por efectividad de ventas, cobertura y cumplimiento.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setMetricTab('facturacion')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              metricTab === 'facturacion'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Por Facturación
          </button>
          <button
            onClick={() => setMetricTab('toneladas')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              metricTab === 'toneladas'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Por Toneladas
          </button>
          <button
            onClick={() => setMetricTab('cobertura')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              metricTab === 'cobertura'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Por Cobertura
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* LEADERBOARD 1: VENDEDORES */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Top Vendedores ({metricTab.toUpperCase()})
              </h3>
            </div>
            <span className="text-xs text-slate-400">{sortedVendors.length} vendedores</span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {sortedVendors.slice(0, 15).map((vendor, idx) => {
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
                  className="rounded-lg border border-slate-100 p-2.5 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      {getRankBadge(idx)}
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {vendor.nombre}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {vendor.subtexto}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold font-mono text-slate-900">
                        {metricTab === 'facturacion' && formatGuaranies(vendor.realFact)}
                        {metricTab === 'toneladas' && formatTons(vendor.realTon)}
                        {metricTab === 'cobertura' && formatPercent(vendor.cumplimientoCob)}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-semibold">
                        {formatPercent(vendor.cumplimientoFact)} de meta
                      </div>
                    </div>
                  </div>

                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-slate-900 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* LEADERBOARD 2: SUPERVISORES Y PRODUCTOS */}
        <div className="space-y-6">
          {/* Top Supervisores */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-slate-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Cumplimiento por Supervisor
                </h3>
              </div>
            </div>

            <div className="space-y-3">
              {sortedSupervisors.map((sup, idx) => (
                <div key={sup.clave} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-bold text-slate-900">{idx + 1}.</span>
                      <span className="font-semibold text-slate-800 truncate">{sup.nombre}</span>
                      <span className="text-[10px] text-slate-400">({sup.subtexto})</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-700">
                      {formatPercent(sup.cumplimientoFact)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Real: {formatGuaranies(sup.realFact, true)}</span>
                    <span>Obj: {formatGuaranies(sup.objetivoFact, true)}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        (sup.cumplimientoFact || 0) >= 100 ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(sup.cumplimientoFact || 0, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Rutas por Cobertura */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-slate-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Líderes de Cobertura Efectiva (Rutas)
                </h3>
              </div>
            </div>

            <div className="space-y-2.5">
              {sortedRoutes.slice(0, 5).map((r, idx) => (
                <div
                  key={r.clave}
                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100"
                >
                  <div className="truncate">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Medal className="h-3.5 w-3.5 text-amber-500" />
                      {r.clave}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">{r.subtexto}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold font-mono text-slate-900">
                      {r.clientesReal} / {r.coberturaObj} cli
                    </div>
                    <div className="text-[10px] text-emerald-700 font-bold">
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
