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
  resetDatabaseState
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

  // Replace mode selections
  const [targetPeriodToReplace, setTargetPeriodToReplace] = useState<string>('sept-26');
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
  const [executionResult, setExecutionResult] = useState<{
    success: boolean;
    message: string;
    stats?: Record<string, number>;
  } | null>(null);

  const isAdmin = userRole === 'admin';

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
      if (parsedPreview.periodos.length > 0) {
        setTargetPeriodToReplace(parsedPreview.periodos[0]);
      }
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
      if (parsedPreview.periodos.length > 0) {
        setTargetPeriodToReplace(parsedPreview.periodos[0]);
      }
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
            periodos: preview.periodos
          },
          preview.objetivosData,
          preview.ventasData,
          preview.coberturaData
        );

        onUpdateDbState(result.updatedState);
        setExecutionResult({
          success: true,
          message: `Importación incremental ejecutada con éxito. Idempotencia asegurada: registros duplicados actualizados sin replicar filas.`,
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
          targetPeriodToReplace,
          fuentesArr,
          preview.filename,
          preview.objetivosData,
          preview.ventasData,
          preview.coberturaData
        );

        onUpdateDbState(result.updatedState);
        setExecutionResult({
          success: true,
          message: `Reemplazo atómico completado para el período '${targetPeriodToReplace}'. Se eliminaron los datos previos seleccionados y se insertaron los nuevos. Los demás meses permanecen intactos.`,
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

  // Reset database back to baseline
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
    <div className="space-y-6">
      {/* RBAC Notice if Consulta Role */}
      {!isAdmin && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2 font-bold mb-1">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            Acceso en Modo Consulta (Solo Lectura)
          </div>
          <p>
            Su rol actual no posee privilegios de escritura para importar o reemplazar datos comerciales. Puede cambiar su rol a <strong>Administrador</strong> desde el panel lateral izquierdo para probar las operaciones de carga.
          </p>
        </div>
      )}

      {/* Main Container */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Upload className="h-5 w-5 text-slate-700" />
              Gestión de Datos & Importación Mensual
            </h2>
            <p className="text-xs text-slate-500">
              Procesamiento de archivos Excel (.xlsx, .xls) con las 3 hojas (DB_Objetivos, DB_Cobertura, DB_Ventas) o archivos CSV normalizados.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={generateSampleExcelTemplate}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              title="Descargar archivo Excel con las 3 hojas preformateadas"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              Descargar Plantilla Excel (.xlsx)
            </button>

            {isAdmin && (
              <button
                onClick={handleResetData}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
                title="Restablecer datos originales"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Restablecer Iniciales
              </button>
            )}
          </div>
        </div>

        {/* Upload Zone */}
        <div className="mt-5">
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-6 text-center hover:bg-slate-50 transition-colors">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600 mb-3">
              <FileSpreadsheet className="h-6 w-6" />
            </div>

            <div className="text-sm font-semibold text-slate-900">
              Seleccione el archivo mensual de objetivos, ventas y cobertura
            </div>
            <p className="mt-1 text-xs text-slate-500 max-w-md">
              Soporta archivos Excel (.xlsx, .xls) con hojas <strong>DB_Objetivos</strong>, <strong>DB_Cobertura</strong> y <strong>DB_Ventas</strong>, o CSVs normalizados.
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
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold shadow-xs transition-colors ${
                    isAdmin
                      ? 'bg-slate-900 text-white hover:bg-slate-800'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Upload className="h-4 w-4" />
                  Examinar Archivo Local
                </span>
              </label>

              <button
                onClick={handleLoadBuiltinCsv}
                disabled={!isAdmin}
                className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold shadow-2xs transition-colors ${
                  isAdmin
                    ? 'text-slate-700 hover:bg-slate-100'
                    : 'text-slate-400 cursor-not-allowed'
                }`}
              >
                <FileText className="h-4 w-4 text-emerald-600" />
                Cargar sep_26_normalizada.csv
              </button>
            </div>

            {isParsing && (
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                Analizando estructura y normalizando datos con SheetJS...
              </div>
            )}
          </div>
        </div>

        {/* Execution Result Notification */}
        {executionResult && (
          <div
            className={`mt-4 rounded-xl border p-4 text-xs ${
              executionResult.success
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-rose-200 bg-rose-50 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-1">
              {executionResult.success ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-rose-600" />
              )}
              {executionResult.success ? 'Operación Exitosa' : 'Aviso en la Operación'}
            </div>
            <p>{executionResult.message}</p>
            <div className="mt-2 pt-2 border-t border-emerald-200/40 flex items-center justify-between">
              <span className="font-medium">Registrado en la auditoría del sistema.</span>
              <button
                onClick={onSwitchToAudit}
                className="font-bold underline hover:text-emerald-950"
              >
                Ver registro en Auditoría →
              </button>
            </div>
          </div>
        )}

        {/* PREVIEW & MODALITY SELECTION */}
        {preview && (
          <div className="mt-6 space-y-5 border-t border-slate-200 pt-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Vista Previa y Validación de Carga: {preview.filename}
              </h3>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded ${
                  preview.isValid
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {preview.isValid ? 'Estructura Validada' : 'Estructura Inválida'}
              </span>
            </div>

            {/* Validation Checklist Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-[10px] font-semibold text-slate-500 uppercase">Hojas Detectadas</div>
                <div className="mt-1 text-xs font-bold text-slate-900">
                  {preview.detectedSheets.length > 0 ? preview.detectedSheets.join(', ') : 'Ninguna'}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-[10px] font-semibold text-slate-500 uppercase">Períodos Afectados</div>
                <div className="mt-1 text-xs font-bold text-slate-900 font-mono">
                  {preview.periodos.length > 0 ? preview.periodos.join(', ') : 'No detectado'}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-[10px] font-semibold text-slate-500 uppercase">Filas Identificadas</div>
                <div className="mt-1 text-xs text-slate-700">
                  <strong>{preview.ventasCount}</strong> ventas · <strong>{preview.objetivosCount}</strong> obj · <strong>{preview.coberturaCount}</strong> cob
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-[10px] font-semibold text-slate-500 uppercase">Advertencias</div>
                <div className="mt-1 text-xs font-bold text-slate-900">
                  {preview.issues.length} observaciones
                </div>
              </div>
            </div>

            {/* Issues Log */}
            {preview.issues.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 space-y-1 text-xs text-amber-900">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                  Observaciones de validación:
                </div>
                {preview.issues.map((iss, i) => (
                  <div key={i} className="text-[11px]">
                    · [{iss.hoja}] {iss.fila ? `Fila ${iss.fila}: ` : ''}{iss.mensaje}
                  </div>
                ))}
              </div>
            )}

            {/* MODALITY SELECTION */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Seleccione la Modalidad de Importación:
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Option A: Append */}
                <label
                  className={`flex flex-col justify-between rounded-lg border p-4 cursor-pointer transition-all ${
                    operationType === 'append'
                      ? 'border-slate-900 bg-white ring-1 ring-slate-900 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        Modalidad A: Agregar nuevos períodos / registros
                      </span>
                      <input
                        type="radio"
                        name="opType"
                        checked={operationType === 'append'}
                        onChange={() => setOperationType('append')}
                        className="h-4 w-4 text-slate-900"
                      />
                    </div>
                    <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
                      Inserta nuevos meses manteniendo intactos los períodos existentes. Detecta registros ya importados mediante clave única y previene duplicados.
                    </p>
                  </div>
                  <div className="mt-3 text-[10px] font-semibold text-emerald-700">
                    ✓ Idempotente y seguro para cargas acumulativas
                  </div>
                </label>

                {/* Option B: Replace */}
                <label
                  className={`flex flex-col justify-between rounded-lg border p-4 cursor-pointer transition-all ${
                    operationType === 'replace'
                      ? 'border-rose-700 bg-white ring-1 ring-rose-700 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        Modalidad B: Reemplazar un período existente
                      </span>
                      <input
                        type="radio"
                        name="opType"
                        checked={operationType === 'replace'}
                        onChange={() => setOperationType('replace')}
                        className="h-4 w-4 text-rose-700"
                      />
                    </div>
                    <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
                      Reemplaza exclusivamente los datos del período seleccionado en las fuentes elegidas. Los demás meses y fuentes permanecen intactos.
                    </p>
                  </div>
                  <div className="mt-3 text-[10px] font-semibold text-rose-700">
                    ⚠ Requiere confirmación explícita antes de ejecutar
                  </div>
                </label>
              </div>

              {/* Replace Mode Extra Options */}
              {operationType === 'replace' && (
                <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50/50 p-3 space-y-3">
                  <div className="text-xs font-bold text-rose-950">
                    Configuración del Reemplazo Atómico:
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Período que será reemplazado:
                      </label>
                      <select
                        value={targetPeriodToReplace}
                        onChange={e => setTargetPeriodToReplace(e.target.value)}
                        className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs font-bold text-slate-900"
                      >
                        {Array.from(
                          new Set([
                            ...preview.periodos,
                            ...dbState.ventas.map((v: VentaRecord) => v.periodo_mes)
                          ])
                        ).map(p => (
                          <option key={p} value={p}>
                            {formatPeriodDisplay(p)} ({p})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Fuentes a reemplazar:
                      </label>
                      <div className="flex items-center gap-3 text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sourcesToReplace.ventas}
                            onChange={e =>
                              setSourcesToReplace({ ...sourcesToReplace, ventas: e.target.checked })
                            }
                          />
                          <span>Ventas</span>
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
                          />
                          <span>Objetivos</span>
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
                          />
                          <span>Cobertura</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm & Execute Button */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setPreview(null);
                }}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
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
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors ${
                  operationType === 'replace'
                    ? 'bg-rose-700 hover:bg-rose-800'
                    : 'bg-slate-900 hover:bg-slate-800'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-center gap-3 text-rose-700 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  ¿Confirmar reemplazo de datos comerciales?
                </h3>
                <span className="text-xs text-rose-700 font-semibold">
                  Operación destructiva para el período seleccionado
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Está a punto de <strong>reemplazar permanentemente</strong> los registros del período{' '}
              <strong>{formatPeriodDisplay(targetPeriodToReplace)} ({targetPeriodToReplace})</strong> en las fuentes seleccionadas:
            </p>

            <ul className="mt-2 space-y-1 text-xs text-slate-700 list-disc list-inside">
              {sourcesToReplace.ventas && <li>Se eliminarán las ventas previas de {targetPeriodToReplace} y se insertarán las nuevas.</li>}
              {sourcesToReplace.objetivos && <li>Se eliminarán los objetivos previos de {targetPeriodToReplace} y se insertarán los nuevos.</li>}
              {sourcesToReplace.cobertura && <li>Se eliminará la cobertura previa de {targetPeriodToReplace} y se insertará la nueva.</li>}
            </ul>

            <div className="mt-3 rounded-lg bg-slate-50 p-2.5 text-[11px] text-slate-500">
              ✓ Los demás meses y fuentes no seleccionadas permanecerán intactos en la base de datos.
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecuteImport}
                className="rounded-lg bg-rose-700 px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-800 transition-colors"
              >
                Sí, Reemplazar Período
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
