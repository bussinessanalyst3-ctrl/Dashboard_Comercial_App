import React from 'react';
import {
  CommercialKPIs,
  DimensionAggregation,
  HistoricalPoint,
  FilterState
} from '../types/commercial';
import {
  formatGuaranies,
  formatTons,
  formatPercent,
  formatInteger,
  formatPeriodDisplay
} from '../services/dataNormalizer';
import { KpiCard } from './KpiCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import {
  Scale,
  DollarSign,
  Users,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  Building2,
  TrendingUp
} from 'lucide-react';

interface ExecutiveDashboardProps {
  kpis: CommercialKPIs;
  filters: FilterState;
  zoneAggs: DimensionAggregation[];
  supervisorAggs: DimensionAggregation[];
  productAggs: DimensionAggregation[];
  timeline: HistoricalPoint[];
  onSelectPeriod: (p: string) => void;
  onSelectZone: (z: string) => void;
}

const ZONE_COLORS = ['#0f172a', '#2563eb', '#059669', '#d97706', '#7c3aed'];

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  kpis,
  filters,
  zoneAggs,
  supervisorAggs,
  productAggs,
  timeline,
  onSelectPeriod,
  onSelectZone
}) => {
  const isProductFiltered = filters.producto !== 'TODOS';

  // Compliance badge helpers
  const getComplianceBadge = (pct: number | null) => {
    if (pct === null) return { badge: 'N/D', type: 'neutral' as const };
    if (pct >= 100) return { badge: `+${(pct - 100).toFixed(1)}% Meta`, type: 'success' as const };
    if (pct >= 90) return { badge: `${pct.toFixed(1)}% Aceptable`, type: 'warning' as const };
    return { badge: `${pct.toFixed(1)}% Brecha`, type: 'danger' as const };
  };

  const tonBadge = getComplianceBadge(kpis.cumplimientoToneladas);
  const factBadge = getComplianceBadge(kpis.cumplimientoFacturacion);
  const cobBadge = isProductFiltered
    ? { badge: 'N/A por Producto', type: 'neutral' as const }
    : getComplianceBadge(kpis.cumplimientoCobertura);

  // Top highlight stats
  const topZone = zoneAggs[0];
  const topSupervisor = [...supervisorAggs].sort((a, b) => (b.cumplimientoFact || 0) - (a.cumplimientoFact || 0))[0];
  const topProduct = productAggs[0];

  return (
    <div className="space-y-6">
      {/* Executive Header Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Resumen Ejecutivo Consolidado
              </span>
              <span className="text-xs text-slate-300">·</span>
              <span className="text-xs font-semibold text-slate-900">
                {filters.periodo === 'TODOS'
                  ? 'Todos los Períodos Acumulados'
                  : formatPeriodDisplay(filters.periodo)}
              </span>
            </div>
            <h1 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
              Rendimiento Comercial & Análisis de Cobertura
            </h1>
            <p className="mt-1 text-xs text-slate-600">
              Evaluación tridimensional de toneladas vendidas, facturación en guaraníes y clientes atendidos frente a presupuestos comerciales aprobados.
            </p>
          </div>

          {/* Quick Counters */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:items-center">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center">
              <div className="text-[10px] font-semibold text-slate-500 uppercase">Zonas</div>
              <div className="text-sm font-bold text-slate-900 font-mono">{kpis.totalZonas}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center">
              <div className="text-[10px] font-semibold text-slate-500 uppercase">Supervisores</div>
              <div className="text-sm font-bold text-slate-900 font-mono">{kpis.totalSupervisores}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center">
              <div className="text-[10px] font-semibold text-slate-500 uppercase">Rutas / Vendedores</div>
              <div className="text-sm font-bold text-slate-900 font-mono">{kpis.totalRutas}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center">
              <div className="text-[10px] font-semibold text-slate-500 uppercase">Productos</div>
              <div className="text-sm font-bold text-slate-900 font-mono">{kpis.totalProductos}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 11 OFFICIAL KPIS GROUPED BY SOURCE */}
      <div className="space-y-4">
        {/* GROUP 1: TONELADAS */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Scale className="h-4 w-4 text-slate-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Métricas de Volumen (Toneladas)
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Objetivo de Toneladas"
              value={formatTons(kpis.objetivoToneladas)}
              subValue="Presupuesto físico total"
              icon={<Target className="h-4 w-4 text-slate-400" />}
              category="toneladas"
            />
            <KpiCard
              title="Toneladas Vendidas"
              value={formatTons(kpis.ventasToneladas)}
              subValue="Despacho real acumulado"
              icon={<Scale className="h-4 w-4 text-slate-400" />}
              category="toneladas"
            />
            <KpiCard
              title="Cumplimiento de Toneladas"
              value={formatPercent(kpis.cumplimientoToneladas)}
              subValue="Ventas reales / Objetivo × 100"
              progress={kpis.cumplimientoToneladas}
              badge={tonBadge.badge}
              badgeType={tonBadge.type}
              category="toneladas"
            />
            <KpiCard
              title="Diferencia de Toneladas"
              value={`${kpis.diferenciaToneladas >= 0 ? '+' : ''}${formatTons(kpis.diferenciaToneladas)}`}
              subValue="Ventas reales − Objetivo"
              badge={kpis.diferenciaToneladas >= 0 ? 'Favorable' : 'Desfavorable'}
              badgeType={kpis.diferenciaToneladas >= 0 ? 'success' : 'danger'}
              category="toneladas"
            />
          </div>
        </div>

        {/* GROUP 2: FACTURACIÓN */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-slate-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Métricas Financieras (Facturación PYG ₲)
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Objetivo de Facturación"
              value={formatGuaranies(kpis.objetivoFacturacion)}
              subValue="Presupuesto monetario en PYG"
              icon={<Target className="h-4 w-4 text-slate-400" />}
              category="facturacion"
            />
            <KpiCard
              title="Facturación Real"
              value={formatGuaranies(kpis.ventasFacturacion)}
              subValue="Ventas facturadas en PYG"
              icon={<DollarSign className="h-4 w-4 text-slate-400" />}
              category="facturacion"
            />
            <KpiCard
              title="Cumplimiento de Facturación"
              value={formatPercent(kpis.cumplimientoFacturacion)}
              subValue="Facturación real / Objetivo × 100"
              progress={kpis.cumplimientoFacturacion}
              badge={factBadge.badge}
              badgeType={factBadge.type}
              category="facturacion"
            />
            <KpiCard
              title="Diferencia Monetaria"
              value={`${kpis.diferenciaFacturacion >= 0 ? '+' : ''}${formatGuaranies(kpis.diferenciaFacturacion, true)}`}
              subValue="Facturación real − Objetivo"
              badge={kpis.diferenciaFacturacion >= 0 ? 'Superávit' : 'Brecha Comercial'}
              badgeType={kpis.diferenciaFacturacion >= 0 ? 'success' : 'danger'}
              category="facturacion"
            />
          </div>
        </div>

        {/* GROUP 3: COBERTURA */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Métricas de Cobertura de Clientes
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <KpiCard
              title="Cobertura Planificada"
              value={isProductFiltered ? 'N/A' : `${formatInteger(kpis.coberturaPlanificada)} Clientes`}
              subValue={isProductFiltered ? 'Incompatible con filtro de producto' : 'Universo meta planificado'}
              icon={<Target className="h-4 w-4 text-slate-400" />}
              category="cobertura"
            />
            <KpiCard
              title="Clientes Reales Registrados"
              value={isProductFiltered ? 'N/A' : `${formatInteger(kpis.clientesReales)} Clientes`}
              subValue={isProductFiltered ? 'Incompatible con filtro de producto' : 'Puntos de venta efectivos con compra'}
              icon={<Users className="h-4 w-4 text-slate-400" />}
              category="cobertura"
            />
            <KpiCard
              title="Cumplimiento de Cobertura"
              value={isProductFiltered ? 'N/D' : formatPercent(kpis.cumplimientoCobertura)}
              subValue={isProductFiltered ? 'Vea cobertura a nivel de ruta' : 'Clientes reales / Cobertura × 100'}
              progress={isProductFiltered ? null : kpis.cumplimientoCobertura}
              badge={cobBadge.badge}
              badgeType={cobBadge.type}
              category="cobertura"
            />
          </div>
        </div>
      </div>

      {/* EXECUTIVE HIGHLIGHTS CARDS */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Zona Líder</span>
            <Building2 className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-base font-bold text-slate-900 truncate">
            {topZone ? topZone.nombre : 'N/D'}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-600">
            <span>Facturación: {topZone ? formatGuaranies(topZone.realFact, true) : '0'}</span>
            <span className="font-semibold text-emerald-700">
              {topZone?.cumplimientoFact ? `${topZone.cumplimientoFact.toFixed(1)}% Obj` : ''}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Mayor Cumplimiento</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-base font-bold text-slate-900 truncate">
            {topSupervisor ? topSupervisor.nombre : 'N/D'}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-600">
            <span>Sup. {topSupervisor?.subtexto || ''}</span>
            <span className="font-bold text-emerald-700">
              {topSupervisor?.cumplimientoFact ? `${topSupervisor.cumplimientoFact.toFixed(1)}%` : 'N/D'}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Producto Principal</span>
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-base font-bold text-slate-900 truncate">
            {topProduct ? topProduct.nombre : 'N/D'}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-600">
            <span>Volumen: {topProduct ? formatTons(topProduct.realTon) : '0'}</span>
            <span className="font-mono text-slate-700">
              {topProduct ? formatGuaranies(topProduct.realFact, true) : '0'}
            </span>
          </div>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* CHART 1: Evolución Mensual (Objetivo vs Real Facturación) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Evolución de Facturación: Objetivo vs Real
              </h3>
              <p className="text-[11px] text-slate-500">
                Tendencia histórica mensual en Guaraníes (PYG)
              </p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={timeline.map(t => ({
                  name: formatPeriodDisplay(t.periodo),
                  periodo: t.periodo,
                  Objetivo: Math.round(t.objetivoFact / 1_000_000), // In Millions
                  Real: Math.round(t.realFact / 1_000_000)
                }))}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={v => `₲${v}M`}
                />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    `₲ ${(Number(value) * 1_000_000).toLocaleString('es-PY')}`,
                    name
                  ]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Objetivo" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Objetivo (PYG)" />
                <Bar dataKey="Real" fill="#0f172a" radius={[4, 4, 0, 0]} name="Real (PYG)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Desempeño por Zona */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Cumplimiento y Facturación por Zona
              </h3>
              <p className="text-[11px] text-slate-500">
                Comparativa directa entre ventas reales y metas asignadas
              </p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={zoneAggs.map(z => ({
                  name: z.nombre,
                  Objetivo: Math.round(z.objetivoFact / 1_000_000),
                  Real: Math.round(z.realFact / 1_000_000),
                  cumplimiento: z.cumplimientoFact || 0
                }))}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={v => `₲${v}M`}
                />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    name === 'Cumplimiento'
                      ? `${Number(value).toFixed(1)}%`
                      : `₲ ${(Number(value) * 1_000_000).toLocaleString('es-PY')}`,
                    name
                  ]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Objetivo" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Objetivo (M)" />
                <Bar dataKey="Real" fill="#2563eb" radius={[4, 4, 0, 0]} name="Venta Real (M)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECOND CHARTS ROW */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* CHART 3: Toneladas por Categoría de Producto */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Volumen Físico por Producto (Toneladas)
              </h3>
              <p className="text-[11px] text-slate-500">
                Toneladas reales vs objetivo por cada una de las líneas comerciales
              </p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={productAggs.map(p => ({
                  name: p.nombre,
                  Objetivo: p.objetivoTon,
                  Real: p.realTon
                }))}
                margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => `${v}T`} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#334155' }} width={100} />
                <Tooltip
                  formatter={(value: any, name: any) => [`${Number(value).toFixed(2)} Ton`, name]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Objetivo" fill="#94a3b8" radius={[0, 4, 4, 0]} name="Obj Toneladas" />
                <Bar dataKey="Real" fill="#059669" radius={[0, 4, 4, 0]} name="Real Toneladas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 4: Distribución de Ventas por Zona */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3 mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Participación por Zona
            </h3>
            <p className="text-[11px] text-slate-500">
              Distribución porcentual de facturación
            </p>
          </div>
          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={zoneAggs.map(z => ({
                    name: z.nombre,
                    value: z.realFact
                  }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {zoneAggs.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={ZONE_COLORS[index % ZONE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [
                    `₲ ${Number(value).toLocaleString('es-PY')}`,
                    'Facturación'
                  ]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1.5 border-t border-slate-100 pt-2">
            {zoneAggs.map((z, idx) => {
              const totalFact = kpis.ventasFacturacion || 1;
              const share = ((z.realFact / totalFact) * 100).toFixed(1);
              return (
                <div key={z.clave} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: ZONE_COLORS[idx % ZONE_COLORS.length] }}
                    />
                    <span className="truncate text-slate-700 font-medium">{z.nombre}</span>
                  </div>
                  <span className="font-mono text-slate-900 font-semibold">{share}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
