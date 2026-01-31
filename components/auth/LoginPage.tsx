// components/auth/LoginPage.tsx
// Pantalla de Login Premium - Estilo Linear/Vercel/Stripe
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
  ArrowRight,
  Check,
  Fingerprint,
  Smartphone,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface LoginPageProps {
  onSwitchToRegister: () => void;
}

// Componente de partículas flotantes
const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white/10"
          style={{
            width: Math.random() * 4 + 1 + 'px',
            height: Math.random() * 4 + 1 + 'px',
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
            animation: `float ${Math.random() * 10 + 10}s linear infinite`,
            animationDelay: `-${Math.random() * 10}s`,
          }}
        />
      ))}
    </div>
  );
};

// Componente de Aurora Boreal
const AuroraBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Gradiente base */}
      <div className="absolute inset-0 bg-[#0a0a1a]" />

      {/* Aurora 1 - Principal */}
      <div
        className="absolute -top-1/2 -left-1/4 w-[150%] h-[150%] opacity-30"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.4) 0%, transparent 50%)',
          animation: 'aurora1 15s ease-in-out infinite',
        }}
      />

      {/* Aurora 2 - Secundaria */}
      <div
        className="absolute -bottom-1/2 -right-1/4 w-[150%] h-[150%] opacity-25"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.4) 0%, transparent 50%)',
          animation: 'aurora2 18s ease-in-out infinite',
        }}
      />

      {/* Aurora 3 - Acento naranja LITPER */}
      <div
        className="absolute top-1/4 right-1/4 w-[80%] h-[80%] opacity-20"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(249, 115, 22, 0.5) 0%, transparent 40%)',
          animation: 'aurora3 12s ease-in-out infinite',
        }}
      />

      {/* Aurora 4 - Cyan */}
      <div
        className="absolute bottom-1/4 left-1/3 w-[60%] h-[60%] opacity-20"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(6, 182, 212, 0.4) 0%, transparent 45%)',
          animation: 'aurora4 20s ease-in-out infinite',
        }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};

// Orbs flotantes
const FloatingOrbs = () => {
  return (
    <>
      {/* Orb 1 */}
      <div
        className="absolute top-20 left-20 w-72 h-72 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'orbFloat1 8s ease-in-out infinite',
        }}
      />
      {/* Orb 2 */}
      <div
        className="absolute bottom-32 right-20 w-96 h-96 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'orbFloat2 10s ease-in-out infinite',
        }}
      />
      {/* Orb 3 */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 60%)',
          filter: 'blur(80px)',
          animation: 'orbFloat3 15s ease-in-out infinite',
        }}
      />
    </>
  );
};

export const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToRegister }) => {
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [focusedField, setFocusedField] = useState<string | null>(null);
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
    { icon: TrendingUp, label: 'Predicciones IA', desc: 'Machine Learning para entregas', color: 'emerald' },
    { icon: Zap, label: 'Automatización', desc: 'Workflows inteligentes', color: 'amber' },
    { icon: Shield, label: 'Seguridad', desc: 'Encriptación end-to-end', color: 'violet' },
    { icon: Sparkles, label: 'Analytics', desc: 'Métricas en tiempo real', color: 'cyan' },
  ];

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Fondos animados */}
      <AuroraBackground />
      <FloatingOrbs />
      <FloatingParticles />

      {/* Contenido principal */}
      <div
        className={`relative w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-16 items-center transition-all duration-1000 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Panel izquierdo - Branding */}
        <div className="hidden lg:block text-white p-8 z-10">
          {/* Logo con glow */}
          <div className="flex items-center gap-4 mb-12">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl blur-xl opacity-50 animate-pulse" />
              <div className="relative p-4 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-2xl">
                <Package className="w-10 h-10 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">LITPER PRO</h1>
              <p className="text-white/60 text-sm font-medium">Enterprise Logistics Platform</p>
            </div>
          </div>

          {/* Título principal */}
          <h2 className="text-5xl font-bold mb-6 leading-[1.1] tracking-tight">
            La plataforma de
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
              logística inteligente
            </span>
          </h2>

          <p className="text-white/70 text-lg mb-12 leading-relaxed max-w-md">
            Optimiza cada envío con IA predictiva, automatización avanzada y análisis en tiempo real.
          </p>

          {/* Features con animación stagger */}
          <div className="space-y-4">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="group flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] backdrop-blur-sm
                  hover:bg-white/[0.08] hover:border-white/[0.1] transition-all duration-300 cursor-default"
                style={{
                  animation: mounted ? `slideInLeft 0.6s ease-out ${idx * 0.1}s both` : 'none'
                }}
              >
                <div className={`p-3 rounded-xl bg-${feature.color}-500/20 group-hover:bg-${feature.color}-500/30 transition-colors`}>
                  <feature.icon className={`w-6 h-6 text-${feature.color}-400`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{feature.label}</h3>
                  <p className="text-sm text-white/50">{feature.desc}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-white/50 group-hover:translate-x-1 transition-all" />
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-12 pt-8 border-t border-white/10 grid grid-cols-3 gap-6">
            {[
              { value: '99.9%', label: 'Uptime' },
              { value: '500K+', label: 'Envíos/mes' },
              { value: '<2s', label: 'Respuesta' },
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-white/40">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel derecho - Login Form */}
        <div className="relative z-10">
          {/* Glassmorphism card */}
          <div
            className="relative bg-white/[0.03] backdrop-blur-2xl rounded-3xl border border-white/[0.08] shadow-2xl overflow-hidden"
            style={{
              boxShadow: '0 0 80px rgba(249, 115, 22, 0.1), 0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Glow top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

            <div className="p-8 lg:p-10">
              {/* Logo móvil */}
              <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl">
                  <Package className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">LITPER PRO</h1>
                  <p className="text-white/40 text-xs">Enterprise Logistics</p>
                </div>
              </div>

              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Bienvenido de nuevo
                </h2>
                <p className="text-white/50">
                  Ingresa tus credenciales para continuar
                </p>
              </div>

              {/* Social Login */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { name: 'Google', icon: '🔵', bg: 'hover:bg-blue-500/10 hover:border-blue-500/30' },
                  { name: 'Microsoft', icon: '🟦', bg: 'hover:bg-cyan-500/10 hover:border-cyan-500/30' },
                  { name: 'Apple', icon: '⚫', bg: 'hover:bg-white/10 hover:border-white/30' },
                ].map((provider) => (
                  <button
                    key={provider.name}
                    type="button"
                    className={`p-3 rounded-xl border border-white/10 bg-white/[0.02] ${provider.bg}
                      transition-all duration-300 group`}
                    title={`Continuar con ${provider.name}`}
                  >
                    <span className="text-xl group-hover:scale-110 transition-transform inline-block">
                      {provider.icon}
                    </span>
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <span className="text-xs text-white/30 uppercase tracking-wider">o continúa con email</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>

              {/* Error */}
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-shake">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div className="relative">
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Correo electrónico
                  </label>
                  <div className={`relative rounded-xl transition-all duration-300 ${
                    focusedField === 'email' ? 'ring-2 ring-amber-500/50' : ''
                  }`}>
                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                      focusedField === 'email' ? 'text-amber-400' : 'text-white/30'
                    }`} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="tu@empresa.com"
                      className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/10 rounded-xl
                        text-white placeholder-white/30
                        focus:outline-none focus:bg-white/[0.05] focus:border-amber-500/50
                        transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="relative">
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Contraseña
                  </label>
                  <div className={`relative rounded-xl transition-all duration-300 ${
                    focusedField === 'password' ? 'ring-2 ring-amber-500/50' : ''
                  }`}>
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                      focusedField === 'password' ? 'text-amber-400' : 'text-white/30'
                    }`} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="••••••••••"
                      className="w-full pl-12 pr-12 py-4 bg-white/[0.03] border border-white/10 rounded-xl
                        text-white placeholder-white/30
                        focus:outline-none focus:bg-white/[0.05] focus:border-amber-500/50
                        transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Options row */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      rememberMe
                        ? 'bg-amber-500 border-amber-500'
                        : 'border-white/20 group-hover:border-white/40'
                    }`}>
                      {rememberMe && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only"
                    />
                    <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
                      Recordar dispositivo
                    </span>
                  </label>
                  <button type="button" className="text-sm text-amber-400 hover:text-amber-300 font-medium transition-colors">
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="relative w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl
                    hover:from-amber-400 hover:to-orange-400 transition-all duration-300
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center justify-center gap-2
                    shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02]
                    active:scale-[0.98] overflow-hidden group"
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent
                    translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Iniciando sesión...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      <span>Iniciar Sesión</span>
                    </>
                  )}
                </button>

                {/* Biometric hint */}
                <div className="flex items-center justify-center gap-2 text-white/30 text-sm">
                  <Fingerprint className="w-4 h-4" />
                  <span>Face ID / Touch ID disponible</span>
                </div>
              </form>

              {/* Register CTA */}
              <div className="mt-8 pt-6 border-t border-white/10 text-center">
                <p className="text-white/50 mb-4">
                  ¿Primera vez aquí?
                </p>
                <button
                  onClick={onSwitchToRegister}
                  className="w-full py-3.5 border border-white/10 text-white font-medium rounded-xl
                    hover:bg-white/[0.05] hover:border-white/20 transition-all
                    flex items-center justify-center gap-2 group"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Crear cuenta empresarial</span>
                  <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </button>
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-6 flex items-center justify-center gap-6 text-white/30 text-xs">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-4 h-4" />
              <span>2FA Enabled</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              <span>SOC 2 Type II</span>
            </div>
          </div>
        </div>
      </div>

      {/* Estilos de animación */}
      <style>{`
        @keyframes aurora1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(5%, 5%) rotate(5deg); }
          50% { transform: translate(-5%, 10%) rotate(-5deg); }
          75% { transform: translate(10%, -5%) rotate(3deg); }
        }

        @keyframes aurora2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(-10%, 5%) rotate(-5deg); }
          66% { transform: translate(5%, -10%) rotate(5deg); }
        }

        @keyframes aurora3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-5%, 5%) scale(1.1); }
        }

        @keyframes aurora4 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.2; }
          50% { transform: translate(5%, -5%) scale(0.9); opacity: 0.3; }
        }

        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, -30px); }
        }

        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-40px, 20px); }
        }

        @keyframes orbFloat3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.1); }
        }

        @keyframes float {
          0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) rotate(720deg); opacity: 0; }
        }

        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }

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
