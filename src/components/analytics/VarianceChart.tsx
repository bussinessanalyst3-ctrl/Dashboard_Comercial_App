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
    <div className="border border-[#242C37] bg-[#12161C] p-5">
      {/* Header with Switchers */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#242C37] pb-3 mb-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F1F5F9]">
            {title}
          </h3>
          <p className="text-[11px] font-mono text-[#929EAD]">
            Brecha cuantitativa respecto a la meta presupuestaria con eje neutral cero
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Facturación vs Toneladas */}
          <div className="flex items-center rounded-sm border border-[#29313B] bg-[#0B0D10] p-0.5 text-xs font-mono">
            <button
              onClick={() => setMetricMode('facturacion')}
              className={`px-2 py-0.5 transition-colors ${
                metricMode === 'facturacion'
                  ? 'bg-[#191F27] text-[#C5F467] font-bold'
                  : 'text-[#929EAD] hover:text-[#F1F5F9]'
              }`}
            >
              ₲ Facturación
            </button>
            <button
              onClick={() => setMetricMode('toneladas')}
              className={`px-2 py-0.5 transition-colors ${
                metricMode === 'toneladas'
                  ? 'bg-[#191F27] text-[#C5F467] font-bold'
                  : 'text-[#929EAD] hover:text-[#F1F5F9]'
              }`}
            >
              Ton Volumen
            </button>
          </div>

          {/* Absolute vs Percentage */}
          <div className="flex items-center rounded-sm border border-[#29313B] bg-[#0B0D10] p-0.5 text-xs font-mono">
            <button
              onClick={() => setViewMode('absolute')}
              className={`px-2 py-0.5 transition-colors ${
                viewMode === 'absolute'
                  ? 'bg-[#191F27] text-[#F1F5F9] font-bold'
                  : 'text-[#929EAD] hover:text-[#F1F5F9]'
              }`}
            >
              Delta Absoluto
            </button>
            <button
              onClick={() => setViewMode('percentage')}
              className={`px-2 py-0.5 transition-colors ${
                viewMode === 'percentage'
                  ? 'bg-[#191F27] text-[#F1F5F9] font-bold'
                  : 'text-[#929EAD] hover:text-[#F1F5F9]'
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
            <CartesianGrid strokeDasharray="2 2" stroke="#1F2732" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: '#626D7C', fontFamily: 'JetBrains Mono' }}
              tickFormatter={v => (viewMode === 'absolute' ? (metricMode === 'facturacion' ? `₲${v}M` : `${v}T`) : `${v.toFixed(0)}%`)}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: '#929EAD' }}
              width={130}
            />
            <ReferenceLine x={0} stroke="#475569" strokeWidth={1.5} />
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
                      <span className="text-[#929EAD]">Desviación: </span>
                      <strong className={payload.isPositive ? 'text-[#C5F467]' : 'text-[#FB7185]'}>
                        {payload.isPositive ? '+' : ''}{formattedDelta} ({payload.deltaPct.toFixed(1)}%)
                      </strong>
                    </div>
                    <div className="text-[11px] text-[#929EAD]">
                      Real: {formattedReal} | Meta: {formattedObj}
                    </div>
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
            <Bar
              dataKey="delta"
              radius={[2, 2, 2, 2]}
              onClick={(entry: any) => {
                if (entry?.name) onSelectDimension?.(entry.name);
              }}
              cursor="pointer"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isPositive ? '#C5F467' : '#FB7185'}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-[#626D7C]">
        <span>← Brecha negativa (déficit comercial)</span>
        <span>Haga clic en una barra para filtrar · Superávit favorable →</span>
      </div>
    </div>
  );
};
