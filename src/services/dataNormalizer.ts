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
  if (val === null || val === undefined || val === '') return 'DESCONOCIDO';

  const mNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];

  // 1. If Date object
  if (val instanceof Date && !isNaN(val.getTime())) {
    const m = mNames[val.getUTCMonth()];
    const y = String(val.getUTCFullYear()).slice(-2);
    return `${m}-${y}`;
  }

  let s = String(val).trim().toLowerCase().replace(/['"]/g, '');
  if (!s || s === 'n/a' || s === 'null' || s === 'undefined') return 'DESCONOCIDO';

  // 2. Excel serial date integer (e.g., 44000 to 55000 covers years 2020 to 2050; 46235 = Agosto 2026)
  const numVal = Number(s);
  if (!isNaN(numVal) && numVal >= 30000 && numVal <= 75000 && !s.includes('-') && !s.includes('/')) {
    // Excel base date: 1899-12-30 (due to 1900 leap year bug in Excel)
    const date = new Date(Math.round((numVal - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      const m = mNames[date.getUTCMonth()];
      const y = String(date.getUTCFullYear()).slice(-2);
      return `${m}-${y}`;
    }
  }

  // Month mapping
  const monthMap: Record<string, string> = {
    ene: 'ene', enero: 'ene', jan: 'ene', january: 'ene',
    feb: 'feb', febrero: 'feb', february: 'feb',
    mar: 'mar', marzo: 'mar', march: 'mar',
    abr: 'abr', abril: 'abr', apr: 'abr', april: 'abr',
    may: 'may', mayo: 'may',
    jun: 'jun', junio: 'jun', june: 'jun',
    jul: 'jul', julio: 'jul', july: 'jul',
    ago: 'ago', agosto: 'ago', aug: 'ago', august: 'ago',
    sep: 'sept', sept: 'sept', set: 'sept', setiembre: 'sept', septiembre: 'sept', september: 'sept',
    oct: 'oct', octubre: 'oct', october: 'oct',
    nov: 'nov', noviembre: 'nov', november: 'nov',
    dic: 'dic', diciembre: 'dic', dec: 'dic', december: 'dic'
  };

  // 3. Format YYYY-MM or YYYY/MM (e.g. 2026-08, 2026/08)
  const yyyyMm = s.match(/^(\d{4})[-/](\d{1,2})$/);
  if (yyyyMm) {
    const yr = yyyyMm[1].slice(-2);
    const mNum = parseInt(yyyyMm[2], 10);
    return `${mNames[mNum - 1] || 'mes'}-${yr}`;
  }

  // 4. Format MM-YYYY or MM/YYYY (e.g. 08-2026, 08/2026)
  const mmYyyy = s.match(/^(\d{1,2})[-/](\d{4})$/);
  if (mmYyyy) {
    const yr = mmYyyy[2].slice(-2);
    const mNum = parseInt(mmYyyy[1], 10);
    return `${mNames[mNum - 1] || 'mes'}-${yr}`;
  }

  // 5. Full date format: DD/MM/YYYY or DD-MM-YYYY (e.g. 01/08/2026, 15/08/2026)
  const dmyMatch = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (dmyMatch) {
    const p1 = parseInt(dmyMatch[1], 10);
    const p2 = parseInt(dmyMatch[2], 10);
    const yr = dmyMatch[3].slice(-2);
    let mNum = p2;
    if (p2 > 12 && p1 <= 12) {
      mNum = p1; // MM/DD/YYYY
    }
    return `${mNames[mNum - 1] || 'mes'}-${yr}`;
  }

  // 6. Full date format: YYYY-MM-DD or YYYY/MM/DD (e.g. 2026-08-01)
  const ymdMatch = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymdMatch) {
    const yr = ymdMatch[1].slice(-2);
    const mNum = parseInt(ymdMatch[2], 10);
    return `${mNames[mNum - 1] || 'mes'}-${yr}`;
  }

  // 7. Match text like "sept-26", "sep 26", "agosto 2026", "ago-26", "ago 26"
  const textMatch = s.match(/([a-záéíóú]+)[-_/ ]*(\d{2,4})?/i);
  if (textMatch) {
    const rawWord = textMatch[1].toLowerCase();
    let matchedMonth = '';
    for (const [key, val] of Object.entries(monthMap)) {
      if (rawWord === key || rawWord.startsWith(key) || key.startsWith(rawWord.slice(0, 3))) {
        matchedMonth = val;
        break;
      }
    }
    if (matchedMonth) {
      const yearStr = textMatch[2] ? textMatch[2].slice(-2) : '26';
      return `${matchedMonth}-${yearStr}`;
    }
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

// TARGET LISTS SPECIFIC TO OBJETIVOS CONTRACT
export const OBJ_FACT_TARGETS = [
  'obj_facturacion',
  'objfacturacion',
  'objetivo_facturacion',
  'objetivofacturacion',
  'presupuesto_facturacion',
  'presupuestofacturacion',
  'presupuesto_de_facturacion',
  'facturacion_presupuesto',
  'facturacion_presupuestada',
  'facturacion_objetivo',
  'presupuesto_gs',
  'presupuestogs',
  'presupuesto_guaranies',
  'meta_facturacion',
  'metafacturacion',
  'cuota_facturacion',
  'cuotafacturacion',
  'obj_fact',
  'objfact',
  'presupuesto',
  'cuota',
  'meta',
  'facturacion',
  'monto'
];

export const OBJ_TON_TARGETS = [
  'obj_toneladas',
  'objtoneladas',
  'objetivo_toneladas',
  'presupuesto_toneladas',
  'presupuestotoneladas',
  'meta_toneladas',
  'cuota_toneladas',
  'toneladas_presupuesto',
  'toneladas_objetivo',
  'toneladas_presupuestadas',
  'presupuesto_ton',
  'obj_ton',
  'objton',
  'toneladas',
  'ton',
  'tons'
];

// TARGET LISTS SPECIFIC TO VENTAS REALES CONTRACT
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
  'real_toneladas',
  'ton_ventas',
  'ventas_ton',
  'toneladas',
  'ton',
  'tons'
];

// TARGET LISTS SPECIFIC TO COBERTURA CONTRACT
export const COB_PLANIFICADA_TARGETS = [
  'objetivo_cobertura',
  'objetivocobertura',
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
  'metacobertura',
  'cobertura'
];

export const COB_REALES_TARGETS = [
  'clientes_reales',
  'clientesreales',
  'clientes_efectivos',
  'cobertura_real',
  'coberturareal',
  'clientes_atendidos',
  'reales',
  'efectivos',
  'clientes_activos'
];

/**
 * Strict property finder that ensures sales columns are never matched by objective patterns
 * and vice-versa, avoiding cross-contamination between budget goals and actual sales.
 */
export function findRowPropStrict(
  row: Record<string, unknown>,
  targetNames: string[],
  options?: { forbidSubstrings?: string[] }
): unknown {
  const normTargets = targetNames.map(t => t.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const rowEntries = Object.entries(row);

  // 1. Exact normalized match first (highest priority)
  for (const [key, val] of rowEntries) {
    const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normTargets.includes(normKey)) {
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        return val;
      }
    }
  }

  // 2. Controlled substring match only if not containing forbidden substrings
  const forbid = (options?.forbidSubstrings || []).map(f => f.toLowerCase().replace(/[^a-z0-9]/g, ''));
  for (const [key, val] of rowEntries) {
    const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (forbid.some(f => f.length > 0 && normKey.includes(f))) {
      continue;
    }
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
 * Backward-compatible findRowProp wrapper
 */
export function findRowProp(row: Record<string, unknown>, targetNames: string[]): unknown {
  return findRowPropStrict(row, targetNames);
}

/**
 * Determines unambiguous role of an Excel sheet based on name and header signatures.
 */
function determineSheetRole(
  sheetName: string,
  firstRow?: Record<string, unknown>
): 'objetivos' | 'ventas' | 'cobertura' | 'combined' | 'unknown' {
  const cleanName = sheetName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  if (
    cleanName === 'dbobjetivos' ||
    cleanName.includes('objetiv') ||
    cleanName.includes('presupuest') ||
    cleanName.includes('metas') ||
    cleanName.includes('cuotas')
  ) {
    return 'objetivos';
  }
  if (
    cleanName === 'dbcobertura' ||
    cleanName.includes('cobertur') ||
    cleanName.includes('coverag') ||
    cleanName.includes('cliente') ||
    cleanName.includes('cartera')
  ) {
    return 'cobertura';
  }
  if (
    cleanName === 'dbventas' ||
    cleanName.includes('venta') ||
    cleanName.includes('sales')
  ) {
    return 'ventas';
  }

  // If generic name (e.g. Sheet1, Hoja1, Data), inspect first row headers
  if (firstRow) {
    const hasCob = Boolean(
      findRowPropStrict(firstRow, COB_PLANIFICADA_TARGETS, { forbidSubstrings: ['real', 'venta'] }) ||
      findRowPropStrict(firstRow, COB_REALES_TARGETS, { forbidSubstrings: ['obj', 'plan'] })
    );
    const hasObj = Boolean(
      findRowPropStrict(firstRow, ['obj_facturacion', 'objfacturacion', 'presupuesto_facturacion', 'obj_toneladas', 'presupuesto_toneladas'], { forbidSubstrings: ['venta', 'real'] })
    );
    const hasVen = Boolean(
      findRowPropStrict(firstRow, ['ventas_facturacion', 'ventasfacturacion', 'ventas_toneladas', 'ventastoneladas'], { forbidSubstrings: ['obj', 'presupuest'] })
    );

    if (hasCob && !hasObj && !hasVen) return 'cobertura';
    if (hasObj && hasVen) return 'combined';
    if (hasObj && !hasVen) return 'objetivos';
    if (hasVen && !hasObj) return 'ventas';
  }

  return 'unknown';
}

/**
 * Parse an Excel file (or CSV) containing DB_Objetivos, DB_Cobertura, DB_Ventas
 * Fully adheres to the official Data Contract (Plantilla_Comercial_Objetivos_Cobertura_Ventas.xlsx):
 * - DB_Objetivos: Zona, Supervisor, Codigo_Ruta, Vendedor, Producto, Obj_Toneladas, Obj_Facturacion, Mes
 * - DB_Cobertura: Zona, Supervisor, Codigo_Ruta, Vendedor, Objetivo_Cobertura, Clientes_Reales, Mes
 * - DB_Ventas: Zona, Codigo_Ruta, Supervisor, Producto, Ventas_Toneladas, Ventas_Facturacion, Mes
 * Auto-enriches missing Vendedor in Ventas via Route-to-Vendor directory without row duplication.
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
  const recognizedColumns: Record<string, string[]> = {};

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

  // 2. Inspect and classify every sheet with mutual exclusion
  interface SheetAnalysis {
    sheetName: string;
    sheet: XLSX.WorkSheet;
    rawRows: Record<string, unknown>[];
    role: 'objetivos' | 'ventas' | 'cobertura' | 'combined' | 'unknown';
  }

  const sheetAnalyses: SheetAnalysis[] = [];

  for (const sheetName of sheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
    if (!rawRows || rawRows.length === 0) continue;

    const firstRow = rawRows[0];
    const role = determineSheetRole(sheetName, firstRow);

    sheetAnalyses.push({
      sheetName,
      sheet,
      rawRows,
      role
    });
  }

  // 3. STEP A: Process DB_Objetivos Sheets first (populates routeDirectory)
  for (const analysis of sheetAnalyses) {
    if (analysis.role === 'objetivos' || analysis.role === 'combined') {
      detectedSheets.push(analysis.sheetName);
      const colsRecognized: string[] = [];
      const firstRow = analysis.rawRows[0] || {};

      // Identify & validate columns
      const hasZona = Boolean(findRowPropStrict(firstRow, ['zona', 'region', 'sucursal']));
      const hasSupervisor = Boolean(findRowPropStrict(firstRow, ['supervisor', 'superv']));
      const hasRuta = Boolean(findRowPropStrict(firstRow, ['codigo_ruta', 'codigoruta', 'ruta', 'cod_ruta']));
      const hasVendedor = Boolean(findRowPropStrict(firstRow, ['vendedor', 'nombre_vendedor', 'ejecutivo']));
      const hasProducto = Boolean(findRowPropStrict(firstRow, ['producto', 'articulo', 'descripcion']));
      const hasTon = Boolean(findRowPropStrict(firstRow, OBJ_TON_TARGETS, { forbidSubstrings: ['venta', 'real'] }));
      const hasFact = Boolean(findRowPropStrict(firstRow, OBJ_FACT_TARGETS, { forbidSubstrings: ['venta', 'real'] }));
      const hasMes = Boolean(findRowPropStrict(firstRow, ['mes', 'periodo', 'fecha']));

      if (hasZona) colsRecognized.push('Zona');
      if (hasSupervisor) colsRecognized.push('Supervisor');
      if (hasRuta) colsRecognized.push('Codigo_Ruta');
      if (hasVendedor) colsRecognized.push('Vendedor');
      if (hasProducto) colsRecognized.push('Producto');
      if (hasTon) colsRecognized.push('Obj_Toneladas');
      if (hasFact) colsRecognized.push('Obj_Facturacion');
      if (hasMes) colsRecognized.push('Mes');
      recognizedColumns[analysis.sheetName] = colsRecognized;

      if (!hasTon) {
        issues.push({
          type: 'warning',
          hoja: analysis.sheetName,
          columna: 'Obj_Toneladas',
          mensaje: 'No se detectó columna de Toneladas Objetivo (ej. Obj_Toneladas o Presupuesto_Toneladas).'
        });
      }
      if (!hasFact) {
        issues.push({
          type: 'warning',
          hoja: analysis.sheetName,
          columna: 'Obj_Facturacion',
          mensaje: 'No se detectó columna de Facturación Objetivo (ej. Obj_Facturacion o Presupuesto_Facturacion).'
        });
      }

      analysis.rawRows.forEach((row, idx) => {
        const rowNum = idx + 2;
        const zona = cleanText(findRowPropStrict(row, ['zona', 'region', 'sucursal']));
        const supervisor = cleanText(findRowPropStrict(row, ['supervisor', 'superv']));
        const ruta = cleanText(findRowPropStrict(row, ['codigo_ruta', 'codigoruta', 'ruta', 'cod_ruta']));
        const vendedor = cleanText(findRowPropStrict(row, ['vendedor', 'nombre_vendedor', 'ejecutivo']));
        const producto = cleanText(findRowPropStrict(row, ['producto', 'articulo', 'descripcion']));
        const tonRaw = findRowPropStrict(row, OBJ_TON_TARGETS, { forbidSubstrings: ['venta', 'real'] });
        const factRaw = findRowPropStrict(row, OBJ_FACT_TARGETS, { forbidSubstrings: ['venta', 'real'] });
        const mesRaw = findRowPropStrict(row, ['mes', 'periodo', 'fecha']);

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

  // 4. STEP B: Process DB_Cobertura Sheets (enriches routeDirectory)
  for (const analysis of sheetAnalyses) {
    if (analysis.role === 'cobertura') {
      detectedSheets.push(analysis.sheetName);
      const colsRecognized: string[] = [];
      const firstRow = analysis.rawRows[0] || {};

      const hasZona = Boolean(findRowPropStrict(firstRow, ['zona', 'region', 'sucursal']));
      const hasSupervisor = Boolean(findRowPropStrict(firstRow, ['supervisor', 'superv']));
      const hasRuta = Boolean(findRowPropStrict(firstRow, ['codigo_ruta', 'codigoruta', 'ruta', 'cod_ruta']));
      const hasVendedor = Boolean(findRowPropStrict(firstRow, ['vendedor', 'nombre_vendedor', 'ejecutivo']));
      const hasCob = Boolean(findRowPropStrict(firstRow, COB_PLANIFICADA_TARGETS, { forbidSubstrings: ['real', 'venta'] }));
      const hasReales = Boolean(findRowPropStrict(firstRow, COB_REALES_TARGETS, { forbidSubstrings: ['obj', 'plan'] }));
      const hasMes = Boolean(findRowPropStrict(firstRow, ['mes', 'periodo', 'fecha']));

      if (hasZona) colsRecognized.push('Zona');
      if (hasSupervisor) colsRecognized.push('Supervisor');
      if (hasRuta) colsRecognized.push('Codigo_Ruta');
      if (hasVendedor) colsRecognized.push('Vendedor');
      if (hasCob) colsRecognized.push('Objetivo_Cobertura');
      if (hasReales) colsRecognized.push('Clientes_Reales');
      if (hasMes) colsRecognized.push('Mes');
      recognizedColumns[analysis.sheetName] = colsRecognized;

      if (!hasCob) {
        issues.push({
          type: 'warning',
          hoja: analysis.sheetName,
          columna: 'Objetivo_Cobertura',
          mensaje: 'No se detectó columna de Objetivo de Cobertura (ej. Objetivo_Cobertura).'
        });
      }
      if (!hasReales) {
        issues.push({
          type: 'warning',
          hoja: analysis.sheetName,
          columna: 'Clientes_Reales',
          mensaje: 'No se detectó columna de Clientes Reales (ej. Clientes_Reales).'
        });
      }

      analysis.rawRows.forEach((row) => {
        const zona = cleanText(findRowPropStrict(row, ['zona', 'region', 'sucursal']));
        const supervisor = cleanText(findRowPropStrict(row, ['supervisor', 'superv']));
        const ruta = cleanText(findRowPropStrict(row, ['codigo_ruta', 'codigoruta', 'ruta', 'cod_ruta']));
        const vendedor = cleanText(findRowPropStrict(row, ['vendedor', 'nombre_vendedor', 'ejecutivo']));
        const cobRaw = findRowPropStrict(row, COB_PLANIFICADA_TARGETS, { forbidSubstrings: ['real', 'venta'] });
        const realesRaw = findRowPropStrict(row, COB_REALES_TARGETS, { forbidSubstrings: ['obj', 'plan'] });
        const mesRaw = findRowPropStrict(row, ['mes', 'periodo', 'fecha']);

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

  // 5. STEP C: Process DB_Ventas Sheets (sales results exclusively; auto-enriches vendor from route)
  for (const analysis of sheetAnalyses) {
    if (analysis.role === 'ventas' || analysis.role === 'combined') {
      detectedSheets.push(analysis.sheetName);
      const colsRecognized: string[] = [];
      const firstRow = analysis.rawRows[0] || {};

      const hasZona = Boolean(findRowPropStrict(firstRow, ['zona', 'region', 'sucursal']));
      const hasRuta = Boolean(findRowPropStrict(firstRow, ['codigo_ruta', 'codigoruta', 'ruta', 'cod_ruta']));
      const hasSupervisor = Boolean(findRowPropStrict(firstRow, ['supervisor', 'superv']));
      const hasProducto = Boolean(findRowPropStrict(firstRow, ['producto', 'articulo', 'descripcion']));
      const hasTon = Boolean(findRowPropStrict(firstRow, VENTAS_TON_TARGETS, { forbidSubstrings: ['obj', 'presupuest', 'meta'] }));
      const hasFact = Boolean(findRowPropStrict(firstRow, VENTAS_FACT_TARGETS, { forbidSubstrings: ['obj', 'presupuest', 'meta'] }));
      const hasMes = Boolean(findRowPropStrict(firstRow, ['mes', 'periodo', 'fecha']));
      const hasVendedor = Boolean(findRowPropStrict(firstRow, ['vendedor', 'nombre_vendedor', 'ejecutivo']));

      if (hasZona) colsRecognized.push('Zona');
      if (hasRuta) colsRecognized.push('Codigo_Ruta');
      if (hasSupervisor) colsRecognized.push('Supervisor');
      if (hasVendedor) colsRecognized.push('Vendedor');
      if (hasProducto) colsRecognized.push('Producto');
      if (hasTon) colsRecognized.push('Ventas_Toneladas');
      if (hasFact) colsRecognized.push('Ventas_Facturacion');
      if (hasMes) colsRecognized.push('Mes');
      recognizedColumns[analysis.sheetName] = colsRecognized;

      if (!hasTon) {
        issues.push({
          type: 'warning',
          hoja: analysis.sheetName,
          columna: 'Ventas_Toneladas',
          mensaje: 'No se detectó columna de Ventas Toneladas (ej. Ventas_Toneladas).'
        });
      }
      if (!hasFact) {
        issues.push({
          type: 'warning',
          hoja: analysis.sheetName,
          columna: 'Ventas_Facturacion',
          mensaje: 'No se detectó columna de Ventas Facturación (ej. Ventas_Facturacion).'
        });
      }

      analysis.rawRows.forEach((row, idx) => {
        const rowNum = idx + 2;
        let zona = cleanText(findRowPropStrict(row, ['zona', 'region', 'sucursal']));
        let supervisor = cleanText(findRowPropStrict(row, ['supervisor', 'superv']));
        const ruta = cleanText(findRowPropStrict(row, ['codigo_ruta', 'codigoruta', 'ruta', 'cod_ruta']));
        let vendedor = cleanText(findRowPropStrict(row, ['vendedor', 'nombre_vendedor', 'ejecutivo']));
        const producto = cleanText(findRowPropStrict(row, ['producto', 'articulo', 'descripcion']));
        const tonRaw = findRowPropStrict(row, VENTAS_TON_TARGETS, { forbidSubstrings: ['obj', 'presupuest', 'meta'] });
        const factRaw = findRowPropStrict(row, VENTAS_FACT_TARGETS, { forbidSubstrings: ['obj', 'presupuest', 'meta'] });
        const mesRaw = findRowPropStrict(row, ['mes', 'periodo', 'fecha']);

        if (!zona && !ruta && !producto) return;

        // In DB_Ventas, Vendedor is not in template: enrich from 1:1 route in directory without fabricating
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
      });
    }
  }

  // Missing sheets tracking according to contract
  if (ventasData.length === 0) missingSheets.push('DB_Ventas');
  if (objetivosData.length === 0) missingSheets.push('DB_Objetivos');
  if (coberturaData.length === 0) missingSheets.push('DB_Cobertura');

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

  // Compute segregated totals for preview validation
  const totObjTon = objetivosData.reduce((acc, o) => acc + (o.toneladas || 0), 0);
  const totObjFact = objetivosData.reduce((acc, o) => acc + (o.facturacion || 0), 0);
  const totVenTon = ventasData.reduce((acc, v) => acc + (v.ventas_toneladas || 0), 0);
  const totVenFact = ventasData.reduce((acc, v) => acc + (v.ventas_facturacion || 0), 0);
  const totCobPlan = coberturaData.reduce((acc, c) => acc + (c.cobertura_planificada || 0), 0);
  const totCliReal = coberturaData.reduce((acc, c) => acc + (c.clientes_reales || 0), 0);

  const totals = {
    objetivoToneladas: totObjTon,
    objetivoFacturacion: totObjFact,
    ventasToneladas: totVenTon,
    ventasFacturacion: totVenFact,
    coberturaPlanificada: totCobPlan,
    clientesReales: totCliReal,
    cumplimientoTon: totObjTon > 0 ? (totVenTon / totObjTon) * 100 : null,
    cumplimientoFact: totObjFact > 0 ? (totVenFact / totObjFact) * 100 : null,
    cumplimientoCob: totCobPlan > 0 ? (totCliReal / totCobPlan) * 100 : null
  };

  return {
    filename: file.name,
    detectedSheets: Array.from(new Set(detectedSheets)),
    missingSheets,
    recognizedColumns,
    periodos,
    objetivosCount: objetivosData.length,
    ventasCount: ventasData.length,
    coberturaCount: coberturaData.length,
    totals,
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
