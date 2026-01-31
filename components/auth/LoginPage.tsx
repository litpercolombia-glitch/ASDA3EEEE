// components/auth/LoginPage.tsx
// Página de inicio de sesión premium con animaciones profesionales
import React, { useState, useEffect } from 'react';
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
  Truck,
  BarChart3,
  Globe,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface LoginPageProps {
  onSwitchToRegister: () => void;
}

// Componente de partículas flotantes
const FloatingParticles: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-white/10 rounded-full animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${5 + Math.random() * 10}s`,
          }}
        />
      ))}
    </div>
  );
};

// Componente de iconos animados del fondo
const AnimatedIcons: React.FC = () => {
  const icons = [Truck, Package, BarChart3, Globe, Shield, Zap];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
      {icons.map((Icon, i) => (
        <div
          key={i}
          className="absolute animate-float-slow"
          style={{
            left: `${10 + (i * 15)}%`,
            top: `${20 + (i % 3) * 25}%`,
            animationDelay: `${i * 0.5}s`,
          }}
        >
          <Icon className="w-12 h-12 text-white" />
        </div>
      ))}
    </div>
  );
};

export const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToRegister }) => {
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    await login({ email, password });
  };

  const features = [
    { icon: TrendingUp, label: 'Predicciones de entrega con IA', color: 'emerald', delay: '0.1s' },
    { icon: Zap, label: 'Automatización de tareas', color: 'amber', delay: '0.2s' },
    { icon: Shield, label: 'Priorización inteligente', color: 'purple', delay: '0.3s' },
    { icon: Sparkles, label: 'Análisis en tiempo real', color: 'cyan', delay: '0.4s' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 overflow-hidden">
      {/* Efectos de fondo animados */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Orbes de luz */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/30 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/20 rounded-full blur-[100px] animate-pulse-slow animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/15 rounded-full blur-[150px] animate-pulse-slow animation-delay-4000"></div>

        {/* Gradiente animado */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

        {/* Grid de fondo */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <FloatingParticles />
      <AnimatedIcons />

      <div className={`relative w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Panel izquierdo - Información */}
        <div className="hidden lg:block text-white p-8">
          {/* Logo con animación */}
          <div className={`flex items-center gap-3 mb-8 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
            <div className="relative p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-lg shadow-amber-500/30 animate-glow">
              <Package className="w-8 h-8 text-white" />
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl blur-lg opacity-50 -z-10 animate-pulse-slow"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">LITPER PRO</h1>
              <p className="text-purple-300 text-sm">Sistema de Gestión Logística</p>
            </div>
          </div>

          {/* Título con animación de texto */}
          <h2 className={`text-4xl font-bold mb-6 leading-tight transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
            Gestiona tus envíos con
            <span className="block bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
              Inteligencia Artificial
            </span>
          </h2>

          <p className={`text-slate-300 mb-8 text-lg transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
            Optimiza tu operación logística con predicciones inteligentes, automatización y análisis en tiempo real.
          </p>

          {/* Características con animación escalonada */}
          <div className="space-y-4">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10
                  hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] hover:shadow-lg hover:shadow-${feature.color}-500/10
                  transition-all duration-500 cursor-default group
                  ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}
                style={{ transitionDelay: feature.delay }}
              >
                <div className={`p-2.5 bg-gradient-to-br from-${feature.color}-500/30 to-${feature.color}-600/20 rounded-lg
                  group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                  <feature.icon className={`w-5 h-5 text-${feature.color}-400`} />
                </div>
                <span className="text-white/90 font-medium">{feature.label}</span>
              </div>
            ))}
          </div>

          {/* Stats animados */}
          <div className={`mt-8 grid grid-cols-3 gap-4 transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {[
              { value: '99.9%', label: 'Uptime' },
              { value: '50K+', label: 'Envíos/día' },
              { value: '<2s', label: 'Respuesta IA' },
            ].map((stat, idx) => (
              <div key={idx} className="text-center p-3 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10">
                <div className="text-2xl font-bold text-amber-400 animate-count">{stat.value}</div>
                <div className="text-xs text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel derecho - Formulario */}
        <div className={`bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 lg:p-10 border border-slate-200 dark:border-slate-700/50
          backdrop-blur-xl transition-all duration-700 delay-300
          hover:shadow-amber-500/10 hover:border-amber-500/20
          ${mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'}`}>

          {/* Logo móvil con animación */}
          <div className={`lg:hidden flex items-center justify-center gap-3 mb-8 transition-all duration-500 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-lg shadow-amber-500/30 animate-bounce-subtle">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">LITPER PRO</h1>
              <p className="text-slate-500 text-xs">Sistema Logístico</p>
            </div>
          </div>

          <div className={`text-center mb-8 transition-all duration-500 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'}`}>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
              Bienvenido de nuevo
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {/* Error con animación */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 animate-shake">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 animate-pulse" />
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email con animación de focus */}
            <div className={`transition-all duration-500 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Correo electrónico
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl
                    text-slate-800 dark:text-white placeholder-slate-400
                    focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500
                    hover:border-amber-300 dark:hover:border-amber-600
                    transition-all duration-300"
                  required
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity -z-10 blur-xl"></div>
              </div>
            </div>

            {/* Contraseña con animación de focus */}
            <div className={`transition-all duration-500 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Contraseña
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl
                    text-slate-800 dark:text-white placeholder-slate-400
                    focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500
                    hover:border-amber-300 dark:hover:border-amber-600
                    transition-all duration-300"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity -z-10 blur-xl"></div>
              </div>
            </div>

            {/* Recordarme y Olvidé contraseña */}
            <div className={`flex items-center justify-between transition-all duration-500 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
                  Recordarme
                </span>
              </label>
              <button type="button" className="text-sm text-amber-600 hover:text-amber-700 font-medium hover:underline transition-all">
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Botón de login con animación */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl
                hover:from-amber-600 hover:to-orange-600
                hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-500/40
                active:scale-[0.98]
                transition-all duration-300
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                flex items-center justify-center gap-2
                shadow-lg shadow-amber-500/30
                relative overflow-hidden group
                ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
              style={{ transitionDelay: '0.5s' }}
            >
              {/* Efecto de brillo */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>

          {/* Divider animado */}
          <div className={`my-8 flex items-center gap-4 transition-all duration-500 delay-600 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent"></div>
            <span className="text-sm text-slate-400">o</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent"></div>
          </div>

          {/* Registro con animación */}
          <div className={`text-center transition-all duration-500 delay-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              ¿No tienes una cuenta?
            </p>
            <button
              onClick={onSwitchToRegister}
              className="w-full py-3.5 border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white font-medium rounded-xl
                hover:bg-slate-50 dark:hover:bg-slate-800
                hover:border-amber-300 dark:hover:border-amber-600
                hover:scale-[1.02]
                active:scale-[0.98]
                transition-all duration-300
                flex items-center justify-center gap-2 group"
            >
              <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Crear cuenta nueva
            </button>
          </div>

        </div>
      </div>

      {/* Estilos de animación */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.5; }
          50% { transform: translateY(-20px) rotate(5deg); opacity: 1; }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(10deg); }
        }
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.4); }
          50% { box-shadow: 0 0 40px rgba(245, 158, 11, 0.6), 0 0 60px rgba(245, 158, 11, 0.3); }
        }
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }

        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }

        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
