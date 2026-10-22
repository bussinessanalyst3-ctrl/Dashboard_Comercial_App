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
      <div className="border border-[#242C37] bg-[#12161C] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#242C37] pb-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-[#929EAD]">
              <span className="font-extrabold text-[#F1F5F9]">COVERAGE & CLIENT STUDIO</span>
              <span>/</span>
              <span className="text-[#C5F467]">PENETRACIÓN DE PUNTOS DE VENTA</span>
            </div>
            <h2 className="mt-1 text-base font-bold text-[#F1F5F9]">
              Cobertura Efectiva de Clientes por Circuito Comercial & Vendedor
            </h2>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="text-[#929EAD]">Clientes Reales:</span>
            <span className="font-bold text-[#C5F467]">{formatInteger(kpis.clientesReales)}</span>
            <span className="text-[#333D4D]">|</span>
            <span className="text-[#929EAD]">Plan:</span>
            <span className="font-bold text-[#F1F5F9]">{formatInteger(kpis.coberturaPlanificada)}</span>
            <span className="text-[#333D4D]">|</span>
            <span className="font-bold text-[#38BDF8]">{formatPercent(kpis.cumplimientoCobertura)}</span>
          </div>
        </div>

        {/* Quick Analytical Summary */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-3 border border-[#242C37] bg-[#0B0D10]">
            <div className="text-[10px] text-[#626D7C] uppercase">Universo Total Planificado</div>
            <div className="text-sm font-bold text-[#F1F5F9] mt-0.5">
              {formatInteger(kpis.coberturaPlanificada)} Puntos de Venta
            </div>
            <div className="text-[11px] text-[#929EAD] mt-1">
              Cartera teórica asignada a las 33 rutas comerciales
            </div>
          </div>

          <div className="p-3 border border-[#242C37] bg-[#0B0D10]">
            <div className="text-[10px] text-[#626D7C] uppercase">Clientes con Compra Efectiva</div>
            <div className="text-sm font-bold text-[#C5F467] mt-0.5">
              {formatInteger(kpis.clientesReales)} Clientes
            </div>
            <div className="text-[11px] text-[#929EAD] mt-1">
              Puntos atendidos con emisión de factura en el período
            </div>
          </div>

          <div className="p-3 border border-[#242C37] bg-[#0B0D10]">
            <div className="text-[10px] text-[#626D7C] uppercase">Rutas con Penetración &ge;90%</div>
            <div className="text-sm font-bold text-[#38BDF8] mt-0.5">
              {routeAggs.filter(r => (r.cumplimientoCob || 0) >= 90).length} de {routeAggs.length} rutas
            </div>
            <div className="text-[11px] text-[#929EAD] mt-1">
              Circuitos con penetración dentro del rango aceptable
            </div>
          </div>
        </div>
      </div>

      {/* CHART: TOP RUTAS POR COBERTURA (Plan vs Real) */}
      <div className="border border-[#242C37] bg-[#12161C] p-5">
        <div className="flex items-center justify-between border-b border-[#242C37] pb-3 mb-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#F1F5F9]">
              Cobertura Planificada vs Clientes Efectivos por Ruta
            </h3>
            <p className="text-[11px] font-mono text-[#929EAD]">
              Comparativa cuantitativa de penetración por código de ruta
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-[#929EAD]">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 bg-[#C5F467]" /> Clientes Reales
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 bg-[#333D4D]" /> Planificado
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 15, left: -10, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="2 2" stroke="#1F2732" vertical={false} />
              <XAxis
                dataKey="name"
                angle={-30}
                textAnchor="end"
                interval={0}
                tick={{ fontSize: 9, fill: '#929EAD', fontFamily: 'JetBrains Mono' }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#626D7C', fontFamily: 'JetBrains Mono' }}
              />
              <Tooltip
                formatter={(val: any, name: any) => [
                  `${val} clientes`,
                  name === 'real' ? 'Clientes Reales' : 'Planificado'
                ]}
                contentStyle={{
                  backgroundColor: '#0B0D10',
                  border: '1px solid #242C37',
                  borderRadius: '2px',
                  color: '#F1F5F9',
                  fontFamily: 'JetBrains Mono',
                  fontSize: '11px'
                }}
              />
              <Bar dataKey="plan" fill="#333D4D" radius={[2, 2, 0, 0]} name="plan" />
              <Bar
                dataKey="real"
                fill="#C5F467"
                radius={[2, 2, 0, 0]}
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
      <div className="border border-[#242C37] bg-[#12161C] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#242C37] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#F1F5F9]">
              Matriz Detallada de Penetración por Ruta y Vendedor
            </h3>
            <span className="text-xs text-[#626D7C]">/</span>
            <span className="text-[11px] font-mono text-[#929EAD]">
              {sortedRoutes.length} rutas registradas
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="px-2.5 py-1 border border-[#242C37] bg-[#0B0D10] text-xs font-mono text-[#929EAD] hover:text-[#F1F5F9] transition-colors"
            >
              {sortAsc ? 'Orden: Menor a Mayor ↑' : 'Orden: Mayor a Menor ↓'}
            </button>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#626D7C]" />
              <input
                type="text"
                placeholder="Buscar ruta o vendedor..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-7 w-48 rounded-sm border border-[#242C37] bg-[#0B0D10] pl-8 pr-2 text-xs font-mono text-[#F1F5F9] placeholder:text-[#626D7C] focus:border-[#C5F467] focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto border border-[#242C37]">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-[#242C37] bg-[#0B0D10] text-[10px] font-bold text-[#626D7C] uppercase tracking-wider">
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
            <tbody className="divide-y divide-[#242C37]/60">
              {sortedRoutes.map((r, idx) => {
                const isGood = (r.cumplimientoCob || 0) >= 90;
                const cliGap = r.clientesReal - r.coberturaObj;

                return (
                  <tr key={r.clave} className="hover:bg-[#191F27]/60 text-[#F1F5F9]">
                    <td className="py-2.5 px-3 font-bold text-[#F1F5F9]">
                      {r.clave}
                    </td>
                    <td className="py-2.5 px-3 text-[#929EAD] font-sans">
                      {r.subtexto}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#F1F5F9]">
                      {r.clientesReal}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#929EAD]">
                      {r.coberturaObj}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold">
                      <span className={isGood ? 'text-[#C5F467]' : 'text-[#FB7185]'}>
                        {formatPercent(r.cumplimientoCob)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold">
                      <span className={cliGap >= 0 ? 'text-[#C5F467]' : 'text-[#FB7185]'}>
                        {cliGap >= 0 ? '+' : ''}{cliGap} cli
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#F1F5F9]">
                      {formatGuaranies(r.realFact, true)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => onSelectRoute(r.clave)}
                        className="text-xs font-bold text-[#C5F467] hover:underline"
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
