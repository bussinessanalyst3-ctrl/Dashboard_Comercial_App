import React, { useState } from 'react';
import {
  DatabaseState,
  ImportPreviewSummary,
  ImportOperationType,
  UserRole,
  VentaRecord
} from '../types/commercial';
import {
  parseExcelOrCsvFile,
  generateSampleExcelTemplate,
  formatPeriodDisplay,
  formatGuaranies,
  formatTons,
  formatPercent,
  formatInteger
} from '../services/dataNormalizer';
import {
  executeAppendImport,
  executeReplacePeriodImport,
  resetDatabaseState,
  clearAllCommercialData,
  restoreBaselineObjetivos
} from '../services/dbStore';
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  FileText,
  Download,
  Info,
  Layers,
  Database,
  Trash2
} from 'lucide-react';

interface DataManagementProps {
  dbState: DatabaseState;
  onUpdateDbState: (newState: DatabaseState) => void;
  userRole: UserRole;
  onSwitchToAudit: () => void;
  onSwitchToDashboard?: (targetPeriod?: string) => void;
}

export const MONTH_OPTIONS = [
  { code: 'ene', name: 'Enero (01)' },
  { code: 'feb', name: 'Febrero (02)' },
  { code: 'mar', name: 'Marzo (03)' },
  { code: 'abr', name: 'Abril (04)' },
  { code: 'may', name: 'Mayo (05)' },
  { code: 'jun', name: 'Junio (06)' },
  { code: 'jul', name: 'Julio (07)' },
  { code: 'ago', name: 'Agosto (08)' },
  { code: 'sept', name: 'Septiembre (09)' },
  { code: 'oct', name: 'Octubre (10)' },
  { code: 'nov', name: 'Noviembre (11)' },
  { code: 'dic', name: 'Diciembre (12)' }
];

export const YEAR_OPTIONS = ['2024', '2025', '2026', '2027', '2028', '2029', '2030'];

export const DataManagement: React.FC<DataManagementProps> = ({
  dbState,
  onUpdateDbState,
  userRole,
  onSwitchToAudit,
  onSwitchToDashboard
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewSummary | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [operationType, setOperationType] = useState<ImportOperationType>('append');

  // Mandatory Official Period Assignment
  const [selectedMonth, setSelectedMonth] = useState<string>('sept');
  const [selectedYear, setSelectedYear] = useState<string>('2026');

  // Normalized official period key (e.g. "sept-26")
  const officialPeriod = `${selectedMonth}-${selectedYear.slice(-2)}`;

  // Prior data validation against existing database
  const existingVentas = dbState.ventas.filter(v => v.periodo_mes === officialPeriod).length;
  const existingObjetivos = dbState.objetivos.filter(o => o.periodo_mes === officialPeriod).length;
  const existingCobertura = dbState.cobertura.filter(c => c.periodo_mes === officialPeriod).length;
  const hasExistingData = existingVentas > 0 || existingObjetivos > 0 || existingCobertura > 0;

  const periodMismatchWarning = Boolean(
    preview &&
    preview.periodos.length > 0 &&
    !preview.periodos.includes(officialPeriod)
  );

  // Replace mode selections (automatically synchronized when preview updates)
  const [sourcesToReplace, setSourcesToReplace] = useState<{
    ventas: boolean;
    objetivos: boolean;
    cobertura: boolean;
  }>({
    ventas: true,
    objetivos: true,
    cobertura: true
  });

  // When preview loads, automatically select only sources with incoming data > 0
  React.useEffect(() => {
    if (preview) {
      setSourcesToReplace({
        ventas: preview.ventasCount > 0,
        objetivos: preview.objetivosCount > 0,
        cobertura: preview.coberturaCount > 0
      });
    }
  }, [preview]);

  // Modal / Confirm state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [clearSupabaseToo, setClearSupabaseToo] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [executionResult, setExecutionResult] = useState<{
    success: boolean;
    message: string;
    stats?: Record<string, number>;
    targetPeriod?: string;
  } | null>(null);

  const isAdmin = userRole === 'admin';

  // Restore baseline objectives for the current period
  const handleRestoreObjetivos = () => {
    if (!isAdmin) return;
    try {
      const { updatedState, restoredCount } = restoreBaselineObjetivos(dbState, officialPeriod);
      onUpdateDbState(updatedState);
      setExecutionResult({
        success: true,
        message: `Se restauraron exitosamente ${restoredCount} presupuestos/objetivos oficiales para el período ${formatPeriodDisplay(officialPeriod)} (${officialPeriod}). Los indicadores de cumplimiento de cuota ya se encuentran actualizados en el Dashboard.`,
        targetPeriod: officialPeriod
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setExecutionResult({
        success: false,
        message: `Error al restaurar presupuestos: ${msg}`
      });
    }
  };

  // Synchronize detected period when parsing file
  const syncDetectedPeriod = (periodos: string[]) => {
    if (periodos.length > 0) {
      const detected = periodos[0];
      const [mCode, yCode] = detected.split('-');
      if (mCode && MONTH_OPTIONS.some(m => m.code === mCode)) {
        setSelectedMonth(mCode);
      }
      if (yCode) {
        const fullY = yCode.length === 2 ? `20${yCode}` : yCode;
        if (YEAR_OPTIONS.includes(fullY)) {
          setSelectedYear(fullY);
        }
      }
    }
  };

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsParsing(true);
    setExecutionResult(null);

    try {
      const parsedPreview = await parseExcelOrCsvFile(file, dbState);
      setPreview(parsedPreview);
      syncDetectedPeriod(parsedPreview.periodos);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setExecutionResult({
        success: false,
        message: `Error al leer el archivo Excel/CSV: ${msg}`
      });
    } finally {
      setIsParsing(false);
    }
  };

  // Quick load of the built-in sep_26_normalizada file
  const handleLoadBuiltinCsv = async () => {
    setIsParsing(true);
    setExecutionResult(null);
    try {
      const resp = await fetch('/assets/aistudio/sep_26_normalizada_1a11da56.csv');
      const blob = await resp.blob();
      const file = new File([blob], 'sep_26_normalizada.csv', { type: 'text/csv' });
      setSelectedFile(file);
      const parsedPreview = await parseExcelOrCsvFile(file, dbState);
      setPreview(parsedPreview);
      syncDetectedPeriod(parsedPreview.periodos);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setExecutionResult({
        success: false,
        message: `No se pudo leer el archivo integrado: ${msg}`
      });
    } finally {
      setIsParsing(false);
    }
  };

  // Perform Commit
  const handleExecuteImport = () => {
    if (!preview || !isAdmin) return;

    setShowConfirmModal(false);

    try {
      if (operationType === 'append') {
        const result = executeAppendImport(
          dbState,
          {
            filename: preview.filename,
            periodos: [officialPeriod],
            officialPeriod: officialPeriod
          },
          preview.objetivosData,
          preview.ventasData,
          preview.coberturaData
        );

        onUpdateDbState(result.updatedState);
        setExecutionResult({
          success: true,
          message: `Importación incremental ejecutada con éxito para el período oficial ${formatPeriodDisplay(officialPeriod)} (${officialPeriod}). Registros persistidos localmente y sincronizados automáticamente en Supabase PostgreSQL.`,
          stats: result.stats,
          targetPeriod: officialPeriod
        });
      } else {
        // Replace mode
        const fuentesArr: ('objetivos' | 'ventas' | 'cobertura')[] = [];
        if (sourcesToReplace.ventas) fuentesArr.push('ventas');
        if (sourcesToReplace.objetivos) fuentesArr.push('objetivos');
        if (sourcesToReplace.cobertura) fuentesArr.push('cobertura');

        const result = executeReplacePeriodImport(
          dbState,
          officialPeriod,
          fuentesArr,
          preview.filename,
          preview.objetivosData,
          preview.ventasData,
          preview.coberturaData
        );

        onUpdateDbState(result.updatedState);
        setExecutionResult({
          success: true,
          message: `Reemplazo atómico completado para el período oficial ${formatPeriodDisplay(officialPeriod)} (${officialPeriod}). Datos previos eliminados y nuevos registros sincronizados automáticamente en Supabase PostgreSQL.`,
          stats: result.deletedCounts,
          targetPeriod: officialPeriod
        });
      }

      // Reset file selection
      setSelectedFile(null);
      setPreview(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setExecutionResult({
        success: false,
        message: `Fallo durante la ejecución atómica: ${msg}. La transacción fue revertida.`
      });
    }
  };

  const handleConfirmClearAll = async () => {
    setIsClearing(true);
    try {
      const res = await clearAllCommercialData(dbState.currentUser, clearSupabaseToo);
      onUpdateDbState(res.clearedState);
      setExecutionResult({
        success: true,
        message: res.message
      });
      setShowClearConfirmModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setExecutionResult({
        success: false,
        message: `Error al vaciar los datos: ${msg}`
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleResetData = () => {
    if (!confirm('¿Confirma que desea restablecer la base de datos comercial al estado inicial de fábrica (sept-26 + histórico)?')) {
      return;
    }
    const fresh = resetDatabaseState(dbState.currentUser);
    onUpdateDbState(fresh);
    setExecutionResult({
      success: true,
      message: 'Base de datos comercial restablecida con éxito al estado inicial verificado.'
    });
  };

  return (
    <div className="space-y-6 text-xs">
      {/* RBAC Notice if Consulta Role */}
      {!isAdmin && (
        <div className="rounded-lg border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-4 text-[#F59E0B]">
          <div className="flex items-center gap-2 font-bold mb-1">
            <ShieldAlert className="h-4 w-4" />
            Acceso en Modo Consulta (Solo Lectura)
          </div>
          <p className="text-[11px] leading-relaxed">
            Su rol actual no posee privilegios de escritura para importar o reemplazar datos comerciales. Puede cambiar su rol a <strong>Administrador</strong> desde el panel lateral izquierdo para probar las operaciones de carga.
          </p>
        </div>
      )}

      {/* Main Container */}
      <div className="rounded-lg border border-[#374151] bg-[#1F2937] p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[#374151]">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#9CA3AF]">
              <span>Ingesta de Datos y Gestión de Lotes</span>
              <span>/</span>
              <span className="text-[#3B82F6] font-semibold">Operaciones Atómicas</span>
            </div>
            <h2 className="mt-1 text-base font-bold text-[#F9FAFB]">
              Gestión de Datos Mensuales & Reemplazo Idempotente
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={generateSampleExcelTemplate}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#374151] bg-[#111827] px-3 py-1.5 text-xs text-[#9CA3AF] hover:text-[#F9FAFB] hover:border-[#4B5563] transition-colors"
              title="Descargar libro Excel con las 3 hojas preformateadas"
            >
              <Download className="h-3.5 w-3.5 text-[#6B7280]" />
              Descargar Plantilla Excel (.xlsx)
            </button>

            {isAdmin && (
              <>
                <button
                  onClick={handleRestoreObjetivos}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#3B82F6]/40 bg-[#3B82F6]/10 px-3 py-1.5 text-xs font-semibold text-[#3B82F6] hover:bg-[#3B82F6]/20 transition-colors"
                  title={`Recargar presupuestos y objetivos oficiales para ${formatPeriodDisplay(officialPeriod)}`}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Restaurar Presupuestos ({officialPeriod})
                </button>

                <button
                  onClick={() => setShowClearConfirmModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#EF4444]/40 bg-[#EF4444]/10 px-3 py-1.5 text-xs font-semibold text-[#EF4444] hover:bg-[#EF4444]/20 transition-colors"
                  title="Eliminar todos los datos de prueba y dejar la base en blanco"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Vaciar Datos de Prueba
                </button>

                <button
                  onClick={handleResetData}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#374151] bg-[#111827] px-3 py-1.5 text-xs text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors"
                  title="Restablecer datos originales de prueba (Demo)"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Restaurar Demo
                </button>
              </>
            )}
          </div>
        </div>

        {/* Upload Zone */}
        <div className="mt-5">
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#374151] bg-[#111827]/50 p-6 text-center hover:bg-[#111827]/80 transition-colors">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#3B82F6]/30 bg-[#3B82F6]/10 text-[#3B82F6] mb-3 shadow-xs">
              <FileSpreadsheet className="h-6 w-6" />
            </div>

            <div className="text-sm font-semibold text-[#F9FAFB]">
              Seleccione el archivo mensual de objetivos, ventas y cobertura
            </div>
            <p className="mt-1 text-xs text-[#9CA3AF] max-w-md">
              Soporta libros Excel (.xlsx, .xls) con las 3 hojas: <strong>DB_Objetivos</strong>, <strong>DB_Cobertura</strong> y <strong>DB_Ventas</strong>, o archivos CSV normalizados.
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <label className="relative cursor-pointer">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  disabled={!isAdmin}
                  className="sr-only"
                />
                <span
                  className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold shadow-xs transition-colors ${
                    isAdmin
                      ? 'bg-[#3B82F6] text-white hover:bg-[#2563EB]'
                      : 'border border-[#374151] bg-[#243042] text-[#6B7280] cursor-not-allowed'
                  }`}
                >
                  <Upload className="h-4 w-4" />
                  Examinar Archivo Local
                </span>
              </label>

              <button
                onClick={handleLoadBuiltinCsv}
                disabled={!isAdmin}
                className={`inline-flex items-center gap-1.5 rounded-md border border-[#374151] bg-[#1F2937] px-3.5 py-2 text-xs font-semibold transition-colors ${
                  isAdmin
                    ? 'text-[#F9FAFB] hover:border-[#4B5563]'
                    : 'text-[#6B7280] cursor-not-allowed'
                }`}
              >
                <FileText className="h-4 w-4 text-[#3B82F6]" />
                Cargar sep_26_normalizada.csv
              </button>
            </div>

            {isParsing && (
              <div className="mt-3 flex items-center gap-2 text-xs text-[#9CA3AF]">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#3B82F6] border-t-transparent" />
                Analizando estructura y normalizando datos con SheetJS...
              </div>
            )}
          </div>
        </div>

        {/* Execution Result Notification */}
        {executionResult && (
          <div
            className={`mt-4 rounded-lg border p-4 text-xs ${
              executionResult.success
                ? 'border-[#14B8A6]/40 bg-[#14B8A6]/10 text-[#14B8A6]'
                : 'border-[#EF4444]/40 bg-[#EF4444]/10 text-[#EF4444]'
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-1">
              {executionResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              {executionResult.success ? 'Operación Exitosa' : 'Aviso en la Operación'}
            </div>
            <p className="text-slate-200">{executionResult.message}</p>
            <div className="mt-2.5 pt-2 border-t border-[#374151] flex flex-wrap items-center justify-between gap-2">
              <span className="text-[#9CA3AF]">Transacción inmutable registrada en auditoría.</span>
              <div className="flex items-center gap-3">
                {onSwitchToDashboard && executionResult.success && (
                  <button
                    onClick={() => onSwitchToDashboard(executionResult.targetPeriod || officialPeriod)}
                    className="font-semibold underline text-[#3B82F6] hover:text-blue-400 flex items-center gap-1 cursor-pointer"
                  >
                    Ver en el Dashboard ({formatPeriodDisplay(executionResult.targetPeriod || officialPeriod)}) →
                  </button>
                )}
                <button
                  onClick={onSwitchToAudit}
                  className="font-medium underline text-[#9CA3AF] hover:text-[#F9FAFB] cursor-pointer"
                >
                  Ver Auditoría →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PREVIEW & MODALITY SELECTION */}
        {preview && (
          <div className="mt-6 space-y-5 border-t border-[#374151] pt-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#F9FAFB]">
                Vista Previa de Carga: {preview.filename}
              </h3>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${
                  preview.isValid
                    ? 'border-[#14B8A6]/40 bg-[#14B8A6]/10 text-[#14B8A6]'
                    : 'border-[#EF4444]/40 bg-[#EF4444]/10 text-[#EF4444]'
                }`}
              >
                {preview.isValid ? 'Estructura Validada' : 'Estructura Inválida'}
              </span>
            </div>

            {/* Validation Checklist Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-[#374151] bg-[#111827] p-3">
                <div className="text-[11px] text-[#9CA3AF] uppercase font-medium">Hojas Detectadas</div>
                <div className="mt-1 text-xs font-semibold text-[#F9FAFB]">
                  {preview.detectedSheets.length > 0 ? preview.detectedSheets.join(', ') : 'Ninguna'}
                </div>
              </div>

              <div className="rounded-lg border border-[#374151] bg-[#111827] p-3">
                <div className="text-[11px] text-[#9CA3AF] uppercase font-medium">Períodos Identificados</div>
                <div className="mt-1 text-xs font-bold font-mono text-[#3B82F6]">
                  {preview.periodos.length > 0 ? preview.periodos.join(', ') : 'No detectado'}
                </div>
              </div>

              <div className="rounded-lg border border-[#374151] bg-[#111827] p-3">
                <div className="text-[11px] text-[#9CA3AF] uppercase font-medium">Filas Identificadas</div>
                <div className="mt-1 text-xs text-[#F9FAFB] font-mono">
                  {preview.ventasCount} ventas · {preview.objetivosCount} obj · {preview.coberturaCount} cob
                </div>
              </div>

              <div className="rounded-lg border border-[#374151] bg-[#111827] p-3">
                <div className="text-[11px] text-[#9CA3AF] uppercase font-medium">Observaciones</div>
                <div className="mt-1 text-xs font-semibold text-[#F9FAFB]">
                  {preview.issues.length} notas
                </div>
              </div>
            </div>

            {/* Issues Log */}
            {preview.issues.length > 0 && (
              <div className="rounded-lg border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-3 space-y-1 text-xs text-[#F59E0B]">
                <div className="font-semibold flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  Observaciones de validación:
                </div>
                {preview.issues.map((iss, i) => (
                  <div key={i} className="text-xs">
                    · [{iss.hoja}] {iss.fila ? `Fila ${iss.fila}: ` : ''}{iss.mensaje}
                  </div>
                ))}
              </div>
            )}

            {/* SEPARATED TOTALS & RECOGNIZED COLUMNS AUDIT */}
            <div className="rounded-lg border border-[#374151] bg-[#111827] p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-[#374151] pb-2">
                <div className="text-xs text-[#9CA3AF] uppercase font-semibold tracking-wider">
                  Auditoría de Datos Importados por Fuente (Totales Segregados)
                </div>
                <span className="text-[11px] text-[#14B8A6] font-medium">
                  Valores aislados sin mezcla de hechos
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. DB_Objetivos Card */}
                <div className="rounded-lg border border-[#3B82F6]/40 bg-[#1F2937] p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#3B82F6]">1. DB_Objetivos (Metas)</span>
                    <span className="text-[11px] font-mono text-[#9CA3AF]">{preview.objetivosCount} filas</span>
                  </div>
                  <div className="text-[11px] text-[#6B7280]">
                    Cols: {preview.recognizedColumns['DB_Objetivos']?.join(', ') || 'Auto-detectadas'}
                  </div>
                  <div className="pt-2 border-t border-[#374151] space-y-1 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-[#9CA3AF]">Obj. Toneladas:</span>
                      <span className="font-semibold text-[#F9FAFB]">{formatTons(preview.totals.objetivoToneladas)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#9CA3AF]">Obj. Facturación:</span>
                      <span className="font-bold text-[#3B82F6]">{formatGuaranies(preview.totals.objetivoFacturacion)}</span>
                    </div>
                  </div>
                </div>

                {/* 2. DB_Ventas Card */}
                <div className="rounded-lg border border-[#14B8A6]/40 bg-[#1F2937] p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#14B8A6]">2. DB_Ventas (Reales)</span>
                    <span className="text-[11px] font-mono text-[#9CA3AF]">{preview.ventasCount} filas</span>
                  </div>
                  <div className="text-[11px] text-[#6B7280]">
                    Cols: {preview.recognizedColumns['DB_Ventas']?.join(', ') || 'Auto-detectadas'}
                  </div>
                  <div className="pt-2 border-t border-[#374151] space-y-1 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-[#9CA3AF]">Ventas Toneladas:</span>
                      <span className="font-semibold text-[#F9FAFB]">{formatTons(preview.totals.ventasToneladas)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#9CA3AF]">Ventas Facturación:</span>
                      <span className="font-bold text-[#14B8A6]">{formatGuaranies(preview.totals.ventasFacturacion)}</span>
                    </div>
                    {preview.totals.cumplimientoFact !== null && (
                      <div className="flex justify-between pt-1 border-t border-[#374151]/50 text-xs">
                        <span className="text-[#9CA3AF]">Cumpl. Facturación:</span>
                        <span className={`font-bold ${preview.totals.cumplimientoFact >= 100 ? 'text-[#14B8A6]' : 'text-[#EF4444]'}`}>
                          {formatPercent(preview.totals.cumplimientoFact)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. DB_Cobertura Card */}
                <div className="rounded-lg border border-[#F59E0B]/40 bg-[#1F2937] p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#F59E0B]">3. DB_Cobertura (Clientes)</span>
                    <span className="text-[11px] font-mono text-[#9CA3AF]">{preview.coberturaCount} filas</span>
                  </div>
                  <div className="text-[11px] text-[#6B7280]">
                    Cols: {preview.recognizedColumns['DB_Cobertura']?.join(', ') || 'Auto-detectadas'}
                  </div>
                  <div className="pt-2 border-t border-[#374151] space-y-1 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-[#9CA3AF]">Meta Cobertura:</span>
                      <span className="font-semibold text-[#F9FAFB]">{formatInteger(preview.totals.coberturaPlanificada)} cli</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#929EAD]">Clientes Reales:</span>
                      <span className="font-bold text-[#F59E0B]">{formatInteger(preview.totals.clientesReales)} cli</span>
                    </div>
                    {preview.totals.cumplimientoCob !== null && (
                      <div className="flex justify-between pt-1 border-t border-[#242C37]/50 text-[11px]">
                        <span className="text-[#929EAD]">Cumpl. Cobertura:</span>
                        <span className={`font-bold ${preview.totals.cumplimientoCob >= 100 ? 'text-[#C5F467]' : 'text-[#FB7185]'}`}>
                          {formatPercent(preview.totals.cumplimientoCob)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* OBLIGATORY OFFICIAL PERIOD SELECTOR & CONSISTENCY VALIDATION */}
            <div className="rounded-lg border border-[#3B82F6]/40 bg-[#111827] p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#374151] pb-3">
                <div>
                  <div className="text-xs text-[#3B82F6] font-semibold uppercase tracking-wider">
                    Paso Obligatorio: Asignación de Período Oficial
                  </div>
                  <h4 className="text-xs font-semibold text-[#F9FAFB]">
                    Seleccione el Mes y Año que clasificarán los registros de este archivo
                  </h4>
                </div>
                <div className="text-xs font-semibold px-2.5 py-1 rounded-md border border-[#3B82F6]/40 bg-[#3B82F6]/10 text-[#3B82F6]">
                  Período Oficial: {formatPeriodDisplay(officialPeriod)} ({officialPeriod})
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#9CA3AF] mb-1">
                    Mes de Referencia Comercial:
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="h-9 w-full rounded-md border border-[#374151] bg-[#1F2937] px-3 text-xs font-medium text-[#F9FAFB] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] focus:outline-hidden"
                  >
                    {MONTH_OPTIONS.map(m => (
                      <option key={m.code} value={m.code}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#9CA3AF] mb-1">
                    Año Calendario:
                  </label>
                  <select
                    value={selectedYear}
                    onChange={e => setSelectedYear(e.target.value)}
                    className="h-9 w-full rounded-md border border-[#374151] bg-[#1F2937] px-3 text-xs font-medium text-[#F9FAFB] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] focus:outline-hidden"
                  >
                    {YEAR_OPTIONS.map(y => (
                      <option key={y} value={y}>
                        Año {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Warning if internal file dates differ from the assigned period */}
              {periodMismatchWarning && (
                <div className="rounded-md border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-3 text-xs text-[#F59E0B] flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Advertencia de Asignación Manual Prevaleciente:</span>
                    <p className="text-[11px] mt-0.5 leading-normal text-slate-200">
                      El archivo contiene referencias a fechas de <strong>{preview.periodos.join(', ')}</strong>. Conforme a las reglas de control, <strong>prevalecerá el período asignado manualmente: {formatPeriodDisplay(officialPeriod)} ({officialPeriod})</strong>, el cual clasificará todos los registros importados en el dashboard y el histórico.
                    </p>
                  </div>
                </div>
              )}

              {/* Status of prior data for this period */}
              {hasExistingData ? (
                <div className="rounded-md border border-[#EF4444]/40 bg-[#EF4444]/10 p-3 text-xs text-[#EF4444]">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Datos Preexistentes Detectados para {formatPeriodDisplay(officialPeriod)}:</span>
                  </div>
                  <p className="text-slate-200 text-[11px] leading-normal">
                    Ya existen registros cargados para este período en la base de datos: <strong>{existingVentas}</strong> ventas, <strong>{existingObjetivos}</strong> objetivos y <strong>{existingCobertura}</strong> registros de cobertura.
                  </p>
                  <div className="mt-2 text-[11px] text-[#EF4444]">
                    • <strong>Modalidad A</strong>: Actualizará las filas coincidentes sin borrar el resto.<br />
                    • <strong>Modalidad B</strong>: Reemplazará completamente los registros de este período en las fuentes que elija.
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-[#14B8A6]/30 bg-[#1F2937] p-3 text-xs text-[#14B8A6] flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Nuevo período para la serie histórica: No se registran datos previos para {formatPeriodDisplay(officialPeriod)}.</span>
                </div>
              )}

              {/* Status check for objetivos/presupuestos */}
              {preview.objetivosCount > 0 ? (
                <div className="rounded-md border border-[#14B8A6]/30 bg-[#1F2937] p-3 text-xs text-[#14B8A6] flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#14B8A6]" />
                  <div>
                    <span className="font-semibold">Presupuestos y Metas Listos ({preview.objetivosCount} cuotas en el archivo):</span>
                    <p className="text-slate-200 text-[11px] mt-0.5">
                      El archivo incluye correctamente sus presupuestos de facturación y toneladas para {formatPeriodDisplay(officialPeriod)}. Al hacer clic en <strong>«Ejecutar Importación Atómica»</strong> abajo, se guardarán en la base de datos y se calcularán los porcentajes de cumplimiento en el Dashboard.
                    </p>
                  </div>
                </div>
              ) : existingObjetivos === 0 ? (
                <div className="rounded-md border border-[#F59E0B]/40 bg-[#F59E0B]/10 p-3 text-xs text-[#F59E0B] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-[#F59E0B]" />
                    <div>
                      <span className="font-semibold">Sin Presupuestos Registrados para {formatPeriodDisplay(officialPeriod)}:</span>
                      <p className="text-slate-200 text-[11px] mt-0.5">
                        El archivo cargado no contiene la hoja o columnas de objetivos/presupuestos, y este período aún no cuenta con cuotas en la base de datos.
                      </p>
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={handleRestoreObjetivos}
                      className="shrink-0 px-3 py-1.5 text-xs font-semibold rounded-md border border-[#F59E0B] bg-[#F59E0B]/20 text-[#F59E0B] hover:bg-[#F59E0B]/30 transition-colors"
                    >
                      Cargar Presupuestos Oficiales Base (1.044 registros)
                    </button>
                  )}
                </div>
              ) : null}
            </div>

            {/* MODALITY SELECTION */}
            <div className="rounded-lg border border-[#374151] bg-[#111827] p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-3">
                Seleccione la Modalidad de Importación:
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Option A: Append */}
                <label
                  className={`flex flex-col justify-between rounded-lg border p-4 cursor-pointer transition-all ${
                    operationType === 'append'
                      ? 'border-[#3B82F6] bg-[#1F2937] ring-1 ring-[#3B82F6]'
                      : 'border-[#374151] bg-[#1F2937]/50 hover:border-[#4B5563]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#F9FAFB]">
                        Modalidad A: Inserción / Actualización Incremental
                      </span>
                      <input
                        type="radio"
                        name="opType"
                        checked={operationType === 'append'}
                        onChange={() => setOperationType('append')}
                        className="h-4 w-4 accent-[#3B82F6]"
                      />
                    </div>
                    <p className="mt-2 text-[11px] text-[#9CA3AF] leading-relaxed">
                      Incorpora los registros asignándolos al período <strong>{formatPeriodDisplay(officialPeriod)}</strong>. Si ya existen filas con la misma clave única (período + ruta + vendedor + producto), actualiza los valores sin replicar registros. Mantiene intactos todos los demás meses.
                    </p>
                  </div>
                  <div className="mt-3 text-[11px] font-medium text-[#14B8A6]">
                    ✓ Idempotente y seguro para cargas acumulativas
                  </div>
                </label>

                {/* Option B: Replace */}
                <label
                  className={`flex flex-col justify-between rounded-lg border p-4 cursor-pointer transition-all ${
                    operationType === 'replace'
                      ? 'border-[#EF4444] bg-[#1F2937] ring-1 ring-[#EF4444]'
                      : 'border-[#374151] bg-[#1F2937]/50 hover:border-[#4B5563]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#F9FAFB]">
                        Modalidad B: Reemplazo Atómico del Período
                      </span>
                      <input
                        type="radio"
                        name="opType"
                        checked={operationType === 'replace'}
                        onChange={() => setOperationType('replace')}
                        className="h-4 w-4 accent-[#EF4444]"
                      />
                    </div>
                    <p className="mt-2 text-[11px] text-[#9CA3AF] leading-relaxed">
                      Elimina previamente y de forma atómica los datos preexistentes del período <strong>{formatPeriodDisplay(officialPeriod)}</strong> en las fuentes seleccionadas, e inserta las nuevas filas. Todos los demás meses permanecen completamente inalterados.
                    </p>
                  </div>
                  <div className="mt-3 text-[11px] font-medium text-[#EF4444]">
                    ⚠ Requiere confirmación explícita antes de ejecutar
                  </div>
                </label>
              </div>

              {/* Replace Mode Extra Options */}
              {operationType === 'replace' && (
                <div className="mt-4 rounded-lg border border-[#EF4444]/30 bg-[#1F2937] p-3.5 space-y-3">
                  <div className="text-xs font-semibold text-[#EF4444]">
                    Configuración del Reemplazo Atómico para: {formatPeriodDisplay(officialPeriod)} ({officialPeriod})
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">
                      Fuentes a reemplazar en {formatPeriodDisplay(officialPeriod)}:
                    </label>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#F9FAFB]">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sourcesToReplace.ventas}
                          onChange={e =>
                            setSourcesToReplace({ ...sourcesToReplace, ventas: e.target.checked })
                          }
                          className="h-4 w-4 accent-[#3B82F6]"
                        />
                        <span>Ventas ({preview.ventasCount} filas nuevas)</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sourcesToReplace.objetivos}
                          onChange={e =>
                            setSourcesToReplace({
                              ...sourcesToReplace,
                              objetivos: e.target.checked
                            })
                          }
                          className="h-4 w-4 accent-[#3B82F6]"
                        />
                        <span>Objetivos ({preview.objetivosCount} filas nuevas)</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sourcesToReplace.cobertura}
                          onChange={e =>
                            setSourcesToReplace({
                              ...sourcesToReplace,
                              cobertura: e.target.checked
                            })
                          }
                          className="h-4 w-4 accent-[#3B82F6]"
                        />
                        <span>Cobertura ({preview.coberturaCount} filas nuevas)</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm & Execute Button */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#374151]">
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setPreview(null);
                }}
                className="px-3.5 py-2 text-xs font-medium rounded-md text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#111827] transition-colors"
              >
                Cancelar
              </button>

              <button
                onClick={() => {
                  if (operationType === 'replace') {
                    setShowConfirmModal(true);
                  } else {
                    handleExecuteImport();
                  }
                }}
                disabled={!isAdmin}
                className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold shadow-xs transition-colors ${
                  operationType === 'replace'
                    ? 'bg-[#EF4444] text-white hover:bg-red-600'
                    : 'bg-[#3B82F6] text-white hover:bg-[#2563EB]'
                }`}
              >
                <ArrowRight className="h-4 w-4" />
                {operationType === 'replace'
                  ? 'Confirmar y Reemplazar Período'
                  : 'Ejecutar Importación Atómica'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL FOR REPLACE OPERATION */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg border border-[#EF4444]/40 bg-[#1F2937] p-6 text-xs shadow-2xl">
            <div className="flex items-center gap-3 text-[#EF4444] mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#F9FAFB]">
                  ¿Confirmar reemplazo de datos comerciales?
                </h3>
                <span className="text-xs text-[#EF4444]">
                  Operación destructiva para el período seleccionado
                </span>
              </div>
            </div>

            <p className="text-[#9CA3AF] leading-relaxed">
              Está a punto de <strong>reemplazar permanentemente</strong> los registros del período{' '}
              <strong className="text-[#F9FAFB]">{formatPeriodDisplay(officialPeriod)} ({officialPeriod})</strong> en las fuentes seleccionadas:
            </p>

            <ul className="mt-2 space-y-1 text-slate-300 list-disc list-inside">
              {sourcesToReplace.ventas && <li>Se eliminarán las ventas previas de {formatPeriodDisplay(officialPeriod)} y se insertarán {preview?.ventasCount} filas nuevas.</li>}
              {sourcesToReplace.objetivos && <li>Se eliminarán los objetivos previos de {formatPeriodDisplay(officialPeriod)} y se insertarán {preview?.objetivosCount} filas nuevas.</li>}
              {sourcesToReplace.cobertura && <li>Se eliminará la cobertura previa de {formatPeriodDisplay(officialPeriod)} y se insertarán {preview?.coberturaCount} filas nuevas.</li>}
            </ul>

            <div className="mt-3 rounded-md border border-[#374151] bg-[#111827] p-2.5 text-[11px] text-[#9CA3AF]">
              ✓ Los demás meses y fuentes no seleccionadas permanecerán intactos en la base de datos.
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-3.5 py-1.5 rounded-md text-xs font-medium text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#111827] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecuteImport}
                className="rounded-md bg-[#EF4444] px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 transition-colors shadow-xs"
              >
                Sí, Reemplazar Período
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL FOR CLEARING TEST DATA */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg border border-[#EF4444]/40 bg-[#1F2937] p-6 text-xs shadow-2xl">
            <div className="flex items-center gap-3 text-[#EF4444] mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#F9FAFB]">
                  ¿Eliminar los datos de prueba del Dashboard?
                </h3>
                <span className="text-xs text-[#EF4444]">
                  Dejará el sistema en blanco listo para sus datos reales
                </span>
              </div>
            </div>

            <p className="text-[#9CA3AF] leading-relaxed">
              Esta acción eliminará todos los registros de prueba cargados actualmente ({dbState.ventas.length} ventas, {dbState.objetivos.length} objetivos, {dbState.cobertura.length} coberturas).
            </p>

            <div className="mt-3 rounded-md border border-[#374151] bg-[#111827] p-3 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-[#F9FAFB]">
                <input
                  type="checkbox"
                  checked={clearSupabaseToo}
                  onChange={e => setClearSupabaseToo(e.target.checked)}
                  className="h-4 w-4 accent-[#EF4444]"
                />
                <span className="font-semibold">Eliminar también los registros en Supabase</span>
              </label>
              <p className="text-[11px] text-[#9CA3AF] pl-6">
                Vacía las tablas remotas de Supabase (com_ventas, com_objetivos, com_cobertura) para que queden totalmente limpias y listas para producción.
              </p>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowClearConfirmModal(false)}
                disabled={isClearing}
                className="px-3.5 py-1.5 rounded-md text-xs font-medium text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#111827] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmClearAll}
                disabled={isClearing}
                className="inline-flex items-center gap-2 rounded-md bg-[#EF4444] px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50 shadow-xs"
              >
                {isClearing ? (
                  <>
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Vaciando base de datos...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    Sí, Vaciar Base de Datos
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
