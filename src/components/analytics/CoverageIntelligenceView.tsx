import React, { useState } from 'react';
import { DimensionAggregation, CommercialKPIs } from '../../types/commercial';
import {
  formatInteger,
  formatPercent,
  formatGuaranies
} from '../../services/dataNormalizer';
import { Users, Target, Search, ArrowUpDown, Truck, ShieldCheck, AlertCircle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface CoverageIntelligenceViewProps {
  routeAggs: DimensionAggregation[];
  supervisorAggs: DimensionAggregation[];
  zoneAggs: DimensionAggregation[];
  kpis: CommercialKPIs;
  onSelectRoute: (r: string) => void;
}

export const CoverageIntelligenceView: React.FC<CoverageIntelligenceViewProps> = ({
  routeAggs,
  supervisorAggs,
  zoneAggs,
  kpis,
  onSelectRoute
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortAsc, setSortAsc] = useState(false);

  const sortedRoutes = [...routeAggs]
    .filter(r => r.coberturaObj > 0)
    .sort((a, b) => {
      const diff = (b.cumplimientoCob || 0) - (a.cumplimientoCob || 0);
      return sortAsc ? -diff : diff;
    })
    .filter(r => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        r.nombre.toLowerCase().includes(q) ||
        (r.subtexto && r.subtexto.toLowerCase().includes(q))
      );
    });

  const chartData = sortedRoutes.slice(0, 16).map(r => ({
    name: r.nombre,
    plan: r.coberturaObj,
    real: r.clientesReal,
    cumplimiento: r.cumplimientoCob || 0,
    isGood: (r.cumplimientoCob || 0) >= 90
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-[#374151] bg-[#1F2937] p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#374151] pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
              <span className="font-bold text-[#F9FAFB]">COVERAGE & CLIENT STUDIO</span>
              <span>/</span>
              <span className="text-[#3B82F6] font-semibold">PENETRACIÓN DE PUNTOS DE VENTA</span>
            </div>
            <h2 className="mt-1 text-base font-bold text-[#F9FAFB]">
              Cobertura Efectiva de Clientes por Circuito Comercial & Vendedor
            </h2>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
            <span className="text-[#9CA3AF] font-sans">Clientes Reales:</span>
            <span className="font-bold text-[#14B8A6]">{formatInteger(kpis.clientesReales)}</span>
            <span className="text-[#4B5563]">|</span>
            <span className="text-[#9CA3AF] font-sans">Plan:</span>
            <span className="font-bold text-[#F9FAFB]">{formatInteger(kpis.coberturaPlanificada)}</span>
            <span className="text-[#4B5563]">|</span>
            <span className="font-bold text-[#38BDF8]">{formatPercent(kpis.cumplimientoCobertura)}</span>
          </div>
        </div>

        {/* Quick Analytical Summary */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-md border border-[#374151] bg-[#111827]">
            <div className="text-[10px] text-[#9CA3AF] font-semibold uppercase tracking-wider">Universo Total Planificado</div>
            <div className="text-sm font-bold text-[#F9FAFB] mt-1 font-mono tabular-nums">
              {formatInteger(kpis.coberturaPlanificada)} Puntos de Venta
            </div>
            <div className="text-[11px] text-[#9CA3AF] mt-1">
              Cartera teórica asignada a las 33 rutas comerciales
            </div>
          </div>

          <div className="p-3.5 rounded-md border border-[#374151] bg-[#111827]">
            <div className="text-[10px] text-[#9CA3AF] font-semibold uppercase tracking-wider">Clientes con Compra Efectiva</div>
            <div className="text-sm font-bold text-[#14B8A6] mt-1 font-mono tabular-nums">
              {formatInteger(kpis.clientesReales)} Clientes
            </div>
            <div className="text-[11px] text-[#9CA3AF] mt-1">
              Puntos atendidos con emisión de factura en el período
            </div>
          </div>

          <div className="p-3.5 rounded-md border border-[#374151] bg-[#111827]">
            <div className="text-[10px] text-[#9CA3AF] font-semibold uppercase tracking-wider">Rutas con Penetración &ge;90%</div>
            <div className="text-sm font-bold text-[#38BDF8] mt-1 font-mono tabular-nums">
              {routeAggs.filter(r => (r.cumplimientoCob || 0) >= 90).length} de {routeAggs.length} rutas
            </div>
            <div className="text-[11px] text-[#9CA3AF] mt-1">
              Circuitos con penetración dentro del rango aceptable
            </div>
          </div>
        </div>
      </div>

      {/* CHART: TOP RUTAS POR COBERTURA (Plan vs Real) */}
      <div className="rounded-lg border border-[#374151] bg-[#1F2937] p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#374151] pb-3 mb-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#F9FAFB]">
              Cobertura Planificada vs Clientes Efectivos por Ruta
            </h3>
            <p className="text-[11px] text-[#9CA3AF]">
              Comparativa cuantitativa de penetración por código de ruta
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-[#9CA3AF]">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-[#14B8A6]" /> Clientes Reales
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-[#4B5563]" /> Planificado
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 15, left: -10, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.6} vertical={false} />
              <XAxis
                dataKey="name"
                angle={-30}
                textAnchor="end"
                interval={0}
                tick={{ fontSize: 9, fill: '#9CA3AF' }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
              />
              <Tooltip
                formatter={(val: any, name: any) => [
                  `${val} clientes`,
                  name === 'real' ? 'Clientes Reales' : 'Planificado'
                ]}
                contentStyle={{
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  color: '#F9FAFB',
                  fontSize: '11px'
                }}
              />
              <Bar dataKey="plan" fill="#4B5563" radius={[3, 3, 0, 0]} name="plan" />
              <Bar
                dataKey="real"
                fill="#14B8A6"
                radius={[3, 3, 0, 0]}
                name="real"
                onClick={(entry: any) => {
                  if (entry?.name) onSelectRoute(entry.name);
                }}
                cursor="pointer"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* FULL ROUTE COVERAGE TABLE */}
      <div className="rounded-lg border border-[#374151] bg-[#1F2937] p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#374151] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#F9FAFB]">
              Matriz Detallada de Penetración por Ruta y Vendedor
            </h3>
            <span className="text-xs text-[#6B7280]">/</span>
            <span className="text-[11px] text-[#9CA3AF] font-mono">
              {sortedRoutes.length} rutas registradas
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="px-2.5 py-1 rounded border border-[#374151] bg-[#111827] text-xs font-semibold text-[#D1D5DB] hover:text-[#F9FAFB] hover:border-[#4B5563] transition-colors cursor-pointer"
            >
              {sortAsc ? 'Orden: Menor a Mayor ↑' : 'Orden: Mayor a Menor ↓'}
            </button>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Buscar ruta o vendedor..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-8 w-52 rounded-md border border-[#374151] bg-[#111827] pl-8 pr-3 text-xs text-[#F9FAFB] placeholder:text-[#6B7280] focus:border-[#3B82F6] focus:outline-hidden focus:ring-1 focus:ring-[#3B82F6]"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-md border border-[#374151]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#374151] bg-[#111827] text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                <th className="py-2.5 px-3">Código de Ruta</th>
                <th className="py-2.5 px-3">Vendedor & Supervisor</th>
                <th className="py-2.5 px-3 text-right">Clientes Reales</th>
                <th className="py-2.5 px-3 text-right">Cobertura Meta</th>
                <th className="py-2.5 px-3 text-right">Cumplimiento %</th>
                <th className="py-2.5 px-3 text-right">Brecha de Clientes</th>
                <th className="py-2.5 px-3 text-right">Facturación Asociada</th>
                <th className="py-2.5 px-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#374151]">
              {sortedRoutes.map((r, idx) => {
                const isGood = (r.cumplimientoCob || 0) >= 90;
                const cliGap = r.clientesReal - r.coberturaObj;

                return (
                  <tr key={r.clave} className="hover:bg-[#111827]/60 text-[#F9FAFB] transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-[#F9FAFB]">
                      {r.clave}
                    </td>
                    <td className="py-2.5 px-3 text-[#9CA3AF]">
                      {r.subtexto}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#F9FAFB] font-mono tabular-nums">
                      {r.clientesReal}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#9CA3AF] font-mono tabular-nums">
                      {r.coberturaObj}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold font-mono tabular-nums">
                      <span className={isGood ? 'text-[#14B8A6]' : 'text-[#EF4444]'}>
                        {formatPercent(r.cumplimientoCob)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold font-mono tabular-nums">
                      <span className={cliGap >= 0 ? 'text-[#14B8A6]' : 'text-[#EF4444]'}>
                        {cliGap >= 0 ? '+' : ''}{cliGap} cli
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#F9FAFB] font-mono tabular-nums">
                      {formatGuaranies(r.realFact, true)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => onSelectRoute(r.clave)}
                        className="rounded px-2.5 py-1 text-xs font-semibold text-[#3B82F6] hover:bg-[#3B82F6]/10 transition-colors cursor-pointer"
                      >
                        Explorar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
