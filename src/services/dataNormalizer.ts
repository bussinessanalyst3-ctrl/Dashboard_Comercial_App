import * as XLSX from 'xlsx';
import {
  VentaRecord,
  ObjetivoRecord,
  CoberturaRecord,
  ImportPreviewSummary,
  ValidationIssue
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
  if (!s) return 0;

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

  // Handle thousand separators: if comma is used as thousand separator (e.g. 22,249,034)
  // or if decimal is dot vs comma
  if (s.includes(',') && !s.includes('.')) {
    // If it has multiple commas or looks like 22,249,034
    const commaCount = (s.match(/,/g) || []).length;
    if (commaCount > 1 || /^\d{1,3}(,\d{3})+$/.test(s)) {
      s = s.replace(/,/g, '');
    } else {
      // Single comma - could be decimal (e.g. 3,14) or thousand (e.g. 1,000)
      const parts = s.split(',');
      if (parts[1] && parts[1].length === 3 && parts[0].length <= 3) {
        s = s.replace(/,/g, '');
      } else {
        s = s.replace(',', '.');
      }
    }
  } else if (s.includes(',') && s.includes('.')) {
    // standard 1,234.56
    s = s.replace(/,/g, '');
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
      if (target.length >= 5 && (normKey.includes(target) || normKey === target)) {
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
 * Supports multi-sheet workbooks, single-sheet files, and combined tables (sales + budget side-by-side).
 */
export async function parseExcelOrCsvFile(
  file: File
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

  // Helper to check matching sheet names
  const findSheetByName = (names: string[]): string | undefined => {
    return sheetNames.find(sn => {
      const clean = sn.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      return names.some(target => clean.includes(target.toLowerCase().replace(/[^a-z0-9]/g, '')));
    });
  };

  let explicitVentasSheet = findSheetByName(['db_ventas', 'ventas', 'venta', 'facturacion', 'sep_26']);
  let explicitObjSheet = findSheetByName(['db_objetivos', 'objetivos', 'objetivo', 'presupuesto', 'presupuestos', 'metas', 'cuotas', 'goals', 'budget']);
  let explicitCobSheet = findSheetByName(['db_cobertura', 'cobertura', 'coverage', 'clientes', 'cartera']);

  // If there's only 1 sheet (typical of CSV or single-sheet Excel), inspect its columns to determine what it contains
  if (sheetNames.length === 1) {
    const singleSheetName = sheetNames[0];
    const singleSheet = workbook.Sheets[singleSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(singleSheet, { defval: '' });

    if (rawRows.length > 0) {
      const firstRow = rawRows[0];
      const hasSpecificVentasCol = Boolean(findRowProp(firstRow, ['ventas_facturacion', 'ventas_toneladas', 'facturacion_real', 'toneladas_reales', 'ventas_fact']));
      const hasSpecificObjCol = Boolean(findRowProp(firstRow, ['presupuesto_facturacion', 'presupuesto_toneladas', 'obj_facturacion', 'obj_toneladas', 'objetivo_facturacion', 'presupuesto', 'meta', 'cuota']));
      const hasCobCol = Boolean(findRowProp(firstRow, ['cobertura', 'clientes_reales', 'cobertura_planificada']));

      // If it has combined columns (both sales & budget)
      if (hasSpecificVentasCol && hasSpecificObjCol) {
        explicitVentasSheet = singleSheetName;
        explicitObjSheet = singleSheetName;
      } else if (hasSpecificObjCol && !hasSpecificVentasCol) {
        // Pure budget/objective file
        explicitObjSheet = singleSheetName;
        explicitVentasSheet = undefined;
      } else if (hasCobCol && !hasSpecificVentasCol && !hasSpecificObjCol) {
        // Pure coverage file
        explicitCobSheet = singleSheetName;
        explicitVentasSheet = undefined;
      } else {
        // Standard sales or general file
        explicitVentasSheet = singleSheetName;
      }
    }
  }

  // 1. PARSE VENTAS
  if (explicitVentasSheet) {
    detectedSheets.push(explicitVentasSheet);
    const sheet = workbook.Sheets[explicitVentasSheet];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

    rawRows.forEach((row, idx) => {
      const rowNum = idx + 2;
      const zona = cleanText(findRowProp(row, ['zona', 'region', 'sucursal']));
      const supervisor = cleanText(findRowProp(row, ['supervisor', 'superv']));
      const ruta = cleanText(findRowProp(row, ['codigo_ruta', 'codigoruta', 'ruta', 'cod_ruta']));
      const vendedor = cleanText(findRowProp(row, ['vendedor', 'nombre_vendedor', 'ejecutivo']));
      const producto = cleanText(findRowProp(row, ['producto', 'articulo', 'descripcion']));
      const tonRaw = findRowProp(row, VENTAS_TON_TARGETS);
      const factRaw = findRowProp(row, VENTAS_FACT_TARGETS);
      const mesRaw = findRowProp(row, ['mes', 'periodo', 'fecha']);

      if (!zona && !ruta && !producto) return;

      if (!ruta) {
        issues.push({
          type: 'warning',
          hoja: explicitVentasSheet!,
          fila: rowNum,
          columna: 'Codigo_Ruta',
          mensaje: 'Fila con Código de Ruta vacío'
        });
      }
      if (!producto) {
        issues.push({
          type: 'warning',
          hoja: explicitVentasSheet!,
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

      // COMBINED TABLE CHECK: If the same row ALSO contains budget / objectives columns
      // (e.g. "presupuesto_facturacion", "obj_facturacion", "presupuesto", "meta")
      // extract the corresponding ObjetivoRecord!
      const objFactRaw = findRowProp(row, [
        'presupuesto_facturacion',
        'presupuestofacturacion',
        'presupuesto_de_facturacion',
        'obj_facturacion',
        'objetivo_facturacion',
        'meta_facturacion',
        'cuota_facturacion',
        'presupuesto_gs',
        'obj_fact',
        'presupuesto',
        'meta',
        'cuota'
      ]);
      const objTonRaw = findRowProp(row, [
        'presupuesto_toneladas',
        'obj_toneladas',
        'meta_toneladas',
        'cuota_toneladas',
        'toneladas_presupuesto',
        'toneladas_objetivo',
        'presupuesto_ton',
        'obj_ton'
      ]);

      if (objFactRaw !== undefined || objTonRaw !== undefined) {
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
  } else {
    missingSheets.push('DB_Ventas');
  }

  // 2. PARSE OBJETIVOS (from dedicated sheet if present and not already extracted from combined sheet)
  if (explicitObjSheet && explicitObjSheet !== explicitVentasSheet) {
    detectedSheets.push(explicitObjSheet);
    const sheet = workbook.Sheets[explicitObjSheet];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

    rawRows.forEach((row, idx) => {
      const zona = cleanText(findRowProp(row, ['zona', 'region', 'sucursal']));
      const supervisor = cleanText(findRowProp(row, ['supervisor']));
      const ruta = cleanText(findRowProp(row, ['codigo_ruta', 'codigoruta', 'ruta']));
      const vendedor = cleanText(findRowProp(row, ['vendedor']));
      const producto = cleanText(findRowProp(row, ['producto']));
      const tonRaw = findRowProp(row, OBJ_TON_TARGETS);
      const factRaw = findRowProp(row, OBJ_FACT_TARGETS);
      const mesRaw = findRowProp(row, ['mes', 'periodo']);

      if (!zona && !ruta && !producto) return;

      const mesNorm = normalizePeriod(mesRaw);
      if (mesNorm !== 'DESCONOCIDO') periodosSet.add(mesNorm);

      objetivosData.push({
        zona: zona || 'SIN ZONA',
        supervisor: supervisor || 'SIN SUPERVISOR',
        codigo_ruta: ruta || 'SIN-RUTA',
        vendedor: vendedor || 'SIN VENDEDOR',
        producto: producto || 'SIN PRODUCTO',
        toneladas: cleanNumber(tonRaw),
        facturacion: cleanNumber(factRaw),
        periodo_mes: mesNorm
      });
    });
  } else if (!explicitObjSheet && objetivosData.length === 0) {
    missingSheets.push('DB_Objetivos');
  }

  // 3. PARSE COBERTURA
  if (explicitCobSheet) {
    detectedSheets.push(explicitCobSheet);
    const sheet = workbook.Sheets[explicitCobSheet];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

    rawRows.forEach((row) => {
      const zona = cleanText(findRowProp(row, ['zona']));
      const supervisor = cleanText(findRowProp(row, ['supervisor']));
      const ruta = cleanText(findRowProp(row, ['codigo_ruta', 'codigoruta', 'ruta']));
      const vendedor = cleanText(findRowProp(row, ['vendedor']));
      const cobRaw = findRowProp(row, ['cobertura', 'clientes_objetivo', 'obj_clientes', 'cobertura_planificada', 'plan_cobertura']);
      const realesRaw = findRowProp(row, ['clientes_reales', 'clientes', 'reales', 'efectivos', 'clientes_activos']);
      const mesRaw = findRowProp(row, ['mes', 'periodo']);

      if (!ruta && !vendedor) return;

      const mesNorm = normalizePeriod(mesRaw);
      if (mesNorm !== 'DESCONOCIDO') periodosSet.add(mesNorm);

      coberturaData.push({
        zona: zona || 'SIN ZONA',
        supervisor: supervisor || 'SIN SUPERVISOR',
        codigo_ruta: ruta || 'SIN-RUTA',
        vendedor: vendedor || 'SIN VENDEDOR',
        cobertura_planificada: Math.round(cleanNumber(cobRaw)),
        clientes_reales: Math.round(cleanNumber(realesRaw)),
        periodo_mes: mesNorm
      });
    });
  } else {
    missingSheets.push('DB_Cobertura');
  }

  // Fallback notes
  if (sheetNames.length === 1 && objetivosData.length === 0) {
    issues.push({
      type: 'warning',
      hoja: sheetNames[0],
      mensaje: 'El archivo cargado contiene únicamente Ventas (0 Objetivos / Presupuestos detectados). Para cargar presupuestos, incluya la hoja DB_Objetivos o columnas como "Presupuesto Facturación".'
    });
  }

  // Period detection
  const periodos = Array.from(periodosSet);
  if (periodos.length === 0) {
    issues.push({
      type: 'warning',
      hoja: 'General',
      mensaje: 'No se detectó columna de período explícita en el archivo. Se utilizará el período oficial seleccionado por el Administrador.'
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
 * Generate a ready-to-use sample template (.xlsx) with the 3 sheets pre-formatted
 */
export function generateSampleExcelTemplate(): void {
  const sampleObj = [
    { Zona: 'CIUDAD DEL ESTE', Supervisor: 'VAZQUEZ CARLOS MODESTO', Codigo_Ruta: 'CDE-PV1', Vendedor: 'BAEZ ROJAS EVER WILFRIDO', Producto: 'DETERGENTES', Toneladas: 3.5, Facturación: 25000000, Mes: 'oct-26' },
    { Zona: 'CIUDAD DEL ESTE', Supervisor: 'VAZQUEZ CARLOS MODESTO', Codigo_Ruta: 'CDE-PV1', Vendedor: 'BAEZ ROJAS EVER WILFRIDO', Producto: 'MARGARINERIA', Toneladas: 5.0, Facturación: 72000000, Mes: 'oct-26' }
  ];

  const sampleCob = [
    { Zona: 'CIUDAD DEL ESTE', Supervisor: 'VAZQUEZ CARLOS MODESTO', Codigo_Ruta: 'CDE-PV1', Vendedor: 'BAEZ ROJAS EVER WILFRIDO', Cobertura: 85, Clientes_Reales: 78, Mes: 'oct-26' }
  ];

  const sampleVen = [
    { Zona: 'CIUDAD DEL ESTE', Supervisor: 'VAZQUEZ CARLOS MODESTO', Codigo_Ruta: 'CDE-PV1', Vendedor: 'BAEZ ROJAS EVER WILFRIDO', Producto: 'DETERGENTES', Ventas_Toneladas: 3.14, Ventas_Facturacion: 22249034, Mes: 'oct-26' },
    { Zona: 'CIUDAD DEL ESTE', Supervisor: 'VAZQUEZ CARLOS MODESTO', Codigo_Ruta: 'CDE-PV1', Vendedor: 'BAEZ ROJAS EVER WILFRIDO', Producto: 'MARGARINERIA', Ventas_Toneladas: 4.74, Ventas_Facturacion: 68071185, Mes: 'oct-26' }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sampleObj), 'DB_Objetivos');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sampleCob), 'DB_Cobertura');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sampleVen), 'DB_Ventas');
  XLSX.writeFile(wb, 'Plantilla_Comercial_Objetivos_Cobertura_Ventas.xlsx');
}
