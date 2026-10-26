import React, { useState } from 'react';
import { DimensionAggregation, VentaRecord, CommercialKPIs } from '../../types/commercial';
import {
  formatGuaranies,
  formatTons,
  formatPercent,
  formatInteger
} from '../../services/dataNormalizer';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell
} from 'recharts';
import { TrendingUp, DollarSign, Scale, Layers, Search, ArrowUpDown, Filter } from 'lucide-react';

interface SalesIntelligenceViewProps {
  productAggs: DimensionAggregation[];
  routeAggs: DimensionAggregation[];
  zoneAggs: DimensionAggregation[];
  kpis: CommercialKPIs;
  onSelectProduct: (p: string) => void;
  onSelectRoute: (r: string) => void;
}

export const SalesIntelligenceView: React.FC<SalesIntelligenceViewProps> = ({
  productAggs,
  routeAggs,
  zoneAggs,
  kpis,
  onSelectProduct,
  onSelectRoute
}) => {
  const [sortField, setSortField] = useState<'realFact' | 'realTon' | 'cumplimientoFact'>('realFact');
  const [search, setSearch] = useState('');

  // Scatter data: Product positioning (X: Toneladas, Y: Facturación en Millones, Z: Cumplimiento %)
  const scatterData = productAggs.map(p => ({
    name: p.nombre,
    toneladas: p.realTon,
    facturacionM: Math.round(p.realFact / 1_000_000),
    facturacionRaw: p.realFact,
    cumplimiento: p.cumplimientoFact || 100,
    pricePerTon: p.realTon > 0 ? Math.round(p.realFact / p.realTon) : 0
  }));

  const sortedProducts = [...productAggs].sort((a, b) => {
    const valA = a[sortField] ?? 0;
    const valB = b[sortField] ?? 0;
    return Number(valB) - Number(valA);
  }).filter(p => p.nombre.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-[#374151] bg-[#1F2937] p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#374151] pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
              <span className="font-bold text-[#F9FAFB]">SALES INTELLIGENCE STUDIO</span>
              <span>/</span>
              <span className="text-[#3B82F6] font-semibold">MATRIZ DE VOLUMEN Y VALORIZACIÓN</span>
            </div>
            <h2 className="mt-1 text-base font-bold text-[#F9FAFB]">
              Análisis Cuantitativo de Líneas de Producto & Velocidad de Facturación
            </h2>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
            <span className="text-[#9CA3AF] font-sans">Total Despachado:</span>
            <span className="font-bold text-[#14B8A6]">{formatTons(kpis.ventasToneladas, 2)}</span>
            <span className="text-[#4B5563]">|</span>
            <span className="text-[#9CA3AF] font-sans">Facturado:</span>
            <span className="font-bold text-[#F9FAFB]">{formatGuaranies(kpis.ventasFacturacion, true)}</span>
          </div>
        </div>

        {/* Quick Analytical Insights */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-md border border-[#374151] bg-[#111827]">
            <div className="text-[10px] text-[#9CA3AF] font-semibold uppercase tracking-wider">Línea Dominante en Valor</div>
            <div className="text-sm font-bold text-[#14B8A6] mt-1">{productAggs[0]?.nombre || 'N/D'}</div>
            <div className="text-[11px] text-[#9CA3AF] mt-1 font-mono tabular-nums">
              {productAggs[0] ? formatGuaranies(productAggs[0].realFact, true) : '0'} ({productAggs[0]?.realTon.toFixed(2)} Ton)
            </div>
          </div>

          <div className="p-3.5 rounded-md border border-[#374151] bg-[#111827]">
            <div className="text-[10px] text-[#9CA3AF] font-semibold uppercase tracking-wider">Precio Medio Efectivo / Ton</div>
            <div className="text-sm font-bold text-[#38BDF8] mt-1 font-mono tabular-nums">
              {kpis.ventasToneladas > 0 ? formatGuaranies(Math.round(kpis.ventasFacturacion / kpis.ventasToneladas), true) : '0'}
            </div>
            <div className="text-[11px] text-[#9CA3AF] mt-1">
              Relación promedio de valor por tonelada física
            </div>
          </div>

          <div className="p-3.5 rounded-md border border-[#374151] bg-[#111827]">
            <div className="text-[10px] text-[#9CA3AF] font-semibold uppercase tracking-wider">Líneas en Meta (&ge;100%)</div>
            <div className="text-sm font-bold text-[#F9FAFB] mt-1">
              {productAggs.filter(p => (p.cumplimientoFact || 0) >= 100).length} de {productAggs.length} líneas
            </div>
            <div className="text-[11px] text-[#9CA3AF] mt-1">
              Cumplimiento presupuestario de catálogo
            </div>
          </div>
        </div>
      </div>

      {/* SCATTER PLOT: MATRIZ DE VOLUMEN (X) vs FACTURACIÓN (Y) */}
      <div className="rounded-lg border border-[#374151] bg-[#1F2937] p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#374151] pb-3 mb-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#F9FAFB]">
              Matriz de Dispersión: Volumen Físico (Ton) vs Facturación (PYG)
            </h3>
            <p className="text-[11px] text-[#9CA3AF]">
              Cada cuadrante refleja la relación de valor unitario y volumen despachado
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-[#9CA3AF]">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#14B8A6]" /> Meta Cumplida (&ge;100%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#EF4444]" /> Brecha (&lt;100%)
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.6} />
              <XAxis
                type="number"
                dataKey="toneladas"
                name="Toneladas"
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                tickFormatter={v => `${v}T`}
                label={{ value: 'Volumen Despachado (Toneladas)', position: 'insideBottom', offset: -10, fill: '#9CA3AF', fontSize: 10 }}
              />
              <YAxis
                type="number"
                dataKey="facturacionM"
                name="Facturación"
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                tickFormatter={v => `₲${v}M`}
                label={{ value: 'Facturación (Millones PYG)', angle: -90, position: 'insideLeft', offset: 10, fill: '#9CA3AF', fontSize: 10 }}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(val: any, name: any, item: any) => {
                  const p = item.payload;
                  return [
                    <div key="scat" className="space-y-1 text-xs">
                      <div className="font-bold text-[#F9FAFB]">{p.name}</div>
                      <div className="text-[#38BDF8] font-mono">Facturación: ₲ {p.facturacionRaw.toLocaleString('es-PY')}</div>
                      <div className="text-[#14B8A6] font-mono">Volumen: {p.toneladas.toFixed(2)} Ton</div>
                      <div className="text-[#9CA3AF] font-mono">Valor/Ton: ₲ {p.pricePerTon.toLocaleString('es-PY')} / Ton</div>
                      <div className="text-xs font-semibold text-slate-300 font-mono">Cumplimiento: {p.cumplimiento.toFixed(1)}%</div>
                    </div>,
                    ''
                  ];
                }}
                contentStyle={{
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  color: '#F9FAFB'
                }}
              />
              <Scatter
                data={scatterData}
                onClick={(entry: any) => {
                  if (entry?.name) onSelectProduct(entry.name);
                }}
                cursor="pointer"
              >
                {scatterData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.cumplimiento >= 100 ? '#14B8A6' : '#EF4444'}
                    r={7}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* DETAILED PRODUCT ANALYTICAL TABLE */}
      <div className="rounded-lg border border-[#374151] bg-[#1F2937] p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#374151] pb-3 mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F9FAFB]">
            Desglose Analítico por Línea de Producto
          </h3>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 w-52 rounded-md border border-[#374151] bg-[#111827] pl-8 pr-3 text-xs text-[#F9FAFB] placeholder:text-[#6B7280] focus:border-[#3B82F6] focus:outline-hidden focus:ring-1 focus:ring-[#3B82F6]"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-md border border-[#374151]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#374151] bg-[#111827] text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                <th className="py-2.5 px-3">Línea de Producto</th>
                <th className="py-2.5 px-3 text-right">Facturación Real</th>
                <th className="py-2.5 px-3 text-right">Presupuesto</th>
                <th className="py-2.5 px-3 text-right">% Fact</th>
                <th className="py-2.5 px-3 text-right">Toneladas Real</th>
                <th className="py-2.5 px-3 text-right">Presupuesto Ton</th>
                <th className="py-2.5 px-3 text-right">% Ton</th>
                <th className="py-2.5 px-3 text-right">Precio Medio / Ton</th>
                <th className="py-2.5 px-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#374151]">
              {sortedProducts.map((p, idx) => {
                const priceTon = p.realTon > 0 ? Math.round(p.realFact / p.realTon) : 0;
                const isOver = (p.cumplimientoFact || 0) >= 100;

                return (
                  <tr key={p.clave} className="hover:bg-[#111827]/60 text-[#F9FAFB] transition-colors">
                    <td className="py-2.5 px-3 font-semibold">
                      {idx + 1}. {p.nombre}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#F9FAFB] font-mono tabular-nums">
                      {formatGuaranies(p.realFact)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#9CA3AF] font-mono tabular-nums">
                      {formatGuaranies(p.objetivoFact)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold font-mono tabular-nums">
                      <span className={isOver ? 'text-[#14B8A6]' : 'text-[#EF4444]'}>
                        {formatPercent(p.cumplimientoFact)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#F9FAFB] font-mono tabular-nums">
                      {formatTons(p.realTon, 2)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#9CA3AF] font-mono tabular-nums">
                      {formatTons(p.objetivoTon, 2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold font-mono tabular-nums">
                      <span className={(p.cumplimientoTon || 0) >= 100 ? 'text-[#14B8A6]' : 'text-[#EF4444]'}>
                        {formatPercent(p.cumplimientoTon)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#38BDF8] font-mono tabular-nums">
                      {formatGuaranies(priceTon, true)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => onSelectProduct(p.clave)}
                        className="rounded px-2 py-0.5 text-xs font-semibold text-[#3B82F6] hover:bg-[#3B82F6]/10 transition-colors cursor-pointer"
                      >
                        Filtrar
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
