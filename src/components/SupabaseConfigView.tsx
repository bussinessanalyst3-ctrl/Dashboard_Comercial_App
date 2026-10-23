import React, { useState, useEffect } from 'react';
import {
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
  SupabaseHealthCheck
} from '../services/supabaseClient';
import { SUPABASE_SQL_SCHEMA } from '../services/sqlGenerator';
import { seedSupabaseInitialData } from '../services/dbStore';
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
  UploadCloud
} from 'lucide-react';

interface SupabaseConfigViewProps {
  onConnectionStatusChange?: (connected: boolean) => void;
}

export const SupabaseConfigView: React.FC<SupabaseConfigViewProps> = ({
  onConnectionStatusChange
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{ success: boolean; message: string } | null>(null);
  const [health, setHealth] = useState<SupabaseHealthCheck | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
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

  const handleSeed = async () => {
    setIsSeeding(true);
    setSeedResult(null);
    const res = await seedSupabaseInitialData();
    setSeedResult(res);
    setIsSeeding(false);
  };

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
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
                    {health.tablesFound.ventas ? '✓ Detectada' : '✗ No existe'}
                  </strong>
                </div>
                <div>
                  comercial_objetivos:{' '}
                  <strong className={health.tablesFound.objetivos ? 'text-[#C5F467]' : 'text-[#FB7185]'}>
                    {health.tablesFound.objetivos ? '✓ Detectada' : '✗ No existe'}
                  </strong>
                </div>
                <div>
                  comercial_cobertura:{' '}
                  <strong className={health.tablesFound.cobertura ? 'text-[#C5F467]' : 'text-[#FB7185]'}>
                    {health.tablesFound.cobertura ? '✓ Detectada' : '✗ No existe'}
                  </strong>
                </div>
              </div>
            )}

            {health.connected && (
              <div className="mt-4 pt-3 border-t border-[#242C37] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-[11px] text-[#929EAD]">
                  ¿Deseas poblar la base de datos de Supabase con los 1.044 registros de ventas, objetivos y cobertura del archivo oficial <code className="text-[#F1F5F9] bg-[#191F27] px-1 py-0.5">sep_26_normalizada</code>?
                </div>
                <button
                  onClick={handleSeed}
                  disabled={isSeeding}
                  className="shrink-0 inline-flex items-center gap-2 border border-[#C5F467]/40 bg-[#C5F467]/20 px-3 py-1.5 text-xs font-bold text-[#C5F467] hover:bg-[#C5F467]/30 transition-colors disabled:opacity-50"
                >
                  {isSeeding ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#C5F467] border-t-transparent" />
                      Insertando datos en Supabase...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-4 w-4" />
                      Sincronizar Dataset Inicial a Supabase
                    </>
                  )}
                </button>
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
