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
    <div className="space-y-6 font-mono text-xs">
      {/* Top Banner */}
      <div className="border border-[#242C37] bg-[#12161C] p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[#242C37]">
          <div>
            <div className="flex items-center gap-2 text-[10px] text-[#626D7C] uppercase tracking-wider">
              <span>BACKEND DE DATOS EN LA NUBE</span>
              <span>/</span>
              <span className="text-[#C5F467] font-bold">POSTGRESQL & RLS</span>
            </div>
            <h2 className="mt-1 text-base font-bold text-[#F1F5F9]">
              Conexión Supabase PostgreSQL & Despliegue en Vercel
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs font-semibold ${
                health?.connected
                  ? 'border-[#C5F467]/40 bg-[#C5F467]/10 text-[#C5F467]'
                  : 'border-[#242C37] bg-[#0B0D10] text-[#929EAD]'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  health?.connected ? 'bg-[#C5F467] animate-pulse' : 'bg-[#626D7C]'
                }`}
              />
              {health?.connected ? 'Conectado a Supabase' : 'Modo Persistente Local'}
            </span>
          </div>
        </div>

        {/* Credentials Form */}
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <label className="block text-[10px] font-bold text-[#626D7C] uppercase tracking-wider mb-1">
              SUPABASE PROJECT URL
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#626D7C]" />
              <input
                type="text"
                placeholder="https://xyzproject.supabase.co"
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="h-8 w-full border border-[#242C37] bg-[#0B0D10] pl-9 pr-3 text-xs text-[#F1F5F9] placeholder:text-[#626D7C] focus:border-[#C5F467] focus:outline-hidden"
              />
            </div>
            <p className="mt-1 text-[10px] text-[#626D7C]">
              Project Settings → API → Project URL
            </p>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#626D7C] uppercase tracking-wider mb-1">
              SUPABASE ANON / PUBLIC KEY
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#626D7C]" />
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={e => setAnonKey(e.target.value)}
                className="h-8 w-full border border-[#242C37] bg-[#0B0D10] pl-9 pr-3 text-xs text-[#F1F5F9] placeholder:text-[#626D7C] focus:border-[#C5F467] focus:outline-hidden"
              />
            </div>
            <p className="mt-1 text-[10px] text-[#626D7C]">
              Clave pública (Project Settings → API → anon public)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#242C37]">
          <div className="text-[10px] text-[#626D7C]">
            Configurable vía variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY o en almacenamiento seguro del navegador.
          </div>

          <div className="flex items-center gap-2">
            {url && (
              <button
                onClick={handleClear}
                className="px-3 py-1 text-xs text-[#929EAD] hover:text-[#FB7185] transition-colors"
              >
                Desconectar
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isTesting || !url || !anonKey}
              className={`inline-flex items-center gap-2 border px-4 py-1.5 text-xs font-bold transition-colors ${
                !url || !anonKey
                  ? 'border-[#242C37] bg-[#191F27] text-[#626D7C] cursor-not-allowed'
                  : 'border-[#C5F467]/50 bg-[#C5F467] text-[#0B0D10] hover:bg-[#b8eb58]'
              }`}
            >
              {isTesting ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#0B0D10] border-t-transparent" />
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
            className={`mt-4 border p-4 text-xs ${
              health.connected
                ? 'border-[#C5F467]/40 bg-[#C5F467]/10 text-[#C5F467]'
                : 'border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#F59E0B]'
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-1">
              {health.connected ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              {health.connected ? 'Diagnóstico de Conexión: Exitoso' : 'Diagnóstico de Conexión'}
            </div>
            <p className="font-sans text-slate-200">{health.message}</p>

            {health.tablesFound && (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 pt-2 border-t border-[#242C37] text-[11px]">
                <div>
                  comercial_ventas:{' '}
                  <strong className={health.tablesFound.ventas ? 'text-[#C5F467]' : 'text-[#FB7185]'}>
                    {health.tablesFound.ventas ? '✓ Detectada' : '✗ No existe en Supabase'}
                  </strong>
                </div>
                <div>
                  comercial_objetivos:{' '}
                  <strong className={health.tablesFound.objetivos ? 'text-[#C5F467]' : 'text-[#FB7185]'}>
                    {health.tablesFound.objetivos ? '✓ Detectada' : '✗ No existe en Supabase'}
                  </strong>
                </div>
                <div>
                  comercial_cobertura:{' '}
                  <strong className={health.tablesFound.cobertura ? 'text-[#C5F467]' : 'text-[#FB7185]'}>
                    {health.tablesFound.cobertura ? '✓ Detectada' : '✗ No existe en Supabase'}
                  </strong>
                </div>
              </div>
            )}

            {/* ACTION BANNER IF TABLES ARE MISSING */}
            {health.connected && (!health.tablesFound?.ventas || !health.tablesFound?.objetivos) && (
              <div className="mt-4 border border-[#F59E0B]/50 bg-[#F59E0B]/10 p-3.5 text-xs text-[#F59E0B] space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Paso Requerido: Crear las Tablas en Supabase</span>
                </div>
                <p className="font-sans text-slate-200 text-xs leading-relaxed">
                  La conexión a Supabase es válida, pero la base de datos PostgreSQL aún no tiene creadas las tablas comerciales (<strong>comercial_ventas</strong>, <strong>comercial_objetivos</strong>, etc.).
                </p>
                <div className="font-sans text-slate-300 text-[11px] space-y-1 bg-[#0B0D10] p-2.5 border border-[#242C37]">
                  <p><strong>Pasos para solucionar en 1 minuto:</strong></p>
                  <p>1. Haga clic en el botón verde abajo para <strong>Copiar el Script SQL</strong>.</p>
                  <p>2. Vaya a su proyecto en <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-[#38BDF8] underline font-bold">Supabase Dashboard</a> → menú izquierdo <strong>SQL Editor</strong> → <strong>New Query</strong>.</p>
                  <p>3. Pegue el script y haga clic en <strong>Run</strong>.</p>
                  <p>4. Regrese aquí y haga clic en <strong>"Guardar y Probar Conexión"</strong>.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={copySqlToClipboard}
                    className="inline-flex items-center gap-1.5 border border-[#C5F467]/60 bg-[#C5F467] px-3.5 py-1.5 text-xs font-bold text-[#0B0D10] hover:bg-[#b8eb58] transition-colors cursor-pointer"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copiedSql ? '✓ ¡Script SQL Copiado al Portapapeles!' : 'Copiar Script SQL Completo'}
                  </button>
                  <button
                    onClick={() => handleTest()}
                    className="inline-flex items-center gap-1.5 border border-[#242C37] bg-[#12161C] px-3 py-1.5 text-xs font-semibold text-[#F1F5F9] hover:border-[#C5F467] transition-colors cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-[#C5F467]" />
                    Re-verificar Tablas
                  </button>
                </div>
              </div>
            )}

            {health.connected && (
              <div className="mt-4 pt-3 border-t border-[#242C37] space-y-3">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="text-[11px] text-[#929EAD]">
                      <strong>Sincronización Cloud:</strong> Respalde en Supabase sus datos reales o cárguelos hacia el Dashboard en cualquier dispositivo.
                    </div>
                    {dbState && (
                      <span className="text-[10px] text-[#C5F467] font-mono">
                        Base Local: {dbState.ventas.length} ventas · {dbState.objetivos.length} obj · {dbState.cobertura.length} cob
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Sync Current State to Supabase */}
                    <button
                      onClick={handleSyncCurrentDb}
                      disabled={isSyncingCurrent || isPulling || isClearingRemote || !health.tablesFound?.ventas}
                      className={`shrink-0 inline-flex items-center gap-2 border px-3.5 py-1.5 text-xs font-bold transition-colors ${
                        !health.tablesFound?.ventas
                          ? 'border-[#242C37] bg-[#191F27] text-[#626D7C] cursor-not-allowed'
                          : 'border-[#C5F467]/50 bg-[#C5F467] text-[#0B0D10] hover:bg-[#b8eb58] cursor-pointer'
                      }`}
                      title={!health.tablesFound?.ventas ? 'Primero debe crear las tablas ejecutando el script SQL en Supabase' : 'Sincronizar todos los registros actuales hacia Supabase PostgreSQL'}
                    >
                      {isSyncingCurrent ? (
                        <>
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#0B0D10] border-t-transparent" />
                          Sincronizando a la Nube...
                        </>
                      ) : (
                        <>
                          <UploadCloud className="h-4 w-4" />
                          Sincronizar Base de Datos Actual a Supabase
                        </>
                      )}
                    </button>

                    {/* Pull from Supabase */}
                    <button
                      onClick={handlePullFromSupabase}
                      disabled={isPulling || isSyncingCurrent || isClearingRemote || !health.tablesFound?.ventas}
                      className={`shrink-0 inline-flex items-center gap-2 border px-3.5 py-1.5 text-xs font-bold transition-colors ${
                        !health.tablesFound?.ventas
                          ? 'border-[#242C37] bg-[#191F27] text-[#626D7C] cursor-not-allowed'
                          : 'border-[#38BDF8]/40 bg-[#38BDF8]/10 text-[#38BDF8] hover:bg-[#38BDF8]/20 cursor-pointer'
                      }`}
                      title={!health.tablesFound?.ventas ? 'Primero debe crear las tablas en Supabase' : 'Descargar datos desde Supabase PostgreSQL y restaurarlos en el Dashboard local'}
                    >
                      {isPulling ? (
                        <>
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#38BDF8] border-t-transparent" />
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
                      className="shrink-0 inline-flex items-center gap-2 border border-[#FB7185]/40 bg-[#FB7185]/10 px-3 py-1.5 text-xs font-bold text-[#FB7185] hover:bg-[#FB7185]/20 transition-colors disabled:opacity-50 cursor-pointer"
                      title="Eliminar todas las filas en las tablas comerciales de Supabase"
                    >
                      {isClearingRemote ? (
                        <>
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#FB7185] border-t-transparent" />
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
                  <div className="pt-2 border-t border-[#242C37]/50 flex items-center justify-between text-[11px] text-[#626D7C]">
                    <span>¿Desea restablecer los datos de prueba originales de septiembre 2026?</span>
                    <button
                      onClick={handleSeed}
                      disabled={isSeeding || isSyncingCurrent || isPulling}
                      className="inline-flex items-center gap-1.5 text-xs text-[#929EAD] hover:text-[#F1F5F9] underline cursor-pointer"
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
                className={`mt-3 p-2.5 text-xs border ${
                  seedResult.success
                    ? 'border-[#C5F467]/50 bg-[#C5F467]/10 text-[#C5F467]'
                    : 'border-[#FB7185]/50 bg-[#FB7185]/10 text-[#FB7185]'
                }`}
              >
                {seedResult.message}
              </div>
            )}
          </div>
        )}
      </div>

      {/* GUIDES AND SQL SCRIPT TABS */}
      <div className="border border-[#242C37] bg-[#12161C] p-5">
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-[#242C37]">
          <button
            onClick={() => setActiveGuideTab('sql')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold transition-all ${
              activeGuideTab === 'sql'
                ? 'border border-[#C5F467]/40 bg-[#C5F467]/10 text-[#C5F467]'
                : 'border border-[#242C37] bg-[#0B0D10] text-[#929EAD] hover:text-[#F1F5F9]'
            }`}
          >
            <FileCode className="h-4 w-4" />
            Script SQL Completo (PostgreSQL + RLS)
          </button>
          <button
            onClick={() => setActiveGuideTab('supabase')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold transition-all ${
              activeGuideTab === 'supabase'
                ? 'border border-[#C5F467]/40 bg-[#C5F467]/10 text-[#C5F467]'
                : 'border border-[#242C37] bg-[#0B0D10] text-[#929EAD] hover:text-[#F1F5F9]'
            }`}
          >
            <Database className="h-4 w-4" />
            Guía de Configuración en Supabase
          </button>
          <button
            onClick={() => setActiveGuideTab('vercel')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold transition-all ${
              activeGuideTab === 'vercel'
                ? 'border border-[#C5F467]/40 bg-[#C5F467]/10 text-[#C5F467]'
                : 'border border-[#242C37] bg-[#0B0D10] text-[#929EAD] hover:text-[#F1F5F9]'
            }`}
          >
            <Globe className="h-4 w-4" />
            Despliegue en Vercel
          </button>
          <button
            onClick={() => setActiveGuideTab('github')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold transition-all ${
              activeGuideTab === 'github'
                ? 'border border-[#C5F467]/40 bg-[#C5F467]/10 text-[#C5F467]'
                : 'border border-[#242C37] bg-[#0B0D10] text-[#929EAD] hover:text-[#F1F5F9]'
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
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#F1F5F9]">
                  Script DDL de Tablas, Claves Únicas, RLS y Triggers
                </h3>
                <p className="text-[11px] text-[#929EAD] font-sans">
                  Copie y ejecute este script en el SQL Editor de su proyecto Supabase.
                </p>
              </div>

              <button
                onClick={copySqlToClipboard}
                className="inline-flex items-center gap-1.5 border border-[#C5F467]/50 bg-[#C5F467] px-3 py-1.5 text-xs font-bold text-[#0B0D10] hover:bg-[#b8eb58] transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
                {copiedSql ? '¡Copiado!' : 'Copiar Script SQL'}
              </button>
            </div>

            <div className="relative max-h-96 overflow-y-auto border border-[#242C37] bg-[#0B0D10] p-4 text-[11px] text-[#C5F467]">
              <pre>{SUPABASE_SQL_SCHEMA}</pre>
            </div>

            {/* Truncate / Clear Query Box */}
            <div className="border border-[#FB7185]/30 bg-[#0B0D10] p-3 mt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4 text-[#FB7185]" />
                  <span className="font-bold text-xs text-[#F1F5F9]">
                    Comando SQL para vaciar datos de prueba en Supabase
                  </span>
                </div>
                <button
                  onClick={copyTruncateSql}
                  className="inline-flex items-center gap-1 border border-[#FB7185]/40 bg-[#FB7185]/10 px-2 py-1 text-xs text-[#FB7185] hover:bg-[#FB7185]/20"
                >
                  <Copy className="h-3 w-3" />
                  {copiedTruncateSql ? '¡Copiado!' : 'Copiar TRUNCATE'}
                </button>
              </div>
              <p className="text-[11px] text-[#929EAD] font-sans mb-2">
                Si desea vaciar las tablas directamente desde el SQL Editor de Supabase sin eliminar las políticas ni la estructura:
              </p>
              <pre className="text-xs text-[#FB7185] bg-[#12161C] p-2 border border-[#242C37] overflow-x-auto">
TRUNCATE TABLE com_ventas, com_objetivos, com_cobertura, com_import_batches RESTART IDENTITY CASCADE;
              </pre>
            </div>
          </div>
        )}

        {/* TAB 2: SUPABASE GUIDE */}
        {activeGuideTab === 'supabase' && (
          <div className="mt-4 space-y-3 text-xs font-sans text-slate-300 leading-relaxed">
            <div className="border border-[#242C37] bg-[#0B0D10] p-3 font-mono">
              <strong className="text-[#F1F5F9]">1. Crear Proyecto en Supabase:</strong>
              <p className="mt-1 font-sans text-slate-300">
                Ingrese a <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-[#C5F467] underline">supabase.com</a> y cree su proyecto comercial (ej. <em>comercial-prod</em>). Seleccione la región <em>São Paulo (sa-east-1)</em> para optimizar la latencia en Paraguay y Sudamérica.
              </p>
            </div>

            <div className="border border-[#242C37] bg-[#0B0D10] p-3 font-mono">
              <strong className="text-[#F1F5F9]">2. Ejecutar el Script SQL:</strong>
              <p className="mt-1 font-sans text-slate-300">
                En el menú lateral de Supabase, seleccione <strong>SQL Editor</strong> → <strong>New Query</strong>. Pegue el script de la pestaña anterior y ejecútelo con <strong>Run</strong>.
              </p>
            </div>

            <div className="border border-[#242C37] bg-[#0B0D10] p-3 font-mono">
              <strong className="text-[#F1F5F9]">3. Conectar Credenciales:</strong>
              <p className="mt-1 font-sans text-slate-300">
                Copie <code>Project URL</code> y <code>Project API Key (anon/public)</code> desde Project Settings → API e ingréselas en el panel superior.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: VERCEL GUIDE */}
        {activeGuideTab === 'vercel' && (
          <div className="mt-4 space-y-3 text-xs font-sans text-slate-300 leading-relaxed">
            <div className="border border-[#242C37] bg-[#0B0D10] p-3 font-mono">
              <strong className="text-[#F1F5F9]">1. Variables de Entorno en Vercel:</strong>
              <div className="mt-2 border border-[#242C37] bg-[#12161C] p-2 text-[#C5F467] space-y-1">
                <div>VITE_SUPABASE_URL=https://su-proyecto.supabase.co</div>
                <div>VITE_SUPABASE_ANON_KEY=su_clave_anonima_publica</div>
              </div>
            </div>

            <div className="border border-[#242C37] bg-[#0B0D10] p-3 font-mono">
              <strong className="text-[#F1F5F9]">2. Parámetros de Compilación:</strong>
              <ul className="mt-1 list-disc list-inside text-slate-300 font-sans">
                <li>Framework Preset: <strong>Vite</strong></li>
                <li>Build Command: <code>npm run build</code></li>
                <li>Output Directory: <code>dist</code></li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 4: GITHUB GUIDE */}
        {activeGuideTab === 'github' && (
          <div className="mt-4 border border-[#242C37] bg-[#0B0D10] p-3 font-mono text-xs">
            <p className="text-[#929EAD] mb-2 font-sans">Comandos Git para inicializar el repositorio:</p>
            <div className="border border-[#242C37] bg-[#12161C] p-3 text-[#C5F467] space-y-1">
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
