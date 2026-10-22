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
  BookOpen
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

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Database className="h-5 w-5 text-emerald-600" />
              Conexión Supabase PostgreSQL & Despliegue en Vercel
            </h2>
            <p className="text-xs text-slate-500">
              Arquitectura centralizada de persistencia permanente, autenticación Supabase Auth y políticas RLS.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                health?.connected
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  health?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              {health?.connected ? 'Conectado a Supabase' : 'Modo Persistente Local'}
            </span>
          </div>
        </div>

        {/* Credentials Form */}
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Supabase Project URL
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="https://xyzproject.supabase.co"
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Obténgala en: Project Settings → API → Project URL
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Supabase Anon / Public Key
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={e => setAnonKey(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Clave pública anónima (Project Settings → API → anon public)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="text-[11px] text-slate-500">
            Las credenciales se guardan de forma segura en su navegador o mediante variables de entorno en Vercel.
          </div>

          <div className="flex items-center gap-2">
            {url && (
              <button
                onClick={handleClear}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 transition-colors"
              >
                Desconectar
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isTesting || !url || !anonKey}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors ${
                !url || !anonKey
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-900 hover:bg-slate-800'
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
            className={`mt-4 rounded-xl border p-4 text-xs ${
              health.connected
                ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                : 'border-amber-200 bg-amber-50 text-amber-950'
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-1">
              {health.connected ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              )}
              {health.connected ? 'Diagnóstico de Conexión: Exitoso' : 'Diagnóstico de Conexión'}
            </div>
            <p>{health.message}</p>

            {health.tablesFound && (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 pt-2 border-t border-emerald-200/50 text-[11px]">
                <div>
                  comercial_ventas:{' '}
                  <strong className={health.tablesFound.ventas ? 'text-emerald-700' : 'text-rose-700'}>
                    {health.tablesFound.ventas ? '✓ Detectada' : '✗ No existe'}
                  </strong>
                </div>
                <div>
                  comercial_objetivos:{' '}
                  <strong className={health.tablesFound.objetivos ? 'text-emerald-700' : 'text-rose-700'}>
                    {health.tablesFound.objetivos ? '✓ Detectada' : '✗ No existe'}
                  </strong>
                </div>
                <div>
                  comercial_cobertura:{' '}
                  <strong className={health.tablesFound.cobertura ? 'text-emerald-700' : 'text-rose-700'}>
                    {health.tablesFound.cobertura ? '✓ Detectada' : '✗ No existe'}
                  </strong>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* GUIDES AND SQL SCRIPT TABS */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-100">
          <button
            onClick={() => setActiveGuideTab('sql')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeGuideTab === 'sql'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileCode className="h-4 w-4" />
            Script SQL Completo (PostgreSQL + RLS)
          </button>
          <button
            onClick={() => setActiveGuideTab('supabase')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeGuideTab === 'supabase'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Database className="h-4 w-4" />
            Guía de Configuración en Supabase
          </button>
          <button
            onClick={() => setActiveGuideTab('vercel')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeGuideTab === 'vercel'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Globe className="h-4 w-4" />
            Instrucciones Despliegue en Vercel
          </button>
          <button
            onClick={() => setActiveGuideTab('github')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeGuideTab === 'github'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <GitBranch className="h-4 w-4" />
            Instrucciones para GitHub
          </button>
        </div>

        {/* TAB 1: SQL SCHEMA */}
        {activeGuideTab === 'sql' && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Script DDL de Tablas, Claves Únicas, RLS y Triggers
                </h3>
                <p className="text-[11px] text-slate-500">
                  Copie y pegue este script directamente en el SQL Editor de su proyecto Supabase.
                </p>
              </div>

              <button
                onClick={copySqlToClipboard}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 transition-colors shadow-xs"
              >
                <Copy className="h-3.5 w-3.5" />
                {copiedSql ? '¡Copiado al Portapapeles!' : 'Copiar Script SQL'}
              </button>
            </div>

            <div className="relative max-h-96 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] text-emerald-400">
              <pre>{SUPABASE_SQL_SCHEMA}</pre>
            </div>
          </div>
        )}

        {/* TAB 2: SUPABASE GUIDE */}
        {activeGuideTab === 'supabase' && (
          <div className="mt-4 space-y-4 text-xs text-slate-700 leading-relaxed">
            <h3 className="text-sm font-bold text-slate-900">
              Pasos para conectar Supabase a Dashboard Comercial:
            </h3>

            <div className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <strong className="text-slate-900">1. Crear Proyecto en Supabase:</strong>
                <p className="mt-1">
                  Visite <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-semibold">supabase.com</a>, cree una organización y un proyecto nuevo (ej. <em>comercial-empresa</em>). Seleccione la región más cercana (ej. <em>São Paulo (sa-east-1)</em> para menor latencia en Paraguay/América del Sur).
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <strong className="text-slate-900">2. Ejecutar el Script SQL:</strong>
                <p className="mt-1">
                  En el menú lateral de Supabase, ingrese a <strong>SQL Editor</strong> → <strong>New Query</strong>. Pegue el script de la pestaña anterior y presione <strong>Run</strong>. Esto creará las 6 tablas comerciales, las restricciones UNIQUE de negocio, los índices optimizados y las políticas RLS.
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <strong className="text-slate-900">3. Copiar Credenciales API:</strong>
                <p className="mt-1">
                  Vaya a <strong>Project Settings</strong> → <strong>API</strong>. Copie <code>Project URL</code> y <code>Project API keys (anon / public)</code> y péguelas en el formulario superior o en su archivo <code>.env</code>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: VERCEL GUIDE */}
        {activeGuideTab === 'vercel' && (
          <div className="mt-4 space-y-4 text-xs text-slate-700 leading-relaxed">
            <h3 className="text-sm font-bold text-slate-900">
              Despliegue Continuo en Vercel:
            </h3>

            <div className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <strong className="text-slate-900">1. Importar Repositorio en Vercel:</strong>
                <p className="mt-1">
                  Inicie sesión en <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-semibold">vercel.com</a> → <strong>Add New Project</strong> → Seleccione su repositorio de GitHub.
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <strong className="text-slate-900">2. Configurar Variables de Entorno (Environment Variables):</strong>
                <p className="mt-1">
                  En la pantalla de configuración de Vercel, agregue:
                </p>
                <div className="mt-2 rounded bg-slate-900 p-2 font-mono text-[11px] text-slate-200 space-y-1">
                  <div>VITE_SUPABASE_URL=https://su-proyecto.supabase.co</div>
                  <div>VITE_SUPABASE_ANON_KEY=su_clave_anonima_publica</div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <strong className="text-slate-900">3. Build & Output Settings:</strong>
                <p className="mt-1">
                  Vercel detecta automáticamente Vite:
                </p>
                <ul className="mt-1 list-disc list-inside">
                  <li>Framework Preset: <strong>Vite</strong></li>
                  <li>Build Command: <code>npm run build</code></li>
                  <li>Output Directory: <code>dist</code></li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: GITHUB GUIDE */}
        {activeGuideTab === 'github' && (
          <div className="mt-4 space-y-4 text-xs text-slate-700 leading-relaxed">
            <h3 className="text-sm font-bold text-slate-900">
              Control de Versiones y Sincronización con GitHub:
            </h3>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
              <p>Comandos para inicializar y subir el repositorio a GitHub:</p>
              <div className="rounded bg-slate-900 p-3 font-mono text-[11px] text-emerald-400 space-y-1">
                <div>git init</div>
                <div>git add .</div>
                <div>git commit -m "feat: Dashboard Comercial con importación Excel y Supabase"</div>
                <div>git branch -M main</div>
                <div>git remote add origin https://github.com/SU_USUARIO/dashboard-comercial.git</div>
                <div>git push -u origin main</div>
              </div>
              <p className="text-slate-500 text-[11px]">
                Recuerde que el archivo <code>.env</code> está en <code>.gitignore</code> para proteger sus claves.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
