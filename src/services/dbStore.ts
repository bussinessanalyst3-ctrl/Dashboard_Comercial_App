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

const DB_INITIALIZED_KEY = 'db_comercial_initialized_v2';
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
    const initialized = localStorage.getItem(DB_INITIALIZED_KEY);
    const rawV = localStorage.getItem(DB_VENTAS_KEY);
    const rawO = localStorage.getItem(DB_OBJETIVOS_KEY);
    const rawC = localStorage.getItem(DB_COBERTURA_KEY);
    const rawB = localStorage.getItem(DB_BATCHES_KEY);
    const rawA = localStorage.getItem(DB_AUDIT_KEY);
    const rawU = localStorage.getItem(DB_USER_KEY);

    const currentUser: UserProfile = rawU ? JSON.parse(rawU) : LOCAL_USERS[0];

    if (!initialized && (rawV === null || rawO === null || rawC === null)) {
      // First run: Seed from initial data
      localStorage.setItem(DB_INITIALIZED_KEY, 'true');
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
      ventas: rawV ? JSON.parse(rawV) : [],
      objetivos: rawO ? JSON.parse(rawO) : [],
      cobertura: rawC ? JSON.parse(rawC) : [],
      batches: rawB ? JSON.parse(rawB) : [],
      auditLogs: rawA ? JSON.parse(rawA) : [],
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
    officialPeriod?: string;
  },
  newObjetivos: Partial<ObjetivoRecord>[],
  newVentas: Partial<VentaRecord>[],
  newCobertura: Partial<CoberturaRecord>[]
): {
  updatedState: DatabaseState;
  stats: { insertedVentas: number; updatedVentas: number; insertedObj: number; insertedCob: number };
} {
  if (currentState.currentUser.role !== 'admin') {
    throw new Error('Operación no autorizada: Solo el Administrador puede importar o modificar datos comerciales.');
  }

  const batchId = 'batch_' + Date.now();
  const startTime = Date.now();
  const officialPeriod = batchMeta.officialPeriod;

  let insertedV = 0;
  let updatedV = 0;
  let insertedO = 0;
  let insertedC = 0;

  // Build route directory to enrich missing vendedor in ventas (e.g. from Image 3 where Vendedor is omitted)
  const routeDir = new Map<string, { vendedor: string; supervisor: string; zona: string }>();
  newObjetivos.forEach(o => {
    if (o.codigo_ruta && o.vendedor && o.vendedor !== 'SIN VENDEDOR') {
      routeDir.set(o.codigo_ruta.trim().toUpperCase(), {
        vendedor: o.vendedor.trim().toUpperCase(),
        supervisor: o.supervisor?.trim().toUpperCase() || '',
        zona: o.zona?.trim().toUpperCase() || ''
      });
    }
  });
  newCobertura.forEach(c => {
    if (c.codigo_ruta && c.vendedor && c.vendedor !== 'SIN VENDEDOR' && !routeDir.has(c.codigo_ruta.trim().toUpperCase())) {
      routeDir.set(c.codigo_ruta.trim().toUpperCase(), {
        vendedor: c.vendedor.trim().toUpperCase(),
        supervisor: c.supervisor?.trim().toUpperCase() || '',
        zona: c.zona?.trim().toUpperCase() || ''
      });
    }
  });
  currentState.objetivos.forEach(o => {
    if (o.codigo_ruta && o.vendedor && o.vendedor !== 'SIN VENDEDOR' && !routeDir.has(o.codigo_ruta.trim().toUpperCase())) {
      routeDir.set(o.codigo_ruta.trim().toUpperCase(), {
        vendedor: o.vendedor.trim().toUpperCase(),
        supervisor: o.supervisor?.trim().toUpperCase() || '',
        zona: o.zona?.trim().toUpperCase() || ''
      });
    }
  });
  currentState.cobertura.forEach(c => {
    if (c.codigo_ruta && c.vendedor && c.vendedor !== 'SIN VENDEDOR' && !routeDir.has(c.codigo_ruta.trim().toUpperCase())) {
      routeDir.set(c.codigo_ruta.trim().toUpperCase(), {
        vendedor: c.vendedor.trim().toUpperCase(),
        supervisor: c.supervisor?.trim().toUpperCase() || '',
        zona: c.zona?.trim().toUpperCase() || ''
      });
    }
  });

  // 1. Process Ventas with Unique Key (periodo_mes + codigo_ruta + producto)
  const ventasMap = new Map<string, VentaRecord>();
  currentState.ventas.forEach(v => {
    const normRuta = (v.codigo_ruta || '').trim().toUpperCase();
    const normProd = (v.producto || '').trim().toUpperCase();
    const key = `${v.periodo_mes}|${normRuta}|${normProd}`;
    ventasMap.set(key, v);
  });

  newVentas.forEach((v, idx) => {
    const periodToUse = officialPeriod || v.periodo_mes || 'sept-26';
    const normRuta = (v.codigo_ruta || '').trim().toUpperCase();
    const normProd = (v.producto || '').trim().toUpperCase();
    const resolvedVendedor = (v.vendedor && v.vendedor !== 'SIN VENDEDOR')
      ? v.vendedor
      : (routeDir.get(normRuta)?.vendedor || 'SIN VENDEDOR');
    const resolvedSupervisor = (v.supervisor && v.supervisor !== 'SIN SUPERVISOR')
      ? v.supervisor
      : (routeDir.get(normRuta)?.supervisor || 'SIN SUPERVISOR');
    const resolvedZona = (v.zona && v.zona !== 'SIN ZONA')
      ? v.zona
      : (routeDir.get(normRuta)?.zona || 'SIN ZONA');

    const key = `${periodToUse}|${normRuta}|${normProd}`;
    const existing = ventasMap.get(key);
    if (existing) {
      // Update values idempotently
      ventasMap.set(key, {
        ...existing,
        periodo_mes: periodToUse,
        ventas_toneladas: v.ventas_toneladas ?? existing.ventas_toneladas,
        ventas_facturacion: v.ventas_facturacion ?? existing.ventas_facturacion,
        zona: resolvedZona || existing.zona,
        supervisor: resolvedSupervisor || existing.supervisor,
        vendedor: resolvedVendedor || existing.vendedor,
        import_batch_id: batchId
      });
      updatedV++;
    } else {
      ventasMap.set(key, {
        id: `v_${Date.now()}_${idx}`,
        periodo_mes: periodToUse,
        zona: resolvedZona || 'SIN ZONA',
        supervisor: resolvedSupervisor || 'SIN SUPERVISOR',
        codigo_ruta: v.codigo_ruta || 'SIN RUTA',
        vendedor: resolvedVendedor || 'SIN VENDEDOR',
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
    const periodToUse = officialPeriod || o.periodo_mes || 'sept-26';
    const key = `${periodToUse}|${o.codigo_ruta}|${o.vendedor}|${o.producto}`;
    const existing = objMap.get(key);
    if (existing) {
      objMap.set(key, {
        ...existing,
        periodo_mes: periodToUse,
        toneladas: o.toneladas ?? existing.toneladas,
        facturacion: o.facturacion ?? existing.facturacion,
        zona: o.zona || existing.zona,
        supervisor: o.supervisor || existing.supervisor,
        import_batch_id: batchId
      });
    } else {
      objMap.set(key, {
        id: `obj_${Date.now()}_${idx}`,
        periodo_mes: periodToUse,
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
    const periodToUse = officialPeriod || c.periodo_mes || 'sept-26';
    const key = `${periodToUse}|${c.codigo_ruta}|${c.vendedor}`;
    const existing = cobMap.get(key);
    if (existing) {
      cobMap.set(key, {
        ...existing,
        periodo_mes: periodToUse,
        cobertura_planificada: c.cobertura_planificada ?? existing.cobertura_planificada,
        clientes_reales: c.clientes_reales ?? existing.clientes_reales,
        zona: c.zona || existing.zona,
        supervisor: c.supervisor || existing.supervisor,
        import_batch_id: batchId
      });
    } else {
      cobMap.set(key, {
        id: `cob_${Date.now()}_${idx}`,
        periodo_mes: periodToUse,
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

  // If Supabase is connected, attempt automatic commercial sync
  const targetPeriod = officialPeriod || 'sept-26';
  syncToSupabaseIfConnected(newBatch, newAudit, {
    mode: 'append',
    targetPeriod,
    ventas: Array.from(ventasMap.values()).filter(v => v.periodo_mes === targetPeriod),
    objetivos: Array.from(objMap.values()).filter(o => o.periodo_mes === targetPeriod),
    cobertura: Array.from(cobMap.values()).filter(c => c.periodo_mes === targetPeriod)
  });

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
  if (currentState.currentUser.role !== 'admin') {
    throw new Error('Operación no autorizada: Solo el Administrador puede reemplazar datos comerciales.');
  }

  const batchId = 'batch_rep_' + Date.now();
  const startTime = Date.now();

  // Count deleted
  let delV = 0;
  let delO = 0;
  let delC = 0;

  let newVentasList = [...currentState.ventas];
  let newObjList = [...currentState.objetivos];
  let newCobList = [...currentState.cobertura];

  // Build route directory to enrich missing vendedor in ventas (e.g. from Image 3 where Vendedor is omitted)
  const repRouteDir = new Map<string, { vendedor: string; supervisor: string; zona: string }>();
  newObjetivos.forEach(o => {
    if (o.codigo_ruta && o.vendedor && o.vendedor !== 'SIN VENDEDOR') {
      repRouteDir.set(o.codigo_ruta.trim().toUpperCase(), {
        vendedor: o.vendedor.trim().toUpperCase(),
        supervisor: o.supervisor?.trim().toUpperCase() || '',
        zona: o.zona?.trim().toUpperCase() || ''
      });
    }
  });
  newCobList.forEach(c => {
    if (c.codigo_ruta && c.vendedor && c.vendedor !== 'SIN VENDEDOR' && !repRouteDir.has(c.codigo_ruta.trim().toUpperCase())) {
      repRouteDir.set(c.codigo_ruta.trim().toUpperCase(), {
        vendedor: c.vendedor.trim().toUpperCase(),
        supervisor: c.supervisor?.trim().toUpperCase() || '',
        zona: c.zona?.trim().toUpperCase() || ''
      });
    }
  });
  currentState.objetivos.forEach(o => {
    if (o.codigo_ruta && o.vendedor && o.vendedor !== 'SIN VENDEDOR' && !repRouteDir.has(o.codigo_ruta.trim().toUpperCase())) {
      repRouteDir.set(o.codigo_ruta.trim().toUpperCase(), {
        vendedor: o.vendedor.trim().toUpperCase(),
        supervisor: o.supervisor?.trim().toUpperCase() || '',
        zona: o.zona?.trim().toUpperCase() || ''
      });
    }
  });

  // 1. Replace Ventas if selected and incoming rows exist
  if (fuentesToReplace.includes('ventas') && newVentas.length > 0) {
    const prevCount = newVentasList.length;
    newVentasList = newVentasList.filter(v => v.periodo_mes !== targetPeriod);
    delV = prevCount - newVentasList.length;

    // Add all incoming records assigning targetPeriod
    newVentas.forEach((v, idx) => {
      const normRuta = (v.codigo_ruta || '').trim().toUpperCase();
      const resolvedVendedor = (v.vendedor && v.vendedor !== 'SIN VENDEDOR')
        ? v.vendedor
        : (repRouteDir.get(normRuta)?.vendedor || 'SIN VENDEDOR');
      const resolvedSupervisor = (v.supervisor && v.supervisor !== 'SIN SUPERVISOR')
        ? v.supervisor
        : (repRouteDir.get(normRuta)?.supervisor || 'SIN SUPERVISOR');
      const resolvedZona = (v.zona && v.zona !== 'SIN ZONA')
        ? v.zona
        : (repRouteDir.get(normRuta)?.zona || 'SIN ZONA');

      newVentasList.push({
        id: `v_rep_${Date.now()}_${idx}`,
        periodo_mes: targetPeriod,
        zona: resolvedZona || 'SIN ZONA',
        supervisor: resolvedSupervisor || 'SIN SUPERVISOR',
        codigo_ruta: v.codigo_ruta || 'SIN RUTA',
        vendedor: resolvedVendedor || 'SIN VENDEDOR',
        producto: v.producto || 'SIN PRODUCTO',
        ventas_toneladas: v.ventas_toneladas || 0,
        ventas_facturacion: v.ventas_facturacion || 0,
        import_batch_id: batchId,
        created_at: new Date().toISOString()
      });
    });
  }

  // 2. Replace Objetivos if selected and incoming rows exist
  if (fuentesToReplace.includes('objetivos') && newObjetivos.length > 0) {
    const prevCount = newObjList.length;
    newObjList = newObjList.filter(o => o.periodo_mes !== targetPeriod);
    delO = prevCount - newObjList.length;

    newObjetivos.forEach((o, idx) => {
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

  // 3. Replace Cobertura if selected and incoming rows exist
  if (fuentesToReplace.includes('cobertura') && newCobertura.length > 0) {
    const prevCount = newCobList.length;
    newCobList = newCobList.filter(c => c.periodo_mes !== targetPeriod);
    delC = prevCount - newCobList.length;

    newCobertura.forEach((c, idx) => {
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

  // If Supabase is connected, attempt automatic commercial sync
  syncToSupabaseIfConnected(newBatch, newAudit, {
    mode: 'replace',
    targetPeriod,
    ventas: newVentasList.filter(v => v.periodo_mes === targetPeriod),
    objetivos: newObjList.filter(o => o.periodo_mes === targetPeriod),
    cobertura: newCobList.filter(c => c.periodo_mes === targetPeriod),
    fuentesToReplace
  });

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
  try {
    localStorage.setItem(DB_INITIALIZED_KEY, 'true');
  } catch {}
  return newState;
}

/**
 * Empties all commercial records (ventas, objetivos, cobertura, batches)
 * from the dashboard, leaving a clean slate ready for importing real data.
 */
export async function clearAllCommercialData(
  user: UserProfile,
  alsoClearSupabase: boolean = true
): Promise<{
  success: boolean;
  message: string;
  clearedState: DatabaseState;
  remoteCleared?: boolean;
}> {
  if (user.role !== 'admin') {
    throw new Error('Operación no autorizada: Solo el Administrador puede vaciar la base de datos.');
  }

  const clearAudit: AuditLog = {
    id: 'audit_clear_' + Date.now(),
    action: 'CLEAR_DATABASE',
    details: 'Se eliminaron todos los registros de prueba y datos comerciales (ventas, objetivos, cobertura) para iniciar la operación con base limpia.',
    user_email: user.email,
    user_role: user.role,
    created_at: new Date().toISOString()
  };

  const clearedState: DatabaseState = {
    ventas: [],
    objetivos: [],
    cobertura: [],
    batches: [],
    auditLogs: [clearAudit],
    currentUser: user
  };

  saveDatabase(clearedState);
  try {
    localStorage.setItem(DB_INITIALIZED_KEY, 'true');
  } catch {}

  let remoteCleared = false;
  if (alsoClearSupabase) {
    const res = await clearSupabaseTables();
    remoteCleared = res.success;
  }

  return {
    success: true,
    message: remoteCleared
      ? 'Se eliminaron exitosamente todos los datos de prueba tanto del Dashboard local como de las tablas de Supabase.'
      : 'Se eliminaron exitosamente todos los datos de prueba del Dashboard local.',
    clearedState,
    remoteCleared
  };
}

/**
 * Truncates/deletes all rows in Supabase tables safely
 */
export async function clearSupabaseTables(): Promise<{
  success: boolean;
  message: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase no está conectado.' };
  }

  try {
    const tables = [
      'com_ventas', 'com_objetivos', 'com_cobertura', 'com_import_batches',
      'comercial_ventas', 'comercial_objetivos', 'comercial_cobertura', 'import_batches'
    ];

    for (const tbl of tables) {
      try {
        await client.from(tbl).delete().not('id', 'is', null);
      } catch (e) {
        // Table may not exist or already be empty
      }
    }

    return {
      success: true,
      message: 'Tablas de Supabase vaciadas con éxito. Base de datos remota limpia.'
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Error al vaciar tablas de Supabase: ${msg}`
    };
  }
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
 * Discovers and resolves exact table names in the active Supabase project
 */
export async function resolveCommercialTables(client: NonNullable<ReturnType<typeof getSupabaseClient>>) {
  let ventasTable = 'comercial_ventas';
  const checkV = await client.from('comercial_ventas').select('id').limit(1);
  if (checkV.error && checkV.error.code === '42P01') {
    ventasTable = 'com_ventas';
  }

  let objetivosTable = 'comercial_objetivos';
  const checkO = await client.from('comercial_objetivos').select('id').limit(1);
  if (checkO.error && checkO.error.code === '42P01') {
    objetivosTable = 'com_objetivos';
  }

  let coberturaTable = 'comercial_cobertura';
  const checkC = await client.from('comercial_cobertura').select('id').limit(1);
  if (checkC.error && checkC.error.code === '42P01') {
    coberturaTable = 'com_cobertura';
  }

  let batchTable = 'import_batches';
  const checkB = await client.from('import_batches').select('id').limit(1);
  if (checkB.error && checkB.error.code === '42P01') {
    batchTable = 'com_import_batches';
  }

  let auditTable = 'import_audit_logs';
  const checkA = await client.from('import_audit_logs').select('id').limit(1);
  if (checkA.error && checkA.error.code === '42P01') {
    auditTable = 'com_audit_logs';
  }

  return { ventasTable, objetivosTable, coberturaTable, batchTable, auditTable };
}

/**
 * Synchronizes newly imported commercial rows (Ventas, Objetivos, Cobertura) to Supabase PostgreSQL.
 * Handles both append (idempotent overwrite by period) and replace modes.
 */
export async function syncImportedRecordsToSupabase(
  batch: ImportBatch,
  audit: AuditLog,
  mode: 'append' | 'replace',
  targetPeriod: string,
  ventas: VentaRecord[],
  objetivos: ObjetivoRecord[],
  cobertura: CoberturaRecord[],
  fuentesToReplace?: ('objetivos' | 'ventas' | 'cobertura')[]
): Promise<{ success: boolean; message: string; counts?: { ventas: number; objetivos: number; cobertura: number } }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase no está configurado.' };
  }

  try {
    const { ventasTable, objetivosTable, coberturaTable, batchTable, auditTable } = await resolveCommercialTables(client);

    const vCol = ventasTable === 'com_ventas' ? 'mes' : 'periodo_mes';
    const oCol = objetivosTable === 'com_objetivos' ? 'mes' : 'periodo_mes';
    const cCol = coberturaTable === 'com_cobertura' ? 'mes' : 'periodo_mes';

    // 1. Clean prior rows for this period in target tables to avoid duplicate key conflicts
    if (mode === 'replace') {
      if ((!fuentesToReplace || fuentesToReplace.includes('ventas')) && ventas.length > 0) {
        await client.from(ventasTable).delete().eq(vCol, targetPeriod);
      }
      if ((!fuentesToReplace || fuentesToReplace.includes('objetivos')) && objetivos.length > 0) {
        await client.from(objetivosTable).delete().eq(oCol, targetPeriod);
      }
      if ((!fuentesToReplace || fuentesToReplace.includes('cobertura')) && cobertura.length > 0) {
        await client.from(coberturaTable).delete().eq(cCol, targetPeriod);
      }
    } else {
      // Append mode: clean this period's previous records in cloud so the updated consolidated dataset matches 1:1
      if (ventas.length > 0) await client.from(ventasTable).delete().eq(vCol, targetPeriod);
      if (objetivos.length > 0) await client.from(objetivosTable).delete().eq(oCol, targetPeriod);
      if (cobertura.length > 0) await client.from(coberturaTable).delete().eq(cCol, targetPeriod);
    }

    // 2. Insert Ventas in chunks of 200 (omitting client ID to let PostgreSQL generate valid UUIDs)
    if (ventas.length > 0) {
      const vRows = ventas.map(v => ({
        zona: v.zona || 'SIN ZONA',
        supervisor: v.supervisor || 'SIN SUPERVISOR',
        codigo_ruta: v.codigo_ruta || 'SIN RUTA',
        vendedor: v.vendedor || 'SIN VENDEDOR',
        producto: v.producto || 'SIN PRODUCTO',
        ventas_toneladas: Number(v.ventas_toneladas || 0),
        ventas_facturacion: Number(v.ventas_facturacion || 0),
        [vCol]: v.periodo_mes || targetPeriod
      }));
      for (let i = 0; i < vRows.length; i += 200) {
        const chunk = vRows.slice(i, i + 200);
        const { error } = await client.from(ventasTable).insert(chunk);
        if (error) console.warn('Supabase insert ventas chunk notice:', error.message);
      }
    }

    // 3. Insert Objetivos in chunks of 200
    if (objetivos.length > 0) {
      const oRows = objetivos.map(o => ({
        zona: o.zona || 'SIN ZONA',
        supervisor: o.supervisor || 'SIN SUPERVISOR',
        codigo_ruta: o.codigo_ruta || 'SIN RUTA',
        vendedor: o.vendedor || 'SIN VENDEDOR',
        producto: o.producto || 'SIN PRODUCTO',
        toneladas: Number(o.toneladas || 0),
        facturacion: Number(o.facturacion || 0),
        [oCol]: o.periodo_mes || targetPeriod
      }));
      for (let i = 0; i < oRows.length; i += 200) {
        const chunk = oRows.slice(i, i + 200);
        const { error } = await client.from(objetivosTable).insert(chunk);
        if (error) console.warn('Supabase insert objetivos chunk notice:', error.message);
      }
    }

    // 4. Insert Cobertura in chunks of 200
    if (cobertura.length > 0) {
      const cRows = cobertura.map(c => ({
        zona: c.zona || 'SIN ZONA',
        supervisor: c.supervisor || 'SIN SUPERVISOR',
        codigo_ruta: c.codigo_ruta || 'SIN RUTA',
        vendedor: c.vendedor || 'SIN VENDEDOR',
        [coberturaTable === 'com_cobertura' ? 'cobertura' : 'cobertura_planificada']: Number(c.cobertura_planificada || 0),
        clientes_reales: Number(c.clientes_reales || 0),
        [cCol]: c.periodo_mes || targetPeriod
      }));
      for (let i = 0; i < cRows.length; i += 200) {
        const chunk = cRows.slice(i, i + 200);
        const { error } = await client.from(coberturaTable).insert(chunk);
        if (error) console.warn('Supabase insert cobertura chunk notice:', error.message);
      }
    }

    // 5. Insert Batch and Audit records
    try {
      if (batchTable === 'com_import_batches') {
        await client.from(batchTable).insert([{
          id: batch.id,
          filename: batch.filename,
          uploaded_at: batch.created_at,
          uploaded_by: batch.created_by,
          mode: batch.tipo_operacion === 'replace' ? 'replace_period' : 'append',
          period: targetPeriod,
          records_count: {
            ventas: batch.registros_ventas,
            objetivos: batch.registros_objetivos,
            cobertura: batch.registros_cobertura
          },
          status: 'success',
          error_summary: batch.notas
        }]);
      } else {
        await client.from(batchTable).insert([{
          filename: batch.filename,
          periodos_detectados: [targetPeriod],
          fuentes_incluidas: batch.fuentes_incluidas,
          tipo_operacion: batch.tipo_operacion,
          registros_objetivos: batch.registros_objetivos,
          registros_ventas: batch.registros_ventas,
          registros_cobertura: batch.registros_cobertura,
          status: 'completado',
          created_by: batch.created_by,
          duration_ms: batch.duration_ms,
          notas: batch.notas
        }]);
      }

      if (auditTable === 'com_audit_logs') {
        await client.from(auditTable).insert([{
          timestamp: audit.created_at,
          action: audit.action,
          user_id: audit.user_email,
          details: audit.details,
          status: 'success'
        }]);
      } else {
        await client.from(auditTable).insert([{
          action: audit.action,
          details: audit.details,
          user_email: audit.user_email,
          user_role: audit.user_role,
          periodo_afectado: targetPeriod,
          created_at: audit.created_at
        }]);
      }
    } catch (logErr) {
      console.warn('Batch/audit log remote insert notice:', logErr);
    }

    return {
      success: true,
      message: `Sincronizados en Supabase: ${ventas.length} ventas, ${objetivos.length} objetivos, ${cobertura.length} cobertura para ${targetPeriod}.`,
      counts: {
        ventas: ventas.length,
        objetivos: objetivos.length,
        cobertura: cobertura.length
      }
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Error in syncImportedRecordsToSupabase:', err);
    return {
      success: false,
      message: `Error al sincronizar con Supabase: ${errorMsg}`
    };
  }
}

/**
 * Synchronizes the entire CURRENT database state (all real periods, ventas, objetivos, cobertura)
 * into Supabase PostgreSQL, completely replacing whatever is in cloud with the live dashboard state.
 */
export async function syncCurrentDatabaseToSupabase(currentState: DatabaseState): Promise<{
  success: boolean;
  message: string;
  counts?: { ventas: number; objetivos: number; cobertura: number };
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase no está conectado.' };
  }

  try {
    const { ventasTable, objetivosTable, coberturaTable } = await resolveCommercialTables(client);

    const vCol = ventasTable === 'com_ventas' ? 'mes' : 'periodo_mes';
    const oCol = objetivosTable === 'com_objetivos' ? 'mes' : 'periodo_mes';
    const cCol = coberturaTable === 'com_cobertura' ? 'mes' : 'periodo_mes';

    // 1. Clear remote tables first to mirror the current database
    try {
      await client.from(ventasTable).delete().not('id', 'is', null);
      await client.from(objetivosTable).delete().not('id', 'is', null);
      await client.from(coberturaTable).delete().not('id', 'is', null);
    } catch (delErr) {
      console.warn('Notice clearing remote tables:', delErr);
    }

    // 2. Upload all current Ventas in chunks of 200
    const vRows = currentState.ventas.map(v => ({
      zona: v.zona || 'SIN ZONA',
      supervisor: v.supervisor || 'SIN SUPERVISOR',
      codigo_ruta: v.codigo_ruta || 'SIN RUTA',
      vendedor: v.vendedor || 'SIN VENDEDOR',
      producto: v.producto || 'SIN PRODUCTO',
      ventas_toneladas: Number(v.ventas_toneladas || 0),
      ventas_facturacion: Number(v.ventas_facturacion || 0),
      [vCol]: v.periodo_mes
    }));
    for (let i = 0; i < vRows.length; i += 200) {
      const chunk = vRows.slice(i, i + 200);
      const { error } = await client.from(ventasTable).insert(chunk);
      if (error) throw new Error(`Ventas: ${error.message}`);
    }

    // 3. Upload all current Objetivos in chunks of 200
    const oRows = currentState.objetivos.map(o => ({
      zona: o.zona || 'SIN ZONA',
      supervisor: o.supervisor || 'SIN SUPERVISOR',
      codigo_ruta: o.codigo_ruta || 'SIN RUTA',
      vendedor: o.vendedor || 'SIN VENDEDOR',
      producto: o.producto || 'SIN PRODUCTO',
      toneladas: Number(o.toneladas || 0),
      facturacion: Number(o.facturacion || 0),
      [oCol]: o.periodo_mes
    }));
    for (let i = 0; i < oRows.length; i += 200) {
      const chunk = oRows.slice(i, i + 200);
      const { error } = await client.from(objetivosTable).insert(chunk);
      if (error) throw new Error(`Objetivos: ${error.message}`);
    }

    // 4. Upload all current Cobertura in chunks of 200
    const cRows = currentState.cobertura.map(c => ({
      zona: c.zona || 'SIN ZONA',
      supervisor: c.supervisor || 'SIN SUPERVISOR',
      codigo_ruta: c.codigo_ruta || 'SIN RUTA',
      vendedor: c.vendedor || 'SIN VENDEDOR',
      [coberturaTable === 'com_cobertura' ? 'cobertura' : 'cobertura_planificada']: Number(c.cobertura_planificada || 0),
      clientes_reales: Number(c.clientes_reales || 0),
      [cCol]: c.periodo_mes
    }));
    for (let i = 0; i < cRows.length; i += 200) {
      const chunk = cRows.slice(i, i + 200);
      const { error } = await client.from(coberturaTable).insert(chunk);
      if (error) throw new Error(`Cobertura: ${error.message}`);
    }

    return {
      success: true,
      message: `Sincronización completa exitosa: ${vRows.length} ventas, ${oRows.length} objetivos y ${cRows.length} coberturas respaldados en Supabase PostgreSQL.`,
      counts: {
        ventas: vRows.length,
        objetivos: oRows.length,
        cobertura: cRows.length
      }
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Error al sincronizar base de datos actual con Supabase: ${errorMsg}`
    };
  }
}

/**
 * Downloads and restores the full commercial database directly from Supabase PostgreSQL
 * into the local application state.
 */
export async function pullDatabaseFromSupabase(): Promise<{
  success: boolean;
  message: string;
  data?: {
    ventas: VentaRecord[];
    objetivos: ObjetivoRecord[];
    cobertura: CoberturaRecord[];
  };
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase no está configurado.' };
  }

  try {
    const { ventasTable, objetivosTable, coberturaTable } = await resolveCommercialTables(client);

    const { data: vData, error: vErr } = await client.from(ventasTable).select('*').range(0, 9999);
    if (vErr) throw new Error(`Error descargando ventas: ${vErr.message}`);

    const { data: oData, error: oErr } = await client.from(objetivosTable).select('*').range(0, 9999);
    if (oErr) throw new Error(`Error descargando objetivos: ${oErr.message}`);

    const { data: cData, error: cErr } = await client.from(coberturaTable).select('*').range(0, 9999);
    if (cErr) throw new Error(`Error descargando cobertura: ${cErr.message}`);

    const ventas: VentaRecord[] = (vData || []).map((row: any, idx: number) => ({
      id: row.id || `v_pull_${idx}`,
      periodo_mes: row.periodo_mes || row.mes || 'sept-26',
      zona: row.zona || 'SIN ZONA',
      supervisor: row.supervisor || 'SIN SUPERVISOR',
      codigo_ruta: row.codigo_ruta || 'SIN RUTA',
      vendedor: row.vendedor || 'SIN VENDEDOR',
      producto: row.producto || 'SIN PRODUCTO',
      ventas_toneladas: Number(row.ventas_toneladas || 0),
      ventas_facturacion: Number(row.ventas_facturacion || 0),
      import_batch_id: row.import_batch_id || 'batch_supabase_cloud',
      created_at: row.created_at || new Date().toISOString()
    }));

    const objetivos: ObjetivoRecord[] = (oData || []).map((row: any, idx: number) => ({
      id: row.id || `obj_pull_${idx}`,
      periodo_mes: row.periodo_mes || row.mes || 'sept-26',
      zona: row.zona || 'SIN ZONA',
      supervisor: row.supervisor || 'SIN SUPERVISOR',
      codigo_ruta: row.codigo_ruta || 'SIN RUTA',
      vendedor: row.vendedor || 'SIN VENDEDOR',
      producto: row.producto || 'SIN PRODUCTO',
      toneladas: Number(row.toneladas || 0),
      facturacion: Number(row.facturacion || 0),
      import_batch_id: row.import_batch_id || 'batch_supabase_cloud',
      created_at: row.created_at || new Date().toISOString()
    }));

    const cobertura: CoberturaRecord[] = (cData || []).map((row: any, idx: number) => ({
      id: row.id || `cob_pull_${idx}`,
      periodo_mes: row.periodo_mes || row.mes || 'sept-26',
      zona: row.zona || 'SIN ZONA',
      supervisor: row.supervisor || 'SIN SUPERVISOR',
      codigo_ruta: row.codigo_ruta || 'SIN RUTA',
      vendedor: row.vendedor || 'SIN VENDEDOR',
      cobertura_planificada: Number(row.cobertura_planificada || row.cobertura || 0),
      clientes_reales: Number(row.clientes_reales || 0),
      import_batch_id: row.import_batch_id || 'batch_supabase_cloud',
      created_at: row.created_at || new Date().toISOString()
    }));

    return {
      success: true,
      message: `Se descargaron exitosamente desde Supabase: ${ventas.length} ventas, ${objetivos.length} objetivos y ${cobertura.length} coberturas.`,
      data: { ventas, objetivos, cobertura }
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Error al descargar datos de Supabase: ${errorMsg}`
    };
  }
}

/**
 * Seeds or restores the baseline sample dataset (Demo) into Supabase PostgreSQL
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
    const { ventasTable, objetivosTable, coberturaTable } = await resolveCommercialTables(client);

    const vCol = ventasTable === 'com_ventas' ? 'mes' : 'periodo_mes';
    const oCol = objetivosTable === 'com_objetivos' ? 'mes' : 'periodo_mes';
    const cCol = coberturaTable === 'com_cobertura' ? 'mes' : 'periodo_mes';

    // 1. Batch insert Objetivos in chunks of 200
    const objRows = INITIAL_OBJETIVOS.map(o => ({
      zona: o.zona,
      supervisor: o.supervisor,
      codigo_ruta: o.codigo_ruta,
      vendedor: o.vendedor,
      producto: o.producto,
      toneladas: o.toneladas,
      facturacion: o.facturacion,
      [oCol]: o.periodo_mes
    }));

    for (let i = 0; i < objRows.length; i += 200) {
      const chunk = objRows.slice(i, i + 200);
      const { error } = await client.from(objetivosTable).insert(chunk);
      if (error) console.warn('Error inserting objetivos chunk:', error.message);
    }

    // 2. Batch insert Ventas in chunks of 200
    const ventasRows = INITIAL_VENTAS.map(v => ({
      zona: v.zona,
      supervisor: v.supervisor,
      codigo_ruta: v.codigo_ruta,
      vendedor: v.vendedor,
      producto: v.producto,
      ventas_toneladas: v.ventas_toneladas,
      ventas_facturacion: v.ventas_facturacion,
      [vCol]: v.periodo_mes
    }));

    for (let i = 0; i < ventasRows.length; i += 200) {
      const chunk = ventasRows.slice(i, i + 200);
      const { error } = await client.from(ventasTable).insert(chunk);
      if (error) console.warn('Error inserting ventas chunk:', error.message);
    }

    // 3. Batch insert Cobertura in chunks of 200
    const cobRows = INITIAL_COBERTURA.map(c => ({
      zona: c.zona,
      supervisor: c.supervisor,
      codigo_ruta: c.codigo_ruta,
      vendedor: c.vendedor,
      [coberturaTable === 'com_cobertura' ? 'cobertura' : 'cobertura_planificada']: c.cobertura_planificada,
      clientes_reales: c.clientes_reales,
      [cCol]: c.periodo_mes
    }));

    for (let i = 0; i < cobRows.length; i += 200) {
      const chunk = cobRows.slice(i, i + 200);
      const { error } = await client.from(coberturaTable).insert(chunk);
      if (error) console.warn('Error inserting cobertura chunk:', error.message);
    }

    return {
      success: true,
      message: `Dataset demo poblado en Supabase: ${ventasRows.length} ventas, ${objRows.length} objetivos y ${cobRows.length} registros de cobertura sincronizados.`,
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
      message: `Error al poblar datos demo en Supabase: ${errorMsg}`
    };
  }
}

/**
 * Asynchronously pushes audit, batch, and commercial records to Supabase when connected
 */
async function syncToSupabaseIfConnected(
  batch: ImportBatch,
  audit: AuditLog,
  extra?: {
    mode: 'append' | 'replace';
    targetPeriod: string;
    ventas: VentaRecord[];
    objetivos: ObjetivoRecord[];
    cobertura: CoberturaRecord[];
    fuentesToReplace?: ('objetivos' | 'ventas' | 'cobertura')[];
  }
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    if (extra) {
      await syncImportedRecordsToSupabase(
        batch,
        audit,
        extra.mode,
        extra.targetPeriod,
        extra.ventas,
        extra.objetivos,
        extra.cobertura,
        extra.fuentesToReplace
      );
    } else {
      const { batchTable, auditTable } = await resolveCommercialTables(client);
      if (batchTable === 'com_import_batches') {
        await client.from(batchTable).insert([{
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
        }]);
      }
      if (auditTable === 'com_audit_logs') {
        await client.from(auditTable).insert([{
          timestamp: audit.created_at,
          action: audit.action,
          user_id: audit.user_email,
          details: audit.details,
          status: 'success'
        }]);
      }
    }
  } catch (err) {
    console.warn('Supabase remote sync notice:', err);
  }
}

/**
 * Restores baseline objectives for the given period (or sept-26 template)
 * without touching other months or sales/coverage tables.
 */
export function restoreBaselineObjetivos(
  currentState: DatabaseState,
  targetPeriod = 'sept-26'
): { updatedState: DatabaseState; restoredCount: number } {
  if (currentState.currentUser.role !== 'admin') {
    throw new Error('Solo el administrador puede restaurar objetivos.');
  }

  const templateObj = INITIAL_OBJETIVOS.filter(o => o.periodo_mes === 'sept-26');
  const restoredRecords: ObjetivoRecord[] = templateObj.map((o, idx) => ({
    ...o,
    id: `obj_restored_${Date.now()}_${idx}`,
    periodo_mes: targetPeriod,
    import_batch_id: 'batch_restored_obj'
  }));

  // Filter out any existing corrupted/partial records for targetPeriod and insert clean baseline
  const otherObj = currentState.objetivos.filter(o => o.periodo_mes !== targetPeriod);
  const updatedObjList = [...otherObj, ...restoredRecords];

  const batchId = 'batch_restore_obj_' + Date.now();
  const newAudit: AuditLog = {
    id: 'audit_' + Date.now(),
    batch_id: batchId,
    action: 'IMPORT_APPEND',
    details: `Restauración de ${restoredRecords.length} registros de presupuesto/objetivos para el período ${targetPeriod} ejecutada por ${currentState.currentUser.email}.`,
    user_email: currentState.currentUser.email,
    user_role: currentState.currentUser.role,
    created_at: new Date().toISOString(),
    periodo_afectado: targetPeriod
  };

  const updatedState: DatabaseState = {
    ...currentState,
    objetivos: updatedObjList,
    auditLogs: [newAudit, ...currentState.auditLogs]
  };

  saveDatabase(updatedState);
  return { updatedState, restoredCount: restoredRecords.length };
}

