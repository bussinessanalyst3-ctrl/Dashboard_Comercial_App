import React, { useState } from 'react';
import { UserProfile } from '../types/commercial';
import { loginWithCredentials, registerNewUser } from '../services/authService';
import {
  Shield,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Activity,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  BarChart2
} from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
  supabaseConnected: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  supabaseConnected
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const res = await loginWithCredentials(email, password);
        if (res.success && res.user) {
          onLoginSuccess(res.user);
        } else {
          setErrorMessage(res.message || 'Error de autenticación. Verifique sus credenciales.');
        }
      } else {
        const res = await registerNewUser(email, password, fullName);
        if (res.success && res.user) {
          setSuccessMessage('Cuenta creada exitosamente. Iniciando sesión...');
          setTimeout(() => {
            onLoginSuccess(res.user!);
          }, 800);
        } else {
          setErrorMessage(res.message || 'Error al registrar usuario.');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Fallo de conexión o autenticación: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#111827] text-[#F9FAFB] flex flex-col justify-between selection:bg-[#3B82F6] selection:text-white">
      {/* Top Bar */}
      <header className="border-b border-[#374151] bg-[#111827]/95 px-6 py-3.5 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold tracking-wider text-[#F9FAFB] uppercase">
              COMMERCIAL PERFORMANCE STUDIO
            </div>
            <div className="text-[10px] text-[#9CA3AF]">
              Control de Gestión & Inteligencia Comercial
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
              supabaseConnected
                ? 'border-[#14B8A6]/40 bg-[#14B8A6]/10 text-[#14B8A6]'
                : 'border-[#374151] bg-[#1F2937] text-[#9CA3AF]'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                supabaseConnected ? 'bg-[#14B8A6] animate-pulse' : 'bg-[#6B7280]'
              }`}
            />
            {supabaseConnected ? 'Supabase Auth & RLS Activo' : 'Autenticación Local Activa'}
          </span>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 rounded-xl border border-[#374151] bg-[#1F2937] shadow-2xl overflow-hidden">
          {/* Left Context Information (5 cols) */}
          <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-[#374151] bg-[#111827]/70 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-2 text-[10px] text-[#3B82F6] font-bold uppercase tracking-widest">
                <span>CONTROL DE ACCESO SEGURO</span>
              </div>
              <h1 className="mt-2 text-lg sm:text-xl font-bold text-[#F9FAFB] leading-tight">
                Plataforma Analítica Comercial
              </h1>
              <p className="mt-2 text-xs text-[#9CA3AF] leading-relaxed">
                Acceso corporativo protegido. El sistema valida la identidad de cada usuario y asigna automáticamente los permisos correspondientes desde el servidor.
              </p>

              {/* Roles Description Cards */}
              <div className="mt-6 space-y-3">
                <div className="rounded-lg border border-[#3B82F6]/30 bg-[#1F2937] p-3.5 text-xs shadow-xs">
                  <div className="flex items-center gap-2 text-[#38BDF8] font-bold mb-1">
                    <Shield className="h-4 w-4" />
                    <span>PERFIL ADMINISTRADOR</span>
                  </div>
                  <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
                    Acceso total a todos los módulos: Ingesta y reemplazo atómico de datos, gestión de usuarios, auditoría completa y base de datos.
                  </p>
                </div>

                <div className="rounded-lg border border-[#14B8A6]/30 bg-[#1F2937] p-3.5 text-xs shadow-xs">
                  <div className="flex items-center gap-2 text-[#14B8A6] font-bold mb-1">
                    <BarChart2 className="h-4 w-4" />
                    <span>PERFIL EQUIPO COMERCIAL</span>
                  </div>
                  <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
                    Acceso analítico y de consulta: Indicadores ejecutivos, gráficos de ventas, cobertura, metas, rankings y filtros multidimensionales.
                  </p>
                </div>
              </div>
            </div>

            {/* Security Architecture Notice */}
            <div className="border-t border-[#374151] pt-4">
              <div className="flex items-center gap-1.5 text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1">
                <Lock className="h-3.5 w-3.5 text-[#3B82F6]" />
                <span className="font-semibold text-[#D1D5DB]">Seguridad & Autorización</span>
              </div>
              <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
                Los privilegios administrativos son asignados de forma centralizada. El acceso a módulos de configuración está restringido exclusivamente a cuentas previamente autorizadas.
              </p>
            </div>
          </div>

          {/* Right Login / Register Form (7 cols) */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-center bg-[#1F2937]">
            {/* Mode Switcher */}
            <div className="flex border-b border-[#374151] mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 pb-3 text-xs font-semibold transition-colors border-b-2 cursor-pointer ${
                  mode === 'login'
                    ? 'border-[#3B82F6] text-[#3B82F6]'
                    : 'border-transparent text-[#9CA3AF] hover:text-[#F9FAFB]'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 pb-3 text-xs font-semibold transition-colors border-b-2 cursor-pointer ${
                  mode === 'register'
                    ? 'border-[#3B82F6] text-[#3B82F6]'
                    : 'border-transparent text-[#9CA3AF] hover:text-[#F9FAFB]'
                }`}
              >
                Registrar Usuario
              </button>
            </div>

            {/* Notification Feedback */}
            {errorMessage && (
              <div className="mb-4 rounded-md border border-[#EF4444]/40 bg-[#EF4444]/10 p-3 text-xs text-[#EF4444] flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 rounded-md border border-[#14B8A6]/40 bg-[#14B8A6]/10 p-3 text-xs text-[#14B8A6] flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {mode === 'register' && (
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#9CA3AF] mb-1 font-semibold">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
                    <input
                      type="text"
                      required
                      placeholder="Nombre y Apellido"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="h-9 w-full rounded-md border border-[#374151] bg-[#111827] pl-9 pr-3 text-xs text-[#F9FAFB] placeholder:text-[#6B7280] focus:border-[#3B82F6] focus:outline-hidden focus:ring-1 focus:ring-[#3B82F6]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#9CA3AF] mb-1 font-semibold">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
                  <input
                    type="email"
                    required
                    placeholder="correo@empresa.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="h-9 w-full rounded-md border border-[#374151] bg-[#111827] pl-9 pr-3 text-xs text-[#F9FAFB] placeholder:text-[#6B7280] focus:border-[#3B82F6] focus:outline-hidden focus:ring-1 focus:ring-[#3B82F6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#9CA3AF] mb-1 font-semibold">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="h-9 w-full rounded-md border border-[#374151] bg-[#111827] pl-9 pr-10 text-xs text-[#F9FAFB] placeholder:text-[#6B7280] focus:border-[#3B82F6] focus:outline-hidden focus:ring-1 focus:ring-[#3B82F6]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#F9FAFB] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <div className="rounded-md border border-[#374151] bg-[#111827] p-2.5 text-[11px] text-[#9CA3AF]">
                  <span className="text-[#38BDF8] font-semibold">Asignación automática:</span> Las nuevas cuentas se crean con perfil de <span className="text-[#F9FAFB] font-medium">Equipo Comercial</span>. Permisos administrativos deben ser asignados por un Administrador desde el panel de control.
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-md bg-[#3B82F6] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#2563EB] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Verificando Credenciales...</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Acceder al Sistema' : 'Registrar Cuenta'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-[#374151] text-[10px] text-[#9CA3AF] flex items-center justify-between">
              <span>Sesiones seguras y encriptadas</span>
              <span className="font-mono text-[#6B7280]">v3.1.0 Enterprise Security</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#374151] bg-[#111827] px-6 py-3 text-[10px] text-[#9CA3AF] flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>© 2026 Commercial Performance Studio. Sistema confidencial de uso interno corporativo.</span>
        <span>Asunción, Paraguay</span>
      </footer>
    </div>
  );
};
