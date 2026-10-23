export type UserRole = 'admin' | 'consulta';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
}

export interface DatabaseState {
  ventas: VentaRecord[];
  objetivos: ObjetivoRecord[];
  cobertura: CoberturaRecord[];
  batches: ImportBatch[];
  auditLogs: AuditLog[];
  currentUser: UserProfile;
}

export interface VentaRecord {
  id: string;
  periodo_mes: string; // e.g. "sept-26" or "2026-09"
  zona: string;
  supervisor: string;
  codigo_ruta: string;
  vendedor: string;
  producto: string;
  ventas_toneladas: number;
  ventas_facturacion: number;
  import_batch_id: string;
  created_at: string;
}

export interface ObjetivoRecord {
  id: string;
  periodo_mes: string;
  zona: string;
  supervisor: string;
  codigo_ruta: string;
  vendedor: string;
  producto: string;
  toneladas: number;
  facturacion: number;
  import_batch_id: string;
  created_at: string;
}

export interface CoberturaRecord {
  id: string;
  periodo_mes: string;
  zona: string;
  supervisor: string;
  codigo_ruta: string;
  vendedor: string;
  cobertura_planificada: number;
  clientes_reales: number;
  import_batch_id: string;
  created_at: string;
}

export type ImportOperationType = 'append' | 'replace';

export interface ImportBatch {
  id: string;
  filename: string;
  periodos_detectados: string[];
  fuentes_incluidas: ('objetivos' | 'ventas' | 'cobertura')[];
  tipo_operacion: ImportOperationType;
  registros_objetivos: number;
  registros_ventas: number;
  registros_cobertura: number;
  status: 'completado' | 'fallido' | 'en_progreso';
  created_by: string;
  created_at: string;
  duration_ms: number;
  notas?: string;
  errores?: string[];
}

export interface AuditLog {
  id: string;
  batch_id?: string;
  action: 'IMPORT_APPEND' | 'IMPORT_REPLACE' | 'DELETE_PERIOD' | 'ROLE_CHANGE' | 'RESET_DEMO' | 'SUPABASE_SYNC' | 'CLEAR_DATABASE';
  details: string;
  user_email: string;
  user_role: UserRole;
  created_at: string;
  periodo_afectado?: string;
}

export interface FilterState {
  periodo: string; // single or primary
  periodosComparar?: string[];
  zona: string;
  supervisor: string;
  codigoRuta: string;
  producto: string;
  vendedor: string;
  busqueda: string;
}

export interface CommercialKPIs {
  // Toneladas
  objetivoToneladas: number;
  ventasToneladas: number;
  cumplimientoToneladas: number | null; // null if obj = 0 -> N/D
  diferenciaToneladas: number;

  // Facturación (PYG)
  objetivoFacturacion: number;
  ventasFacturacion: number;
  cumplimientoFacturacion: number | null;
  diferenciaFacturacion: number;

  // Cobertura (Clientes)
  coberturaPlanificada: number;
  clientesReales: number;
  cumplimientoCobertura: number | null;
  diferenciaCobertura: number;

  // Conteo dimensional
  totalRutas: number;
  totalVendedores: number;
  totalProductos: number;
  totalZonas: number;
  totalSupervisores: number;
}

export interface DimensionAggregation {
  clave: string;
  nombre: string;
  subtexto?: string;
  objetivoTon: number;
  realTon: number;
  cumplimientoTon: number | null;
  deltaTon: number;
  objetivoFact: number;
  realFact: number;
  cumplimientoFact: number | null;
  deltaFact: number;
  coberturaObj: number;
  clientesReal: number;
  cumplimientoCob: number | null;
}

export interface HistoricalPoint {
  periodo: string;
  mesNombre: string;
  objetivoFact: number;
  realFact: number;
  cumplimientoFact: number | null;
  objetivoTon: number;
  realTon: number;
  cumplimientoTon: number | null;
  coberturaObj: number;
  clientesReal: number;
  cumplimientoCob: number | null;
  hasVentas: boolean;
  hasObjetivos: boolean;
  hasCobertura: boolean;
}

export interface ValidationIssue {
  type: 'error' | 'warning';
  hoja: string;
  fila?: number;
  columna?: string;
  mensaje: string;
}

export interface ImportPreviewSummary {
  filename: string;
  detectedSheets: string[];
  missingSheets: string[];
  periodos: string[];
  objetivosCount: number;
  ventasCount: number;
  coberturaCount: number;
  issues: ValidationIssue[];
  isValid: boolean;
  objetivosData: Partial<ObjetivoRecord>[];
  ventasData: Partial<VentaRecord>[];
  coberturaData: Partial<CoberturaRecord>[];
}
