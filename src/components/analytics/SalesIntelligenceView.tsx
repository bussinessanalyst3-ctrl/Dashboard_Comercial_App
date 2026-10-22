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
      <div className="border border-[#242C37] bg-[#12161C] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#242C37] pb-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-[#929EAD]">
              <span className="font-extrabold text-[#F1F5F9]">SALES INTELLIGENCE STUDIO</span>
              <span>/</span>
              <span className="text-[#C5F467]">MATRIZ DE VOLUMEN Y VALORIZACIÓN</span>
            </div>
            <h2 className="mt-1 text-base font-bold text-[#F1F5F9]">
              Análisis Cuantitativo de Líneas de Producto & Velocidad de Facturación
            </h2>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="text-[#929EAD]">Total Despachado:</span>
            <span className="font-bold text-[#C5F467]">{formatTons(kpis.ventasToneladas, 2)}</span>
            <span className="text-[#333D4D]">|</span>
            <span className="text-[#929EAD]">Facturado:</span>
            <span className="font-bold text-[#F1F5F9]">{formatGuaranies(kpis.ventasFacturacion, true)}</span>
          </div>
        </div>

        {/* Quick Analytical Insights */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-3 border border-[#242C37] bg-[#0B0D10]">
            <div className="text-[10px] text-[#626D7C] uppercase">Línea Dominante en Valor</div>
            <div className="text-sm font-bold text-[#C5F467] mt-0.5">{productAggs[0]?.nombre || 'N/D'}</div>
            <div className="text-[11px] text-[#929EAD] mt-1">
              {productAggs[0] ? formatGuaranies(productAggs[0].realFact, true) : '0'} ({productAggs[0]?.realTon.toFixed(2)} Ton)
            </div>
          </div>

          <div className="p-3 border border-[#242C37] bg-[#0B0D10]">
            <div className="text-[10px] text-[#626D7C] uppercase">Precio Medio Efectivo / Ton</div>
            <div className="text-sm font-bold text-[#38BDF8] mt-0.5">
              {kpis.ventasToneladas > 0 ? formatGuaranies(Math.round(kpis.ventasFacturacion / kpis.ventasToneladas), true) : '0'}
            </div>
            <div className="text-[11px] text-[#929EAD] mt-1">
              Relación promedio de valor por tonelada física
            </div>
          </div>

          <div className="p-3 border border-[#242C37] bg-[#0B0D10]">
            <div className="text-[10px] text-[#626D7C] uppercase">Líneas en Meta (&ge;100%)</div>
            <div className="text-sm font-bold text-[#F1F5F9] mt-0.5">
              {productAggs.filter(p => (p.cumplimientoFact || 0) >= 100).length} de {productAggs.length} líneas
            </div>
            <div className="text-[11px] text-[#929EAD] mt-1">
              Cumplimiento presupuestario de catálogo
            </div>
          </div>
        </div>
      </div>

      {/* SCATTER PLOT: MATRIZ DE VOLUMEN (X) vs FACTURACIÓN (Y) */}
      <div className="border border-[#242C37] bg-[#12161C] p-5">
        <div className="flex items-center justify-between border-b border-[#242C37] pb-3 mb-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#F1F5F9]">
              Matriz de Dispersión: Volumen Físico (Ton) vs Facturación (PYG)
            </h3>
            <p className="text-[11px] font-mono text-[#929EAD]">
              Cada cuadrante refleja la relación de valor unitario y volumen despachado
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-[#929EAD]">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-[#C5F467]" /> Meta Cumplida (&ge;100%)
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-[#FB7185]" /> Brecha (&lt;100%)
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#1F2732" />
              <XAxis
                type="number"
                dataKey="toneladas"
                name="Toneladas"
                tick={{ fontSize: 10, fill: '#626D7C', fontFamily: 'JetBrains Mono' }}
                tickFormatter={v => `${v}T`}
                label={{ value: 'Volumen Despachado (Toneladas)', position: 'insideBottom', offset: -10, fill: '#626D7C', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              />
              <YAxis
                type="number"
                dataKey="facturacionM"
                name="Facturación"
                tick={{ fontSize: 10, fill: '#626D7C', fontFamily: 'JetBrains Mono' }}
                tickFormatter={v => `₲${v}M`}
                label={{ value: 'Facturación (Millones PYG)', angle: -90, position: 'insideLeft', offset: 10, fill: '#626D7C', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(val: any, name: any, item: any) => {
                  const p = item.payload;
                  return [
                    <div key="scat" className="space-y-1 font-mono text-xs">
                      <div className="font-bold text-[#F1F5F9]">{p.name}</div>
                      <div className="text-[#38BDF8]">Facturación: ₲ {p.facturacionRaw.toLocaleString('es-PY')}</div>
                      <div className="text-[#C5F467]">Volumen: {p.toneladas.toFixed(2)} Ton</div>
                      <div className="text-[#929EAD]">Valor/Ton: ₲ {p.pricePerTon.toLocaleString('es-PY')} / Ton</div>
                      <div className="text-xs font-bold text-slate-300">Cumplimiento: {p.cumplimiento.toFixed(1)}%</div>
                    </div>,
                    ''
                  ];
                }}
                contentStyle={{
                  backgroundColor: '#0B0D10',
                  border: '1px solid #242C37',
                  borderRadius: '2px',
                  color: '#F1F5F9'
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
                    fill={entry.cumplimiento >= 100 ? '#C5F467' : '#FB7185'}
                    r={7}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* DETAILED PRODUCT ANALYTICAL TABLE */}
      <div className="border border-[#242C37] bg-[#12161C] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#242C37] pb-3 mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F1F5F9]">
            Desglose Analítico por Línea de Producto
          </h3>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#626D7C]" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-7 w-48 rounded-sm border border-[#242C37] bg-[#0B0D10] pl-8 pr-2 text-xs font-mono text-[#F1F5F9] placeholder:text-[#626D7C] focus:border-[#C5F467] focus:outline-hidden"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-[#242C37]">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-[#242C37] bg-[#0B0D10] text-[10px] font-bold text-[#626D7C] uppercase tracking-wider">
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
            <tbody className="divide-y divide-[#242C37]/60">
              {sortedProducts.map((p, idx) => {
                const priceTon = p.realTon > 0 ? Math.round(p.realFact / p.realTon) : 0;
                const isOver = (p.cumplimientoFact || 0) >= 100;

                return (
                  <tr key={p.clave} className="hover:bg-[#191F27]/60 text-[#F1F5F9]">
                    <td className="py-2.5 px-3 font-bold">
                      {idx + 1}. {p.nombre}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#F1F5F9]">
                      {formatGuaranies(p.realFact)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#929EAD]">
                      {formatGuaranies(p.objetivoFact)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold">
                      <span className={isOver ? 'text-[#C5F467]' : 'text-[#FB7185]'}>
                        {formatPercent(p.cumplimientoFact)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#F1F5F9]">
                      {formatTons(p.realTon, 2)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#929EAD]">
                      {formatTons(p.objetivoTon, 2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold">
                      <span className={(p.cumplimientoTon || 0) >= 100 ? 'text-[#C5F467]' : 'text-[#FB7185]'}>
                        {formatPercent(p.cumplimientoTon)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#38BDF8]">
                      {formatGuaranies(priceTon, true)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => onSelectProduct(p.clave)}
                        className="text-xs font-bold text-[#C5F467] hover:underline"
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
