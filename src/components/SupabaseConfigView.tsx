import React, { useState, useEffect } from 'react';
import {
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
  SupabaseHealthCheck
} from '../services/supabaseClient';
import { SUPABASE_SQL_SCHEMA } from '../services/sqlGenerator';
import {
  seedSupabaseInitialData,
  clearSupabaseTables,
  syncCurrentDatabaseToSupabase,
  pullDatabaseFromSupabase,
  saveDatabase,
  DatabaseState
} from '../services/dbStore';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ExternalLink,
  Shield,
  Key,
  Globe,
  GitBranch,
  Terminal,
  FileCode,
  BookOpen,
  UploadCloud,
  Download,
  Trash2,
  RefreshCw
} from 'lucide-react';

interface SupabaseConfigViewProps {
  dbState?: DatabaseState;
  onUpdateDbState?: (newState: DatabaseState) => void;
  onConnectionStatusChange?: (connected: boolean) => void;
}

export const SupabaseConfigView: React.FC<SupabaseConfigViewProps> = ({
  dbState,
  onUpdateDbState,
  onConnectionStatusChange
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSyncingCurrent, setIsSyncingCurrent] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isClearingRemote, setIsClearingRemote] = useState(false);
  const [seedResult, setSeedResult] = useState<{ success: boolean; message: string } | null>(null);
  const [health, setHealth] = useState<SupabaseHealthCheck | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedTruncateSql, setCopiedTruncateSql] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'sql' | 'supabase' | 'vercel' | 'github'>('sql');

  useEffect(() => {
    const cfg = getStoredSupabaseConfig();
    setUrl(cfg.url);
    setAnonKey(cfg.anonKey);
    if (cfg.url && cfg.anonKey) {
      handleTest(cfg.url, cfg.anonKey);
    }
  }, []);

  const handleSave = () => {
    saveSupabaseConfig(url, anonKey);
    handleTest(url, anonKey);
  };

  const handleClear = () => {
    clearSupabaseConfig();
    setUrl('');
    setAnonKey('');
    setHealth(null);
    onConnectionStatusChange?.(false);
  };

  const handleTest = async (testUrl?: string, testKey?: string) => {
    setIsTesting(true);
    if (testUrl && testKey) {
      saveSupabaseConfig(testUrl, testKey);
    }
    const result = await testSupabaseConnection();
    setHealth(result);
    setIsTesting(false);
    onConnectionStatusChange?.(result.connected);
  };

  const handleSyncCurrentDb = async () => {
    if (!dbState) return;
    setIsSyncingCurrent(true);
    setSeedResult(null);
    const res = await syncCurrentDatabaseToSupabase(dbState);
    setSeedResult(res);
    setIsSyncingCurrent(false);
  };

  const handlePullFromSupabase = async () => {
    setIsPulling(true);
    setSeedResult(null);
    const res = await pullDatabaseFromSupabase();
    if (res.success && res.data && onUpdateDbState && dbState) {
      const newState: DatabaseState = {
        ...dbState,
        ventas: res.data.ventas,
        objetivos: res.data.objetivos,
        cobertura: res.data.cobertura
      };
      onUpdateDbState(newState);
      saveDatabase(newState);
    }
    setSeedResult({
      success: res.success,
      message: res.message
    });
    setIsPulling(false);
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    setSeedResult(null);
    const res = await seedSupabaseInitialData();
    setSeedResult(res);
    setIsSeeding(false);
  };

  const handleClearRemote = async () => {
    if (!confirm('¿Confirma que desea vaciar todas las filas de prueba en las tablas de Supabase (com_ventas, com_objetivos, com_cobertura)?')) {
      return;
    }
    setIsClearingRemote(true);
    setSeedResult(null);
    const res = await clearSupabaseTables();
    setSeedResult(res);
    setIsClearingRemote(false);
  };

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const copyTruncateSql = () => {
    navigator.clipboard.writeText('TRUNCATE TABLE com_ventas, com_objetivos, com_cobertura, com_import_batches RESTART IDENTITY CASCADE;');
    setCopiedTruncateSql(true);
    setTimeout(() => setCopiedTruncateSql(false), 2500);
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Top Banner */}
      <div className="rounded-lg border border-[#374151] bg-[#1F2937] p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[#374151]">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#9CA3AF]">
              <span>Backend de Datos en la Nube</span>
              <span>/</span>
              <span className="text-[#3B82F6] font-semibold">PostgreSQL & RLS</span>
            </div>
            <h2 className="mt-1 text-base font-bold text-[#F9FAFB]">
              Conexión Supabase PostgreSQL & Despliegue en Producción
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${
                health?.connected
                  ? 'border-[#14B8A6]/40 bg-[#14B8A6]/10 text-[#14B8A6]'
                  : 'border-[#374151] bg-[#111827] text-[#9CA3AF]'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  health?.connected ? 'bg-[#14B8A6] animate-pulse' : 'bg-[#6B7280]'
                }`}
              />
              {health?.connected ? 'Conectado a Supabase' : 'Modo Persistente Local'}
            </span>
          </div>
        </div>

        {/* Credentials Form */}
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">
              SUPABASE PROJECT URL
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
              <input
                type="text"
                placeholder="https://xyzproject.supabase.co"
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="h-8 w-full rounded-md border border-[#374151] bg-[#111827] pl-9 pr-3 text-xs text-[#F9FAFB] placeholder:text-[#6B7280] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] focus:outline-hidden"
              />
            </div>
            <p className="mt-1 text-[11px] text-[#6B7280]">
              Project Settings → API → Project URL
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">
              SUPABASE ANON / PUBLIC KEY
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={e => setAnonKey(e.target.value)}
                className="h-8 w-full rounded-md border border-[#374151] bg-[#111827] pl-9 pr-3 text-xs text-[#F9FAFB] placeholder:text-[#6B7280] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] focus:outline-hidden"
              />
            </div>
            <p className="mt-1 text-[11px] text-[#6B7280]">
              Clave pública (Project Settings → API → anon public)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#374151]">
          <div className="text-[11px] text-[#9CA3AF]">
            Configurable vía variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.
          </div>

          <div className="flex items-center gap-2">
            {url && (
              <button
                onClick={handleClear}
                className="px-3 py-1.5 text-xs text-[#9CA3AF] hover:text-[#EF4444] transition-colors"
              >
                Desconectar
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isTesting || !url || !anonKey}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold shadow-xs transition-colors ${
                !url || !anonKey
                  ? 'border border-[#374151] bg-[#243042] text-[#6B7280] cursor-not-allowed'
                  : 'bg-[#3B82F6] text-white hover:bg-[#2563EB]'
              }`}
            >
              {isTesting ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Probando Conexión...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Guardar y Probar Conexión
                </>
              )}
            </button>
          </div>
        </div>

        {/* Health Test Result */}
        {health && (
          <div
            className={`mt-4 rounded-lg border p-4 text-xs ${
              health.connected
                ? 'border-[#14B8A6]/40 bg-[#14B8A6]/10 text-[#14B8A6]'
                : 'border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#F59E0B]'
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-1">
              {health.connected ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              {health.connected ? 'Diagnóstico de Conexión: Exitoso' : 'Diagnóstico de Conexión'}
            </div>
            <p className="text-slate-200">{health.message}</p>

            {health.tablesFound && (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 pt-2 border-t border-[#374151] text-xs">
                <div>
                  comercial_ventas:{' '}
                  <strong className={health.tablesFound.ventas ? 'text-[#14B8A6]' : 'text-[#EF4444]'}>
                    {health.tablesFound.ventas ? '✓ Detectada' : '✗ No existe en Supabase'}
                  </strong>
                </div>
                <div>
                  comercial_objetivos:{' '}
                  <strong className={health.tablesFound.objetivos ? 'text-[#14B8A6]' : 'text-[#EF4444]'}>
                    {health.tablesFound.objetivos ? '✓ Detectada' : '✗ No existe en Supabase'}
                  </strong>
                </div>
                <div>
                  comercial_cobertura:{' '}
                  <strong className={health.tablesFound.cobertura ? 'text-[#14B8A6]' : 'text-[#EF4444]'}>
                    {health.tablesFound.cobertura ? '✓ Detectada' : '✗ No existe en Supabase'}
                  </strong>
                </div>
              </div>
            )}

            {/* ACTION BANNER IF TABLES ARE MISSING */}
            {health.connected && (!health.tablesFound?.ventas || !health.tablesFound?.objetivos) && (
              <div className="mt-4 rounded-lg border border-[#F59E0B]/50 bg-[#F59E0B]/10 p-4 text-xs text-[#F59E0B] space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Paso Requerido: Crear las Tablas en Supabase</span>
                </div>
                <p className="text-slate-200 text-xs leading-relaxed">
                  La conexión a Supabase es válida, pero la base de datos PostgreSQL aún no tiene creadas las tablas comerciales (<strong>comercial_ventas</strong>, <strong>comercial_objetivos</strong>, etc.).
                </p>
                <div className="text-slate-300 text-xs space-y-1 bg-[#111827] p-3 rounded-md border border-[#374151]">
                  <p><strong>Pasos para solucionar en 1 minuto:</strong></p>
                  <p>1. Haga clic en el botón azul abajo para <strong>Copiar el Script SQL</strong>.</p>
                  <p>2. Vaya a su proyecto en <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-[#3B82F6] underline font-bold">Supabase Dashboard</a> → menú izquierdo <strong>SQL Editor</strong> → <strong>New Query</strong>.</p>
                  <p>3. Pegue el script y haga clic en <strong>Run</strong>.</p>
                  <p>4. Regrese aquí y haga clic en <strong>"Guardar y Probar Conexión"</strong>.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={copySqlToClipboard}
                    className="inline-flex items-center gap-1.5 rounded-md bg-[#3B82F6] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2563EB] transition-colors cursor-pointer shadow-xs"
                  >
                    <Copy className="h-4 w-4" />
                    {copiedSql ? '✓ ¡Script SQL Copiado al Portapapeles!' : 'Copiar Script SQL Completo'}
                  </button>
                  <button
                    onClick={() => handleTest()}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[#374151] bg-[#111827] px-3.5 py-2 text-xs font-semibold text-[#F9FAFB] hover:border-[#3B82F6] transition-colors cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-[#3B82F6]" />
                    Re-verificar Tablas
                  </button>
                </div>
              </div>
            )}

            {health.connected && (
              <div className="mt-4 pt-3 border-t border-[#374151] space-y-3">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="text-xs text-[#9CA3AF]">
                      <strong>Sincronización Cloud:</strong> Respalde en Supabase sus datos reales o cárguelos hacia el Dashboard en cualquier dispositivo.
                    </div>
                    {dbState && (
                      <span className="text-[11px] text-[#14B8A6] font-mono">
                        Base Local: {dbState.ventas.length} ventas · {dbState.objetivos.length} obj · {dbState.cobertura.length} cob
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Sync Current State to Supabase */}
                    <button
                      onClick={handleSyncCurrentDb}
                      disabled={isSyncingCurrent || isPulling || isClearingRemote || !health.tablesFound?.ventas}
                      className={`shrink-0 inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold transition-colors ${
                        !health.tablesFound?.ventas
                          ? 'border border-[#374151] bg-[#243042] text-[#6B7280] cursor-not-allowed'
                          : 'bg-[#3B82F6] text-white hover:bg-[#2563EB] cursor-pointer shadow-xs'
                      }`}
                      title={!health.tablesFound?.ventas ? 'Primero debe crear las tablas ejecutando el script SQL en Supabase' : 'Sincronizar todos los registros actuales hacia Supabase PostgreSQL'}
                    >
                      {isSyncingCurrent ? (
                        <>
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Sincronizando a la Nube...
                        </>
                      ) : (
                        <>
                          <UploadCloud className="h-4 w-4" />
                          Sincronizar Base de Datos a Supabase
                        </>
                      )}
                    </button>

                    {/* Pull from Supabase */}
                    <button
                      onClick={handlePullFromSupabase}
                      disabled={isPulling || isSyncingCurrent || isClearingRemote || !health.tablesFound?.ventas}
                      className={`shrink-0 inline-flex items-center gap-2 rounded-md border border-[#374151] bg-[#111827] px-3.5 py-2 text-xs font-semibold transition-colors ${
                        !health.tablesFound?.ventas
                          ? 'text-[#6B7280] cursor-not-allowed'
                          : 'text-[#9CA3AF] hover:text-[#F9FAFB] hover:border-[#4B5563] cursor-pointer'
                      }`}
                      title={!health.tablesFound?.ventas ? 'Primero debe crear las tablas en Supabase' : 'Descargar datos desde Supabase PostgreSQL y restaurarlos en el Dashboard local'}
                    >
                      {isPulling ? (
                        <>
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Descargando...
                        </>
                      ) : (
                        <>
                          <Download className="h-3.5 w-3.5" />
                          Descargar Datos desde Supabase
                        </>
                      )}
                    </button>

                    {/* Clear remote tables */}
                    <button
                      onClick={handleClearRemote}
                      disabled={isClearingRemote || isSeeding || isSyncingCurrent || isPulling}
                      className="shrink-0 inline-flex items-center gap-2 rounded-md border border-[#EF4444]/40 bg-[#EF4444]/10 px-3.5 py-2 text-xs font-semibold text-[#EF4444] hover:bg-[#EF4444]/20 transition-colors disabled:opacity-50 cursor-pointer"
                      title="Eliminar todas las filas en las tablas comerciales de Supabase"
                    >
                      {isClearingRemote ? (
                        <>
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#EF4444] border-t-transparent" />
                          Vaciando tablas...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-3.5 w-3.5" />
                          Vaciar Tablas Remotas
                        </>
                      )}
                    </button>
                  </div>

                  {/* Secondary Demo Dataset Seed */}
                  <div className="pt-2 border-t border-[#374151]/50 flex items-center justify-between text-xs text-[#9CA3AF]">
                    <span>¿Desea poblar datos de prueba demo en la nube?</span>
                    <button
                      onClick={handleSeed}
                      disabled={isSeeding || isSyncingCurrent || isPulling}
                      className="inline-flex items-center gap-1.5 text-xs text-[#9CA3AF] hover:text-[#F9FAFB] underline cursor-pointer"
                    >
                      <RefreshCw className="h-3 w-3" />
                      {isSeeding ? 'Poblando demo...' : 'Restaurar Dataset Demo en Supabase'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {seedResult && (
              <div
                className={`mt-3 p-3 rounded-md text-xs border ${
                  seedResult.success
                    ? 'border-[#14B8A6]/50 bg-[#14B8A6]/10 text-[#14B8A6]'
                    : 'border-[#EF4444]/50 bg-[#EF4444]/10 text-[#EF4444]'
                }`}
              >
                {seedResult.message}
              </div>
            )}
          </div>
        )}
      </div>

      {/* GUIDES AND SQL SCRIPT TABS */}
      <div className="rounded-lg border border-[#374151] bg-[#1F2937] p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-[#374151]">
          <button
            onClick={() => setActiveGuideTab('sql')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeGuideTab === 'sql'
                ? 'border border-[#3B82F6]/50 bg-[#3B82F6]/15 text-[#3B82F6]'
                : 'border border-[#374151] bg-[#111827] text-[#9CA3AF] hover:text-[#F9FAFB] hover:border-[#4B5563]'
            }`}
          >
            <FileCode className="h-4 w-4" />
            Script SQL Completo (PostgreSQL + RLS)
          </button>
          <button
            onClick={() => setActiveGuideTab('supabase')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeGuideTab === 'supabase'
                ? 'border border-[#3B82F6]/50 bg-[#3B82F6]/15 text-[#3B82F6]'
                : 'border border-[#374151] bg-[#111827] text-[#9CA3AF] hover:text-[#F9FAFB] hover:border-[#4B5563]'
            }`}
          >
            <Database className="h-4 w-4" />
            Guía de Configuración en Supabase
          </button>
          <button
            onClick={() => setActiveGuideTab('vercel')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeGuideTab === 'vercel'
                ? 'border border-[#3B82F6]/50 bg-[#3B82F6]/15 text-[#3B82F6]'
                : 'border border-[#374151] bg-[#111827] text-[#9CA3AF] hover:text-[#F9FAFB] hover:border-[#4B5563]'
            }`}
          >
            <Globe className="h-4 w-4" />
            Despliegue en Vercel
          </button>
          <button
            onClick={() => setActiveGuideTab('github')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeGuideTab === 'github'
                ? 'border border-[#3B82F6]/50 bg-[#3B82F6]/15 text-[#3B82F6]'
                : 'border border-[#374151] bg-[#111827] text-[#9CA3AF] hover:text-[#F9FAFB] hover:border-[#4B5563]'
            }`}
          >
            <GitBranch className="h-4 w-4" />
            Control con GitHub
          </button>
        </div>

        {/* TAB 1: SQL SCHEMA */}
        {activeGuideTab === 'sql' && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#F9FAFB]">
                  Script DDL de Tablas, Claves Únicas, RLS y Triggers
                </h3>
                <p className="text-[11px] text-[#9CA3AF]">
                  Copie y ejecute este script en el SQL Editor de su proyecto Supabase.
                </p>
              </div>

              <button
                onClick={copySqlToClipboard}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#3B82F6] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#2563EB] transition-colors shadow-sm cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5" />
                {copiedSql ? '¡Copiado!' : 'Copiar Script SQL'}
              </button>
            </div>

            <div className="relative max-h-96 overflow-y-auto rounded-md border border-[#374151] bg-[#111827] p-4 text-[11px] font-mono text-[#38BDF8]">
              <pre>{SUPABASE_SQL_SCHEMA}</pre>
            </div>

            {/* Truncate / Clear Query Box */}
            <div className="rounded-md border border-[#EF4444]/30 bg-[#111827] p-3.5 mt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4 text-[#EF4444]" />
                  <span className="font-semibold text-xs text-[#F9FAFB]">
                    Comando SQL para vaciar datos de prueba en Supabase
                  </span>
                </div>
                <button
                  onClick={copyTruncateSql}
                  className="inline-flex items-center gap-1 rounded border border-[#EF4444]/40 bg-[#EF4444]/10 px-2.5 py-1 text-xs font-medium text-[#EF4444] hover:bg-[#EF4444]/20 cursor-pointer transition-colors"
                >
                  <Copy className="h-3 w-3" />
                  {copiedTruncateSql ? '¡Copiado!' : 'Copiar TRUNCATE'}
                </button>
              </div>
              <p className="text-[11px] text-[#9CA3AF] mb-2">
                Si desea vaciar las tablas directamente desde el SQL Editor de Supabase sin eliminar las políticas ni la estructura:
              </p>
              <pre className="text-xs text-[#EF4444] bg-[#1F2937] p-2.5 rounded border border-[#374151] overflow-x-auto font-mono">
TRUNCATE TABLE com_ventas, com_objetivos, com_cobertura, com_import_batches RESTART IDENTITY CASCADE;
              </pre>
            </div>
          </div>
        )}

        {/* TAB 2: SUPABASE GUIDE */}
        {activeGuideTab === 'supabase' && (
          <div className="mt-4 space-y-3 text-xs text-[#D1D5DB] leading-relaxed">
            <div className="rounded-md border border-[#374151] bg-[#111827] p-3.5">
              <strong className="text-[#F9FAFB]">1. Crear Proyecto en Supabase:</strong>
              <p className="mt-1 text-[#9CA3AF]">
                Ingrese a <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-[#3B82F6] hover:underline">supabase.com</a> y cree su proyecto comercial (ej. <em>comercial-prod</em>). Seleccione la región <em>São Paulo (sa-east-1)</em> para optimizar la latencia en Paraguay y Sudamérica.
              </p>
            </div>

            <div className="rounded-md border border-[#374151] bg-[#111827] p-3.5">
              <strong className="text-[#F9FAFB]">2. Ejecutar el Script SQL:</strong>
              <p className="mt-1 text-[#9CA3AF]">
                En el menú lateral de Supabase, seleccione <strong>SQL Editor</strong> → <strong>New Query</strong>. Pegue el script de la pestaña anterior y ejecútelo con <strong>Run</strong>.
              </p>
            </div>

            <div className="rounded-md border border-[#374151] bg-[#111827] p-3.5">
              <strong className="text-[#F9FAFB]">3. Conectar Credenciales:</strong>
              <p className="mt-1 text-[#9CA3AF]">
                Copie <code>Project URL</code> y <code>Project API Key (anon/public)</code> desde Project Settings → API e ingréselas en el panel superior.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: VERCEL GUIDE */}
        {activeGuideTab === 'vercel' && (
          <div className="mt-4 space-y-3 text-xs text-[#D1D5DB] leading-relaxed">
            <div className="rounded-md border border-[#374151] bg-[#111827] p-3.5">
              <strong className="text-[#F9FAFB]">1. Variables de Entorno en Vercel:</strong>
              <div className="mt-2 rounded border border-[#374151] bg-[#1F2937] p-2.5 font-mono text-[#38BDF8] space-y-1">
                <div>VITE_SUPABASE_URL=https://su-proyecto.supabase.co</div>
                <div>VITE_SUPABASE_ANON_KEY=su_clave_anonima_publica</div>
              </div>
            </div>

            <div className="rounded-md border border-[#374151] bg-[#111827] p-3.5">
              <strong className="text-[#F9FAFB]">2. Parámetros de Compilación:</strong>
              <ul className="mt-1 list-disc list-inside text-[#9CA3AF]">
                <li>Framework Preset: <strong>Vite</strong></li>
                <li>Build Command: <code>npm run build</code></li>
                <li>Output Directory: <code>dist</code></li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 4: GITHUB GUIDE */}
        {activeGuideTab === 'github' && (
          <div className="mt-4 rounded-md border border-[#374151] bg-[#111827] p-4 text-xs">
            <p className="text-[#9CA3AF] mb-2">Comandos Git para inicializar el repositorio:</p>
            <div className="rounded border border-[#374151] bg-[#1F2937] p-3 font-mono text-[#38BDF8] space-y-1">
              <div>git init</div>
              <div>git add .</div>
              <div>git commit -m "feat: Commercial Performance Studio con Supabase y Vercel"</div>
              <div>git branch -M main</div>
              <div>git remote add origin https://github.com/SU_USUARIO/dashboard-comercial.git</div>
              <div>git push -u origin main</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
