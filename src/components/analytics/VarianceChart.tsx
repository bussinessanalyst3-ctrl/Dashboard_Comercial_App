import React, { useState } from 'react';
import { DimensionAggregation } from '../../types/commercial';
import {
  formatGuaranies,
  formatTons,
  formatPercent
} from '../../services/dataNormalizer';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';

interface VarianceChartProps {
  data: DimensionAggregation[];
  title?: string;
  dimensionLabel?: string;
  onSelectDimension?: (name: string) => void;
}

export const VarianceChart: React.FC<VarianceChartProps> = ({
  data,
  title = 'Análisis de Desviaciones Comerciales (Variance)',
  dimensionLabel = 'Zona / Segmento',
  onSelectDimension
}) => {
  const [metricMode, setMetricMode] = useState<'facturacion' | 'toneladas'>('facturacion');
  const [viewMode, setViewMode] = useState<'absolute' | 'percentage'>('absolute');

  const chartData = data.map(d => {
    const isFact = metricMode === 'facturacion';
    const deltaAbs = isFact ? d.deltaFact : d.deltaTon;
    const obj = isFact ? d.objetivoFact : d.objetivoTon;
    const deltaPct = obj > 0 ? (deltaAbs / obj) * 100 : 0;

    return {
      name: d.nombre,
      clave: d.clave,
      delta: viewMode === 'absolute' ? (isFact ? Math.round(deltaAbs / 1_000_000) : deltaAbs) : deltaPct,
      deltaRaw: deltaAbs,
      deltaPct,
      real: isFact ? d.realFact : d.realTon,
      obj: isFact ? d.objetivoFact : d.objetivoTon,
      isPositive: deltaAbs >= 0
    };
  }).sort((a, b) => b.delta - a.delta);

  return (
    <div className="rounded-lg border border-[#374151] bg-[#1F2937] p-5 shadow-xs">
      {/* Header with Switchers */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#374151] pb-3 mb-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F9FAFB]">
            {title}
          </h3>
          <p className="text-[11px] text-[#9CA3AF]">
            Brecha cuantitativa respecto a la meta presupuestaria con eje neutral cero
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Facturación vs Toneladas */}
          <div className="flex items-center rounded-md border border-[#374151] bg-[#111827] p-1 text-xs">
            <button
              onClick={() => setMetricMode('facturacion')}
              className={`px-2.5 py-1 rounded-sm font-medium transition-colors ${
                metricMode === 'facturacion'
                  ? 'bg-[#3B82F6] text-white'
                  : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
              }`}
            >
              ₲ Facturación
            </button>
            <button
              onClick={() => setMetricMode('toneladas')}
              className={`px-2.5 py-1 rounded-sm font-medium transition-colors ${
                metricMode === 'toneladas'
                  ? 'bg-[#3B82F6] text-white'
                  : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
              }`}
            >
              Ton Volumen
            </button>
          </div>

          {/* Absolute vs Percentage */}
          <div className="flex items-center rounded-md border border-[#374151] bg-[#111827] p-1 text-xs">
            <button
              onClick={() => setViewMode('absolute')}
              className={`px-2.5 py-1 rounded-sm font-medium transition-colors ${
                viewMode === 'absolute'
                  ? 'bg-[#374151] text-white'
                  : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
              }`}
            >
              Delta Absoluto
            </button>
            <button
              onClick={() => setViewMode('percentage')}
              className={`px-2.5 py-1 rounded-sm font-medium transition-colors ${
                viewMode === 'percentage'
                  ? 'bg-[#374151] text-white'
                  : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
              }`}
            >
              % Desvío
            </button>
          </div>
        </div>
      </div>

      {/* Zero-Centered Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="2 2" stroke="#374151" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: '#6B7280', fontFamily: 'JetBrains Mono' }}
              tickFormatter={v => (viewMode === 'absolute' ? (metricMode === 'facturacion' ? `₲${v}M` : `${v}T`) : `${v.toFixed(0)}%`)}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: '#9CA3AF', fontFamily: 'Plus Jakarta Sans' }}
              width={130}
            />
            <ReferenceLine x={0} stroke="#6B7280" strokeWidth={1.5} />
            <Tooltip
              formatter={(val: any, name: any, item: any) => {
                const payload = item.payload;
                const isFact = metricMode === 'facturacion';
                const formattedDelta = isFact ? formatGuaranies(payload.deltaRaw, true) : formatTons(payload.deltaRaw, 2);
                const formattedReal = isFact ? formatGuaranies(payload.real) : formatTons(payload.real);
                const formattedObj = isFact ? formatGuaranies(payload.obj) : formatTons(payload.obj);

                return [
                  <div key="tip" className="space-y-1 font-mono text-xs">
                    <div>
                      <span className="text-[#9CA3AF]">Desviación: </span>
                      <strong className={payload.isPositive ? 'text-[#14B8A6]' : 'text-[#EF4444]'}>
                        {payload.isPositive ? '+' : ''}{formattedDelta} ({payload.deltaPct.toFixed(1)}%)
                      </strong>
                    </div>
                    <div className="text-[11px] text-[#9CA3AF]">
                      Real: {formattedReal} | Meta: {formattedObj}
                    </div>
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
            <Bar
              dataKey="delta"
              radius={[3, 3, 3, 3]}
              onClick={(entry: any) => {
                if (entry?.name) onSelectDimension?.(entry.name);
              }}
              cursor="pointer"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isPositive ? '#14B8A6' : '#EF4444'}
                  fillOpacity={0.88}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-[#9CA3AF]">
        <span className="flex items-center gap-1.5 text-[#EF4444]">
          <span className="h-2 w-2 rounded-full bg-[#EF4444]" /> Brecha negativa (déficit comercial)
        </span>
        <span className="flex items-center gap-1.5 text-[#14B8A6]">
          <span className="h-2 w-2 rounded-full bg-[#14B8A6]" /> Superávit favorable
        </span>
      </div>
    </div>
  );
};
