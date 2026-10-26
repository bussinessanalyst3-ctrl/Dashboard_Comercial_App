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
      <div className="rounded-lg border border-[#374151] bg-[#1F2937] p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#374151] pb-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
              <span>TRAZABILIDAD Y GOBERNANZA</span>
              <span>/</span>
              <span className="text-[#3B82F6] font-bold">BITÁCORA INMUTABLE</span>
            </div>
            <h2 className="mt-1 text-base font-bold text-[#F9FAFB]">
              Auditoría de Cargas, Lotes & Registro de Modificaciones
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportAudit}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#374151] bg-[#111827] px-3 py-1.5 text-xs font-semibold text-[#D1D5DB] hover:text-[#F9FAFB] hover:border-[#4B5563] transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-[#9CA3AF]" />
              Exportar Auditoría (.xlsx)
            </button>
          </div>
        </div>

        {/* Switcher & Search */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-[#111827] border border-[#374151] rounded-lg">
            <button
              onClick={() => setActiveTab('batches')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'batches'
                  ? 'bg-[#3B82F6] text-white shadow-xs'
                  : 'text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#1F2937]'
              }`}
            >
              Lotes de Carga ({batches.length})
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-[#3B82F6] text-white shadow-xs'
                  : 'text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#1F2937]'
              }`}
            >
              Bitácora de Acciones ({auditLogs.length})
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Buscar en auditoría..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-9 w-60 rounded-md border border-[#374151] bg-[#111827] pl-8 pr-3 text-xs text-[#F9FAFB] placeholder:text-[#6B7280] focus:border-[#3B82F6] focus:outline-hidden focus:ring-1 focus:ring-[#3B82F6]"
            />
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="rounded-lg border border-[#374151] bg-[#1F2937] overflow-hidden shadow-sm">
        {activeTab === 'batches' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#374151] bg-[#111827] text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
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
              <tbody className="divide-y divide-[#374151]">
                {filteredBatches.map(b => (
                  <tr key={b.id} className="hover:bg-[#111827]/60 text-[#F9FAFB] transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-[#F9FAFB]">{b.filename}</div>
                      <div className="text-[10px] text-[#9CA3AF] font-mono">{b.id}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          b.tipo_operacion === 'append'
                            ? 'bg-[#3B82F6]/15 text-[#38BDF8] border border-[#3B82F6]/30'
                            : 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'
                        }`}
                      >
                        {b.tipo_operacion.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#14B8A6] font-medium">
                      {b.periodos_detectados.join(', ')}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[11px] font-mono tabular-nums">
                      <div className="font-semibold text-[#F9FAFB]">{b.registros_ventas} ventas</div>
                      <div className="text-[10px] text-[#9CA3AF]">
                        {b.registros_objetivos} obj · {b.registros_cobertura} cob
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-[#9CA3AF]">{b.created_by}</td>
                    <td className="py-2.5 px-3 text-[#9CA3AF] font-mono tabular-nums">{b.duration_ms} ms</td>
                    <td className="py-2.5 px-3 text-[#9CA3AF] text-[11px] font-mono tabular-nums">
                      {new Date(b.created_at).toLocaleString('es-PY')}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#14B8A6] bg-[#14B8A6]/10 px-2 py-0.5 rounded border border-[#14B8A6]/30">
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
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#374151] bg-[#111827] text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Fecha y Hora</th>
                  <th className="py-2.5 px-3">Acción</th>
                  <th className="py-2.5 px-3">Detalle de Operación</th>
                  <th className="py-2.5 px-3">Usuario</th>
                  <th className="py-2.5 px-3">Rol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#374151]">
                {filteredAudit.map(a => (
                  <tr key={a.id} className="hover:bg-[#111827]/60 text-[#F9FAFB] transition-colors">
                    <td className="py-2.5 px-3 text-[11px] text-[#9CA3AF] whitespace-nowrap font-mono tabular-nums">
                      {new Date(a.created_at).toLocaleString('es-PY')}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] rounded border border-[#374151] bg-[#111827] px-2 py-0.5 font-semibold text-[#38BDF8]">
                        {a.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#D1D5DB] text-[11px] leading-relaxed">
                      {a.details}
                    </td>
                    <td className="py-2.5 px-3 text-[#9CA3AF] whitespace-nowrap">{a.user_email}</td>
                    <td className="py-2.5 px-3 uppercase text-[10px]">
                      <span
                        className={`px-2 py-0.5 rounded font-semibold border ${
                          a.user_role === 'admin'
                            ? 'border-[#3B82F6]/40 bg-[#3B82F6]/10 text-[#3B82F6]'
                            : 'border-[#374151] bg-[#111827] text-[#9CA3AF]'
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
