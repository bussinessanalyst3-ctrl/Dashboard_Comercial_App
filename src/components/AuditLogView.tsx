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
    <div className="space-y-4 font-mono text-xs">
      {/* Header */}
      <div className="border border-[#242C37] bg-[#12161C] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#242C37] pb-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] text-[#626D7C] uppercase tracking-wider">
              <span>TRAZABILIDAD Y GOBERNANZA</span>
              <span>/</span>
              <span className="text-[#C5F467] font-bold">BITÁCORA INMUTABLE</span>
            </div>
            <h2 className="mt-1 text-base font-bold text-[#F1F5F9]">
              Auditoría de Cargas, Lotes & Registro de Modificaciones
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportAudit}
              className="inline-flex items-center gap-1.5 border border-[#242C37] bg-[#0B0D10] px-3 py-1.5 text-xs text-[#929EAD] hover:text-[#F1F5F9] transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-[#626D7C]" />
              Exportar Auditoría (.xlsx)
            </button>
          </div>
        </div>

        {/* Switcher & Search */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-[#0B0D10] border border-[#242C37] rounded-sm">
            <button
              onClick={() => setActiveTab('batches')}
              className={`px-3 py-1 text-xs transition-colors ${
                activeTab === 'batches'
                  ? 'bg-[#191F27] text-[#C5F467] font-bold border border-[#333D4D]'
                  : 'text-[#929EAD] hover:text-[#F1F5F9]'
              }`}
            >
              Lotes de Carga ({batches.length})
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1 text-xs transition-colors ${
                activeTab === 'audit'
                  ? 'bg-[#191F27] text-[#C5F467] font-bold border border-[#333D4D]'
                  : 'text-[#929EAD] hover:text-[#F1F5F9]'
              }`}
            >
              Bitácora de Acciones ({auditLogs.length})
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#626D7C]" />
            <input
              type="text"
              placeholder="Buscar en auditoría..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 w-60 rounded-sm border border-[#242C37] bg-[#0B0D10] pl-8 pr-2 text-xs text-[#F1F5F9] placeholder:text-[#626D7C] focus:border-[#C5F467] focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="border border-[#242C37] bg-[#12161C] overflow-hidden">
        {activeTab === 'batches' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-[#242C37] bg-[#0B0D10] text-[10px] font-bold text-[#626D7C] uppercase tracking-wider">
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
              <tbody className="divide-y divide-[#242C37]/60">
                {filteredBatches.map(b => (
                  <tr key={b.id} className="hover:bg-[#191F27]/60 text-[#F1F5F9]">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-[#F1F5F9]">{b.filename}</div>
                      <div className="text-[10px] text-[#626D7C]">{b.id}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 border ${
                          b.tipo_operacion === 'append'
                            ? 'border-[#38BDF8]/40 bg-[#38BDF8]/10 text-[#38BDF8]'
                            : 'border-[#FB7185]/40 bg-[#FB7185]/10 text-[#FB7185]'
                        }`}
                      >
                        {b.tipo_operacion.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#C5F467]">
                      {b.periodos_detectados.join(', ')}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[11px]">
                      <div>{b.registros_ventas} ventas</div>
                      <div className="text-[10px] text-[#626D7C]">
                        {b.registros_objetivos} obj · {b.registros_cobertura} cob
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-[#929EAD]">{b.created_by}</td>
                    <td className="py-2.5 px-3 text-[#626D7C]">{b.duration_ms} ms</td>
                    <td className="py-2.5 px-3 text-[#929EAD] text-[11px]">
                      {new Date(b.created_at).toLocaleString('es-PY')}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#C5F467]">
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
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-[#242C37] bg-[#0B0D10] text-[10px] font-bold text-[#626D7C] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Fecha y Hora</th>
                  <th className="py-2.5 px-3">Acción</th>
                  <th className="py-2.5 px-3">Detalle de Operación</th>
                  <th className="py-2.5 px-3">Usuario</th>
                  <th className="py-2.5 px-3">Rol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242C37]/60">
                {filteredAudit.map(a => (
                  <tr key={a.id} className="hover:bg-[#191F27]/60 text-[#F1F5F9]">
                    <td className="py-2.5 px-3 text-[11px] text-[#626D7C] whitespace-nowrap">
                      {new Date(a.created_at).toLocaleString('es-PY')}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] border border-[#242C37] bg-[#0B0D10] px-1.5 py-0.5 text-[#C5F467]">
                        {a.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#F1F5F9] text-[11px] font-sans leading-relaxed">
                      {a.details}
                    </td>
                    <td className="py-2.5 px-3 text-[#929EAD] whitespace-nowrap">{a.user_email}</td>
                    <td className="py-2.5 px-3 uppercase text-[10px]">
                      <span
                        className={`px-1.5 py-0.5 border ${
                          a.user_role === 'admin'
                            ? 'border-[#C5F467]/40 text-[#C5F467]'
                            : 'border-[#242C37] text-[#626D7C]'
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
