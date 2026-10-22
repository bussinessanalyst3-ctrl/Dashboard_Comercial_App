import React from 'react';
import { DimensionAggregation } from '../../types/commercial';
import { formatGuaranies, formatPercent } from '../../services/dataNormalizer';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface ParetoChartProps {
  products: DimensionAggregation[];
  title?: string;
  onSelectProduct?: (name: string) => void;
}

export const ParetoChart: React.FC<ParetoChartProps> = ({
  products,
  title = 'Concentración Comercial (Curva de Pareto 80/20)',
  onSelectProduct
}) => {
  // Sort descending by realFact
  const sorted = [...products].sort((a, b) => b.realFact - a.realFact);
  const totalFact = sorted.reduce((acc, p) => acc + p.realFact, 0);

  let accumulated = 0;
  const data = sorted.map(p => {
    accumulated += p.realFact;
    const cumPct = totalFact > 0 ? (accumulated / totalFact) * 100 : 0;
    return {
      name: p.nombre,
      facturacionM: Math.round(p.realFact / 1_000_000),
      facturacionRaw: p.realFact,
      cumPct: Math.round(cumPct * 10) / 10,
      share: totalFact > 0 ? ((p.realFact / totalFact) * 100).toFixed(1) : '0'
    };
  });

  return (
    <div className="border border-[#242C37] bg-[#12161C] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#242C37] pb-3 mb-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F1F5F9]">
            {title}
          </h3>
          <p className="text-[11px] font-mono text-[#929EAD]">
            Concentración acumulada de facturación por línea de producto
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#929EAD]">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 bg-[#38BDF8]" /> Facturación (M)
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-4 bg-[#C5F467]" /> Acumulado %
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 25, left: -10, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="2 2" stroke="#1F2732" vertical={false} />
            <XAxis
              dataKey="name"
              angle={-25}
              textAnchor="end"
              interval={0}
              height={45}
              tick={{ fontSize: 9, fill: '#929EAD', fontFamily: 'JetBrains Mono' }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 10, fill: '#626D7C', fontFamily: 'JetBrains Mono' }}
              tickFormatter={v => `₲${v}M`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: '#C5F467', fontFamily: 'JetBrains Mono' }}
              tickFormatter={v => `${v}%`}
            />
            <ReferenceLine yAxisId="right" y={80} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: 'Regla 80%', fill: '#F59E0B', fontSize: 10, position: 'insideTopRight' }} />
            <Tooltip
              formatter={(val: any, name: any, item: any) => {
                const p = item.payload;
                if (name === 'facturacionM') {
                  return [
                    `₲ ${(p.facturacionRaw).toLocaleString('es-PY')} (${p.share}%)`,
                    'Facturación Real'
                  ];
                }
                return [`${p.cumPct}%`, 'Concentración Acumulada'];
              }}
              contentStyle={{
                backgroundColor: '#0B0D10',
                border: '1px solid #242C37',
                borderRadius: '2px',
                color: '#F1F5F9',
                fontSize: '11px',
                fontFamily: 'JetBrains Mono'
              }}
            />
            <Bar
              yAxisId="left"
              dataKey="facturacionM"
              fill="#38BDF8"
              fillOpacity={0.7}
              radius={[2, 2, 0, 0]}
              onClick={(e: any) => {
                if (e?.name) onSelectProduct?.(e.name);
              }}
              cursor="pointer"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumPct"
              stroke="#C5F467"
              strokeWidth={2}
              dot={{ r: 3, fill: '#C5F467' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-1 text-[11px] font-mono text-[#626D7C] flex items-center justify-between">
        <span>Las 3 primeras líneas concentran más del 75% del volumen de venta total.</span>
        <span>Haga clic en una barra para filtrar producto</span>
      </div>
    </div>
  );
};
