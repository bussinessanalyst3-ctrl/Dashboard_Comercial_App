import {
  VentaRecord,
  ObjetivoRecord,
  CoberturaRecord,
  FilterState,
  CommercialKPIs,
  DimensionAggregation,
  HistoricalPoint
} from '../types/commercial';
import { formatPeriodDisplay } from './dataNormalizer';

/**
 * Filter Ventas based on active filters
 */
export function filterVentas(records: VentaRecord[], filters: FilterState): VentaRecord[] {
  return records.filter(r => {
    if (filters.periodo && filters.periodo !== 'TODOS' && r.periodo_mes !== filters.periodo) {
      return false;
    }
    if (filters.zona && filters.zona !== 'TODAS' && r.zona !== filters.zona) {
      return false;
    }
    if (filters.supervisor && filters.supervisor !== 'TODOS' && r.supervisor !== filters.supervisor) {
      return false;
    }
    if (filters.codigoRuta && filters.codigoRuta !== 'TODAS' && r.codigo_ruta !== filters.codigoRuta) {
      return false;
    }
    if (filters.producto && filters.producto !== 'TODOS' && r.producto !== filters.producto) {
      return false;
    }
    if (filters.vendedor && filters.vendedor !== 'TODOS' && r.vendedor !== filters.vendedor) {
      return false;
    }
    if (filters.busqueda) {
      const q = filters.busqueda.toLowerCase();
      const match =
        r.zona.toLowerCase().includes(q) ||
        r.supervisor.toLowerCase().includes(q) ||
        r.codigo_ruta.toLowerCase().includes(q) ||
        r.vendedor.toLowerCase().includes(q) ||
        r.producto.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });
}

/**
 * Filter Objetivos based on active filters
 */
export function filterObjetivos(records: ObjetivoRecord[], filters: FilterState): ObjetivoRecord[] {
  return records.filter(r => {
    if (filters.periodo && filters.periodo !== 'TODOS' && r.periodo_mes !== filters.periodo) {
      return false;
    }
    if (filters.zona && filters.zona !== 'TODAS' && r.zona !== filters.zona) {
      return false;
    }
    if (filters.supervisor && filters.supervisor !== 'TODOS' && r.supervisor !== filters.supervisor) {
      return false;
    }
    if (filters.codigoRuta && filters.codigoRuta !== 'TODAS' && r.codigo_ruta !== filters.codigoRuta) {
      return false;
    }
    if (filters.producto && filters.producto !== 'TODOS' && r.producto !== filters.producto) {
      return false;
    }
    if (filters.vendedor && filters.vendedor !== 'TODOS' && r.vendedor !== filters.vendedor) {
      return false;
    }
    if (filters.busqueda) {
      const q = filters.busqueda.toLowerCase();
      const match =
        r.zona.toLowerCase().includes(q) ||
        r.supervisor.toLowerCase().includes(q) ||
        r.codigo_ruta.toLowerCase().includes(q) ||
        r.vendedor.toLowerCase().includes(q) ||
        r.producto.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });
}

/**
 * Filter Cobertura based on active filters.
 * Note: Cobertura does NOT have a Producto column.
 * If a specific product filter is active, we preserve the route-level coverage but mark it
 * or include it when filtering by route/supervisor/zone.
 */
export function filterCobertura(records: CoberturaRecord[], filters: FilterState): CoberturaRecord[] {
  return records.filter(r => {
    if (filters.periodo && filters.periodo !== 'TODOS' && r.periodo_mes !== filters.periodo) {
      return false;
    }
    if (filters.zona && filters.zona !== 'TODAS' && r.zona !== filters.zona) {
      return false;
    }
    if (filters.supervisor && filters.supervisor !== 'TODOS' && r.supervisor !== filters.supervisor) {
      return false;
    }
    if (filters.codigoRuta && filters.codigoRuta !== 'TODAS' && r.codigo_ruta !== filters.codigoRuta) {
      return false;
    }
    if (filters.vendedor && filters.vendedor !== 'TODOS' && r.vendedor !== filters.vendedor) {
      return false;
    }
    if (filters.busqueda) {
      const q = filters.busqueda.toLowerCase();
      const match =
        r.zona.toLowerCase().includes(q) ||
        r.supervisor.toLowerCase().includes(q) ||
        r.codigo_ruta.toLowerCase().includes(q) ||
        r.vendedor.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });
}

/**
 * Compute Executive KPIs strictly following formulas:
 * - Cumplimiento Toneladas = Ventas reales / Objetivo * 100
 * - Diferencia Toneladas = Ventas reales - Objetivo
 * - Cumplimiento Facturación = Facturación real / Objetivo * 100
 * - Diferencia Facturación = Facturación real - Objetivo
 * - Cumplimiento Cobertura = Clientes_Reales / Cobertura * 100
 * Aggregations are calculated from separate sources without joining fact tables!
 */
export function calculateKPIs(
  ventas: VentaRecord[],
  objetivos: ObjetivoRecord[],
  cobertura: CoberturaRecord[],
  isProductFilterActive = false
): CommercialKPIs {
  // Aggregate Ventas
  let realTon = 0;
  let realFact = 0;
  const rutasSet = new Set<string>();
  const vendedoresSet = new Set<string>();
  const productosSet = new Set<string>();
  const zonasSet = new Set<string>();
  const supervisoresSet = new Set<string>();

  for (const v of ventas) {
    realTon += v.ventas_toneladas || 0;
    realFact += v.ventas_facturacion || 0;
    if (v.codigo_ruta) rutasSet.add(v.codigo_ruta);
    if (v.vendedor) vendedoresSet.add(v.vendedor);
    if (v.producto) productosSet.add(v.producto);
    if (v.zona) zonasSet.add(v.zona);
    if (v.supervisor) supervisoresSet.add(v.supervisor);
  }

  // Aggregate Objetivos
  let objTon = 0;
  let objFact = 0;
  for (const o of objetivos) {
    objTon += o.toneladas || 0;
    objFact += o.facturacion || 0;
    if (o.codigo_ruta) rutasSet.add(o.codigo_ruta);
    if (o.vendedor) vendedoresSet.add(o.vendedor);
    if (o.producto) productosSet.add(o.producto);
    if (o.zona) zonasSet.add(o.zona);
    if (o.supervisor) supervisoresSet.add(o.supervisor);
  }

  // Aggregate Cobertura (if product filter is active, coverage is not attributable to single product)
  let cobPlan = 0;
  let cliReal = 0;
  if (!isProductFilterActive) {
    for (const c of cobertura) {
      cobPlan += c.cobertura_planificada || 0;
      cliReal += c.clientes_reales || 0;
    }
  }

  const cTon = objTon > 0 ? (realTon / objTon) * 100 : null;
  const dTon = realTon - objTon;

  const cFact = objFact > 0 ? (realFact / objFact) * 100 : null;
  const dFact = realFact - objFact;

  const cCob = cobPlan > 0 ? (cliReal / cobPlan) * 100 : null;
  const dCob = cliReal - cobPlan;

  return {
    objetivoToneladas: objTon,
    ventasToneladas: realTon,
    cumplimientoToneladas: cTon,
    diferenciaToneladas: dTon,

    objetivoFacturacion: objFact,
    ventasFacturacion: realFact,
    cumplimientoFacturacion: cFact,
    diferenciaFacturacion: dFact,

    coberturaPlanificada: cobPlan,
    clientesReales: cliReal,
    cumplimientoCobertura: cCob,
    diferenciaCobertura: dCob,

    totalRutas: rutasSet.size,
    totalVendedores: vendedoresSet.size,
    totalProductos: productosSet.size,
    totalZonas: zonasSet.size,
    totalSupervisores: supervisoresSet.size
  };
}

/**
 * Aggregate by Dimension (e.g. Zona, Supervisor, Codigo_Ruta, Producto, Vendedor)
 * Strictly calculates sums from each separate source and merges on compatible keys!
 */
export function aggregateByDimension(
  dimensionKey: 'zona' | 'supervisor' | 'codigo_ruta' | 'producto' | 'vendedor',
  ventas: VentaRecord[],
  objetivos: ObjetivoRecord[],
  cobertura: CoberturaRecord[]
): DimensionAggregation[] {
  const map = new Map<string, {
    nombre: string;
    subtexto?: string;
    realTon: number;
    realFact: number;
    objTon: number;
    objFact: number;
    cobObj: number;
    cliReal: number;
  }>();

  const getOrCreate = (key: string, nombre: string, subtexto?: string) => {
    let item = map.get(key);
    if (!item) {
      item = {
        nombre,
        subtexto,
        realTon: 0,
        realFact: 0,
        objTon: 0,
        objFact: 0,
        cobObj: 0,
        cliReal: 0
      };
      map.set(key, item);
    }
    return item;
  };

  // 1. Accumulate Ventas
  for (const v of ventas) {
    const key = v[dimensionKey] || 'SIN CLAVE';
    const sub = dimensionKey === 'codigo_ruta' ? `${v.vendedor} · ${v.supervisor}` :
                dimensionKey === 'vendedor' ? `${v.codigo_ruta} · ${v.zona}` :
                dimensionKey === 'supervisor' ? v.zona : undefined;
    const item = getOrCreate(key, key, sub);
    item.realTon += v.ventas_toneladas || 0;
    item.realFact += v.ventas_facturacion || 0;
  }

  // 2. Accumulate Objetivos
  for (const o of objetivos) {
    const key = o[dimensionKey] || 'SIN CLAVE';
    const sub = dimensionKey === 'codigo_ruta' ? `${o.vendedor} · ${o.supervisor}` :
                dimensionKey === 'vendedor' ? `${o.codigo_ruta} · ${o.zona}` :
                dimensionKey === 'supervisor' ? o.zona : undefined;
    const item = getOrCreate(key, key, sub);
    item.objTon += o.toneladas || 0;
    item.objFact += o.facturacion || 0;
  }

  // 3. Accumulate Cobertura (only if dimension is compatible: not product!)
  if (dimensionKey !== 'producto') {
    for (const c of cobertura) {
      const key = c[dimensionKey] || 'SIN CLAVE';
      const sub = dimensionKey === 'codigo_ruta' ? `${c.vendedor} · ${c.supervisor}` :
                  dimensionKey === 'vendedor' ? `${c.codigo_ruta} · ${c.zona}` :
                  dimensionKey === 'supervisor' ? c.zona : undefined;
      const item = getOrCreate(key, key, sub);
      item.cobObj += c.cobertura_planificada || 0;
      item.cliReal += c.clientes_reales || 0;
    }
  }

  // 4. Transform to Array and compute accurate compliance ratios
  const results: DimensionAggregation[] = [];
  for (const [clave, item] of map.entries()) {
    const cTon = item.objTon > 0 ? (item.realTon / item.objTon) * 100 : null;
    const cFact = item.objFact > 0 ? (item.realFact / item.objFact) * 100 : null;
    const cCob = item.cobObj > 0 ? (item.cliReal / item.cobObj) * 100 : null;

    results.push({
      clave,
      nombre: item.nombre,
      subtexto: item.subtexto,
      objetivoTon: item.objTon,
      realTon: item.realTon,
      cumplimientoTon: cTon,
      deltaTon: item.realTon - item.objTon,
      objetivoFact: item.objFact,
      realFact: item.realFact,
      cumplimientoFact: cFact,
      deltaFact: item.realFact - item.objFact,
      coberturaObj: item.cobObj,
      clientesReal: item.cliReal,
      cumplimientoCob: cCob
    });
  }

  return results.sort((a, b) => b.realFact - a.realFact);
}

/**
 * Historical monthly points for trends and comparisons
 */
export function getHistoricalTimeline(
  ventas: VentaRecord[],
  objetivos: ObjetivoRecord[],
  cobertura: CoberturaRecord[],
  baseFilters?: Omit<FilterState, 'periodo'>
): HistoricalPoint[] {
  // Extract all distinct periods
  const periodosSet = new Set<string>();
  ventas.forEach(v => periodosSet.add(v.periodo_mes));
  objetivos.forEach(o => periodosSet.add(o.periodo_mes));
  cobertura.forEach(c => periodosSet.add(c.periodo_mes));

  const sortedPeriodos = Array.from(periodosSet).sort((a, b) => {
    // Sort chronological: 25 before 26, then by month
    const mOrder: Record<string, number> = {
      ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6,
      jul: 7, ago: 8, sep: 9, sept: 9, oct: 10, nov: 11, dic: 12
    };
    const [mA, yA] = a.toLowerCase().split('-');
    const [mB, yB] = b.toLowerCase().split('-');
    const yearDiff = (parseInt(yA || '26', 10) || 26) - (parseInt(yB || '26', 10) || 26);
    if (yearDiff !== 0) return yearDiff;
    return (mOrder[mA] || 0) - (mOrder[mB] || 0);
  });

  return sortedPeriodos.map(periodo => {
    const filters: FilterState = {
      periodo,
      zona: baseFilters?.zona || 'TODAS',
      supervisor: baseFilters?.supervisor || 'TODOS',
      codigoRuta: baseFilters?.codigoRuta || 'TODAS',
      producto: baseFilters?.producto || 'TODOS',
      vendedor: baseFilters?.vendedor || 'TODOS',
      busqueda: baseFilters?.busqueda || ''
    };

    const fVen = filterVentas(ventas, filters);
    const fObj = filterObjetivos(objetivos, filters);
    const fCob = filterCobertura(cobertura, filters);

    const kpi = calculateKPIs(fVen, fObj, fCob, filters.producto !== 'TODOS');

    return {
      periodo,
      mesNombre: formatPeriodDisplay(periodo),
      objetivoFact: kpi.objetivoFacturacion,
      realFact: kpi.ventasFacturacion,
      cumplimientoFact: kpi.cumplimientoFacturacion,
      objetivoTon: kpi.objetivoToneladas,
      realTon: kpi.ventasToneladas,
      cumplimientoTon: kpi.cumplimientoToneladas,
      coberturaObj: kpi.coberturaPlanificada,
      clientesReal: kpi.clientesReales,
      cumplimientoCob: kpi.cumplimientoCobertura,
      hasVentas: fVen.length > 0,
      hasObjetivos: fObj.length > 0,
      hasCobertura: fCob.length > 0
    };
  });
}
