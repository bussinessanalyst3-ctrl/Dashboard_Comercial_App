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
    <div className="min-h-screen w-screen bg-[#0B0D10] text-[#F1F5F9] font-mono flex flex-col justify-between selection:bg-[#C5F467] selection:text-[#0B0D10]">
      {/* Top Bar */}
      <header className="border-b border-[#242C37] bg-[#12161C] px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center border border-[#C5F467]/40 bg-[#0B0D10] text-[#C5F467]">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-black tracking-wider text-[#F1F5F9] uppercase">
              COMMERCIAL PERFORMANCE STUDIO
            </div>
            <div className="text-[10px] text-[#626D7C]">
              Control de Gestión & Inteligencia Comercial
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-1.5 border px-2 py-0.5 text-[10px] uppercase tracking-wider ${
              supabaseConnected
                ? 'border-[#C5F467]/40 bg-[#C5F467]/10 text-[#C5F467]'
                : 'border-[#242C37] bg-[#0B0D10] text-[#929EAD]'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                supabaseConnected ? 'bg-[#C5F467] animate-pulse' : 'bg-[#626D7C]'
              }`}
            />
            {supabaseConnected ? 'Supabase Auth & RLS Activo' : 'Autenticación Local Activa'}
          </span>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 border border-[#242C37] bg-[#12161C] shadow-2xl">
          {/* Left Context Information (5 cols) */}
          <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-[#242C37] bg-[#0E1116] p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-2 text-[10px] text-[#C5F467] font-bold uppercase tracking-widest">
                <span>CONTROL DE ACCESO SEGURO</span>
              </div>
              <h1 className="mt-2 text-lg sm:text-xl font-bold text-[#F1F5F9] leading-tight">
                Plataforma Analítica Comercial
              </h1>
              <p className="mt-2 text-xs text-[#929EAD] font-sans leading-relaxed">
                Acceso corporativo protegido. El sistema valida la identidad de cada usuario y asigna automáticamente los permisos correspondientes desde el servidor.
              </p>

              {/* Roles Description Cards */}
              <div className="mt-6 space-y-3">
                <div className="border border-[#C5F467]/30 bg-[#12161C] p-3 text-xs">
                  <div className="flex items-center gap-2 text-[#C5F467] font-bold mb-1">
                    <Shield className="h-4 w-4" />
                    <span>PERFIL ADMINISTRADOR</span>
                  </div>
                  <p className="text-[11px] text-[#929EAD] font-sans leading-normal">
                    Acceso total a todos los módulos: Ingesta y reemplazo atómico de datos, gestión de usuarios, auditoría completa y base de datos.
                  </p>
                </div>

                <div className="border border-[#38BDF8]/30 bg-[#12161C] p-3 text-xs">
                  <div className="flex items-center gap-2 text-[#38BDF8] font-bold mb-1">
                    <BarChart2 className="h-4 w-4" />
                    <span>PERFIL EQUIPO COMERCIAL</span>
                  </div>
                  <p className="text-[11px] text-[#929EAD] font-sans leading-normal">
                    Acceso analítico y de consulta: Indicadores ejecutivos, gráficos de ventas, cobertura, metas, rankings y filtros multidimensionales.
                  </p>
                </div>
              </div>
            </div>

            {/* Security Architecture Notice */}
            <div className="border-t border-[#242C37] pt-4">
              <div className="flex items-center gap-1.5 text-[10px] text-[#626D7C] uppercase tracking-wider mb-1">
                <Lock className="h-3.5 w-3.5 text-[#C5F467]" />
                <span className="font-bold text-[#929EAD]">Seguridad & Autorización</span>
              </div>
              <p className="text-[11px] text-[#626D7C] font-sans leading-normal">
                Los privilegios administrativos son asignados de forma centralizada. El acceso a módulos de configuración está restringido exclusivamente a cuentas previamente autorizadas.
              </p>
            </div>
          </div>

          {/* Right Login / Register Form (7 cols) */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-center">
            {/* Mode Switcher */}
            <div className="flex border-b border-[#242C37] mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 pb-3 text-xs font-bold transition-colors border-b-2 ${
                  mode === 'login'
                    ? 'border-[#C5F467] text-[#C5F467]'
                    : 'border-transparent text-[#626D7C] hover:text-[#929EAD]'
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
                className={`flex-1 pb-3 text-xs font-bold transition-colors border-b-2 ${
                  mode === 'register'
                    ? 'border-[#C5F467] text-[#C5F467]'
                    : 'border-transparent text-[#626D7C] hover:text-[#929EAD]'
                }`}
              >
                Registrar Usuario
              </button>
            </div>

            {/* Notification Feedback */}
            {errorMessage && (
              <div className="mb-4 border border-[#FB7185]/40 bg-[#FB7185]/10 p-3 text-xs text-[#FB7185] flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="font-sans">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 border border-[#C5F467]/40 bg-[#C5F467]/10 p-3 text-xs text-[#C5F467] flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="font-sans">{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {mode === 'register' && (
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#929EAD] mb-1 font-bold">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#626D7C]" />
                    <input
                      type="text"
                      required
                      placeholder="Nombre y Apellido"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="h-9 w-full border border-[#242C37] bg-[#0B0D10] pl-9 pr-3 text-xs text-[#F1F5F9] placeholder:text-[#626D7C] focus:border-[#C5F467] focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#929EAD] mb-1 font-bold">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#626D7C]" />
                  <input
                    type="email"
                    required
                    placeholder="correo@empresa.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="h-9 w-full border border-[#242C37] bg-[#0B0D10] pl-9 pr-3 text-xs text-[#F1F5F9] placeholder:text-[#626D7C] focus:border-[#C5F467] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#929EAD] mb-1 font-bold">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#626D7C]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="h-9 w-full border border-[#242C37] bg-[#0B0D10] pl-9 pr-10 text-xs text-[#F1F5F9] placeholder:text-[#626D7C] focus:border-[#C5F467] focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#626D7C] hover:text-[#F1F5F9]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <div className="border border-[#242C37] bg-[#0B0D10] p-2.5 text-[10px] text-[#929EAD] font-sans">
                  <span className="text-[#38BDF8] font-bold">Asignación automática:</span> Las nuevas cuentas se crean con perfil de <span className="text-[#F1F5F9] font-mono">Equipo Comercial</span>. Permisos administrativos deben ser asignados por un Administrador desde el panel de control.
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 w-full inline-flex items-center justify-center gap-2 border border-[#C5F467]/50 bg-[#C5F467] px-4 py-2.5 text-xs font-bold text-[#0B0D10] hover:bg-[#b8eb58] transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#0B0D10] border-t-transparent" />
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

            <div className="mt-6 pt-4 border-t border-[#242C37] text-[10px] text-[#626D7C] font-sans flex items-center justify-between">
              <span>Sesiones seguras y encriptadas</span>
              <span>v3.1.0 Enterprise Security</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#242C37] bg-[#0B0D10] px-6 py-3 text-[10px] text-[#626D7C] flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>© 2026 Commercial Performance Studio. Sistema confidencial de uso interno corporativo.</span>
        <span>Asunción, Paraguay</span>
      </footer>
    </div>
  );
};
