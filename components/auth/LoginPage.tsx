// components/auth/LoginPage.tsx
// Página de inicio de sesión premium
import React, { useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  Sparkles,
  Package,
  TrendingUp,
  Shield,
  Zap,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface LoginPageProps {
  onSwitchToRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToRegister }) => {
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    await login({ email, password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Efectos de fondo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Panel izquierdo - Información */}
        <div className="hidden lg:block text-white p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">LITPER PRO</h1>
              <p className="text-purple-300 text-sm">Sistema de Gestión Logística</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold mb-6 leading-tight">
            Gestiona tus envíos con
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent"> Inteligencia Artificial</span>
          </h2>

          <p className="text-slate-300 mb-8 text-lg">
            Optimiza tu operación logística con predicciones inteligentes, automatización y análisis en tiempo real.
          </p>

          {/* Características */}
          <div className="space-y-4">
            {[
              { icon: TrendingUp, label: 'Predicciones de entrega con IA', color: 'emerald' },
              { icon: Zap, label: 'Automatización de tareas', color: 'amber' },
              { icon: Shield, label: 'Priorización inteligente', color: 'purple' },
              { icon: Sparkles, label: 'Análisis en tiempo real', color: 'cyan' },
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                <div className={`p-2 bg-${feature.color}-500/20 rounded-lg`}>
                  <feature.icon className={`w-5 h-5 text-${feature.color}-400`} />
                </div>
                <span className="text-white/90">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel derecho - Formulario */}
        <div className="bg-white dark:bg-navy-900 rounded-3xl shadow-2xl p-8 lg:p-10 border border-slate-200 dark:border-navy-700">
          {/* Logo móvil */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">LITPER PRO</h1>
              <p className="text-slate-500 text-xs">Sistema Logístico</p>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
              Bienvenido de nuevo
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 animate-shake">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-600 rounded-xl
                    text-slate-800 dark:text-white placeholder-slate-400
                    focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500
                    transition-all"
                  required
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-600 rounded-xl
                    text-slate-800 dark:text-white placeholder-slate-400
                    focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500
                    transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Recordarme y Olvidé contraseña */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">Recordarme</span>
              </label>
              <button type="button" className="text-sm text-amber-600 hover:text-amber-700 font-medium">
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Botón de login */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl
                hover:from-amber-600 hover:to-orange-600 transition-all
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
                shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-200 dark:bg-navy-700"></div>
            <span className="text-sm text-slate-400">o</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-navy-700"></div>
          </div>

          {/* Registro */}
          <div className="text-center">
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              ¿No tienes una cuenta?
            </p>
            <button
              onClick={onSwitchToRegister}
              className="w-full py-3.5 border-2 border-slate-200 dark:border-navy-600 text-slate-700 dark:text-white font-medium rounded-xl
                hover:bg-slate-50 dark:hover:bg-navy-800 transition-all
                flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Crear cuenta nueva
            </button>
          </div>

        </div>
      </div>

      {/* Estilos adicionales */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
