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
  formatPeriodDisplay
} from '../services/dataNormalizer';
import {
  executeAppendImport,
  executeReplacePeriodImport,
  resetDatabaseState,
  clearAllCommercialData
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
  onSwitchToAudit
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

  // Replace mode selections
  const [sourcesToReplace, setSourcesToReplace] = useState<{
    ventas: boolean;
    objetivos: boolean;
    cobertura: boolean;
  }>({
    ventas: true,
    objetivos: true,
    cobertura: true
  });

  // Modal / Confirm state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [clearSupabaseToo, setClearSupabaseToo] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [executionResult, setExecutionResult] = useState<{
    success: boolean;
    message: string;
    stats?: Record<string, number>;
  } | null>(null);

  const isAdmin = userRole === 'admin';

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
      const parsedPreview = await parseExcelOrCsvFile(file);
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
      const parsedPreview = await parseExcelOrCsvFile(file);
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
          message: `Importación incremental ejecutada con éxito para el período oficial ${formatPeriodDisplay(officialPeriod)} (${officialPeriod}). Idempotencia asegurada: registros duplicados actualizados sin replicar filas.`,
          stats: result.stats
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
          message: `Reemplazo atómico completado para el período oficial ${formatPeriodDisplay(officialPeriod)} (${officialPeriod}). Se eliminaron los datos previos seleccionados y se insertaron los nuevos. Los demás meses permanecen intactos.`,
          stats: result.deletedCounts
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
    <div className="space-y-6 font-mono text-xs">
      {/* RBAC Notice if Consulta Role */}
      {!isAdmin && (
        <div className="border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-4 text-[#F59E0B]">
          <div className="flex items-center gap-2 font-bold mb-1">
            <ShieldAlert className="h-4 w-4" />
            Acceso en Modo Consulta (Solo Lectura)
          </div>
          <p>
            Su rol actual no posee privilegios de escritura para importar o reemplazar datos comerciales. Puede cambiar su rol a <strong>Administrador</strong> desde el panel lateral izquierdo para probar las operaciones de carga.
          </p>
        </div>
      )}

      {/* Main Container */}
      <div className="border border-[#242C37] bg-[#12161C] p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[#242C37]">
          <div>
            <div className="flex items-center gap-2 text-[10px] text-[#626D7C] uppercase tracking-wider">
              <span>INGESTA DE DATOS Y GESTIÓN DE LOTES</span>
              <span>/</span>
              <span className="text-[#C5F467] font-bold">OPERACIONES ATÓMICAS</span>
            </div>
            <h2 className="mt-1 text-base font-bold text-[#F1F5F9]">
              Gestión de Datos Mensuales & Reemplazo Idempotente
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={generateSampleExcelTemplate}
              className="inline-flex items-center gap-1.5 border border-[#242C37] bg-[#0B0D10] px-3 py-1.5 text-xs text-[#929EAD] hover:text-[#F1F5F9] transition-colors"
              title="Descargar libro Excel con las 3 hojas preformateadas"
            >
              <Download className="h-3.5 w-3.5 text-[#626D7C]" />
              Descargar Plantilla Excel (.xlsx)
            </button>

            {isAdmin && (
              <>
                <button
                  onClick={() => setShowClearConfirmModal(true)}
                  className="inline-flex items-center gap-1.5 border border-[#FB7185]/40 bg-[#FB7185]/10 px-3 py-1.5 text-xs font-semibold text-[#FB7185] hover:bg-[#FB7185]/20 transition-colors"
                  title="Eliminar todos los datos de prueba y dejar la base en blanco"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Vaciar Datos de Prueba
                </button>

                <button
                  onClick={handleResetData}
                  className="inline-flex items-center gap-1.5 border border-[#242C37] bg-[#0B0D10] px-3 py-1.5 text-xs text-[#929EAD] hover:text-[#F1F5F9] transition-colors"
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
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#242C37] bg-[#0B0D10]/50 p-6 text-center hover:bg-[#0B0D10] transition-colors">
            <div className="flex h-12 w-12 items-center justify-center border border-[#242C37] bg-[#12161C] text-[#C5F467] mb-3">
              <FileSpreadsheet className="h-6 w-6" />
            </div>

            <div className="text-sm font-bold text-[#F1F5F9]">
              Seleccione el archivo mensual de objetivos, ventas y cobertura
            </div>
            <p className="mt-1 text-xs text-[#929EAD] max-w-md font-sans">
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
                  className={`inline-flex items-center gap-2 border px-4 py-2 text-xs font-bold transition-colors ${
                    isAdmin
                      ? 'border-[#C5F467]/50 bg-[#C5F467] text-[#0B0D10] hover:bg-[#b8eb58]'
                      : 'border-[#242C37] bg-[#191F27] text-[#626D7C] cursor-not-allowed'
                  }`}
                >
                  <Upload className="h-4 w-4" />
                  Examinar Archivo Local
                </span>
              </label>

              <button
                onClick={handleLoadBuiltinCsv}
                disabled={!isAdmin}
                className={`inline-flex items-center gap-1.5 border border-[#242C37] bg-[#12161C] px-3 py-2 text-xs font-semibold transition-colors ${
                  isAdmin
                    ? 'text-[#F1F5F9] hover:border-[#333D4D]'
                    : 'text-[#626D7C] cursor-not-allowed'
                }`}
              >
                <FileText className="h-4 w-4 text-[#38BDF8]" />
                Cargar sep_26_normalizada.csv
              </button>
            </div>

            {isParsing && (
              <div className="mt-3 flex items-center gap-2 text-xs text-[#929EAD]">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#C5F467] border-t-transparent" />
                Analizando estructura y normalizando datos con SheetJS...
              </div>
            )}
          </div>
        </div>

        {/* Execution Result Notification */}
        {executionResult && (
          <div
            className={`mt-4 border p-4 text-xs ${
              executionResult.success
                ? 'border-[#C5F467]/40 bg-[#C5F467]/10 text-[#C5F467]'
                : 'border-[#FB7185]/40 bg-[#FB7185]/10 text-[#FB7185]'
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-1">
              {executionResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              {executionResult.success ? 'Operación Exitosa' : 'Aviso en la Operación'}
            </div>
            <p className="font-sans text-slate-200">{executionResult.message}</p>
            <div className="mt-2 pt-2 border-t border-[#242C37] flex items-center justify-between">
              <span className="text-[#929EAD]">Transacción inmutable registrada en auditoría.</span>
              <button
                onClick={onSwitchToAudit}
                className="font-bold underline text-[#C5F467]"
              >
                Ver registro en Auditoría →
              </button>
            </div>
          </div>
        )}

        {/* PREVIEW & MODALITY SELECTION */}
        {preview && (
          <div className="mt-6 space-y-5 border-t border-[#242C37] pt-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#F1F5F9]">
                Vista Previa de Carga: {preview.filename}
              </h3>
              <span
                className={`text-xs font-bold px-2 py-0.5 border ${
                  preview.isValid
                    ? 'border-[#C5F467]/40 bg-[#C5F467]/10 text-[#C5F467]'
                    : 'border-[#FB7185]/40 bg-[#FB7185]/10 text-[#FB7185]'
                }`}
              >
                {preview.isValid ? 'Estructura Validada' : 'Estructura Inválida'}
              </span>
            </div>

            {/* Validation Checklist Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="border border-[#242C37] bg-[#0B0D10] p-3">
                <div className="text-[10px] text-[#626D7C] uppercase">Hojas Detectadas</div>
                <div className="mt-1 text-xs font-bold text-[#F1F5F9]">
                  {preview.detectedSheets.length > 0 ? preview.detectedSheets.join(', ') : 'Ninguna'}
                </div>
              </div>

              <div className="border border-[#242C37] bg-[#0B0D10] p-3">
                <div className="text-[10px] text-[#626D7C] uppercase">Períodos Identificados</div>
                <div className="mt-1 text-xs font-bold text-[#C5F467]">
                  {preview.periodos.length > 0 ? preview.periodos.join(', ') : 'No detectado'}
                </div>
              </div>

              <div className="border border-[#242C37] bg-[#0B0D10] p-3">
                <div className="text-[10px] text-[#626D7C] uppercase">Filas Identificadas</div>
                <div className="mt-1 text-xs text-[#F1F5F9]">
                  {preview.ventasCount} ventas · {preview.objetivosCount} obj · {preview.coberturaCount} cob
                </div>
              </div>

              <div className="border border-[#242C37] bg-[#0B0D10] p-3">
                <div className="text-[10px] text-[#626D7C] uppercase">Advertencias</div>
                <div className="mt-1 text-xs font-bold text-[#F1F5F9]">
                  {preview.issues.length} observaciones
                </div>
              </div>
            </div>

            {/* Issues Log */}
            {preview.issues.length > 0 && (
              <div className="border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-3 space-y-1 text-xs text-[#F59E0B]">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Observaciones de validación:
                </div>
                {preview.issues.map((iss, i) => (
                  <div key={i} className="text-[11px] font-sans">
                    · [{iss.hoja}] {iss.fila ? `Fila ${iss.fila}: ` : ''}{iss.mensaje}
                  </div>
                ))}
              </div>
            )}

            {/* OBLIGATORY OFFICIAL PERIOD SELECTOR & CONSISTENCY VALIDATION */}
            <div className="border border-[#C5F467]/40 bg-[#0B0D10] p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#242C37] pb-3">
                <div>
                  <div className="text-[10px] text-[#C5F467] font-bold uppercase tracking-wider">
                    PASO OBLIGATORIO: ASIGNACIÓN DE PERÍODO OFICIAL
                  </div>
                  <h4 className="text-xs font-bold text-[#F1F5F9]">
                    Seleccione el Mes y Año que clasificarán los registros de este archivo
                  </h4>
                </div>
                <div className="text-xs font-bold px-2.5 py-1 border border-[#C5F467]/40 bg-[#C5F467]/10 text-[#C5F467]">
                  Período Oficial: {formatPeriodDisplay(officialPeriod)} ({officialPeriod})
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-[#626D7C] uppercase mb-1 font-bold">
                    Mes de Referencia Comercial (Obligatorio):
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="h-9 w-full border border-[#242C37] bg-[#12161C] px-3 text-xs font-bold text-[#F1F5F9] focus:border-[#C5F467]"
                  >
                    {MONTH_OPTIONS.map(m => (
                      <option key={m.code} value={m.code}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-[#626D7C] uppercase mb-1 font-bold">
                    Año Calendario (Obligatorio):
                  </label>
                  <select
                    value={selectedYear}
                    onChange={e => setSelectedYear(e.target.value)}
                    className="h-9 w-full border border-[#242C37] bg-[#12161C] px-3 text-xs font-bold text-[#F1F5F9] focus:border-[#C5F467]"
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
                <div className="border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-3 text-xs text-[#F59E0B] flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Advertencia de Asignación Manual Prevaleciente:</span>
                    <p className="font-sans text-[11px] mt-0.5 leading-normal text-slate-200">
                      El archivo contiene referencias a fechas de <strong>{preview.periodos.join(', ')}</strong>. Conforme a las reglas de control, <strong>prevalecerá el período asignado manualmente: {formatPeriodDisplay(officialPeriod)} ({officialPeriod})</strong>, el cual clasificará todos los registros importados en el dashboard y el histórico.
                    </p>
                  </div>
                </div>
              )}

              {/* Status of prior data for this period */}
              {hasExistingData ? (
                <div className="border border-[#FB7185]/40 bg-[#FB7185]/10 p-3 text-xs text-[#FB7185]">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Datos Preexistentes Detectados para {formatPeriodDisplay(officialPeriod)}:</span>
                  </div>
                  <p className="font-sans text-slate-200 text-[11px] leading-normal">
                    Ya existen registros cargados para este período en la base de datos: <strong>{existingVentas}</strong> ventas, <strong>{existingObjetivos}</strong> objetivos y <strong>{existingCobertura}</strong> registros de cobertura.
                  </p>
                  <div className="mt-2 text-[10px] text-[#FB7185] font-sans">
                    • <strong>Modalidad A</strong>: Actualizará las filas coincidentes sin borrar el resto.<br />
                    • <strong>Modalidad B</strong>: Reemplazará completamente los registros de este período en las fuentes que elija.
                  </div>
                </div>
              ) : (
                <div className="border border-[#C5F467]/30 bg-[#12161C] p-3 text-xs text-[#C5F467] flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Nuevo período para la serie histórica: No se registran datos previos para {formatPeriodDisplay(officialPeriod)}.</span>
                </div>
              )}
            </div>

            {/* MODALITY SELECTION */}
            <div className="border border-[#242C37] bg-[#0B0D10] p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-[#929EAD] mb-3">
                Seleccione la Modalidad de Importación:
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Option A: Append */}
                <label
                  className={`flex flex-col justify-between border p-4 cursor-pointer transition-all ${
                    operationType === 'append'
                      ? 'border-[#C5F467] bg-[#12161C]'
                      : 'border-[#242C37] bg-[#12161C]/50 hover:border-[#333D4D]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#F1F5F9]">
                        Modalidad A: Inserción / Actualización Incremental
                      </span>
                      <input
                        type="radio"
                        name="opType"
                        checked={operationType === 'append'}
                        onChange={() => setOperationType('append')}
                        className="h-4 w-4 accent-[#C5F467]"
                      />
                    </div>
                    <p className="mt-2 text-[11px] text-[#929EAD] font-sans leading-relaxed">
                      Incorpora los registros asignándolos al período <strong>{formatPeriodDisplay(officialPeriod)}</strong>. Si ya existen filas con la misma clave única (período + ruta + vendedor + producto), actualiza los valores sin replicar registros. Mantiene intactos todos los demás meses.
                    </p>
                  </div>
                  <div className="mt-3 text-[10px] font-semibold text-[#C5F467]">
                    ✓ Idempotente y seguro para cargas acumulativas
                  </div>
                </label>

                {/* Option B: Replace */}
                <label
                  className={`flex flex-col justify-between border p-4 cursor-pointer transition-all ${
                    operationType === 'replace'
                      ? 'border-[#FB7185] bg-[#12161C]'
                      : 'border-[#242C37] bg-[#12161C]/50 hover:border-[#333D4D]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#F1F5F9]">
                        Modalidad B: Reemplazo Atómico del Período
                      </span>
                      <input
                        type="radio"
                        name="opType"
                        checked={operationType === 'replace'}
                        onChange={() => setOperationType('replace')}
                        className="h-4 w-4 accent-[#FB7185]"
                      />
                    </div>
                    <p className="mt-2 text-[11px] text-[#929EAD] font-sans leading-relaxed">
                      Elimina previamente y de forma atómica los datos preexistentes del período <strong>{formatPeriodDisplay(officialPeriod)}</strong> en las fuentes seleccionadas, e inserta las nuevas filas. Todos los demás meses permanecen completamente inalterados.
                    </p>
                  </div>
                  <div className="mt-3 text-[10px] font-semibold text-[#FB7185]">
                    ⚠ Requiere confirmación explícita antes de ejecutar
                  </div>
                </label>
              </div>

              {/* Replace Mode Extra Options */}
              {operationType === 'replace' && (
                <div className="mt-4 border border-[#FB7185]/30 bg-[#12161C] p-3 space-y-3">
                  <div className="text-xs font-bold text-[#FB7185]">
                    Configuración del Reemplazo Atómico para: {formatPeriodDisplay(officialPeriod)} ({officialPeriod})
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#626D7C] uppercase mb-1">
                      Fuentes a reemplazar en {formatPeriodDisplay(officialPeriod)}:
                    </label>
                    <div className="flex items-center gap-4 text-xs text-[#F1F5F9]">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sourcesToReplace.ventas}
                          onChange={e =>
                            setSourcesToReplace({ ...sourcesToReplace, ventas: e.target.checked })
                          }
                          className="accent-[#C5F467]"
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
                          className="accent-[#C5F467]"
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
                          className="accent-[#C5F467]"
                        />
                        <span>Cobertura ({preview.coberturaCount} filas nuevas)</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm & Execute Button */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#242C37]">
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setPreview(null);
                }}
                className="px-3 py-1.5 text-xs text-[#929EAD] hover:text-[#F1F5F9]"
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
                className={`inline-flex items-center gap-2 border px-4 py-2 text-xs font-bold transition-colors ${
                  operationType === 'replace'
                    ? 'border-[#FB7185]/50 bg-[#FB7185] text-[#0B0D10] hover:bg-[#f43f5e]'
                    : 'border-[#C5F467]/50 bg-[#C5F467] text-[#0B0D10] hover:bg-[#b8eb58]'
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
          <div className="w-full max-w-md border border-[#FB7185]/50 bg-[#12161C] p-6 text-xs font-mono shadow-2xl">
            <div className="flex items-center gap-3 text-[#FB7185] mb-3">
              <div className="flex h-10 w-10 items-center justify-center border border-[#FB7185]/30 bg-[#FB7185]/10">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#F1F5F9]">
                  ¿Confirmar reemplazo de datos comerciales?
                </h3>
                <span className="text-xs text-[#FB7185]">
                  Operación destructiva para el período seleccionado
                </span>
              </div>
            </div>

            <p className="text-[#929EAD] font-sans leading-relaxed">
              Está a punto de <strong>reemplazar permanentemente</strong> los registros del período{' '}
              <strong className="text-[#F1F5F9]">{formatPeriodDisplay(officialPeriod)} ({officialPeriod})</strong> en las fuentes seleccionadas:
            </p>

            <ul className="mt-2 space-y-1 text-slate-300 list-disc list-inside font-sans">
              {sourcesToReplace.ventas && <li>Se eliminarán las ventas previas de {formatPeriodDisplay(officialPeriod)} y se insertarán {preview?.ventasCount} filas nuevas.</li>}
              {sourcesToReplace.objetivos && <li>Se eliminarán los objetivos previos de {formatPeriodDisplay(officialPeriod)} y se insertarán {preview?.objetivosCount} filas nuevas.</li>}
              {sourcesToReplace.cobertura && <li>Se eliminará la cobertura previa de {formatPeriodDisplay(officialPeriod)} y se insertarán {preview?.coberturaCount} filas nuevas.</li>}
            </ul>

            <div className="mt-3 border border-[#242C37] bg-[#0B0D10] p-2.5 text-[11px] text-[#626D7C]">
              ✓ Los demás meses y fuentes no seleccionadas permanecerán intactos en la base de datos.
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-3 py-1.5 text-xs text-[#929EAD] hover:text-[#F1F5F9]"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecuteImport}
                className="border border-[#FB7185]/50 bg-[#FB7185] px-4 py-1.5 text-xs font-bold text-[#0B0D10] hover:bg-[#f43f5e] transition-colors"
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
          <div className="w-full max-w-md border border-[#FB7185]/50 bg-[#12161C] p-6 text-xs font-mono shadow-2xl">
            <div className="flex items-center gap-3 text-[#FB7185] mb-3">
              <div className="flex h-10 w-10 items-center justify-center border border-[#FB7185]/30 bg-[#FB7185]/10">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#F1F5F9]">
                  ¿Eliminar los datos de prueba del Dashboard?
                </h3>
                <span className="text-xs text-[#FB7185]">
                  Dejará el sistema en blanco listo para sus datos reales
                </span>
              </div>
            </div>

            <p className="text-[#929EAD] font-sans leading-relaxed">
              Esta acción eliminará todos los registros de prueba cargados actualmente ({dbState.ventas.length} ventas, {dbState.objetivos.length} objetivos, {dbState.cobertura.length} coberturas).
            </p>

            <div className="mt-3 border border-[#242C37] bg-[#0B0D10] p-3 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-[#F1F5F9]">
                <input
                  type="checkbox"
                  checked={clearSupabaseToo}
                  onChange={e => setClearSupabaseToo(e.target.checked)}
                  className="h-4 w-4 accent-[#FB7185]"
                />
                <span className="font-bold">Eliminar también los registros en Supabase</span>
              </label>
              <p className="text-[11px] text-[#626D7C] font-sans pl-6">
                Vacía las tablas remotas de Supabase (com_ventas, com_objetivos, com_cobertura) para que queden totalmente limpias y listas para producción.
              </p>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowClearConfirmModal(false)}
                disabled={isClearing}
                className="px-3 py-1.5 text-xs text-[#929EAD] hover:text-[#F1F5F9]"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmClearAll}
                disabled={isClearing}
                className="inline-flex items-center gap-2 border border-[#FB7185]/50 bg-[#FB7185] px-4 py-1.5 text-xs font-bold text-[#0B0D10] hover:bg-[#f43f5e] transition-colors disabled:opacity-50"
              >
                {isClearing ? (
                  <>
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#0B0D10] border-t-transparent" />
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
