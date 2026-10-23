import {
  VentaRecord,
  ObjetivoRecord,
  CoberturaRecord,
  ImportBatch,
  AuditLog,
  UserProfile,
  UserRole
} from '../types/commercial';
import {
  INITIAL_VENTAS,
  INITIAL_OBJETIVOS,
  INITIAL_COBERTURA,
  INITIAL_BATCHES,
  INITIAL_AUDIT_LOGS
} from './initialData';
import { LOCAL_USERS, getSupabaseClient } from './supabaseClient';

const DB_VENTAS_KEY = 'db_comercial_ventas_v2';
const DB_OBJETIVOS_KEY = 'db_comercial_objetivos_v2';
const DB_COBERTURA_KEY = 'db_comercial_cobertura_v2';
const DB_BATCHES_KEY = 'db_comercial_batches_v2';
const DB_AUDIT_KEY = 'db_comercial_audit_v2';
const DB_USER_KEY = 'db_comercial_active_user_v2';

export interface DatabaseState {
  ventas: VentaRecord[];
  objetivos: ObjetivoRecord[];
  cobertura: CoberturaRecord[];
  batches: ImportBatch[];
  auditLogs: AuditLog[];
  currentUser: UserProfile;
}

/**
 * Loads data from localStorage / persistent store or seeds with INITIAL_DATA
 */
export function loadDatabase(): DatabaseState {
  try {
    const rawV = localStorage.getItem(DB_VENTAS_KEY);
    const rawO = localStorage.getItem(DB_OBJETIVOS_KEY);
    const rawC = localStorage.getItem(DB_COBERTURA_KEY);
    const rawB = localStorage.getItem(DB_BATCHES_KEY);
    const rawA = localStorage.getItem(DB_AUDIT_KEY);
    const rawU = localStorage.getItem(DB_USER_KEY);

    const currentUser: UserProfile = rawU ? JSON.parse(rawU) : LOCAL_USERS[0];

    if (!rawV || !rawO || !rawC) {
      // First run: Seed from initial data
      saveDatabase({
        ventas: INITIAL_VENTAS,
        objetivos: INITIAL_OBJETIVOS,
        cobertura: INITIAL_COBERTURA,
        batches: INITIAL_BATCHES,
        auditLogs: INITIAL_AUDIT_LOGS,
        currentUser
      });
      return {
        ventas: INITIAL_VENTAS,
        objetivos: INITIAL_OBJETIVOS,
        cobertura: INITIAL_COBERTURA,
        batches: INITIAL_BATCHES,
        auditLogs: INITIAL_AUDIT_LOGS,
        currentUser
      };
    }

    return {
      ventas: JSON.parse(rawV),
      objetivos: JSON.parse(rawO),
      cobertura: JSON.parse(rawC),
      batches: rawB ? JSON.parse(rawB) : INITIAL_BATCHES,
      auditLogs: rawA ? JSON.parse(rawA) : INITIAL_AUDIT_LOGS,
      currentUser
    };
  } catch (err) {
    console.error('Error loading database, resetting to fallback:', err);
    return {
      ventas: INITIAL_VENTAS,
      objetivos: INITIAL_OBJETIVOS,
      cobertura: INITIAL_COBERTURA,
      batches: INITIAL_BATCHES,
      auditLogs: INITIAL_AUDIT_LOGS,
      currentUser: LOCAL_USERS[0]
    };
  }
}

/**
 * Saves current state into persistent storage
 */
export function saveDatabase(state: DatabaseState): void {
  try {
    localStorage.setItem(DB_VENTAS_KEY, JSON.stringify(state.ventas));
    localStorage.setItem(DB_OBJETIVOS_KEY, JSON.stringify(state.objetivos));
    localStorage.setItem(DB_COBERTURA_KEY, JSON.stringify(state.cobertura));
    localStorage.setItem(DB_BATCHES_KEY, JSON.stringify(state.batches));
    localStorage.setItem(DB_AUDIT_KEY, JSON.stringify(state.auditLogs));
    localStorage.setItem(DB_USER_KEY, JSON.stringify(state.currentUser));
  } catch (err) {
    console.warn('LocalStorage save failed, falling back to memory:', err);
  }
}

/**
 * Modality A: Append new periods / records (Idempotent by business key)
 */
export function executeAppendImport(
  currentState: DatabaseState,
  batchMeta: {
    filename: string;
    periodos: string[];
  },
  newObjetivos: Partial<ObjetivoRecord>[],
  newVentas: Partial<VentaRecord>[],
  newCobertura: Partial<CoberturaRecord>[]
): {
  updatedState: DatabaseState;
  stats: { insertedVentas: number; updatedVentas: number; insertedObj: number; insertedCob: number };
} {
  const batchId = 'batch_' + Date.now();
  const startTime = Date.now();

  let insertedV = 0;
  let updatedV = 0;
  let insertedO = 0;
  let insertedC = 0;

  // 1. Process Ventas with Unique Key (periodo_mes + codigo_ruta + vendedor + producto)
  const ventasMap = new Map<string, VentaRecord>();
  currentState.ventas.forEach(v => {
    const key = `${v.periodo_mes}|${v.codigo_ruta}|${v.vendedor}|${v.producto}`;
    ventasMap.set(key, v);
  });

  newVentas.forEach((v, idx) => {
    const key = `${v.periodo_mes}|${v.codigo_ruta}|${v.vendedor}|${v.producto}`;
    const existing = ventasMap.get(key);
    if (existing) {
      // Update values
      ventasMap.set(key, {
        ...existing,
        ventas_toneladas: v.ventas_toneladas ?? existing.ventas_toneladas,
        ventas_facturacion: v.ventas_facturacion ?? existing.ventas_facturacion,
        zona: v.zona || existing.zona,
        supervisor: v.supervisor || existing.supervisor,
        import_batch_id: batchId
      });
      updatedV++;
    } else {
      ventasMap.set(key, {
        id: `v_${Date.now()}_${idx}`,
        periodo_mes: v.periodo_mes || 'sept-26',
        zona: v.zona || 'SIN ZONA',
        supervisor: v.supervisor || 'SIN SUPERVISOR',
        codigo_ruta: v.codigo_ruta || 'SIN RUTA',
        vendedor: v.vendedor || 'SIN VENDEDOR',
        producto: v.producto || 'SIN PRODUCTO',
        ventas_toneladas: v.ventas_toneladas || 0,
        ventas_facturacion: v.ventas_facturacion || 0,
        import_batch_id: batchId,
        created_at: new Date().toISOString()
      });
      insertedV++;
    }
  });

  // 2. Process Objetivos with Unique Key (periodo_mes + codigo_ruta + vendedor + producto)
  const objMap = new Map<string, ObjetivoRecord>();
  currentState.objetivos.forEach(o => {
    const key = `${o.periodo_mes}|${o.codigo_ruta}|${o.vendedor}|${o.producto}`;
    objMap.set(key, o);
  });

  newObjetivos.forEach((o, idx) => {
    const key = `${o.periodo_mes}|${o.codigo_ruta}|${o.vendedor}|${o.producto}`;
    const existing = objMap.get(key);
    if (existing) {
      objMap.set(key, {
        ...existing,
        toneladas: o.toneladas ?? existing.toneladas,
        facturacion: o.facturacion ?? existing.facturacion,
        zona: o.zona || existing.zona,
        supervisor: o.supervisor || existing.supervisor,
        import_batch_id: batchId
      });
    } else {
      objMap.set(key, {
        id: `obj_${Date.now()}_${idx}`,
        periodo_mes: o.periodo_mes || 'sept-26',
        zona: o.zona || 'SIN ZONA',
        supervisor: o.supervisor || 'SIN SUPERVISOR',
        codigo_ruta: o.codigo_ruta || 'SIN RUTA',
        vendedor: o.vendedor || 'SIN VENDEDOR',
        producto: o.producto || 'SIN PRODUCTO',
        toneladas: o.toneladas || 0,
        facturacion: o.facturacion || 0,
        import_batch_id: batchId,
        created_at: new Date().toISOString()
      });
      insertedO++;
    }
  });

  // 3. Process Cobertura with Unique Key (periodo_mes + codigo_ruta + vendedor)
  const cobMap = new Map<string, CoberturaRecord>();
  currentState.cobertura.forEach(c => {
    const key = `${c.periodo_mes}|${c.codigo_ruta}|${c.vendedor}`;
    cobMap.set(key, c);
  });

  newCobertura.forEach((c, idx) => {
    const key = `${c.periodo_mes}|${c.codigo_ruta}|${c.vendedor}`;
    const existing = cobMap.get(key);
    if (existing) {
      cobMap.set(key, {
        ...existing,
        cobertura_planificada: c.cobertura_planificada ?? existing.cobertura_planificada,
        clientes_reales: c.clientes_reales ?? existing.clientes_reales,
        zona: c.zona || existing.zona,
        supervisor: c.supervisor || existing.supervisor,
        import_batch_id: batchId
      });
    } else {
      cobMap.set(key, {
        id: `cob_${Date.now()}_${idx}`,
        periodo_mes: c.periodo_mes || 'sept-26',
        zona: c.zona || 'SIN ZONA',
        supervisor: c.supervisor || 'SIN SUPERVISOR',
        codigo_ruta: c.codigo_ruta || 'SIN RUTA',
        vendedor: c.vendedor || 'SIN VENDEDOR',
        cobertura_planificada: c.cobertura_planificada || 0,
        clientes_reales: c.clientes_reales || 0,
        import_batch_id: batchId,
        created_at: new Date().toISOString()
      });
      insertedC++;
    }
  });

  const durationMs = Date.now() - startTime;

  const fuentes: ('objetivos' | 'ventas' | 'cobertura')[] = [];
  if (newObjetivos.length > 0) fuentes.push('objetivos');
  if (newVentas.length > 0) fuentes.push('ventas');
  if (newCobertura.length > 0) fuentes.push('cobertura');

  const newBatch: ImportBatch = {
    id: batchId,
    filename: batchMeta.filename,
    periodos_detectados: batchMeta.periodos,
    fuentes_incluidas: fuentes,
    tipo_operacion: 'append',
    registros_objetivos: newObjetivos.length,
    registros_ventas: newVentas.length,
    registros_cobertura: newCobertura.length,
    status: 'completado',
    created_by: currentState.currentUser.email,
    created_at: new Date().toISOString(),
    duration_ms: durationMs,
    notas: `Inserción incremental: +${insertedV} ventas nuevas (${updatedV} actualizadas), +${insertedO} objetivos, +${insertedC} coberturas.`
  };

  const newAudit: AuditLog = {
    id: 'audit_' + Date.now(),
    batch_id: batchId,
    action: 'IMPORT_APPEND',
    details: `Importación incremental '${batchMeta.filename}' procesada exitosamente en ${durationMs}ms por ${currentState.currentUser.email}.`,
    user_email: currentState.currentUser.email,
    user_role: currentState.currentUser.role,
    created_at: new Date().toISOString(),
    periodo_afectado: batchMeta.periodos.join(', ')
  };

  const updatedState: DatabaseState = {
    ...currentState,
    ventas: Array.from(ventasMap.values()),
    objetivos: Array.from(objMap.values()),
    cobertura: Array.from(cobMap.values()),
    batches: [newBatch, ...currentState.batches],
    auditLogs: [newAudit, ...currentState.auditLogs]
  };

  saveDatabase(updatedState);

  // If Supabase is connected, attempt non-blocking sync
  syncToSupabaseIfConnected(newBatch, newAudit);

  return {
    updatedState,
    stats: {
      insertedVentas: insertedV,
      updatedVentas: updatedV,
      insertedObj: insertedO,
      insertedCob: insertedC
    }
  };
}

/**
 * Modality B: Replace existing period (Explicit replacement of specific sources and month)
 */
export function executeReplacePeriodImport(
  currentState: DatabaseState,
  targetPeriod: string,
  fuentesToReplace: ('objetivos' | 'ventas' | 'cobertura')[],
  filename: string,
  newObjetivos: Partial<ObjetivoRecord>[],
  newVentas: Partial<VentaRecord>[],
  newCobertura: Partial<CoberturaRecord>[]
): {
  updatedState: DatabaseState;
  deletedCounts: { ventas: number; objetivos: number; cobertura: number };
} {
  const batchId = 'batch_rep_' + Date.now();
  const startTime = Date.now();

  // Count deleted
  let delV = 0;
  let delO = 0;
  let delC = 0;

  let newVentasList = [...currentState.ventas];
  let newObjList = [...currentState.objetivos];
  let newCobList = [...currentState.cobertura];

  // 1. Replace Ventas if selected
  if (fuentesToReplace.includes('ventas')) {
    const prevCount = newVentasList.length;
    newVentasList = newVentasList.filter(v => v.periodo_mes !== targetPeriod);
    delV = prevCount - newVentasList.length;

    // Add only new records belonging to this period
    const toInsert = newVentas.filter(v => v.periodo_mes === targetPeriod || !v.periodo_mes);
    toInsert.forEach((v, idx) => {
      newVentasList.push({
        id: `v_rep_${Date.now()}_${idx}`,
        periodo_mes: targetPeriod,
        zona: v.zona || 'SIN ZONA',
        supervisor: v.supervisor || 'SIN SUPERVISOR',
        codigo_ruta: v.codigo_ruta || 'SIN RUTA',
        vendedor: v.vendedor || 'SIN VENDEDOR',
        producto: v.producto || 'SIN PRODUCTO',
        ventas_toneladas: v.ventas_toneladas || 0,
        ventas_facturacion: v.ventas_facturacion || 0,
        import_batch_id: batchId,
        created_at: new Date().toISOString()
      });
    });
  }

  // 2. Replace Objetivos if selected
  if (fuentesToReplace.includes('objetivos')) {
    const prevCount = newObjList.length;
    newObjList = newObjList.filter(o => o.periodo_mes !== targetPeriod);
    delO = prevCount - newObjList.length;

    const toInsert = newObjetivos.filter(o => o.periodo_mes === targetPeriod || !o.periodo_mes);
    toInsert.forEach((o, idx) => {
      newObjList.push({
        id: `obj_rep_${Date.now()}_${idx}`,
        periodo_mes: targetPeriod,
        zona: o.zona || 'SIN ZONA',
        supervisor: o.supervisor || 'SIN SUPERVISOR',
        codigo_ruta: o.codigo_ruta || 'SIN RUTA',
        vendedor: o.vendedor || 'SIN VENDEDOR',
        producto: o.producto || 'SIN PRODUCTO',
        toneladas: o.toneladas || 0,
        facturacion: o.facturacion || 0,
        import_batch_id: batchId,
        created_at: new Date().toISOString()
      });
    });
  }

  // 3. Replace Cobertura if selected
  if (fuentesToReplace.includes('cobertura')) {
    const prevCount = newCobList.length;
    newCobList = newCobList.filter(c => c.periodo_mes !== targetPeriod);
    delC = prevCount - newCobList.length;

    const toInsert = newCobertura.filter(c => c.periodo_mes === targetPeriod || !c.periodo_mes);
    toInsert.forEach((c, idx) => {
      newCobList.push({
        id: `cob_rep_${Date.now()}_${idx}`,
        periodo_mes: targetPeriod,
        zona: c.zona || 'SIN ZONA',
        supervisor: c.supervisor || 'SIN SUPERVISOR',
        codigo_ruta: c.codigo_ruta || 'SIN RUTA',
        vendedor: c.vendedor || 'SIN VENDEDOR',
        cobertura_planificada: c.cobertura_planificada || 0,
        clientes_reales: c.clientes_reales || 0,
        import_batch_id: batchId,
        created_at: new Date().toISOString()
      });
    });
  }

  const durationMs = Date.now() - startTime;

  const newBatch: ImportBatch = {
    id: batchId,
    filename,
    periodos_detectados: [targetPeriod],
    fuentes_incluidas: fuentesToReplace,
    tipo_operacion: 'replace',
    registros_objetivos: fuentesToReplace.includes('objetivos') ? newObjetivos.length : 0,
    registros_ventas: fuentesToReplace.includes('ventas') ? newVentas.length : 0,
    registros_cobertura: fuentesToReplace.includes('cobertura') ? newCobertura.length : 0,
    status: 'completado',
    created_by: currentState.currentUser.email,
    created_at: new Date().toISOString(),
    duration_ms: durationMs,
    notas: `Reemplazo de período '${targetPeriod}' en fuentes [${fuentesToReplace.join(', ')}]. Registros eliminados previos: ${delV} ventas, ${delO} objetivos, ${delC} cobertura.`
  };

  const newAudit: AuditLog = {
    id: 'audit_' + Date.now(),
    batch_id: batchId,
    action: 'IMPORT_REPLACE',
    details: `Reemplazo atómico ejecutado para el período '${targetPeriod}'. Fuentes reemplazadas: [${fuentesToReplace.join(', ')}]. Eliminados: ${delV} ventas, ${delO} objetivos, ${delC} cobertura. Nuevos insertados: ${newBatch.registros_ventas} ventas, ${newBatch.registros_objetivos} objetivos, ${newBatch.registros_cobertura} cobertura.`,
    user_email: currentState.currentUser.email,
    user_role: currentState.currentUser.role,
    created_at: new Date().toISOString(),
    periodo_afectado: targetPeriod
  };

  const updatedState: DatabaseState = {
    ...currentState,
    ventas: newVentasList,
    objetivos: newObjList,
    cobertura: newCobList,
    batches: [newBatch, ...currentState.batches],
    auditLogs: [newAudit, ...currentState.auditLogs]
  };

  saveDatabase(updatedState);
  syncToSupabaseIfConnected(newBatch, newAudit);

  return {
    updatedState,
    deletedCounts: { ventas: delV, objetivos: delO, cobertura: delC }
  };
}

/**
 * Reset database back to pristine initial dataset
 */
export function resetDatabaseState(user: UserProfile): DatabaseState {
  const resetAudit: AuditLog = {
    id: 'audit_reset_' + Date.now(),
    action: 'RESET_DEMO',
    details: 'Restablecimiento de la base de datos comercial al estado inicial verificado de sept-26 y serie histórica.',
    user_email: user.email,
    user_role: user.role,
    created_at: new Date().toISOString()
  };

  const newState: DatabaseState = {
    ventas: INITIAL_VENTAS,
    objetivos: INITIAL_OBJETIVOS,
    cobertura: INITIAL_COBERTURA,
    batches: INITIAL_BATCHES,
    auditLogs: [resetAudit, ...INITIAL_AUDIT_LOGS],
    currentUser: user
  };

  saveDatabase(newState);
  return newState;
}

/**
 * Switch Active User Role for testing RBAC
 */
export function switchUserRole(currentState: DatabaseState, role: UserRole): DatabaseState {
  const updatedUser: UserProfile = {
    ...currentState.currentUser,
    role,
    full_name: role === 'admin' ? 'Director Comercial (Admin)' : 'Analista Comercial (Consulta)',
    email: role === 'admin' ? 'admin@empresa.com.py' : 'analista@empresa.com.py'
  };

  const audit: AuditLog = {
    id: 'audit_role_' + Date.now(),
    action: 'ROLE_CHANGE',
    details: `Cambio de rol de sesión a: ${role.toUpperCase()}`,
    user_email: updatedUser.email,
    user_role: role,
    created_at: new Date().toISOString()
  };

  const updatedState: DatabaseState = {
    ...currentState,
    currentUser: updatedUser,
    auditLogs: [audit, ...currentState.auditLogs]
  };

  saveDatabase(updatedState);
  return updatedState;
}

/**
 * Seeds or synchronizes the complete initial dataset into Supabase PostgreSQL
 */
export async function seedSupabaseInitialData(): Promise<{
  success: boolean;
  message: string;
  counts?: { ventas: number; objetivos: number; cobertura: number };
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase no está conectado.' };
  }

  try {
    // Determine table naming: com_* or comercial_*
    let ventasTable = 'com_ventas';
    const checkV = await client.from('com_ventas').select('id').limit(1);
    if (checkV.error && checkV.error.code === '42P01') {
      ventasTable = 'comercial_ventas';
    }

    let objetivosTable = 'com_objetivos';
    const checkO = await client.from('com_objetivos').select('id').limit(1);
    if (checkO.error && checkO.error.code === '42P01') {
      objetivosTable = 'comercial_objetivos';
    }

    let coberturaTable = 'com_cobertura';
    const checkC = await client.from('com_cobertura').select('id').limit(1);
    if (checkC.error && checkC.error.code === '42P01') {
      coberturaTable = 'comercial_cobertura';
    }

    // 1. Batch insert Objetivos in chunks of 250
    const objRows = INITIAL_OBJETIVOS.map(o => ({
      id: o.id,
      zona: o.zona,
      supervisor: o.supervisor,
      codigo_ruta: o.codigo_ruta,
      vendedor: o.vendedor,
      producto: o.producto,
      [objetivosTable === 'com_objetivos' ? 'toneladas' : 'toneladas']: o.toneladas,
      [objetivosTable === 'com_objetivos' ? 'facturacion' : 'facturacion']: o.facturacion,
      [objetivosTable === 'com_objetivos' ? 'mes' : 'periodo_mes']: o.periodo_mes
    }));

    for (let i = 0; i < objRows.length; i += 250) {
      const chunk = objRows.slice(i, i + 250);
      const { error } = await client.from(objetivosTable).upsert(chunk);
      if (error) console.warn('Error upserting objetivos chunk:', error.message);
    }

    // 2. Batch insert Ventas in chunks of 250
    const ventasRows = INITIAL_VENTAS.map(v => ({
      id: v.id,
      zona: v.zona,
      supervisor: v.supervisor,
      codigo_ruta: v.codigo_ruta,
      producto: v.producto,
      ventas_toneladas: v.ventas_toneladas,
      ventas_facturacion: v.ventas_facturacion,
      [ventasTable === 'com_ventas' ? 'mes' : 'periodo_mes']: v.periodo_mes
    }));

    for (let i = 0; i < ventasRows.length; i += 250) {
      const chunk = ventasRows.slice(i, i + 250);
      const { error } = await client.from(ventasTable).upsert(chunk);
      if (error) console.warn('Error upserting ventas chunk:', error.message);
    }

    // 3. Batch insert Cobertura in chunks of 250
    const cobRows = INITIAL_COBERTURA.map(c => ({
      id: c.id,
      zona: c.zona,
      supervisor: c.supervisor,
      codigo_ruta: c.codigo_ruta,
      vendedor: c.vendedor,
      [coberturaTable === 'com_cobertura' ? 'cobertura' : 'cobertura_planificada']: c.cobertura_planificada,
      clientes_reales: c.clientes_reales,
      [coberturaTable === 'com_cobertura' ? 'mes' : 'periodo_mes']: c.periodo_mes
    }));

    for (let i = 0; i < cobRows.length; i += 250) {
      const chunk = cobRows.slice(i, i + 250);
      const { error } = await client.from(coberturaTable).upsert(chunk);
      if (error) console.warn('Error upserting cobertura chunk:', error.message);
    }

    return {
      success: true,
      message: `Población exitosa: ${ventasRows.length} ventas, ${objRows.length} objetivos y ${cobRows.length} registros de cobertura sincronizados en Supabase.`,
      counts: {
        ventas: ventasRows.length,
        objetivos: objRows.length,
        cobertura: cobRows.length
      }
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Error al poblar datos en Supabase: ${errorMsg}`
    };
  }
}

/**
 * Asynchronously pushes audit and batch records to Supabase when connected
 */
async function syncToSupabaseIfConnected(batch: ImportBatch, audit: AuditLog): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    // Determine batch table name
    let batchTable = 'com_import_batches';
    const checkB = await client.from('com_import_batches').select('id').limit(1);
    if (checkB.error && checkB.error.code === '42P01') {
      batchTable = 'import_batches';
    }

    let auditTable = 'com_audit_logs';
    const checkA = await client.from('com_audit_logs').select('id').limit(1);
    if (checkA.error && checkA.error.code === '42P01') {
      auditTable = 'import_audit_logs';
    }

    if (batchTable === 'com_import_batches') {
      await client.from(batchTable).insert([
        {
          id: batch.id,
          filename: batch.filename,
          uploaded_at: batch.created_at,
          uploaded_by: batch.created_by,
          mode: batch.tipo_operacion === 'replace' ? 'replace_period' : 'append',
          period: batch.periodos_detectados[0] || 'sept-26',
          records_count: {
            ventas: batch.registros_ventas,
            objetivos: batch.registros_objetivos,
            cobertura: batch.registros_cobertura
          },
          status: 'success',
          error_summary: batch.notas
        }
      ]);
    } else {
      await client.from(batchTable).insert([
        {
          id: batch.id,
          filename: batch.filename,
          periodos_detectados: batch.periodos_detectados,
          fuentes_incluidas: batch.fuentes_incluidas,
          tipo_operacion: batch.tipo_operacion,
          registros_objetivos: batch.registros_objetivos,
          registros_ventas: batch.registros_ventas,
          registros_cobertura: batch.registros_cobertura,
          status: batch.status,
          created_by: batch.created_by,
          created_at: batch.created_at,
          duration_ms: batch.duration_ms,
          notas: batch.notas
        }
      ]);
    }

    if (auditTable === 'com_audit_logs') {
      await client.from(auditTable).insert([
        {
          id: audit.id,
          timestamp: audit.created_at,
          action: audit.action,
          user_id: audit.user_email,
          details: audit.details,
          status: 'success'
        }
      ]);
    } else {
      await client.from(auditTable).insert([
        {
          id: audit.id,
          batch_id: audit.batch_id,
          action: audit.action,
          details: audit.details,
          user_email: audit.user_email,
          user_role: audit.user_role,
          periodo_afectado: audit.periodo_afectado,
          created_at: audit.created_at
        }
      ]);
    }
  } catch (err) {
    console.warn('Supabase remote sync log error:', err);
  }
}

