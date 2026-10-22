import React, { useState } from 'react';
import { AuditLog, ImportBatch } from '../types/commercial';
import { History, Shield, CheckCircle2, AlertCircle, Clock, Search, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface AuditLogViewProps {
  batches: ImportBatch[];
  auditLogs: AuditLog[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ batches, auditLogs }) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'batches'>('batches');
  const [search, setSearch] = useState('');

  const filteredBatches = batches.filter(b => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.filename.toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q) ||
      b.created_by.toLowerCase().includes(q) ||
      b.periodos_detectados.some(p => p.toLowerCase().includes(q))
    );
  });

  const filteredAudit = auditLogs.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.details.toLowerCase().includes(q) ||
      a.user_email.toLowerCase().includes(q) ||
      a.action.toLowerCase().includes(q)
    );
  });

  const exportAudit = () => {
    const wsBatches = XLSX.utils.json_to_sheet(
      batches.map(b => ({
        'Batch ID': b.id,
        Archivo: b.filename,
        Períodos: b.periodos_detectados.join(', '),
        Operación: b.tipo_operacion,
        'Registros Ventas': b.registros_ventas,
        'Registros Objetivos': b.registros_objetivos,
        'Registros Cobertura': b.registros_cobertura,
        Estado: b.status,
        Usuario: b.created_by,
        Fecha: b.created_at,
        'Duración (ms)': b.duration_ms,
        Notas: b.notas || ''
      }))
    );

    const wsAudit = XLSX.utils.json_to_sheet(
      auditLogs.map(a => ({
        'Audit ID': a.id,
        'Batch ID': a.batch_id || '',
        Acción: a.action,
        Detalle: a.details,
        Usuario: a.user_email,
        Rol: a.user_role,
        Período: a.periodo_afectado || '',
        Fecha: a.created_at
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsBatches, 'Lotes_Importacion');
    XLSX.utils.book_append_sheet(wb, wsAudit, 'Registros_Auditoria');
    XLSX.writeFile(wb, `Auditoria_Comercial_${Date.now()}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <History className="h-5 w-5 text-slate-700" />
            Auditoría de Cargas & Trazabilidad
          </h2>
          <p className="text-xs text-slate-500">
            Registro inmutable de lotes de importación, operaciones atómicas, timestamps y usuarios responsables.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportAudit}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            Exportar Auditoría (.xlsx)
          </button>
        </div>
      </div>

      {/* Switcher & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setActiveTab('batches')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'batches'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lotes de Carga ({batches.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'audit'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bitácora de Acciones ({auditLogs.length})
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar en auditoría..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-8 w-60 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        {activeTab === 'batches' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase">
                  <th className="py-2.5 px-3">Batch ID / Archivo</th>
                  <th className="py-2.5 px-3">Modalidad</th>
                  <th className="py-2.5 px-3">Períodos</th>
                  <th className="py-2.5 px-3 text-right">Filas Procesadas</th>
                  <th className="py-2.5 px-3">Usuario Responsable</th>
                  <th className="py-2.5 px-3">Duración</th>
                  <th className="py-2.5 px-3">Fecha y Hora</th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBatches.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50 font-medium">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{b.filename}</div>
                      <div className="text-[10px] font-mono text-slate-400">{b.id}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded capitalize ${
                          b.tipo_operacion === 'append'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {b.tipo_operacion}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">
                      {b.periodos_detectados.join(', ')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[11px]">
                      <div>{b.registros_ventas} ventas</div>
                      <div className="text-[10px] text-slate-400">
                        {b.registros_objetivos} obj · {b.registros_cobertura} cob
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{b.created_by}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{b.duration_ms} ms</td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                      {new Date(b.created_at).toLocaleString('es-PY')}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Completado
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase">
                  <th className="py-2.5 px-3">Fecha y Hora</th>
                  <th className="py-2.5 px-3">Acción</th>
                  <th className="py-2.5 px-3">Detalle de Operación</th>
                  <th className="py-2.5 px-3">Usuario</th>
                  <th className="py-2.5 px-3">Rol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAudit.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 font-medium">
                    <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500 whitespace-nowrap">
                      {new Date(a.created_at).toLocaleString('es-PY')}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                        {a.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 text-[11px] leading-relaxed">
                      {a.details}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">{a.user_email}</td>
                    <td className="py-2.5 px-3 capitalize">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          a.user_role === 'admin'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {a.user_role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
