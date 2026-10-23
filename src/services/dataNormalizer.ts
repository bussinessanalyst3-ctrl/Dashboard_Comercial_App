import * as XLSX from 'xlsx';
import {
  VentaRecord,
  ObjetivoRecord,
  CoberturaRecord,
  ImportPreviewSummary,
  ValidationIssue,
  DatabaseState
} from '../types/commercial';

/**
 * Cleans string numbers with potential currency formatting, commas, quotes,
 * and parenthesized negative values such as " (490,909)".
 */
export function cleanNumber(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : val;
  }
  let s = String(val).trim().replace(/"/g, '').replace(/\s+/g, '');
  if (!s || s === '-' || s === '—' || s === '–' || s === 'n/a' || s === 'nd' || s === 's/d') return 0;

  let isNegative = false;
  if (s.startsWith('(') && s.endsWith(')')) {
    isNegative = true;
    s = s.slice(1, -1);
  } else if (s.startsWith('-')) {
    isNegative = true;
    s = s.slice(1);
  }

  // Remove currency symbols if any
  s = s.replace(/₲|PYG|\$|USD/gi, '');

  // Handle thousand separators:
  // e.g. "43,699,629" (commas thousands) or "43.699.629" (dots thousands) or "5.41" (dot decimal)
  if (s.includes(',') && !s.includes('.')) {
    const commaCount = (s.match(/,/g) || []).length;
    if (commaCount > 1 || /^\d{1,3}(,\d{3})+$/.test(s)) {
      s = s.replace(/,/g, '');
    } else {
      const parts = s.split(',');
      if (parts[1] && parts[1].length === 3 && parts[0].length <= 3) {
        s = s.replace(/,/g, '');
      } else {
        s = s.replace(',', '.');
      }
    }
  } else if (s.includes('.') && !s.includes(',')) {
    const dotCount = (s.match(/\./g) || []).length;
    if (dotCount > 1 || /^\d{1,3}(\.\d{3})+$/.test(s)) {
      s = s.replace(/\./g, '');
    }
  } else if (s.includes(',') && s.includes('.')) {
    const lastComma = s.lastIndexOf(',');
    const lastDot = s.lastIndexOf('.');
    if (lastDot > lastComma) {
      // 1,234.56
      s = s.replace(/,/g, '');
    } else {
      // 1.234,56
      s = s.replace(/\./g, '').replace(',', '.');
    }
  }

  const num = parseFloat(s);
  if (isNaN(num)) return 0;
  return isNegative ? -num : num;
}

/**
 * Normalizes text: trims and collapses internal spaces
 */
export function cleanText(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val).trim().replace(/\s+/g, ' ').toUpperCase();
}

/**
 * Normalizes period labels: "sept-26", "sep-26", "2026-09", "sep 2026", etc.
 */
export function normalizePeriod(val: unknown): string {
  if (!val) return 'DESCONOCIDO';
  let s = String(val).trim().toLowerCase().replace(/['"]/g, '');

  // Month mapping
  const monthMap: Record<string, string> = {
    ene: 'ene', enero: 'ene', jan: 'ene',
    feb: 'feb', febrero: 'feb',
    mar: 'mar', marzo: 'mar',
    abr: 'abr', abril: 'abr', apr: 'abr',
    may: 'may', mayo: 'may',
    jun: 'jun', junio: 'jun',
    jul: 'jul', julio: 'jul',
    ago: 'ago', agosto: 'ago', aug: 'ago',
    sep: 'sept', sept: 'sept', set: 'sept', septiembre: 'sept',
    oct: 'oct', octubre: 'oct',
    nov: 'nov', noviembre: 'nov',
    dic: 'dic', diciembre: 'dic', dec: 'dic'
  };

  // If format YYYY-MM
  const yyyyMm = s.match(/^(\d{4})[-/](\d{1,2})$/);
  if (yyyyMm) {
    const yr = yyyyMm[1].slice(-2);
    const mNum = parseInt(yyyyMm[2], 10);
    const mNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
    return `${mNames[mNum - 1] || 'mes'}-${yr}`;
  }

  // If format MM-YYYY
  const mmYyyy = s.match(/^(\d{1,2})[-/](\d{4})$/);
  if (mmYyyy) {
    const yr = mmYyyy[2].slice(-2);
    const mNum = parseInt(mmYyyy[1], 10);
    const mNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
    return `${mNames[mNum - 1] || 'mes'}-${yr}`;
  }

  // Match text like "sept-26", "sep 26", "septiembre 2026"
  const textMatch = s.match(/([a-záéíóú]+)[-_/ ]*(\d{2,4})?/i);
  if (textMatch) {
    const mPrefix = textMatch[1].slice(0, 4);
    let matchedMonth = 'sept';
    for (const [key, val] of Object.entries(monthMap)) {
      if (textMatch[1].startsWith(key) || key.startsWith(mPrefix)) {
        matchedMonth = val;
        break;
      }
    }
    const yearStr = textMatch[2] ? textMatch[2].slice(-2) : '26';
    return `${matchedMonth}-${yearStr}`;
  }

  return s;
}

/**
 * Format Period for Human Display: "sept-26" -> "Septiembre 2026"
 */
export function formatPeriodDisplay(period: string): string {
  if (!period) return 'Período';
  const parts = period.toLowerCase().split('-');
  const monthCode = parts[0];
  const yearCode = parts[1] || '26';
  const fullYear = yearCode.length === 2 ? `20${yearCode}` : yearCode;

  const names: Record<string, string> = {
    ene: 'Enero',
    feb: 'Febrero',
    mar: 'Marzo',
    abr: 'Abril',
    may: 'Mayo',
    jun: 'Junio',
    jul: 'Julio',
    ago: 'Agosto',
    sep: 'Septiembre',
    sept: 'Septiembre',
    oct: 'Octubre',
    nov: 'Noviembre',
    dic: 'Diciembre'
  };

  return `${names[monthCode] || monthCode.toUpperCase()} ${fullYear}`;
}

/**
 * Currency Formatter: PYG Guaraníes
 * e.g. 8153562801 -> "₲ 8.153.562.801"
 */
export function formatGuaranies(val: number | null | undefined, compact = false): string {
  if (val === null || val === undefined || isNaN(val)) return 'N/D';
  if (compact && Math.abs(val) >= 1_000_000) {
    if (Math.abs(val) >= 1_000_000_000) {
      return `₲ ${(val / 1_000_000_000).toFixed(2)}B`;
    }
    return `₲ ${(val / 1_000_000).toFixed(1)}M`;
  }
  const formatted = new Intl.NumberFormat('es-PY', {
    maximumFractionDigits: 0
  }).format(Math.round(val));
  return `₲ ${formatted}`;
}

/**
 * Toneladas Formatter
 * e.g. 673.03 -> "673.03 Ton"
 */
export function formatTons(val: number | null | undefined, decimals = 2): string {
  if (val === null || val === undefined || isNaN(val)) return 'N/D';
  const formatted = new Intl.NumberFormat('es-PY', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(val);
  return `${formatted} Ton`;
}

/**
 * Percentage Formatter
 * e.g. 94.5 -> "94.5%"
 */
export function formatPercent(val: number | null | undefined, decimals = 1): string {
  if (val === null || val === undefined || isNaN(val)) return 'N/D';
  const formatted = val.toFixed(decimals);
  return `${formatted}%`;
}

/**
 * Number Formatter (integer count of clients / routes)
 */
export function formatInteger(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '0';
  return new Intl.NumberFormat('es-PY').format(Math.round(val));
}

export const OBJ_FACT_TARGETS = [
  'presupuesto_facturacion',
  'presupuestofacturacion',
  'presupuesto_de_facturacion',
  'presupuestodefacturacion',
  'facturacion_presupuesto',
  'facturacionpresupuesto',
  'facturacion_presupuestada',
  'facturacionpresupuestada',
  'obj_facturacion',
  'objfacturacion',
  'objetivo_facturacion',
  'objetivofacturacion',
  'objetivo_de_facturacion',
  'facturacion_objetivo',
  'facturacionobjetivo',
  'presupuesto_gs',
  'presupuestogs',
  'presupuesto_guaranies',
  'meta_facturacion',
  'metafacturacion',
  'cuota_facturacion',
  'cuotafacturacion',
  'presupuesto_venta',
  'presupuestoventa',
  'presupuesto_ventas',
  'monto_presupuesto',
  'montopresupuesto',
  'obj_fact',
  'objfact',
  'presupuesto',
  'presupuestos',
  'cuota',
  'cuotas',
  'meta',
  'metas',
  'objetivo',
  'objetivos',
  'facturacion',
  'monto'
];

export const OBJ_TON_TARGETS = [
  'presupuesto_toneladas',
  'presupuestotoneladas',
  'obj_toneladas',
  'objtoneladas',
  'objetivo_toneladas',
  'meta_toneladas',
  'cuota_toneladas',
  'toneladas_presupuesto',
  'toneladas_objetivo',
  'toneladas_presupuestadas',
  'presupuesto_ton',
  'presupuestoton',
  'obj_ton',
  'objton',
  'toneladas',
  'ton',
  'tons'
];

export const VENTAS_FACT_TARGETS = [
  'ventas_facturacion',
  'ventasfacturacion',
  'venta_facturacion',
  'ventafacturacion',
  'facturacion_ventas',
  'facturacionventas',
  'facturacion_real',
  'facturacionreal',
  'real_facturacion',
  'ventas_fact',
  'ventasfact',
  'ventas',
  'venta',
  'facturacion',
  'monto'
];

export const VENTAS_TON_TARGETS = [
  'ventas_toneladas',
  'ventastoneladas',
  'venta_toneladas',
  'ventatoneladas',
  'toneladas_ventas',
  'toneladas_reales',
  'ton_ventas',
  'ventas_ton',
  'toneladas',
  'ton'
];

export const COB_PLANIFICADA_TARGETS = [
  'objetivo_cobertura',
  'objetivocobertura',
  'cobertura',
  'coberturas',
  'cobertura_planificada',
  'coberturaplanificada',
  'clientes_objetivo',
  'clientesobjetivo',
  'obj_cobertura',
  'objcobertura',
  'obj_clientes',
  'objclientes',
  'plan_cobertura',
  'plancobertura',
  'meta_cobertura',
  'metacobertura'
];

export const COB_REALES_TARGETS = [
  'clientes_reales',
  'clientesreales',
  'reales',
  'clientes',
  'efectivos',
  'clientes_activos',
  'clientesactivos',
  'cobertura_real',
  'coberturareal'
];

/**
 * Find matching key ignoring case, accents and whitespace
 */
export function findRowProp(row: Record<string, unknown>, targetNames: string[]): unknown {
  const normTargets = targetNames.map(t => t.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const rowEntries = Object.entries(row);

  // Exact normalized match first
  for (const [key, val] of rowEntries) {
    const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normTargets.includes(normKey)) {
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        return val;
      }
    }
  }

  // Fallback: target is contained in key or key contains target
  for (const [key, val] of rowEntries) {
    const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const target of normTargets) {
      if (target.length >= 4 && (normKey === target || normKey.includes(target))) {
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          return val;
        }
      }
    }
  }

  return undefined;
}

/**
 * Parse an Excel file (or CSV) containing DB_Objetivos, DB_Cobertura, DB_Ventas
 * Fully supports exact formats from images:
 * - Image 1 (Objetivos): Zona, Supervisor, Codigo_Ruta, Vendedor, Producto, Obj_Toneladas, Obj_Facturacion, Mes
 * - Image 2 (Cobertura): Zona, Supervisor, Codigo_Ruta, Vendedor, Objetivo_Cobertura, Clientes_Reales, Mes
 * - Image 3 (Ventas): Zona, Codigo_Ruta, Supervisor, Producto, Ventas_Toneladas, Ventas_Facturacion, Mes
 * Auto-enriches missing Vendedor in Ventas via Route-to-Vendor directory.
 */
export async function parseExcelOrCsvFile(
  file: File,
  dbState?: DatabaseState
): Promise<ImportPreviewSummary> {
  const issues: ValidationIssue[] = [];
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  const sheetNames = workbook.SheetNames;
  const detectedSheets: string[] = [];
  const missingSheets: string[] = [];

  const objetivosData: Partial<ObjetivoRecord>[] = [];
  const ventasData: Partial<VentaRecord>[] = [];
  const coberturaData: Partial<CoberturaRecord>[] = [];
  const periodosSet = new Set<string>();

  // 1. Build Route Directory from existing Database State (if provided)
  const routeDirectory = new Map<string, { vendedor: string; supervisor: string; zona: string }>();

  if (dbState) {
    dbState.objetivos.forEach(o => {
      if (o.codigo_ruta && o.vendedor && o.vendedor !== 'SIN VENDEDOR') {
        routeDirectory.set(o.codigo_ruta.trim().toUpperCase(), {
          vendedor: o.vendedor.trim().toUpperCase(),
          supervisor: o.supervisor?.trim().toUpperCase() || '',
          zona: o.zona?.trim().toUpperCase() || ''
        });
      }
    });
    dbState.cobertura.forEach(c => {
      if (c.codigo_ruta && c.vendedor && c.vendedor !== 'SIN VENDEDOR') {
        const normRuta = c.codigo_ruta.trim().toUpperCase();
        if (!routeDirectory.has(normRuta)) {
          routeDirectory.set(normRuta, {
            vendedor: c.vendedor.trim().toUpperCase(),
            supervisor: c.supervisor?.trim().toUpperCase() || '',
            zona: c.zona?.trim().toUpperCase() || ''
          });
        }
      }
    });
    dbState.ventas.forEach(v => {
      if (v.codigo_ruta && v.vendedor && v.vendedor !== 'SIN VENDEDOR') {
        const normRuta = v.codigo_ruta.trim().toUpperCase();
        if (!routeDirectory.has(normRuta)) {
          routeDirectory.set(normRuta, {
            vendedor: v.vendedor.trim().toUpperCase(),
            supervisor: v.supervisor?.trim().toUpperCase() || '',
            zona: v.zona?.trim().toUpperCase() || ''
          });
        }
      }
    });
  }

  // 2. Inspect every sheet in the workbook
  interface SheetAnalysis {
    sheetName: string;
    sheet: XLSX.WorkSheet;
    rawRows: Record<string, unknown>[];
    isObjetivos: boolean;
    isCobertura: boolean;
    isVentas: boolean;
  }

  const sheetAnalyses: SheetAnalysis[] = [];

  for (const sheetName of sheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
    if (!rawRows || rawRows.length === 0) continue;

    const firstRow = rawRows[0];
    const cleanSheetName = sheetName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    // Check specific columns
    const hasObjFactCol = Boolean(findRowProp(firstRow, OBJ_FACT_TARGETS));
    const hasObjTonCol = Boolean(findRowProp(firstRow, OBJ_TON_TARGETS));
    const hasCobCol = Boolean(findRowProp(firstRow, COB_PLANIFICADA_TARGETS) || findRowProp(firstRow, COB_REALES_TARGETS));
    const hasVentasFactCol = Boolean(findRowProp(firstRow, VENTAS_FACT_TARGETS));
    const hasVentasTonCol = Boolean(findRowProp(firstRow, VENTAS_TON_TARGETS));

    const isNamedObjetivos = cleanSheetName.includes('objetiv') || cleanSheetName.includes('presupuest') || cleanSheetName.includes('meta') || cleanSheetName.includes('cuota') || cleanSheetName.includes('goal');
    const isNamedCobertura = cleanSheetName.includes('cobertur') || cleanSheetName.includes('coverag') || cleanSheetName.includes('cliente') || cleanSheetName.includes('cartera');
    const isNamedVentas = cleanSheetName.includes('venta') || cleanSheetName.includes('sales') || cleanSheetName.includes('factur');

    let isObj = false;
    let isCob = false;
    let isVen = false;

    if (hasCobCol || isNamedCobertura) {
      isCob = true;
    }

    if (hasObjFactCol || hasObjTonCol || (isNamedObjetivos && !hasVentasFactCol)) {
      isObj = true;
    }

    if (hasVentasFactCol || hasVentasTonCol || (isNamedVentas && !hasObjFactCol)) {
      isVen = true;
    }

    // Default fallback for single-sheet files if no flags matched
    if (!isObj && !isCob && !isVen) {
      if (hasObjFactCol || hasObjTonCol) {
        isObj = true;
      } else if (hasCobCol) {
        isCob = true;
      } else {
        isVen = true;
      }
    }

    sheetAnalyses.push({
      sheetName,
      sheet,
      rawRows,
      isObjetivos: isObj,
      isCobertura: isCob,
      isVentas: isVen
    });
  }

  // 3. STEP A: Process OBJETIVOS Sheets First (populates routeDirectory)
  for (const analysis of sheetAnalyses) {
    if (analysis.isObjetivos) {
      detectedSheets.push(analysis.sheetName);
      analysis.rawRows.forEach((row, idx) => {
        const rowNum = idx + 2;
        const zona = cleanText(findRowProp(row, ['zona', 'region', 'sucursal']));
        const supervisor = cleanText(findRowProp(row, ['supervisor', 'superv']));
        const ruta = cleanText(findRowProp(row, ['codigo_ruta', 'codigoruta', 'ruta', 'cod_ruta']));
        const vendedor = cleanText(findRowProp(row, ['vendedor', 'nombre_vendedor', 'ejecutivo']));
        const producto = cleanText(findRowProp(row, ['producto', 'articulo', 'descripcion']));
        const tonRaw = findRowProp(row, OBJ_TON_TARGETS);
        const factRaw = findRowProp(row, OBJ_FACT_TARGETS);
        const mesRaw = findRowProp(row, ['mes', 'periodo', 'fecha']);

        if (!zona && !ruta && !producto) return;

        // Register in routeDirectory
        if (ruta && vendedor && vendedor !== 'SIN VENDEDOR') {
          routeDirectory.set(ruta, {
            vendedor,
            supervisor: supervisor || routeDirectory.get(ruta)?.supervisor || '',
            zona: zona || routeDirectory.get(ruta)?.zona || ''
          });
        }

        const mesNorm = normalizePeriod(mesRaw);
        if (mesNorm !== 'DESCONOCIDO') periodosSet.add(mesNorm);

        objetivosData.push({
          zona: zona || routeDirectory.get(ruta)?.zona || 'SIN ZONA',
          supervisor: supervisor || routeDirectory.get(ruta)?.supervisor || 'SIN SUPERVISOR',
          codigo_ruta: ruta || 'SIN-RUTA',
          vendedor: vendedor || routeDirectory.get(ruta)?.vendedor || 'SIN VENDEDOR',
          producto: producto || 'SIN PRODUCTO',
          toneladas: cleanNumber(tonRaw),
          facturacion: cleanNumber(factRaw),
          periodo_mes: mesNorm
        });
      });
    }
  }

  // 4. STEP B: Process COBERTURA Sheets (enriches routeDirectory)
  for (const analysis of sheetAnalyses) {
    if (analysis.isCobertura) {
      detectedSheets.push(analysis.sheetName);
      analysis.rawRows.forEach((row) => {
        const zona = cleanText(findRowProp(row, ['zona', 'region', 'sucursal']));
        const supervisor = cleanText(findRowProp(row, ['supervisor', 'superv']));
        const ruta = cleanText(findRowProp(row, ['codigo_ruta', 'codigoruta', 'ruta', 'cod_ruta']));
        const vendedor = cleanText(findRowProp(row, ['vendedor', 'nombre_vendedor', 'ejecutivo']));
        const cobRaw = findRowProp(row, COB_PLANIFICADA_TARGETS);
        const realesRaw = findRowProp(row, COB_REALES_TARGETS);
        const mesRaw = findRowProp(row, ['mes', 'periodo', 'fecha']);

        if (!ruta && !vendedor) return;

        // Register in routeDirectory
        if (ruta && vendedor && vendedor !== 'SIN VENDEDOR') {
          if (!routeDirectory.has(ruta)) {
            routeDirectory.set(ruta, {
              vendedor,
              supervisor: supervisor || '',
              zona: zona || ''
            });
          }
        }

        const mesNorm = normalizePeriod(mesRaw);
        if (mesNorm !== 'DESCONOCIDO') periodosSet.add(mesNorm);

        coberturaData.push({
          zona: zona || routeDirectory.get(ruta)?.zona || 'SIN ZONA',
          supervisor: supervisor || routeDirectory.get(ruta)?.supervisor || 'SIN SUPERVISOR',
          codigo_ruta: ruta || 'SIN-RUTA',
          vendedor: vendedor || routeDirectory.get(ruta)?.vendedor || 'SIN VENDEDOR',
          cobertura_planificada: Math.round(cleanNumber(cobRaw)),
          clientes_reales: Math.round(cleanNumber(realesRaw)),
          periodo_mes: mesNorm
        });
      });
    }
  }

  // 5. STEP C: Process VENTAS Sheets (with automatic vendor enrichment from routeDirectory)
  for (const analysis of sheetAnalyses) {
    if (analysis.isVentas) {
      detectedSheets.push(analysis.sheetName);
      analysis.rawRows.forEach((row, idx) => {
        const rowNum = idx + 2;
        let zona = cleanText(findRowProp(row, ['zona', 'region', 'sucursal']));
        let supervisor = cleanText(findRowProp(row, ['supervisor', 'superv']));
        const ruta = cleanText(findRowProp(row, ['codigo_ruta', 'codigoruta', 'ruta', 'cod_ruta']));
        let vendedor = cleanText(findRowProp(row, ['vendedor', 'nombre_vendedor', 'ejecutivo']));
        const producto = cleanText(findRowProp(row, ['producto', 'articulo', 'descripcion']));
        const tonRaw = findRowProp(row, VENTAS_TON_TARGETS);
        const factRaw = findRowProp(row, VENTAS_FACT_TARGETS);
        const mesRaw = findRowProp(row, ['mes', 'periodo', 'fecha']);

        if (!zona && !ruta && !producto) return;

        // Auto-enrich missing Vendedor from Route Directory (as in Image 3 where Vendedor column is omitted)
        if ((!vendedor || vendedor === 'SIN VENDEDOR') && ruta) {
          const matched = routeDirectory.get(ruta);
          if (matched && matched.vendedor) {
            vendedor = matched.vendedor;
          }
        }

        if ((!supervisor || supervisor === 'SIN SUPERVISOR') && ruta) {
          const matched = routeDirectory.get(ruta);
          if (matched && matched.supervisor) {
            supervisor = matched.supervisor;
          }
        }

        if ((!zona || zona === 'SIN ZONA') && ruta) {
          const matched = routeDirectory.get(ruta);
          if (matched && matched.zona) {
            zona = matched.zona;
          }
        }

        if (!ruta) {
          issues.push({
            type: 'warning',
            hoja: analysis.sheetName,
            fila: rowNum,
            columna: 'Codigo_Ruta',
            mensaje: 'Fila con Código de Ruta vacío'
          });
        }
        if (!producto) {
          issues.push({
            type: 'warning',
            hoja: analysis.sheetName,
            fila: rowNum,
            columna: 'Producto',
            mensaje: 'Fila con Producto vacío'
          });
        }

        const mesNorm = normalizePeriod(mesRaw);
        if (mesNorm !== 'DESCONOCIDO') periodosSet.add(mesNorm);

        const ton = cleanNumber(tonRaw);
        const fact = cleanNumber(factRaw);

        ventasData.push({
          zona: zona || 'SIN ZONA',
          supervisor: supervisor || 'SIN SUPERVISOR',
          codigo_ruta: ruta || 'SIN-RUTA',
          vendedor: vendedor || 'SIN VENDEDOR',
          producto: producto || 'SIN PRODUCTO',
          ventas_toneladas: ton,
          ventas_facturacion: fact,
          periodo_mes: mesNorm
        });

        // COMBINED TABLE CHECK: If row has specific objective/budget columns too
        const objFactRaw = findRowProp(row, [
          'obj_facturacion',
          'objfacturacion',
          'presupuesto_facturacion',
          'presupuestofacturacion',
          'obj_fact',
          'presupuesto'
        ]);
        const objTonRaw = findRowProp(row, [
          'obj_toneladas',
          'objtoneladas',
          'presupuesto_toneladas'
        ]);

        if ((objFactRaw !== undefined || objTonRaw !== undefined) && !analysis.isObjetivos) {
          objetivosData.push({
            zona: zona || 'SIN ZONA',
            supervisor: supervisor || 'SIN SUPERVISOR',
            codigo_ruta: ruta || 'SIN-RUTA',
            vendedor: vendedor || 'SIN VENDEDOR',
            producto: producto || 'SIN PRODUCTO',
            toneladas: cleanNumber(objTonRaw),
            facturacion: cleanNumber(objFactRaw),
            periodo_mes: mesNorm
          });
        }
      });
    }
  }

  // Missing sheets tracking
  if (ventasData.length === 0) missingSheets.push('DB_Ventas');
  if (objetivosData.length === 0) missingSheets.push('DB_Objetivos');
  if (coberturaData.length === 0) missingSheets.push('DB_Cobertura');

  // Fallback warnings
  if (sheetNames.length === 1 && objetivosData.length === 0) {
    issues.push({
      type: 'warning',
      hoja: sheetNames[0],
      mensaje: 'El archivo contiene únicamente Ventas. Los presupuestos y objetivos existentes para este período se mantendrán intactos.'
    });
  }

  const periodos = Array.from(periodosSet);
  if (periodos.length === 0) {
    issues.push({
      type: 'warning',
      hoja: 'General',
      mensaje: 'No se detectó columna de período explícita. Se aplicará el período oficial asignado por el Administrador.'
    });
  }

  const isValid = ventasData.length > 0 || objetivosData.length > 0 || coberturaData.length > 0;

  return {
    filename: file.name,
    detectedSheets: Array.from(new Set(detectedSheets)),
    missingSheets,
    periodos,
    objetivosCount: objetivosData.length,
    ventasCount: ventasData.length,
    coberturaCount: coberturaData.length,
    issues,
    isValid,
    objetivosData,
    ventasData,
    coberturaData
  };
}

/**
 * Export current database or filtered view to an Excel file (.xlsx) with 3 sheets
 */
export function exportToExcel(
  objetivos: ObjetivoRecord[],
  ventas: VentaRecord[],
  cobertura: CoberturaRecord[],
  fileName = 'Dashboard_Comercial_Export.xlsx'
) {
  const wb = XLSX.utils.book_new();

  // 1. DB_Objetivos
  const objRows = objetivos.map(o => ({
    Zona: o.zona,
    Supervisor: o.supervisor,
    Codigo_Ruta: o.codigo_ruta,
    Vendedor: o.vendedor,
    Producto: o.producto,
    Toneladas: o.toneladas,
    Facturación: o.facturacion,
    Mes: o.periodo_mes
  }));
  const wsObj = XLSX.utils.json_to_sheet(objRows);
  XLSX.utils.book_append_sheet(wb, wsObj, 'DB_Objetivos');

  // 2. DB_Cobertura
  const cobRows = cobertura.map(c => ({
    Zona: c.zona,
    Supervisor: c.supervisor,
    Codigo_Ruta: c.codigo_ruta,
    Vendedor: c.vendedor,
    Cobertura: c.cobertura_planificada,
    Clientes_Reales: c.clientes_reales,
    Mes: c.periodo_mes
  }));
  const wsCob = XLSX.utils.json_to_sheet(cobRows);
  XLSX.utils.book_append_sheet(wb, wsCob, 'DB_Cobertura');

  // 3. DB_Ventas
  const venRows = ventas.map(v => ({
    Zona: v.zona,
    Supervisor: v.supervisor,
    Codigo_Ruta: v.codigo_ruta,
    Vendedor: v.vendedor,
    Producto: v.producto,
    Ventas_Toneladas: v.ventas_toneladas,
    Ventas_Facturacion: v.ventas_facturacion,
    Mes: v.periodo_mes
  }));
  const wsVen = XLSX.utils.json_to_sheet(venRows);
  XLSX.utils.book_append_sheet(wb, wsVen, 'DB_Ventas');

  XLSX.writeFile(wb, fileName);
}

/**
 * Generate a ready-to-use sample template (.xlsx) with the 3 sheets pre-formatted matching exact system structure
 */
export function generateSampleExcelTemplate(): void {
  const sampleObj = [
    { Zona: 'ENCARNACION', Supervisor: 'ACOSTA BOHN DIEGO GABRIEL', Codigo_Ruta: 'ENC-VD3', Vendedor: 'ESCOBAR VERA JOSE LUIS', Producto: 'DETERGENTES', Obj_Toneladas: 5.41, Obj_Facturacion: 43699629, Mes: 'ago-26' },
    { Zona: 'ENCARNACION', Supervisor: 'ACOSTA BOHN DIEGO GABRIEL', Codigo_Ruta: 'ENC-VD3', Vendedor: 'ESCOBAR VERA JOSE LUIS', Producto: 'JABON PORA', Obj_Toneladas: 8.97, Obj_Facturacion: 87928701, Mes: 'ago-26' },
    { Zona: 'CIUDAD DEL ESTE', Supervisor: 'VAZQUEZ CARLOS MODESTO', Codigo_Ruta: 'CDE-PV1', Vendedor: 'BENITEZ MARTINEZ DERLIS ARIEL', Producto: 'DETERGENTES', Obj_Toneladas: 2.29, Obj_Facturacion: 20291908, Mes: 'ago-26' }
  ];

  const sampleCob = [
    { Zona: 'ENCARNACION', Supervisor: 'ACOSTA BOHN DIEGO GABRIEL', Codigo_Ruta: 'ENC-VD3', Vendedor: 'ESCOBAR VERA JOSE LUIS', Objetivo_Cobertura: 181, Clientes_Reales: 182, Mes: 'ago-26' },
    { Zona: 'CIUDAD DEL ESTE', Supervisor: 'VAZQUEZ CARLOS MODESTO', Codigo_Ruta: 'CDE-PV1', Vendedor: 'BENITEZ MARTINEZ DERLIS ARIEL', Objetivo_Cobertura: 244, Clientes_Reales: 121, Mes: 'ago-26' }
  ];

  const sampleVen = [
    { Zona: 'CIUDAD DEL ESTE', Codigo_Ruta: 'CDE-PV1', Supervisor: 'VAZQUEZ CARLOS MODESTO', Producto: 'DETERGENTES', Ventas_Toneladas: 2.86, Ventas_Facturacion: 18419782, Mes: 'ago-26' },
    { Zona: 'CIUDAD DEL ESTE', Codigo_Ruta: 'CDE-PV1', Supervisor: 'VAZQUEZ CARLOS MODESTO', Producto: 'ENVASADOS ACEITE', Ventas_Toneladas: 0.53, Ventas_Facturacion: 8450799, Mes: 'ago-26' },
    { Zona: 'ENCARNACION', Codigo_Ruta: 'ENC-VD3', Supervisor: 'ACOSTA BOHN DIEGO GABRIEL', Producto: 'DETERGENTES', Ventas_Toneladas: 4.12, Ventas_Facturacion: 31914503, Mes: 'ago-26' }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sampleObj), 'DB_Objetivos');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sampleCob), 'DB_Cobertura');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sampleVen), 'DB_Ventas');
  XLSX.writeFile(wb, 'Plantilla_Comercial_Objetivos_Cobertura_Ventas.xlsx');
}
